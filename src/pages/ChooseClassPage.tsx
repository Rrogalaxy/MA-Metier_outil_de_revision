// src/pages/ChooseClassPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listClassesSmart, type StudentClass } from "../services/class.service";
import { getMeSmart, getLocalClass, updateMyClass } from "../services/user.service";

export default function ChooseClassPage() {
    const [classes, setClasses] = useState<StudentClass[]>([]);
    const [selected, setSelected] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const navigate = useNavigate();

    const selectedObj = useMemo(() => {
        if (!selected) return null;
        const [class_id, class_year] = selected.split("|");
        return { class_id, class_year };
    }, [selected]);

    useEffect(() => {
        let alive = true;

        async function load() {
            setErr(null);
            setInfo(null);
            setLoading(true);

            try {
                const me = await getMeSmart(); // backend si OK sinon mock
                const cls = await listClassesSmart(); // backend si OK sinon mock
                if (!alive) return;

                setClasses(cls);

                const local = getLocalClass(me.email);
                if (local) {
                    setSelected(`${local.class_id}|${local.class_year}`);
                    setInfo(`Classe actuelle : ${local.class_id} (${local.class_year})`);
                }

                setLoading(false);
            } catch (e) {
                if (!alive) return;
                setErr(e instanceof Error ? e.message : "Impossible de charger les classes");
                setLoading(false);
            }
        }

        void load();
        return () => {
            alive = false;
        };
    }, []);

    async function onSave() {
        setErr(null);
        setInfo(null);

        if (!selectedObj) {
            setErr("Sélectionne une classe.");
            return;
        }

        setSaving(true);
        try {
            await updateMyClass({
                class_id: selectedObj.class_id,
                class_year: selectedObj.class_year,
            });

            setInfo("Classe enregistrée ✅");
            navigate("/", { replace: true });
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Erreur lors de l’enregistrement");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Choisir sa classe</h2>
                    <div style={muted}>Obligatoire pour finaliser ton profil</div>
                </div>
                <Link to="/" style={btnLink}>
                    ← Dashboard
                </Link>
            </div>

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    <div style={label}>Classe</div>

                    <select style={input} value={selected} onChange={(e) => setSelected(e.target.value)}>
                        <option value="">— Sélectionner —</option>
                        {classes.map((c, i) => (
                            <option
                                key={`${c.class_id}-${c.class_year}-${i}`}
                                value={`${c.class_id}|${c.class_year}`}
                            >
                                {c.class_id} ({c.class_year})
                            </option>
                        ))}
                    </select>

                    <button style={btnPrimary} disabled={saving || !selected} onClick={() => void onSave()}>
                        {saving ? "Enregistrement…" : "Enregistrer"}
                    </button>

                    {err && <div style={errorBox}>{err}</div>}
                    {info && <div style={infoBox}>{info}</div>}
                </div>
            )}
        </section>
    );
}

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
    maxWidth: 520,
    margin: "0 auto",
};

const topRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
};

const h2: CSSProperties = { margin: 0, fontSize: 18 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };
const label: CSSProperties = { opacity: 0.75, fontSize: 12 };

const input: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const btnPrimary: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid black",
    background: "black",
    color: "white",
    cursor: "pointer",
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
