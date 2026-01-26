// src/pages/StatsPage.tsx
import { Link } from "react-router-dom";
import { useEffect, useState, type CSSProperties } from "react";
import { listMyResults } from "../services/quiz.service";
import type { QuizResult } from "../types";

export default function StatsPage() {
    const [results, setResults] = useState<QuizResult[]>([]);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const r = await listMyResults();
                setResults(r);
            } catch (e) {
                setErr(e instanceof Error ? e.message : "Impossible de charger les stats");
            }
        })();
    }, []);

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Stats</h2>
                    <div style={muted}>Résultats et progression</div>
                </div>
                <Link to="/" style={btnLink}>
                    ← Dashboard
                </Link>
            </div>

            {err && <div style={{ marginTop: 12, ...errorBox }}>{err}</div>}

            {results.length === 0 ? (
                <div style={{ marginTop: 12, ...muted }}>
                    Aucune statistique disponible pour l’instant (endpoint backend en cours / mock).
                </div>
            ) : (
                <div style={{ marginTop: 12 }}>
                    {results.map((r, i) => (
                        <div key={`${r.quizId}-${r.datePassage}-${i}`} style={row}>
                            <div>
                                <div style={{ fontWeight: 800 }}>Quiz #{r.quizId}</div>
                                <div style={muted}>{r.datePassage}</div>
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 800 }}>{r.score}%</div>
                                <div style={muted}>Score</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
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
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
};

const btnLink: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};

const row: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
};
