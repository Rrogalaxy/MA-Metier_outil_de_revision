// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutLocal } from "../services/auth.service";
import { getMeSmart, type ApiUser } from "../services/user.service";
import { getLocalUserClass } from "../services/classLocal.service";
import { getMockUser } from "../services/mockSession";

export default function DashboardPage() {
    // ✅ init immédiat si on a un mockUser en localStorage (démo / backend KO)
    const [user, setUser] = useState<ApiUser | null>(() => {
        const mu = getMockUser();
        if (!mu) return null;
        return {
            email: mu.email,
            first_name: mu.first_name,
            last_name: mu.last_name,
            class_id: null,
            class_year: null,
        };
    });

    // ✅ loading seulement si on n'a encore rien
    const [loading, setLoading] = useState(() => user === null);
    const [err, setErr] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        let alive = true;

        async function load() {
            const shouldShowLoading = user === null;
            if (shouldShowLoading) setLoading(true);

            setErr(null);

            try {
                const me = await getMeSmart(); // backend si OK sinon mock
                if (!alive) return;
                setUser(me);
            } catch {
                if (!alive) return;

                // erreur seulement si on n'a pas déjà un user affichable
                if (user === null) setErr("Impossible de charger l’utilisateur");
            } finally {
                if (!alive) return;
                if (shouldShowLoading) setLoading(false);
            }
        }

        void load();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {/* ✅ erreur seulement si pas d'utilisateur */}
            {err && !user && <div style={errorBox}>{err}</div>}

            {loading ? (
                <div style={{ marginTop: 8, ...muted }}>Chargement…</div>
            ) : (
                <>
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
                            {localClass
                                ? `${localClass.class_id} (${localClass.class_year})`
                                : "Non définie"}
                        </b>
                    </div>

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
                </>
            )}
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
