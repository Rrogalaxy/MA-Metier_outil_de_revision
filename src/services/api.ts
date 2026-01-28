/**
 * Ce fichier contient des utilitaires “mock” pour simuler un backend.
 *
 * Objectif :
 * - Pendant qu’on n’a pas encore le vrai backend (API), on veut quand même pouvoir
 *   développer et tester le frontend.
 * - On simule donc des appels réseau (qui prennent un petit temps).
 *
 * Plus tard :
 * - On remplacera les mocks par de vrais appels HTTP (fetch/axios)
 * - On ajoutera l’authentification (token, cookies, etc.)
 */

// Plus tard: remplacer par fetch/axios + auth token.
// Pour l’instant: abstraction pour que le frontend ne dépende pas du mock.

/**
 * fakeDelay(ms)
 *
 * Simule un délai réseau.
 * Exemple :
 *   await fakeDelay(200)
 * -> attend 200 ms, comme si on faisait un appel API.
 *
 * Pourquoi c'est utile ?
 * - En vrai, une API n'est jamais instantanée.
 * - Ça permet de tester les états "Chargement…" (loading) dans l’UI.
 *
 * Paramètre :
 * - ms : durée du délai en millisecondes (150 ms par défaut)
 *
 * Retour :
 * - une Promise (on peut donc utiliser `await`)
 */
// src/services/api.ts (exemple)
export async function fakeDelay(ms = 250) {
    const fast = import.meta.env.VITE_FAST_MOCKS === "true";
    const delay = fast ? 0 : ms;
    if (delay <= 0) return;
    await new Promise((r) => setTimeout(r, delay));
}

