// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutLocal } from "../services/auth.service";
import { getMeSmart, type ApiUser } from "../services/user.service";
import { getLocalUserClass } from "../services/classLocal.service";

export default function DashboardPage() {
    const [user, setUser] = useState<ApiUser | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const me = await getMeSmart();
                setUser(me);
            } catch {
                setErr("Impossible de charger l’utilisateur");
            }
        })();
    }, []);

    const localClass = useMemo(() => {
        if (!user?.email) return null;
        return getLocalUserClass(user.email);
    }, [user?.email]);

    function onLogout() {
        logoutLocal();
        navigate("/login", { replace: true });
    }

    return (
        <section style={card}>
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

            {user && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 900 }}>
                        {user.first_name} {user.last_name}
                    </div>
                    <div style={muted}>{user.email}</div>
                </div>
            )}

            <div style={{ marginBottom: 14, ...muted }}>
                Classe :{" "}
                <b>
                    {localClass ? `${localClass.class_id} (${localClass.class_year})` : "Non définie"}
                </b>
            </div>

            {err && <div style={errorBox}>{err}</div>}

            <div style={grid}>
                <Link to="/modules" style={cardLink}>📚 Modules</Link>
                <Link to="/planning" style={cardLink}>🗓️ Planning</Link>
                <Link to="/stats" style={cardLink}>📊 Statistiques</Link>
            </div>
        </section>
    );
}

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

const h2: CSSProperties = { margin: 0, fontSize: 18 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

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
