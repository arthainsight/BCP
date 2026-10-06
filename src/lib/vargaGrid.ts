// Which divisional charts the Vargas tab shows side by side.
//
// The presets are the classical groups of BPHS 6: Ṣaḍvarga (six charts),
// Saptavarga (seven), Daśavarga (ten) and Ṣoḍaśavarga (all sixteen).

import { VARGA_DIVISIONS } from './vargaChart';

export type VargaGridPreset = 'shadvarga' | 'saptavarga' | 'dashavarga' | 'shodashavarga' | 'custom';

export const VARGA_GRID_MIN = 4;
export const VARGA_GRID_MAX = 16;

export const VARGA_GRID_PRESETS: Record<Exclude<VargaGridPreset, 'custom'>, { label: string; divisions: number[] }> = {
  shadvarga: { label: 'Ṣaḍvarga', divisions: [1, 2, 3, 9, 12, 30] },
  saptavarga: { label: 'Saptavarga', divisions: [1, 2, 3, 7, 9, 12, 30] },
  dashavarga: { label: 'Daśavarga', divisions: [1, 2, 3, 7, 9, 10, 12, 16, 30, 60] },
  shodashavarga: { label: 'Ṣoḍaśavarga', divisions: [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60] },
};

export const VARGA_GRID_PRESET_ORDER: VargaGridPreset[] = ['shadvarga', 'saptavarga', 'dashavarga', 'shodashavarga', 'custom'];

export interface VargaGridSelection {
  preset: VargaGridPreset;
  /** The custom selection, kept while a preset is shown so it is not lost. */
  custom: number[];
}

export const DEFAULT_VARGA_GRID: VargaGridSelection = {
  preset: 'shadvarga',
  custom: VARGA_GRID_PRESETS.shadvarga.divisions,
};

export function vargaGridDivisions(selection: VargaGridSelection): number[] {
  return selection.preset === 'custom' ? selection.custom : VARGA_GRID_PRESETS[selection.preset].divisions;
}

/** Adds or removes a division, keeping between four and sixteen in order. */
export function toggleCustomDivision(custom: number[], division: number): number[] {
  if (custom.includes(division)) {
    return custom.length > VARGA_GRID_MIN ? custom.filter(d => d !== division) : custom;
  }
  if (custom.length >= VARGA_GRID_MAX) return custom;
  return [...custom, division].sort((a, b) => a - b);
}

/** Reads a stored selection; anything malformed falls back to Ṣaḍvarga. */
export function readVargaGridSelection(stored: unknown): VargaGridSelection {
  if (!stored || typeof stored !== 'object') return DEFAULT_VARGA_GRID;
  const { preset, custom } = stored as Record<string, unknown>;
  const valid = Array.isArray(custom)
    ? [...new Set(custom.filter((d): d is number => (VARGA_DIVISIONS as readonly number[]).includes(d as number)))].sort((a, b) => a - b)
    : [];
  const customOk = valid.length >= VARGA_GRID_MIN && valid.length <= VARGA_GRID_MAX;
  const presetOk = (typeof preset === 'string' && Object.hasOwn(VARGA_GRID_PRESETS, preset)) || (preset === 'custom' && customOk);
  return {
    preset: presetOk ? (preset as VargaGridPreset) : DEFAULT_VARGA_GRID.preset,
    custom: customOk ? valid : DEFAULT_VARGA_GRID.custom,
  };
}
