// src/services/quiz.service.ts
import { api } from "./http";
import type { Question, Quiz, QuizResult } from "../types";
import { mockQuestions, mockQuizResults, mockQuizzes, mockUser } from "./mockDb";
import { getCache, setCache } from "./cache";
import { fakeDelay } from "./api";

const TTL = 60_000;

type ApiQuiz = {
    id: number;
    nom: string;
    type: "quiz" | "flashcard";
    moduleNom: string;
    dateCreation?: string;
    image?: string;
};

type ApiQuestion = {
    id: number;
    enonce: string;
    reponse: string;
    ordre: number;
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

/* ================= QUIZ ================= */

export async function listAllQuizzes(): Promise<Quiz[]> {
    const key = "quiz:all";
    const cached = getCache<Quiz[]>(key, TTL);
    if (cached) return cached;

    try {
        const qs = await api.get<ApiQuiz[]>("/api/quiz");
        const data = qs.map(mapQuiz);
        setCache(key, data);
        return data;
    } catch {
        await fakeDelay();
        setCache(key, mockQuizzes);
        return mockQuizzes;
    }
}

export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    const key = `quiz:module:${moduleNom}`;
    const cached = getCache<Quiz[]>(key, TTL);
    if (cached) return cached;

    try {
        const qs = await api.get<ApiQuiz[]>(
            `/api/module/${encodeURIComponent(moduleNom)}/quizzes`
        );
        const data = qs.map(mapQuiz);
        setCache(key, data);
        return data;
    } catch {
        await fakeDelay();
        const data = mockQuizzes.filter((q) => q.moduleNom === moduleNom);
        setCache(key, data);
        return data;
    }
}

export async function getQuiz(quizId: number): Promise<Quiz | null> {
    const key = `quiz:${quizId}`;
    const cached = getCache<Quiz | null>(key, TTL);
    if (cached !== null) return cached;

    try {
        const q = await api.get<ApiQuiz>(`/api/quiz/${quizId}`);
        const data = mapQuiz(q);
        setCache(key, data);
        return data;
    } catch {
        await fakeDelay();
        const data = mockQuizzes.find((q) => q.numeroQuiz === quizId) ?? null;
        setCache(key, data);
        return data;
    }
}

/* ================= QUESTIONS ================= */

export async function listQuestions(quizId: number): Promise<Question[]> {
    const key = `quiz:${quizId}:questions`;
    const cached = getCache<Question[]>(key, TTL);
    if (cached) return cached;

    try {
        const qs = await api.get<ApiQuestion[]>(`/api/quiz/${quizId}/questions`);
        const data = qs
            .slice()
            .sort((a, b) => a.ordre - b.ordre)
            .map((q) => ({
                numeroQuestion: q.id,
                enonce: q.enonce,
                reponse: q.reponse,
                ordreQuestion: q.ordre,
                quizId,
            }));
        setCache(key, data);
        return data;
    } catch {
        await fakeDelay();
        const data = mockQuestions
            .filter((q) => q.quizId === quizId)
            .slice()
            .sort((a, b) => a.ordreQuestion - b.ordreQuestion);
        setCache(key, data);
        return data;
    }
}

/* ================= RÉSULTATS ================= */

export async function listMyResults(): Promise<QuizResult[]> {
    const key = `quiz:results:${mockUser.mail}`;
    const cached = getCache<QuizResult[]>(key, TTL);
    if (cached) return cached;

    try {
        const data = await api.get<ApiQuizResult[]>("/api/my/results");
        const out = data
            .map((r) => ({
                userMail: r.userMail ?? mockUser.mail,
                quizId: r.quizId,
                score: r.score,
                datePassage: r.datePassage,
            }))
            .sort((a, b) => (a.datePassage < b.datePassage ? 1 : -1));

        setCache(key, out);
        return out;
    } catch {
        await fakeDelay();
        const out = mockQuizResults
            .filter((r) => r.userMail === mockUser.mail)
            .slice()
            .sort((a, b) => (a.datePassage < b.datePassage ? 1 : -1));

        setCache(key, out);
        return out;
    }
}

export async function submitQuiz(
    quizId: number,
    score: number
): Promise<QuizResult> {
    try {
        const res = await api.post<ApiQuizResult>(
            `/api/quiz/${quizId}/submit`,
            { score }
        );
        return {
            userMail: res.userMail ?? mockUser.mail,
            quizId,
            score,
            datePassage: res.datePassage ?? todayISO(),
        };
    } catch {
        await fakeDelay();
        const created: QuizResult = {
            userMail: mockUser.mail,
            quizId,
            score,
            datePassage: todayISO(),
        };
        mockQuizResults.unshift(created);
        setCache(`quiz:results:${mockUser.mail}`, mockQuizResults);
        return created;
    }
}

/* ================= Utils ================= */

function mapQuiz(q: ApiQuiz): Quiz {
    return {
        numeroQuiz: q.id,
        nomQuiz: q.nom,
        dateCreation: q.dateCreation ?? todayISO(),
        type: q.type,
        image: q.image,
        moduleNom: q.moduleNom,
        lien: undefined,
    };
}
