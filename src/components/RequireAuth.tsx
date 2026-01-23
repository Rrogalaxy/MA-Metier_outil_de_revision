// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../services/http";

/**
 * Si pas de token => on redirige vers /login
 * location.state.from permet de revenir après login.
 */
export default function RequireAuth() {
    const token = getToken();
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <Outlet />;
}
