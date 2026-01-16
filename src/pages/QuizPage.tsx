import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuiz, listQuestions, submitQuiz } from "../services/quiz.service";
import type { Question, Quiz } from "../types";

export default function QuizPage() {
    const { quizId } = useParams();
    const id = useMemo(() => Number(quizId), [quizId]);

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [index, setIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [score, setScore] = useState<number | null>(null);

    useEffect(() => {
        if (!Number.isFinite(id)) return;
        getQuiz(id).then(setQuiz);
        listQuestions(id).then(setQuestions);
    }, [id]);

    const q = questions[index];

    async function validate() {
        if (!q) return;
        const ok = answer.trim().toLowerCase() === q.reponse.trim().toLowerCase();
        const nextIndex = index + 1;

        // score POC: % de bonnes réponses
        const currentGood = (score ?? 0) * (index / 100) + (ok ? 1 : 0); // pas parfait mais suffisant pour mock
        if (nextIndex < questions.length) {
            setIndex(nextIndex);
            setAnswer("");
            setScore((currentGood / nextIndex) * 100);
        } else {
            const final = Math.round((currentGood / questions.length) * 100);
            setScore(final);
            await submitQuiz(id, final);
        }
    }

    return (
        <section style={card}>
            <h2 style={h2}>{quiz ? quiz.nomQuiz : "Quiz…"}</h2>
            <div style={muted}>Module: {quiz?.moduleNom ?? "—"}</div>

            {questions.length === 0 ? (
                <div style={{ marginTop: 12, ...muted }}>Aucune question (mock).</div>
            ) : score !== null && index >= questions.length ? (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Score: {Math.round(score)}%</div>
                    <div style={muted}>Résultat enregistré (mock “Obtenir”).</div>
                </div>
            ) : (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700 }}>
                        Question {index + 1}/{questions.length}
                    </div>
                    <div style={{ marginTop: 8 }}>{q?.enonce}</div>

                    <input
                        style={input}
                        placeholder="Ta réponse…"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") void validate();
                        }}
                    />

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button style={btn} onClick={() => void validate()}>
                            Valider
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

const card: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" };
const h2: React.CSSProperties = { margin: "0 0 6px 0", fontSize: 18 };
const muted: React.CSSProperties = { opacity: 0.75, fontSize: 13 };

const input: React.CSSProperties = {
    marginTop: 10,
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const btn: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
};
