// Aligné avec le MCD

export type User = {
    mail: string;
    nom: string;
    prenom: string;
    numeroAgenda?: number;
};

// Partagé
export type Module = {
    nom: string; // PK métier selon MCD
};

// Partagé
export type Quiz = {
    numeroQuiz: number; // PK
    nomQuiz: string;
    dateCreation: string; // ISO
    lien?: string;
    type: "quiz" | "flashcard"; // logique côté frontend
    image?: string;
    moduleNom: string; // FK logique (Concerner)
};

// Partagé
export type Question = {
    numeroQuestion: number; // PK
    enonce: string;
    reponse: string;
    ordreQuestion: number;
    quizId: number; // FK logique (Contenir)
};

// Personnel (Travailler)
export type UserModule = {
    userMail: string;
    moduleNom: string;
    difficulte: number; // 1..5 ou similaire
    derniereAlerte?: string; // ISO date
    prochaineAlerte?: string; // ISO date
};

// Personnel (Obtenir)
export type QuizResult = {
    userMail: string;
    quizId: number;
    score: number; // 0..100
    datePassage: string; // ISO date
};

// Personnel (Activites + Agender + Appartenir)
export type Activity = {
    numeroActivites: number;
    userMail: string;
    nomActivite: string;
    date: string; // YYYY-MM-DD
    heureDebut: string; // HH:mm
    heureFin: string; // HH:mm
    jour: string; // ex "Lundi"
    moduleNom?: string; // optionnel si liée à un module
};
