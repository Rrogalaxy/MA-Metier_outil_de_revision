/**
 * user.service.ts
 * ----------------
 * Service lié à l’utilisateur connecté.
 *
 * Rôle :
 * - Centraliser toutes les opérations liées à l’utilisateur courant
 * - Fournir une API “comme un backend” au frontend
 *
 * ⚠️ IMPORTANT :
 * - Tout est MOCKÉ (en mémoire)
 * - Plus tard, ces fonctions feront des appels HTTP vers le backend
 */

import { fakeDelay } from "./api";
import {
    mockUser,
    mockActivities,
    mockUserModules,
    mockQuizResults,
} from "./mockDb";
import type { User, Activity } from "../types";

/**
 * Récupère l’utilisateur actuellement connecté
 *
 * Dans une vraie application :
 * - Cette fonction ferait un appel API avec un token d’authentification
 * - Le backend renverrait les infos de l’utilisateur connecté
 *
 * Ici :
 * - On retourne simplement un utilisateur mocké
 */
export async function getMe(): Promise<User> {
    await fakeDelay(); // simulation appel réseau
    return mockUser;
}

/**
 * Récupère les activités PERSONNELLES de l’utilisateur connecté
 *
 * Étapes :
 * 1) Attendre un faux délai
 * 2) Filtrer toutes les activités pour ne garder que celles de l’utilisateur
 *
 * MCD :
 * - Correspond à l’entité Activité
 * - Relation avec Utilisateur via userMail
 */
export async function listMyActivities(): Promise<Activity[]> {
    await fakeDelay();

    return mockActivities.filter(
        (a) => a.userMail === mockUser.mail
    );
}

/**
 * Ajoute une nouvelle activité personnelle à l’utilisateur
 *
 * input :
 * - Toutes les données nécessaires SAUF :
 *   - numeroActivites (généré ici)
 *   - userMail (pris depuis l’utilisateur connecté)
 *
 * Omit<T, K> :
 * - TypeScript utilitaire
 * - "Prends le type Activity mais enlève certains champs"
 */
export async function addMyActivity(
    input: Omit<Activity, "numeroActivites" | "userMail">
): Promise<Activity> {
    await fakeDelay();

    /**
     * Génération d’un identifiant unique
     *
     * - Si aucune activité n’existe → id = 1
     * - Sinon → max(id existant) + 1
     *
     * ⚠️ En backend, ce serait la base de données qui gère ça
     */
    const nextId =
        mockActivities.length === 0
            ? 1
            : Math.max(...mockActivities.map((a) => a.numeroActivites)) + 1;

    /**
     * Création de l’activité complète
     *
     * - On ajoute automatiquement :
     *   - numeroActivites
     *   - userMail (utilisateur connecté)
     */
    const created: Activity = {
        numeroActivites: nextId,
        userMail: mockUser.mail,
        ...input,
    };

    /**
     * Ajout dans la "base de données" mockée
     *
     * unshift :
     * - ajoute l’élément au début du tableau
     * - permet de voir la nouvelle activité immédiatement en haut
     */
    mockActivities.unshift(created);

    return created;
}

/**
 * Snapshot global de debug (OPTIONNEL)
 *
 * Utilité :
 * - Permet de voir l’état COMPLET des données mockées
 * - Très pratique pour le debug ou la démonstration
 *
 * ⚠️ Cette fonction n’existera PAS en production
 */
export async function getMySnapshot() {
    await fakeDelay();

    return {
        modules: mockUserModules,
        results: mockQuizResults,
        activities: mockActivities,
    };
}
