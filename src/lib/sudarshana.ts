import { signLord } from './signs';
import { EXALTATION } from './dignity';
import { dynamicBeneficStatus, houseFrom, signFrom } from './yogaCommon';
import type { PlanetData } from '@/types';

// The Sudarśana Chakra (BPHS 74): three charts one inside another, the signs counted from the Lagna, from the Moon and
// from the Sun, so that the same house (1 to 12) stands on the same side of all three. The Lagna chart is the innermost
// ring, the Moon's the middle one and the Sun's the outermost. The Sudarśana daśā moves through them together: in the
// first year of life the 1st house of each is active, in the second year the 2nd, and so on round the twelve houses,
// the 13th year being the 1st again. A year is divided into twelve months, each month into twelve Pratyantara
// periods, and each Pratyantara into twelve Vidāśās; the first subdivision starts with the house of its parent period.

export type SudarshanaRingId = 'lagna' | 'moon' | 'sun';

/** The three charts in the order they are read: the Lagna, the Moon and the Sun. */
export const SUDARSHANA_RINGS: readonly SudarshanaRingId[] = ['lagna', 'moon', 'sun'];

/** The three charts as BPHS draws them, from the outside in: the Sun's, the Moon's and, innermost, the Lagna's. */
export const SUDARSHANA_DRAWING: readonly SudarshanaRingId[] = ['sun', 'moon', 'lagna'];

/** BPHS 74.18-20: the chakra is used only when the Lagna, the Moon and the Sun are in three different signs; otherwise the Lagna chart alone is judged. */
export const sudarshanaApplies = (lagnaSign: number, moonSign: number, sunSign: number) => new Set([lagnaSign, moonSign, sunSign]).size === 3;

export interface SudarshanaHouse {
  /** The house, 1 to 12, counted from the ring's own reference sign. */
  house: number;
  /** The sign it is, 1 (Aries) to 12. */
  sign: number;
  /** The lord of the sign. */
  lord: string;
  /** The grahas standing in the sign, in the order given. */
  planets: string[];
}

export interface SudarshanaRing {
  id: SudarshanaRingId;
  /** The sign the chart is counted from: the Lagna's, the Moon's or the Sun's. */
  referenceSign: number;
  houses: SudarshanaHouse[];
}

/** The signs of a house counted from a reference sign (1 to 12): the first house is the reference sign itself. */
export const signOfHouse = (referenceSign: number, house: number) => ((referenceSign - 1 + house - 1) % 12) + 1;

/** The three rings of the chakra for a chart: its Lagna, Moon and Sun signs and the signs of the grahas. */
export function sudarshanaRings(
  lagnaSign: number,
  moonSign: number,
  sunSign: number,
  planets: readonly { name: string; sign: number }[],
): SudarshanaRing[] {
  const referenceSigns: Record<SudarshanaRingId, number> = { lagna: lagnaSign, moon: moonSign, sun: sunSign };
  return SUDARSHANA_RINGS.map(id => ({
    id,
    referenceSign: referenceSigns[id],
    houses: Array.from({ length: 12 }, (_, index) => {
      const house = index + 1;
      const sign = signOfHouse(referenceSigns[id], house);
      return { house, sign, lord: signLord(sign), planets: planets.filter(planet => planet.sign === sign).map(planet => planet.name) };
    }),
  }));
}

/**
 * The house the Sudarśana daśā makes active, the same number in the three rings. `age` is the completed years (0
 * in the first year of life), `month` the month of that year (0 to 11) and `pratyantara` the Pratyantara subdivision of that month (0 to 11).
 */
export function sudarshanaHouse(age: number, month = 0, pratyantara = 0): number {
  return ((((age + month + pratyantara) % 12) + 12) % 12) + 1;
}

export interface SudarshanaPeriod {
  /** The house the period makes active, 1 to 12. */
  house: number;
  startJd: number;
  endJd: number;
}

/**
 * A period cut in twelve equal parts, as the year is cut into months and a month into days. The first part has the
 * house of the whole (`house`), each next one the next house.
 */
export function sudarshanaSubPeriods(startJd: number, endJd: number, house: number): SudarshanaPeriod[] {
  const step = (endJd - startJd) / 12;
  return Array.from({ length: 12 }, (_, index) => ({
    house: ((house - 1 + index) % 12) + 1,
    startJd: startJd + step * index,
    endJd: index === 11 ? endJd : startJd + step * (index + 1),
  }));
}

// --- Local time of a Julian day, for the periods ---------------------------------------------------------------------

export interface LocalParts { year: number; month: number; day: number; hour: number; minute: number; second: number }

/** The local date and time of a Julian day (UT), for a UTC offset in hours. */
export function jdToLocalParts(jd: number, tzOffsetHours: number): LocalParts {
  const date = new Date(Math.round(((jd - 2440587.5) * 86400 + tzOffsetHours * 3600)) * 1000);
  return {
    year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(),
    hour: date.getUTCHours(), minute: date.getUTCMinutes(), second: date.getUTCSeconds(),
  };
}

// --- What stands in a house of the chakra ---------------------------------------------------------------------------

const GRAHA_EXTRA_ASPECTS: Record<string, number[]> = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };
const NINE = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export interface SudarshanaFacts {
  /** The grahas in the sign of the house. */
  occupants: string[];
  /** The grahas that cast an aspect on the sign (Parāśara's: the 7th, and the special aspects of Mars, Jupiter, Saturn and the nodes), not counting those in it. */
  aspecting: string[];
  /** The lord of the sign, the sign it stands in and its house counted from the ring's reference sign; null when it is not in the chart. */
  lordPlace: { lord: string; sign: number; house: number } | null;
  /** How many of the occupants and aspecting grahas are benefic, malefic, and neither. */
  benefics: number;
  malefics: number;
}

/** The facts about one house of one ring: who stands in it, who aspects it, where its lord is. */
export function sudarshanaFacts(ring: SudarshanaRing, house: number, planets: readonly PlanetData[]): SudarshanaFacts {
  const entry = ring.houses[house - 1];
  const grahas = planets.filter(planet => NINE.includes(planet.name));
  const occupants = grahas.filter(planet => planet.sign === entry.sign).map(planet => planet.name);
  const aspecting = grahas
    .filter(planet => planet.sign !== entry.sign)
    .filter(planet => {
      const offsets = planet.name === 'Rahu' || planet.name === 'Ketu' ? [7, 5, 9] : [7, ...(GRAHA_EXTRA_ASPECTS[planet.name] ?? [])];
      return offsets.some(offset => signFrom(planet.sign, offset) === entry.sign);
    })
    .map(planet => planet.name);
  const lord = grahas.find(planet => planet.name === entry.lord);
  const status = (name: string) => dynamicBeneficStatus(name, [...planets]);
  const all = [...occupants, ...aspecting];
  return {
    occupants,
    aspecting,
    lordPlace: lord ? { lord: lord.name, sign: lord.sign, house: houseFrom(ring.referenceSign, lord.sign) } : null,
    benefics: all.filter(name => status(name) === true).length,
    malefics: all.filter(name => status(name) === false).length,
  };
}

// --- The verdict on a house (BPHS 74.10-14) --------------------------------------------------------------------------
// The grahas in the house decide, benefics against malefics, the majority winning and an equal number being mixed.
// With none in it, the grahas that aspect it decide; with none of those, its lord. The Sun is a benefic only in the
// 1st house of the ring (BPHS 74.7-9), and a malefic in its exaltation sign does no harm. The adjustment of the
// natures by the Saptavarga, the check against the Ashtakavarga and the reading of the planets at the start of the
// period are not made.

export type SudarshanaNature = 'benefic' | 'malefic' | 'mixed' | 'none';

export interface SudarshanaVerdict {
  /** What decided: the grahas in the sign, the grahas aspecting it, or its lord. */
  basis: 'occupants' | 'aspects' | 'lord';
  nature: SudarshanaNature;
  benefics: string[];
  malefics: string[];
}

function natureInRing(name: string, ring: SudarshanaRing, planets: readonly PlanetData[]): 'benefic' | 'malefic' | null {
  const planet = planets.find(item => item.name === name);
  if (!planet) return null;
  const harmless = EXALTATION[name] === planet.sign;
  if (name === 'Sun') return houseFrom(ring.referenceSign, planet.sign) === 1 ? 'benefic' : harmless ? null : 'malefic';
  const status = dynamicBeneficStatus(name, [...planets]);
  return status === true ? 'benefic' : status === false && !harmless ? 'malefic' : null;
}

/** The verdict on one house of one ring, by the rule above. */
export function sudarshanaVerdict(ring: SudarshanaRing, house: number, planets: readonly PlanetData[]): SudarshanaVerdict {
  const facts = sudarshanaFacts(ring, house, planets);
  const judge = (names: string[], basis: SudarshanaVerdict['basis']): SudarshanaVerdict | null => {
    const natures = names.map(name => ({ name, nature: natureInRing(name, ring, planets) }));
    const benefics = natures.filter(item => item.nature === 'benefic').map(item => item.name);
    const malefics = natures.filter(item => item.nature === 'malefic').map(item => item.name);
    if (benefics.length === 0 && malefics.length === 0) return null;
    return { basis, nature: benefics.length > malefics.length ? 'benefic' : malefics.length > benefics.length ? 'malefic' : 'mixed', benefics, malefics };
  };
  return judge(facts.occupants, 'occupants')
    ?? judge(facts.aspecting, 'aspects')
    ?? judge(facts.lordPlace ? [facts.lordPlace.lord] : [], 'lord')
    ?? { basis: 'lord', nature: 'none', benefics: [], malefics: [] };
}
