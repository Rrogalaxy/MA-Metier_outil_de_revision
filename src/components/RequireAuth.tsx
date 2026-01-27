// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../services/http";

/**
 * Garde-fou d'auth.
 *
 * - En PROD : exige un token (Bearer) dans localStorage.
 * - En DEV  : si VITE_DEV_BYPASS_AUTH=true, on laisse passer.
 *
 * Notes:
 * - Vite expose les env en string ("true"/"false").
 * - On mémorise l'URL complète demandée (pathname + search + hash)
 *   pour rediriger correctement après login.
 */
export default function RequireAuth() {
    const location = useLocation();

    // ✅ bypass dev (pratique pour avancer même si backend auth pas prêt)
    const bypass = import.meta.env.VITE_DEV_BYPASS_AUTH === "true";
    if (bypass) return <Outlet />;

    // ✅ token centralisé (même clé que http.ts)
    const token = getToken();
    if (token) return <Outlet />;

    // ✅ url complète (sinon on perd ?x=... ou #...)
    const from = `${location.pathname}${location.search}${location.hash}`;

    // Redirige vers /login en mémorisant la page demandée
    return <Navigate to="/login" replace state={{ from }} />;
}
