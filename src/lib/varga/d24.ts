import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D24 Siddhamsa (Chaturvimsamsa) — Parashara rule (24 equal 1.25° parts per sign)
// Odd signs:  start from Leo    (4)
// Even signs: start from Cancer (3)
export function calcD24(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 1.25), 23);
  const startSign = isOddSign(signIndex) ? 4 : 3; // Leo : Cancer
  return (startSign + partIndex) % 12;
}
