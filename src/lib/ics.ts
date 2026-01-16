export type IcsEvent = {
    summary: string;
    location?: string;
    startISO: string; // YYYY-MM-DDTHH:mm:SS
    endISO: string;
};

function unfoldIcs(text: string) {
    // ligne pliée iCalendar: \n + espace / tab => continuation
    return text.replace(/\r?\n[ \t]/g, "");
}

function toLocalISOFromIcs(dt: string): string {
    // formats possibles:
    // 20260112T081500
    // 20260112T081500Z
    // 20260112 (all-day) -> on met 00:00
    if (/^\d{8}$/.test(dt)) {
        const y = dt.slice(0, 4);
        const m = dt.slice(4, 6);
        const d = dt.slice(6, 8);
        return `${y}-${m}-${d}T00:00:00`;
    }

    const raw = dt.endsWith("Z") ? dt.slice(0, -1) : dt;
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    const hh = raw.slice(9, 11);
    const mm = raw.slice(11, 13);
    const ss = raw.length >= 15 ? raw.slice(13, 15) : "00";
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

function valueAfterColon(line: string): string {
    const idx = line.indexOf(":");
    return idx >= 0 ? line.slice(idx + 1) : "";
}

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
            if (inEvent && dtStart && dtEnd) {
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

    // filtre sécurité + tri
    return events
        .filter(e => e.startISO && e.endISO)
        .sort((a, b) => a.startISO.localeCompare(b.startISO));
}
