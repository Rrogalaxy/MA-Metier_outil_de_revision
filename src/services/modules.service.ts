/**
 * modules.service.ts
 * ------------------
 * Ce fichier représente la couche "service" côté frontend.
 *
 * Rôle d'un service :
 * - fournir des fonctions réutilisables pour récupérer / modifier des données
 * - cacher la source réelle des données :
 *    - aujourd’hui : mockDb (données locales)
 *    - plus tard : appels HTTP vers l’API backend (fetch/axios)
 *
 * Intérêt :
 * - les pages React (ModulesPage, ModuleDetailPage, DashboardPage, etc.)
 *   n’ont pas besoin de savoir *comment* les données sont obtenues.
 */

import { fakeDelay } from "./api"; // simule une latence réseau (comme si on appelait un backend)
import { mockModules, mockUserModules, mockUser } from "./mockDb"; // données mockées (comme dans une DB)
import type { Module, UserModule } from "../types"; // types TypeScript (pas de JS à l’exécution)

/**
 * Modules "partagés" (catalogue global)
 *
 * Exemple :
 * - la liste des modules existants dans l’école (SQL, JS, HTML/CSS…)
 * - tout utilisateur peut voir cette liste
 *
 * Retour :
 * - Promise<Module[]> = une promesse qui résout un tableau de Module
 *   (comme une requête réseau asynchrone).
 */
export async function listSharedModules(): Promise<Module[]> {
    // Simule le temps réseau (150ms par défaut dans fakeDelay)
    await fakeDelay();

    // On renvoie les modules du "catalogue global"
    return mockModules;
}

/**
 * Modules "personnels" (relation Travailler) pour l'utilisateur connecté
 *
 * Ici on renvoie la progression de l’utilisateur pour chaque module :
 * - difficulte
 * - derniereAlerte
 * - prochaineAlerte
 *
 * IMPORTANT :
 * - la DB contient potentiellement des progressions pour plusieurs utilisateurs
 * - donc on filtre par l’utilisateur connecté (mockUser.mail)
 */
export async function listMyModules(): Promise<UserModule[]> {
    await fakeDelay();

    // On garde uniquement les lignes où userMail correspond à l’utilisateur connecté.
    return mockUserModules.filter((um) => um.userMail === mockUser.mail);
}

/**
 * Crée ou met à jour la ligne "Travailler" (progression perso) d'un module.
 *
 * Contexte MCD :
 * - Travailler = relation entre Utilisateurs et Modules
 * - elle contient : difficulte, derniereAlerte, prochaineAlerte...
 *
 * Pourquoi le paramètre "input" est écrit comme ceci :
 *   input: Omit<UserModule, "userMail">
 *
 * Explication simple :
 * - UserModule contient un champ userMail (car en base on doit savoir à qui ça appartient)
 * - mais dans le frontend, quand on met à jour “ma progression”, on ne demande pas à l’utilisateur
 *   de fournir son mail : on le connaît déjà (mockUser.mail)
 * - Donc on dit à TypeScript : "input est un UserModule SANS userMail"
 *
 * Retour :
 * - Promise<UserModule> : on renvoie l’objet sauvegardé (utile pour mettre à jour l’UI).
 */
export async function upsertMyModule(
    input: Omit<UserModule, "userMail">
): Promise<UserModule> {
    await fakeDelay();

    /**
     * On cherche si une progression existe déjà pour ce module
     * (pour l’utilisateur connecté).
     *
     * findIndex renvoie :
     * - l’index (0..n) si trouvé
     * - -1 si pas trouvé
     */
    const idx = mockUserModules.findIndex(
        (m) => m.userMail === mockUser.mail && m.moduleNom === input.moduleNom
    );

    // CAS 1 : déjà existant -> on met à jour
    if (idx >= 0) {
        /**
         * On fusionne l’ancien objet + les nouvelles valeurs.
         *
         * ...mockUserModules[idx]  = valeurs déjà enregistrées
         * ...input                = nouvelles valeurs (écrasent les anciennes si même champ)
         */
        mockUserModules[idx] = { ...mockUserModules[idx], ...input };

        // On renvoie la version mise à jour
        return mockUserModules[idx];
    }

    // CAS 2 : inexistant -> on crée une nouvelle entrée
    const created: UserModule = {
        // On ajoute userMail automatiquement (utilisateur connecté)
        userMail: mockUser.mail,

        // Puis on ajoute le reste des champs (moduleNom, difficulte, dates, etc.)
        ...input,
    };

    /**
     * IMPORTANT (et c’est lié à tes erreurs précédentes) :
     *
     * mockUserModules est importé depuis mockDb.
     * En JavaScript (ES Modules), on ne peut PAS réassigner une importation :
     *   mockUserModules = [...]
     * ça provoquerait : "Cannot assign to ... because it is an import"
     *
     * Donc on modifie le tableau "en place" :
     * - unshift = ajoute au début du tableau
     */
    mockUserModules.unshift(created);

    // On renvoie l’objet créé
    return created;
}
