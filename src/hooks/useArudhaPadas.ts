'use client';

import { useSyncExternalStore } from 'react';
import { ARUDHA_PADAS } from '@/lib/arudhaPadas';

// Which Āruḍha padas the charts mark (1 = AL, 2 = AL2 … 12 = AL12). One store
// for the whole page, so the main chart, the divisional charts and the grids
// change together, remembered in the browser.

const KEY = 'arudhaPadas';
const NONE: number[] = [];
let current: number[] = NONE;
let loaded = false;
const listeners = new Set<() => void>();

const valid = (value: unknown): value is number => (ARUDHA_PADAS as readonly number[]).includes(value as number);

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (Array.isArray(stored)) current = [...new Set(stored.filter(valid))].sort((a, b) => a - b);
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  load();
  return current;
}

/** Sets the padas that are marked; anything that is not 1–12 is dropped. */
export function setArudhaPadas(next: number[]) {
  load();
  current = [...new Set(next.filter(valid))].sort((a, b) => a - b);
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch {}
  listeners.forEach(listener => listener());
}

/** The marked Āruḍha padas, and the way to change them. */
export function useArudhaPadas(): [number[], (next: number[]) => void] {
  const padas = useSyncExternalStore(subscribe, getSnapshot, () => NONE);
  return [padas, setArudhaPadas];
}
