// src/services/class.service.ts
import { api } from "./http";

export type StudentClass = {
    class_id: string;
    class_year: string | number;
};

export async function listClasses(): Promise<StudentClass[]> {
    return api.get<StudentClass[]>("/api/class");
}
