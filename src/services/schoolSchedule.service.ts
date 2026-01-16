import { fakeDelay } from "./api";
import { mockUser } from "./mockDb";
import { parseIcs, type IcsEvent } from "../lib/ics";

function storageKey() {
    return `cpnv_school_ics_${mockUser.mail}`;
}

export async function getSchoolEvents(): Promise<IcsEvent[]> {
    await fakeDelay();
    const raw = localStorage.getItem(storageKey());
    if (!raw) return [];
    try {
        return JSON.parse(raw) as IcsEvent[];
    } catch {
        return [];
    }
}

export async function importSchoolIcs(icsText: string): Promise<IcsEvent[]> {
    await fakeDelay();
    const events = parseIcs(icsText);
    localStorage.setItem(storageKey(), JSON.stringify(events));
    return events;
}

export async function clearSchoolEvents(): Promise<void> {
    await fakeDelay();
    localStorage.removeItem(storageKey());
}
