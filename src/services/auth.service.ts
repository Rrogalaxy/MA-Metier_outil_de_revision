// src/services/auth.service.ts
import { api, setToken } from "./http";
import { setMockUser } from "./mockSession";

/**
 * Token fake pour mode démo (quand backend KO)
 */
function setFakeAuth(email: string, first_name: string, last_name: string) {
    setToken("demo-token");
    setMockUser({ email, first_name, last_name });
}

export async function login(email: string, password: string) {
    try {
        // Backend normal
        const res = await api.post<{ token: string; type: string }>("/api/login", { email, password });
        setToken(res.token);
        return res;
    } catch {
        // Fallback démo
        setFakeAuth(email.trim().toLowerCase(), "Démo", "User");
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
        const res = await api.post<{ token: string; type: string }>("/api/register", payload);
        setToken(res.token);
        return res;
    } catch {
        // Fallback démo
        setFakeAuth(
            payload.email.trim().toLowerCase(),
            payload.first_name.trim() || "Démo",
            payload.last_name.trim() || "User"
        );
        return { token: "demo-token", type: "demo" };
    }
}

export function logoutLocal() {
    setToken(null);
    // On supprime aussi l’utilisateur mock
    localStorage.removeItem("cpnv_mock_user");
}
