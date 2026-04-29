import { getSignIndex, getDegreesInSign, isMovableSign, isFixedSign } from './utils';

// D45 Akshavedamsa — Parashara rule (45 equal 2/3° parts per sign)
// Movable signs: start from Aries       (0)
// Fixed signs:   start from Leo         (4)
// Dual signs:    start from Sagittarius (8)
export function calcD45(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / (30 / 45)), 44);

  let startSign: number;
  if (isMovableSign(signIndex))    startSign = 0; // Aries
  else if (isFixedSign(signIndex)) startSign = 4; // Leo
  else                             startSign = 8; // Sagittarius (Dual)

  return (startSign + partIndex) % 12;
}
