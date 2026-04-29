import { getSignIndex, getDegreesInSign, isMovableSign, isFixedSign } from './utils';

// D9 Navamsa — 9 equal parts of 3°20′ per sign
// Starting sign is relative to the natal sign:
//   Movable (Ar,Cn,Li,Cp): start from the same sign        (sign + 0)
//   Fixed   (Ta,Le,Sc,Aq): start from the 9th sign         (sign + 8)
//   Dual    (Ge,Vi,Sg,Pi): start from the 5th sign         (sign + 4)
// "nth from X" uses inclusive counting → offset = n − 1.
export function calcD9(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / (30 / 9)), 8);

  let startSign: number;
  if (isMovableSign(signIndex))    startSign = signIndex;            // same sign
  else if (isFixedSign(signIndex)) startSign = (signIndex + 8) % 12; // 9th from
  else                             startSign = (signIndex + 4) % 12; // 5th from (Dual)

  return (startSign + partIndex) % 12;
}
