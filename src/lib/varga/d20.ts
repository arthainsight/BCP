import { getSignIndex, getDegreesInSign, isMovableSign, isFixedSign } from './utils';

// D20 Vimsamsa — Parashara rule (20 equal 1.5° parts per sign)
// Movable signs: start from Aries       (0)
// Fixed signs:   start from Sagittarius (8)
// Dual signs:    start from Leo         (4)
export function calcD20(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 1.5), 19);

  let startSign: number;
  if (isMovableSign(signIndex))    startSign = 0; // Aries
  else if (isFixedSign(signIndex)) startSign = 8; // Sagittarius
  else                             startSign = 4; // Leo (Dual)

  return (startSign + partIndex) % 12;
}
