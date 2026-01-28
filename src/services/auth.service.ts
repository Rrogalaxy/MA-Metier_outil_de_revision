// src/services/auth.service.ts
import { api, setToken } from "./http";
import { clearMockUser, setMockUser } from "./mockSession";

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

/**
 * Mode démo (fallback)
 * - met un token "demo-token" pour passer RequireAuth
 * - stocke l’utilisateur mock (user.service.ts lira getMockUser())
 */
function setFakeAuth(email: string, first_name: string, last_name: string) {
    setToken("demo-token");
    setMockUser({ email: normalizeEmail(email), first_name, last_name });
}

export async function login(email: string, password: string) {
    try {
        const res = await api.post<{ token: string; type?: string }>("/api/login", {
            email,
            password,
        });
        setToken(res.token);
        return { token: res.token, type: res.type ?? "backend" };
    } catch {
        setFakeAuth(email, "Démo", "User");
        return { token: "demo-token", type: "demo" };
    }
}

export async function register(payload: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
}) {
    try {
        const res = await api.post<{ token: string; type?: string }>("/api/register", payload);
        setToken(res.token);
        return { token: res.token, type: res.type ?? "backend" };
    } catch {
        setFakeAuth(
            payload.email,
            payload.first_name.trim() || "Démo",
            payload.last_name.trim() || "User"
        );
        return { token: "demo-token", type: "demo" };
    }
}

export function logoutLocal() {
    setToken(null);
    clearMockUser();
}
