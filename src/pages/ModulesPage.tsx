// src/pages/ModulesPage.tsx
import React, { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { listMyModules } from "../services/modules.service";
import type { UserModule } from "../types";

export default function ModulesPage() {
    const [myModules, setMyModules] = useState<UserModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            setErr(null);
            try {
                const data = await listMyModules();
                if (!mounted) return;
                setMyModules(data);
            } catch (e) {
                if (!mounted) return;
                setErr(e instanceof Error ? e.message : "Impossible de charger les modules.");
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Mes modules</h2>
                    <div style={muted}>Liste des modules liés à ton profil (mock pour le moment)</div>
                </div>
                <Link to="/" style={btnLink}>← Dashboard</Link>
            </div>

            {err && <div style={{ marginTop: 12, ...errorBox }}>{err}</div>}

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : myModules.length === 0 ? (
                <div style={{ marginTop: 12, ...muted }}>Aucun module pour le moment.</div>
            ) : (
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {myModules.map((m) => (
                        <Link
                            key={m.moduleNom}
                            to={`/modules/${encodeURIComponent(m.moduleNom)}`}
                            style={tile}
                        >
                            <div style={{ fontWeight: 900 }}>{m.moduleNom}</div>
                            <div style={muted}>Difficulté: {m.difficulte}</div>
                            <div style={muted}>Prochaine alerte: {m.prochaineAlerte ?? "—"}</div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
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

const h2: CSSProperties = {
    margin: "0 0 10px 0",
    fontSize: 18,
};

const muted: CSSProperties = {
    opacity: 0.75,
    fontSize: 13,
};

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
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

const tile: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 12,
    textDecoration: "none",
    color: "#111",
    background: "white",
};
