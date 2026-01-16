// src/services/quiz.service.ts
import { fakeDelay } from "./api";
import {
    mockQuizzes,
    mockQuestions,
    mockQuizResults,
    mockUser,
} from "./mockDb";
import type { Question, Quiz, QuizResult } from "../types";

/**
 * Liste de tous les quiz (contenu partagé)
 */
export async function listAllQuizzes(): Promise<Quiz[]> {
    await fakeDelay();
    return mockQuizzes;
}

/**
 * Récupère un quiz par son id
 */
export async function getQuiz(quizId: number): Promise<Quiz | null> {
    await fakeDelay();
    return mockQuizzes.find((q) => q.numeroQuiz === quizId) ?? null;
}

/**
 * Liste des quiz d'un module (contenu partagé)
 */
export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    await fakeDelay();
    return mockQuizzes.filter((q) => q.moduleNom === moduleNom);
}

/**
 * Liste des questions d'un quiz (contenu partagé)
 */
export async function listQuestions(quizId: number): Promise<Question[]> {
    await fakeDelay();
    return mockQuestions
        .filter((qq) => qq.quizId === quizId)
        .sort((a, b) => a.ordreQuestion - b.ordreQuestion);
}

/**
 * Résultats personnels (MCD: Obtenir) pour l'utilisateur connecté
 */
export async function listMyResults(): Promise<QuizResult[]> {
    await fakeDelay();
    return mockQuizResults
        .filter((r) => r.userMail === mockUser.mail)
        .slice()
        .sort((a, b) => b.datePassage.localeCompare(a.datePassage));
}

/**
 * Enregistre un résultat (MCD: Obtenir) pour l'utilisateur connecté
 * IMPORTANT: ne pas réassigner mockQuizResults (import ES module), on modifie le tableau.
 */
export async function submitQuiz(quizId: number, score: number): Promise<QuizResult> {
    await fakeDelay();

    const result: QuizResult = {
        userMail: mockUser.mail,
        quizId,
        score,
        datePassage: new Date().toISOString().slice(0, 10),
    };

    mockQuizResults.unshift(result);
    return result;
}
