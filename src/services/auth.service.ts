// src/services/auth.service.ts
import { api, setToken } from "./http";

type AuthResponse = {
    token: string;
    type: string; // "Bearer"
};

export async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/api/login", { email, password });
    setToken(res.token);
    return res;
}

export async function register(payload: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name: string;
    last_name: string;
}) {
    const res = await api.post<AuthResponse>("/api/register", payload);
    setToken(res.token);
    return res;
}

export function logoutLocal() {
    setToken(null);
}
