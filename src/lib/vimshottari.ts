// Vimshottari Dasha — standard 120-year cycle from Moon nakshatra

import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { addDashaYears } from './time';

const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;

const YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};


export interface MahadashaEntry {
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
}

export interface VimshottariResult {
  nakshatra: string;
  nakshatraLord: string;
  entries: MahadashaEntry[];
}

export function calculateVimshottari(
  moonLongitude: number,
  birthDate: Date,
): VimshottariResult {
  const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SIZE);
  const lordIndex = nakshatraIndex % 9;
  const startLord = LORDS[lordIndex];

  // Fraction of nakshatra already traversed → remaining balance at birth
  const positionInNakshatra = moonLongitude - nakshatraIndex * NAKSHATRA_SIZE;
  const fractionRemaining = 1 - positionInNakshatra / NAKSHATRA_SIZE;

  const entries: MahadashaEntry[] = [];
  let cursor = birthDate;

  for (let i = 0; i < 9; i++) {
    const lord = LORDS[(lordIndex + i) % 9];
    const duration = i === 0 ? YEARS[startLord] * fractionRemaining : YEARS[lord];
    const endDate = addDashaYears(cursor, duration);
    entries.push({ lord, startDate: cursor, endDate, durationYears: duration });
    cursor = endDate;
  }

  return {
    nakshatra: NAKSHATRA_NAMES[nakshatraIndex] ?? `Nakshatra ${nakshatraIndex}`,
    nakshatraLord: startLord,
    entries,
  };
}

// Generic Vimshottari sub-period calculator.
// Next level duration = parent duration * sub-lord years / 120.
// The sub-period sequence starts from the parent lord.
export function calculateSubDashas(parent: MahadashaEntry): MahadashaEntry[] {
  const parentLordIndex = LORDS.findIndex((l) => l === parent.lord);
  let cursor = parent.startDate;

  return LORDS.map((_, i) => {
    const lord = LORDS[(parentLordIndex + i) % 9];
    const duration = (parent.durationYears * YEARS[lord]) / 120;
    const endDate = addDashaYears(cursor, duration);
    const entry: MahadashaEntry = { lord, startDate: cursor, endDate, durationYears: duration };
    cursor = endDate;
    return entry;
  });
}

// AD duration = MD duration * AD lord years / 120
export function calculateAntardashas(md: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(md);
}

// PD duration = AD duration * PD lord years / 120
export function calculatePratyantardashas(ad: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(ad);
}

/** Lords of the Vimshottari mahadasha and antardasha running at a moment. */
export interface RunningDashaLords {
  md: string;
  ad: string;
}

export function runningVimshottariLords(moonLongitude: number, birthDate: Date, at: Date): RunningDashaLords | null {
  const md = calculateVimshottari(moonLongitude, birthDate).entries.find(e => e.startDate <= at && at < e.endDate);
  if (!md) return null;
  const ad = calculateAntardashas(md).find(e => e.startDate <= at && at < e.endDate);
  return ad ? { md: md.lord, ad: ad.lord } : null;
}
