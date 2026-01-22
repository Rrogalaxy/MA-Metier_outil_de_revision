/**
 * schoolSchedule.service.ts
 * -------------------------
 * Service responsable de l’horaire scolaire importé depuis un fichier .ics
 *
 * Objectif :
 * - Permettre à un élève d’importer son planning scolaire (.ics)
 * - Convertir ce fichier en événements exploitables par le frontend
 * - Sauvegarder ces événements localement (localStorage)
 *
 * ⚠️ IMPORTANT :
 * - Ces données sont PERSONNELLES à l’utilisateur
 * - Elles ne viennent pas encore du backend
 * - Plus tard, ce service sera remplacé par des appels API (fetch/axios)
 */

import { fakeDelay } from "./api";
import { mockUser } from "./mockDb";
import { parseIcs, type IcsEvent } from "../lib/ics";

/**
 * Génère la clé utilisée dans le localStorage du navigateur
 *
 * Pourquoi ?
 * - localStorage est un simple dictionnaire clé → valeur (string → string)
 * - On veut une clé UNIQUE par utilisateur
 *
 * Exemple de clé générée :
 *   cpnv_school_ics_eleve@cpnv.ch
 */
function storageKey() {
    return `cpnv_school_ics_${mockUser.mail}`;
}

/**
 * Récupère les événements scolaires stockés localement
 *
 * Étapes :
 * 1) On attend un faux délai (simulation appel réseau)
 * 2) On lit dans le localStorage avec la clé utilisateur
 * 3) Si rien n’est stocké → tableau vide
 * 4) Si quelque chose existe → on tente de parser le JSON
 *
 * Retour :
 * - un tableau d’événements IcsEvent
 */
export async function getSchoolEvents(): Promise<IcsEvent[]> {
    await fakeDelay();

    // Lecture brute (string) depuis le navigateur
    const raw = localStorage.getItem(storageKey());

    // Aucun horaire importé
    if (!raw) return [];

    try {
        // Conversion string → objet JS
        return JSON.parse(raw) as IcsEvent[];
    } catch {
        // Sécurité : si le JSON est corrompu
        return [];
    }
}

/**
 * Importe un fichier .ics (texte brut)
 *
 * icsText :
 * - contenu complet du fichier .ics (lu via <input type="file" />)
 *
 * Étapes :
 * 1) parseIcs transforme le texte .ics en objets IcsEvent
 * 2) On sauvegarde le résultat dans le localStorage
 * 3) On renvoie les événements pour mise à jour immédiate de l’UI
 *
 * Usage :
 * - PlanningPage (import horaire scolaire)
 */
export async function importSchoolIcs(icsText: string): Promise<IcsEvent[]> {
    await fakeDelay();

    // Parsing du format iCalendar vers notre format interne
    const events = parseIcs(icsText);

    // Sauvegarde locale (persistant même après refresh)
    localStorage.setItem(storageKey(), JSON.stringify(events));

    return events;
}

/**
 * Supprime complètement l’horaire scolaire de l’utilisateur
 *
 * Usage :
 * - Bouton "Effacer l’horaire" dans PlanningPage
 *
 * Effet :
 * - localStorage nettoyé
 * - plus aucun cours affiché
 */
export async function clearSchoolEvents(): Promise<void> {
    await fakeDelay();

    localStorage.removeItem(storageKey());
}
