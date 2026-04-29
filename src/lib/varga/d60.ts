import { getSignIndex, getDegreesInSign } from './utils';

// D60 Shashtiamsa — Parashara rule (60 equal 0.5° parts per sign)
// Starts from the same sign, sequential; cycles 5× through all 12 signs per sign.
// The 60 shashtiamsas have named qualities (Ghora, Rakshasa, etc.) but sign placement
// follows the sequential formula below.
export function calcD60(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / 0.5), 59);
  return (signIndex + partIndex) % 12;
}
