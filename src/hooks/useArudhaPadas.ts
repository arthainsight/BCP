'use client';

import { ARUDHA_PADAS } from '@/lib/arudhaPadas';
import { createStoredStore } from './createStoredStore';

// Which Āruḍha padas the charts mark (1 = AL, 2 = AL2 … 12 = AL12). One store
// for the whole page, so the main chart, the divisional charts and the grids
// change together, remembered in the browser.

const NONE: number[] = [];
const valid = (value: unknown): value is number => (ARUDHA_PADAS as readonly number[]).includes(value as number);
const clean = (padas: unknown[]) => [...new Set(padas.filter(valid))].sort((a, b) => a - b);

const store = createStoredStore<number[]>({ key: 'arudhaPadas', initial: NONE, read: stored => (Array.isArray(stored) ? clean(stored) : NONE) });

/** Sets the padas that are marked; anything that is not 1–12 is dropped. */
export const setArudhaPadas = (next: number[]) => store.set(clean(next));

/** The marked Āruḍha padas, and the way to change them. */
export function useArudhaPadas(): [number[], (next: number[]) => void] {
  return [store.useValue(), setArudhaPadas];
}
