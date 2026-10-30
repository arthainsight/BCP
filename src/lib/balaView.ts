import type { ShadbalaRow } from './shadbala';
import type { BhavaBalaRow } from './bhavaBala';
import type { SchemeKey, VimsopakaRow } from './vargaMatrix';

// What the diagrams of the Bala views plot, taken from the rows of the calculations.

export type BalaStatus = 'weak' | 'ok' | 'strong';

/** A planet is weak under its required Ṣaḍbala, ok up to a fifth over it and strong beyond. */
export function shadbalaStatus(ratio: number): BalaStatus {
  return ratio < 1 ? 'weak' : ratio < 1.2 ? 'ok' : 'strong';
}

/** The icon that goes with a status, so that the colour is never the only sign. */
export const STATUS_ICON: Record<BalaStatus, string> = { weak: '✕', ok: '!', strong: '✓' };

export const SHADBALA_PARTS = ['sthana', 'dig', 'kala', 'cheshta', 'naisargika', 'drik'] as const;
export type ShadbalaPart = (typeof SHADBALA_PARTS)[number];

/** The six balas of a planet in virupa, which add up to its total. */
export function shadbalaComposition(row: ShadbalaRow): Record<ShadbalaPart, number> {
  return {
    sthana: row.sthanaBreakdown.total,
    dig: row.digVirupa,
    kala: row.kalaBreakdown.total,
    cheshta: row.cheshtaVirupa,
    naisargika: row.naisargikaVirupa,
    drik: row.drikVirupa,
  };
}

/** A house is weak under this share of the average of the twelve, and strong from the upper one. */
export const BHAVA_WEAK_BELOW = 0.9;
export const BHAVA_STRONG_FROM = 1.1;

/**
 * Each house's total against the average of the twelve houses of the chart. The verses give no minimum for a
 * house (the Ṣaḍbala has one for each graha), so the comparison is with the chart's own average: under 90 % of it
 * is weak, from 110 % strong, and in between ok. The status is the app's reading, not a figure of BPHS.
 */
export function bhavaAgainstAverage(rows: BhavaBalaRow[]): { average: number; houses: Array<{ house: number; ratio: number; status: BalaStatus }> } {
  const average = rows.length ? rows.reduce((sum, row) => sum + row.total, 0) / rows.length : 0;
  return {
    average,
    houses: rows.map(row => {
      const ratio = average > 0 ? row.total / average : 0;
      // The status goes by the whole percent that is shown, so that 110 % is never called ok.
      const percent = Math.round(ratio * 100);
      return { house: row.house, ratio, status: percent < Math.round(BHAVA_WEAK_BELOW * 100) ? 'weak' : percent < Math.round(BHAVA_STRONG_FROM * 100) ? 'ok' : 'strong' };
    }),
  };
}

export const BHAVA_PARTS = ['bhavesha', 'dig', 'drigBenefic', 'drigMalefic', 'occupants', 'kala'] as const;
export type BhavaPart = (typeof BHAVA_PARTS)[number];

/** The parts of the strength of a house, which add up to its total: its lord's, its Dig Bala, the aspects of benefics and of malefics, its occupants and its Kāla Bala. */
export function bhavaComposition(row: BhavaBalaRow): Record<BhavaPart, number> {
  return {
    bhavesha: row.bhavesha,
    dig: row.dig,
    drigBenefic: row.drigBenefic,
    drigMalefic: row.drigMalefic,
    occupants: row.occupantTotal,
    kala: row.kala,
  };
}

/** The Vimsopaka rows by one scheme, the strongest first (a tie keeps the order it had). */
export function vimsopakaBy(rows: VimsopakaRow[], scheme: SchemeKey): VimsopakaRow[] {
  return rows.map((row, index) => ({ row, index })).sort((a, b) => b.row[scheme] - a.row[scheme] || a.index - b.index).map(item => item.row);
}
