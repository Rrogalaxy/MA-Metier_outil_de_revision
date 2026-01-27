// src/app/AppShell.tsx
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getMeApi, getLocalClass } from "../services/user.service";

// Style NavLink (actif / inactif)
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
    const location = useLocation();

    // petit état pour éviter de spammer la redirection pendant le chargement
    const [classChecked, setClassChecked] = useState(false);

    useEffect(() => {
        (async () => {
            // Pages où on ne force jamais le choix de classe
            // (normalement AppShell n'est pas utilisé sur /login /register,
            // mais ça sécurise si la config router change)
            const path = location.pathname;
            const allowList = ["/login", "/register", "/choose-class"];
            if (allowList.includes(path)) {
                setClassChecked(true);
                return;
            }

            // Si pas de token, RequireAuth gère déjà. On ne fait rien ici.
            const token = localStorage.getItem("auth_token");
            if (!token) {
                setClassChecked(true);
                return;
            }

            try {
                // On récupère l'email depuis l'API (auth:sanctum Bearer)
                const me = await getMeApi();

                // On vérifie la classe en localStorage
                const cls = getLocalClass(me.email);

                if (!cls) {
                    // pas de classe → redirection vers la page
                    navigate("/choose-class", { replace: true });
                    return;
                }
            } catch {
                // Si /api/user échoue, RequireAuth/login va le gérer côté UX.
                // Ici on évite juste de bloquer l'app.
            } finally {
                setClassChecked(true);
            }
        })();
    }, [location.pathname, navigate]);

    return (
        <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>
            {/* HEADER */}
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

                    {/* ✅ Pratique pour accéder rapidement */}
                    <NavLink to="/choose-class" style={navLinkStyle}>
                        Classe
                    </NavLink>
                </nav>
            </header>

            {/* MAIN */}
            <main style={{ marginTop: 16 }}>
                {/* Optionnel : si tu veux éviter un flash, tu peux afficher un mini “Chargement…” */}
                {!classChecked ? (
                    <div style={{ opacity: 0.75, fontSize: 13 }}>Vérification du profil…</div>
                ) : (
                    <Outlet />
                )}
            </main>
        </div>
    );
}
