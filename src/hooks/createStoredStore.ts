'use client';

import { useSyncExternalStore } from 'react';

/**
 * A value that the whole page shares (the main chart, the divisional charts, the grids and the tables all show it, and
 * they change together) and that is remembered in the browser. `read` turns what was stored (`null` when nothing was) into
 * a valid value; the store is read once, when it is first asked for.
 */
export function createStoredStore<T>({ key, initial, read }: { key: string; initial: T; read: (stored: unknown) => T }) {
  let current = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === 'undefined') return;
    loaded = true;
    try { current = read(JSON.parse(localStorage.getItem(key) ?? 'null')); } catch { /* what is stored is not usable: the initial value stays */ }
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };
  const get = () => { load(); return current; };

  /** Makes `next` the value, remembers it and tells everything that shows it. */
  function set(next: T) {
    load();
    current = next;
    try { localStorage.setItem(key, JSON.stringify(current)); } catch { /* the value is kept for this visit only */ }
    listeners.forEach(listener => listener());
  }

  /** The hook: the value, and a new render when it changes. */
  const useValue = (): T => useSyncExternalStore(subscribe, get, () => initial);

  return { get, set, useValue };
}
