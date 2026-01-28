// src/app/router.tsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import AppShell from "./AppShell";
import RequireAuth from "../components/RequireAuth";

import DashboardPage from "../pages/DashboardPage";
import ModulesPage from "../pages/ModulesPage";
import ModuleDetailPage from "../pages/ModuleDetailPage";
import QuizPage from "../pages/QuizPage";
import StatsPage from "../pages/StatsPage";
import PlanningPage from "../pages/PlanningPage";
import ChooseClassPage from "../pages/ChooseClassPage";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

export const router = createBrowserRouter([
    // Routes publiques
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    // Routes protégées
    {
        element: <RequireAuth />,
        children: [
            {
                path: "/",
                element: <AppShell />,
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: "choose-class", element: <ChooseClassPage /> },

                    { path: "modules", element: <ModulesPage /> },
                    { path: "modules/:moduleNom", element: <ModuleDetailPage /> },

                    { path: "quiz/:quizId", element: <QuizPage /> },
                    { path: "stats", element: <StatsPage /> },
                    { path: "planning", element: <PlanningPage /> },
                ],
            },
        ],
    },

    // fallback (optionnel)
    { path: "*", element: <LoginPage /> },
]);
