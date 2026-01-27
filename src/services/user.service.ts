// src/services/user.service.ts
import type { User } from "../types";
import { api } from "./http";

/**
 * Réponse backend actuelle (GET /api/user)
 */
export type ApiUser = {
    email: string;
    first_name: string;
    last_name: string;
    class_id?: string | null;
    class_year?: string | number | null;
};

/**
 * Stockage local de la classe (temporaire, en attendant endpoint backend).
 * Clé unique par utilisateur pour éviter mélanges.
 */
function classStorageKey(email: string) {
    return `cpnv_user_class_${email}`;
}

export function getLocalClass(email: string): { class_id: string; class_year: string | number } | null {
    const raw = localStorage.getItem(classStorageKey(email));
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { class_id: string; class_year: string | number };
    } catch {
        return null;
    }
}

export function setLocalClass(email: string, payload: { class_id: string; class_year: string | number }) {
    localStorage.setItem(classStorageKey(email), JSON.stringify(payload));
}

/** Retourne la réponse API brute */
export async function getMeApi(): Promise<ApiUser> {
    return api.get<ApiUser>("/api/user");
}

/** Retourne le type frontend User (utilisé dans DashboardPage) */
export async function getMe(): Promise<User> {
    const u = await getMeApi();
    return {
        mail: u.email,
        prenom: u.first_name,
        nom: u.last_name,
    };
}

/**
 * ✅ TEMPORAIRE : on “sauve la classe” en localStorage
 * (car /api/user/class n’existe pas encore côté backend)
 */
export async function updateMyClass(payload: { class_id: string; class_year: string | number }) {
    // On récupère l'utilisateur pour avoir son email (clé)
    const me = await getMeApi();
    setLocalClass(me.email, payload);

    return { message: "Classe enregistrée localement (mode dev)" };
}
