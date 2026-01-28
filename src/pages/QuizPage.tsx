// src/pages/QuizPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getQuiz, listQuestions, submitQuiz } from "../services/quiz.service";
import type { Question, Quiz } from "../types";

type AnswerState = {
    questionId: number;
    given: string;
    isCorrect: boolean;
};

function normalize(s: string) {
    return s.trim().toLowerCase();
}

export default function QuizPage() {
    const { quizId } = useParams();
    const id = useMemo(() => Number(quizId), [quizId]);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [index, setIndex] = useState(0);
    const [input, setInput] = useState("");
    const [showAnswer, setShowAnswer] = useState(false);
    const [lastCheck, setLastCheck] = useState<"correct" | "incorrect" | null>(null);

    const [answers, setAnswers] = useState<AnswerState[]>([]);
    const [saving, setSaving] = useState(false);
    const [savedScore, setSavedScore] = useState<number | null>(null);

    const current = questions[index];
    const total = questions.length;

    const mode: "quiz" | "flashcard" = quiz?.type ?? "quiz";
    const isFinished = total > 0 && index >= total;

    const correctCount = useMemo(() => answers.filter((a) => a.isCorrect).length, [answers]);

    const score = useMemo(() => {
        if (total === 0) return 0;
        return Math.round((correctCount / total) * 100);
    }, [correctCount, total]);

    useEffect(() => {
        let alive = true;

        async function load() {
            if (!Number.isFinite(id)) {
                setLoading(false);
                setErr("ID invalide.");
                return;
            }

            setLoading(true);
            setErr(null);

            try {
                const [qz, qs] = await Promise.all([getQuiz(id), listQuestions(id)]);
                if (!alive) return;

                setQuiz(qz);
                setQuestions(qs);

                setIndex(0);
                setInput("");
                setShowAnswer(false);
                setLastCheck(null);
                setAnswers([]);
                setSavedScore(null);

                setLoading(false);
            } catch (e) {
                if (!alive) return;
                setErr(e instanceof Error ? e.message : "Impossible de charger le quiz.");
                setLoading(false);
            }
        }

        void load();
        return () => {
            alive = false;
        };
    }, [id]);

    async function finishAndSave(finalScore: number) {
        setSaving(true);
        try {
            await submitQuiz(id, finalScore); // backend si OK sinon mock (mémoire)
            setSavedScore(finalScore);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Erreur lors de l’enregistrement du score.");
            setSavedScore(finalScore); // on affiche quand même pour la démo
        } finally {
            setSaving(false);
        }
    }

    async function validateQuizAnswer() {
        if (!current) return;

        const given = input;
        const ok = normalize(given) === normalize(current.reponse);

        setAnswers((prev) => [...prev, { questionId: current.numeroQuestion, given, isCorrect: ok }]);
        setLastCheck(ok ? "correct" : "incorrect");
        setShowAnswer(true);
    }

    async function nextAfterFeedback() {
        const next = index + 1;

        setInput("");
        setShowAnswer(false);
        setLastCheck(null);

        if (next >= total) {
            const finalCorrect = answers.filter((a) => a.isCorrect).length;
            const final = total === 0 ? 0 : Math.round((finalCorrect / total) * 100);
            setIndex(next);
            await finishAndSave(final);
            return;
        }

        setIndex(next);
    }

    async function flashcardRate(choice: "facile" | "moyen" | "difficile") {
        if (!current) return;

        const ok = choice !== "difficile";

        setAnswers((prev) => [
            ...prev,
            { questionId: current.numeroQuestion, given: `auto:${choice}`, isCorrect: ok },
        ]);

        setLastCheck(ok ? "correct" : "incorrect");
        setShowAnswer(true);
    }

    async function nextFlashcard() {
        const next = index + 1;

        setShowAnswer(false);
        setLastCheck(null);

        if (next >= total) {
            const finalCorrect = answers.filter((a) => a.isCorrect).length;
            const final = total === 0 ? 0 : Math.round((finalCorrect / total) * 100);
            setIndex(next);
            await finishAndSave(final);
            return;
        }

        setIndex(next);
    }

    function restart() {
        setIndex(0);
        setInput("");
        setShowAnswer(false);
        setLastCheck(null);
        setAnswers([]);
        setSavedScore(null);
        setErr(null);
    }

    const progressPct = total === 0 ? 0 : Math.round((Math.min(index, total) / total) * 100);

    const wrongQuestions = useMemo(() => {
        const wrongIds = new Set(answers.filter((a) => !a.isCorrect).map((a) => a.questionId));
        return questions.filter((q) => wrongIds.has(q.numeroQuestion));
    }, [answers, questions]);

    if (!Number.isFinite(id)) {
        return (
            <section style={card}>
                <h2 style={h2}>Quiz introuvable</h2>
                <div style={muted}>ID invalide.</div>
            </section>
        );
    }

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>{quiz ? quiz.nomQuiz : "Quiz…"}</h2>
                    <div style={muted}>
                        Module: <b>{quiz?.moduleNom ?? "—"}</b> • Mode: <b>{mode}</b>
                    </div>
                </div>

                <Link to="/modules" style={btnLink}>
                    ← Modules
                </Link>
            </div>

            {err && <div style={{ marginTop: 12, ...errorBox }}>{err}</div>}

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : !quiz ? (
                <div style={{ marginTop: 12, ...muted }}>Quiz introuvable.</div>
            ) : total === 0 ? (
                <div style={{ marginTop: 12, ...muted }}>Aucune question pour ce quiz.</div>
            ) : isFinished ? (
                <div style={{ marginTop: 14 }}>
                    <h3 style={h3}>Résultat</h3>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 22, fontWeight: 900 }}>{savedScore ?? score}%</div>
                        <div style={muted}>
                            {correctCount}/{total} correct
                            {saving ? " • Enregistrement…" : savedScore !== null ? " • Enregistré" : ""}
                        </div>
                    </div>

                    {wrongQuestions.length > 0 ? (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>À revoir :</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {wrongQuestions.map((q) => (
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
                        <button style={btn} onClick={restart}>
                            Recommencer
                        </button>
                        <Link to="/stats" style={btnLink}>
                            Voir mes stats
                        </Link>
                    </div>
                </div>
            ) : (
                <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 800 }}>
                            Question {index + 1}/{total}
                        </div>
                        <div style={muted}>
                            Score actuel : <b>{score}%</b>
                        </div>
                    </div>

                    <div style={progressOuter}>
                        <div style={{ ...progressInner, width: `${progressPct}%` }} />
                    </div>

                    <div style={questionBox}>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
                            {current.enonce}
                        </div>

                        {mode === "quiz" ? (
                            <>
                                <input
                                    style={inputStyle}
                                    placeholder="Ta réponse…"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !showAnswer) void validateQuizAnswer();
                                        if (e.key === "Enter" && showAnswer) void nextAfterFeedback();
                                    }}
                                    disabled={showAnswer}
                                />

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
                                    <Feedback
                                        check={lastCheck}
                                        correctAnswer={current.reponse}
                                        onNext={() => void nextAfterFeedback()}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                {!showAnswer ? (
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                        <button style={btnPrimary} onClick={() => setShowAnswer(true)}>
                                            Révéler la réponse
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={answerBox}>
                                            <div style={muted}>Réponse :</div>
                                            <div style={{ fontWeight: 900 }}>{current.reponse}</div>
                                        </div>

                                        {lastCheck === null ? (
                                            <div style={{ marginTop: 10 }}>
                                                <div style={muted}>Auto-évaluation :</div>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                                                    <button style={btn} onClick={() => void flashcardRate("facile")}>
                                                        Facile
                                                    </button>
                                                    <button style={btn} onClick={() => void flashcardRate("moyen")}>
                                                        Moyen
                                                    </button>
                                                    <button style={btn} onClick={() => void flashcardRate("difficile")}>
                                                        Difficile
                                                    </button>
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

            {check === "incorrect" && (
                <div style={{ marginTop: 6, ...muted }}>
                    Bonne réponse : <b>{correctAnswer}</b>
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={btnPrimary} onClick={onNext}>
                    {nextLabel ?? "Question suivante"}
                </button>
            </div>
        </div>
    );
}

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
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
};

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
