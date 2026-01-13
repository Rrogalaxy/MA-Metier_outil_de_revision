import React, { useMemo, useState } from "react";
import type { BusySlot, Module, PlannedSession, Recall } from "./types";
import { mockBusyWeek } from "./data/mockSchedule";
import { estimateRetention, nextIntervalDays } from "./lib/spacedRepetition";
import { generateFreeSlots, planSessionsForDays } from "./lib/planner";
import { parseCpnvIcsToBusySlots } from "./lib/ics";

function formatDateISO(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Lundi de la semaine d’une date
function startOfWeekMonday(d: Date) {
    const copy = new Date(d);
    const day = copy.getDay(); // 0=dim, 1=lun...
    const diff = day === 0 ? -6 : 1 - day; // ramène au lundi
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function addDaysISO(dayISO: string, n: number) {
    const d = new Date(`${dayISO}T00:00:00`);
    d.setDate(d.getDate() + n);
    return formatDateISO(d);
}

function mergeModulesFromSchedule(prev: Module[], slots: BusySlot[], dayISO: string): Module[] {
    const titles = Array.from(
        new Set(
            slots
                .map((s) => (s.label ?? "").trim())
                .filter((t) => t.length > 0 && t.toLowerCase() !== "cours")
        )
    );

    const existing = new Set(prev.map((m) => m.title.trim().toLowerCase()));

    const created: Module[] = [];
    for (const title of titles) {
        if (existing.has(title.toLowerCase())) continue;

        created.push({
            id: crypto.randomUUID(),
            title,
            difficulty: "debutant",
            estMinutes: 20,
            startDateISO: `${dayISO}T00:00:00`,
            repetitionIndex: 0,
            nextReviewISO: `${dayISO}T17:00:00`,
            retention: 50,
        });
    }

    return [...created, ...prev];
}

export default function App() {
    // Semaine affichée (lundi)
    const [weekStartISO, setWeekStartISO] = useState<string>(() => "2026-01-12");

    // 5 jours ouvrables (lun–ven)
    const days = useMemo(() => [0, 1, 2, 3, 4].map((i) => addDaysISO(weekStartISO, i)), [weekStartISO]);

    // Référence "jour" (utile pour créer modules / dates)
    const day = weekStartISO;

    const [modules, setModules] = useState<Module[]>(() => [
        {
            id: crypto.randomUUID(),
            title: "Boucles JS",
            difficulty: "intermediaire",
            estMinutes: 25,
            startDateISO: "2026-01-12T00:00:00",
            repetitionIndex: 0,
            nextReviewISO: "2026-01-13T17:00:00",
            retention: 50,
        },
    ]);

    const [privateBusy] = useState<BusySlot[]>([
        { startISO: "2026-01-12T18:00:00", endISO: "2026-01-12T19:00:00", label: "Sport" },
    ]);

    const [schoolBusy, setSchoolBusy] = useState<BusySlot[]>(mockBusyWeek);

    const freeByDay = useMemo(() => {
        const map: Record<string, { startISO: string; endISO: string }[]> = {};
        for (const d of days) {
            map[d] = generateFreeSlots(d, schoolBusy, privateBusy);
        }
        return map;
    }, [days, schoolBusy, privateBusy]);

    const [sessions, setSessions] = useState<PlannedSession[]>([]);
    function generatePlan() {
        const planned = planSessionsForDays(days, modules, schoolBusy, privateBusy);
        setSessions(planned);
    }

    const [newModuleTitle, setNewModuleTitle] = useState("");
    const [newModuleDifficulty, setNewModuleDifficulty] = useState<Module["difficulty"]>("debutant");
    const [newModuleMinutes, setNewModuleMinutes] = useState<number>(20);


    function addModule() {
        const title = newModuleTitle.trim();
        if (!title) return; // évite d'ajouter un module vide

        // Optionnel (POC "intelligent") : ajuster le temps selon la difficulté
        const difficultyFactor =
            newModuleDifficulty === "avance" ? 1.3 :
                newModuleDifficulty === "intermediaire" ? 1.1 :
                    1.0;

        const minutes = Math.max(5, Math.round(newModuleMinutes * difficultyFactor));

        const now = `${day}T00:00:00`;
        const m: Module = {
            id: crypto.randomUUID(),
            title,
            difficulty: newModuleDifficulty,
            estMinutes: minutes,
            startDateISO: now,
            repetitionIndex: 0,
            nextReviewISO: `${day}T17:00:00`,
            retention: 50,
        };

        setModules(prev => [m, ...prev]);

        // Reset du formulaire
        setNewModuleTitle("");
        setNewModuleMinutes(20);
        setNewModuleDifficulty("debutant");
    }


    function recordQuiz(moduleId: string, recall: Recall) {
        setModules((prev) =>
            prev.map((m) => {
                if (m.id !== moduleId) return m;

                const daysToAdd = nextIntervalDays(m.repetitionIndex, recall);
                const next = new Date(`${day}T17:00:00`);
                next.setDate(next.getDate() + daysToAdd);

                const nextIndex = recall === "difficile" ? Math.max(0, m.repetitionIndex) : m.repetitionIndex + 1;

                return {
                    ...m,
                    repetitionIndex: nextIndex,
                    nextReviewISO: next.toISOString().slice(0, 19),
                    retention: estimateRetention(nextIndex),
                };
            })
        );
    }

    const sessionsThisWeek = useMemo(() => {
        const daySet = new Set(days);
        return sessions.filter(s => daySet.has(s.startISO.slice(0, 10)));
    }, [sessions, days]);

    const totalPlannedMinutes = useMemo(() => {
        return sessionsThisWeek.reduce((sum, s) => {
            const start = new Date(s.startISO).getTime();
            const end = new Date(s.endISO).getTime();
            return sum + Math.max(0, Math.round((end - start) / 60000));
        }, 0);
    }, [sessionsThisWeek]);

    const modulesAtRisk = useMemo(() => {
        // “à risque” = rétention basse OU révision en retard
        return [...modules]
            .map(m => ({
                m,
                overdue: m.nextReviewISO.slice(0, 10) < day,
            }))
            .sort((a, b) => {
                // priorité: en retard, puis rétention faible
                if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
                return a.m.retention - b.m.retention;
            })
            .slice(0, 8);
    }, [modules, day]);

    function retentionLabel(r: number) {
        if (r >= 80) return "Bon";
        if (r >= 60) return "Moyen";
        return "Faible";
    }


    return (
        <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            <h1 style={{ marginBottom: 6 }}>Révisions – Proof of Concept</h1>
            <p style={{ marginTop: 0, opacity: 0.75 }}>
                Semaine du <b>{weekStartISO}</b> • horaire importé (.ics) + indisponibilités privées • génération automatique
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* DASHBOARD */}
                <section style={card}>
                    <h2 style={h2}>Dashboard</h2>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <input
                            style={{ ...input, minWidth: 240 }}
                            placeholder="Nom du module (ex: Boucles JS)"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") addModule();
                            }}
                        />

                        <select
                            style={input}
                            value={newModuleDifficulty}
                            onChange={(e) => setNewModuleDifficulty(e.target.value as Module["difficulty"])}
                        >
                            <option value="debutant">Débutant</option>
                            <option value="intermediaire">Intermédiaire</option>
                            <option value="avance">Avancé</option>
                        </select>

                        <input
                            style={{ ...input, width: 110 }}
                            type="number"
                            min={5}
                            max={180}
                            value={newModuleMinutes}
                            onChange={(e) => setNewModuleMinutes(Number(e.target.value))}
                        />

                        <button onClick={addModule} style={btn}>+ Ajouter</button>
                        <button onClick={generatePlan} style={btnPrimary}>Générer planning</button>
                    </div>


                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                        <input
                            type="file"
                            accept=".ics,text/calendar"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const text = await file.text();
                                const slots = parseCpnvIcsToBusySlots(text);
                                setSchoolBusy(slots);
                                setModules((prev) => mergeModulesFromSchedule(prev, slots, weekStartISO));
                                e.currentTarget.value = "";
                            }}
                        />
                        <span style={muted}>Cours importés : {schoolBusy.length}</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                        <span style={muted}>Semaine (lundi) :</span>
                        <input
                            style={input}
                            type="date"
                            value={weekStartISO}
                            onChange={(e) => {
                                const chosen = new Date(`${e.target.value}T00:00:00`);
                                setWeekStartISO(formatDateISO(startOfWeekMonday(chosen)));
                            }}
                        />
                    </div>

                    <h3 style={h3}>Modules à risque (rétention basse)</h3>
                    {modules
                        .filter((m) => m.retention < 70)
                        .slice(0, 4)
                        .map((m) => (
                            <div key={m.id} style={row}>
                                <div>
                                    <b>{m.title}</b> <span style={pill}>{m.retention}%</span>
                                    <div style={muted}>Prochaine révision : {m.nextReviewISO.replace("T", " ")}</div>
                                </div>
                            </div>
                        ))}
                </section>

                <section style={card}>
                    <h2 style={h2}>Statistiques</h2>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <div style={statBox}>
                            <div style={statValue}>{modules.length}</div>
                            <div style={statLabel}>Modules</div>
                        </div>

                        <div style={statBox}>
                            <div style={statValue}>{sessionsThisWeek.length}</div>
                            <div style={statLabel}>Sessions planifiées</div>
                        </div>

                        <div style={statBox}>
                            <div style={statValue}>{totalPlannedMinutes} min</div>
                            <div style={statLabel}>Temps total (semaine)</div>
                        </div>
                    </div>

                    <h3 style={h3}>Modules à risque</h3>

                    {modulesAtRisk.length === 0 ? (
                        <div style={muted}>Aucun module.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {modulesAtRisk.map(({ m, overdue }) => (
                                <div key={m.id} style={{ ...riskRow, borderColor: overdue ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.12)" }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                            <b>{m.title}</b>
                                            <span style={pill}>{m.difficulty}</span>
                                            {overdue && <span style={pillWarning}>En retard</span>}
                                            <span style={pill}>{retentionLabel(m.retention)}</span>
                                        </div>

                                        <div style={{ marginTop: 6 }}>
                                            <div style={barTrack}>
                                                <div style={{ ...barFill, width: `${Math.max(0, Math.min(100, m.retention))}%` }} />
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                                                <span style={muted}>Rétention: {m.retention}%</span>
                                                <span style={muted}>Prochaine: {m.nextReviewISO.slice(0, 10)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        <button onClick={() => recordQuiz(m.id, "difficile")} style={btn}>
                                            Réviser vite
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>


                {/* CRENEAUX */}
                <section style={card}>
                    <h2 style={h2}>Créneaux disponibles</h2>
                    {days.map((d) => (
                        <div key={d} style={{ marginBottom: 10 }}>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>{d}</div>

                            {(freeByDay[d]?.length ?? 0) === 0 ? (
                                <div style={muted}>Aucun créneau libre.</div>
                            ) : (
                                freeByDay[d].map((s, i) => (
                                    <div key={i} style={row}>
                                        <div>
                                            <b>
                                                {s.startISO.slice(11, 16)} → {s.endISO.slice(11, 16)}
                                            </b>
                                            <div style={muted}>{d}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ))}
                </section>

                {/* PLANNING */}
                <section style={card}>
                    <h2 style={h2}>Planning généré</h2>
                    {sessions.length === 0 ? (
                        <div style={muted}>Clique “Générer planning”.</div>
                    ) : (
                        days.map((d) => {
                            const daySessions = sessions.filter((s) => s.startISO.slice(0, 10) === d);
                            return (
                                <div key={d} style={{ marginBottom: 10 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{d}</div>

                                    {daySessions.length === 0 ? (
                                        <div style={muted}>Aucune session planifiée.</div>
                                    ) : (
                                        daySessions.map((s) => {
                                            const m = modules.find((x) => x.id === s.moduleId);
                                            return (
                                                <div key={s.id} style={row}>
                                                    <div>
                                                        <b>{m?.title ?? "Module"}</b>
                                                        <div style={muted}>
                                                            {s.startISO.slice(11, 16)} → {s.endISO.slice(11, 16)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            );
                        })
                    )}
                </section>

                {/* REVISION */}
                <section style={card}>
                    <h2 style={h2}>Révision (mini-quiz)</h2>
                    <p style={muted}>
                        Tu choisis un module, tu “réponds” et tu auto-évalues. La prochaine révision est recalculée.
                    </p>

                    {modules.slice(0, 3).map((m) => (
                        <div key={m.id} style={{ ...row, alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                                <b>{m.title}</b> <span style={pill}>{m.difficulty}</span>
                                <div style={muted}>Prochaine révision : {m.nextReviewISO.replace("T", " ")}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button onClick={() => recordQuiz(m.id, "facile")} style={btn}>
                                    Facile
                                </button>
                                <button onClick={() => recordQuiz(m.id, "moyen")} style={btn}>
                                    Moyen
                                </button>
                                <button onClick={() => recordQuiz(m.id, "difficile")} style={btn}>
                                    Difficile
                                </button>
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
}

const card: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const row: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
};

const h2: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: React.CSSProperties = { margin: "14px 0 8px 0", fontSize: 14 };
const muted: React.CSSProperties = { opacity: 0.7, fontSize: 13 };
const pill: React.CSSProperties = {
    marginLeft: 6,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    fontSize: 12,
    opacity: 0.85,
};

const input: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const btn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
    ...btn,
    background: "black",
    color: "white",
    border: "1px solid black",
};
const statBox: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: 12,
    background: "white",
};

const statValue: React.CSSProperties = {
    fontSize: 22,
    fontWeight: 800,
    color: "#111",
};

const statLabel: React.CSSProperties = {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
};

const riskRow: React.CSSProperties = {
    display: "flex",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
};

const pillWarning: React.CSSProperties = {
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.25)",
    fontSize: 12,
    background: "rgba(0,0,0,0.06)",
};

const barTrack: React.CSSProperties = {
    height: 10,
    borderRadius: 999,
    background: "rgba(0,0,0,0.08)",
    overflow: "hidden",
};

const barFill: React.CSSProperties = {
    height: "100%",
    borderRadius: 999,
    background: "rgba(0,0,0,0.65)",
};
