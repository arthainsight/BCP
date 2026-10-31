import { normalizeDegrees } from './angles';

/**
 * Facts of a birth that the conditions of the nakṣatra daśās of BPHS 46 ask for, worked out from longitudes alone.
 */

/** The sign (1–12) of the navāṁśa of a longitude: 108 divisions of 3°20′ counted from Aries round the zodiac. */
export function navamshaSign(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude) / (30 / 9)) % 12 + 1;
}

/**
 * The lord of the horā of a longitude (BPHS 6.6: a horā is half a sign, 24 from Aries in two rounds): in an odd sign the first half
 * is the Sun's and the second the Moon's, in an even sign the first the Moon's and the second the Sun's.
 */
export function horaLord(longitude: number): 'Sun' | 'Moon' {
  const normalized = normalizeDegrees(longitude);
  const oddSign = Math.floor(normalized / 30) % 2 === 0;
  const firstHalf = normalized % 30 < 15;
  return oddSign === firstHalf ? 'Sun' : 'Moon';
}

/** Whether the Sun is above the horizon: in the half of the zodiac from the 7th house to the 12th, reckoned from the degree of the Lagna. */
export function isDayBirth(sunLongitude: number, lagnaLongitude: number): boolean {
  return normalizeDegrees(sunLongitude - lagnaLongitude) >= 180;
}

/** Whether the Moon is in the bright half of the month: less than 180° ahead of the Sun. */
export function isBrightHalf(sunLongitude: number, moonLongitude: number): boolean {
  return normalizeDegrees(moonLongitude - sunLongitude) < 180;
}

export function birthHalves(sunLongitude: number, moonLongitude: number, lagnaLongitude: number) {
  return { day: isDayBirth(sunLongitude, lagnaLongitude), bright: isBrightHalf(sunLongitude, moonLongitude) };
}
