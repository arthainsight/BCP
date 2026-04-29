import { getSignIndex, getDegreesInSign, getElement } from './utils';

// D27 Nakshatramsa (Bhamsa) — Parashara rule (27 equal ~1.111° parts per sign)
// Starting sign follows the element of the natal sign:
//   Fire  (Ar=0, Le=4, Sg=8):  start from Aries      (0)
//   Earth (Ta=1, Vi=5, Cp=9):  start from Cancer     (3)
//   Air   (Ge=2, Li=6, Aq=10): start from Libra      (6)
//   Water (Cn=3, Sc=7, Pi=11): start from Capricorn  (9)
const D27_START_BY_ELEMENT: readonly number[] = [0, 3, 6, 9];

export function calcD27(longitude: number): number {
  const signIndex = getSignIndex(longitude);
  const deg = getDegreesInSign(longitude);
  const partIndex = Math.min(Math.floor(deg / (30 / 27)), 26);
  const startSign = D27_START_BY_ELEMENT[getElement(signIndex)];
  return (startSign + partIndex) % 12;
}
