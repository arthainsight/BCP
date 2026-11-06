import { getSignIndex, getDegreesInSign } from './utils';

// D11 Rudrāṁśa (Ekādaśāṁśa) — 11 equal parts of 2°43′38″ per sign.
// The parts run forward from the sign that stands as far back from Aries as the natal sign stands on from it:
// Aries starts from Aries, Taurus from Pisces, Gemini from Aquarius, … Pisces from Taurus: start = (12 − sign) mod 12.
// Not among the sixteen vargas of BPHS 6.3-4; the rule is that of Sanjay Rath's teaching as PyJHora has it
// ("Traditional Parasara"), checked against it. B. V. Raman's Ekādaśāṁśa counts the other way round and is not used.
export function calcD11(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / (30 / 11)), 10);
  return (12 - signIndex + partIndex) % 12;
}
