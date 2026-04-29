import { calcD1 }  from './d1';
import { calcD2 }  from './d2';
import { calcD3 }  from './d3';
import { calcD4 }  from './d4';
import { calcD5 }  from './d5';
import { calcD7 }  from './d7';
import { calcD9 }  from './d9';
import { calcD10 } from './d10';
import { calcD12 } from './d12';
import { calcD16 } from './d16';
import { calcD20 } from './d20';
import { calcD24 } from './d24';
import { calcD27 } from './d27';
import { calcD30 } from './d30';
import { calcD40 } from './d40';
import { calcD45 } from './d45';
import { calcD60 } from './d60';

export { getSignIndex, getDegreesInSign } from './utils';
export { calcD1, calcD2, calcD3, calcD4, calcD5, calcD7, calcD9, calcD10,
         calcD12, calcD16, calcD20, calcD24, calcD27, calcD30, calcD40, calcD45, calcD60 };

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const SIGN_ABBR = [
  'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi',
  'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi',
] as const;

export type SignIndex = 0|1|2|3|4|5|6|7|8|9|10|11;

export interface VargaRow {
  D1:  number;
  D2:  number;
  D3:  number;
  D4:  number;
  /** UNCERTAIN — verify D5 sequences against JHora output */
  D5:  number;
  D7:  number;
  D9:  number;
  D10: number;
  D12: number;
  D16: number;
  D20: number;
  D24: number;
  D27: number;
  D30: number;
  D40: number;
  D45: number;
  D60: number;
}

/** Returns sign indices (0=Aries … 11=Pisces) for every supported varga division. */
export function calculateVargaMatrix(longitude: number): VargaRow {
  return {
    D1:  calcD1(longitude),
    D2:  calcD2(longitude),
    D3:  calcD3(longitude),
    D4:  calcD4(longitude),
    D5:  calcD5(longitude),
    D7:  calcD7(longitude),
    D9:  calcD9(longitude),
    D10: calcD10(longitude),
    D12: calcD12(longitude),
    D16: calcD16(longitude),
    D20: calcD20(longitude),
    D24: calcD24(longitude),
    D27: calcD27(longitude),
    D30: calcD30(longitude),
    D40: calcD40(longitude),
    D45: calcD45(longitude),
    D60: calcD60(longitude),
  };
}

/** Returns abbreviated sign labels (e.g. "Cn") for every supported varga division. */
export function calculateVargaMatrixAbbr(longitude: number): Record<string, string> {
  const row = calculateVargaMatrix(longitude);
  const out: Record<string, string> = {};
  for (const [key, idx] of Object.entries(row)) {
    out[key] = SIGN_ABBR[idx as number];
  }
  return out;
}

// Dispatch table — for dynamic lookup by division number
const CALC_BY_DIVISION: Record<number, (lon: number) => number> = {
  1: calcD1, 2: calcD2, 3: calcD3, 4: calcD4, 5: calcD5,
  7: calcD7, 9: calcD9, 10: calcD10, 12: calcD12, 16: calcD16,
  20: calcD20, 24: calcD24, 27: calcD27, 30: calcD30,
  40: calcD40, 45: calcD45, 60: calcD60,
};

/**
 * Returns the sign index for a single varga division.
 * Falls back to D1 (Rasi) if the division is not supported.
 */
export function getVargaSignIndex(longitude: number, division: number): number {
  return (CALC_BY_DIVISION[division] ?? calcD1)(longitude);
}
