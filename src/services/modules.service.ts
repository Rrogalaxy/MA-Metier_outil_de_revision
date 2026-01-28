// src/services/modules.service.ts
import { fakeDelay } from "./api";
import { mockModules, mockUserModules, mockUser } from "./mockDb";
import type { Module, UserModule } from "../types";
import { getCache, setCache } from "./cache";

const TTL = 60_000;

function mineKey() {
    return `modules:mine:${mockUser.mail}`;
}

// Catalogue (partagé)
export async function listSharedModules(): Promise<Module[]> {
    const key = "modules:shared";
    const cached = getCache<Module[]>(key, TTL);
    if (cached) return cached;

    await fakeDelay();

    const data = mockModules.slice();
    setCache(key, data);
    return data;
}

// Mes modules (Travailler)
export async function listMyModules(): Promise<UserModule[]> {
    const key = mineKey();
    const cached = getCache<UserModule[]>(key, TTL);
    if (cached) return cached;

    await fakeDelay();

    const data = mockUserModules
        .filter((um) => um.userMail === mockUser.mail)
        .slice();

    setCache(key, data);
    return data;
}

export async function upsertMyModule(
    input: Omit<UserModule, "userMail">
): Promise<UserModule> {
    await fakeDelay();

    const idx = mockUserModules.findIndex(
        (m) => m.userMail === mockUser.mail && m.moduleNom === input.moduleNom
    );

    if (idx >= 0) {
        mockUserModules[idx] = { ...mockUserModules[idx], ...input };

        // ✅ cache refresh
        setCache(
            mineKey(),
            mockUserModules.filter((m) => m.userMail === mockUser.mail).slice()
        );

        return mockUserModules[idx];
    }

    const created: UserModule = { userMail: mockUser.mail, ...input };
    mockUserModules.unshift(created);

    // ✅ cache refresh
    setCache(
        mineKey(),
        mockUserModules.filter((m) => m.userMail === mockUser.mail).slice()
    );

    return created;
}
