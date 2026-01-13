// src/lib/ics.ts
import type { BusySlot } from "../types";

/**
 * Parse un .ics CPNV (VEVENT avec DTSTART/DTEND en UTC "Z")
 * -> retourne des BusySlot en heure locale, format "YYYY-MM-DDTHH:mm:ss"
 */
export function parseCpnvIcsToBusySlots(icsText: string): BusySlot[] {
    // Unfold : certaines lignes sont "coupées" avec un retour + espace
    const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);

    const slots: BusySlot[] = [];

    let inEvent = false;
    let dtStart: string | null = null;
    let dtEnd: string | null = null;
    let summary: string | null = null;


    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            inEvent = true;
            dtStart = dtEnd = summary = null;
            continue;
        }

        if (line === "END:VEVENT") {
            if (inEvent && dtStart && dtEnd) {
                const startISO = icsDateTimeToLocalIso(dtStart);
                const endISO = icsDateTimeToLocalIso(dtEnd);

                if (startISO && endISO) {
                    slots.push({
                        startISO,
                        endISO,
                        label: summary ?? "Cours",

                    });
                }
            }
            inEvent = false;
            continue;
        }

        if (!inEvent) continue;

        if (line.startsWith("DTSTART")) dtStart = line.split(":")[1] ?? null;
        else if (line.startsWith("DTEND")) dtEnd = line.split(":")[1] ?? null;
        else if (line.startsWith("SUMMARY")) summary = line.split(":").slice(1).join(":") || null;

    }

    slots.sort((a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime());
    return slots;
}

/**
 * Convertit une date ICS:
 * - "20260112T140500Z" (UTC) -> ISO local "YYYY-MM-DDTHH:mm:ss"
 * - "20260112T140500" (rare)  -> local aussi
 */
function icsDateTimeToLocalIso(raw: string | null): string | null {
    if (!raw) return null;

    // Ignore all-day (YYYYMMDD)
    if (/^\d{8}$/.test(raw)) return null;

    const isUtc = raw.endsWith("Z");
    const v = isUtc ? raw.slice(0, -1) : raw;

    // YYYYMMDDTHHMMSS ou YYYYMMDDTHHMM
    const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?$/);
    if (!m) return null;

    const [, yyyy, mm, dd, hh, min, ss] = m;
    const sec = ss ?? "00";

    let d: Date;
    if (isUtc) {
        d = new Date(Date.UTC(
            Number(yyyy),
            Number(mm) - 1,
            Number(dd),
            Number(hh),
            Number(min),
            Number(sec)
        ));
    } else {
        d = new Date(
            Number(yyyy),
            Number(mm) - 1,
            Number(dd),
            Number(hh),
            Number(min),
            Number(sec)
        );
    }

    // On renvoie un ISO "local" sans timezone, comme ton POC
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
