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
        return JSON.parse(raw) as MockUser;
    } catch {
        return null;
    }
}

export function clearMockUser() {
    localStorage.removeItem(KEY);
}
