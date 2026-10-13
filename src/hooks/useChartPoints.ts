'use client';

import { POINT_KEYS, DEFAULT_POINTS_SELECTION, type ChartPointsSelection, type PointKey } from '@/lib/chartPoints';
import { SATURN_PORTION_MOMENTS, type SaturnPortionMoment } from '@/lib/upagrahas';
import { createStoredStore } from './createStoredStore';

// Which upagrahas and Karakāṁśa the charts mark, and the moment of Saturn's part
// Gulika and Maandi are taken at. One store for the whole page, so the main chart,
// the divisional charts, the grids and the Special Sphutas table agree, remembered
// in the browser.

const validMoment = (value: unknown): value is SaturnPortionMoment => (SATURN_PORTION_MOMENTS as readonly unknown[]).includes(value);

const store = createStoredStore<ChartPointsSelection>({
  key: 'chartPoints',
  initial: DEFAULT_POINTS_SELECTION,
  read: stored => {
    if (!stored || typeof stored !== 'object') return DEFAULT_POINTS_SELECTION;
    const { keys, gulikaAt, maandiAt } = stored as Record<string, unknown>;
    return {
      keys: Array.isArray(keys) ? POINT_KEYS.filter(key => keys.includes(key)) : [],
      gulikaAt: validMoment(gulikaAt) ? gulikaAt : DEFAULT_POINTS_SELECTION.gulikaAt,
      maandiAt: validMoment(maandiAt) ? maandiAt : DEFAULT_POINTS_SELECTION.maandiAt,
    };
  },
});

function update(next: Partial<ChartPointsSelection>) {
  const merged = { ...store.get(), ...next };
  store.set({ ...merged, keys: POINT_KEYS.filter(key => merged.keys.includes(key)) });
}

export const setChartPointKeys = (keys: PointKey[]) => update({ keys });
export const setGulikaMoment = (gulikaAt: SaturnPortionMoment) => update({ gulikaAt });
export const setMaandiMoment = (maandiAt: SaturnPortionMoment) => update({ maandiAt });

/** The chosen points and moments, shared by every chart. */
export const useChartPoints = (): ChartPointsSelection => store.useValue();
