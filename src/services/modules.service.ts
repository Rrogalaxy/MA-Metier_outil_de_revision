import { fakeDelay } from "./api";
import { mockModules, mockUserModules, mockUser } from "./mockDb";
import type { Module, UserModule } from "../types";

/**
 * Modules "partagés" (catalogue global)
 */
export async function listSharedModules(): Promise<Module[]> {
    await fakeDelay();
    return mockModules;
}

/**
 * Modules "personnels" (Travailler) pour l'utilisateur connecté
 */
export async function listMyModules(): Promise<UserModule[]> {
    await fakeDelay();
    return mockUserModules.filter((um) => um.userMail === mockUser.mail);
}

/**
 * Crée ou met à jour la ligne "Travailler" (progression perso) d'un module.
 * IMPORTANT: on ne réassigne pas mockUserModules (import ES module),
 * on modifie le tableau en place.
 */
export async function upsertMyModule(
    input: Omit<UserModule, "userMail">
): Promise<UserModule> {
    await fakeDelay();

    const idx = mockUserModules.findIndex(
        (m) => m.userMail === mockUser.mail && m.moduleNom === input.moduleNom
    );

    if (idx >= 0) {
        mockUserModules[idx] = { ...mockUserModules[idx], ...input };
        return mockUserModules[idx];
    }

    const created: UserModule = {
        userMail: mockUser.mail,
        ...input,
    };

    mockUserModules.unshift(created);
    return created;
}
