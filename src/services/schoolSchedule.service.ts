// src/services/schoolSchedule.service.ts
/**
 * Service horaire scolaire (.ics)
 *
 * Stockage local (localStorage) par utilisateur
 * - pas besoin de backend pour la démo
 */
import { fakeDelay } from "./api";
import { mockUser } from "./mockDb";
import { parseIcs, type IcsEvent } from "../lib/ics";

function storageKey() {
    return `cpnv_school_ics_${mockUser.mail}`;
}

function safeParseArray(raw: string | null): IcsEvent[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as IcsEvent[]) : [];
    } catch {
        return [];
    }
}

export async function getSchoolEvents(): Promise<IcsEvent[]> {
    await fakeDelay();
    return safeParseArray(localStorage.getItem(storageKey()));
}

export async function importSchoolIcs(icsText: string): Promise<IcsEvent[]> {
    await fakeDelay();

    const text = (icsText ?? "").trim();
    if (!text) throw new Error("Fichier .ics vide.");

    const normalized = text.replace(/^\uFEFF/, "").trimStart();
    if (!normalized.startsWith("BEGIN:VCALENDAR")) {
        throw new Error("Fichier .ics invalide (BEGIN:VCALENDAR manquant).");
    }

    const events = parseIcs(text);

    // On stocke même si vide : ça évite des états incohérents.
    localStorage.setItem(storageKey(), JSON.stringify(events));
    return events;
}

export async function clearSchoolEvents(): Promise<void> {
    await fakeDelay();
    localStorage.removeItem(storageKey());
}
