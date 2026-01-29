import { api } from "./http";

export type StudentClass = {
    class_id: string;
    class_year: string | number;
    class_name: string;
};

type ClassesApiResponse =
    | unknown
    | StudentClass[]
    | { data?: unknown; classes?: unknown };

type AnyObj = Record<string, unknown>;

function isObj(x: unknown): x is AnyObj {
    return typeof x === "object" && x !== null;
}

/**
 * Accepte plusieurs formats backend :
 * - { class_id, class_year, class_name }
 * - { id, year, name }
 * Et convertit vers StudentClass
 */
function toStudentClass(x: unknown): StudentClass | null {
    if (!isObj(x)) return null;

    const class_id = x.class_id ?? x.id;
    const class_year = x.class_year ?? x.year;
    const class_name = x.class_name ?? x.name;

    if (class_id == null || class_year == null || class_name == null) return null;

    return {
        class_id: String(class_id),
        class_year: class_year as string | number,
        class_name: String(class_name),
    };
}

function normalizeClasses(payload: ClassesApiResponse): StudentClass[] {
    // cas 1: tableau direct
    if (Array.isArray(payload)) {
        return payload.map(toStudentClass).filter((v): v is StudentClass => v !== null);
    }

    // cas 2: enveloppé (data / classes)
    if (isObj(payload)) {
        const maybe = payload.data ?? payload.classes;
        if (Array.isArray(maybe)) {
            return maybe.map(toStudentClass).filter((v): v is StudentClass => v !== null);
        }
    }

    return [];
}

export async function listClasses(): Promise<StudentClass[]> {
    const res = await api.get<ClassesApiResponse>("/api/class");
    return normalizeClasses(res);
}

function mockClasses(): StudentClass[] {
    const years = [2024, 2025, 2026];
    const classes = [
        { id: "SI-CA2a", name: "SI – Cycle A2 (groupe A)" },
        { id: "SI-CA2b", name: "SI – Cycle A2 (groupe B)" },
        { id: "SI-CA3a", name: "SI – Cycle A3 (groupe A)" },
        { id: "SI-CA3b", name: "SI – Cycle A3 (groupe B)" },
    ];

    const out: StudentClass[] = [];
    for (const y of years) {
        for (const c of classes) {
            out.push({ class_id: c.id, class_name: c.name, class_year: y });
        }
    }
    return out;
}

export async function listClassesSmart(): Promise<StudentClass[]> {
    try {
        const cls = await listClasses();
        return cls.length ? cls : mockClasses();
    } catch {
        return mockClasses();
    }
}
