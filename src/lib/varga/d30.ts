import { getSignIndex, getDegreesInSign, isOddSign } from './utils';

// D30 Trimsamsa — Parashara rule: UNEQUAL divisions, fixed sign table
// The five rulers and their unequal spans produce a fixed output sign.
// Boundary convention: deg < boundary → this sign (left-closed, right-open intervals).
//
// Odd signs (Ar,Ge,Le,Li,Sg,Aq):
//   Mars    0–5°   → Aries       (0)
//   Saturn  5–10°  → Aquarius   (10)
//   Jupiter 10–18° → Sagittarius (8)
//   Mercury 18–25° → Gemini      (2)
//   Venus   25–30° → Libra       (6)
//
// Even signs (Ta,Cn,Vi,Sc,Cp,Pi):
//   Venus   0–5°   → Taurus      (1)
//   Mercury 5–12°  → Virgo       (5)
//   Jupiter 12–20° → Pisces     (11)
//   Saturn  20–25° → Capricorn   (9)
//   Mars    25–30° → Scorpio     (7)

type Range = [endDeg: number, signIdx: number];

const D30_ODD: Range[] = [
  [5,  0],
  [10, 10],
  [18, 8],
  [25, 2],
  [30, 6],
];

const D30_EVEN: Range[] = [
  [5,  1],
  [12, 5],
  [20, 11],
  [25, 9],
  [30, 7],
];

export function calcD30(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const ranges = isOddSign(signIndex) ? D30_ODD : D30_EVEN;
  for (const [end, sign] of ranges) {
    if (deg < end) return sign;
  }
  return ranges[ranges.length - 1][1];
}
