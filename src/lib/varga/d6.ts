import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D6 Ṣaṣṭhāṁśa — 6 equal 5° parts per sign. (Not Ṣaṣṭyāṁśa, the D60.)
// Odd signs:  start from Aries (0)
// Even signs: start from Libra (6)
// Not among the sixteen vargas of BPHS 6.3-4; the rule is that of the Parāśara tradition as PyJHora has it
// ("Traditional Parasara"), checked against it.
export function calcD6(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 5), 5);
  const startSign = isOddSign(signIndex) ? 0 : 6;
  return (startSign + partIndex) % 12;
}
