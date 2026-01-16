import { fakeDelay } from "./api";
import { mockUser, mockActivities, mockUserModules, mockQuizResults } from "./mockDb";
import type { User, Activity } from "../types";

export async function getMe(): Promise<User> {
    await fakeDelay();
    return mockUser;
}

export async function listMyActivities(): Promise<Activity[]> {
    await fakeDelay();
    return mockActivities.filter((a) => a.userMail === mockUser.mail);
}

export async function addMyActivity(
    input: Omit<Activity, "numeroActivites" | "userMail">
): Promise<Activity> {
    await fakeDelay();

    const nextId =
        mockActivities.length === 0
            ? 1
            : Math.max(...mockActivities.map((a) => a.numeroActivites)) + 1;

    const created: Activity = {
        numeroActivites: nextId,
        userMail: mockUser.mail,
        ...input,
    };

    mockActivities.unshift(created);
    return created;
}


// Petit utilitaire de debug (optionnel)
export async function getMySnapshot() {
    await fakeDelay();
    return { modules: mockUserModules, results: mockQuizResults, activities: mockActivities };
}
