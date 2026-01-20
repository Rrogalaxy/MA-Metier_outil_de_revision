/**
 * On importe des "types" TypeScript depuis ../types.
 *
 * TypeScript :
 * - un type ne produit aucun code en JavaScript
 * - il sert uniquement à vérifier le code (éviter erreurs)
 *
 * Ici on utilise :
 * - Quiz       : représente un quiz (lié à un module via moduleNom)
 * - QuizResult : représente un résultat (Obtenir : score + datePassage + quizId)
 * - UserModule : représente la relation "Travailler" (difficulté + alertes) pour un utilisateur
 */
import type { Quiz, QuizResult, UserModule } from "../types";

/**
 * RiskLevel : "union type"
 * -> La variable ne peut prendre que l'une de ces valeurs.
 *
 * Cela évite les fautes de frappe et standardise les statuts.
 */
export type RiskLevel = "overdue" | "lowScore" | "soon" | "ok";

/**
 * RiskItem : objet renvoyé au frontend pour afficher une ligne "module à risque".
 *
 * moduleNom : nom du module concerné
 * riskLevel : niveau de risque (overdue / lowScore / soon / ok)
 * reason    : texte prêt à afficher pour expliquer pourquoi c'est à risque
 *
 * Les champs optionnels (avec ?) servent à afficher des détails dans l'UI
 * sans être obligatoires.
 */
export type RiskItem = {
    moduleNom: string;
    riskLevel: RiskLevel;
    reason: string;

    // Données venant de la relation "Travailler" (MCD)
    prochaineAlerte?: string;
    derniereAlerte?: string;
    difficulte?: number;

    // Données venant des résultats "Obtenir" (MCD)
    lastScore?: number;
    lastScoreDate?: string;
};

/**
 * Retourne la date du jour au format ISO "YYYY-MM-DD".
 *
 * Exemple : "2026-01-12"
 *
 * Pourquoi ce format ?
 * - c'est facile à comparer en string (dans une certaine mesure)
 * - et c'est standard pour les dates stockées en DB (DATE)
 */
function isoToday(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Calcule la différence en jours entre deux dates ISO (YYYY-MM-DD).
 *
 * daysDiff(aISO, bISO) = a - b (en jours)
 *
 * Exemple :
 * - daysDiff("2026-01-14", "2026-01-12") -> 2
 * - daysDiff("2026-01-10", "2026-01-12") -> -2
 *
 * Note : "approx" car on arrondit, mais pour un planning scolaire c'est OK.
 */
function daysDiff(aISO: string, bISO: string) {
    // a - b en jours (approx), avec dates ISO YYYY-MM-DD
    const a = new Date(`${aISO}T00:00:00`);
    const b = new Date(`${bISO}T00:00:00`);
    const ms = a.getTime() - b.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
}

/**
 * Calcule le dernier score par module à partir des résultats (Obtenir)
 * + un mapping quiz -> module.
 *
 * Pourquoi on a besoin de quizzes ?
 * - Parce que QuizResult contient quizId, mais ne contient pas directement moduleNom.
 * - Donc on doit retrouver le module via le quiz.
 *
 * Retour : Map
 * - Map est une structure "clé -> valeur" (comme un dictionnaire)
 * - ici : clé = moduleNom (string)
 *         valeur = { score, date }
 *
 * Exemple :
 * lastScoreByModule.get("Boucles JS") -> { score: 60, date: "2026-01-11" }
 */
export function buildLastScoreByModule(
    results: QuizResult[],
    quizzes: Quiz[]
): Map<string, { score: number; date: string }> {

    /**
     * quizToModule : Map quizId -> moduleNom
     * Exemple : quiz 1 -> "Boucles JS"
     */
    const quizToModule = new Map<number, string>();
    for (const q of quizzes) quizToModule.set(q.numeroQuiz, q.moduleNom);

    /**
     * On trie les résultats du plus récent au plus ancien.
     * Pourquoi ?
     * - On veut garder "le dernier score" par module.
     * - Donc on parcourt du plus récent au plus ancien, et on prend le premier.
     */
    const sorted = results.slice().sort((a, b) => b.datePassage.localeCompare(a.datePassage));

    /**
     * lastByModule : Map moduleNom -> {score, date}
     * On va remplir cette map avec le premier résultat (le plus récent) trouvé pour chaque module.
     */
    const lastByModule = new Map<string, { score: number; date: string }>();

    for (const r of sorted) {
        /**
         * On convertit quizId -> moduleNom grâce à quizToModule.
         * Si on n'a pas trouvé le module (données incohérentes), on ignore.
         */
        const moduleNom = quizToModule.get(r.quizId);
        if (!moduleNom) continue;

        /**
         * Si le module n'est pas encore dans lastByModule, alors ce résultat est le plus récent
         * (car on parcourt déjà dans l’ordre décroissant).
         */
        if (!lastByModule.has(moduleNom)) {
            lastByModule.set(moduleNom, { score: r.score, date: r.datePassage });
        }
    }

    return lastByModule;
}

/**
 * computeRiskForModules : fonction principale.
 *
 * Elle transforme une liste de progression "Travailler" (UserModule)
 * + éventuellement les derniers scores
 * -> en une liste d'objets RiskItem prêts à afficher dans le Dashboard.
 *
 * Règles "à risque" (simple, explicable en soutenance) :
 * 1) overdue  : prochaineAlerte <= aujourd’hui
 * 2) lowScore : dernier score < threshold (ex: 70%)
 * 3) soon     : prochaineAlerte dans <= soonDays jours (ex: 2 jours)
 * 4) ok       : le reste
 *
 * Pourquoi ce choix ?
 * - Facile à expliquer
 * - Facile à ajuster
 * - Fonctionne même si on n’a pas encore le vrai algo spaced repetition
 */
export function computeRiskForModules(params: {
    userModules: UserModule[];

    // Map optionnelle : si pas fournie, on utilise une Map vide.
    lastScoreByModule?: Map<string, { score: number; date: string }>;

    // Paramètres optionnels pour tester / configurer.
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

    /**
     * Pour chaque module "Travailler" (progression utilisateur),
     * on calcule son niveau de risque.
     */
    const items: RiskItem[] = userModules.map((um) => {
        const moduleNom = um.moduleNom;

        /**
         * Récupère le dernier score pour ce module (si on en a).
         */
        const last = lastScoreByModule.get(moduleNom);

        /**
         * prochaineAlerte est la date de la prochaine révision prévue.
         * C’est ce champ qui "pilote" la logique spaced repetition / rappels.
         */
        const prochaine = um.prochaineAlerte;

        // ----------------------------
        // 1) OVERDUE : alerte passée ou aujourd'hui
        // ----------------------------
        if (prochaine && prochaine <= todayISO) {
            return {
                moduleNom,
                riskLevel: "overdue",
                reason: `Révision due (prochaine alerte : ${prochaine})`,

                // infos de la relation Travailler
                prochaineAlerte: um.prochaineAlerte,
                derniereAlerte: um.derniereAlerte,
                difficulte: um.difficulte,

                // infos du dernier score (si connu)
                lastScore: last?.score,
                lastScoreDate: last?.date,
            };
        }

        // ----------------------------
        // 2) LOW SCORE : dernier score trop bas
        // ----------------------------
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

        // ----------------------------
        // 3) SOON : alerte proche (dans soonDays jours)
        // ----------------------------
        if (prochaine) {
            const diff = daysDiff(prochaine, todayISO); // prochaine - today

            // diff >= 0 : prochaine date dans le futur
            // diff <= soonDays : proche
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

        // ----------------------------
        // 4) OK : rien d'urgent
        // ----------------------------
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

    /**
     * Tri final :
     * - On veut afficher d'abord les plus urgents
     *   overdue -> lowScore -> soon -> ok
     * - Puis, à risque égal : tri alphabétique par moduleNom
     *
     * order est une table de correspondance riskLevel -> priorité numérique.
     */
    const order: Record<RiskLevel, number> = { overdue: 0, lowScore: 1, soon: 2, ok: 3 };

    items.sort((a, b) => {
        const da = order[a.riskLevel] - order[b.riskLevel];
        if (da !== 0) return da;
        return a.moduleNom.localeCompare(b.moduleNom);
    });

    return items;
}

/**
 * Helper pratique :
 * renvoie uniquement les modules qui ne sont pas "ok".
 *
 * Utilisation :
 * - Sur Dashboard : afficher seulement les modules qui nécessitent une révision.
 */
export function onlyAtRisk(items: RiskItem[]): RiskItem[] {
    return items.filter((i) => i.riskLevel !== "ok");
}
