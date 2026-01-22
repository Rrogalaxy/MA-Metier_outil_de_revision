/**
 * Import de React + hooks
 *
 * - useState : permet de stocker une valeur dans le composant (état local)
 * - useEffect : permet d'exécuter du code quand le composant se charge
 *
 * ⚠️ Note : Avec les versions récentes de React, l'import "React" n’est plus toujours obligatoire,
 * mais il ne gêne pas.
 */
import React, { useEffect, useState } from "react";

/**
 * Link (React Router) :
 * - c'est l'équivalent d'un <a href="..."> mais sans recharger la page
 * - navigation interne "single page app"
 */
import { Link } from "react-router-dom";

/**
 * Service (mock ou backend)
 * - listMyModules() : retourne la liste des modules de l’utilisateur (relation Travailler)
 */
import { listMyModules } from "../services/modules.service";

/**
 * Type TypeScript :
 * - UserModule représente la progression personnelle de l'élève pour un module
 *   (difficulté + prochaines alertes)
 */
import type { UserModule } from "../types";

/**
 * Composant React : ModulesPage
 *
 * Cette page est affichée quand l’URL est "/modules" (router.tsx).
 * Elle affiche les modules "personnels" de l’élève.
 */
export default function ModulesPage() {
    /**
     * myModules : tableau de modules (UserModule[])
     * setMyModules : fonction pour remplacer ce tableau
     *
     * Au début (chargement page), on met [] (vide).
     */
    const [myModules, setMyModules] = useState<UserModule[]>([]);

    /**
     * useEffect(..., [])
     * - le tableau [] signifie "exécuter une seule fois au chargement"
     *
     * On appelle le service listMyModules()
     * puis on met le résultat dans le state via setMyModules.
     *
     * listMyModules() renvoie une Promise, donc on utilise .then(...)
     */
    useEffect(() => {
        listMyModules().then(setMyModules);
    }, []);

    /**
     * JSX : rendu de la page.
     */
    return (
        <section style={card}>
            <h2 style={h2}>Mes modules</h2>

            {/**
             * Affichage conditionnel :
             * - si myModules est vide -> message "Aucun module"
             * - sinon -> on affiche une grille de "tuiles" cliquables
             */}
            {myModules.length === 0 ? (
                <div style={muted}>Aucun module (mock) pour le moment.</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {/**
                     * myModules.map(...) :
                     * - map permet de transformer une liste en une liste d’éléments JSX.
                     *
                     * Chaque élément doit avoir une clé unique (key)
                     * -> ici moduleNom (unique dans nos données)
                     */}
                    {myModules.map((m) => (
                        /**
                         * Link :
                         * - en cliquant, on va sur /modules/<moduleNom>
                         *
                         * encodeURIComponent :
                         * - transforme les espaces / accents pour que ça soit valide dans l’URL
                         *   ex: "Boucles JS" -> "Boucles%20JS"
                         */
                        <Link
                            key={m.moduleNom}
                            to={`/modules/${encodeURIComponent(m.moduleNom)}`}
                            style={tile}
                        >
                            {/* Nom du module */}
                            <div style={{ fontWeight: 800 }}>{m.moduleNom}</div>

                            {/* Données de la relation Travailler */}
                            <div style={muted}>Difficulté: {m.difficulte}</div>
                            <div style={muted}>Prochaine alerte: {m.prochaineAlerte ?? "—"}</div>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    );
}

/* =======================
   Styles (CSS en objets JS)
   ======================= */

/**
 * card : style du conteneur principal
 */
const card: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white"
};

/**
 * h2 : style du titre
 */
const h2: React.CSSProperties = {
    margin: "0 0 10px 0",
    fontSize: 18
};

/**
 * muted : texte "secondaire" (moins important visuellement)
 */
const muted: React.CSSProperties = {
    opacity: 0.75,
    fontSize: 13
};

/**
 * tile : une "tuile" cliquable qui ressemble à une carte
 *
 * textDecoration: "none" :
 * - enlève le soulignement classique des liens
 */
const tile: React.CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 12,
    textDecoration: "none",
    color: "#111",
    background: "white",
};
