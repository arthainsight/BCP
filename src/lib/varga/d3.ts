import { getSignIndex, getDegreesInSign } from './utils';

// D3 Drekkana — Parashara rule (3 equal 10° parts per sign)
// 1st drekkana (0–10°):  same sign          (sign + 0)
// 2nd drekkana (10–20°): 5th sign from it   (sign + 4)
// 3rd drekkana (20–30°): 9th sign from it   (sign + 8)
// Formula: (sign + partIndex * 4) % 12
export function calcD3(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 10), 2);
  return (signIndex + partIndex * 4) % 12;
}
