// Aṣṭakavarga: what the numbers say (BPHS 70 and 72, the Sanskrit read for this; docs/ashtakavarga-sources.md quotes the verses).
//
// What is worked out here is what the verses state as a rule:
//
//  – What each graha's Aṣṭakavarga is for (70.1–4): the Sun's the self and the father, the Moon's the mind and the mother, Mars's the
//    brothers and land, Mercury's livelihood and friends, Jupiter's body, learning and children, Venus's marriage and vehicles, Saturn's
//    life, grief and death.
//  – The point of Saturn's transit for each (70.5–10, 70.22–42): the Yoga Piṇḍa of the graha (its Śodhya Piṇḍa, ashtakavargaShodhana.ts) is
//    multiplied by the bindus of the house the verse names for it, and the product divided by 27 (the nakṣatra, counted from Aśvinī
//    for the remainder) and by 12 (the sign, counted from Aries for the remainder). When Saturn goes through that nakṣatra or sign, or the trine of it, the
//    house is troubled: the father for the Sun (the 9th from the Sun, 70.7), the mother for the Moon (the 4th, 70.22), brothers for
//    Mars (the 3rd, 70.24), kin and friends for Mercury (the 4th, 70.28), children for Jupiter (the 5th, 70.30), the wife for Venus (the
//    7th, 70.35) and the life for Saturn (the 8th, 70.37 and 70.41). A remainder of nought is taken as the divisor itself (Revatī, Pisces).
//  – The signs with no bindu in the Sun's and the Moon's Aṣṭakavarga are not for auspicious acts when the Sun or the Moon goes through
//    them, and those with many are (70.19–21).
//  – The Sarvāṣṭakavarga (72.1–10): a sign with more than thirty bindus gives good, from twenty-five to thirty middling, fewer
//    bad; a Lagna with the more is of enjoyment and wealth, with the fewer of want; the twelve houses in three parts, in each of which a
//    malefic troubles the stage of life it stands for.
//
// The verses are short, and where they leave a thing open this module says what it took (the numbers are the bindus of the
// graha's own Bhinnāṣṭakavarga before the reductions; the trine of a nakṣatra is the nakṣatra nine and eighteen on; the three parts
// of the houses are four each, the malefics the Sun, Mars, Saturn, Rahu and Ketu). None of this is checked against another program.
// What BPHS 71 gives for the length of life from the Aṣṭakavarga (days for a few rekhas, years for many, and half the sum) and the
// months of 72.11–29 with their dangers and gifts to give are not calculated: the verses' counts are not clear enough.

import { buildShodhana, AV_PLANETS, bhinnaBySign, SHODHANA_RULES, type ShodhanaRules } from './ashtakavargaShodhana';
import type { AshtakavargaChartLike, AshtakavargaPlanet, AshtakavargaSystem } from './ashtakavarga';
import { NAKSHATRA_NAMES } from './nakshatras';

/** What each graha's Aṣṭakavarga is read for (BPHS 70.1–4). */
export const SIGNIFICATIONS: Record<AshtakavargaPlanet, string> = {
  Sun: 'The self, nature and strength; the father',
  Moon: 'The mind and the intellect, favour; the mother',
  Mars: 'The strength of brothers, qualities; land',
  Mercury: 'Trade and livelihood; friends',
  Jupiter: 'The body, learning, children and wealth',
  Venus: 'Marriage, enjoyments, vehicles; the wife',
  Saturn: 'Life and the means of living; sorrow, grief and fear; ruin and death',
};

/** The house (counted from the graha's own sign, 1 = the sign itself) each graha's number is worked from, and what it troubles. */
export const KEY_HOUSE: Record<AshtakavargaPlanet, { house: number; verse: string; troubles: string }> = {
  Sun: { house: 9, verse: '70.7–10', troubles: 'the father' },
  Moon: { house: 4, verse: '70.22–23', troubles: 'the mother' },
  Mars: { house: 3, verse: '70.24–27', troubles: 'brothers' },
  Mercury: { house: 4, verse: '70.28–29', troubles: 'kin and friends' },
  Jupiter: { house: 5, verse: '70.30–33', troubles: 'children' },
  Venus: { house: 7, verse: '70.35–36', troubles: 'the wife' },
  Saturn: { house: 8, verse: '70.37, 70.41–42', troubles: 'the life' },
};

export interface SaturnPoint {
  planet: AshtakavargaPlanet;
  signification: string;
  troubles: string;
  verse: string;
  /** The sign (0 = Aries) of the house, and the bindus of the graha's own Bhinnāṣṭakavarga in it. */
  houseSign: number;
  bindus: number;
  sodhyaPinda: number;
  product: number;
  /**
   * The nakṣatra (0 = Aśvinī) the remainder of the product over 27 stands for, and the nakṣatras of its trine (it and the ones nine and
   * eighteen on); the sign (0 = Aries) the remainder over 12 stands for, and the signs of its trine. Null where the house has no
   * bindu, so that the product is nought and there is no point to find.
   */
  nakshatra: number | null;
  nakshatraTrine: number[];
  sign: number | null;
  signTrine: number[];
}

/** The remainder of a number over a divisor, a remainder of nought taken as the divisor (the last nakṣatra, the last sign). */
export const remainderFrom1 = (value: number, divisor: number): number => ((value - 1) % divisor + divisor) % divisor + 1;

export interface SignClass {
  sign: number;
  bindus: number;
  /** 'good' above thirty, 'middle' from twenty-five to thirty, 'poor' below (72.3). */
  kind: 'good' | 'middle' | 'poor';
}
export interface Khanda {
  /** The houses it holds (1–4, 5–8, 9–12) and the stage of life it stands for. */
  houses: [number, number];
  stage: 'childhood' | 'adulthood' | 'old age';
  malefics: string[];
  bindus: number;
}
export interface Phala {
  saturn: SaturnPoint[];
  /** The signs with no bindu in the Sun's Aṣṭakavarga and in the Moon's, and the signs with the most. */
  sunEmpty: number[];
  moonEmpty: number[];
  sunRichest: number[];
  moonRichest: number[];
  /** The Sarvāṣṭakavarga of each house from the Lagna, with its class (72.3). */
  houses: (SignClass & { house: number })[];
  lagna: SignClass & { enjoyment: boolean };
  khandas: Khanda[];
}

export function classifySav(bindus: number): SignClass['kind'] {
  return bindus > 30 ? 'good' : bindus >= 25 ? 'middle' : 'poor';
}

const MALEFICS = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'] as const;

export function buildPhala(chart: AshtakavargaChartLike, system: AshtakavargaSystem = 'Parashara', rules: ShodhanaRules = SHODHANA_RULES.bphs): Phala {
  const shodhana = buildShodhana(chart, system, rules);
  const bhinna = bhinnaBySign(chart, system);
  const signOf = (name: string): number => {
    const planet = chart.planets?.find(item => item.name === name);
    if (typeof planet?.sign === 'number') return planet.sign - 1;
    return Math.floor((((planet?.longitude ?? 0) % 360) + 360) % 360 / 30);
  };

  const saturn: SaturnPoint[] = AV_PLANETS.map(planet => {
    const key = KEY_HOUSE[planet];
    const houseSign = (signOf(planet) + key.house - 1) % 12;
    const bindus = bhinna[planet][houseSign];
    const sodhyaPinda = shodhana.sodhyaPinda[planet];
    const product = sodhyaPinda * bindus;
    const star = product === 0 ? null : remainderFrom1(product, 27) - 1;
    const rasi = product === 0 ? null : remainderFrom1(product, 12) - 1;
    return {
      planet, signification: SIGNIFICATIONS[planet], troubles: key.troubles, verse: key.verse,
      houseSign, bindus, sodhyaPinda, product,
      nakshatra: star, nakshatraTrine: star === null ? [] : [star, (star + 9) % 27, (star + 18) % 27],
      sign: rasi, signTrine: rasi === null ? [] : [rasi, (rasi + 4) % 12, (rasi + 8) % 12],
    };
  });

  const emptyOf = (planet: AshtakavargaPlanet) => bhinna[planet].flatMap((value, sign) => (value === 0 ? [sign] : []));
  const richestOf = (planet: AshtakavargaPlanet) => { const best = Math.max(...bhinna[planet]); return bhinna[planet].flatMap((value, sign) => (value === best ? [sign] : [])); };

  const savBySign = Array.from({ length: 12 }, (_, sign) => AV_PLANETS.reduce((sum, planet) => sum + bhinna[planet][sign], 0));
  const lagnaSign = (chart.ascendant?.sign ?? 1) - 1;
  const houses = Array.from({ length: 12 }, (_, index) => {
    const sign = (lagnaSign + index) % 12;
    return { house: index + 1, sign, bindus: savBySign[sign], kind: classifySav(savBySign[sign]) };
  });
  const lagnaClass = houses[0];

  const khandas: Khanda[] = ([[1, 4, 'childhood'], [5, 8, 'adulthood'], [9, 12, 'old age']] as const).map(([from, to, stage]) => {
    const inside = houses.filter(item => item.house >= from && item.house <= to);
    const signs = new Set(inside.map(item => item.sign));
    return {
      houses: [from, to], stage,
      malefics: MALEFICS.filter(name => signs.has(signOf(name))),
      bindus: inside.reduce((sum, item) => sum + item.bindus, 0),
    };
  });

  return {
    saturn, sunEmpty: emptyOf('Sun'), moonEmpty: emptyOf('Moon'), sunRichest: richestOf('Sun'), moonRichest: richestOf('Moon'),
    houses, lagna: { ...lagnaClass, enjoyment: lagnaClass.kind === 'good' }, khandas,
  };
}

/** The name of the nakṣatra (0 = Aśvinī). */
export const nakshatraName = (index: number): string => NAKSHATRA_NAMES[((index % 27) + 27) % 27];
