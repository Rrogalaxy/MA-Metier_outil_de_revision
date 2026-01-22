/**
 * TypeScript : forme d’un événement extrait d’un fichier .ics
 */
export type IcsEvent = {
    summary: string;
    location?: string;
    startISO: string; // ISO LOCAL : YYYY-MM-DDTHH:mm:ss
    endISO: string;
};

/**
 * Déplie les lignes iCalendar (RFC 5545)
 * Une ligne commençant par espace/tab = continuation
 */
function unfoldIcs(text: string) {
    return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * Convertit une date ICS en ISO LOCAL fiable
 *
 * Cas gérés :
 * - 20260108T071500Z        (UTC → local)
 * - 20260108T081500         (déjà local)
 * - 2026-01-08T08:15:00
 * - 20260108                (all-day)
 */
function toLocalISOFromIcs(dt: string): string {
    // 1️⃣ All-day event (YYYYMMDD)
    if (/^\d{8}$/.test(dt)) {
        const y = dt.slice(0, 4);
        const m = dt.slice(4, 6);
        const d = dt.slice(6, 8);
        return `${y}-${m}-${d}T00:00:00`;
    }

    /**
     * 2️⃣ Si la date finit par Z → UTC
     * On DOIT convertir en heure locale
     */
    if (dt.endsWith("Z")) {
        // Exemple : 20260108T071500Z → Date UTC
        const isoUtc =
            dt.slice(0, 4) + "-" +
            dt.slice(4, 6) + "-" +
            dt.slice(6, 8) + "T" +
            dt.slice(9, 11) + ":" +
            dt.slice(11, 13) + ":" +
            (dt.length >= 15 ? dt.slice(13, 15) : "00") +
            "Z";

        const d = new Date(isoUtc);

        // Conversion en ISO local
        const pad = (n: number) => String(n).padStart(2, "0");

        return (
            d.getFullYear() + "-" +
            pad(d.getMonth() + 1) + "-" +
            pad(d.getDate()) + "T" +
            pad(d.getHours()) + ":" +
            pad(d.getMinutes()) + ":" +
            pad(d.getSeconds())
        );
    }

    /**
     * 3️⃣ Cas sans Z → parsing simple
     */
    const m = dt.match(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/
    );

    if (!m) return "1970-01-01T00:00:00";

    const [, y, mo, d, hh, mm, ss] = m;
    return `${y}-${mo}-${d}T${hh}:${mm}:${ss ?? "00"}`;
}

/**
 * Récupère la valeur après le ":" dans une ligne ICS
 */
function valueAfterColon(line: string): string {
    const idx = line.indexOf(":");
    return idx >= 0 ? line.slice(idx + 1) : "";
}

/**
 * Parse un fichier .ics en événements exploitables
 */
export function parseIcs(text: string): IcsEvent[] {
    const unfolded = unfoldIcs(text);
    const lines = unfolded.split(/\r?\n/);

    const events: IcsEvent[] = [];

    let inEvent = false;
    let dtStart: string | null = null;
    let dtEnd: string | null = null;
    let summary: string | null = null;
    let location: string | null = null;

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            inEvent = true;
            dtStart = dtEnd = summary = location = null;
            continue;
        }

        if (line === "END:VEVENT") {
            if (dtStart && dtEnd) {
                events.push({
                    summary: summary?.trim() || "Cours",
                    location: location?.trim() || undefined,
                    startISO: toLocalISOFromIcs(dtStart),
                    endISO: toLocalISOFromIcs(dtEnd),
                });
            }
            inEvent = false;
            continue;
        }

        if (!inEvent) continue;

        if (line.startsWith("DTSTART")) dtStart = valueAfterColon(line);
        else if (line.startsWith("DTEND")) dtEnd = valueAfterColon(line);
        else if (line.startsWith("SUMMARY")) summary = valueAfterColon(line);
        else if (line.startsWith("LOCATION")) location = valueAfterColon(line);
    }

    return events.sort((a, b) =>
        a.startISO.localeCompare(b.startISO)
    );
}
