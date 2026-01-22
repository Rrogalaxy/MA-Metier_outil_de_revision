/**
 * quiz.service.ts
 * ----------------
 * Service lié aux QUIZ / FLASHCARDS.
 *
 * Dans notre projet il y a 2 types de données :
 * 1) Données PARTAGÉES (communes à tous) :
 *    - Quiz
 *    - Questions
 *    👉 "contenu pédagogique" qui peut être réutilisé par plusieurs élèves.
 *
 * 2) Données PERSONNELLES (propres à un utilisateur) :
 *    - Résultats de quiz (relation "Obtenir" dans le MCD)
 *    👉 ce que l'élève a fait / son score / la date.
 *
 * Objectif du service :
 * - Fournir une API "propre" au frontend
 * - Aujourd’hui: on lit/écrit dans un mock
 * - Demain: on remplacera le contenu par des appels HTTP (fetch/axios)
 */

import { fakeDelay } from "./api";
import {
    mockQuizzes,
    mockQuestions,
    mockQuizResults,
    mockUser,
} from "./mockDb";
import type { Question, Quiz, QuizResult } from "../types";

/**
 * Liste de TOUS les quiz (données partagées)
 *
 * Usage :
 * - utile pour StatsPage (ex: lier un résultat à son module via quizId)
 * - ou pour afficher une bibliothèque globale plus tard
 *
 * Retour :
 * - Promise<Quiz[]> pour imiter un appel réseau
 */
export async function listAllQuizzes(): Promise<Quiz[]> {
    await fakeDelay();
    return mockQuizzes;
}

/**
 * Récupère un quiz par son identifiant
 *
 * quizId :
 * - correspond à Quiz.numeroQuiz (clé primaire côté DB)
 *
 * Retour :
 * - le quiz si trouvé
 * - null si l'id n'existe pas (ex: URL invalide)
 */
export async function getQuiz(quizId: number): Promise<Quiz | null> {
    await fakeDelay();

    // .find() retourne le premier élément qui correspond
    // ?? null => si undefined, on renvoie null (plus clair dans le frontend)
    return mockQuizzes.find((q) => q.numeroQuiz === quizId) ?? null;
}

/**
 * Liste les quiz pour un module donné
 *
 * moduleNom :
 * - correspond à Modules.nom_module (dans le MCD)
 * - dans notre type Quiz, on a un champ moduleNom pour savoir à quel module il appartient
 *
 * Usage :
 * - ModuleDetailPage affiche "Quiz & Flashcards" de ce module
 */
export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    await fakeDelay();

    // On filtre le catalogue partagé des quiz
    return mockQuizzes.filter((q) => q.moduleNom === moduleNom);
}

/**
 * Liste les questions d'un quiz
 *
 * quizId :
 * - correspond à Quiz.numeroQuiz
 *
 * On trie les questions par ordreQuestion pour les afficher dans le bon ordre.
 *
 * Usage :
 * - QuizPage appelle cette fonction pour charger la série de questions à afficher.
 */
export async function listQuestions(quizId: number): Promise<Question[]> {
    await fakeDelay();

    return mockQuestions
        // On garde uniquement les questions du quiz demandé
        .filter((qq) => qq.quizId === quizId)

        // Tri numérique (ordreQuestion est un number)
        .sort((a, b) => a.ordreQuestion - b.ordreQuestion);
}

/**
 * Liste les résultats PERSONNELS (relation "Obtenir") de l’utilisateur connecté
 *
 * Ce sont les résultats stockés après un passage de quiz :
 * - score
 * - datePassage
 * - quizId (pour savoir quel quiz a été fait)
 *
 * On trie du plus récent au plus ancien.
 *
 * Usage :
 * - StatsPage (voir les scores, progression, etc.)
 * - DashboardPage (calcul "modules à risque" basé sur scores récents)
 */
export async function listMyResults(): Promise<QuizResult[]> {
    await fakeDelay();

    return mockQuizResults
        // On garde uniquement les résultats du user connecté
        .filter((r) => r.userMail === mockUser.mail)

        // Copie du tableau pour éviter de modifier le mock par erreur
        .slice()

        // Tri du plus récent au plus ancien (date ISO se compare bien en string)
        .sort((a, b) => b.datePassage.localeCompare(a.datePassage));
}

/**
 * Enregistre un résultat de quiz pour l’utilisateur connecté
 *
 * IMPORTANT :
 * - en ES modules (import/export), on ne peut pas réassigner un import.
 *   Donc on ne fait PAS : mockQuizResults = [...]
 * - on modifie le tableau EN PLACE (push/unshift/splice)
 *
 * quizId :
 * - quel quiz a été fait
 *
 * score :
 * - score final (0..100)
 *
 * Retour :
 * - le résultat créé (comme si l'API renvoyait l'objet inséré)
 */
export async function submitQuiz(quizId: number, score: number): Promise<QuizResult> {
    await fakeDelay();

    // On construit un nouvel objet QuizResult
    const result: QuizResult = {
        userMail: mockUser.mail,                          // utilisateur connecté
        quizId,                                           // quel quiz a été fait
        score,                                            // score final
        datePassage: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    };

    // On ajoute le résultat au début du tableau
    // (comme si c’était le dernier résultat enregistré)
    mockQuizResults.unshift(result);

    return result;
}
