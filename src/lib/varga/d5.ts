import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D5 Panchamsa — Parashara rule (5 equal 6° parts per sign)
// Fixed sign sequences derived from planetary rulership order:
//   Odd signs  (ruled in order Mars→Saturn→Jupiter→Mercury→Venus, using odd signs of each):
//     [Aries(0), Aquarius(10), Sagittarius(8), Gemini(2), Libra(6)]
//   Even signs (reversed order Venus→Mercury→Jupiter→Saturn→Mars, using even signs):
//     [Taurus(1), Virgo(5), Pisces(11), Capricorn(9), Scorpio(7)]
//
// NOTE: Verify sequences against JHora output before relying on this in production.
// Some translations of BPHS give a different element-based ordering.
const D5_ODD:  readonly number[] = [0, 10, 8, 2, 6];
const D5_EVEN: readonly number[] = [1,  5, 11, 9, 7];

export function calcD5(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 6), 4);
  return isOddSign(signIndex) ? D5_ODD[partIndex] : D5_EVEN[partIndex];
}
