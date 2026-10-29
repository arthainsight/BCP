// The choices of balaOptions.ts, kept in the browser and shared by every Bala view that is open.
//
// A small external store: the views read it with useSyncExternalStore (see hooks/useBalaOptions.ts), the first read
// of the stored value waits for the browser, and a change is written to localStorage and told to every view.

import { DEFAULT_BALA_OPTIONS, readBalaOptions, type BalaOptions } from './balaOptions';

export const BALA_OPTIONS_STORAGE_KEY = 'balaOptions';

let current: BalaOptions = DEFAULT_BALA_OPTIONS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(BALA_OPTIONS_STORAGE_KEY);
    if (raw) current = readBalaOptions(JSON.parse(raw));
  } catch {
    // A blocked or damaged store leaves the defaults.
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getBalaOptionsSnapshot(): BalaOptions {
  load();
  return current;
}

export function getServerBalaOptionsSnapshot(): BalaOptions {
  return DEFAULT_BALA_OPTIONS;
}

export function setBalaOptions(update: Partial<BalaOptions>): void {
  load();
  current = readBalaOptions({ ...current, ...update });
  try {
    window.localStorage.setItem(BALA_OPTIONS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Not storable (a private window): the choice holds until the page is closed.
  }
  emit();
}

export function resetBalaOptions(): void {
  setBalaOptions(DEFAULT_BALA_OPTIONS);
}

export function subscribeBalaOptions(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== BALA_OPTIONS_STORAGE_KEY) return;
    try {
      current = readBalaOptions(event.newValue ? JSON.parse(event.newValue) : null);
    } catch {
      current = DEFAULT_BALA_OPTIONS;
    }
    listener();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}
