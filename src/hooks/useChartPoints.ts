'use client';

import { useSyncExternalStore } from 'react';
import { POINT_KEYS, DEFAULT_POINTS_SELECTION, type ChartPointsSelection, type PointKey } from '@/lib/chartPoints';
import { SATURN_PORTION_MOMENTS, type SaturnPortionMoment } from '@/lib/upagrahas';

// Which upagrahas and Karakāṁśa the charts mark, and the moment of Saturn's part
// Gulika and Maandi are taken at. One store for the whole page, so the main chart,
// the divisional charts, the grids and the Special Sphutas table agree, remembered
// in the browser.

const KEY = 'chartPoints';
let current: ChartPointsSelection = DEFAULT_POINTS_SELECTION;
let loaded = false;
const listeners = new Set<() => void>();

const validMoment = (value: unknown): value is SaturnPortionMoment => (SATURN_PORTION_MOMENTS as readonly unknown[]).includes(value);

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (stored && typeof stored === 'object') {
      const { keys, gulikaAt, maandiAt } = stored as Record<string, unknown>;
      current = {
        keys: Array.isArray(keys) ? POINT_KEYS.filter(key => keys.includes(key)) : [],
        gulikaAt: validMoment(gulikaAt) ? gulikaAt : DEFAULT_POINTS_SELECTION.gulikaAt,
        maandiAt: validMoment(maandiAt) ? maandiAt : DEFAULT_POINTS_SELECTION.maandiAt,
      };
    }
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

function update(next: Partial<ChartPointsSelection>) {
  load();
  const merged = { ...current, ...next };
  current = { ...merged, keys: POINT_KEYS.filter(key => merged.keys.includes(key)) };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch {}
  listeners.forEach(listener => listener());
}

export const setChartPointKeys = (keys: PointKey[]) => update({ keys });
export const setGulikaMoment = (gulikaAt: SaturnPortionMoment) => update({ gulikaAt });
export const setMaandiMoment = (maandiAt: SaturnPortionMoment) => update({ maandiAt });

/** The chosen points and moments, shared by every chart. */
export function useChartPoints(): ChartPointsSelection {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_POINTS_SELECTION);
}
