/**
 * planning.service.ts
 * -------------------
 * Service lié au PLANNING PERSONNEL de l’utilisateur.
 *
 * Correspond aux entités :
 * - Activites
 * - Agender (relation utilisateur ↔ activité)
 *
 * Objectif :
 * - Ajouter / supprimer des activités privées
 * - Les afficher dans le planning
 */

import { fakeDelay } from "./api";
import { mockActivities, mockUser } from "./mockDb";
import type { Activity } from "../types";

/**
 * Transforme une date ISO (YYYY-MM-DD) en nom du jour
 *
 * Exemple :
 * - "2026-01-12" → "Lundi"
 *
 * Sert uniquement à l'affichage (UX),
 * ce champ pourrait aussi être calculé côté backend.
 */
function dayNameFromISO(dateISO: string): string {
    const d = new Date(`${dateISO}T00:00:00`);

    const names = [
        "Dimanche",
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
    ] as const;

    return names[d.getDay()];
}

/**
 * Liste des activités PRIVÉES de l’utilisateur connecté
 *
 * Étapes :
 * 1. Filtrer les activités de l’utilisateur
 * 2. Trier par date
 * 3. Trier par heure de début
 *
 * Résultat :
 * - Activités prêtes à être affichées dans le planning
 */
export async function listMyActivities(): Promise<Activity[]> {
    await fakeDelay();

    return mockActivities
        // On garde uniquement les activités de l'utilisateur connecté
        .filter(a => a.userMail === mockUser.mail)

        // Copie du tableau pour éviter effets de bord
        .slice()

        // Tri par date puis par heure
        .sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            if (d !== 0) return d;
            return a.heureDebut.localeCompare(b.heureDebut);
        });
}

/**
 * Ajoute une nouvelle activité privée
 *
 * input :
 * - données saisies dans le formulaire
 * - sans id, userMail ni jour (calculés automatiquement)
 */
export async function addMyActivity(
    input: Omit<Activity, "numeroActivites" | "userMail" | "jour">
): Promise<Activity> {
    await fakeDelay();

    // Génération d’un nouvel identifiant
    // (équivalent d’un auto-increment en base de données)
    const nextId =
        (mockActivities.reduce(
            (max, a) => Math.max(max, a.numeroActivites),
            0
        ) || 0) + 1;

    const created: Activity = {
        numeroActivites: nextId,
        userMail: mockUser.mail,              // utilisateur connecté
        nomActivite: input.nomActivite,
        date: input.date,
        heureDebut: input.heureDebut,
        heureFin: input.heureFin,
        jour: dayNameFromISO(input.date),     // calcul automatique
    };

    // Ajout en tête (comme un INSERT)
    mockActivities.unshift(created);

    return created;
}

/**
 * Supprime une activité privée
 *
 * On vérifie :
 * - que l’activité appartient bien à l’utilisateur connecté
 *
 * En vrai backend :
 * - cette vérification serait obligatoire côté serveur
 */
export async function deleteMyActivity(
    numeroActivites: number
): Promise<void> {
    await fakeDelay();

    const idx = mockActivities.findIndex(
        a =>
            a.userMail === mockUser.mail &&
            a.numeroActivites === numeroActivites
    );

    if (idx >= 0) {
        // Suppression "en place"
        mockActivities.splice(idx, 1);
    }
}
