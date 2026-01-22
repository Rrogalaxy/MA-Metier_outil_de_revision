// src/services/http.ts
// Client HTTP centralisé pour API Laravel + Sanctum (cookie).
// - credentials: "include" => envoie les cookies de session
// - /sanctum/csrf-cookie => à appeler avant POST/PUT/PATCH/DELETE

const API_BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

let csrfReady = false;

async function ensureCsrfCookie(): Promise<void> {
    if (csrfReady) return;

    await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
        method: "GET",
        credentials: "include",
    });

    csrfReady = true;
}

export class ApiError extends Error {
    status: number;
    payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    /**
     * Force CSRF fetch before request (default: true for POST/PUT/PATCH/DELETE)
     */
    csrf?: boolean;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method: HttpMethod = options.method ?? "GET";

    // Par défaut, on prépare CSRF pour les requêtes mutantes
    const needsCsrf = options.csrf ?? (method !== "GET");

    if (needsCsrf) {
        await ensureCsrfCookie();
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: "include",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers ?? {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // 204 No Content
    if (res.status === 204) {
        return undefined as T;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const rawText = await res.text();

    const payload: unknown =
        rawText.length === 0
            ? null
            : contentType.includes("application/json")
                ? safeJson(rawText)
                : rawText;

    if (!res.ok) {
        const message = extractMessage(payload) ?? `Erreur API (${res.status})`;
        throw new ApiError(message, res.status, payload);
    }

    return payload as T;
}

function safeJson(text: string): unknown {
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

/**
 * Tente d'extraire un message d'erreur standard Laravel:
 * - { message: "..." }
 * - { errors: {...} }
 */
function extractMessage(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") return null;

    // payload is object, but unknown structure
    const rec = payload as Record<string, unknown>;

    if (typeof rec.message === "string") return rec.message;

    // Cas fréquent Laravel validation: { errors: { field: ["msg"] } }
    if (rec.errors && typeof rec.errors === "object") {
        const errs = rec.errors as Record<string, unknown>;
        const firstKey = Object.keys(errs)[0];
        const firstVal = firstKey ? errs[firstKey] : undefined;

        if (Array.isArray(firstVal) && typeof firstVal[0] === "string") {
            return firstVal[0];
        }
    }

    return null;
}
