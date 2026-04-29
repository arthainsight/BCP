import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D7 Saptamsa — Parashara rule (7 equal ~4.286° parts per sign)
// Odd signs:  1st saptamsa = same sign,        then sequential
// Even signs: 1st saptamsa = 7th sign (sign+6), then sequential
export function calcD7(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / (30 / 7)), 6);
  const startSign = isOddSign(signIndex) ? signIndex : (signIndex + 6) % 12;
  return (startSign + partIndex) % 12;
}
