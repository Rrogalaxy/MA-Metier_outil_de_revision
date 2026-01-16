import type {
    User,
    Module,
    Quiz,
    Question,
    UserModule,
    QuizResult,
    Activity,
} from "../types";

/**
 * UTILISATEUR CONNECTÉ (mock)
 */
export const mockUser: User = {
    mail: "eleve@cpnv.ch",
    nom: "Schilter",
    prenom: "Marc",
    numeroAgenda: 1,
};

/**
 * =========================
 * DONNÉES PARTAGÉES
 * =========================
 */

/**
 * Modules (partagés)
 */
export const mockModules: Module[] = [
    { nom: "Boucles JS" },
    { nom: "SQL" },
    { nom: "HTML/CSS" },
];

/**
 * Quiz (partagés)
 */
export const mockQuizzes: Quiz[] = [
    {
        numeroQuiz: 1,
        nomQuiz: "Boucles JS – bases",
        dateCreation: "2026-01-10",
        type: "quiz",
        moduleNom: "Boucles JS",
    },
    {
        numeroQuiz: 2,
        nomQuiz: "SQL – SELECT",
        dateCreation: "2026-01-11",
        type: "flashcard",
        moduleNom: "SQL",
    },
];

/**
 * Questions (partagées)
 */
export const mockQuestions: Question[] = [
    {
        numeroQuestion: 1,
        enonce: "À quoi sert une boucle for ?",
        reponse: "Répéter un bloc",
        ordreQuestion: 1,
        quizId: 1,
    },
    {
        numeroQuestion: 2,
        enonce: "Différence entre for et while ?",
        reponse: "Condition vs compteur",
        ordreQuestion: 2,
        quizId: 1,
    },
];

/**
 * =========================
 * DONNÉES PERSONNELLES
 * (mutables → let)
 * =========================
 */

/**
 * Travailler (progression utilisateur)
 */
export const mockUserModules: UserModule[] = [
    {
        userMail: mockUser.mail,
        moduleNom: "Boucles JS",
        difficulte: 3,
        derniereAlerte: "2026-01-11",
        prochaineAlerte: "2026-01-13",
    },
    {
        userMail: mockUser.mail,
        moduleNom: "SQL",
        difficulte: 2,
        derniereAlerte: "2026-01-10",
        prochaineAlerte: "2026-01-14",
    },
];

/**
 * Obtenir (résultats des quiz)
 */
export const mockQuizResults: QuizResult[] = [
    {
        userMail: mockUser.mail,
        quizId: 1,
        score: 60,
        datePassage: "2026-01-11",
    },
];

/**
 * Activités / Agender (planning personnel)
 */
export const mockActivities: Activity[] = [
    {
        numeroActivites: 1,
        userMail: mockUser.mail,
        nomActivite: "Sport",
        date: "2026-01-12",
        heureDebut: "18:00",
        heureFin: "19:00",
        jour: "Lundi",
    },
];
