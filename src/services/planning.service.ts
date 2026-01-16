// src/services/planning.service.ts
import { fakeDelay } from "./api";
import { mockActivities, mockUser } from "./mockDb";
import type { Activity } from "../types";

function dayNameFromISO(dateISO: string): string {
    // dateISO = YYYY-MM-DD
    const d = new Date(`${dateISO}T00:00:00`);
    const names = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
    return names[d.getDay()];
}

export async function listMyActivities(): Promise<Activity[]> {
    await fakeDelay();
    return mockActivities
        .filter(a => a.userMail === mockUser.mail)
        .slice()
        .sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            if (d !== 0) return d;
            return a.heureDebut.localeCompare(b.heureDebut);
        });
}

export async function addMyActivity(input: Omit<Activity, "numeroActivites" | "userMail" | "jour">): Promise<Activity> {
    await fakeDelay();

    const nextId =
        (mockActivities.reduce((m, a) => Math.max(m, a.numeroActivites), 0) || 0) + 1;

    const created: Activity = {
        numeroActivites: nextId,
        userMail: mockUser.mail,
        nomActivite: input.nomActivite,
        date: input.date,
        heureDebut: input.heureDebut,
        heureFin: input.heureFin,
        jour: dayNameFromISO(input.date),
    };

    mockActivities.unshift(created);
    return created;
}

export async function deleteMyActivity(numeroActivites: number): Promise<void> {
    await fakeDelay();

    const idx = mockActivities.findIndex(
        a => a.userMail === mockUser.mail && a.numeroActivites === numeroActivites
    );
    if (idx >= 0) mockActivities.splice(idx, 1);
}
