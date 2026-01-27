// src/services/classLocal.service.ts

/**
 * Stockage local de la classe de l'utilisateur.
 * Objectif : ne pas dépendre du backend tant que l’endpoint user/class n’existe pas.
 *
 * Clé = cpnv_user_class_<email>
 * Valeur = { class_id, class_year }
 */

export type LocalUserClass = {
    class_id: string;
    class_year: string | number;
};

function storageKey(email: string) {
    return `cpnv_user_class_${email}`;
}

export function setLocalUserClass(email: string, cls: LocalUserClass) {
    localStorage.setItem(storageKey(email), JSON.stringify(cls));
}

export function getLocalUserClass(email: string): LocalUserClass | null {
    const raw = localStorage.getItem(storageKey(email));
    if (!raw) return null;
    try {
        return JSON.parse(raw) as LocalUserClass;
    } catch {
        return null;
    }
}

export function clearLocalUserClass(email: string) {
    localStorage.removeItem(storageKey(email));
}
