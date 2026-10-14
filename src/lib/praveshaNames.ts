// What a Praveśa shows about its quantity, without the ephemeris, so the panel can use it in the browser.

import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { YOGA_NAMES } from './panchang';
import { normalizeDegrees } from './angles';

/** The nakṣatra (one of NAKSHATRA_NAMES), its number 1–27 and the pada 1–4 of a sidereal longitude. */
export function nakshatraOfLongitude(longitude: number): { name: string; number: number; pada: number } {
  const lon = normalizeDegrees(longitude);
  const index = Math.min(26, Math.floor(lon / NAKSHATRA_SIZE));
  const pada = Math.min(4, Math.floor(((lon - index * NAKSHATRA_SIZE) / NAKSHATRA_SIZE) * 4) + 1);
  return { name: NAKSHATRA_NAMES[index], number: index + 1, pada };
}

/** The yoga of a sum of the sidereal longitudes of the Sun and the Moon (as the Pañcāṅga counts it): its name, number 1–27 and the part of it spent, 0 to 1. */
export function yogaOfSum(sum: number): { name: string; number: number; spent: number } {
  const value = normalizeDegrees(sum);
  const index = Math.min(26, Math.floor(value / NAKSHATRA_SIZE));
  return { name: YOGA_NAMES[index], number: index + 1, spent: (value - index * NAKSHATRA_SIZE) / NAKSHATRA_SIZE };
}
