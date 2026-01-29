// src/pages/PlanningPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";

import { addMyActivity, deleteMyActivity, listMyActivities } from "../services/planning.service";
import { clearSchoolEvents, getSchoolEvents, importSchoolIcs } from "../services/schoolSchedule.service";

import type { Activity } from "../types";
import type { IcsEvent } from "../lib/ics";

/** ===== Types UI ===== */
type FormState = {
    nomActivite: string;
    date: string; // YYYY-MM-DD
    heureDebut: string; // HH:MM
    heureFin: string; // HH:MM
};

type BusySlot = {
    startISO: string; // YYYY-MM-DDTHH:mm:ss
    endISO: string;
    label?: string;
};

type FreeSlot = {
    startISO: string;
    endISO: string;
};

type CalendarBlock = {
    id: string;
    dayISO: string; // YYYY-MM-DD
    startMin: number;
    endMin: number;
    title: string;
    subtitle?: string;
    kind: "school" | "private" | "free";
    activityId?: number;
};

/** ===== Utils dates / heures ===== */

function toLocalISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function todayISO() {
    return toLocalISODate(new Date());
}

function isValidTime(t: string) {
    return /^\d{2}:\d{2}$/.test(t);
}

function timeHHMM(iso: string) {
    const timePart = iso.split("T")[1] ?? "00:00";
    return timePart.slice(0, 5);
}

function startOfWeekMonday(dayISO: string) {
    const d = new Date(`${dayISO}T00:00:00`);
    const day = d.getDay(); // 0=dim, 1=lun...
    const diffToMonday = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diffToMonday);
    d.setHours(0, 0, 0, 0);
    return toLocalISODate(d);
}

function addDaysISO(dayISO: string, n: number) {
    const d = new Date(`${dayISO}T00:00:00`);
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return toLocalISODate(d);
}

function minutesSinceMidnight(iso: string) {
    const timePart = iso.split("T")[1] ?? "00:00";
    const [hhStr, mmStr] = timePart.split(":");
    const hh = Number(hhStr ?? "0");
    const mm = Number(mmStr ?? "0");
    return hh * 60 + mm;
}

function minsToHHMM(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** ===== Conversion vers BusySlot ===== */
function toBusyFromIcs(events: IcsEvent[]): BusySlot[] {
    return events.map((e) => ({
        startISO: e.startISO,
        endISO: e.endISO,
        label: e.summary || "Cours",
    }));
}

function toBusyFromActivities(activities: Activity[]): BusySlot[] {
    return activities.map((a) => ({
        startISO: `${a.date}T${a.heureDebut}:00`,
        endISO: `${a.date}T${a.heureFin}:00`,
        label: a.nomActivite,
    }));
}

/** ===== Génération de créneaux libres ===== */
function generateFreeSlotsForDay(params: {
    dayISO: string;
    busy: BusySlot[];
    workingHours: { startHour: number; endHour: number };
    minMinutes: number;
}): FreeSlot[] {
    const { dayISO, busy, workingHours, minMinutes } = params;

    const busyOfDay = busy
        .filter((b) => b.startISO.slice(0, 10) === dayISO)
        .map((b) => ({
            start: Math.max(minutesSinceMidnight(b.startISO), workingHours.startHour * 60),
            end: Math.min(minutesSinceMidnight(b.endISO), workingHours.endHour * 60),
        }))
        .filter((b) => b.end > b.start)
        .sort((a, b) => a.start - b.start);

    // merge overlaps
    const merged: { start: number; end: number }[] = [];
    for (const b of busyOfDay) {
        const last = merged[merged.length - 1];
        if (!last || b.start > last.end) merged.push({ ...b });
        else last.end = Math.max(last.end, b.end);
    }

    const free: FreeSlot[] = [];
    let cursor = workingHours.startHour * 60;

    for (const b of merged) {
        if (b.start > cursor) {
            const dur = b.start - cursor;
            if (dur >= minMinutes) {
                free.push({
                    startISO: `${dayISO}T${minsToHHMM(cursor)}:00`,
                    endISO: `${dayISO}T${minsToHHMM(b.start)}:00`,
                });
            }
        }
        cursor = Math.max(cursor, b.end);
    }

    const endDay = workingHours.endHour * 60;
    if (cursor < endDay) {
        const dur = endDay - cursor;
        if (dur >= minMinutes) {
            free.push({
                startISO: `${dayISO}T${minsToHHMM(cursor)}:00`,
                endISO: `${dayISO}T${minsToHHMM(endDay)}:00`,
            });
        }
    }

    return free;
}

/** ===== Page ===== */
export default function PlanningPage() {
    const [items, setItems] = useState<Activity[]>([]);
    const [err, setErr] = useState<string | null>(null);

    const [schoolEvents, setSchoolEvents] = useState<IcsEvent[]>([]);
    const [icsErr, setIcsErr] = useState<string | null>(null);
    const [icsInfo, setIcsInfo] = useState<string | null>(null);

    const [formTouched, setFormTouched] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<FormState>({
        nomActivite: "",
        date: todayISO(),
        heureDebut: "18:00",
        heureFin: "19:00",
    });

    const [weekStartISO, setWeekStartISO] = useState(() => startOfWeekMonday(todayISO()));

    // ✅ Toujours 7 jours (Lun → Dim)
    const days = useMemo(
        () => [0, 1, 2, 3, 4, 5, 6].map((i) => addDaysISO(weekStartISO, i)),
        [weekStartISO]
    );

    async function reloadActivities() {
        setErr(null);
        try {
            const data = await listMyActivities();
            setItems(data);
        } catch {
            setErr("Impossible de charger le planning.");
        }
    }

    async function reloadSchool() {
        try {
            const ev = await getSchoolEvents();
            setSchoolEvents(ev);
        } catch {
            // non critique
        }
    }

    useEffect(() => {
        void reloadActivities();
        void reloadSchool();
    }, []);

    const busyAll: BusySlot[] = useMemo(() => {
        const schoolBusy = toBusyFromIcs(schoolEvents);
        const privateBusy = toBusyFromActivities(items);
        return [...schoolBusy, ...privateBusy];
    }, [schoolEvents, items]);

    const freeByDay: Record<string, FreeSlot[]> = useMemo(() => {
        const out: Record<string, FreeSlot[]> = {};
        for (const d of days) {
            out[d] = generateFreeSlotsForDay({
                dayISO: d,
                busy: busyAll,
                workingHours: { startHour: 8, endHour: 18 },
                minMinutes: 20,
            });
        }
        return out;
    }, [days, busyAll]);

    const blocksByDay: Record<string, CalendarBlock[]> = useMemo(() => {
        const out: Record<string, CalendarBlock[]> = {};
        for (const d of days) out[d] = [];

        // free blocks (fond)
        for (const d of days) {
            for (const f of freeByDay[d] ?? []) {
                out[d].push({
                    id: `free-${f.startISO}-${f.endISO}`,
                    dayISO: d,
                    startMin: minutesSinceMidnight(f.startISO),
                    endMin: minutesSinceMidnight(f.endISO),
                    title: "Libre",
                    kind: "free",
                });
            }
        }

        // school blocks
        for (const e of schoolEvents) {
            const d = e.startISO.slice(0, 10);
            if (!out[d]) continue;
            out[d].push({
                id: `school-${e.startISO}-${e.endISO}-${e.summary}`,
                dayISO: d,
                startMin: minutesSinceMidnight(e.startISO),
                endMin: minutesSinceMidnight(e.endISO),
                title: e.summary || "Cours",
                subtitle: e.location,
                kind: "school",
            });
        }

        // private blocks
        for (const a of items) {
            const d = a.date;
            if (!out[d]) continue;
            out[d].push({
                id: `priv-${a.numeroActivites}`,
                activityId: a.numeroActivites,
                dayISO: d,
                startMin: Number(a.heureDebut.slice(0, 2)) * 60 + Number(a.heureDebut.slice(3, 5)),
                endMin: Number(a.heureFin.slice(0, 2)) * 60 + Number(a.heureFin.slice(3, 5)),
                title: a.nomActivite,
                subtitle: "Privé",
                kind: "private",
            });
        }

        // tri : free derrière
        for (const d of days) {
            out[d].sort((a, b) => {
                const pri = (k: CalendarBlock["kind"]) => (k === "free" ? 0 : 1);
                const p = pri(a.kind) - pri(b.kind);
                if (p !== 0) return p;
                return a.startMin - b.startMin;
            });
        }

        return out;
    }, [days, freeByDay, schoolEvents, items]);

    const formError = useMemo(() => {
        if (form.nomActivite.trim().length < 2) return "Nom trop court (min 2 caractères).";
        if (!form.date) return "Date manquante.";
        if (!isValidTime(form.heureDebut) || !isValidTime(form.heureFin)) return "Heure invalide.";
        if (form.heureFin <= form.heureDebut) return "L’heure de fin doit être après l’heure de début.";
        return null;
    }, [form]);

    const canSubmit = formError === null;

    async function onAdd() {
        setFormTouched(true);
        setErr(null);

        if (formError) {
            setErr(formError);
            return;
        }

        setSaving(true);
        try {
            await addMyActivity({
                nomActivite: form.nomActivite.trim(),
                date: form.date,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
            });
            setForm((f) => ({ ...f, nomActivite: "" }));
            await reloadActivities();
        } catch {
            setErr("Erreur lors de l’ajout.");
        } finally {
            setSaving(false);
        }
    }

    async function onDelete(id: number) {
        setErr(null);
        try {
            await deleteMyActivity(id);
            await reloadActivities();
        } catch {
            setErr("Erreur lors de la suppression.");
        }
    }

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Planning</h2>
                    <div style={muted}>Semaine (Lun → Dim) • cours (.ics) + activités + créneaux libres</div>
                </div>
                <Link to="/" style={btnLink}>
                    ← Dashboard
                </Link>
            </div>

            <div style={weekBar}>
                <button style={btn} onClick={() => setWeekStartISO(addDaysISO(weekStartISO, -7))}>
                    ←
                </button>

                <div style={{ fontWeight: 900 }}>
                    Semaine du{" "}
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                        {weekStartISO}
                    </span>
                </div>

                <button style={btn} onClick={() => setWeekStartISO(addDaysISO(weekStartISO, 7))}>
                    →
                </button>

                <button style={btn} onClick={() => setWeekStartISO(startOfWeekMonday(todayISO()))}>
                    Aujourd’hui
                </button>

                <input
                    style={input}
                    type="date"
                    value={weekStartISO}
                    onChange={(e) => setWeekStartISO(startOfWeekMonday(e.target.value))}
                />
            </div>

            <div style={{ marginTop: 12 }}>
                <h3 style={h3}>Calendrier (semaine)</h3>

                {/* ✅ Calendrier semaine complet + scroll vertical pour les heures */}
                <WeekCalendar days={days} blocksByDay={blocksByDay} onDeleteActivity={onDelete} />
            </div>

            <div style={{ marginTop: 18 }}>
                <h3 style={h3}>Horaire scolaire (.ics)</h3>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                        type="file"
                        accept=".ics,text/calendar"
                        onChange={async (e) => {
                            setIcsErr(null);
                            setIcsInfo(null);

                            const file = e.target.files?.[0];
                            if (!file) return;

                            const nameOk = file.name.toLowerCase().endsWith(".ics");
                            if (!nameOk) {
                                setIcsErr("Fichier invalide. Sélectionne un fichier .ics.");
                                e.currentTarget.value = "";
                                return;
                            }

                            try {
                                const text = await file.text();
                                const ev = await importSchoolIcs(text);

                                if (!ev || ev.length === 0) {
                                    setIcsErr("Import OK, mais aucun événement détecté.");
                                    setSchoolEvents([]);
                                } else {
                                    setSchoolEvents(ev);
                                    setIcsInfo(`Import réussi : ${ev.length} cours détectés.`);
                                }
                            } catch {
                                setIcsErr("Impossible d’importer ce fichier .ics.");
                            } finally {
                                e.currentTarget.value = "";
                            }
                        }}
                    />

                    <button
                        style={btnDanger}
                        onClick={async () => {
                            await clearSchoolEvents();
                            setSchoolEvents([]);
                            setIcsErr(null);
                            setIcsInfo("Horaire effacé.");
                        }}
                    >
                        Effacer l’horaire
                    </button>

                    <span style={muted}>
                        Cours importés : <b>{schoolEvents.length}</b>
                    </span>
                </div>

                {icsErr && <div style={{ marginTop: 10, ...errorBox }}>{icsErr}</div>}
                {icsInfo && <div style={{ marginTop: 10, ...infoBox }}>{icsInfo}</div>}

                {schoolEvents.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {schoolEvents.slice(0, 5).map((c, i) => (
                            <div key={i} style={miniRow}>
                                <div
                                    style={{
                                        fontWeight: 900,
                                        maxWidth: 240,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {c.summary}
                                </div>
                                <div style={muted}>
                                    {c.startISO.slice(0, 10)} • {timeHHMM(c.startISO)} → {timeHHMM(c.endISO)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 18 }}>
                <h3 style={h3}>Ajouter une activité (privée)</h3>

                <div style={formGrid}>
                    <div style={field}>
                        <div style={label}>Nom</div>
                        <input
                            style={input}
                            placeholder="Ex: Sport, job, rendez-vous..."
                            value={form.nomActivite}
                            onChange={(e) => {
                                setFormTouched(true);
                                setForm((f) => ({ ...f, nomActivite: e.target.value }));
                            }}
                        />
                    </div>

                    <div style={field}>
                        <div style={label}>Date</div>
                        <input
                            style={input}
                            type="date"
                            value={form.date}
                            onChange={(e) => {
                                setFormTouched(true);
                                setForm((f) => ({ ...f, date: e.target.value }));
                            }}
                        />
                    </div>

                    <div style={field}>
                        <div style={label}>Début</div>
                        <input
                            style={input}
                            type="time"
                            value={form.heureDebut}
                            onChange={(e) => {
                                setFormTouched(true);
                                setForm((f) => ({ ...f, heureDebut: e.target.value }));
                            }}
                        />
                    </div>

                    <div style={field}>
                        <div style={label}>Fin</div>
                        <input
                            style={input}
                            type="time"
                            value={form.heureFin}
                            onChange={(e) => {
                                setFormTouched(true);
                                setForm((f) => ({ ...f, heureFin: e.target.value }));
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button style={btnPrimary} disabled={!canSubmit || saving} onClick={() => void onAdd()}>
                            {saving ? "Ajout…" : "Ajouter"}
                        </button>
                    </div>
                </div>

                {formTouched && formError && <div style={{ marginTop: 10, ...errorBox }}>{formError}</div>}
                {err && <div style={{ marginTop: 10, ...errorBox }}>{err}</div>}
            </div>
        </section>
    );
}

/** ===== Calendrier semaine =====
 * Objectif :
 * - Afficher la semaine entière (7 colonnes)
 * - Garder la même “taille visible” qu’avant (≈ 10h * 60px = 600px)
 * - Permettre de SCROLL verticalement pour voir jusqu’à 24:00
 */
function WeekCalendar(props: {
    days: string[];
    blocksByDay: Record<string, CalendarBlock[]>;
    onDeleteActivity: (id: number) => void;
}) {
    const { days, blocksByDay, onDeleteActivity } = props;

    // ✅ Affichage : même fenêtre visible qu'avant (8→18 = 10h)
    const visibleStartHour = 8;
    const visibleEndHour = 18;

    // ✅ Contenu scrollable : 8→24 pour pouvoir descendre jusqu’à fin de journée
    const startHour = 8;
    const endHour = 24;

    const hourCount = endHour - startHour;
    const pxPerHour = 60;
    const totalHeight = hourCount * pxPerHour;

    const hourLabels = Array.from({ length: hourCount + 1 }, (_, i) => startHour + i);

    function dayLabel(dISO: string) {
        const dt = new Date(`${dISO}T00:00:00`);
        const day = dt.getDay(); // 0=Dim, 1=Lun...
        const names: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 0: "Dim" };
        return `${names[day]} ${dISO.slice(8, 10)}`;
    }

    // ✅ Scroll : hauteur visible ~ celle d'avant (10h * 60px = 600px)
    const visibleHeight = (visibleEndHour - visibleStartHour) * pxPerHour; // 600

    return (
        <div style={calWrap}>
            {/* Header (fixe) */}
            <div style={calHeader}>
                <div style={timeColHeader} />
                {days.map((d) => (
                    <div key={d} style={dayHeaderCell}>
                        {dayLabel(d)}
                    </div>
                ))}
            </div>

            {/* Body (scroll vertical) */}
            <div style={{ ...calBodyScroll, maxHeight: visibleHeight }}>
                <div style={calBody}>
                    {/* Time column */}
                    <div style={{ ...timeCol, height: totalHeight }}>
                        {hourLabels.map((h) => (
                            <div key={h} style={{ ...timeLabel, height: pxPerHour }}>
                                {String(h).padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* Day columns (7 jours) */}
                    {days.map((d) => (
                        <div key={d} style={{ ...dayCol, height: totalHeight }}>
                            {/* hour grid */}
                            {Array.from({ length: hourCount }, (_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        top: i * pxPerHour,
                                        height: pxPerHour,
                                        borderTop: "1px solid rgba(0,0,0,0.06)",
                                    }}
                                />
                            ))}

                            {(blocksByDay[d] ?? []).map((b) => {
                                const start = Math.max(b.startMin, startHour * 60);
                                const end = Math.min(b.endMin, endHour * 60);
                                if (end <= start) return null;

                                const top = ((start - startHour * 60) / 60) * pxPerHour;
                                const height = ((end - start) / 60) * pxPerHour;

                                if (b.kind === "free") {
                                    return <div key={b.id} style={{ ...freeBlock, top, height }} />;
                                }

                                const style = b.kind === "school" ? schoolBlock : privateBlock;

                                return (
                                    <div key={b.id} style={{ ...style, top, height }}>
                                        <div style={blockTitle}>{b.title}</div>
                                        <div style={blockMeta}>
                                            {minsToHHMM(start)} → {minsToHHMM(end)}
                                        </div>
                                        {b.subtitle && <div style={blockSub}>{b.subtitle}</div>}

                                        {b.kind === "private" && typeof b.activityId === "number" && (
                                            <button
                                                style={miniDelete}
                                                onClick={() => onDeleteActivity(b.activityId as number)}
                                                title="Supprimer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** ===== Styles ===== */
const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
};

const topRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
};

const weekBar: CSSProperties = {
    marginTop: 10,
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    padding: 10,
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    background: "rgba(0,0,0,0.02)",
};

const h2: CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
};

const infoBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.02)",
    fontSize: 13,
};

const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
    gap: 10,
    alignItems: "end",
};

const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const label: CSSProperties = { ...muted, fontSize: 12 };

const input: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const btnLink: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};

const btn: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
};

const btnPrimary: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid black",
    background: "black",
    color: "white",
    cursor: "pointer",
};

const btnDanger: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
};

const miniRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
};

/* Calendar */
const calWrap: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    overflow: "hidden",
};

const calHeader: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "70px repeat(7, 1fr)", // ✅ 7 jours
    background: "rgba(0,0,0,0.03)",
    borderBottom: "1px solid rgba(0,0,0,0.10)",
};

const timeColHeader: CSSProperties = { height: 40 };

const dayHeaderCell: CSSProperties = {
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 13,
    borderLeft: "1px solid rgba(0,0,0,0.06)",
};

const calBodyScroll: CSSProperties = {
    overflowY: "auto", // ✅ scroll vertical (heures)
    overflowX: "hidden", // ✅ pas de scroll horizontal, on garde l'aspect "comme avant"
    background: "white",
};

const calBody: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "70px repeat(7, 1fr)", // ✅ 7 jours (même layout que le header)
};

const timeCol: CSSProperties = {
    position: "relative",
    background: "white",
    borderRight: "1px solid rgba(0,0,0,0.10)",
};

const timeLabel: CSSProperties = {
    fontSize: 12,
    opacity: 0.75,
    padding: "6px 8px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    boxSizing: "border-box",
};

const dayCol: CSSProperties = {
    position: "relative",
    background: "white",
    borderLeft: "1px solid rgba(0,0,0,0.06)",
};

const freeBlock: CSSProperties = {
    position: "absolute",
    left: 6,
    right: 6,
    borderRadius: 12,
    background: "rgba(0,0,0,0.03)",
    border: "1px dashed rgba(0,0,0,0.10)",
};

const schoolBlock: CSSProperties = {
    position: "absolute",
    left: 8,
    right: 8,
    borderRadius: 12,
    padding: 8,
    boxSizing: "border-box",
    background: "rgba(46, 204, 113, 0.18)",
    border: "1px solid rgba(46, 204, 113, 0.35)",
    color: "#111",
    overflow: "hidden",
};

const privateBlock: CSSProperties = {
    position: "absolute",
    left: 8,
    right: 8,
    borderRadius: 12,
    padding: 8,
    boxSizing: "border-box",
    background: "rgba(52, 152, 219, 0.16)",
    border: "1px solid rgba(52, 152, 219, 0.35)",
    color: "#111",
    overflow: "hidden",
};

const blockTitle: CSSProperties = {
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const blockMeta: CSSProperties = {
    fontSize: 12,
    opacity: 0.85,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};

const blockSub: CSSProperties = {
    fontSize: 11,
    opacity: 0.75,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
};

const miniDelete: CSSProperties = {
    position: "absolute",
    top: 6,
    right: 6,
    border: "none",
    background: "rgba(0,0,0,0.08)",
    borderRadius: 8,
    cursor: "pointer",
    padding: "2px 6px",
    fontSize: 12,
    lineHeight: 1,
};
