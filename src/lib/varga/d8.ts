import { getSignIndex, getDegreesInSign, isMovableSign, isFixedSign } from './utils';

/** D8 Aṣṭāṁśa — Parāśara method.
 * Movable signs start from Aries, fixed from Sagittarius and dual from Leo.
 */
export function calcD8(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const partIndex = Math.min(Math.floor(getDegreesInSign(longitude) / (30 / 8)), 7);
  const startSign = isMovableSign(signIndex) ? 0 : isFixedSign(signIndex) ? 8 : 4;
  return (startSign + partIndex) % 12;
}
