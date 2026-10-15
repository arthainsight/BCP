import type { PlanetData } from '@/types';
import { normalizeDegrees } from '@/lib/angles';
import { DEBILITATION, EXALTATION, NATURAL_FRIENDS, OWN_SIGNS } from '@/lib/dignity';
import { signLord } from '@/lib/signs';

// What the yoga rules share: who counts as a benefic, and counting signs and houses.

const NAT_MALEFIC = new Set(['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']);

/**
 * Dynamic benefic status: true = benefic, false = malefic, null = neutral. Jupiter and Venus are benefic; the Sun, Mars,
 * Saturn and the nodes malefic; the Moon is benefic within 60° of the full Moon and malefic within 60° of the new
 * Moon (neutral between); Mercury is benefic unless it shares a sign with a malefic.
 */
export function dynamicBeneficStatus(name: string, planets: PlanetData[]): true | false | null {
  const NAT_BENEFIC = new Set(['Jupiter', 'Venus']);
  if (NAT_BENEFIC.has(name)) return true;
  if (NAT_MALEFIC.has(name)) return false;
  if (name === 'Moon') {
    const sun  = planets.find(p => p.name === 'Sun');
    const moon = planets.find(p => p.name === 'Moon');
    if (sun && moon) {
      const diff = normalizeDegrees(moon.longitude - sun.longitude);
      if (diff >= 120 && diff <= 240) return true;
      if (diff <= 60  || diff >= 300) return false;
    }
    return null;
  }
  if (name === 'Mercury') {
    const mercury = planets.find(p => p.name === 'Mercury');
    if (!mercury) return true;
    if (planets.some(p => p.name !== 'Mercury' && p.sign === mercury.sign && NAT_MALEFIC.has(p.name))) return false;
    return true;
  }
  return null;
}

/** The sign (1–12) of the nth house counted from a reference sign (the first is the reference sign itself). */
export const signFrom = (referenceSign: number, n: number) => ((referenceSign - 1 + n - 1) % 12) + 1;

/** The house (1–12) a sign is, counted from a reference sign. */
export const houseFrom = (referenceSign: number, sign: number) => ((sign - referenceSign + 12) % 12) + 1;

export const KENDRAS = [1, 4, 7, 10];
export const TRIKONAS = [1, 5, 9];

/** 1st, 2nd, 3rd, 4th … */
export function ordinal(n: number): string {
  if (n === 11 || n === 12 || n === 13) return `${n}th`;
  const d = n % 10;
  if (d === 1) return `${n}st`;
  if (d === 2) return `${n}nd`;
  if (d === 3) return `${n}rd`;
  return `${n}th`;
}

const GRAHA_EXTRA_ASPECTS: Record<string, number[]> = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };

/** Whether a graha casts its aspect (Parāśara: the 7th from itself, and the special ones of Mars, Jupiter and Saturn) on a sign. */
export function aspectsSign(planet: Pick<PlanetData, 'name' | 'sign'>, sign: number): boolean {
  return [7, ...(GRAHA_EXTRA_ASPECTS[planet.name] ?? [])].some(offset => signFrom(planet.sign, offset) === sign);
}

export const TRIKONAS_AND_KENDRAS = [1, 4, 5, 7, 9, 10];

/** In its own sign or in exaltation (the Moolatrikona signs are one of the two). */
export const inOwnOrExaltation = (planet: Pick<PlanetData, 'name' | 'sign'>) => EXALTATION[planet.name] === planet.sign || Boolean(OWN_SIGNS[planet.name]?.includes(planet.sign));

/** In the sign of a natural friend. */
export const inFriendlySign = (planet: Pick<PlanetData, 'name' | 'sign'>) => (NATURAL_FRIENDS[planet.name] ?? []).includes(signLord(planet.sign));

/**
 * A "strong" lord, as the yogas that ask for one count it (BPHS says "endowed with strength", which is Shadbala; the chart
 * alone cannot show that): not debilitated, and in its own sign, in exaltation, in a friendly sign, or in a Kendra or Trikona
 * from the Lagna. JHora reads it by the dignity of the sign for Kahala, Shankha and Bheri and by the Kendras and Trikonas
 * for Lakshmi; this takes both.
 */
export const isStrongLord = (planet: Pick<PlanetData, 'name' | 'sign'>, ascendantSign: number) =>
  DEBILITATION[planet.name] !== planet.sign &&
  (inOwnOrExaltation(planet) || inFriendlySign(planet) || TRIKONAS_AND_KENDRAS.includes(houseFrom(ascendantSign, planet.sign)));

export const NOT_STRONG = 'not strong (not debilitated and in its own, exaltation or friendly sign or in a Kendra or Trikona)';
