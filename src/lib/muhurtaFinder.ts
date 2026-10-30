// The Muhūrta Finder: the stretches of time, in a span of days at a place, in which every condition the user has
// chosen holds at once.
//
// The conditions are the ones a panchāṅga gives and a few of the sky: the weekday (vāra, sunrise to sunrise), the
// tithi, the nakṣatra of the Moon, the yoga, the karaṇa, and for the Ascendant and each graha the signs it may be in.
// A group of choices that has every item chosen puts no condition at all; one with none chosen can never hold.
//
// This file is the part that needs no ephemeris: what a pair of longitudes says about the panchāṅga, whether a
// moment suits the conditions, and the walk through time that finds where the answer changes (muhurtaFinderRun.ts
// supplies the positions).

import { NAKSHATRA_SIZE } from './nakshatras';

/** The grahas of the sign grid, and the Ascendant first. Ketu is always opposite Rāhu. */
export const FINDER_GRAHAS = ['Asc', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'] as const;
export type FinderGraha = (typeof FINDER_GRAHAS)[number];

/** The eleven karaṇas: the seven that repeat, then the four that stand fixed (Kiṃstughna at the start of the bright half, the last three at the end of the dark half). */
export const KARANA_NAMES = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garija', 'Vanija', 'Visti', 'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'] as const;

/** The tithi names of one half, from the first to the fifteenth. */
export const FINDER_TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima / Amavasya',
] as const;

const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;

/** The tithi, 1 to 30: 1 to 15 in the bright half (the Moon gaining on the Sun), 16 to 30 in the dark. */
export function tithiOf(sun: number, moon: number): number {
  return Math.floor(normalize(moon - sun) / 12) + 1;
}

/** The nakṣatra of the Moon, 0 (Aśvinī) to 26. */
export function nakshatraOf(moon: number): number {
  return Math.min(Math.floor(normalize(moon) / NAKSHATRA_SIZE), 26);
}

/** The yoga, 0 (Viṣkambha) to 26: the sum of the longitudes of the Sun and the Moon in nakṣatra widths. */
export function yogaOf(sun: number, moon: number): number {
  return Math.min(Math.floor(normalize(sun + moon) / NAKSHATRA_SIZE), 26);
}

/** The karaṇa, an index into KARANA_NAMES (0 to 10): half a tithi each, sixty in a lunar month. */
export function karanaOf(sun: number, moon: number): number {
  const half = Math.floor(normalize(moon - sun) / 6); // 0 to 59
  if (half === 0) return 10; // Kiṃstughna
  if (half >= 57) return 7 + (half - 57); // Shakuni, Chatuṣpada, Nāga
  return (half - 1) % 7;
}

/** The sign (0 Aries to 11 Pisces) of a longitude. */
export const signOf = (longitude: number) => Math.floor(normalize(longitude) / 30) % 12;

/**
 * The conditions. Each list is what is allowed: a list with every item is no condition (and is not looked at), an
 * empty one can never be met. `signs` has an entry only for a graha that is limited.
 */
export interface FinderCriteria {
  /** Weekdays, 0 Sunday to 6 Saturday. */
  vara: number[];
  /** 1 to 30 (1 to 15 the bright half, 16 to 30 the dark). */
  tithi: number[];
  nakshatra: number[];
  yoga: number[];
  /** Indexes into KARANA_NAMES. */
  karana: number[];
  signs: Partial<Record<FinderGraha, number[]>>;
}

export const FINDER_SIZES = { vara: 7, tithi: 30, nakshatra: 27, yoga: 27, karana: 11 } as const;

/** Whether a list is limited at all: it is not when it holds every one of the `size` items. */
export const isLimited = (allowed: readonly number[], size: number) => new Set(allowed).size < size;

/** Whether the conditions can never be met: some limited group has nothing chosen. */
export function isImpossible(criteria: FinderCriteria): boolean {
  const groups = [criteria.vara, criteria.tithi, criteria.nakshatra, criteria.yoga, criteria.karana, ...Object.values(criteria.signs)];
  return groups.some(group => group !== undefined && group.length === 0);
}

/** What a moment is, for the conditions: the longitudes (sidereal) the conditions ask about, and the weekday. */
export interface FinderMoment {
  vara: number;
  sun: number;
  moon: number;
  /** The Ascendant, and the grahas other than the Sun and the Moon, by name. */
  others: Partial<Record<FinderGraha, number>>;
}

/** Which bodies the conditions need, so that the ephemeris is asked for no more. */
export function neededBodies(criteria: FinderCriteria): { luminaries: boolean; others: FinderGraha[] } {
  const others = (Object.keys(criteria.signs) as FinderGraha[]).filter(
    graha => graha !== 'Sun' && graha !== 'Moon' && criteria.signs[graha] !== undefined && isLimited(criteria.signs[graha]!, 12),
  );
  const luminaries =
    isLimited(criteria.tithi, FINDER_SIZES.tithi) || isLimited(criteria.nakshatra, FINDER_SIZES.nakshatra) ||
    isLimited(criteria.yoga, FINDER_SIZES.yoga) || isLimited(criteria.karana, FINDER_SIZES.karana) ||
    (criteria.signs.Sun !== undefined && isLimited(criteria.signs.Sun, 12)) ||
    (criteria.signs.Moon !== undefined && isLimited(criteria.signs.Moon, 12));
  return { luminaries, others };
}

/** The conditions of the weekday alone, for the check that needs no ephemeris. */
export const matchesVara = (criteria: FinderCriteria, vara: number) => !isLimited(criteria.vara, FINDER_SIZES.vara) || criteria.vara.includes(vara);

/** Whether a moment meets every condition. A body the moment lacks is a condition not met. */
export function momentMatches(moment: FinderMoment, criteria: FinderCriteria): boolean {
  if (!matchesVara(criteria, moment.vara)) return false;
  const { sun, moon } = moment;
  if (isLimited(criteria.tithi, FINDER_SIZES.tithi) && !criteria.tithi.includes(tithiOf(sun, moon))) return false;
  if (isLimited(criteria.nakshatra, FINDER_SIZES.nakshatra) && !criteria.nakshatra.includes(nakshatraOf(moon))) return false;
  if (isLimited(criteria.yoga, FINDER_SIZES.yoga) && !criteria.yoga.includes(yogaOf(sun, moon))) return false;
  if (isLimited(criteria.karana, FINDER_SIZES.karana) && !criteria.karana.includes(karanaOf(sun, moon))) return false;
  for (const graha of Object.keys(criteria.signs) as FinderGraha[]) {
    const allowed = criteria.signs[graha];
    if (allowed === undefined || !isLimited(allowed, 12)) continue;
    const longitude = graha === 'Sun' ? sun : graha === 'Moon' ? moon : moment.others[graha];
    if (longitude === undefined || !allowed.includes(signOf(longitude))) return false;
  }
  return true;
}

/** The tithi as a table writes it: S1 to S15 in the bright half (śukla), K1 to K15 in the dark (kṛṣṇa). */
export const tithiLabel = (tithi: number) => (tithi <= 15 ? `S${tithi}` : `K${tithi - 15}`);

/**
 * The clock of a moment (UTC milliseconds) at a place: by the IANA zone, which knows the daylight-saving time of that
 * date, or by a fixed offset in hours when there is no zone (or it is not one). `weekday` is the calendar day's, 0 Sunday.
 */
export function localParts(ms: number, zone: string | undefined, fixedOffsetHours: number): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const fields = (date: Date) => ({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes() });
  let parts: { year: number; month: number; day: number; hour: number; minute: number };
  try {
    if (!zone) throw new Error('no zone');
    const named = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms));
    const get = (type: string) => Number(named.find(part => part.type === type)?.value);
    parts = { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
    if (Object.values(parts).some(value => !Number.isFinite(value))) throw new Error('not a zone');
  } catch {
    parts = fields(new Date(ms + fixedOffsetHours * 3_600_000));
  }
  return { ...parts, weekday: new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay() };
}

export interface FinderWindow {
  /** Julian day (UT) of the start and the end of the stretch. */
  startJd: number;
  endJd: number;
}

export const MINUTE_JD = 1 / 1440;

/**
 * The stretches between `fromJd` and `toJd` in which `holds` is true. The answer is looked at every `stepMinutes`;
 * where it changes, the moment of the change is found to the minute by halving. A stretch shorter than a step can be
 * missed, and a stretch cut by the ends of the span is cut there.
 */
export async function findWindows(
  holds: (jd: number) => Promise<boolean>,
  fromJd: number,
  toJd: number,
  stepMinutes: number,
  /** Stop after this many stretches. */
  limit = Infinity,
): Promise<{ windows: FinderWindow[]; truncated: boolean }> {
  const step = stepMinutes * MINUTE_JD;
  const windows: FinderWindow[] = [];
  const edge = async (falseJd: number, trueJd: number): Promise<number> => {
    // `falseJd` is a moment where the answer is no, `trueJd` one where it is yes; the change is between them.
    let low = falseJd;
    let high = trueJd;
    while (Math.abs(high - low) > MINUTE_JD) {
      const middle = (low + high) / 2;
      if (await holds(middle)) high = middle; else low = middle;
    }
    return high;
  };

  let previousJd = fromJd;
  let previous = await holds(fromJd);
  let start: number | null = previous ? fromJd : null;
  for (let jd = fromJd + step; ; jd += step) {
    const at = Math.min(jd, toJd);
    const now = await holds(at);
    if (now !== previous) {
      const change = await edge(previous ? at : previousJd, previous ? previousJd : at);
      if (now) {
        start = change;
      } else if (start !== null) {
        windows.push({ startJd: start, endJd: change });
        start = null;
        if (windows.length >= limit) return { windows, truncated: true };
      }
    }
    previous = now;
    previousJd = at;
    if (at >= toJd) break;
  }
  if (start !== null) windows.push({ startJd: start, endJd: toJd });
  return { windows, truncated: false };
}
