// src/services/http.ts (ou https.ts)
import axios, {
    AxiosError,
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

export async function fakeDelay(ms = 250): Promise<void> {
    const fast = import.meta.env.VITE_FAST_MOCKS === "true";
    const delay = fast ? 0 : ms;
    if (delay <= 0) return;
    await new Promise((r) => setTimeout(r, delay));
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

// ✅ Types de body autorisés (sans any)
type Body =
    | undefined
    | null
    | Record<string, unknown>
    | URLSearchParams
    | FormData
    | string
    | number
    | boolean;

const axiosClient: AxiosInstance = axios.create({
    baseURL,
    headers: {
        Accept: "application/json",
    },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // ✅ Bearer token
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Auto Content-Type
    const data = config.data as unknown;

    if (data instanceof URLSearchParams) {
        config.headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";
        // Axios accepte string/URLSearchParams, mais on force une string pour être sûr
        config.data = data.toString();
    } else if (data instanceof FormData) {
        // Laisse Axios gérer le boundary automatiquement
        // (ne pas setter Content-Type manuellement)
    } else if (data !== null && typeof data === "object" && data !== undefined) {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => Promise.reject(error)
);

// ✅ Wrapper typé qui renvoie directement response.data
export const api = {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const res = await axiosClient.get<T>(url, config);
        return res.data;
    },

    async post<T>(url: string, data?: Body, config?: AxiosRequestConfig): Promise<T> {
        const res = await axiosClient.post<T>(url, data, config);
        return res.data;
    },

    async put<T>(url: string, data?: Body, config?: AxiosRequestConfig): Promise<T> {
        const res = await axiosClient.put<T>(url, data, config);
        return res.data;
    },

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const res = await axiosClient.delete<T>(url, config);
        return res.data;
    },
};

// ✅ Helpers token
export function setToken(token: string | null): void {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
}

export function getToken(): string | null {
    return localStorage.getItem("token");
}