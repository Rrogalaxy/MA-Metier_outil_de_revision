/**
 * mockDb.ts
 * ---------
 * Ce fichier simule une “base de données” côté frontend.
 *
 * Pourquoi ?
 * - Tant que le backend (API + DB) n’est pas prêt, on a quand même besoin de données
 *   pour tester l’application (pages, composants, navigation).
 *
 * Comment c’est utilisé ?
 * - Les fichiers dans /services (ex: modules.service.ts) vont “lire” ces constantes
 *   pour renvoyer des données au frontend.
 * - Plus tard, ces services seront remplacés par des appels réseau (fetch/axios) vers l’API.
 */

// On importe UNIQUEMENT les TYPES TypeScript.
// "import type" = ça n’existe qu’au moment du typage, et disparaît en JavaScript final.
import type {
    User,        // correspond à l'entité "Utilisateurs" du MCD
    Module,      // correspond à l'entité "Modules"
    Quiz,        // correspond à l'entité "Quiz"
    Question,    // correspond à l'entité "Questions"
    UserModule,  // correspond à la relation "Travailler" (progression utilisateur par module)
    QuizResult,  // correspond à la relation "Obtenir" (résultats quiz)
    Activity,    // correspond à l'entité "Activites" (planning privé)
} from "../types";

/* ============================================================================
   UTILISATEUR CONNECTÉ (mock)
   ============================================================================
   Dans une vraie application, l’utilisateur connecté serait obtenu via :
   - un login (authentification)
   - puis un token (JWT) ou une session
   Ici on fixe un utilisateur pour simuler “l’élève connecté”.
*/
export const mockUser: User = {
    mail: "eleve@cpnv.ch",     // identifiant (clé) de l’utilisateur
    nom: "Schilter",
    prenom: "Marc",
    numeroAgenda: 1,           // référence au planning / agenda (selon votre MCD)
};

/* ============================================================================
   DONNÉES PARTAGÉES
   ============================================================================
   Ces données sont "communes" à tous les utilisateurs.
   Exemple : une liste de modules, ou des quiz/flashcards utilisables par tout le monde.

   En base de données, elles ne dépendent pas directement d’un utilisateur.
*/

/**
 * Modules (partagés)
 * - Entité "Modules"
 * - Dans le MCD, un module est identifié par son "nom module".
 */
export const mockModules: Module[] = [
    { nom: "Boucles JS" },
    { nom: "SQL" },
    { nom: "HTML/CSS" },
];

/**
 * Quiz (partagés)
 * - Entité "Quiz"
 * - Chaque quiz est rattaché à un module via moduleNom (relation "Concerner")
 * - type = "quiz" ou "flashcard" (dans votre app : deux modes d’entraînement)
 */
export const mockQuizzes: Quiz[] = [
    {
        numeroQuiz: 1,                  // identifiant unique du quiz
        nomQuiz: "Boucles JS – bases",
        dateCreation: "2026-01-10",     // date de création (string ISO YYYY-MM-DD)
        type: "quiz",
        moduleNom: "Boucles JS",        // lien vers le module concerné
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
 * - Entité "Questions"
 * - Chaque question est liée à un quiz via quizId (relation "Contenir")
 * - ordreQuestion sert à afficher les questions dans le bon ordre
 */
export const mockQuestions: Question[] = [
    {
        numeroQuestion: 1,              // identifiant unique de la question
        enonce: "À quoi sert une boucle for ?",
        reponse: "Répéter un bloc",
        ordreQuestion: 1,
        quizId: 1,                      // appartient au quiz numeroQuiz=1
    },
    {
        numeroQuestion: 2,
        enonce: "Différence entre for et while ?",
        reponse: "Condition vs compteur",
        ordreQuestion: 2,
        quizId: 1,
    },
];

/* ============================================================================
   DONNÉES PERSONNELLES
   ============================================================================
   Ces données appartiennent à l’utilisateur connecté.
   Exemple : sa progression sur un module, ses résultats de quiz, ses activités privées.

   Remarque importante :
   - Dans un vrai backend, ces données seraient filtrées par userMail
     (on ne renvoie jamais les infos des autres utilisateurs).
*/

/**
 * Travailler (progression utilisateur)
 * - Relation "Travailler" entre Utilisateurs et Modules
 * - Elle stocke :
 *   - difficulte (auto-évaluation / niveau)
 *   - derniereAlerte (dernière date de rappel)
 *   - prochaineAlerte (prochaine date de rappel)
 */
export const mockUserModules: UserModule[] = [
    {
        userMail: mockUser.mail,        // “à qui appartient cette progression”
        moduleNom: "Boucles JS",        // “sur quel module”
        difficulte: 3,                  // valeur typiquement 1..5
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
 * - Relation "Obtenir" entre Utilisateurs et Quiz
 * - Chaque passage de quiz produit un score + une date de passage.
 */
export const mockQuizResults: QuizResult[] = [
    {
        userMail: mockUser.mail,        // utilisateur qui a passé le quiz
        quizId: 1,                      // quiz concerné (numeroQuiz)
        score: 60,                      // score en %
        datePassage: "2026-01-11",
    },
];

/**
 * Activités / Agender (planning personnel)
 * - Entité "Activites" (ou relation selon votre modèle final)
 * - Ce sont les indisponibilités privées (sport, job, rendez-vous).
 * - Elles servent à calculer les créneaux libres de révision.
 */
export const mockActivities: Activity[] = [
    {
        numeroActivites: 1,             // identifiant unique de l’activité
        userMail: mockUser.mail,        // propriétaire de l’activité
        nomActivite: "Sport",
        date: "2026-01-12",
        heureDebut: "18:00",
        heureFin: "19:00",
        jour: "Lundi",                  // optionnel : aide à l'affichage
    },
];
