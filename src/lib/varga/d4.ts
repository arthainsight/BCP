import { getSignIndex, getDegreesInSign } from './utils';

// D4 Chaturthamsa — Parashara rule (4 equal 7.5° parts per sign)
// Progresses through kendras: same, 4th, 7th, 10th sign from natal sign
// Formula: (sign + partIndex * 3) % 12
export function calcD4(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 7.5), 3);
  return (signIndex + partIndex * 3) % 12;
}
