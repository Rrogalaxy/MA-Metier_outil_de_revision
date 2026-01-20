/**
 * Imports React
 *
 * - useState : stocke des valeurs locales dans le composant (état)
 * - useEffect : exécute du code au chargement de la page (ou quand une dépendance change)
 * - useMemo : mémorise un calcul pour éviter de recalculer à chaque rendu
 * - CSSProperties : type TS pour les objets style
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";

/**
 * React Router
 * - Link : lien interne, navigation sans recharger toute la page
 */
import { Link } from "react-router-dom";

/**
 * Services planning (activités privées)
 * - listMyActivities() : liste des activités privées de l'élève
 * - addMyActivity() : ajoute une activité privée
 * - deleteMyActivity() : supprime une activité privée
 */
import { addMyActivity, deleteMyActivity, listMyActivities } from "../services/planning.service";

/**
 * Services horaire scolaire (.ics)
 * - getSchoolEvents() : récupère les cours déjà importés
 * - importSchoolIcs(text) : parse + stocke les cours à partir d’un fichier .ics
 * - clearSchoolEvents() : efface tous les cours importés
 */
import { clearSchoolEvents, getSchoolEvents, importSchoolIcs } from "../services/schoolSchedule.service";

/**
 * Types TypeScript
 * - Activity : activité privée (MCD: Activités / Agender)
 * - IcsEvent : événement importé du .ics (cours)
 */
import type { Activity } from "../types";
import type { IcsEvent } from "../lib/ics";

/**
 * FormState : décrit l'état du formulaire.
 * -> formulaire "contrôlé" : les valeurs viennent du state React.
 */
type FormState = {
    nomActivite: string;
    date: string;       // YYYY-MM-DD
    heureDebut: string; // HH:MM
    heureFin: string;   // HH:MM
};

/**
 * todayISO() : renvoie la date du jour au format "YYYY-MM-DD"
 */
function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Validation simple pour une heure au format "HH:MM"
 * Regex : ^\d{2}:\d{2}$
 * - ^ : début de chaîne
 * - \d{2} : 2 chiffres
 * - : : le caractère ":"
 * - \d{2} : 2 chiffres
 * - $ : fin de chaîne
 */
function isValidTime(t: string) {
    return /^\d{2}:\d{2}$/.test(t);
}

/**
 * Composant PlanningPage
 *
 * Page affichée sur "/planning"
 * Fonctionnalités :
 * - Ajouter / supprimer des activités privées
 * - Importer un horaire scolaire en .ics
 * - Afficher les cours importés et les activités privées
 *
 * (La fusion cours+privé pour créneaux libres est annoncée en "prochaine étape")
 */
export default function PlanningPage() {
    /**
     * loading : vrai quand on charge les activités privées
     * items : liste des activités privées
     * err : message d’erreur éventuel à afficher
     */
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Activity[]>([]);
    const [err, setErr] = useState<string | null>(null);

    /**
     * schoolEvents : liste des cours importés via le .ics
     */
    const [schoolEvents, setSchoolEvents] = useState<IcsEvent[]>([]);

    /**
     * saving : vrai pendant l’ajout d’une activité
     * form : état du formulaire (champs contrôlés)
     */
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({
        nomActivite: "",
        date: todayISO(),
        heureDebut: "18:00",
        heureFin: "19:00",
    });

    /**
     * reloadActivities :
     * Recharge les activités privées depuis le service.
     * - met loading à true
     * - tente de charger
     * - affiche un message d’erreur si besoin
     * - remet loading à false
     */
    async function reloadActivities() {
        setLoading(true);
        setErr(null);
        try {
            const data = await listMyActivities();
            setItems(data);
        } catch {
            setErr("Impossible de charger le planning.");
        } finally {
            setLoading(false);
        }
    }

    /**
     * reloadSchool :
     * Recharge les cours importés.
     * Ici, si ça échoue ce n'est pas "bloquant", donc on n'affiche pas d'erreur.
     */
    async function reloadSchool() {
        try {
            const ev = await getSchoolEvents();
            setSchoolEvents(ev);
        } catch {
            // non critique : on garde silencieux
        }
    }

    /**
     * useEffect(..., [])
     * -> exécuté une seule fois au chargement de la page
     *
     * On charge :
     * - activités privées
     * - cours importés
     */
    useEffect(() => {
        void reloadActivities();
        void reloadSchool();
    }, []);

    /**
     * grouped :
     * Regroupe les activités privées par date pour un affichage plus lisible.
     *
     * Exemple :
     * items = [ (12.01 Sport), (12.01 Job), (13.01 Sport) ]
     * grouped = [
     *   ["2026-01-12", [Sport, Job]],
     *   ["2026-01-13", [Sport]]
     * ]
     *
     * useMemo : on ne recalcule que si items change.
     */
    const grouped = useMemo(() => {
        const map = new Map<string, Activity[]>();

        // On remplit la map date -> activités
        for (const a of items) {
            if (!map.has(a.date)) map.set(a.date, []);
            map.get(a.date)!.push(a);
        }

        // On trie les activités de chaque jour par heure de début
        for (const [d, arr] of map.entries()) {
            arr.sort((x, y) => x.heureDebut.localeCompare(y.heureDebut));
            map.set(d, arr);
        }

        // On transforme la map en tableau trié par date
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [items]);

    /**
     * canSubmit :
     * Détermine si le formulaire est valide :
     * - nom >= 2 caractères
     * - date présente
     * - format heures OK
     * - heureDebut < heureFin
     *
     * useMemo : recalcul seulement quand form change.
     */
    const canSubmit = useMemo(() => {
        if (form.nomActivite.trim().length < 2) return false;
        if (!form.date) return false;
        if (!isValidTime(form.heureDebut) || !isValidTime(form.heureFin)) return false;
        return form.heureDebut < form.heureFin;
    }, [form]);

    /**
     * onAdd :
     * Ajoute une activité privée via le service.
     * Puis recharge la liste.
     */
    async function onAdd() {
        if (!canSubmit) return;

        setSaving(true);
        setErr(null);

        try {
            await addMyActivity({
                nomActivite: form.nomActivite.trim(),
                date: form.date,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
            });

            // On vide le champ nom après ajout
            setForm(f => ({ ...f, nomActivite: "" }));

            // On recharge la liste pour voir l’activité ajoutée
            await reloadActivities();
        } catch {
            setErr("Erreur lors de l’ajout.");
        } finally {
            setSaving(false);
        }
    }

    /**
     * onDelete :
     * Supprime une activité privée (par id).
     * Puis recharge la liste.
     */
    async function onDelete(id: number) {
        setErr(null);
        try {
            await deleteMyActivity(id);
            await reloadActivities();
        } catch {
            setErr("Erreur lors de la suppression.");
        }
    }

    /**
     * Rendu JSX
     */
    return (
        <section style={card}>
            {/* Titre + lien retour */}
            <div style={topRow}>
                <div>
                    <h2 style={{ ...h2, marginBottom: 4 }}>Planning</h2>
                    <div style={muted}>Activités personnelles + horaire scolaire importé (.ics)</div>
                </div>
                <Link to="/dashboard" style={btnLink}>← Dashboard</Link>
            </div>

            {/* ====================
                Formulaire activités privées
                ==================== */}
            <div style={{ marginTop: 14 }}>
                <h3 style={h3}>Ajouter une activité (privée)</h3>

                <div style={formGrid}>
                    {/* Champ nom */}
                    <div style={field}>
                        <div style={label}>Nom</div>
                        <input
                            style={input}
                            placeholder="Ex: Sport, job, rendez-vous..."
                            value={form.nomActivite}
                            onChange={(e) => setForm(f => ({ ...f, nomActivite: e.target.value }))}
                        />
                    </div>

                    {/* Champ date */}
                    <div style={field}>
                        <div style={label}>Date</div>
                        <input
                            style={input}
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                        />
                    </div>

                    {/* Champ heure début */}
                    <div style={field}>
                        <div style={label}>Début</div>
                        <input
                            style={input}
                            type="time"
                            value={form.heureDebut}
                            onChange={(e) => setForm(f => ({ ...f, heureDebut: e.target.value }))}
                        />
                    </div>

                    {/* Champ heure fin */}
                    <div style={field}>
                        <div style={label}>Fin</div>
                        <input
                            style={input}
                            type="time"
                            value={form.heureFin}
                            onChange={(e) => setForm(f => ({ ...f, heureFin: e.target.value }))}
                        />
                    </div>

                    {/* Bouton ajouter */}
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button
                            style={btnPrimary}
                            disabled={!canSubmit || saving}
                            onClick={() => void onAdd()}
                        >
                            {saving ? "Ajout…" : "Ajouter"}
                        </button>
                    </div>
                </div>

                {/* Petit message d’aide si formulaire invalide */}
                {!canSubmit && (
                    <div style={{ marginTop: 8, ...muted }}>
                        Astuce : un nom (≥ 2 caractères) + une heure de fin après l’heure de début.
                    </div>
                )}

                {/* Affichage d’erreur si nécessaire */}
                {err && <div style={{ marginTop: 10, ...errorBox }}>{err}</div>}
            </div>

            {/* ====================
                Import .ics (horaire scolaire)
                ==================== */}
            <div style={{ marginTop: 18 }}>
                <h3 style={h3}>Horaire scolaire (.ics)</h3>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Input file :
                        - accept limite les fichiers sélectionnables à .ics
                        - onChange se déclenche quand l'utilisateur choisit un fichier
                    */}
                    <input
                        type="file"
                        accept=".ics,text/calendar"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // On lit le fichier côté navigateur
                            const text = await file.text();

                            // On demande au service d'importer (parser + stocker) les événements
                            const ev = await importSchoolIcs(text);

                            // On met à jour le state avec les événements importés
                            setSchoolEvents(ev);

                            // On reset l'input pour pouvoir réimporter le même fichier si besoin
                            e.currentTarget.value = "";
                        }}
                    />

                    {/* Bouton "effacer l’horaire" */}
                    <button
                        style={btnDanger}
                        onClick={async () => {
                            await clearSchoolEvents();
                            setSchoolEvents([]);
                        }}
                    >
                        Effacer l’horaire
                    </button>

                    <span style={muted}>Cours importés : <b>{schoolEvents.length}</b></span>
                </div>

                {/* Aperçu des cours importés (max 8 pour ne pas surcharger) */}
                {schoolEvents.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {schoolEvents.slice(0, 8).map((c, i) => (
                            <div key={i} style={row}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800 }}>{c.summary}</div>
                                    <div style={muted}>
                                        {c.startISO.slice(0, 10)} • {c.startISO.slice(11, 16)} → {c.endISO.slice(11, 16)}
                                        {c.location ? ` • ${c.location}` : ""}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {schoolEvents.length > 8 && (
                            <div style={muted}>… +{schoolEvents.length - 8} autres cours</div>
                        )}
                    </div>
                )}
            </div>

            {/* ====================
                Liste des activités privées (groupées par date)
                ==================== */}
            <div style={{ marginTop: 18 }}>
                <h3 style={h3}>Mes activités (privées)</h3>

                {loading ? (
                    <div style={muted}>Chargement…</div>
                ) : grouped.length === 0 ? (
                    <div style={muted}>Aucune activité enregistrée.</div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {grouped.map(([date, arr]) => (
                            <div key={date} style={dayCard}>
                                <div style={dayHeader}>
                                    <div style={{ fontWeight: 900 }}>{date}</div>
                                    {/* jour vient potentiellement du backend (si présent) */}
                                    <div style={muted}>{arr[0]?.jour ?? ""}</div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {arr.map((a) => (
                                        <div key={a.numeroActivites} style={row}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800 }}>{a.nomActivite}</div>
                                                <div style={muted}>
                                                    {a.heureDebut} → {a.heureFin}
                                                </div>
                                            </div>

                                            <button
                                                style={btnDanger}
                                                onClick={() => void onDelete(a.numeroActivites)}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note : ce que vous ferez ensuite (fusion pour créneaux libres) */}
            <div style={{ marginTop: 14, ...note }}>
                Prochaine étape : combiner <b>horaire scolaire</b> + <b>activités privées</b> pour calculer automatiquement les créneaux
                disponibles de révision.
            </div>
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

const formGrid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
    gap: 10,
    alignItems: "end",
};

const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const label: CSSProperties = { ...muted, fontSize: 12 };

const input: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    outline: "none",
};

const dayCard: CSSProperties = {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 14,
    padding: 12,
    background: "white",
};

const dayHeader: CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "baseline",
    marginBottom: 8,
};

const row: CSSProperties = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
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

const btnPrimary: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid black",
    background: "black",
    color: "white",
    cursor: "pointer",
};

const btnDanger: CSSProperties = {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    color: "#111",
    cursor: "pointer",
};
