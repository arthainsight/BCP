import { getSignIndex, getDegreesInSign } from './utils';

/** D11 Ekādaśāṁśa (Rudrāṁśa) — traditional Parāśara / Sanjay Rath method.
 * Eleven equal portions; the starting sign is counted in reverse from the
 * natal rāśi sign. This is kept separate from B. V. Raman's anti-zodiacal
 * alternative because the lineages use different mappings.
 */
export function calcD11(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const partIndex = Math.min(Math.floor(getDegreesInSign(longitude) / (30 / 11)), 10);
  return (12 - signIndex + partIndex) % 12;
}
