import { fakeDelay } from "./api";
import { mockQuizzes, mockQuestions, mockQuizResults, mockUser } from "./mockDb";
import type { Quiz, Question, QuizResult } from "../types";

export async function listQuizzesByModule(moduleNom: string): Promise<Quiz[]> {
    await fakeDelay();
    return mockQuizzes.filter((q) => q.moduleNom === moduleNom);
}

export async function getQuiz(quizId: number): Promise<Quiz | null> {
    await fakeDelay();
    return mockQuizzes.find((q) => q.numeroQuiz === quizId) ?? null;
}

export async function listQuestions(quizId: number): Promise<Question[]> {
    await fakeDelay();
    return mockQuestions
        .filter((q) => q.quizId === quizId)
        .sort((a, b) => a.ordreQuestion - b.ordreQuestion);
}

export async function listMyResults(): Promise<QuizResult[]> {
    await fakeDelay();
    return mockQuizResults.filter((r) => r.userMail === mockUser.mail);
}

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
