import { useEffect, useState } from 'react';

// Like useState, but the value is saved in localStorage under `key`, so it
// survives page refreshes and closing/reopening the tab. Falls back to
// `initial` when nothing is stored (or storage is unavailable).
export function usePersistentState<T>(key: string, initial: T) {
    const [value, setValue] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved !== null ? (JSON.parse(saved) as T) : initial;
        } catch {
            return initial;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // storage full or disabled — nothing we can do, just skip
        }
    }, [key, value]);

    return [value, setValue] as const;
}
