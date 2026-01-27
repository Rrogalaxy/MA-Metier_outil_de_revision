/**
 * schoolSchedule.service.ts
 * -------------------------
 * Service responsable de l’horaire scolaire importé depuis un fichier .ics
 *
 * Objectif :
 * - importer le texte .ics
 * - parser → events
 * - stocker en localStorage
 *
 * ✅ Sécurité ajoutée :
 * - refuse un fichier qui n’est pas un vrai ICS (pas de BEGIN:VCALENDAR)
 * - ne crash pas : on throw une Error claire capturable par l’UI
 */

import { fakeDelay } from "./api";
import { mockUser } from "./mockDb";
import { parseIcs, type IcsEvent } from "../lib/ics";

function storageKey() {
    return `cpnv_school_ics_${mockUser.mail}`;
}

/** Lecture des événements stockés */
export async function getSchoolEvents(): Promise<IcsEvent[]> {
    await fakeDelay();

    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as IcsEvent[];
        // petite sécurité : s’assurer que c’est bien un tableau
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Import texte .ics (lu depuis un <input type="file" />)
 *
 * ✅ Sécurité:
 * - si texte vide ou pas un VCALENDAR -> Error
 * - parseIcs() est lui-même “safe”
 */
export async function importSchoolIcs(icsText: string): Promise<IcsEvent[]> {
    await fakeDelay();

    const text = (icsText ?? "").trim();
    if (!text) {
        throw new Error("Fichier .ics vide.");
    }

    // ✅ signature minimale d’un ICS
    // (on tolère BOM + espaces)
    const normalized = text.replace(/^\uFEFF/, "").trimStart();
    if (!normalized.startsWith("BEGIN:VCALENDAR")) {
        throw new Error("Ce fichier ne semble pas être un calendrier .ics valide (BEGIN:VCALENDAR manquant).");
    }

    const events = parseIcs(text);

    // Si le fichier est un ICS mais ne contient aucun VEVENT exploitable
    if (events.length === 0) {
        // On sauvegarde quand même un tableau vide (optionnel),
        // mais surtout on informe via Error (ou tu peux juste return []).
        localStorage.setItem(storageKey(), JSON.stringify([]));
        return [];
    }

    localStorage.setItem(storageKey(), JSON.stringify(events));
    return events;
}

/** Supprime complètement l’horaire scolaire de l’utilisateur */
export async function clearSchoolEvents(): Promise<void> {
    await fakeDelay();
    localStorage.removeItem(storageKey());
}
