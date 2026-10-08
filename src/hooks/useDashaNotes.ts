'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A note for each daśā system, kept in the browser with the chart's birth
 * moment (like the saved events): { vimshottari: "…", chara: "…" }.
 */
export function useDashaNotes(birthDatetime: string): [Record<string, string>, (key: string, note: string) => void] {
  const storageKey = `bhrigu:dasha-notes:${birthDatetime.trim()}`;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // localStorage is only readable after mount, and the notes belong to one chart.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
        const clean: Record<string, string> = {};
        if (parsed && typeof parsed === 'object') {
          for (const [key, value] of Object.entries(parsed)) if (typeof value === 'string') clean[key] = value;
        }
        setNotes(clean);
      } catch { setNotes({}); }
      setLoadedKey(storageKey);
    });
  }, [storageKey]);

  const setNote = useCallback((key: string, note: string) => {
    setNotes(current => {
      const next = { ...current };
      if (note) next[key] = note; else delete next[key];
      try { if (loadedKey === storageKey) localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [loadedKey, storageKey]);

  return [notes, setNote];
}
