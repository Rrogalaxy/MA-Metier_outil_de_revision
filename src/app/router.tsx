/**
 * Import de React.
 *
 * ⚠️ Avec les versions récentes de React, cet import n’est plus toujours obligatoire,
 * mais il est souvent conservé par convention ou pour éviter des problèmes de tooling.
 */
import React from "react";

/**
 * createBrowserRouter vient de React Router.
 *
 * 👉 Il permet de définir la configuration complète des routes de l’application
 * (URL → composant affiché).
 */
import { createBrowserRouter } from "react-router-dom";

/**
 * AppShell est le layout principal de l’application.
 *
 * 👉 Il contient le header, le menu et la zone <Outlet />
 * 👉 Toutes les pages seront affichées *à l’intérieur* de AppShell
 */
import AppShell from "./AppShell";

/**
 * Import des différentes pages de l’application.
 *
 * Chaque page est un composant React :
 * - DashboardPage  → page d’accueil
 * - ModulesPage    → liste des modules
 * - ModuleDetailPage → détail d’un module
 * - QuizPage       → passer un quiz
 * - StatsPage      → statistiques
 * - PlanningPage   → planning hebdomadaire
 */
import DashboardPage from "../pages/DashboardPage";
import ModulesPage from "../pages/ModulesPage";
import ModuleDetailPage from "../pages/ModuleDetailPage";
import QuizPage from "../pages/QuizPage";
import StatsPage from "../pages/StatsPage";
import PlanningPage from "../pages/PlanningPage";

/**
 * Définition du router principal de l’application.
 *
 * 👉 createBrowserRouter reçoit un tableau de routes
 * 👉 Chaque route associe :
 *    - un chemin (path)
 *    - un composant React à afficher (element)
 */
export const router = createBrowserRouter([
    {
        /**
         * Route racine "/"
         *
         * element: <AppShell />
         * → AppShell est toujours affiché à la racine
         * → Les pages enfants s’affichent dans <Outlet />
         */
        path: "/",
        element: <AppShell />,

        /**
         * Routes enfants (imbriquées dans AppShell)
         */
        children: [
            /**
             * Route index
             *
             * 👉 index: true signifie :
             *    - URL = "/"
             *    - page affichée = DashboardPage
             */
            { index: true, element: <DashboardPage /> },

            /**
             * "/modules"
             *
             * 👉 Affiche la liste des modules
             */
            { path: "modules", element: <ModulesPage /> },

            /**
             * "/modules/:moduleNom"
             *
             * 👉 Route dynamique :
             *    - :moduleNom est un paramètre dans l’URL
             *    - Exemple : /modules/Boucles%20JS
             *
             * 👉 Le composant ModuleDetailPage récupère ce paramètre
             *    via useParams()
             */
            { path: "modules/:moduleNom", element: <ModuleDetailPage /> },

            /**
             * "/quiz/:quizId"
             *
             * 👉 Route dynamique pour afficher un quiz précis
             * 👉 quizId est généralement un numéro (ex: /quiz/3)
             */
            { path: "quiz/:quizId", element: <QuizPage /> },

            /**
             * "/stats"
             *
             * 👉 Page des statistiques utilisateur
             */
            { path: "stats", element: <StatsPage /> },

            /**
             * "/planning"
             *
             * 👉 Page planning (calendrier, .ics, activités privées)
             */
            { path: "planning", element: <PlanningPage /> },
        ],
    },
]);
