// src/services/auth.service.ts
import { api, setToken } from "./http";

/**
 * Réponse standard attendue du backend Laravel
 * (login / register)
 */
type AuthResponse = {
    token: string;
    type: string; // ex: "Bearer"
};

/**
 * Connexion utilisateur
 * POST /api/login
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
    try {
        const res = await api.post<AuthResponse>("/api/login", {
            email,
            password,
        });

        setToken(res.token);
        return res;
    } catch (e) {
        throw normalizeAuthError(e);
    }
}

/**
 * Inscription utilisateur
 * POST /api/register
 */
export async function register(payload: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
}): Promise<AuthResponse> {
    try {
        const res = await api.post<AuthResponse>("/api/register", payload);

        setToken(res.token);
        return res;
    } catch (e) {
        throw normalizeAuthError(e);
    }
}

/**
 * Déconnexion locale (frontend only)
 */
export function logoutLocal() {
    setToken(null);
}

/* =====================================================
   Utils
   ===================================================== */

/**
 * Normalise les erreurs Laravel pour l’UI
 */
function normalizeAuthError(error: unknown): Error {
    if (error instanceof Error) {
        // Laravel renvoie souvent un JSON détaillé
        // via ton http.ts → Error("HTTP xxx - {...}")
        return error;
    }

    return new Error("Erreur d’authentification");
}
