// src/services/planning.service.ts
/**
 * Service lié au PLANNING PERSONNEL de l’utilisateur.
 *
 * Mode:
 * - Backend si dispo (API)
 * - Sinon fallback mockDb (démo)
 */
import { api } from "./http";
import { fakeDelay } from "./api";
import { mockActivities, mockUser } from "./mockDb";
import type { Activity } from "../types";

/** Payload attendu par le backend pour créer une activité */
type ApiCreateActivity = {
    nomActivite: string;
    date: string; // YYYY-MM-DD
    heureDebut: string; // HH:mm
    heureFin: string; // HH:mm
};

/** Shape possible d’une activité renvoyée par l’API */
type ApiActivity = {
    numeroActivites: number;
    userMail?: string;
    nomActivite: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    jour?: string;
};

function dayNameFromISO(dateISO: string): string {
    const d = new Date(`${dateISO}T00:00:00`);
    const names = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
    return names[d.getDay()];
}

function toActivity(a: ApiActivity): Activity {
    return {
        numeroActivites: a.numeroActivites,
        userMail: a.userMail ?? mockUser.mail,
        nomActivite: a.nomActivite,
        date: a.date,
        heureDebut: a.heureDebut,
        heureFin: a.heureFin,
        jour: a.jour ?? dayNameFromISO(a.date),
    };
}

/** ===== Backend calls ===== */

async function listMyActivitiesApi(): Promise<Activity[]> {
    // Endpoint à adapter si ton backend utilise un autre chemin
    const data = await api.get<ApiActivity[]>("/api/my/activities");
    return data
        .map(toActivity)
        .slice()
        .sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            if (d !== 0) return d;
            return a.heureDebut.localeCompare(b.heureDebut);
        });
}

async function addMyActivityApi(input: ApiCreateActivity): Promise<Activity> {
    const created = await api.post<ApiActivity>("/api/my/activities", input);
    return toActivity(created);
}

async function deleteMyActivityApi(numeroActivites: number): Promise<void> {
    // Endpoint à adapter si besoin
    await api.del<void>(`/api/my/activities/${numeroActivites}`);
}

/** ===== Mock fallback ===== */

async function listMyActivitiesMock(): Promise<Activity[]> {
    await fakeDelay();

    return mockActivities
        .filter((a) => a.userMail === mockUser.mail)
        .slice()
        .sort((a, b) => {
            const d = a.date.localeCompare(b.date);
            if (d !== 0) return d;
            return a.heureDebut.localeCompare(b.heureDebut);
        });
}

async function addMyActivityMock(
    input: Omit<Activity, "numeroActivites" | "userMail" | "jour">
): Promise<Activity> {
    await fakeDelay();

    const nextId =
        (mockActivities.reduce((max, a) => Math.max(max, a.numeroActivites), 0) || 0) + 1;

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

async function deleteMyActivityMock(numeroActivites: number): Promise<void> {
    await fakeDelay();

    const idx = mockActivities.findIndex(
        (a) => a.userMail === mockUser.mail && a.numeroActivites === numeroActivites
    );

    if (idx >= 0) mockActivities.splice(idx, 1);
}

/** ===== Public API (smart) ===== */

export async function listMyActivities(): Promise<Activity[]> {
    try {
        return await listMyActivitiesApi();
    } catch {
        return await listMyActivitiesMock();
    }
}

export async function addMyActivity(
    input: Omit<Activity, "numeroActivites" | "userMail" | "jour">
): Promise<Activity> {
    try {
        return await addMyActivityApi({
            nomActivite: input.nomActivite,
            date: input.date,
            heureDebut: input.heureDebut,
            heureFin: input.heureFin,
        });
    } catch {
        return await addMyActivityMock(input);
    }
}

export async function deleteMyActivity(numeroActivites: number): Promise<void> {
    try {
        await deleteMyActivityApi(numeroActivites);
    } catch {
        await deleteMyActivityMock(numeroActivites);
    }
}
