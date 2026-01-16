import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listMyModules } from "../services/modules.service";
import { listQuizzesByModule } from "../services/quiz.service";
import type { Quiz, UserModule } from "../types";

export default function ModuleDetailPage() {
    const { moduleNom } = useParams();
    const decoded = useMemo(() => decodeURIComponent(moduleNom ?? ""), [moduleNom]);

    const [myModule, setMyModule] = useState<UserModule | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);

    useEffect(() => {
        if (!decoded) return;

        listMyModules().then((list) => {
            setMyModule(list.find((m) => m.moduleNom === decoded) ?? null);
        });

        listQuizzesByModule(decoded).then(setQuizzes);
    }, [decoded]);

    if (!decoded) return <div style={muted}>Module introuvable.</div>;

    return (
        <section style={card}>
            <h2 style={h2}>{decoded}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={subCard}>
                    <h3 style={h3}>Ma progression (Travailler)</h3>
                    {myModule ? (
                        <>
                            <div style={muted}>Difficulté: <b>{myModule.difficulte}</b></div>
                            <div style={muted}>Dernière alerte: {myModule.derniereAlerte ?? "—"}</div>
                            <div style={muted}>Prochaine alerte: {myModule.prochaineAlerte ?? "—"}</div>
                        </>
                    ) : (
                        <div style={muted}>Aucune progression personnelle trouvée (mock).</div>
                    )}
                </div>

                <div style={subCard}>
                    <h3 style={h3}>Quiz / Flashcards (partagés)</h3>
                    {quizzes.length === 0 ? (
                        <div style={muted}>Aucun quiz pour ce module (mock).</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {quizzes.map((q) => (
                                <div key={q.numeroQuiz} style={row}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{q.nomQuiz}</div>
                                        <div style={muted}>{q.type} • créé le {q.dateCreation}</div>
                                    </div>
                                    <Link to={`/quiz/${q.numeroQuiz}`} style={btn}>Ouvrir</Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

const card: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.12)", borderRadius: 14, padding: 14, background: "white" };
const subCard: React.CSSProperties = { border: "1px solid rgba(0,0,0,0.10)", borderRadius: 14, padding: 12, background: "white" };
const row: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.08)" };
const h2: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: React.CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };
const muted: React.CSSProperties = { opacity: 0.75, fontSize: 13 };
const btn: React.CSSProperties = { padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)", background: "white", color: "#111", textDecoration: "none" };
