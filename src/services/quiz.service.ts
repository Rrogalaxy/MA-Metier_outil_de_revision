// src/services/quiz.service.ts
import { api } from "./http";
import type { Question, Quiz, QuizResult } from "../types";
import { mockQuestions, mockQuizResults, mockQuizzes, mockUser } from "./mockDb";

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

type ApiQuizResult = {
    quizId: number;
    score: number;
    datePassage: string;
    userMail?: string;
};

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

export async function getQuiz(quizId: number): Promise<Quiz | null> {
    try {
        const q = await api.get<ApiQuiz>(`/api/quiz/${quizId}`);
        return {
            numeroQuiz: q.id,
            nomQuiz: q.nom,
            dateCreation: q.dateCreation ?? todayISO(),
            type: q.type,
            image: q.image,
            moduleNom: q.moduleNom,
            lien: undefined,
        };
    } catch {
        return mockQuizzes.find((x) => x.numeroQuiz === quizId) ?? null;
    }
}

export async function listQuestions(quizId: number): Promise<Question[]> {
    try {
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
    } catch {
        return mockQuestions
            .filter((q) => q.quizId === quizId)
            .slice()
            .sort((a, b) => a.ordreQuestion - b.ordreQuestion);
    }
}

export async function submitQuiz(quizId: number, score: number): Promise<QuizResult> {
    try {
        const res = await api.post<ApiQuizResult>(`/api/quiz/${quizId}/submit`, { score });

        return {
            userMail: res.userMail ?? mockUser.mail,
            quizId: res.quizId ?? quizId,
            score: res.score ?? score,
            datePassage: res.datePassage ?? todayISO(),
        };
    } catch {
        // fallback mock (mémoire)
        const created: QuizResult = {
            userMail: mockUser.mail,
            quizId,
            score,
            datePassage: todayISO(),
        };
        mockQuizResults.unshift(created);
        return created;
    }
}

export async function listMyResults(): Promise<QuizResult[]> {
    try {
        const data = await api.get<ApiQuizResult[]>(`/api/my/results`);
        return data
            .slice()
            .map((r) => ({
                userMail: r.userMail ?? mockUser.mail,
                quizId: r.quizId,
                score: r.score,
                datePassage: r.datePassage,
            }))
            .sort((a, b) => (a.datePassage < b.datePassage ? 1 : -1));
    } catch {
        return mockQuizResults
            .filter((r) => r.userMail === mockUser.mail)
            .slice()
            .sort((a, b) => (a.datePassage < b.datePassage ? 1 : -1));
    }
}

export async function listAllQuizzes(): Promise<Quiz[]> {
    try {
        const qs = await api.get<ApiQuiz[]>(`/api/quiz`);
        return qs.map((q) => ({
            numeroQuiz: q.id,
            nomQuiz: q.nom,
            dateCreation: q.dateCreation ?? todayISO(),
            type: q.type,
            image: q.image,
            moduleNom: q.moduleNom,
            lien: undefined,
        }));
    } catch {
        return mockQuizzes.slice();
    }
}

export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    try {
        const qs = await api.get<ApiQuiz[]>(
            `/api/module/${encodeURIComponent(moduleNom)}/quizzes`
        );
        return qs.map((q) => ({
            numeroQuiz: q.id,
            nomQuiz: q.nom,
            dateCreation: q.dateCreation ?? todayISO(),
            type: q.type,
            image: q.image,
            moduleNom: q.moduleNom,
            lien: undefined,
        }));
    } catch {
        return mockQuizzes.filter((q) => q.moduleNom === moduleNom);
    }
}
