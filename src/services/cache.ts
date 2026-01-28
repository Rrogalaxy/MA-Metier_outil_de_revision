// src/services/cache.ts
type CacheEntry<T> = { value: T; ts: number };

const mem = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string, maxAgeMs: number): T | null {
    const e = mem.get(key) as CacheEntry<T> | undefined;
    if (!e) return null;

    if (Date.now() - e.ts > maxAgeMs) {
        mem.delete(key);
        return null;
    }
    return e.value;
}

export function setCache<T>(key: string, value: T) {
    mem.set(key, { value, ts: Date.now() });
}

export function clearCache(keyPrefix?: string) {
    if (!keyPrefix) {
        mem.clear();
        return;
    }
    for (const k of mem.keys()) {
        if (k.startsWith(keyPrefix)) mem.delete(k);
    }
}
