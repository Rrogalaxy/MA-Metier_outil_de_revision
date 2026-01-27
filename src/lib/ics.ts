/**
 * lib/ics.ts
 * ----------
 * Parser iCalendar (.ics) minimal.
 *
 * ✅ Objectif MVP :
 * - extraire VEVENT (DTSTART, DTEND, SUMMARY, LOCATION)
 * - convertir les dates en ISO LOCAL (YYYY-MM-DDTHH:mm:ss)
 *
 * ✅ Sécurité ajoutée :
 * - si ce n’est pas un VCALENDAR -> retourne []
 * - si dates invalides -> ignore l’event plutôt que crash
 */

export type IcsEvent = {
    summary: string;
    location?: string;
    startISO: string; // ISO LOCAL : YYYY-MM-DDTHH:mm:ss
    endISO: string;
};

/** Déplie les lignes iCalendar (RFC 5545) : lignes continuées commencent par espace/tab */
function unfoldIcs(text: string) {
    return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * Convertit une date ICS en ISO LOCAL fiable
 *
 * Cas gérés :
 * - 20260108T071500Z        (UTC → local)
 * - 20260108T081500         (déjà "local brut")
 * - 2026-01-08T08:15:00     (déjà ISO-like)
 * - 20260108                (all-day)
 */
function toLocalISOFromIcs(dt: string): string | null {
    const raw = (dt ?? "").trim();
    if (!raw) return null;

    // 1) All-day event: YYYYMMDD
    if (/^\d{8}$/.test(raw)) {
        const y = raw.slice(0, 4);
        const m = raw.slice(4, 6);
        const d = raw.slice(6, 8);
        return `${y}-${m}-${d}T00:00:00`;
    }

    // 2) ISO-like already (2026-01-08T08:15:00)
    // On accepte "YYYY-MM-DDTHH:mm" ou avec seconds
    const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+\-]\d{2}:?\d{2})?$/);
    if (isoLike) {
        const [, y, mo, d, hh, mm, ssRaw] = isoLike;
        const ss = ssRaw ?? "00";
        return `${y}-${mo}-${d}T${hh}:${mm}:${ss}`;
    }

    // 3) Format ICS compact : YYYYMMDDTHHMMSS? + suffix éventuel (Z / +0100 / +01:00)
    // On capture le coeur sans suffix
    const compact = raw.replace(/(Z|[+\-]\d{2}:?\d{2})$/, "");
    const m = compact.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
    if (!m) return null;

    const [, y, mo, d, hh, mm, ssRaw] = m;
    const ss = ssRaw ?? "00";

    // Si suffix Z (UTC), on convertit réellement en local
    if (raw.endsWith("Z")) {
        const isoUtc = `${y}-${mo}-${d}T${hh}:${mm}:${ss}Z`;
        const date = new Date(isoUtc);
        if (Number.isNaN(date.getTime())) return null;

        const pad = (n: number) => String(n).padStart(2, "0");
        return (
            date.getFullYear() +
            "-" +
            pad(date.getMonth() + 1) +
            "-" +
            pad(date.getDate()) +
            "T" +
            pad(date.getHours()) +
            ":" +
            pad(date.getMinutes()) +
            ":" +
            pad(date.getSeconds())
        );
    }

    // Sans suffix → on considère que c’est “local”
    return `${y}-${mo}-${d}T${hh}:${mm}:${ss}`;
}

/** Valeur après ":" (ex: SUMMARY:xxx) */
function valueAfterColon(line: string): string {
    const idx = line.indexOf(":");
    return idx >= 0 ? line.slice(idx + 1) : "";
}

/**
 * parseIcs() : transforme le texte d’un fichier .ics en IcsEvent[]
 *
 * ✅ Sécurité :
 * - si pas BEGIN:VCALENDAR → []
 * - ignore les events incomplets
 */
export function parseIcs(text: string): IcsEvent[] {
    const src = (text ?? "").replace(/^\uFEFF/, ""); // retire BOM si présent
    const unfolded = unfoldIcs(src);
    const trimmed = unfolded.trimStart();

    // ✅ garde-fou anti-fichier non ICS
    if (!trimmed.startsWith("BEGIN:VCALENDAR")) return [];

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
            if (inEvent && dtStart && dtEnd) {
                const startISO = toLocalISOFromIcs(dtStart);
                const endISO = toLocalISOFromIcs(dtEnd);

                // ✅ ignore event si dates invalides
                if (startISO && endISO) {
                    events.push({
                        summary: summary?.trim() || "Cours",
                        location: location?.trim() || undefined,
                        startISO,
                        endISO,
                    });
                }
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

    return events.sort((a, b) => a.startISO.localeCompare(b.startISO));
}
