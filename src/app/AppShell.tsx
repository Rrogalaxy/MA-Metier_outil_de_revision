// src/app/AppShell.tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logoutLocal } from "../services/auth.service";

import { getMeSmart } from "../services/user.service";
import { listSharedModules, listMyModules } from "../services/modules.service";
import { listMyResults } from "../services/quiz.service";
import { listMyActivities } from "../services/planning.service";
import { getSchoolEvents } from "../services/schoolSchedule.service";
import { listClassesSmart } from "../services/class.service";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: "8px 10px",
    borderRadius: 10,
    textDecoration: "none",
    border: "1px solid rgba(0,0,0,0.12)",
    color: "#111",
    background: isActive ? "rgba(0,0,0,0.08)" : "white",
});

export default function AppShell() {
    const navigate = useNavigate();

    function onLogout() {
        logoutLocal();
        navigate("/login", { replace: true });
    }

    // Préchargement pour navigation fluide
    useEffect(() => {
        (async () => {
            try {
                await getMeSmart();
                await Promise.allSettled([
                    listSharedModules(),
                    listMyModules(),
                    listMyResults(),
                    listMyActivities(),
                    getSchoolEvents(),
                    listClassesSmart(),
                ]);
            } catch {
                /* ignore */
            }
        })();
    }, []);

    return (
        // 🔥 CENTRAGE TOTAL (horizontal + vertical)
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",   // vertical
                justifyContent: "center", // horizontal
                padding: 24,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 1100,
                    fontFamily: "system-ui",
                }}
            >
                <header
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                        marginBottom: 16,
                    }}
                >
                    <Link to="/" style={{ textDecoration: "none", color: "#111" }}>
                        <h1 style={{ margin: 0, fontSize: 22 }}>Révisions</h1>
                    </Link>

                    <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <NavLink to="/" end style={navLinkStyle}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/modules" style={navLinkStyle}>
                            Modules
                        </NavLink>
                        <NavLink to="/planning" style={navLinkStyle}>
                            Planning
                        </NavLink>
                        <NavLink to="/stats" style={navLinkStyle}>
                            Stats
                        </NavLink>
                        <NavLink to="/choose-class" style={navLinkStyle}>
                            Classe
                        </NavLink>

                        <button
                            onClick={onLogout}
                            style={{
                                padding: "8px 10px",
                                borderRadius: 10,
                                border: "1px solid rgba(0,0,0,0.12)",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            Logout
                        </button>
                    </nav>
                </header>

                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
