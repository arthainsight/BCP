import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D10 Dasamsa — Parashara rule (10 equal 3° parts per sign)
// Odd signs:  1st dasamsa = same sign,         then sequential
// Even signs: 1st dasamsa = 9th sign (sign+8), then sequential
// "9th from X" inclusive = X + 8 in 0-indexed
export function calcD10(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 3), 9);
  const startSign = isOddSign(signIndex) ? signIndex : (signIndex + 8) % 12;
  return (startSign + partIndex) % 12;
}


/** D10 Parivṛtti Daśāṁśa — continuous / Varanasi method.
 * The portions run continuously through the zodiac: the first slice of Aries
 * maps to Aries, and each following 3° slice advances one sign. The sequence
 * continues across rāśi boundaries rather than restarting in each sign.
 */
export function calcD10Parivritti(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const partIndex = Math.min(Math.floor(getDegreesInSign(longitude) / 3), 9);
  return (signIndex * 10 + partIndex) % 12;
}
