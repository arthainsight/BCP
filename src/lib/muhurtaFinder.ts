// The Muhūrta Finder: the stretches of time, in a span of days at a place, in which every condition the user has
// chosen holds at once.
//
// The conditions are the ones a panchāṅga gives and a few of the sky: the weekday (vāra, sunrise to sunrise), the
// tithi, the nakṣatra of the Moon, the yoga, the karaṇa, and for the Ascendant and each graha the signs it may be in.
// A group of choices that has every item chosen puts no condition at all; one with none chosen can never hold.
//
// Beyond the signs, the placements of the grahas can be asked for as rules in the houses counted from the Ascendant
// (the sign of the Ascendant is the first house): "at least one of Venus and the Moon in the 1st", "none of the malefics
// in the 8th and the 12th".
//
// Chandrabala is the Moon's house counted from the sign of the Moon at birth: the houses chosen are the ones that suit.
//
// This file is the part that needs no ephemeris: what a pair of longitudes says about the panchāṅga, whether a
// moment suits the conditions, and the walk through time that finds where the answer changes (muhurtaFinderRun.ts
// supplies the positions).

import { NAKSHATRA_SIZE } from './nakshatras';

/** The grahas of the sign grid, and the Ascendant first. Ketu is always opposite Rāhu. */
export const FINDER_GRAHAS = ['Asc', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export type FinderGraha = (typeof FINDER_GRAHAS)[number];
/** The grahas a rule may name: the nine, not the Ascendant. */
export const RULE_GRAHAS = FINDER_GRAHAS.filter(graha => graha !== 'Asc');
/** The natural benefics and malefics, for the shortcuts of the rules (the Moon is taken with the benefics). */
export const BENEFICS: FinderGraha[] = ['Moon', 'Mercury', 'Jupiter', 'Venus'];
export const MALEFICS: FinderGraha[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];

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
  /** Placement rules, all of which must hold. */
  rules?: FinderRule[];
  /** Chandrabala: the houses (1 to 12) from the sign of the Moon at birth (`moonSign`, 0 Aries to 11 Pisces) the Moon may be in. */
  chandra?: { moonSign: number; houses: number[] };
  /** The Mahādoṣas (ids of mahadosha.ts) the stretches must be free of. */
  avoid?: string[];
  /** The signs (0 to 11) of the Ascendant and the Moon of the birth chart, for the Aṣṭama Lagna. */
  natal?: { ascSign: number; moonSign: number };
  /** Hours on each side of the Sun entering a sign that the Saṅkrānti doṣa keeps clear of (16 ghaṭīs, 6.4 hours, if not given). */
  sankrantiHours?: number;
}

/** The hours on each side of a Saṅkrānti that are kept clear of: 16 ghaṭīs of 24 minutes. */
export const SANKRANTI_HOURS = 6.4;

/** The houses from the Moon at birth that are usually taken to suit: the 1st, 3rd, 6th, 7th, 10th and 11th. */
export const CHANDRABALA_USUAL = [1, 3, 6, 7, 10, 11];

/**
 * A rule about houses (1 to 12, counted from the sign of the Ascendant): `any` holds when at least one of the grahas is
 * in one of the houses, `none` when no graha of the list is in any of them.
 */
export interface FinderRule {
  kind: 'any' | 'none';
  grahas: FinderGraha[];
  houses: number[];
}

/** The house, 1 to 12, that a longitude is in when the Ascendant is in the sign `ascSign`. */
export const houseFrom = (ascSign: number, longitude: number) => ((signOf(longitude) - ascSign + 12) % 12) + 1;

/** The rules that put a condition: a `none` rule with nothing to keep out, or with no graha, holds always. */
export const effectiveRules = (criteria: Pick<FinderCriteria, 'rules'>): FinderRule[] =>
  (criteria.rules ?? []).filter(rule => rule.grahas.length > 0 && (rule.kind === 'any' || rule.houses.length > 0));

/** Whether a rule can never hold: an `any` with no graha or no house, or a `none` that keeps the grahas out of every house. */
export const isImpossibleRule = (rule: FinderRule) =>
  rule.kind === 'any' ? rule.grahas.length === 0 || rule.houses.length === 0 : rule.grahas.length > 0 && new Set(rule.houses).size >= 12;

/** Whether a rule holds, given the house each graha is in. A graha with no house (one that was not worked out) fails it. */
export function ruleMatches(rule: FinderRule, houseOf: (graha: FinderGraha) => number | undefined): boolean {
  const houses = rule.grahas.map(houseOf);
  if (houses.some(house => house === undefined)) return false;
  const inside = houses.some(house => rule.houses.includes(house as number));
  return rule.kind === 'any' ? inside : !inside;
}

/** The text of the Chandrabala for the address of a request: `1:1,3,6,7,10,11` (the sign of the Moon at birth, then the houses). */
export const formatChandra = (chandra: { moonSign: number; houses: number[] }) => `${chandra.moonSign}:${chandra.houses.join(',')}`;

/** The Chandrabala from its text, or what is wrong with it. */
export function parseChandra(text: string): { moonSign: number; houses: number[] } | { error: string } {
  const parts = text.split(':');
  if (parts.length !== 2 || !/^\d{1,2}$/.test(parts[0].trim()) || Number(parts[0]) > 11) return { error: 'chandra must be the sign of the Moon from 0 to 11, a colon and the houses' };
  const items = parts[1].trim() === '' ? [] : parts[1].split(',').map(item => item.trim());
  const houses = new Set<number>();
  for (const item of items) {
    const value = /^\d{1,2}$/.test(item) ? Number(item) : NaN;
    if (!(value >= 1 && value <= 12)) return { error: 'chandra houses must be whole numbers from 1 to 12' };
    houses.add(value);
  }
  return { moonSign: Number(parts[0]), houses: [...houses].sort((a, b) => a - b) };
}

/** The text of a rule for the address of a request: `any:Venus,Moon:1`. */
export const formatRule = (rule: FinderRule) => `${rule.kind}:${rule.grahas.join(',')}:${rule.houses.join(',')}`;

/** A rule from its text, or what is wrong with it. */
export function parseRule(text: string): FinderRule | { error: string } {
  const parts = text.split(':');
  if (parts.length !== 3 || (parts[0] !== 'any' && parts[0] !== 'none')) return { error: 'rule must be any:grahas:houses or none:grahas:houses' };
  const names = parts[1].trim() === '' ? [] : parts[1].split(',').map(item => item.trim());
  const grahas: FinderGraha[] = [];
  for (const name of names) {
    if (!(RULE_GRAHAS as readonly string[]).includes(name)) return { error: `rule graha must be one of ${RULE_GRAHAS.join(', ')}` };
    if (!grahas.includes(name as FinderGraha)) grahas.push(name as FinderGraha);
  }
  const numbers = parts[2].trim() === '' ? [] : parts[2].split(',').map(item => item.trim());
  const houses = new Set<number>();
  for (const item of numbers) {
    const value = /^\d{1,2}$/.test(item) ? Number(item) : NaN;
    if (!(value >= 1 && value <= 12)) return { error: 'rule houses must be whole numbers from 1 to 12' };
    houses.add(value);
  }
  return { kind: parts[0], grahas, houses: [...houses].sort((a, b) => a - b) };
}

export const FINDER_SIZES = { vara: 7, tithi: 30, nakshatra: 27, yoga: 27, karana: 11 } as const;

/** Whether a list is limited at all: it is not when it holds every one of the `size` items. */
export const isLimited = (allowed: readonly number[], size: number) => new Set(allowed).size < size;

/** Whether the conditions can never be met: some limited group has nothing chosen. */
export function isImpossible(criteria: FinderCriteria): boolean {
  const groups = [criteria.vara, criteria.tithi, criteria.nakshatra, criteria.yoga, criteria.karana, ...Object.values(criteria.signs)];
  return groups.some(group => group !== undefined && group.length === 0) || (criteria.rules ?? []).some(isImpossibleRule) || (criteria.chandra !== undefined && criteria.chandra.houses.length === 0);
}

/** What a moment is, for the conditions: the longitudes (sidereal) the conditions ask about, and the weekday. */
export interface FinderMoment {
  vara: number;
  sun: number;
  moon: number;
  /** The Ascendant, and the grahas other than the Sun and the Moon, by name. */
  others: Partial<Record<FinderGraha, number>>;
}

/** The longitude of a graha in a moment; Ketu is opposite Rāhu. */
export function grahaLongitude(moment: FinderMoment, graha: FinderGraha): number | undefined {
  if (graha === 'Sun') return moment.sun;
  if (graha === 'Moon') return moment.moon;
  if (graha === 'Ketu') return moment.others.Rahu === undefined ? undefined : normalize(moment.others.Rahu + 180);
  return moment.others[graha];
}

/** Which bodies the conditions need, so that the ephemeris is asked for no more. */
export function neededBodies(criteria: FinderCriteria): { luminaries: boolean; others: FinderGraha[] } {
  const others = (Object.keys(criteria.signs) as FinderGraha[]).filter(
    graha => graha !== 'Sun' && graha !== 'Moon' && criteria.signs[graha] !== undefined && isLimited(criteria.signs[graha]!, 12),
  );
  const luminaries =
    isLimited(criteria.tithi, FINDER_SIZES.tithi) || isLimited(criteria.nakshatra, FINDER_SIZES.nakshatra) ||
    isLimited(criteria.yoga, FINDER_SIZES.yoga) || isLimited(criteria.karana, FINDER_SIZES.karana) ||
    (criteria.chandra !== undefined && isLimited(criteria.chandra.houses, 12)) ||
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
  if (criteria.chandra !== undefined && isLimited(criteria.chandra.houses, 12) && !criteria.chandra.houses.includes(houseFrom(criteria.chandra.moonSign, moon))) return false;
  for (const graha of Object.keys(criteria.signs) as FinderGraha[]) {
    const allowed = criteria.signs[graha];
    if (allowed === undefined || !isLimited(allowed, 12)) continue;
    const longitude = grahaLongitude(moment, graha);
    if (longitude === undefined || !allowed.includes(signOf(longitude))) return false;
  }
  const rules = effectiveRules(criteria);
  if (rules.length > 0) {
    const asc = moment.others.Asc;
    if (asc === undefined) return false;
    const ascSign = signOf(asc);
    const houseOf = (graha: FinderGraha) => {
      const longitude = grahaLongitude(moment, graha);
      return longitude === undefined ? undefined : houseFrom(ascSign, longitude);
    };
    if (!rules.every(rule => ruleMatches(rule, houseOf))) return false;
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
