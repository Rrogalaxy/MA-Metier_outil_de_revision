// src/services/auth.service.ts
import { api, setToken } from "./http";
//import { clearMockUser, setMockUser } from "./mockSession";

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

/**
 * Mode démo (fallback)
 * - met un token "demo-token" pour passer RequireAuth
 * - stocke l’utilisateur mock (user.service.ts lira getMockUser())
 */

/*
function setFakeAuth(email: string, first_name: string, last_name: string) {
    setToken("demo-token");
    setMockUser({ email: normalizeEmail(email), first_name, last_name });
}*/

export async function login(email: string, password: string) {
    try {
        const payload = {
            email: normalizeEmail(email),
            password,
        };

        console.group("LOGIN → REQUEST");
        console.log("URL:", "/api/login");
        console.log("Body (json):", payload);
        console.groupEnd();

        const data = await api.post<{ token: string; type?: string }>("/api/login", payload);

        console.group("LOGIN ← RESPONSE");
        console.log("Response data:", data);
        console.groupEnd();

        setToken(data.token);
        return { token: data.token, type: data.type ?? "backend" };
    } catch (error) {
        console.error("Login failed:", error);
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
        const data = await api.post<{ token: string; type?: string }>("/api/register", {
            ...payload,
            email: normalizeEmail(payload.email),
            first_name: payload.first_name.trim(),
            last_name: payload.last_name.trim(),
        });

        setToken(data.token);

        return { token: data.token, type: data.type ?? "backend" };
    } catch (error) {
        console.error("Register failed:", error);
        /*setFakeAuth(
            payload.email,
            payload.first_name.trim() || "Démo",
            payload.last_name.trim() || "User"
        );*/
        return { token: "demo-token", type: "demo" };
    }
}

export function logoutLocal() {
    setToken(null);
    //clearMockUser();
}
