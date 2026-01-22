/**
 * Import de hooks React + type CSSProperties (TypeScript)
 *
 * - useState : stocke des valeurs "dans" le composant (état)
 * - useEffect : exécute du code quand le composant est chargé (ou quand des dépendances changent)
 * - useMemo : mémorise un calcul (évite de recalculer inutilement à chaque rendu)
 * - CSSProperties : type TypeScript pour vérifier les objets "style={...}"
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";

/**
 * Link vient de React Router.
 * -> C’est un lien interne qui change la page SANS recharger tout le site.
 */
import { Link } from "react-router-dom";

/**
 * Services : ce sont des fonctions qui appellent (ou simulent) le backend.
 * Ici ce sont des mocks pour l’instant.
 *
 * getMe()          : récupère l'utilisateur connecté
 * listMyModules()  : récupère la progression "Travailler" (modules de l'utilisateur)
 * listMyResults()  : récupère les résultats de quiz "Obtenir"
 * listAllQuizzes() : récupère tous les quiz (contenu partagé)
 */
import { getMe } from "../services/user.service";
import { listMyModules } from "../services/modules.service";
import { listAllQuizzes, listMyResults } from "../services/quiz.service";

/**
 * Type User : décrit la forme d’un utilisateur (mail/nom/prenom...)
 * -> TypeScript empêche d’utiliser des champs qui n’existent pas.
 */
import type { User } from "../types";

/**
 * Fonctions "métier" pour calculer les modules à risque.
 *
 * - buildLastScoreByModule : transforme les résultats en "dernier score par module"
 * - computeRiskForModules  : applique les règles "overdue/lowScore/soon/ok"
 * - onlyAtRisk             : filtre pour ne garder que les modules urgents
 * - RiskItem               : type d’une ligne "module à risque" prête à afficher
 */
import {
    buildLastScoreByModule,
    computeRiskForModules,
    onlyAtRisk,
    type RiskItem,
} from "../lib/risk";

/**
 * Composant DashboardPage
 *
 * C’est la page affichée sur la route "/"
 * (voir router.tsx).
 */
export default function DashboardPage() {
    /**
     * me : utilisateur connecté (User ou null si pas encore chargé)
     * loading : vrai quand on est en train de charger les données
     *
     * useState(...) retourne 2 choses :
     * - la valeur actuelle (ex: me)
     * - une fonction pour la changer (ex: setMe)
     */
    const [me, setMe] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * riskItems : liste des modules avec leur niveau de risque.
     * C’est ce qu’on affichera dans "À réviser en priorité".
     */
    const [riskItems, setRiskItems] = useState<RiskItem[]>([]);

    /**
     * useEffect(...) s’exécute lorsque la page se charge.
     *
     * Ici, on charge toutes les données nécessaires :
     * - utilisateur
     * - progression modules (Travailler)
     * - résultats quiz (Obtenir)
     * - quiz (contenu partagé)
     *
     * Le tableau [] à la fin signifie :
     * -> "exécuter une seule fois au montage (au chargement) de la page"
     */
    useEffect(() => {
        /**
         * cancelled est un "drapeau" pour éviter un bug classique :
         * - si l’utilisateur change de page avant la fin du chargement,
         * - on ne veut pas appeler setState sur un composant qui n’existe plus.
         *
         * C’est une mesure de sécurité.
         */
        let cancelled = false;

        /**
         * Fonction asynchrone : on peut utiliser await dedans.
         * (useEffect ne peut pas être async directement, donc on crée une fonction load())
         */
        async function load() {
            setLoading(true);

            /**
             * Promise.all : lance plusieurs appels en parallèle.
             * -> c’est plus rapide que faire await l’un après l’autre.
             */
            const [u, myMods, results, quizzes] = await Promise.all([
                getMe(),
                listMyModules(),
                listMyResults(),
                listAllQuizzes(),
            ]);

            // Si on a quitté la page entre-temps, on stoppe.
            if (cancelled) return;

            // On met l'utilisateur dans l'état
            setMe(u);

            /**
             * On calcule le dernier score par module :
             * - les résultats contiennent quizId
             * - les quiz contiennent moduleNom
             * -> on combine les deux pour savoir "dernier score de Boucles JS"
             */
            const lastScoreByModule = buildLastScoreByModule(results, quizzes);

            /**
             * On calcule le niveau de risque des modules selon des règles simples.
             *
             * lowScoreThreshold = 70 :
             * -> en dessous de 70%, on considère que c’est un module "à risque"
             *
             * soonDays = 2 :
             * -> si la prochaine alerte est dans 2 jours, on affiche "Bientôt"
             */
            const items = computeRiskForModules({
                userModules: myMods,
                lastScoreByModule,
                lowScoreThreshold: 70,
                soonDays: 2,
            });

            // On stocke les résultats calculés dans l'état
            setRiskItems(items);

            // Fin du chargement
            setLoading(false);
        }

        // On lance le chargement
        void load();

        /**
         * Cleanup : exécuté quand le composant est "démonté" (quand on quitte la page).
         * On met cancelled = true pour éviter les setState après démontage.
         */
        return () => {
            cancelled = true;
        };
    }, []);

    /**
     * useMemo : on mémorise le résultat de onlyAtRisk(riskItems).
     *
     * Ici ce n'est pas obligatoire (liste petite),
     * mais c’est une bonne pratique quand on veut éviter des recalculs.
     *
     * Le calcul ne se refait que si riskItems change.
     */
    const atRisk = useMemo(() => onlyAtRisk(riskItems), [riskItems]);

    /**
     * Rendu JSX.
     *
     * JSX = "HTML dans du JavaScript".
     * On peut mettre du code entre { ... }.
     */
    return (
        <section style={card}>
            <h2 style={h2}>Dashboard</h2>

            {/* Message de bienvenue : si me est chargé, on affiche le prénom/nom, sinon "..." */}
            <p style={muted}>
                Bienvenue{" "}
                {me ? (
                    <b>
                        {me.prenom} {me.nom}
                    </b>
                ) : (
                    "…"
                )}{" "}
                — version “finale” (routes + services mock).
            </p>

            {/* Affichage conditionnel :
                - si loading = true -> "Chargement…"
                - sinon -> on affiche la liste des modules à risque
            */}
            {loading ? (
                <div style={{ ...muted, marginTop: 10 }}>Chargement…</div>
            ) : (
                <>
                    <div style={{ marginTop: 14 }}>
                        <h3 style={h3}>À réviser en priorité</h3>

                        {/* Si aucun module urgent, on affiche un message */}
                        {atRisk.length === 0 ? (
                            <div style={muted}>Rien d’urgent 🎉</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {/* On affiche jusqu'à 6 modules à risque */}
                                {atRisk.slice(0, 6).map((it) => (
                                    <div key={it.moduleNom} style={row}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                                                {/* Nom du module */}
                                                <b>{it.moduleNom}</b>

                                                {/* Badge : texte + style selon le riskLevel */}
                                                <span style={badgeFor(it.riskLevel)}>{labelFor(it.riskLevel)}</span>
                                            </div>

                                            {/* Raison (déjà préparée par computeRiskForModules) */}
                                            <div style={muted}>{it.reason}</div>
                                        </div>

                                        {/* Bouton "Réviser" :
                                            encodeURIComponent gère les espaces/accents dans l'URL
                                            -> /modules/Boucles%20JS
                                        */}
                                        <Link to={`/modules/${encodeURIComponent(it.moduleNom)}`} style={btn}>
                                            Réviser
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Note explicative (utile pour comprendre les règles et pour la soutenance) */}
                    <div style={{ marginTop: 14, ...note }}>
                        Règles actuelles : <b>en retard</b> si prochaine alerte ≤ aujourd’hui, ou <b>score faible</b> si dernier
                        score &lt; 70%, ou <b>bientôt</b> si alerte dans 2 jours.
                    </div>
                </>
            )}
        </section>
    );
}

/* =======================
   Helpers UI (petites fonctions de présentation)
   ======================= */

/**
 * Transforme un RiskLevel en texte lisible dans l'interface.
 */
function labelFor(level: RiskItem["riskLevel"]) {
    if (level === "overdue") return "En retard";
    if (level === "lowScore") return "Score faible";
    if (level === "soon") return "Bientôt";
    return "OK";
}

/**
 * Retourne un objet de style différent selon le RiskLevel.
 *
 * TypeScript :
 * RiskItem["riskLevel"] veut dire "le type exact du champ riskLevel".
 * -> évite d’écrire deux fois RiskLevel.
 */
function badgeFor(level: RiskItem["riskLevel"]): CSSProperties {
    // Style de base commun à tous les badges
    const base: CSSProperties = {
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 12,
        opacity: 0.9,
        background: "white",
        color: "#111",
    };

    // On modifie légèrement la couleur de fond selon le niveau
    if (level === "overdue") return { ...base, background: "rgba(0,0,0,0.08)" };
    if (level === "lowScore") return { ...base, background: "rgba(0,0,0,0.05)" };
    if (level === "soon") return { ...base, background: "rgba(0,0,0,0.03)" };
    return base;
}

/* =======================
   Styles (CSS en objets JS)
   ======================= */

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
};

const row: CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
};

const h2: CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const btn: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};

const note: CSSProperties = {
    border: "1px dashed rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    opacity: 0.9,
    background: "rgba(0,0,0,0.03)",
};
