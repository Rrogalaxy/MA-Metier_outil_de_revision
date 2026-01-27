// src/services/classLocal.service.ts

export type LocalStudentClass = {
    class_id: string;
    class_year: string | number;
};

function key(email: string) {
    return `cpnv_local_class_${email.toLowerCase()}`;
}

export function getLocalUserClass(email: string): LocalStudentClass | null {
    try {
        const raw = localStorage.getItem(key(email));
        if (!raw) return null;
        return JSON.parse(raw) as LocalStudentClass;
    } catch {
        return null;
    }
}

export function setLocalUserClass(email: string, cls: LocalStudentClass) {
    localStorage.setItem(key(email), JSON.stringify(cls));
}

export function clearLocalUserClass(email: string) {
    localStorage.removeItem(key(email));
}
