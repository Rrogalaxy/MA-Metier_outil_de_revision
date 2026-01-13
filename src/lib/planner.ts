import type { BusySlot, PlannedSession, Module } from "../types";

function toMs(iso: string) {
    return new Date(iso).getTime();
}

function addMinutesISO(iso: string, minutes: number) {
    const d = new Date(toMs(iso) + minutes * 60_000);
    // Format ISO sans timezone (YYYY-MM-DDTHH:mm:ss)
    return d.toISOString().slice(0, 19);
}

/**
 * Calcule des créneaux libres sur une journée donnée.
 * POC: on cherche des disponibilités entre startHour et endHour (ex: 17h-20h).
 */
export function generateFreeSlots(
    dayISO: string, // "2026-01-12"
    busy: BusySlot[],
    privateBusy: BusySlot[],
    startHour = 17,
    endHour = 20
): { startISO: string; endISO: string }[] {
    const dayStart = `${dayISO}T${String(startHour).padStart(2, "0")}:00:00`;
    const dayEnd = `${dayISO}T${String(endHour).padStart(2, "0")}:00:00`;

    const blockers = [...busy, ...privateBusy]
        .filter((b) => b.startISO.startsWith(dayISO))
        .sort((a, b) => toMs(a.startISO) - toMs(b.startISO));

    let cursor = dayStart;
    const free: { startISO: string; endISO: string }[] = [];

    for (const b of blockers) {
        if (toMs(b.startISO) > toMs(cursor)) {
            free.push({ startISO: cursor, endISO: b.startISO });
        }
        if (toMs(b.endISO) > toMs(cursor)) cursor = b.endISO;
    }

    if (toMs(dayEnd) > toMs(cursor)) {
        free.push({ startISO: cursor, endISO: dayEnd });
    }

    // On garde seulement les créneaux >= 20 minutes
    return free.filter((s) => toMs(s.endISO) - toMs(s.startISO) >= 20 * 60_000);
}

/**
 * Planifie les modules "dus" sur un seul jour, en remplissant les créneaux libres.
 * Un module est "dû" si nextReviewISO (date) <= dayISO.
 */
export function planSessionsForDay(
    dayISO: string,
    modules: Module[],
    freeSlots: { startISO: string; endISO: string }[]
): PlannedSession[] {
    const due = modules
        .filter((m) => m.nextReviewISO.slice(0, 10) <= dayISO)
        .sort((a, b) => a.nextReviewISO.localeCompare(b.nextReviewISO));

    const sessions: PlannedSession[] = [];
    let slotIndex = 0;

    for (const m of due) {
        while (slotIndex < freeSlots.length) {
            const slot = freeSlots[slotIndex];
            const start = slot.startISO;
            const end = addMinutesISO(start, m.estMinutes);
            const fits = toMs(end) <= toMs(slot.endISO);

            if (fits) {
                sessions.push({
                    id: crypto.randomUUID(),
                    moduleId: m.id,
                    startISO: start,
                    endISO: end,
                });

                // On avance le début du slot (on "consomme" du temps)
                freeSlots[slotIndex] = { startISO: end, endISO: slot.endISO };
                break;
            } else {
                slotIndex++;
            }
        }
    }

    return sessions;
}

/**
 * Planifie sur plusieurs jours (ex: lun–ven).
 * POC: on évite de planifier 2 fois le même module en "poussant" sa date
 * après l'avoir posé une fois.
 */
export function planSessionsForDays(
    daysISO: string[],
    modules: Module[],
    schoolBusy: BusySlot[],
    privateBusy: BusySlot[]
): PlannedSession[] {
    let remainingModules = [...modules];
    const allSessions: PlannedSession[] = [];

    for (const dayISO of daysISO) {
        const freeSlots = generateFreeSlots(dayISO, schoolBusy, privateBusy);
        const freeCopy = freeSlots.map((s) => ({ ...s }));

        const sessions = planSessionsForDay(dayISO, remainingModules, freeCopy);
        allSessions.push(...sessions);

        // Empêche de replanifier le même module le lendemain
        const plannedIds = new Set(sessions.map((s) => s.moduleId));
        remainingModules = remainingModules.map((m) =>
            plannedIds.has(m.id)
                ? {
                    ...m,
                    nextReviewISO: `${dayISO}T23:59:59`,
                }
                : m
        );
    }

    return allSessions;
}
