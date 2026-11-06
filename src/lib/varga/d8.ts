import { getSignIndex, getDegreesInSign, isMovableSign, isFixedSign } from './utils';

// D8 Aṣṭāṁśa — 8 equal 3°45′ parts per sign.
// Movable signs: start from Aries       (0)
// Fixed signs:   start from Sagittarius (8)
// Dual signs:    start from Leo         (4)
// Not among the sixteen vargas of BPHS 6.3-4; the rule is that of the Parāśara tradition as PyJHora has it
// ("Traditional Parasara"), checked against it.
export function calcD8(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 3.75), 7);

  let startSign: number;
  if (isMovableSign(signIndex))    startSign = 0; // Aries
  else if (isFixedSign(signIndex)) startSign = 8; // Sagittarius
  else                             startSign = 4; // Leo (Dual)

  return (startSign + partIndex) % 12;
}
