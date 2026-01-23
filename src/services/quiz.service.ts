// src/services/quiz.service.ts
import { api } from "./http";
import type { Question, Quiz, QuizResult } from "../types";

type ApiQuiz = {
    id: number;
    nom: string;
    type: "quiz" | "flashcard";
    duree?: number;
    moduleNom: string;
    dateCreation?: string;
    image?: string;
};

type ApiQuestion = {
    id: number;
    enonce: string;
    reponse: string;
    ordre: number;
    difficulte?: number;
};

export async function getQuiz(quizId: number): Promise<Quiz | null> {
    try {
        const q = await api.get<ApiQuiz>(`/api/quiz/${quizId}`);
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
    const qs = await api.get<ApiQuestion[]>(`/api/quiz/${quizId}/questions`);
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

// TODO backend
// - Tentative Quiz / Passer / Exercer (MCD)
export async function submitQuiz(quizId: number, score: number): Promise<QuizResult> {
    // On “consomme” les paramètres pour éviter le warning no-unused-vars,
    // tout en gardant une signature compatible avec le frontend.
    void quizId;
    void score;

    throw new Error("submitQuiz: endpoint backend non défini (TODO)");
}

export async function listMyResults(): Promise<QuizResult[]> {
    return [];
}

export async function listAllQuizzes(): Promise<Quiz[]> {
    return [];
}

export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    void moduleNom;
    return [];
}

