import { getSignIndex, getDegreesInSign } from './utils';

// D12 Dwadasamsa — Parashara rule (12 equal 2.5° parts per sign)
// Starts from the same sign and proceeds sequentially — cycles once through all 12 signs.
export function calcD12(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 2.5), 11);
  return (signIndex + partIndex) % 12;
}
