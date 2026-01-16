import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { getMe } from "../services/user.service";
import { listMyModules } from "../services/modules.service";
import { listAllQuizzes, listMyResults } from "../services/quiz.service";
import type { User } from "../types";
import {
    buildLastScoreByModule,
    computeRiskForModules,
    onlyAtRisk,
    type RiskItem,
} from "../lib/risk";

export default function DashboardPage() {
    const [me, setMe] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [riskItems, setRiskItems] = useState<RiskItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);

            const [u, myMods, results, quizzes] = await Promise.all([
                getMe(),
                listMyModules(),
                listMyResults(),
                listAllQuizzes(),
            ]);

            if (cancelled) return;

            setMe(u);

            const lastScoreByModule = buildLastScoreByModule(results, quizzes);
            const items = computeRiskForModules({
                userModules: myMods,
                lastScoreByModule,
                lowScoreThreshold: 70,
                soonDays: 2,
            });

            setRiskItems(items);
            setLoading(false);
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const atRisk = useMemo(() => onlyAtRisk(riskItems), [riskItems]);

    return (
        <section style={card}>
            <h2 style={h2}>Dashboard</h2>

            <p style={muted}>
                Bienvenue{" "}
                {me ? (
                    <b>
                        {me.prenom} {me.nom}
                    </b>
                ) : (
                    "…"
                )}{" "}
                — version “finale” (routes + services mock).
            </p>

            {loading ? (
                <div style={{ ...muted, marginTop: 10 }}>Chargement…</div>
            ) : (
                <>
                    <div style={{ marginTop: 14 }}>
                        <h3 style={h3}>À réviser en priorité</h3>

                        {atRisk.length === 0 ? (
                            <div style={muted}>Rien d’urgent 🎉</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {atRisk.slice(0, 6).map((it) => (
                                    <div key={it.moduleNom} style={row}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                                                <b>{it.moduleNom}</b>
                                                <span style={badgeFor(it.riskLevel)}>{labelFor(it.riskLevel)}</span>
                                            </div>
                                            <div style={muted}>{it.reason}</div>
                                        </div>

                                        <Link to={`/modules/${encodeURIComponent(it.moduleNom)}`} style={btn}>
                                            Réviser
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 14, ...note }}>
                        Règles actuelles : <b>en retard</b> si prochaine alerte ≤ aujourd’hui, ou <b>score faible</b> si dernier
                        score &lt; 70%, ou <b>bientôt</b> si alerte dans 2 jours.
                    </div>
                </>
            )}
        </section>
    );
}

/* helpers UI */
function labelFor(level: RiskItem["riskLevel"]) {
    if (level === "overdue") return "En retard";
    if (level === "lowScore") return "Score faible";
    if (level === "soon") return "Bientôt";
    return "OK";
}

function badgeFor(level: RiskItem["riskLevel"]): CSSProperties {
    const base: CSSProperties = {
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 12,
        opacity: 0.9,
        background: "white",
        color: "#111",
    };

    if (level === "overdue") return { ...base, background: "rgba(0,0,0,0.08)" };
    if (level === "lowScore") return { ...base, background: "rgba(0,0,0,0.05)" };
    if (level === "soon") return { ...base, background: "rgba(0,0,0,0.03)" };
    return base;
}

/* styles */
const card: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
};

const row: CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
};

const h2: CSSProperties = { margin: "0 0 10px 0", fontSize: 18 };
const h3: CSSProperties = { margin: "0 0 10px 0", fontSize: 14 };
const muted: CSSProperties = { opacity: 0.75, fontSize: 13 };

const btn: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
    textDecoration: "none",
};

const note: CSSProperties = {
    border: "1px dashed rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    opacity: 0.9,
    background: "rgba(0,0,0,0.03)",
};
