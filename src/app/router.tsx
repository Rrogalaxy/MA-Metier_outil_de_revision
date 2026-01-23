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
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

export const router = createBrowserRouter([
    // Routes publiques (pas besoin d'être connecté)
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },

    // Routes protégées
    {
        element: <RequireAuth />, // ✅ garde-fou auth
        children: [
            {
                path: "/",
                element: <AppShell />,
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: "modules", element: <ModulesPage /> },
                    { path: "modules/:moduleNom", element: <ModuleDetailPage /> },
                    { path: "quiz/:quizId", element: <QuizPage /> },
                    { path: "stats", element: <StatsPage /> },
                    { path: "planning", element: <PlanningPage /> },
                ],
            },
        ],
    },
]);
