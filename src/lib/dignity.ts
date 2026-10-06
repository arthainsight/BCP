// Sign dignities of the seven classical grahas (BPHS 3). Signs are 1–12 from
// Aries. Rahu and Ketu are left out: the schools disagree on their signs.

export const EXALTATION: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7 };
export const DEBILITATION: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1 };
export const OWN_SIGNS: Record<string, number[]> = { Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11] };
export const MOOLATRIKONA: Record<string, number> = { Sun: 5, Moon: 2, Mars: 1, Mercury: 6, Jupiter: 9, Venus: 7, Saturn: 11 };

export type SignDignity = 'exalted' | 'own' | 'debilitated' | null;

/** Dignity of a graha in a sign; null when it is none of the three or the graha is a node. */
export function signDignity(planet: string, sign: number): SignDignity {
  if (EXALTATION[planet] === sign) return 'exalted';
  if (DEBILITATION[planet] === sign) return 'debilitated';
  if (OWN_SIGNS[planet]?.includes(sign)) return 'own';
  return null;
}
