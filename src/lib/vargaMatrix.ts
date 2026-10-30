import type { ChartData } from '@/types';
import { getVargaSignIndex } from '@/lib/varga';
import { getDignity, SCORE_PLANETS, type Dignity, type RasiSigns } from '@/lib/shadbala';
import { DEFAULT_BALA_OPTIONS, type BalaOptions } from '@/lib/balaOptions';
import { vimsopakaViswa } from '@/lib/vimsopaka';
import { SIGN_ABBR } from '@/lib/signs';

export const DEFAULT_DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
export const ROW_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
export const DIGNITY_LABELS: Record<Dignity, string> = { exalted: 'Ex', moolatrikona: 'MT', own: 'Own', friend: 'Fr', neutral: 'Neu', enemy: 'En', debilitated: 'Deb', none: '—' };
export const VIMSOPAKA_SCHEMES = {
  shadvarga: { label: 'Ṣaḍvarga', weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
  saptavarga: { label: 'Saptavarga', weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
  dasavarga: { label: 'Daśavarga', weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
  shodasavarga: { label: 'Ṣoḍaśavarga', weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } },
} as const;
export type SchemeKey = keyof typeof VIMSOPAKA_SCHEMES;

export type Cell = { sign: string; signIndex: number | null; dignity: Dignity };
export type Matrix = Record<string, Record<string, Cell>>;
export type VimsopakaRow = { planet: string } & Record<SchemeKey, number>;

export const DASH_CELL: Cell = { sign: '—', signIndex: null, dignity: 'none' };

export const formatScore = (value: number) => (Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '—');

/** The sign of each body in each divisional chart, with its dignity there. */
export function buildVargaMatrix(planets: Record<string, number>, lagna: number | undefined, divisions: number[]): Matrix {
  const source: Record<string, number | undefined> = { Lagna: lagna, ...planets };
  const matrix: Matrix = {};
  for (const name of ROW_ORDER) {
    matrix[name] = {};
    for (const division of divisions) {
      const longitude = source[name];
      if (typeof longitude !== 'number') {
        matrix[name][`D${division}`] = DASH_CELL;
        continue;
      }
      const signIndex = getVargaSignIndex(longitude, division);
      matrix[name][`D${division}`] = { sign: SIGN_ABBR[signIndex], signIndex, dignity: getDignity(name, signIndex) };
    }
  }
  return matrix;
}

/**
 * Vimśopaka Bala (BPHS 7.10-27, see vimsopaka.ts): the points of a graha in the sign it holds in each varga of a scheme,
 * weighted, out of 20. The points go by the compound relation to the sign's lord; the temporary friendship is read from
 * the rāśi chart, or from the varga's own (the choice C3).
 */
export function buildVimsopakaStrength(planets: Record<string, number>, matrix: Matrix, options: BalaOptions = DEFAULT_BALA_OPTIONS): VimsopakaRow[] {
  const rows: VimsopakaRow[] = [];
  const signsIn = (divisionKey: string): RasiSigns => {
    const signs: RasiSigns = {};
    for (const planet of SCORE_PLANETS) {
      const signIndex = matrix[planet]?.[divisionKey]?.signIndex;
      if (typeof signIndex === 'number') signs[planet] = signIndex;
    }
    return signs;
  };
  const rasiSigns = signsIn('D1');
  const vargaSigns: Record<string, RasiSigns> = {};
  const relationSignsOf = (divisionKey: string) => options.temporaryRelation === 'varga' ? (vargaSigns[divisionKey] ??= signsIn(divisionKey)) : rasiSigns;
  for (const planet of SCORE_PLANETS) {
    if (typeof planets[planet] !== 'number') continue;
    const row = { planet } as VimsopakaRow;
    for (const [schemeKey, scheme] of Object.entries(VIMSOPAKA_SCHEMES) as [SchemeKey, (typeof VIMSOPAKA_SCHEMES)[SchemeKey]][]) {
      row[schemeKey] = Object.entries(scheme.weights).reduce((sum, [divisionKey, weight]) => {
        const signIndex = matrix[planet]?.[divisionKey]?.signIndex;
        if (typeof signIndex !== 'number') return sum;
        return sum + (weight * vimsopakaViswa(planet, signIndex, relationSignsOf(divisionKey), options.vimsopakaDebilitated)) / 20;
      }, 0);
    }
    rows.push(row);
  }
  return rows.sort((a, b) => b.shodasavarga - a.shodasavarga || b.dasavarga - a.dasavarga || b.saptavarga - a.saptavarga || b.shadvarga - a.shadvarga);
}

export function mapPlanetLongitudes(chart: ChartData): Record<string, number> {
  const wanted = new Set(ROW_ORDER.filter((name) => name !== 'Lagna'));
  const result: Record<string, number> = {};
  for (const planet of chart.planets ?? []) {
    if (wanted.has(planet.name) && typeof planet.longitude === 'number') result[planet.name] = planet.longitude;
  }
  return result;
}


/** The Vimsopaka of a chart (the four schemes, out of 20), strongest first. */
export function calculateVimsopaka(chart: ChartData, options: BalaOptions = DEFAULT_BALA_OPTIONS): { rows: VimsopakaRow[]; matrix: Matrix } {
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, DEFAULT_DIVISIONS);
  return { rows: buildVimsopakaStrength(planets, matrix, options), matrix };
}
