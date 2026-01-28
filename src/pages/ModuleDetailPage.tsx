// src/pages/ModuleDetailPage.tsx
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { listMyModules, upsertMyModule } from "../services/modules.service";
import { listQuizzesByModule } from "../services/quiz.service";
import type { Quiz, UserModule } from "../types";
import { getCache } from "../services/cache";
import { mockUser } from "../services/mockDb";

const TTL = 60_000;

/** YYYY-MM-DD de "today + days" */
function addDaysISO(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Règle simple :
 * - 1 => 7 jours
 * - 5 => 1 jour
 */
function nextAlertDaysFromDifficulty(difficulty: number) {
    const map: Record<number, number> = { 1: 7, 2: 5, 3: 3, 4: 2, 5: 1 };
    return map[Math.max(1, Math.min(5, difficulty))] ?? 3;
}

export default function ModuleDetailPage() {
    const { moduleNom } = useParams();

    const decodedModule = useMemo(() => {
        try {
            return decodeURIComponent(moduleNom ?? "");
        } catch {
            return moduleNom ?? "";
        }
    }, [moduleNom]);

    // ✅ cache key pour mes modules
    const myModulesKey = `modules:mine:${mockUser.mail}`;

    // ✅ 1) init depuis cache (si dispo)
    const cachedMyModules = useMemo(() => {
        return getCache<UserModule[]>(myModulesKey, TTL) ?? null;
    }, [myModulesKey]);

    const initialMine = useMemo(() => {
        if (!decodedModule) return null;
        if (!cachedMyModules) return null;
        return cachedMyModules.find((m) => m.moduleNom === decodedModule) ?? null;
    }, [cachedMyModules, decodedModule]);

    const [myModule, setMyModule] = useState<UserModule | null>(initialMine);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [difficulty, setDifficulty] = useState<number>(initialMine?.difficulte ?? 3);

    // ✅ loading seulement si on n'a aucune donnée à afficher (progression + quizzes vides)
    const [loading, setLoading] = useState(() => initialMine === null);
    const [err, setErr] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        let alive = true;

        async function load() {
            if (!decodedModule) {
                setLoading(false);
                return;
            }

            // si on a déjà qqch à afficher, refresh sans loading
            const shouldShowLoading = myModule === null && quizzes.length === 0;
            if (shouldShowLoading) setLoading(true);

            setErr(null);
            setSaveMsg(null);

            try {
                const [mods, qs] = await Promise.all([
                    listMyModules(), // cache TTL côté service
                    listQuizzesByModule(decodedModule), // smart backend/mock
                ]);

                if (!alive) return;

                const mine = mods.find((m) => m.moduleNom === decodedModule) ?? null;
                setMyModule(mine);
                setQuizzes(qs);

                // si on n'était pas en train de saisir une diff pendant le load,
                // on synchronise la difficulté
                setDifficulty((prev) => {
                    // si l'utilisateur a déjà changé la valeur (diffère de mine),
                    // on respecte son input (sauf si mine=null)
                    if (mine?.difficulte == null) return prev;
                    return prev;
                });

                // On force quand même l'init correcte si mine existe et qu'on n'a jamais changé
                if (mine) setDifficulty(mine.difficulte ?? 3);
            } catch (e) {
                if (!alive) return;

                // erreur seulement si on n'a rien à afficher
                if (myModule === null && quizzes.length === 0) {
                    setErr(e instanceof Error ? e.message : "Impossible de charger le module.");
                }
            } finally {
                if (!alive) return;
                if (shouldShowLoading) setLoading(false);
            }
        }

        void load();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        } catch (e) {
            setSaveMsg(e instanceof Error ? e.message : "Erreur lors de l’enregistrement.");
        } finally {
            setSaving(false);

            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => setSaveMsg(null), 2500);
        }
    }

    if (!decodedModule) {
        return (
            <section style={card}>
                <h2 style={h2}>Module introuvable</h2>
                <div style={muted}>Nom de module invalide.</div>
            </section>
        );
    }

    return (
        <section style={card}>
            <div style={headerRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>{decodedModule}</h2>
                    <div style={muted}>Progression + quiz liés</div>
                </div>

                <Link to="/modules" style={btnLink}>
                    ← Retour
                </Link>
            </div>

            {/* ✅ erreur seulement si pas de contenu */}
            {err && myModule === null && quizzes.length === 0 && (
                <div style={{ marginTop: 12, ...errorBox }}>{err}</div>
            )}

            {loading ? (
                <div style={{ marginTop: 12, ...muted }}>Chargement…</div>
            ) : (
                <div style={grid}>
                    {/* Progression */}
                    <div style={subCard}>
                        <h3 style={h3}>Ma progression</h3>

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

                            <button
                                onClick={() => void saveDifficulty()}
                                style={btnPrimary}
                                disabled={saving}
                            >
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

                    {/* Quiz */}
                    <div style={subCard}>
                        <h3 style={h3}>Quiz & Flashcards</h3>

                        {quizzes.length === 0 ? (
                            <div style={muted}>Aucun quiz disponible.</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {quizzes.map((q) => (
                                    <div key={q.numeroQuiz} style={quizRow}>
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

const quizRow: CSSProperties = {
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

const errorBox: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
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
};

const select: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};
