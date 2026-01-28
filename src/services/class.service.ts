// src/services/class.service.ts
import { api } from "./http";

export type StudentClass = {
    class_id: string;
    class_year: string | number;
};

export async function listClasses(): Promise<StudentClass[]> {
    return api.get<StudentClass[]>("/api/class");
}

// ✅ Mock simple et crédible
function mockClasses(): StudentClass[] {
    const years = [2024, 2025, 2026];
    const ids = ["SI-CA2a", "SI-CA2b", "SI-CA3a", "SI-CA3b"];
    const out: StudentClass[] = [];
    for (const y of years) for (const id of ids) out.push({ class_id: id, class_year: y });
    return out;
}

/**
 * ✅ Smart: tente backend, sinon mock
 */
export async function listClassesSmart(): Promise<StudentClass[]> {
    try {
        return await listClasses();
    } catch {
        return mockClasses();
    }
}
