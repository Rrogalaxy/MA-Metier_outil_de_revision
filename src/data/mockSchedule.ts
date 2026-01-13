import type { BusySlot } from "../types";

export const mockBusyWeek: BusySlot[] = [
    // Lundi 12 jan 2026 (exemples)
    { startISO: "2026-01-12T08:10:00", endISO: "2026-01-12T11:45:00", label: "Cours" },
    { startISO: "2026-01-12T13:15:00", endISO: "2026-01-12T16:45:00", label: "Cours" },
    // Mardi
    { startISO: "2026-01-13T08:10:00", endISO: "2026-01-13T11:45:00", label: "Cours" },
    { startISO: "2026-01-13T13:15:00", endISO: "2026-01-13T15:00:00", label: "Cours" },
];
