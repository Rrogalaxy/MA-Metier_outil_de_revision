import type { Quiz, QuizResult, UserModule } from "../types";

export type RiskLevel = "overdue" | "lowScore" | "soon" | "ok";

export type RiskItem = {
    moduleNom: string;
    riskLevel: RiskLevel;
    reason: string;

    prochaineAlerte?: string;
    derniereAlerte?: string;
    difficulte?: number;

    lastScore?: number;
    lastScoreDate?: string;
};

function isoToday(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysDiff(aISO: string, bISO: string) {
    // a - b en jours (approx), avec dates ISO YYYY-MM-DD
    const a = new Date(`${aISO}T00:00:00`);
    const b = new Date(`${bISO}T00:00:00`);
    const ms = a.getTime() - b.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Calcule le dernier score par module à partir des résultats (Obtenir) + mapping quiz->module.
 * On passe `quizzes` ici uniquement si tes résultats n’ont pas directement le module.
 */
export function buildLastScoreByModule(
    results: QuizResult[],
    quizzes: Quiz[]
): Map<string, { score: number; date: string }> {
    const quizToModule = new Map<number, string>();
    for (const q of quizzes) quizToModule.set(q.numeroQuiz, q.moduleNom);

    // tri du plus récent au plus ancien
    const sorted = results.slice().sort((a, b) => b.datePassage.localeCompare(a.datePassage));

    const lastByModule = new Map<string, { score: number; date: string }>();
    for (const r of sorted) {
        const moduleNom = quizToModule.get(r.quizId);
        if (!moduleNom) continue;
        if (!lastByModule.has(moduleNom)) {
            lastByModule.set(moduleNom, { score: r.score, date: r.datePassage });
        }
    }
    return lastByModule;
}

/**
 * Règles "à risque" (simple, explicable en soutenance) :
 * - overdue: prochaineAlerte <= today
 * - lowScore: dernier score < threshold
 * - soon: prochaineAlerte dans <= soonDays jours
 * - ok: le reste
 */
export function computeRiskForModules(params: {
    userModules: UserModule[];
    lastScoreByModule?: Map<string, { score: number; date: string }>;
    todayISO?: string;
    lowScoreThreshold?: number; // ex: 70
    soonDays?: number; // ex: 2 jours
}): RiskItem[] {
    const {
        userModules,
        lastScoreByModule = new Map(),
        todayISO = isoToday(),
        lowScoreThreshold = 70,
        soonDays = 2,
    } = params;

    const items: RiskItem[] = userModules.map((um) => {
        const moduleNom = um.moduleNom;

        const last = lastScoreByModule.get(moduleNom);
        const prochaine = um.prochaineAlerte;

        // 1) overdue : prochaine alerte passée ou aujourd’hui
        if (prochaine && prochaine <= todayISO) {
            return {
                moduleNom,
                riskLevel: "overdue",
                reason: `Révision due (prochaine alerte : ${prochaine})`,
                prochaineAlerte: um.prochaineAlerte,
                derniereAlerte: um.derniereAlerte,
                difficulte: um.difficulte,
                lastScore: last?.score,
                lastScoreDate: last?.date,
            };
        }

        // 2) low score : dernier score trop bas
        if (last && last.score < lowScoreThreshold) {
            return {
                moduleNom,
                riskLevel: "lowScore",
                reason: `Score faible (${last.score}%) le ${last.date}`,
                prochaineAlerte: um.prochaineAlerte,
                derniereAlerte: um.derniereAlerte,
                difficulte: um.difficulte,
                lastScore: last.score,
                lastScoreDate: last.date,
            };
        }

        // 3) soon : alerte proche dans <= soonDays
        if (prochaine) {
            const diff = daysDiff(prochaine, todayISO); // prochaine - today
            if (diff >= 0 && diff <= soonDays) {
                return {
                    moduleNom,
                    riskLevel: "soon",
                    reason: `Bientôt à réviser (dans ${diff} jour${diff > 1 ? "s" : ""})`,
                    prochaineAlerte: um.prochaineAlerte,
                    derniereAlerte: um.derniereAlerte,
                    difficulte: um.difficulte,
                    lastScore: last?.score,
                    lastScoreDate: last?.date,
                };
            }
        }

        // 4) OK
        return {
            moduleNom,
            riskLevel: "ok",
            reason: "Rien d’urgent",
            prochaineAlerte: um.prochaineAlerte,
            derniereAlerte: um.derniereAlerte,
            difficulte: um.difficulte,
            lastScore: last?.score,
            lastScoreDate: last?.date,
        };
    });

    // tri : overdue -> lowScore -> soon -> ok, puis alphabétique
    const order: Record<RiskLevel, number> = { overdue: 0, lowScore: 1, soon: 2, ok: 3 };
    items.sort((a, b) => {
        const da = order[a.riskLevel] - order[b.riskLevel];
        if (da !== 0) return da;
        return a.moduleNom.localeCompare(b.moduleNom);
    });

    return items;
}

/**
 * Filtre pratique: ne garder que les modules à afficher dans "À réviser"
 */
export function onlyAtRisk(items: RiskItem[]): RiskItem[] {
    return items.filter((i) => i.riskLevel !== "ok");
}
