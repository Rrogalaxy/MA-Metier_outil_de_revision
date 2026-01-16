import React, { useEffect, useState } from "react";
import { listMyResults } from "../services/quiz.service";
import type { QuizResult } from "../types";

export default function StatsPage() {
    const [results, setResults] = useState<QuizResult[]>([]);

    useEffect(() => {
        listMyResults().then(setResults);
    }, []);

    return (
        <section style={card}>
            <h2 style={h2}>Statistiques</h2>

            {results.length === 0 ? (
                <div style={muted}>Aucun résultat de quiz (mock).</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {results.map((r, i) => (
                        <div key={`${r.quizId}-${r.datePassage}-${i}`} style={row}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>Quiz #{r.quizId}</div>
                                <div style={muted}>Passé le {r.datePassage}</div>
                            </div>
                            <div style={{ fontWeight: 800 }}>{r.score}%</div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

const card: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" };
const h2: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const muted: React.CSSProperties = { opacity: 0.75, fontSize: 13 };
