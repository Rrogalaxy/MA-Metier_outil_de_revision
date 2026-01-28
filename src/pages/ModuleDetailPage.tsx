// src/pages/ModuleDetailPage.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { listMyModulesSmart, upsertMyModule } from "../services/modules.service";
import { listQuizzesByModule } from "../services/quiz.service";
import type { Quiz, UserModule } from "../types";

/* =======================
   Helpers
   ======================= */

function addDaysISO(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function nextAlertDaysFromDifficulty(difficulty: number) {
    const map: Record<number, number> = { 1: 7, 2: 5, 3: 3, 4: 2, 5: 1 };
    return map[Math.max(1, Math.min(5, difficulty))] ?? 3;
}

/* =======================
   Page
   ======================= */

export default function ModuleDetailPage() {
    const { moduleNom } = useParams();

    const decodedModule = useMemo(() => decodeURIComponent(moduleNom ?? ""), [moduleNom]);

    const [myModule, setMyModule] = useState<UserModule | null>(null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    // UI
    const [difficulty, setDifficulty] = useState<number>(3);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    // "api" | "mock" pour la progression perso (Travailler)
    const [source, setSource] = useState<"api" | "mock">("mock");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!decodedModule) return;

            setLoading(true);
            setSaveMsg(null);

            try {
                const [modsRes, qs] = await Promise.all([
                    listMyModulesSmart(),
                    listQuizzesByModule(decodedModule),
                ]);

                if (cancelled) return;

                setSource(modsRes.source);

                const mine = modsRes.items.find((m) => m.moduleNom === decodedModule) ?? null;
                setMyModule(mine);
                setDifficulty(mine?.difficulte ?? 3);
                setQuizzes(qs);
            } catch {
                if (cancelled) return;
                // Même si ça plante, on garde une page affichable
                setMyModule(null);
                setQuizzes([]);
                setDifficulty(3);
            } finally {
                if (cancelled) return;
                setLoading(false);
            }
        }

        void load();

        return () => {
            cancelled = true;
        };
    }, [decodedModule]);

    async function saveDifficulty() {
        if (!decodedModule) return;

        setSaving(true);
        setSaveMsg(null);

        try {
            const today = new Date().toISOString().slice(0, 10);
            const nextDays = nextAlertDaysFromDifficulty(difficulty);

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
            setTimeout(() => setSaveMsg(null), 2500);
        }
    }

    if (!decodedModule) {
        return (
            <section style={card}>
                <h2 style={h2}>Module introuvable</h2>
                <div style={muted}>Nom de module invalide.</div>
                <div style={{ marginTop: 10 }}>
                    <Link to="/modules" style={btnLink}>
                        ← Retour
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section style={card}>
            {/* Header */}
            <div style={headerRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>{decodedModule}</h2>
                    <div style={muted}>
                        Détails du module • progression personnelle + contenus partagés
                    </div>
                    <div style={{ marginTop: 6, ...muted }}>
                        Source progression : <b>{source === "api" ? "Backend ✅" : "Mocks ⚠️"}</b>
                    </div>
                </div>

                <Link to="/modules" style={btnLink}>
                    ← Retour
                </Link>
            </div>

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : (
                <div style={grid}>
                    {/* Col 1 : progression */}
                    <div style={subCard}>
                        <h3 style={h3}>Ma progression (Travailler)</h3>

                        <div style={rowWrap}>
                            <label style={muted}>Difficulté :</label>

                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(Number(e.target.value))}
                                style={select}
                            >
                                <option value={1}>1 – Facile</option>
                                <option value={2}>2</option>
                                <option value={3}>3 – Moyen</option>
                                <option value={4}>4</option>
                                <option value={5}>5 – Difficile</option>
                            </select>

                            <button onClick={() => void saveDifficulty()} style={btnPrimary} disabled={saving}>
                                {saving ? "Enregistrement…" : "Enregistrer"}
                            </button>
                        </div>

                        {saveMsg && <div style={{ marginTop: 10, ...muted }}>{saveMsg}</div>}

                        <div style={{ marginTop: 12 }}>
                            <div style={muted}>
                                Dernière alerte : <b>{myModule?.derniereAlerte ?? "—"}</b>
                            </div>
                            <div style={muted}>
                                Prochaine alerte : <b>{myModule?.prochaineAlerte ?? "—"}</b>
                            </div>
                        </div>

                        <div style={{ marginTop: 12, ...note }}>
                            Relation <b>Travailler</b> : progression personnelle par module.
                        </div>
                    </div>

                    {/* Col 2 : contenus partagés */}
                    <div style={subCard}>
                        <h3 style={h3}>Quiz & Flashcards (partagés)</h3>

                        {quizzes.length === 0 ? (
                            <div style={muted}>
                                Aucun quiz disponible (mock/backend non branché).
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {quizzes.map((q) => (
                                    <div key={q.numeroQuiz} style={row}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 800 }}>{q.nomQuiz}</div>
                                            <div style={muted}>
                                                Type : {q.type} • Créé le {q.dateCreation}
                                            </div>
                                        </div>

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
   Styles
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
