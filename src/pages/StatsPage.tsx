import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { listMyResults } from "../services/quiz.service";
import { listAllQuizzes } from "../services/quiz.service";
import type { Quiz, QuizResult } from "../types";

type Row = {
    date: string;
    score: number;
    quizId: number;
    quizName: string;
    moduleNom: string;
    type: "quiz" | "flashcard";
};

function byDateDesc(a: string, b: string) {
    // YYYY-MM-DD -> comparaison lexicographique OK
    return b.localeCompare(a);
}

export default function StatsPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<Row[]>([]);

    // filtres
    const [moduleFilter, setModuleFilter] = useState<string>("__all__");
    const [typeFilter, setTypeFilter] = useState<"__all__" | "quiz" | "flashcard">("__all__");
    const [onlyBelow70, setOnlyBelow70] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);

            const [results, quizzes] = await Promise.all([
                listMyResults(),
                listAllQuizzes(),
            ]);

            if (cancelled) return;

            const quizById = new Map<number, Quiz>();
            quizzes.forEach(q => quizById.set(q.numeroQuiz, q));

            const mapped: Row[] = results
                .map((r: QuizResult) => {
                    const q = quizById.get(r.quizId);
                    return {
                        date: r.datePassage,
                        score: r.score,
                        quizId: r.quizId,
                        quizName: q?.nomQuiz ?? `Quiz #${r.quizId}`,
                        moduleNom: q?.moduleNom ?? "—",
                        type: (q?.type ?? "quiz") as "quiz" | "flashcard",
                    };
                })
                .sort((a, b) => byDateDesc(a.date, b.date));

            setRows(mapped);
            setLoading(false);
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const modules = useMemo(() => {
        const set = new Set(rows.map(r => r.moduleNom).filter(m => m && m !== "—"));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [rows]);

    const filtered = useMemo(() => {
        return rows.filter(r => {
            if (moduleFilter !== "__all__" && r.moduleNom !== moduleFilter) return false;
            if (typeFilter !== "__all__" && r.type !== typeFilter) return false;
            if (onlyBelow70 && r.score >= 70) return false;
            return true;
        });
    }, [rows, moduleFilter, typeFilter, onlyBelow70]);

    const kpis = useMemo(() => {
        const n = rows.length;
        const avg = n === 0 ? 0 : Math.round(rows.reduce((s, r) => s + r.score, 0) / n);
        const best = n === 0 ? 0 : Math.max(...rows.map(r => r.score));
        const last = n === 0 ? "—" : rows[0].date; // déjà trié desc
        return { n, avg, best, last };
    }, [rows]);

    const last10 = useMemo(() => rows.slice(0, 10), [rows]);

    return (
        <section style={card}>
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Statistiques</h2>
                    <div style={muted}>
                        Résultats personnels (MCD : <b>Obtenir</b>) • filtrables • historiques
                    </div>
                </div>
                <Link to="/modules" style={btnLink}>← Modules</Link>
            </div>

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : (
                <>
                    {/* KPIs */}
                    <div style={kpiGrid}>
                        <div style={kpiCard}>
                            <div style={kpiLabel}>Quiz passés</div>
                            <div style={kpiValue}>{kpis.n}</div>
                        </div>
                        <div style={kpiCard}>
                            <div style={kpiLabel}>Moyenne</div>
                            <div style={kpiValue}>{kpis.avg}%</div>
                        </div>
                        <div style={kpiCard}>
                            <div style={kpiLabel}>Meilleur score</div>
                            <div style={kpiValue}>{kpis.best}%</div>
                        </div>
                        <div style={kpiCard}>
                            <div style={kpiLabel}>Dernier passage</div>
                            <div style={kpiValueSmall}>{kpis.last}</div>
                        </div>
                    </div>

                    {/* Mini “graph” des 10 derniers */}
                    <div style={{ marginTop: 14 }}>
                        <h3 style={h3}>Derniers scores</h3>
                        {last10.length === 0 ? (
                            <div style={muted}>Aucun résultat enregistré.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {last10.map((r) => (
                                    <div key={`${r.quizId}-${r.date}`} style={barRow}>
                                        <div style={barLeft}>
                                            <div style={{ fontWeight: 800 }}>{r.score}%</div>
                                            <div style={muted}>{r.moduleNom}</div>
                                        </div>
                                        <div style={barOuter}>
                                            <div style={{ ...barInner, width: `${Math.max(0, Math.min(100, r.score))}%` }} />
                                        </div>
                                        <div style={barRight}>
                                            <div style={muted}>{r.date}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filtres */}
                    <div style={{ marginTop: 16 }}>
                        <h3 style={h3}>Filtrer l’historique</h3>

                        <div style={filtersRow}>
                            <div style={filterItem}>
                                <div style={muted}>Module</div>
                                <select style={select} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                                    <option value="__all__">Tous</option>
                                    {modules.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={filterItem}>
                                <div style={muted}>Type</div>
                                <select
                                    style={select}
                                    value={typeFilter}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === "__all__" || v === "quiz" || v === "flashcard") {
                                            setTypeFilter(v);
                                        }
                                    }}

                                >
                                    <option value="__all__">Tous</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="flashcard">Flashcards</option>
                                </select>
                            </div>

                            <label style={{ ...filterItem, flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={onlyBelow70}
                                    onChange={(e) => setOnlyBelow70(e.target.checked)}
                                />
                                <span style={muted}>Seulement &lt; 70%</span>
                            </label>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div style={{ marginTop: 14 }}>
                        <h3 style={h3}>Historique</h3>

                        {filtered.length === 0 ? (
                            <div style={muted}>Aucun résultat pour ces filtres.</div>
                        ) : (
                            <div style={table}>
                                <div style={{ ...thead, ...trow }}>
                                    <div style={th}>Date</div>
                                    <div style={th}>Module</div>
                                    <div style={th}>Quiz</div>
                                    <div style={th}>Type</div>
                                    <div style={thRight}>Score</div>
                                </div>

                                {filtered.map((r) => (
                                    <div key={`${r.quizId}-${r.date}-${r.score}`} style={trow}>
                                        <div style={td}>{r.date}</div>
                                        <div style={td}>{r.moduleNom}</div>
                                        <div style={td}>
                                            <Link to={`/quiz/${r.quizId}`} style={link}>
                                                {r.quizName}
                                            </Link>
                                        </div>
                                        <div style={td}>{r.type}</div>
                                        <div style={tdRight}><b>{r.score}%</b></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
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
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const btnLink: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};

const kpiGrid: CSSProperties = {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 10,
};

const kpiCard: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "white",
};

const kpiLabel: CSSProperties = { ...muted, marginBottom: 6 };
const kpiValue: CSSProperties = { fontSize: 22, fontWeight: 900 };
const kpiValueSmall: CSSProperties = { fontSize: 16, fontWeight: 900 };

const barRow: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "120px 1fr 120px",
    gap: 10,
    alignItems: "center",
};

const barLeft: CSSProperties = { display: "flex", flexDirection: "column" };
const barRight: CSSProperties = { display: "flex", justifyContent: "flex-end" };

const barOuter: CSSProperties = {
    height: 10,
    borderRadius: 999,
    background: "rgba(0,0,0,0.08)",
    overflow: "hidden",
};

const barInner: CSSProperties = {
    height: "100%",
    borderRadius: 999,
    background: "rgba(0,0,0,0.6)",
};

const filtersRow: CSSProperties = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-end",
};

const filterItem: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 200,
};

const select: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const table: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    overflow: "hidden",
};

const thead: CSSProperties = {
    background: "rgba(0,0,0,0.03)",
    fontWeight: 800,
};

const trow: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "110px 160px 1fr 120px 90px",
    gap: 10,
    padding: "10px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    alignItems: "center",
};

const th: CSSProperties = { fontSize: 12, opacity: 0.8 };
const thRight: CSSProperties = { ...th, textAlign: "right" };
const td: CSSProperties = { fontSize: 13, opacity: 0.95 };
const tdRight: CSSProperties = { ...td, textAlign: "right" };

const link: CSSProperties = {
    color: "#111",
    textDecoration: "underline",
    textUnderlineOffset: 3,
};
