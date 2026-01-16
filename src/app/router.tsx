import React from "react";
import { createBrowserRouter } from "react-router-dom";
import AppShell from "./AppShell";

import DashboardPage from "../pages/DashboardPage";
import ModulesPage from "../pages/ModulesPage";
import ModuleDetailPage from "../pages/ModuleDetailPage";
import QuizPage from "../pages/QuizPage";
import StatsPage from "../pages/StatsPage";
import PlanningPage from "../pages/PlanningPage";

export const router = createBrowserRouter([
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
]);
