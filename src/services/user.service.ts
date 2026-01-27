// src/services/user.service.ts
import { api } from "./http";
import { getLocalUserClass, setLocalUserClass } from "./classLocal.service";
import { getMockUser } from "./mockSession";

export type ApiUser = {
    email: string;
    first_name: string;
    last_name: string;
    class_id?: string | null;
    class_year?: string | number | null;
};

export async function getMeApi(): Promise<ApiUser> {
    return api.get<ApiUser>("/api/user");
}

/**
 * ✅ Smart: tente backend, sinon renvoie un user mock
 * - si l'utilisateur mock existe (login/register fallback), on le renvoie
 * - sinon on renvoie un user "démo" par défaut
 * - on applique aussi la classe locale si elle existe
 */
export async function getMeSmart(): Promise<ApiUser> {
    try {
        // backend
        const me = await getMeApi();
        return me;
    } catch {
        // fallback mockSession
        const u = getMockUser();

        const base: ApiUser = u
            ? { ...u, class_id: null, class_year: null }
            : {
                email: "eleve@cpnv.ch",
                first_name: "Élève",
                last_name: "Démo",
                class_id: null,
                class_year: null,
            };

        // ✅ si une classe est stockée localement, on l’injecte dans le user mock
        const local = getLocalUserClass(base.email);
        if (local) {
            return {
                ...base,
                class_id: local.class_id,
                class_year: local.class_year,
            };
        }

        return base;
    }
}

/**
 * ✅ Fallback localStorage : classe de l’utilisateur
 */
export function getLocalClass(email: string) {
    return getLocalUserClass(email);
}

/**
 * ✅ Smart update:
 * - tente PATCH backend
 * - sinon stocke en localStorage (démo)
 */
export async function updateMyClass(payload: { class_id: string; class_year: string | number }) {
    try {
        return await api.patch<{ message: string }>("/api/user/class", payload);
    } catch {
        const me = await getMeSmart(); // renvoie un user cohérent même si API down
        setLocalUserClass(me.email, payload);
        return { message: "Classe enregistrée (local mock)" };
    }
}
