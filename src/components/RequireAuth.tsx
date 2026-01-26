// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Garde-fou d'auth.
 *
 * En PROD : exige un token dans localStorage.
 * En DEV : si VITE_DEV_BYPASS_AUTH=true, on laisse passer.
 */
export default function RequireAuth() {
    const location = useLocation();

    // Vite expose les env en string ("true"/"false")
    const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
    if (bypass) return <Outlet />;

    const token = localStorage.getItem("auth_token");
    if (token) return <Outlet />;

    // Redirige vers /login en mémorisant la page demandée
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
