import type { Recall } from "../types";

const BASE_INTERVALS_DAYS = [1, 3, 7, 30]; // POC

export function nextIntervalDays(repetitionIndex: number, recall: Recall): number {
    const base = BASE_INTERVALS_DAYS[Math.min(repetitionIndex, BASE_INTERVALS_DAYS.length - 1)];

    // Ajustement simple selon auto-évaluation
    if (recall === "facile") return Math.round(base * 1.5);
    if (recall === "moyen") return base;
    return Math.max(1, Math.round(base * 0.6));
}

export function estimateRetention(repetitionIndex: number): number {
    // POC: monte avec le nombre de révisions, plafonne
    return Math.min(95, 50 + repetitionIndex * 12);
}
