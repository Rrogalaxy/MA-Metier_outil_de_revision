/**
 * Import des hooks React.
 *
 * - useState : permet de stocker un état local dans un composant
 * - useEffect : permet d’exécuter du code lors du chargement du composant
 *
 * 👉 Ici, ils ne sont pas utilisés directement dans ce fichier,
 * mais ils sont souvent présents dans les composants React.
 */
import { useEffect, useState } from "react";

/**
 * Import des composants de React Router.
 *
 * - Link : lien de navigation interne (équivalent <a>, sans recharger la page)
 * - NavLink : comme Link, mais permet de savoir si le lien est "actif"
 * - Outlet : zone où React Router affiche la page courante
 */
import { Link, NavLink, Outlet } from "react-router-dom";

/**
 * Fonction qui définit le style des liens du menu.
 *
 * 👉 Cette fonction reçoit un objet contenant isActive :
 * - isActive = true  → le lien correspond à la page affichée
 * - isActive = false → lien inactif
 *
 * TypeScript :
 * { isActive: boolean } signifie que isActive est un booléen.
 */
const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: "8px 10px",
    borderRadius: 10,
    textDecoration: "none",
    border: "1px solid rgba(0,0,0,0.12)",
    color: "#111",

    // Si le lien est actif → fond gris clair
    // Sinon → fond blanc
    background: isActive ? "rgba(0,0,0,0.08)" : "white",
});

/**
 * Composant principal AppShell.
 *
 * 👉 En React, un composant est une fonction qui retourne du JSX
 * 👉 JSX ressemble à du HTML, mais c’est en réalité du JavaScript
 *
 * AppShell représente :
 * - le layout général de l’application
 * - le header (titre + navigation)
 * - une zone centrale où les pages s’affichent
 */
export default function AppShell() {
    return (
        /**
         * <div> principal de l’application
         *
         * style = objet JavaScript (pas du CSS classique)
         * fontFamily, padding, maxWidth, margin → styles inline
         */
        <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1100, margin: "0 auto" }}>

            {/* HEADER : titre + menu de navigation */}
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                {/*
                  Link = lien interne React Router
                  to="/" → page d’accueil (Dashboard)
                */}
                <Link to="/" style={{ textDecoration: "none", color: "#111" }}>
                    <h1 style={{ margin: 0, fontSize: 22 }}>Révisions</h1>
                </Link>

                {/*
                  Menu de navigation principal
                  NavLink permet de styliser automatiquement le lien actif
                */}
                <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <NavLink
                        to="/"
                        end
                        style={navLinkStyle}
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/modules"
                        style={navLinkStyle}
                    >
                        Modules
                    </NavLink>

                    <NavLink
                        to="/planning"
                        style={navLinkStyle}
                    >
                        Planning
                    </NavLink>

                    <NavLink
                        to="/stats"
                        style={navLinkStyle}
                    >
                        Stats
                    </NavLink>
                </nav>
            </header>

            {/*
              Zone principale de l’application.
              <Outlet /> est remplacé dynamiquement par React Router
              selon la route actuelle :
              - /           → DashboardPage
              - /modules    → ModulesPage
              - /planning   → PlanningPage
              - /stats      → StatsPage
            */}
            <main style={{ marginTop: 16 }}>
                <Outlet />
            </main>
        </div>
    );
}
