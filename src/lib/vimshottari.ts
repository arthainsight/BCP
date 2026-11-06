// Vimshottari Dasha — standard 120-year cycle from Moon nakshatra

import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { addDashaYears } from './time';
import { splitDashaPeriod } from './dashaSplit';

const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;

const YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};


/** The nine lords in daśā order and the years of each, for the daśās that borrow the Vimśottarī cycle. */
export const VIMSHOTTARI_LORDS = LORDS;
export const VIMSHOTTARI_YEARS: Readonly<Record<string, number>> = YEARS;

export interface MahadashaEntry {
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  /** The length of the period when whole; only the balance at birth, which is cut short, carries it. */
  fullDurationYears?: number;
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
    const cutShort = i === 0 && fractionRemaining < 1;
    entries.push({ lord, startDate: cursor, endDate, durationYears: duration, ...(cutShort ? { fullDurationYears: YEARS[startLord] } : {}) });
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
// A parent that is the balance at birth is cut short: its sub-periods are those of the whole period, from the moment
// the whole would have begun, without the ones over before birth (see dashaSplit.ts).
export function calculateSubDashas(parent: MahadashaEntry): MahadashaEntry[] {
  const parentLordIndex = LORDS.findIndex((l) => l === parent.lord);
  return splitDashaPeriod(parent, LORDS.map((_, i) => {
    const lord = LORDS[(parentLordIndex + i) % 9];
    return {
      weight: YEARS[lord],
      build: ({ startDate, endDate, durationYears, fullDurationYears }): MahadashaEntry =>
        ({ lord, startDate, endDate, durationYears, ...(fullDurationYears !== undefined ? { fullDurationYears } : {}) }),
    };
  }));
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
