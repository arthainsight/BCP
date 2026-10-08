import type { SpecialLagna } from '@/types';
import { SIGN_LORDS, arudhaSign } from '@/lib/specialSphutas';

// The Jaimini Āruḍha padas: for each house, the lord of its sign is found, and
// the pada stands as many signs from the lord as the lord stands from the
// house. A pada that falls in the house itself or in its 7th gives way to the
// 10th from it (so a lord in its own house puts the pada in the 10th).
//
// AL is the pada of the 1st house (the Āruḍha Lagna), AL2 of the 2nd, and so
// on to AL12, the Upapada.

export const ARUDHA_PADAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** The name of the pada of a house: AL for the 1st, AL2 … AL12 for the others. */
export function arudhaName(house: number): string {
  return house === 1 ? 'AL' : `AL${house}`;
}

export interface ArudhaGraha {
  name: string;
  /** Sign 1–12. */
  sign: number;
  /** Degrees within the sign. */
  degree: number;
}

/**
 * The Āruḍha pada of every house, counted from the Lagna sign. The pada takes
 * the degree of the house lord; a lord that is not among the grahas leaves the
 * pada out.
 */
export function calculateArudhaPadas(ascendantSign: number, grahas: ArudhaGraha[]): (SpecialLagna & { house: number })[] {
  const result: (SpecialLagna & { house: number })[] = [];
  for (const house of ARUDHA_PADAS) {
    const houseSign = ((ascendantSign - 1 + house - 1) % 12) + 1;
    const lord = grahas.find(graha => graha.name === SIGN_LORDS[houseSign - 1]);
    if (!lord) continue;
    const sign = arudhaSign(houseSign, lord.sign);
    result.push({ house, name: arudhaName(house), sign, degree: lord.degree, longitude: (sign - 1) * 30 + lord.degree });
  }
  return result;
}
