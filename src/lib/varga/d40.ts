import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D40 Khavedamsa — Parashara rule (40 equal 0.75° parts per sign)
// Odd signs:  start from Aries (0)
// Even signs: start from Libra (6)
export function calcD40(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 0.75), 39);
  const startSign = isOddSign(signIndex) ? 0 : 6;
  return (startSign + partIndex) % 12;
}
