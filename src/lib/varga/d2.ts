import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D2 Hora — Parashara rule (2 equal 15° halves per sign)
// Odd signs:  0–15° = Sun hora → Leo (4), 15–30° = Moon hora → Cancer (3)
// Even signs: 0–15° = Moon hora → Cancer (3), 15–30° = Sun hora → Leo (4)
// Only 2 possible output signs: Leo (4) or Cancer (3).
export function calcD2(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const firstHalf = deg < 15;
  return isOddSign(signIndex) ? (firstHalf ? 4 : 3) : (firstHalf ? 3 : 4);
}
