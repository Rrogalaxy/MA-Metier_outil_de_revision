import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { addMyActivity, deleteMyActivity, listMyActivities } from "../services/planning.service";
import type { Activity } from "../types";

type FormState = {
    nomActivite: string;
    date: string;       // YYYY-MM-DD
    heureDebut: string; // HH:MM
    heureFin: string;   // HH:MM
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function isValidTime(t: string) {
    return /^\d{2}:\d{2}$/.test(t);
}

export default function PlanningPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Activity[]>([]);
    const [err, setErr] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({
        nomActivite: "",
        date: todayISO(),
        heureDebut: "18:00",
        heureFin: "19:00",
    });

    async function reload() {
        setLoading(true);
        setErr(null);
        try {
            const data = await listMyActivities();
            setItems(data);
        } catch {
            setErr("Impossible de charger le planning.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void reload();
    }, []);

    const grouped = useMemo(() => {
        const map = new Map<string, Activity[]>();
        for (const a of items) {
            if (!map.has(a.date)) map.set(a.date, []);
            map.get(a.date)!.push(a);
        }
        // tri par date puis heure
        for (const [d, arr] of map.entries()) {
            arr.sort((x, y) => x.heureDebut.localeCompare(y.heureDebut));
            map.set(d, arr);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [items]);

    const canSubmit = useMemo(() => {
        if (form.nomActivite.trim().length < 2) return false;
        if (!form.date) return false;
        if (!isValidTime(form.heureDebut) || !isValidTime(form.heureFin)) return false;
        return form.heureDebut < form.heureFin;
    }, [form]);

    async function onAdd() {
        if (!canSubmit) return;

        setSaving(true);
        setErr(null);

        try {
            await addMyActivity({
                nomActivite: form.nomActivite.trim(),
                date: form.date,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
            });

            setForm(f => ({ ...f, nomActivite: "" }));
            await reload();
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
            await reload();
        } catch {
            setErr("Erreur lors de la suppression.");
        }
    }

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Planning</h2>
                    <div style={muted}>Activités personnelles (MCD : Activites / Agender)</div>
                </div>
                <Link to="/dashboard" style={btnLink}>← Dashboard</Link>
            </div>

            {/* Formulaire */}
            <div style={{ marginTop: 14 }}>
                <h3 style={h3}>Ajouter une activité</h3>

                <div style={formGrid}>
                    <div style={field}>
                        <div style={label}>Nom</div>
                        <input
                            style={input}
                            placeholder="Ex: Sport, job, rendez-vous..."
                            value={form.nomActivite}
                            onChange={(e) => setForm(f => ({ ...f, nomActivite: e.target.value }))}
                        />
                    </div>

                    <div style={field}>
                        <div style={label}>Date</div>
                        <input
                            style={input}
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                        />
                    </div>

                    <div style={field}>
                        <div style={label}>Début</div>
                        <input
                            style={input}
                            type="time"
                            value={form.heureDebut}
                            onChange={(e) => setForm(f => ({ ...f, heureDebut: e.target.value }))}
                        />
                    </div>

                    <div style={field}>
                        <div style={label}>Fin</div>
                        <input
                            style={input}
                            type="time"
                            value={form.heureFin}
                            onChange={(e) => setForm(f => ({ ...f, heureFin: e.target.value }))}
                        />
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button style={btnPrimary} disabled={!canSubmit || saving} onClick={() => void onAdd()}>
                            {saving ? "Ajout…" : "Ajouter"}
                        </button>
                    </div>
                </div>

                {!canSubmit && (
                    <div style={{ marginTop: 8, ...muted }}>
                        Astuce : un nom (≥ 2 caractères) + une heure de fin après l’heure de début.
                    </div>
                )}

                {err && <div style={{ marginTop: 10, ...errorBox }}>{err}</div>}
            </div>

            {/* Liste */}
            <div style={{ marginTop: 18 }}>
                <h3 style={h3}>Mes activités</h3>

                {loading ? (
                    <div style={muted}>Chargement…</div>
                ) : grouped.length === 0 ? (
                    <div style={muted}>Aucune activité enregistrée.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {grouped.map(([date, arr]) => (
                            <div key={date} style={dayCard}>
                                <div style={dayHeader}>
                                    <div style={{ fontWeight: 900 }}>{date}</div>
                                    <div style={muted}>{arr[0]?.jour ?? ""}</div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {arr.map((a) => (
                                        <div key={a.numeroActivites} style={row}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800 }}>{a.nomActivite}</div>
                                                <div style={muted}>
                                                    {a.heureDebut} → {a.heureFin}
                                                </div>
                                            </div>

                                            <button style={btnDanger} onClick={() => void onDelete(a.numeroActivites)}>
                                                Supprimer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 14, ...note }}>
                Cette page permet de gérer les <b>disponibilités privées</b>. Plus tard, ces activités seront combinées avec l’horaire
                scolaire importé (.ics) pour calculer automatiquement les créneaux de révision.
            </div>
        </section>
    );
}

/* =======================
   STYLES
   ======================= */

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

const h2: CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const note: CSSProperties = {
    border: "1px dashed rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    opacity: 0.9,
    background: "rgba(0,0,0,0.03)",
};

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
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

const dayCard: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "white",
};

const dayHeader: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "baseline",
    marginBottom: 8,
};

const row: CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
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
