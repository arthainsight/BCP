// The Muhūrta Finder's wishes about the Rāśi chart (D1) of the moment: the places of the Lagna and the grahas that the book
// (Ernst Wilhelm, Classical Muhurta, chapters 15 and 16, "Lagna" and "Rasi and Navamsa") names as favourable. The book gives
// no weights for them, so each is a wish worth one point; a stretch that holds it scores that point on top of the weights of
// the Pañcāṅga groups. They limit nothing.
//
// This file needs no ephemeris: whether a sky, given the longitudes of the grahas and the Ascendant, holds a wish.

import { houseFrom, signOf, type FinderGraha } from './muhurtaFinder';
import type { DoshaSky } from './mahadosha';
import { getVargaSignIndex } from './varga';

export const D1_KEYS = ['lagnaBenefic', 'navamsaLagnaBenefic', 'beneficsInAngles', 'moonUpachaya', 'eighthTwelfthEmpty'] as const;
export type D1Key = (typeof D1_KEYS)[number];
export const isD1Key = (value: string): value is D1Key => (D1_KEYS as readonly string[]).includes(value);

export interface D1Info {
  name: string;
  /** What the wish asks for, in one line. */
  what: string;
  /** The words of the book it follows, or what of it is left out. */
  note?: string;
}

export const D1_WISHES: Record<D1Key, D1Info> = {
  lagnaBenefic: {
    name: 'Lagna of a benefic',
    what: 'The Lagna is in a sign of a benefic: Taurus, Gemini, Cancer, Virgo, Libra, Sagittarius or Pisces; Cancer not when the Moon is within 60° of the Sun.',
    note: 'The Moon is a benefic 120° to 240° from the Sun and a malefic within 60° of it. Left out: that Jupiter or Venus in or aspecting the Lagna overcomes a Lagna of a malefic.',
  },
  navamsaLagnaBenefic: {
    name: 'Navāṁśa Lagna of a benefic',
    what: 'The Navāṁśa Lagna is in a sign of a benefic (the same signs).',
    note: 'The book takes the Navāṁśa Lagna to be even more important than the Lagna.',
  },
  beneficsInAngles: {
    name: 'More benefics than malefics in the angles',
    what: 'In the 1st, 4th, 7th and 10th houses together there are more benefics than malefics (Jupiter, Venus, Mercury and the Moon when it is a benefic; Sun, Mars, Saturn, Rāhu, Ketu and the Moon when it is a malefic).',
    note: '"There should always be more benefics in the angles than malefics."',
  },
  moonUpachaya: {
    name: 'The Moon in an upachaya',
    what: 'The Moon is in the 3rd, 10th or 11th house from the Lagna (the upachayas, the 6th left out).',
    note: '"Any Lagna is rendered favorable if the Moon is in an Upachaya, especially the 11th."',
  },
  eighthTwelfthEmpty: {
    name: '8th and 12th houses empty',
    what: 'No graha in the 8th or the 12th house from the Lagna.',
    note: '"For beneficial events, the 8th and 12th Bhavas are best left unoccupied."',
  },
};

/** What the wishes need of a moment, so that the ephemeris is asked for no more. */
export const D1_GRAHAS: FinderGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'];

const BENEFIC_SIGNS = [1, 2, 3, 5, 6, 8, 11]; // Taurus, Gemini, Cancer, Virgo, Libra, Sagittarius, Pisces

/** The Moon as the book has it: a benefic 120° to 240° from the Sun, a malefic within 60° of it, neither between. */
export function moonNature(sun: number, moon: number): 'benefic' | 'malefic' | 'neutral' {
  const elongation = (((moon - sun) % 360) + 360) % 360;
  if (elongation >= 120 && elongation <= 240) return 'benefic';
  if (elongation < 60 || elongation > 300) return 'malefic';
  return 'neutral';
}

/** Whether a sign is a benefic's: the signs of Mercury, Venus, Jupiter, and Cancer unless the Moon is a malefic. */
const beneficSign = (sign: number, moon: 'benefic' | 'malefic' | 'neutral') => BENEFIC_SIGNS.includes(sign) && !(sign === 3 && moon === 'malefic');

const longitude = (sky: DoshaSky, graha: FinderGraha): number => {
  if (graha === 'Sun') return sky.sun;
  if (graha === 'Moon') return sky.moon;
  if (graha === 'Ketu') return (sky.others.Rahu! + 180) % 360;
  return sky.others[graha]!;
};

const NINE: FinderGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const BENEFICS: FinderGraha[] = ['Mercury', 'Jupiter', 'Venus'];
const MALEFICS: FinderGraha[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];

/** Whether a sky holds a wish. */
export function d1Held(key: D1Key, sky: DoshaSky): boolean {
  const moon = moonNature(sky.sun, sky.moon);
  const ascSign = signOf(sky.asc);
  const houseOf = (graha: FinderGraha) => houseFrom(ascSign, longitude(sky, graha));
  if (key === 'lagnaBenefic') return beneficSign(ascSign, moon);
  if (key === 'navamsaLagnaBenefic') return beneficSign(getVargaSignIndex(sky.asc, 9), moon);
  if (key === 'moonUpachaya') return [3, 10, 11].includes(houseOf('Moon'));
  if (key === 'eighthTwelfthEmpty') return !NINE.some(graha => [8, 12].includes(houseOf(graha)));
  // beneficsInAngles
  const inAngle = (graha: FinderGraha) => [1, 4, 7, 10].includes(houseOf(graha));
  const benefics = BENEFICS.filter(inAngle).length + (moon === 'benefic' && inAngle('Moon') ? 1 : 0);
  const malefics = MALEFICS.filter(inAngle).length + (moon === 'malefic' && inAngle('Moon') ? 1 : 0);
  return benefics > malefics;
}
