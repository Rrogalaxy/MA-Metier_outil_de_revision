// src/services/http.ts

/**
 * Client HTTP centralisé.
 * - baseURL
 * - headers JSON
 * - Bearer token (stocké en localStorage)
 * - gestion d'erreur
 */

const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";

/** Clé unique pour stocker le token dans le navigateur. */
const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
    const token = getToken();

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
        let detail = "";
        try {
            const data: unknown = await res.json();
            detail = JSON.stringify(data);
        } catch {
            detail = await res.text();
        }
        throw new Error(`HTTP ${res.status} ${res.statusText} - ${detail}`);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}

/**
 * API simple et stable pour tous les services.
 * Exemple: api.get<User>("/api/user")
 */
export const api = {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    del: <T>(path: string) => request<T>("DELETE", path),
};

export { API_BASE_URL };
