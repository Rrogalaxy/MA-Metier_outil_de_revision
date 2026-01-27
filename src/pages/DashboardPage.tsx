// src/pages/DashboardPage.tsx
import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe } from "../services/user.service";
import { logoutLocal } from "../services/auth.service";
import { getLocalUserClass, type LocalUserClass } from "../services/classLocal.service";
import type { User } from "../types";

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [localClass, setLocalClass] = useState<LocalUserClass | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            try {
                const me = await getMe(); // { mail, prenom, nom } selon ton mapping
                setUser(me);

                // ✅ classe stockée localement (tant que backend pas prêt)
                const cls = getLocalUserClass(me.mail);
                setLocalClass(cls);
            } catch {
                setErr("Impossible de charger l’utilisateur (non connecté ?)");
            }
        }
        void load();
    }, []);

    function onLogout() {
        logoutLocal(); // supprime le token
        navigate("/login", { replace: true });
    }

    return (
        <section style={card}>
            {/* Header */}
            <div style={topRow}>
                <h2 style={h2}>Dashboard</h2>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Link to="/choose-class" style={btnLink}>
                        Choisir ma classe
                    </Link>

                    <button style={btn} onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Utilisateur */}
            {user && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 900 }}>
                        {user.prenom} {user.nom}
                    </div>
                    <div style={muted}>{user.mail}</div>
                </div>
            )}

            {/* Classe (local) */}
            <div style={{ marginBottom: 14, ...muted }}>
                Classe :{" "}
                <b>{localClass ? `${localClass.class_id} (${localClass.class_year})` : "Non définie"}</b>
            </div>

            {err && <div style={errorBox}>{err}</div>}

            {/* Navigation */}
            <div style={grid}>
                <Link to="/modules" style={cardLink}>
                    📚 Modules
                </Link>

                <Link to="/planning" style={cardLink}>
                    🗓️ Planning
                </Link>

                <Link to="/stats" style={cardLink}>
                    📊 Statistiques
                </Link>
            </div>
        </section>
    );
}

/* =======================
   Styles
   ======================= */

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 16,
    background: "white",
};

const topRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
    flexWrap: "wrap",
};

const h2: CSSProperties = {
    margin: 0,
    fontSize: 18,
};

const muted: CSSProperties = {
    opacity: 0.75,
    fontSize: 13,
};

const errorBox: CSSProperties = {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    background: "rgba(0,0,0,0.05)",
    fontSize: 13,
};

const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
};

const cardLink: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    textDecoration: "none",
    color: "#111",
    fontWeight: 700,
};

const btn: CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    cursor: "pointer",
};

const btnLink: CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};
