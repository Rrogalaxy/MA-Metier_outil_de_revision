import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyModules } from "../services/modules.service";
import type { UserModule } from "../types";

export default function ModulesPage() {
    const [myModules, setMyModules] = useState<UserModule[]>([]);

    useEffect(() => {
        listMyModules().then(setMyModules);
    }, []);

    return (
        <section style={card}>
            <h2 style={h2}>Mes modules</h2>

            {myModules.length === 0 ? (
                <div style={muted}>Aucun module (mock) pour le moment.</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {myModules.map((m) => (
                        <Link key={m.moduleNom} to={`/modules/${encodeURIComponent(m.moduleNom)}`} style={tile}>
                            <div style={{ fontWeight: 800 }}>{m.moduleNom}</div>
                            <div style={muted}>Difficulté: {m.difficulte}</div>
                            <div style={muted}>Prochaine alerte: {m.prochaineAlerte ?? "—"}</div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}

const card: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" };
const h2: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const muted: React.CSSProperties = { opacity: 0.75, fontSize: 13 };
const tile: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 12,
    textDecoration: "none",
    color: "#111",
    background: "white",
};
