// src/app/AppShell.tsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutLocal } from "../services/auth.service";

// ✅ Prefetch (cache warmup)
import { listMyModules } from "../services/modules.service";
import { listMyResults } from "../services/quiz.service";
import { listMyActivities } from "../services/planning.service";
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

    return (
        <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <Link to="/" style={{ textDecoration: "none", color: "#111" }}>
                    <h1 style={{ margin: 0, fontSize: 22 }}>Révisions</h1>
                </Link>

                <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <NavLink to="/" end style={navLinkStyle}>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/modules"
                        style={navLinkStyle}
                        onMouseEnter={() => { void listMyModules(); }}
                        onFocus={() => { void listMyModules(); }}
                    >
                        Modules
                    </NavLink>

                    <NavLink
                        to="/planning"
                        style={navLinkStyle}
                        onMouseEnter={() => { void listMyActivities(); }}
                        onFocus={() => { void listMyActivities(); }}
                    >
                        Planning
                    </NavLink>

                    <NavLink
                        to="/stats"
                        style={navLinkStyle}
                        onMouseEnter={() => { void listMyResults(); }}
                        onFocus={() => { void listMyResults(); }}
                    >
                        Stats
                    </NavLink>

                    <NavLink
                        to="/choose-class"
                        style={navLinkStyle}
                        onMouseEnter={() => { void listClassesSmart(); }}
                        onFocus={() => { void listClassesSmart(); }}
                    >
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

            <main style={{ marginTop: 16 }}>
                <Outlet />
            </main>
        </div>
    );
}
