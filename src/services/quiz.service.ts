// src/services/quiz.service.ts
import { api } from "./http";
import type { Question, Quiz, QuizResult } from "../types";
import { mockQuestions, mockQuizResults, mockQuizzes, mockUser } from "./mockDb";
import { getCache, setCache } from "./cache";

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

const TTL = 60_000;

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function mapApiQuiz(q: ApiQuiz): Quiz {
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

function mapApiQuestions(quizId: number, qs: ApiQuestion[]): Question[] {
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

function sortResultsDesc(a: QuizResult, b: QuizResult) {
    return a.datePassage < b.datePassage ? 1 : -1;
}

export async function getQuiz(quizId: number): Promise<Quiz | null> {
    const key = `quiz:one:${quizId}`;
    const cached = getCache<Quiz | null>(key, TTL);
    if (cached) return cached;

    try {
        const q = await api.get<ApiQuiz>(`/api/quiz/${quizId}`);
        const mapped = mapApiQuiz(q);
        setCache(key, mapped);
        return mapped;
    } catch {
        const mapped = mockQuizzes.find((x) => x.numeroQuiz === quizId) ?? null;
        setCache(key, mapped);
        return mapped;
    }
}

export async function listQuestions(quizId: number): Promise<Question[]> {
    const key = `quiz:questions:${quizId}`;
    const cached = getCache<Question[]>(key, TTL);
    if (cached) return cached;

    try {
        const qs = await api.get<ApiQuestion[]>(`/api/quiz/${quizId}/questions`);
        const mapped = mapApiQuestions(quizId, qs);
        setCache(key, mapped);
        return mapped;
    } catch {
        const mapped = mockQuestions
            .filter((q) => q.quizId === quizId)
            .slice()
            .sort((a, b) => a.ordreQuestion - b.ordreQuestion);

        setCache(key, mapped);
        return mapped;
    }
}

export async function submitQuiz(quizId: number, score: number): Promise<QuizResult> {
    try {
        const res = await api.post<ApiQuizResult>(`/api/quiz/${quizId}/submit`, { score });

        const created: QuizResult = {
            userMail: res.userMail ?? mockUser.mail,
            quizId: res.quizId ?? quizId,
            score: res.score ?? score,
            datePassage: res.datePassage ?? todayISO(),
        };

        // ✅ met à jour cache résultats
        const listKey = `quiz:results:${mockUser.mail}`;
        const current = getCache<QuizResult[]>(listKey, TTL) ?? [];
        setCache(listKey, [created, ...current].sort(sortResultsDesc));

        return created;
    } catch {
        // fallback mock (mémoire)
        const created: QuizResult = {
            userMail: mockUser.mail,
            quizId,
            score,
            datePassage: todayISO(),
        };

        mockQuizResults.unshift(created);

        // ✅ met à jour cache résultats
        const listKey = `quiz:results:${mockUser.mail}`;
        setCache(
            listKey,
            mockQuizResults
                .filter((r) => r.userMail === mockUser.mail)
                .slice()
                .sort(sortResultsDesc)
        );

        return created;
    }
}

export async function listMyResults(): Promise<QuizResult[]> {
    const key = `quiz:results:${mockUser.mail}`;
    const cached = getCache<QuizResult[]>(key, TTL);
    if (cached) return cached;

    try {
        const data = await api.get<ApiQuizResult[]>(`/api/my/results`);

        const mapped: QuizResult[] = data
            .slice()
            .map((r) => ({
                userMail: r.userMail ?? mockUser.mail,
                quizId: r.quizId,
                score: r.score,
                datePassage: r.datePassage,
            }))
            .sort(sortResultsDesc);

        setCache(key, mapped);
        return mapped;
    } catch {
        const mapped = mockQuizResults
            .filter((r) => r.userMail === mockUser.mail)
            .slice()
            .sort(sortResultsDesc);

        setCache(key, mapped);
        return mapped;
    }
}

export async function listAllQuizzes(): Promise<Quiz[]> {
    const key = "quiz:all";
    const cached = getCache<Quiz[]>(key, TTL);
    if (cached) return cached;

    try {
        const qs = await api.get<ApiQuiz[]>(`/api/quiz`);
        const mapped = qs.map(mapApiQuiz);
        setCache(key, mapped);
        return mapped;
    } catch {
        const mapped = mockQuizzes.slice();
        setCache(key, mapped);
        return mapped;
    }
}

export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    const key = `quiz:byModule:${moduleNom}`;
    const cached = getCache<Quiz[]>(key, TTL);
    if (cached) return cached;

    try {
        const qs = await api.get<ApiQuiz[]>(
            `/api/module/${encodeURIComponent(moduleNom)}/quizzes`
        );
        const mapped = qs.map(mapApiQuiz);
        setCache(key, mapped);
        return mapped;
    } catch {
        const mapped = mockQuizzes.filter((q) => q.moduleNom === moduleNom);
        setCache(key, mapped);
        return mapped;
    }
}
