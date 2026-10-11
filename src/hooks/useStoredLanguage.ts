'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_CHART_DISPLAY } from '@/types';
import { migrateChartDisplaySettings } from '@/lib/chartDisplaySettings';
import type { Language } from '@/lib/i18n';

// The interface language lives in the display settings of the app (localStorage `chartDisplaySettings`).
// Pages other than the app itself, such as the user guide, read it from there and can change it.

const KEY = 'chartDisplaySettings';
const listeners = new Set<() => void>();

function readLanguage(): Language {
  try {
    const raw = localStorage.getItem(KEY);
    return raw && JSON.parse(raw)?.language === 'fi' ? 'fi' : 'en';
  } catch {
    return 'en';
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab (the app itself) can change the language while this page is open.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Writes the language into the display settings, leaving the rest of them as they were. */
export function setStoredLanguage(language: Language) {
  try {
    const raw = localStorage.getItem(KEY);
    const current = raw ? migrateChartDisplaySettings(JSON.parse(raw)) : DEFAULT_CHART_DISPLAY;
    localStorage.setItem(KEY, JSON.stringify({ ...current, language }));
  } catch {}
  listeners.forEach(listener => listener());
}

/** The language chosen in the app: English until the stored choice can be read after the page has loaded. */
export function useStoredLanguage(): Language {
  return useSyncExternalStore(subscribe, readLanguage, () => 'en');
}
