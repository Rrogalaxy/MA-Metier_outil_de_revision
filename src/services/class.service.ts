// src/services/class.service.ts
import { api } from "./http";

export type StudentClass = {
    class_id: string;
    class_year: string | number;
};

// ✅ Mocks pour démo
const mockClasses: StudentClass[] = [
    { class_id: "BTS-SIO", class_year: 2024 },
    { class_id: "BTS-SIO", class_year: 2023 },
    { class_id: "ES-INFO", class_year: 2024 },
    { class_id: "ES-INFO", class_year: 2023 },
];

export async function listClasses(): Promise<StudentClass[]> {
    try {
        // si backend OK → on l’utilise
        return await api.get<StudentClass[]>("/api/class");
    } catch {
        // sinon → mocks
        return mockClasses;
    }
}
