/**
 * Imports React
 *
 * - useState : stocker des valeurs locales dans le composant
 * - useEffect : exécuter du code au chargement / quand une valeur change
 * - useMemo : mémoriser un calcul pour éviter des recalculs inutiles
 * - CSSProperties : type TS pour les objets style
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";

/**
 * Imports React Router
 *
 * - Link : lien interne (navigation sans recharger la page)
 * - useParams : permet de récupérer les paramètres dynamiques dans l’URL
 *   Exemple : /modules/Boucles%20JS -> moduleNom = "Boucles%20JS"
 */
import { Link, useParams } from "react-router-dom";

/**
 * Services (appels vers backend ou mock)
 *
 * - listMyModules : récupère les modules "de l’utilisateur" (Travailler)
 * - upsertMyModule : crée ou met à jour la progression pour ce module (Travailler)
 */
import { listMyModules, upsertMyModule } from "../services/modules.service";

/**
 * Service Quiz
 * - listQuizzesByModule : récupère les quiz associés à ce module (contenu partagé)
 */
import { listQuizzesByModule } from "../services/quiz.service";

/**
 * Types (TypeScript)
 *
 * - UserModule : forme de la progression perso (Travailler)
 * - Quiz : forme d’un quiz (partagé, lié à un module)
 */
import type { Quiz, UserModule } from "../types";

/* =======================
   Fonctions utilitaires
   (petites fonctions "helpers")
   ======================= */

/**
 * addDaysISO(days)
 * Ajoute X jours à la date du jour et renvoie "YYYY-MM-DD".
 *
 * Exemple :
 * - aujourd’hui 2026-01-12, addDaysISO(3) -> "2026-01-15"
 */
function addDaysISO(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

/**
 * nextAlertDaysFromDifficulty(difficulty)
 *
 * Règle simple (POC crédible) :
 * - difficulté 1 => révision dans 7 jours
 * - difficulté 5 => révision dans 1 jour
 *
 * Objectif :
 * - plus c’est difficile, plus on revoit vite
 *
 * Record<number, number> :
 * - TypeScript : dictionnaire { clé:number -> valeur:number }
 */
function nextAlertDaysFromDifficulty(difficulty: number) {
    const map: Record<number, number> = { 1: 7, 2: 5, 3: 3, 4: 2, 5: 1 };

    // Math.min / Math.max : on force difficulty à rester entre 1 et 5
    return map[Math.max(1, Math.min(5, difficulty))] ?? 3;
}

/**
 * Composant ModuleDetailPage
 *
 * Affiché sur la route : /modules/:moduleNom
 * Exemple : /modules/Boucles%20JS
 */
export default function ModuleDetailPage() {
    /**
     * useParams() renvoie un objet contenant les paramètres d’URL.
     * Ici : { moduleNom: string | undefined }
     */
    const { moduleNom } = useParams();

    /**
     * decodedModule :
     * moduleNom peut être encodé (espaces/accents) dans l’URL
     * ex: "Boucles%20JS" -> "Boucles JS"
     *
     * useMemo : évite de refaire decodeURIComponent à chaque rendu si moduleNom ne change pas.
     */
    const decodedModule = useMemo(
        () => decodeURIComponent(moduleNom ?? ""),
        [moduleNom]
    );

    /**
     * États principaux :
     *
     * myModule : progression perso pour ce module (relation Travailler)
     * quizzes : quiz/flashcards partagés liés au module
     * loading : vrai pendant le chargement
     */
    const [myModule, setMyModule] = useState<UserModule | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * États UI (interface utilisateur) :
     *
     * difficulty : valeur sélectionnée dans le <select>
     * saving : vrai pendant l’enregistrement
     * saveMsg : message temporaire ("enregistré", "erreur", etc.)
     */
    const [difficulty, setDifficulty] = useState<number>(3);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    /**
     * useEffect : charge les données dès que decodedModule change.
     * - ex: si on change d’URL /modules/SQL -> recharge pour SQL
     */
    useEffect(() => {
        /**
         * cancelled : évite d’appeler setState si on quitte la page avant la fin du chargement.
         */
        let cancelled = false;

        async function load() {
            if (!decodedModule) return;

            setLoading(true);
            setSaveMsg(null);

            /**
             * On charge en parallèle :
             * - listMyModules() : progression perso (Travailler)
             * - listQuizzesByModule(decodedModule) : contenus partagés (Quiz/Questions)
             */
            const [mods, qs] = await Promise.all([
                listMyModules(),
                listQuizzesByModule(decodedModule),
            ]);

            if (cancelled) return;

            /**
             * On cherche le module correspondant dans la progression personnelle.
             * Si pas trouvé : mine = null (l’élève n’a pas encore de progression enregistrée)
             */
            const mine = mods.find(m => m.moduleNom === decodedModule) ?? null;

            setMyModule(mine);
            setQuizzes(qs);

            /**
             * Initialise la difficulté dans l’UI :
             * - si mine existe : on prend la difficulté enregistrée
             * - sinon : on commence à 3 (moyen)
             */
            setDifficulty(mine?.difficulte ?? 3);

            setLoading(false);
        }

        // Lance la fonction async
        void load();

        // Cleanup : appelé quand on quitte la page
        return () => {
            cancelled = true;
        };
    }, [decodedModule]);

    /**
     * saveDifficulty :
     * Enregistre la difficulté + recalcule la prochaine alerte.
     *
     * Dans la version finale :
     * - le backend pourrait calculer la prochaine alerte avec spaced repetition
     * - ici on a une règle simple basée sur la difficulté
     */
    async function saveDifficulty() {
        if (!decodedModule) return;

        setSaving(true);
        setSaveMsg(null);

        try {
            const today = new Date().toISOString().slice(0, 10);
            const nextDays = nextAlertDaysFromDifficulty(difficulty);

            /**
             * upsertMyModule :
             * - "upsert" = update OR insert
             * - si une progression existe déjà -> on la met à jour
             * - sinon -> on la crée
             *
             * On envoie les champs correspondants à la relation Travailler :
             * - difficulte
             * - derniereAlerte
             * - prochaineAlerte
             */
            const saved = await upsertMyModule({
                moduleNom: decodedModule,
                difficulte: difficulty,
                derniereAlerte: today,
                prochaineAlerte: addDaysISO(nextDays),
            });

            setMyModule(saved);
            setSaveMsg("Progression enregistrée.");
        } catch {
            setSaveMsg("Erreur lors de l’enregistrement.");
        } finally {
            setSaving(false);

            // On efface le message après 2.5 secondes
            setTimeout(() => setSaveMsg(null), 2500);
        }
    }

    /**
     * Si moduleNom est vide ou invalide, on affiche un message.
     */
    if (!decodedModule) {
        return (
            <section style={card}>
                <h2 style={h2}>Module introuvable</h2>
            </section>
        );
    }

    /**
     * Rendu JSX (HTML-like)
     */
    return (
        <section style={card}>
            {/* En-tête : titre + bouton retour */}
            <div style={headerRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>{decodedModule}</h2>
                    <div style={muted}>
                        Détails du module • progression personnelle + contenus partagés
                    </div>
                </div>

                <Link to="/modules" style={btnLink}>
                    ← Retour
                </Link>
            </div>

            {/* Chargement / contenu */}
            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : (
                <div style={grid}>
                    {/* ====================
                        Colonne 1 : progression personnelle (Travailler)
                        ==================== */}
                    <div style={subCard}>
                        <h3 style={h3}>Ma progression (Travailler)</h3>

                        <div style={rowWrap}>
                            <label style={muted}>Difficulté :</label>

                            {/* Select : choix de la difficulté */}
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(Number(e.target.value))}
                                style={select}
                            >
                                <option value={1}>1 – Facile</option>
                                <option value={2}>2</option>
                                <option value={3}>3 – Moyen</option>
                                <option value={4}>4</option>
                                <option value={5}>5 – Difficile</option>
                            </select>

                            {/* Bouton enregistrer :
                                disabled={saving} empêche de cliquer plusieurs fois pendant l’envoi
                            */}
                            <button
                                onClick={() => void saveDifficulty()}
                                style={btnPrimary}
                                disabled={saving}
                            >
                                {saving ? "Enregistrement…" : "Enregistrer"}
                            </button>
                        </div>

                        {/* Message de confirmation / erreur */}
                        {saveMsg && <div style={{ marginTop: 10, ...muted }}>{saveMsg}</div>}

                        {/* Affichage des dates d'alerte (progression) */}
                        <div style={{ marginTop: 12 }}>
                            <div style={muted}>
                                Dernière alerte : <b>{myModule?.derniereAlerte ?? "—"}</b>
                            </div>
                            <div style={muted}>
                                Prochaine alerte : <b>{myModule?.prochaineAlerte ?? "—"}</b>
                            </div>
                        </div>

                        {/* Note explicative (utile pour MCD / soutenance) */}
                        <div style={{ marginTop: 12, ...note }}>
                            Relation <b>Travailler</b> : progression personnelle par module.
                        </div>
                    </div>

                    {/* ====================
                        Colonne 2 : contenus partagés (Quiz / Questions)
                        ==================== */}
                    <div style={subCard}>
                        <h3 style={h3}>Quiz & Flashcards (partagés)</h3>

                        {/* Liste des quiz liés au module */}
                        {quizzes.length === 0 ? (
                            <div style={muted}>Aucun quiz disponible.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {quizzes.map(q => (
                                    <div key={q.numeroQuiz} style={row}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800 }}>{q.nomQuiz}</div>
                                            <div style={muted}>
                                                Type : {q.type} • Créé le {q.dateCreation}
                                            </div>
                                        </div>

                                        {/* Lien vers la page quiz */}
                                        <Link to={`/quiz/${q.numeroQuiz}`} style={btn}>
                                            Ouvrir
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: 12, ...note }}>
                            Contenus partagés liés au module (Quiz / Questions).
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

/* =======================
   STYLES (CSS en objets)
   ======================= */

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
};

const subCard: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "white",
};

const headerRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
};

const grid: CSSProperties = {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
};

const row: CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
};

const rowWrap: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
};

const h2: CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const note: CSSProperties = {
    border: "1px dashed rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    opacity: 0.9,
    background: "rgba(0,0,0,0.03)",
};

const btn: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};

const btnPrimary: CSSProperties = {
    ...btn,
    background: "black",
    color: "white",
    border: "1px solid black",
};

const btnLink: CSSProperties = {
    ...btn,
    background: "white",
};

const select: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};
