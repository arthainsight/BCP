import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

/** D6 Ṣaṣṭhāṁśa — Parāśara method.
 * Six equal 5° portions. Odd signs count from Aries; even signs from Libra.
 * Returns a 0-based rāśi sign index.
 */
export function calcD6(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const partIndex = Math.min(Math.floor(getDegreesInSign(longitude) / 5), 5);
  return isOddSign(signIndex) ? partIndex : (partIndex + 6) % 12;
}
