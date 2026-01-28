// src/services/modules.service.ts
import { api } from "./http";
import { fakeDelay } from "./api";
import { mockModules, mockUserModules } from "./mockDb";
import { getMeSmart } from "./user.service";
import type { Module, UserModule } from "../types";

/**
 * IMPORTANT :
 * Tu n'as pas la main sur le backend aujourd'hui.
 * Donc on "tente" des endpoints API (si existants).
 * Si ça échoue → fallback mock (démo stable).
 *
 * Si ton backend utilise d'autres routes, change juste ces constantes.
 */
const API_SHARED_MODULES = "/api/modules"; // ex: GET
const API_MY_MODULES = "/api/my-modules"; // ex: GET
const API_UPSERT_MY_MODULE = "/api/my-modules"; // ex: PATCH/POST

export type DataSource = "api" | "mock";

export type ModulesResult<T> = {
    items: T;
    source: DataSource;
};

async function getCurrentEmail(): Promise<string> {
    const me = await getMeSmart(); // API si dispo, sinon mock user
    return me.email;
}

/** ===== Modules "partagés" (catalogue global) ===== */
export async function listSharedModules(): Promise<Module[]> {
    return api.get<Module[]>(API_SHARED_MODULES);
}

export async function listSharedModulesSmart(): Promise<ModulesResult<Module[]>> {
    try {
        const items = await listSharedModules();
        return { items, source: "api" };
    } catch {
        // fallback mock
        await fakeDelay();
        return { items: mockModules, source: "mock" };
    }
}

/** ===== Modules "personnels" (progression) ===== */
export async function listMyModules(): Promise<UserModule[]> {
    return api.get<UserModule[]>(API_MY_MODULES);
}

export async function listMyModulesSmart(): Promise<ModulesResult<UserModule[]>> {
    try {
        const items = await listMyModules();
        return { items, source: "api" };
    } catch {
        // fallback mock + filtrage sur email courant (cohérent démo)
        await fakeDelay();
        const email = await getCurrentEmail();
        const items = mockUserModules.filter((um) => um.userMail === email);
        return { items, source: "mock" };
    }
}

/**
 * Upsert progression utilisateur
 * - tente backend
 * - si KO → écrit dans mockUserModules (en mémoire) pour la démo
 */
export async function upsertMyModule(
    input: Omit<UserModule, "userMail">
): Promise<UserModule> {
    // tentative backend (si route existe)
    try {
        // on tente un PATCH générique (souvent utilisé)
        return await api.patch<UserModule>(API_UPSERT_MY_MODULE, input);
    } catch {
        // fallback mock "persistant" (pendant la session)
        await fakeDelay();
        const email = await getCurrentEmail();

        const idx = mockUserModules.findIndex(
            (m) => m.userMail === email && m.moduleNom === input.moduleNom
        );

        if (idx >= 0) {
            mockUserModules[idx] = { ...mockUserModules[idx], ...input, userMail: email };
            return mockUserModules[idx];
        }

        const created: UserModule = { userMail: email, ...input };
        mockUserModules.unshift(created);
        return created;
    }
}
