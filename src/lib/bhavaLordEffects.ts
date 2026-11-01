import { BHAVA_LORD_RULES, BHAVA_LORD_VERSES, type BhavaLordVerse } from './bhavaLordEffectsData';
import { SIGN_LORDS } from './signs';

/**
 * The effects of the lord of each house in each house, Bṛhat Parāśara Horā Śāstra chapter 24 (verses 1–144, 12 lords × 12 houses), and the way to use them (145–148): "declare all these by discerning the
 * strengths and weaknesses"; a lord of two signs gives the effect of both, and if the two are equal and contradictory both are destroyed; a lord of full strength gives the full effect, of half strength a half, of
 * weak strength a quarter. The verses are in `bhavaLordEffectsData.ts` as the text has them.
 */
export { BHAVA_LORD_RULES, BHAVA_LORD_VERSES };
export type { BhavaLordVerse };

export interface BhavaPlanet { name: string; sign: number }

/** The verse for the lord of house `lordOf` standing in house `inHouse`. */
export function bhavaLordVerse(lordOf: number, inHouse: number): BhavaLordVerse {
  const found = BHAVA_LORD_VERSES.find(verse => verse.lordOf === lordOf && verse.inHouse === inHouse);
  if (!found) throw new Error(`no verse for the lord of the ${lordOf}th in the ${inHouse}th`);
  return found;
}

export interface BhavaLordReading {
  /** The house, 1–12. */
  house: number;
  /** The graha that is the lord of it. */
  lord: string;
  /** The sign and the house (from the Lagna) the lord stands in. */
  sign: number;
  inHouse: number;
  verse: BhavaLordVerse;
  /** The other house this graha is lord of, when it has two signs (Rāhu and Ketu have none, the Sun and the Moon one each). */
  alsoLordOf: number | null;
  /** The verse for that other house, with the lord in the same house: the second effect of 24.146. */
  alsoVerse: BhavaLordVerse | null;
}

/** The twelve readings of a chart: for each house its lord, where the lord stands and the verse of the text. */
export function bhavaLordReadings(planets: BhavaPlanet[], ascendantSign: number): BhavaLordReading[] {
  const readings: BhavaLordReading[] = [];
  for (let house = 1; house <= 12; house++) {
    const lord = SIGN_LORDS[(ascendantSign - 1 + house - 1) % 12];
    const body = planets.find(planet => planet.name === lord);
    if (!body) continue;
    const inHouse = ((body.sign - ascendantSign + 12) % 12) + 1;
    const others = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(other => other !== house && SIGN_LORDS[(ascendantSign - 1 + other - 1) % 12] === lord);
    const alsoLordOf = others[0] ?? null;
    readings.push({
      house, lord, sign: body.sign, inHouse, verse: bhavaLordVerse(house, inHouse),
      alsoLordOf, alsoVerse: alsoLordOf === null ? null : bhavaLordVerse(alsoLordOf, inHouse),
    });
  }
  return readings;
}
