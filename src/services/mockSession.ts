// src/services/mockSession.ts
const KEY = "cpnv_mock_user";

export type MockUser = {
    email: string;
    first_name: string;
    last_name: string;
};

export function setMockUser(u: MockUser) {
    localStorage.setItem(KEY, JSON.stringify(u));
}

export function getMockUser(): MockUser | null {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as Partial<MockUser>;
        if (!parsed.email || !parsed.first_name || !parsed.last_name) return null;

        return {
            email: String(parsed.email),
            first_name: String(parsed.first_name),
            last_name: String(parsed.last_name),
        };
    } catch {
        return null;
    }
}

export function clearMockUser() {
    localStorage.removeItem(KEY);
}
