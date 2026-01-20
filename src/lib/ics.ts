/**
 * TypeScript : on définit la "forme" d'un événement extrait d'un fichier .ics.
 *
 * Un fichier .ics contient des événements (VEVENT) comme "MA-Métier", "Sport", etc.
 *
 * - summary  : le titre de l'événement (ex: "MA-Métier")
 * - location : lieu (optionnel -> ? signifie que ça peut être absent)
 * - startISO : date/heure de début, convertie en ISO local (YYYY-MM-DDTHH:mm:SS)
 * - endISO   : date/heure de fin, convertie en ISO local
 */
export type IcsEvent = {
    summary: string;
    location?: string;
    startISO: string; // YYYY-MM-DDTHH:mm:SS
    endISO: string;
};

/**
 * Certains fichiers iCalendar "plient" les lignes :
 * - si une ligne est trop longue, elle continue sur la ligne suivante
 * - la ligne suivante commence alors par un espace ou une tabulation
 *
 * Exemple (conceptuel) :
 * SUMMARY:Un texte très long...
 *  ...qui continue ici
 *
 * unfoldIcs() "déplie" ces lignes en supprimant :
 *   saut de ligne + espace/tab au début de la ligne suivante
 *
 * Regex : /\r?\n[ \t]/g
 * - \r?\n : saut de ligne Windows ou Linux
 * - [ \t] : un espace ou tabulation juste après le saut de ligne
 * - g     : global (sur tout le texte)
 */
function unfoldIcs(text: string) {
    // ligne pliée iCalendar: \n + espace / tab => continuation
    return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * Convertit une date ICS vers un format ISO "local" simple :
 *
 * Formats ICS courants :
 * 1) 20260112T081500      -> 12.01.2026 08:15:00
 * 2) 20260112T081500Z     -> pareil mais Z = UTC (Zulu time)
 * 3) 20260112             -> événement sur une journée entière (all-day)
 *
 * Ici on ne gère pas de timezone précisément (MVP).
 * - si la date finit par "Z", on enlève juste le Z
 * - on reconstruit "YYYY-MM-DDTHH:mm:SS"
 *
 * ✅ Suffisant pour un MVP de planning affiché semaine,
 * mais à améliorer plus tard si vous devez gérer les fuseaux/reccurences.
 */
function toLocalISOFromIcs(dt: string): string {
    // formats possibles:
    // 20260112T081500
    // 20260112T081500Z
    // 20260112 (all-day) -> on met 00:00
    if (/^\d{8}$/.test(dt)) {
        // Si dt = "YYYYMMDD" (8 chiffres), c'est un all-day
        const y = dt.slice(0, 4);
        const m = dt.slice(4, 6);
        const d = dt.slice(6, 8);
        return `${y}-${m}-${d}T00:00:00`;
    }

    /**
     * dt peut finir par "Z" (= UTC).
     * Ici, on enlève le Z pour garder un format uniforme.
     */
    const raw = dt.endsWith("Z") ? dt.slice(0, -1) : dt;

    // On découpe la string ICS "YYYYMMDDTHHMMSS" en morceaux
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    const hh = raw.slice(9, 11);
    const mm = raw.slice(11, 13);

    /**
     * Certains ICS n'ont pas forcément les secondes,
     * donc on met "00" par défaut.
     */
    const ss = raw.length >= 15 ? raw.slice(13, 15) : "00";

    // Reconstruction ISO simple
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

/**
 * Beaucoup de lignes ICS sont de la forme :
 * "SUMMARY:MA-Métier"
 * "DTSTART:20260112T081500"
 * etc.
 *
 * valueAfterColon() renvoie ce qu'il y a après le ":".
 *
 * - line.indexOf(":") -> position du premier ":"
 * - line.slice(idx + 1) -> sous-chaîne après ":"
 *
 * Si ":" n'existe pas, on renvoie "" pour éviter une erreur.
 */
function valueAfterColon(line: string): string {
    const idx = line.indexOf(":");
    return idx >= 0 ? line.slice(idx + 1) : "";
}

/**
 * parseIcs() : fonction principale.
 *
 * Elle transforme le texte d'un fichier .ics en liste d'événements IcsEvent[].
 *
 * Méthode :
 * 1) On "déplie" le texte (unfold) pour gérer les lignes continues
 * 2) On découpe en lignes
 * 3) On parcourt ligne par ligne
 * 4) Quand on voit BEGIN:VEVENT -> on commence un événement
 * 5) On lit les champs (DTSTART, DTEND, SUMMARY, LOCATION)
 * 6) Quand on voit END:VEVENT -> on finalise et on ajoute dans events[]
 * 7) On filtre et on trie les résultats
 */
export function parseIcs(text: string): IcsEvent[] {
    const unfolded = unfoldIcs(text);
    const lines = unfolded.split(/\r?\n/);

    /**
     * Tableau final d'événements qu'on va remplir.
     */
    const events: IcsEvent[] = [];

    /**
     * inEvent : indique si on est "à l'intérieur" d'un bloc VEVENT.
     * (Entre BEGIN:VEVENT et END:VEVENT)
     */
    let inEvent = false;

    /**
     * Variables temporaires qui stockent les champs du VEVENT en cours.
     *
     * Type string | null :
     * - string : valeur trouvée
     * - null   : pas encore trouvée
     */
    let dtStart: string | null = null;
    let dtEnd: string | null = null;
    let summary: string | null = null;
    let location: string | null = null;

    /**
     * On lit toutes les lignes une à une
     */
    for (const line of lines) {
        // Début d'un événement
        if (line === "BEGIN:VEVENT") {
            inEvent = true;

            // On réinitialise tous les champs pour ce nouvel événement
            dtStart = dtEnd = summary = location = null;
            continue;
        }

        // Fin d'un événement
        if (line === "END:VEVENT") {
            /**
             * On ajoute l'événement seulement si on a un début et une fin.
             * (Sans ça, on ne peut pas l'afficher dans un planning.)
             */
            if (inEvent && dtStart && dtEnd) {
                events.push({
                    // summary?.trim() = si summary existe, enlever espaces inutiles
                    // || "Cours" = valeur par défaut
                    summary: summary?.trim() || "Cours",

                    // location est optionnel (peut être absent dans l'ics)
                    // on renvoie undefined si vide -> plus propre côté affichage
                    location: location?.trim() || undefined,

                    // conversion des dates ICS -> ISO
                    startISO: toLocalISOFromIcs(dtStart),
                    endISO: toLocalISOFromIcs(dtEnd),
                });
            }

            // On sort du mode "dans un événement"
            inEvent = false;
            continue;
        }

        // Si on n'est pas dans un VEVENT, on ignore la ligne
        if (!inEvent) continue;

        /**
         * On détecte les champs qu'on veut.
         * Remarque : DTSTART peut être "DTSTART;TZID=..." ou autre.
         * startsWith("DTSTART") marche quand même.
         */
        if (line.startsWith("DTSTART")) dtStart = valueAfterColon(line);
        else if (line.startsWith("DTEND")) dtEnd = valueAfterColon(line);
        else if (line.startsWith("SUMMARY")) summary = valueAfterColon(line);
        else if (line.startsWith("LOCATION")) location = valueAfterColon(line);
    }

    /**
     * Sécurité :
     * - On garde seulement les events ayant startISO + endISO
     *
     * Tri :
     * - localeCompare sur les strings ISO fonctionne bien car l’ordre ISO
     *   (YYYY-MM-DDTHH:mm:ss) correspond à l’ordre chronologique.
     */
    return events
        .filter(e => e.startISO && e.endISO)
        .sort((a, b) => a.startISO.localeCompare(b.startISO));
}
