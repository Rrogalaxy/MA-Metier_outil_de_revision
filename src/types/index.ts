// ==============================
// TYPES MÉTIER DU FRONTEND
// ==============================
//
// Ce fichier définit les "formes" des données manipulées par le frontend.
// Il est directement ALIGNÉ avec le MCD (Modèle Conceptuel de Données).
//
// 👉 Ces types n’exécutent AUCUN code.
// 👉 Ils servent uniquement à:
//    - sécuriser le code (TypeScript)
//    - documenter le modèle métier
//    - garantir la cohérence frontend / backend
//

// ==============================
// UTILISATEUR
// ==============================
//
// Correspond à l’entité "Utilisateur" du MCD
//
export type User = {
    mail: string;          // Identifiant métier de l'utilisateur (clé logique)
    nom: string;           // Nom de famille
    prenom: string;        // Prénom
    numeroAgenda?: number; // Optionnel : lien vers un agenda (selon MCD)
};

// ==============================
// MODULE (contenu partagé)
// ==============================
//
// Correspond à l’entité "Module" du MCD
// Les modules sont partagés entre tous les utilisateurs
//
export type Module = {
    nom: string; // Clé métier du module (ex: "SQL", "Boucles JS")
};

// ==============================
// QUIZ (contenu partagé)
// ==============================
//
// Correspond à l’entité "Quiz"
// Relation : un Quiz concerne un Module (Concerner)
//
export type Quiz = {
    numeroQuiz: number;      // Clé primaire technique
    nomQuiz: string;         // Nom affiché du quiz
    dateCreation: string;    // Date ISO (YYYY-MM-DD)
    lien?: string;           // Optionnel (ex: lien externe)
    type: "quiz" | "flashcard";
    // ↑ Choix frontend :
    //    - "quiz" = question / réponse à saisir
    //    - "flashcard" = révélation + auto-évaluation

    image?: string;          // Optionnel (illustration du quiz)
    moduleNom: string;       // Clé étrangère logique vers Module (Concerner)
};

// ==============================
// QUESTION (contenu partagé)
// ==============================
//
// Correspond à l’entité "Question"
// Relation : un Quiz contient plusieurs Questions (Contenir)
//
export type Question = {
    numeroQuestion: number; // Clé primaire
    enonce: string;         // Texte de la question
    reponse: string;        // Réponse attendue
    ordreQuestion: number;  // Ordre d’affichage dans le quiz
    quizId: number;         // Clé étrangère logique vers Quiz
};

// ==============================
// PROGRESSION UTILISATEUR / MODULE
// ==============================
//
// Correspond à la relation "Travailler" du MCD
// → données PERSONNELLES à un utilisateur
//
export type UserModule = {
    userMail: string;       // FK vers User
    moduleNom: string;      // FK vers Module
    difficulte: number;     // Niveau perçu (1 = facile, 5 = difficile)
    derniereAlerte?: string; // Date de dernière révision (ISO)
    prochaineAlerte?: string; // Date de prochaine révision (ISO)
};

// ==============================
// RÉSULTATS DE QUIZ
// ==============================
//
// Correspond à la relation "Obtenir" du MCD
// → un utilisateur obtient un score à un quiz
//
export type QuizResult = {
    userMail: string;     // FK vers User
    quizId: number;       // FK vers Quiz
    score: number;        // Score entre 0 et 100
    datePassage: string;  // Date ISO du passage
};

// ==============================
// ACTIVITÉS / PLANNING PERSONNEL
// ==============================
//
// Regroupe les concepts:
// - Activités
// - Agender
// - Appartenir
//
// → utilisé pour le planning personnel + créneaux indisponibles
//
export type Activity = {
    numeroActivites: number; // Clé primaire
    userMail: string;        // FK vers User
    nomActivite: string;     // Nom libre (Sport, Job, Cours, etc.)
    date: string;            // Date ISO (YYYY-MM-DD)
    heureDebut: string;      // Heure début (HH:mm)
    heureFin: string;        // Heure fin (HH:mm)
    jour: string;            // Jour en clair ("Lundi", "Mardi", ...)
    moduleNom?: string;      // Optionnel : activité liée à un module
};
