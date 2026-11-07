'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * One of a few choices that is remembered in the browser: `parse` turns what was stored (null for nothing) into a choice, and
 * the setter stores the new one. Until the page has loaded the choice is the one for nothing stored.
 */
export function useStoredChoice<T extends string>(key: string, parse: (stored: string | null) => T): [T, (choice: T) => void] {
  const [value, setValue] = useState<T>(() => parse(null));
  useEffect(() => {
    try {
      const stored = parse(localStorage.getItem(key));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(stored);
    } catch {}
  }, [key, parse]);
  const choose = useCallback((choice: T) => {
    try { localStorage.setItem(key, choice); } catch {}
    setValue(choice);
  }, [key]);
  return [value, choose];
}
