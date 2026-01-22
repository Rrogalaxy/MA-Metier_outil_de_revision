/**
 * Imports React
 *
 * - useState : stocke un état local (valeurs qui changent et déclenchent un re-render)
 * - useEffect : exécute du code au chargement / quand une dépendance change
 * - useMemo : mémorise un calcul (optimisation + évite recalculs inutiles)
 * - CSSProperties : type TS pour les objets style
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";

/**
 * React Router
 * - useParams : récupérer les paramètres dans l’URL (ex: /quiz/2 -> quizId="2")
 * - Link : lien interne sans recharger la page
 */
import { Link, useParams } from "react-router-dom";

/**
 * Services quiz (mock ou backend)
 * - getQuiz(id) : récupère les infos du quiz (nom, type, module...)
 * - listQuestions(id) : récupère les questions liées au quiz
 * - submitQuiz(id, score) : enregistre un résultat (Obtenir dans votre MCD)
 */
import { getQuiz, listQuestions, submitQuiz } from "../services/quiz.service";

/**
 * Types TypeScript
 * - Quiz : modèle du quiz (nomQuiz, type, moduleNom, etc.)
 * - Question : modèle d’une question (enonce, reponse, ordreQuestion, etc.)
 */
import type { Question, Quiz } from "../types";

/**
 * AnswerState : ce qu’on stocke quand l’utilisateur répond à une question
 * - questionId : identifiant de la question
 * - given : ce qu’il a saisi (quiz) ou "auto:facile/moyen/difficile" (flashcard)
 * - isCorrect : correction (true/false)
 */
type AnswerState = {
    questionId: number;
    given: string;          // réponse saisie (quiz) ou "auto" (flashcards)
    isCorrect: boolean;     // true/false selon correction
};

/**
 * normalize(s)
 * Normalise une chaîne pour comparer des réponses :
 * - trim() : enlève espaces début/fin
 * - toLowerCase() : minuscule
 */
function normalize(s: string) {
    return s.trim().toLowerCase();
}

/**
 * Composant QuizPage
 *
 * Route : /quiz/:quizId
 * Exemple : /quiz/1
 *
 * Fonctionnalités :
 * - mode "quiz" : l'élève saisit une réponse, on vérifie si c'est correct
 * - mode "flashcard" : l'élève révèle la réponse et s'auto-évalue
 * - calcul score + sauvegarde du résultat à la fin
 * - liste des questions ratées à la fin
 */
export default function QuizPage() {
    /**
     * On récupère quizId depuis l’URL
     * -> c'est toujours une string (ou undefined)
     */
    const { quizId } = useParams();

    /**
     * On convertit quizId en nombre.
     * useMemo : ne recalculer que si quizId change.
     *
     * ⚠️ Number(undefined) -> NaN (donc "id invalide")
     */
    const id = useMemo(() => Number(quizId), [quizId]);

    /**
     * Données chargées depuis le service
     */
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * États qui pilotent la progression du quiz
     *
     * index : question courante (0, 1, 2, ...)
     * input : champ de saisie (mode quiz)
     * showAnswer : si true, on montre feedback / réponse (selon mode)
     * lastCheck : dernier résultat (correct / incorrect), sert à afficher ✅/❌
     */
    const [index, setIndex] = useState(0);
    const [input, setInput] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [lastCheck, setLastCheck] = useState<"correct" | "incorrect" | null>(null);

    /**
     * answers : liste de toutes les réponses validées
     * saving : enregistrement du score en cours
     * savedScore : score sauvegardé, null tant qu’on n’a pas fini
     */
    const [answers, setAnswers] = useState<AnswerState[]>([]);
    const [saving, setSaving] = useState(false);
    const [savedScore, setSavedScore] = useState<number | null>(null);

    /**
     * current : question courante (selon index)
     * total : nombre total de questions
     */
    const current = questions[index];
    const total = questions.length;

    /**
     * mode : quiz.type -> "quiz" ou "flashcard"
     * par défaut "quiz" (si quiz pas encore chargé)
     */
    const mode: "quiz" | "flashcard" = quiz?.type ?? "quiz";

    /**
     * isFinished : vrai si on est après la dernière question
     * Exemple : total=10, index=10 => fini
     */
    const isFinished = total > 0 && index >= total;

    /**
     * correctCount : nombre de réponses correctes
     * useMemo : recalcule uniquement si answers change
     */
    const correctCount = useMemo(
        () => answers.filter(a => a.isCorrect).length,
        [answers]
    );

    /**
     * score :
     * - basé sur correctCount / total
     * - arrondi à l'entier
     */
    const score = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((correctCount / total) * 100);
    }, [correctCount, total]);

    /**
     * Chargement des données quiz + questions
     * - déclenché au chargement, puis quand id change
     */
    useEffect(() => {
        let cancelled = false;

        async function load() {
            // sécurité : si id est NaN, on sort
            if (!Number.isFinite(id)) return;

            setLoading(true);

            /**
             * Promise.all -> deux requêtes en parallèle
             * - getQuiz(id) : métadonnées
             * - listQuestions(id) : questions du quiz
             */
            const [qz, qs] = await Promise.all([getQuiz(id), listQuestions(id)]);
            if (cancelled) return;

            // On met à jour le state (déclenche un re-render)
            setQuiz(qz);
            setQuestions(qs);

            // Reset de l’état "session quiz"
            setIndex(0);
            setInput("");
            setShowAnswer(false);
            setLastCheck(null);
            setAnswers([]);
            setSavedScore(null);

            setLoading(false);
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    /**
     * finishAndSave :
     * Enregistre le score final (submitQuiz) puis sauvegarde localement savedScore.
     * saving sert à afficher "Enregistrement..." dans l’UI.
     */
    async function finishAndSave(finalScore: number) {
        setSaving(true);
        try {
            await submitQuiz(id, finalScore);
            setSavedScore(finalScore);
        } finally {
            setSaving(false);
        }
    }

    /**
     * validateQuizAnswer :
     * Mode "quiz" -> compare la saisie à la bonne réponse.
     *
     * 1) calcule ok = true/false
     * 2) ajoute une entrée dans answers
     * 3) affiche feedback (✅/❌) et la bonne réponse si besoin
     */
    async function validateQuizAnswer() {
        if (!current) return;

        const given = input;
        const ok = normalize(given) === normalize(current.reponse);

        setAnswers(prev => [
            ...prev,
            { questionId: current.numeroQuestion, given, isCorrect: ok },
        ]);

        setLastCheck(ok ? "correct" : "incorrect");
        setShowAnswer(true);

        // Ici : on laisse l’utilisateur cliquer "Question suivante" via <Feedback>
    }

    /**
     * nextAfterFeedback :
     * Passe à la prochaine question après avoir montré le feedback.
     * Si on est à la fin -> calcule score final + sauvegarde.
     */
    async function nextAfterFeedback() {
        const next = index + 1;

        // Reset UI pour la question suivante
        setInput("");
        setShowAnswer(false);
        setLastCheck(null);

        // Si c’était la dernière question -> fin
        if (next >= total) {
            const finalCorrect = answers.filter(a => a.isCorrect).length;
            const final = Math.round((finalCorrect / total) * 100);

            setIndex(next);
            await finishAndSave(final);
            return;
        }

        setIndex(next);
    }

    /**
     * flashcardRate :
     * Mode flashcard -> l’élève s’auto-évalue (facile/moyen/difficile).
     * Ici on convertit en "correct" ou "incorrect" :
     * - facile -> correct
     * - moyen -> correct
     * - difficile -> incorrect
     *
     * (Règle simple, remplaçable plus tard par un algo spaced repetition)
     */
    async function flashcardRate(choice: "facile" | "moyen" | "difficile") {
        if (!current) return;

        const ok = choice !== "difficile";

        setAnswers(prev => [
            ...prev,
            { questionId: current.numeroQuestion, given: `auto:${choice}`, isCorrect: ok },
        ]);

        setLastCheck(ok ? "correct" : "incorrect");
        setShowAnswer(true);
    }

    /**
     * nextFlashcard :
     * Passe à la flashcard suivante (logique similaire à nextAfterFeedback)
     */
    async function nextFlashcard() {
        const next = index + 1;

        setShowAnswer(false);
        setLastCheck(null);

        if (next >= total) {
            const finalCorrect = answers.filter(a => a.isCorrect).length;
            const final = Math.round((finalCorrect / total) * 100);

            setIndex(next);
            await finishAndSave(final);
            return;
        }

        setIndex(next);
    }

    /**
     * restart :
     * Remet l’état à zéro (recommencer le quiz)
     */
    function restart() {
        setIndex(0);
        setInput("");
        setShowAnswer(false);
        setLastCheck(null);
        setAnswers([]);
        setSavedScore(null);
    }

    /**
     * progressPct :
     * Pourcentage de progression (barre)
     * - Math.min(index, total) car index peut valoir total à la fin
     */
    const progressPct = total === 0 ? 0 : Math.round((Math.min(index, total) / total) * 100);

    /**
     * wrongQuestions :
     * Liste des questions ratées (pour affichage "à revoir" à la fin)
     *
     * - on récupère les ids ratés via answers
     * - puis on filtre questions
     */
    const wrongQuestions = useMemo(() => {
        const wrongIds = new Set(answers.filter(a => !a.isCorrect).map(a => a.questionId));
        return questions.filter(q => wrongIds.has(q.numeroQuestion));
    }, [answers, questions]);

    /**
     * Si id invalide (NaN) : message d’erreur
     */
    if (!Number.isFinite(id)) {
        return (
            <section style={card}>
                <h2 style={h2}>Quiz introuvable</h2>
                <div style={muted}>ID invalide.</div>
            </section>
        );
    }

    /**
     * Rendu principal
     */
    return (
        <section style={card}>
            {/* Titre + infos + retour */}
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>{quiz ? quiz.nomQuiz : "Quiz…"}</h2>
                    <div style={muted}>
                        Module: <b>{quiz?.moduleNom ?? "—"}</b> • Mode: <b>{mode}</b>
                    </div>
                </div>

                <Link to="/modules" style={btnLink}>← Modules</Link>
            </div>

            {/* États possibles de la page :
                1) loading
                2) pas de question
                3) fini -> résultat
                4) en cours -> question courante
            */}
            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : total === 0 ? (
                <div style={{ marginTop: 12, ...muted }}>Aucune question pour ce quiz.</div>
            ) : isFinished ? (
                /* ========= FIN : affichage résultat ========= */
                <div style={{ marginTop: 14 }}>
                    <h3 style={h3}>Résultat</h3>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 22, fontWeight: 900 }}>{savedScore ?? score}%</div>
                        <div style={muted}>
                            {correctCount}/{total} correct
                            {saving ? " • Enregistrement…" : savedScore !== null ? " • Enregistré" : ""}
                        </div>
                    </div>

                    {/* Liste des questions ratées */}
                    {wrongQuestions.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>À revoir :</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {wrongQuestions.map(q => (
                                    <div key={q.numeroQuestion} style={reviewRow}>
                                        <div style={{ fontWeight: 700 }}>{q.enonce}</div>
                                        <div style={muted}>Bonne réponse : {q.reponse}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ marginTop: 12, ...muted }}>Parfait 🎉 aucune erreur.</div>
                    )}

                    <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button style={btn} onClick={restart}>Recommencer</button>
                        <Link to="/stats" style={btnLink}>Voir mes stats</Link>
                    </div>
                </div>
            ) : (
                /* ========= EN COURS : question courante ========= */
                <div style={{ marginTop: 14 }}>
                    {/* Barre de progression */}
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 800 }}>
                            Question {index + 1}/{total}
                        </div>
                        <div style={muted}>Score actuel : <b>{score}%</b></div>
                    </div>
                    <div style={progressOuter}>
                        <div style={{ ...progressInner, width: `${progressPct}%` }} />
                    </div>

                    {/* Bloc question */}
                    <div style={questionBox}>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
                            {current.enonce}
                        </div>

                        {/* ===== MODE QUIZ : saisie + validation ===== */}
                        {mode === "quiz" ? (
                            <>
                                <input
                                    style={inputStyle}
                                    placeholder="Ta réponse…"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    /**
                                     * onKeyDown : permet de gérer la touche Enter
                                     * - si pas encore de feedback : Enter => valider
                                     * - si feedback affiché : Enter => question suivante
                                     */
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !showAnswer) void validateQuizAnswer();
                                        if (e.key === "Enter" && showAnswer) void nextAfterFeedback();
                                    }}
                                    disabled={showAnswer}
                                />

                                {/* Si on n'a pas encore validé -> bouton "Valider" */}
                                {!showAnswer ? (
                                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                        <button
                                            style={btnPrimary}
                                            onClick={() => void validateQuizAnswer()}
                                            disabled={input.trim().length === 0}
                                        >
                                            Valider
                                        </button>
                                    </div>
                                ) : (
                                    /**
                                     * Si on a validé -> composant Feedback (✅/❌ + bouton suivant)
                                     */
                                    <Feedback
                                        check={lastCheck}
                                        correctAnswer={current.reponse}
                                        onNext={() => void nextAfterFeedback()}
                                    />
                                )}
                            </>
                        ) : (
                            /* ===== MODE FLASHCARD : révéler + auto-évaluation ===== */
                            <>
                                {!showAnswer ? (
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                        {/* Révéler la réponse */}
                                        <button style={btnPrimary} onClick={() => setShowAnswer(true)}>
                                            Révéler la réponse
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Affichage réponse */}
                                        <div style={answerBox}>
                                            <div style={muted}>Réponse :</div>
                                            <div style={{ fontWeight: 900 }}>{current.reponse}</div>
                                        </div>

                                        {/* Tant qu'on n'a pas encore choisi facile/moyen/difficile */}
                                        {lastCheck === null ? (
                                            <div style={{ marginTop: 10 }}>
                                                <div style={muted}>Auto-évaluation :</div>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                                                    <button style={btn} onClick={() => void flashcardRate("facile")}>Facile</button>
                                                    <button style={btn} onClick={() => void flashcardRate("moyen")}>Moyen</button>
                                                    <button style={btn} onClick={() => void flashcardRate("difficile")}>Difficile</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Feedback
                                                check={lastCheck}
                                                correctAnswer={current.reponse}
                                                onNext={() => void nextFlashcard()}
                                                nextLabel="Suivant"
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

/**
 * Feedback : petit composant réutilisable
 *
 * Pourquoi un composant séparé ?
 * - Ça évite de répéter le code pour afficher ✅/❌ + bouton "suivant"
 * - Ça rend QuizPage plus lisible
 */
function Feedback(props: {
    check: "correct" | "incorrect" | null;
    correctAnswer: string;
    onNext: () => void;
    nextLabel?: string;
}) {
    const { check, correctAnswer, onNext, nextLabel } = props;

    return (
        <div style={{ marginTop: 10 }}>
            <div style={check === "correct" ? okStyle : badStyle}>
                {check === "correct" ? "✅ Correct" : "❌ Incorrect"}
            </div>

            {/* Si incorrect, on affiche la bonne réponse */}
            {check === "incorrect" && (
                <div style={{ marginTop: 6, ...mutedStyle }}>
                    Bonne réponse : <b>{correctAnswer}</b>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={btnPrimaryStyle} onClick={onNext}>
                    {nextLabel ?? "Question suivante"}
                </button>
            </div>
        </div>
    );
}

/* =======================
   STYLES
   ======================= */

const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
};

const topRow: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
};

const h2: CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };

const mutedStyle: CSSProperties = { opacity: 0.75, fontSize: 13 };

const progressOuter: CSSProperties = {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    background: "rgba(0,0,0,0.08)",
    overflow: "hidden",
};

const progressInner: CSSProperties = {
    height: "100%",
    borderRadius: 999,
    background: "rgba(0,0,0,0.6)",
};

const questionBox: CSSProperties = {
    marginTop: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "white",
};

const inputStyle: CSSProperties = {
    marginTop: 10,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const answerBox: CSSProperties = {
    marginTop: 10,
    border: "1px dashed rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
};

const reviewRow: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 12,
    padding: 10,
    background: "white",
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

const btnPrimaryStyle: CSSProperties = {
    ...btn,
    background: "black",
    color: "white",
    border: "1px solid black",
};

const btnLink: CSSProperties = {
    ...btn,
    background: "white",
};

const okStyle: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.03)",
    fontWeight: 800,
};

const badStyle: CSSProperties = {
    ...okStyle,
};

/**
 * Petites "alias" pour éviter de répéter les mêmes styles ailleurs dans le fichier
 */
const muted: CSSProperties = mutedStyle;
const btnPrimary: CSSProperties = btnPrimaryStyle;
