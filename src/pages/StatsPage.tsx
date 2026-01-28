// src/pages/StatsPage.tsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { listMyResults } from "../services/quiz.service";
import type { QuizResult } from "../types";

export default function StatsPage() {
    const [results, setResults] = useState<QuizResult[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setErr(null);

            try {
                const r = await listMyResults(); // backend si OK sinon mock
                if (!alive) return;
                setResults(r);
                setLoading(false);
            } catch (e) {
                if (!alive) return;
                setErr(e instanceof Error ? e.message : "Impossible de charger les stats");
                setLoading(false);
            }
        }

        void load();
        return () => {
            alive = false;
        };
    }, []);

    const avgScore = useMemo(() => {
        if (results.length === 0) return null;
        const sum = results.reduce((acc, r) => acc + r.score, 0);
        return Math.round(sum / results.length);
    }, [results]);

    const bestScore = useMemo(() => {
        if (results.length === 0) return null;
        return Math.max(...results.map((r) => r.score));
    }, [results]);

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

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : results.length === 0 ? (
                <div style={{ marginTop: 12, ...muted }}>Aucun résultat pour l’instant.</div>
            ) : (
                <>
                    <div style={summaryRow}>
                        <div style={summaryCard}>
                            <div style={summaryLabel}>Tentatives</div>
                            <div style={summaryValue}>{results.length}</div>
                        </div>

                        <div style={summaryCard}>
                            <div style={summaryLabel}>Moyenne</div>
                            <div style={summaryValue}>{avgScore}%</div>
                        </div>

                        <div style={summaryCard}>
                            <div style={summaryLabel}>Meilleur</div>
                            <div style={summaryValue}>{bestScore}%</div>
                        </div>
                    </div>

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
                </>
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

const summaryRow: CSSProperties = {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 10,
};

const summaryCard: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "white",
};

const summaryLabel: CSSProperties = {
    ...muted,
    marginBottom: 4,
};

const summaryValue: CSSProperties = {
    fontSize: 20,
    fontWeight: 900,
};
