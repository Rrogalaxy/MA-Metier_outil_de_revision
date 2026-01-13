export type Difficulty = "debutant" | "intermediaire" | "avance";
export type Recall = "facile" | "moyen" | "difficile";

export type Module = {
    id: string;
    title: string;
    difficulty: Difficulty;
    estMinutes: number;
    // date de création / première étude
    startDateISO: string;
    // index de répétition (0 = J+1, 1 = J+3, etc.)
    repetitionIndex: number;
    nextReviewISO: string;
    retention: number; // 0..100 (estimation simple pour POC)
};

export type BusySlot = {
    startISO: string;
    endISO: string;
    label: string;
};

export type PlannedSession = {
    id: string;
    moduleId: string;
    startISO: string;
    endISO: string;
};
