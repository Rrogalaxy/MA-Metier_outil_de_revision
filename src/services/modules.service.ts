// src/services/modules.service.ts
import { fakeDelay } from "./api";
import { mockModules, mockUserModules, mockUser } from "./mockDb";
import type { Module, UserModule } from "../types";

/**
 * Modules "partagés" (catalogue global)
 * Correspond à l'entité Module (partagé) dans le MCD.
 */
export async function listSharedModules(): Promise<Module[]> {
    await fakeDelay();
    return mockModules;
}

/**
 * Modules "personnels" (progression) pour l'utilisateur connecté
 * Correspond à la relation "Travailler" (personnel) dans le MCD.
 */
export async function listMyModules(): Promise<UserModule[]> {
    await fakeDelay();
    return mockUserModules.filter((um) => um.userMail === mockUser.mail);
}

/**
 * Crée ou met à jour la progression d’un module pour l'utilisateur connecté.
 * ⚠️ Important : on ne réassigne pas mockUserModules (import ES module).
 * On modifie le tableau existant (mutation contrôlée) pour que le mock reste simple.
 */
export async function upsertMyModule(
    input: Omit<UserModule, "userMail">
): Promise<UserModule> {
    await fakeDelay();

    const idx = mockUserModules.findIndex(
        (m) => m.userMail === mockUser.mail && m.moduleNom === input.moduleNom
    );

    // Update si existe
    if (idx >= 0) {
        mockUserModules[idx] = { ...mockUserModules[idx], ...input };
        return mockUserModules[idx];
    }

    // Create sinon
    const created: UserModule = {
        userMail: mockUser.mail,
        ...input,
    };

    mockUserModules.unshift(created);
    return created;
}
