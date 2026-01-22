// ==============================
// POINT D’ENTRÉE DE L’APPLICATION
// ==============================
//
// Ce fichier est le PREMIER code exécuté par le navigateur.
// Il sert à "monter" l’application React dans la page HTML.
//

import React from "react";
// ↑ Import du cœur de React
//   Nécessaire pour utiliser JSX (<Component />)

import ReactDOM from "react-dom/client";
// ↑ Permet à React de s’attacher au DOM du navigateur

import { RouterProvider } from "react-router-dom";
// ↑ Fournit le système de navigation (routing)
//   C’est ce qui permet d’avoir plusieurs pages sans recharger la page

import { router } from "./app/router";
// ↑ Notre configuration de routes (Dashboard, Modules, Planning, etc.)

import "./index.css";
// ↑ Styles globaux appliqués à toute l’application

// ==============================
// MONTAGE DE L’APPLICATION
// ==============================
//
// document.getElementById("root") correspond à <div id="root"></div>
// présent dans index.html.
// React va rendre toute l’application À L’INTÉRIEUR.
//
ReactDOM.createRoot(document.getElementById("root")!).render(
    // React.StrictMode :
    // - active des vérifications supplémentaires en développement
    // - n’a aucun impact en production
    <React.StrictMode>
        {/*
            RouterProvider :
            - active la navigation
            - affiche la page correspondant à l’URL
            - utilise la configuration définie dans app/router.tsx
        */}
        <RouterProvider router={router} />
    </React.StrictMode>
);
