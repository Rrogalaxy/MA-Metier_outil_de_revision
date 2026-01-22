import { api } from "./http";
import type { Question, Quiz, QuizResult } from "../types";

// D'après votre échange : GET /quiz/{id}
type ApiQuiz = {
    id: number;             // backend "id" dans l'exemple
    nom: string;
    type: "quiz" | "flashcard";
    duree?: number;
    moduleNom: string;
    dateCreation?: string;
    image?: string;
};

// Questions : d'après l'exemple "id/enonce/reponse/ordre"
type ApiQuestion = {
    id: number;
    enonce: string;
    reponse: string;
    ordre: number;
    difficulte?: number;
};

export async function getQuiz(quizId: number): Promise<Quiz | null> {
    // si l'API renvoie 404, api() lèvera une erreur.
    // On capture pour retourner null (comportement actuel).
    try {
        const q = await api<ApiQuiz>(`/api/quiz/${quizId}`);
        return {
            numeroQuiz: q.id,
            nomQuiz: q.nom,
            dateCreation: q.dateCreation ?? new Date().toISOString().slice(0, 10),
            type: q.type,
            image: q.image,
            moduleNom: q.moduleNom,
            lien: undefined,
        };
    } catch {
        return null;
    }
}

export async function listQuestions(quizId: number): Promise<Question[]> {
    // ⚠️ endpoint à confirmer : souvent /api/quiz/{id}/questions
    const qs = await api<ApiQuestion[]>(`/api/quiz/${quizId}/questions`);
    return qs
        .slice()
        .sort((a, b) => a.ordre - b.ordre)
        .map((q) => ({
            numeroQuestion: q.id,
            enonce: q.enonce,
            reponse: q.reponse,
            ordreQuestion: q.ordre,
            quizId,
        }));
}

// Résultats / tentative quiz : pas encore complètement clair dans le nouveau MCD.
// On laisse en TODO (on peut garder mock temporairement ou bloquer la feature).
export async function submitQuiz(_quizId: number, _score: number): Promise<QuizResult> {
    // TODO: remplacer par endpoint backend (Tentative Quiz / Passer / Exercer selon votre MCD final)
    throw new Error("submitQuiz: endpoint backend non défini (TODO)");
}

export async function listMyResults(): Promise<QuizResult[]> {
    // TODO: endpoint backend non défini (nouveau MCD: Tentative Quiz / Exercer)
    return [];
}

export async function listAllQuizzes(): Promise<Quiz[]> {
    // TODO: endpoint backend global (ex: GET /quiz)
    return [];
}

export async function listQuizzesByModule(_moduleNom: string): Promise<Quiz[]> {
    // TODO: endpoint backend pour lister les quiz d'un module (encore flou)
    return [];
}
