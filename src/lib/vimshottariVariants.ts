import { NAKSHATRA_NAMES } from './specialSphutas';
import { calculateVimshottari, type VimshottariResult } from './vimshottari';

// Vimśottarī from the Utpanna, Kṣema or Ādhāna nakṣatra.
//
// The daśā need not start from the Moon's own nakṣatra. Counted from it, the
// 4th nakṣatra is Kṣema, the 5th Utpanna and the 8th Ādhāna, and the
// Vimśottarī can start from the lord of any of them. These positions are only
// relative to the Moon, so the Moon's own longitude gives the balance: the same
// fraction of the new nakṣatra is taken as passed as the Moon has passed of its
// own, which is the Moon's longitude turned forward by that many nakṣatras.
//
// Which of the three to use is judged by strength (Sanjay Rath, Vimśottarī and
// Udu Daśās): the one whose sign has the most grahas in the angles (kendras)
// from it is the stronger. When these are equal, or the signs stand in
// kendra to each other, the one the lord of its nakṣatra, Jupiter or Mercury
// joins or aspects is the stronger. Should these be equal too, Utpanna, Kṣema
// and Ādhāna are taken in that order.

export type VimshottariVariant = 'utpanna' | 'kshema' | 'adhana';
export type VimshottariVariantChoice = 'auto' | VimshottariVariant;

export const VIMSHOTTARI_VARIANTS: VimshottariVariant[] = ['utpanna', 'kshema', 'adhana'];

export const VARIANT_LABELS: Record<VimshottariVariant, string> = {
  utpanna: 'Utpanna',
  kshema: 'Kshema',
  adhana: 'Adhana',
};

/** Where each one stands counted from the Moon's nakṣatra (the Moon's own being the 1st). */
export const VARIANT_POSITION: Record<VimshottariVariant, number> = { utpanna: 5, kshema: 4, adhana: 8 };

export const VARIANT_SHORT: Record<VimshottariVariant, string> = { utpanna: 'Utp', kshema: 'Ksh', adhana: 'Adh' };

const NAKSHATRA_SIZE = 360 / 27;
const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;

const normalize = (value: number) => ((value % 360) + 360) % 360;

export interface VariantPlanet {
  name: string;
  /** Sign 1–12. */
  sign: number;
}

/** The Moon turned forward to the variant's nakṣatra, the same fraction into it as the Moon is into its own. */
export function variantLongitude(moonLongitude: number, variant: VimshottariVariant): number {
  return normalize(normalize(moonLongitude) + (VARIANT_POSITION[variant] - 1) * NAKSHATRA_SIZE);
}

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
/** Houses a graha looks at from where it stands: all the 7th, with the special ones of Mars, Jupiter and Saturn. */
const ASPECTS: Record<string, number[]> = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
const house = (from: number, to: number) => ((to - from + 12) % 12) + 1;

export interface VariantStrength {
  variant: VimshottariVariant;
  /** The point in the zodiac the variant's nakṣatra is taken at. */
  longitude: number;
  sign: number;
  nakshatra: string;
  lord: string;
  /** Grahas in the signs 1, 4, 7 and 10 from its sign. */
  kendraGrahas: number;
  /** Of the lord of its nakṣatra, Jupiter and Mercury, how many join its sign or look at it. */
  supporters: number;
}

export function variantStrengths(moonLongitude: number, planets: VariantPlanet[]): VariantStrength[] {
  const grahas = planets.filter(planet => GRAHAS.includes(planet.name));
  return VIMSHOTTARI_VARIANTS.map(variant => {
    const longitude = variantLongitude(moonLongitude, variant);
    const sign = Math.floor(longitude / 30) + 1;
    const index = Math.floor(longitude / NAKSHATRA_SIZE) % 27;
    const lord = LORDS[index % 9];
    const kendraGrahas = grahas.filter(planet => [1, 4, 7, 10].includes(house(sign, planet.sign))).length;
    const supporting = new Set([lord, 'Jupiter', 'Mercury']);
    const supporters = [...supporting].filter(name => {
      const graha = grahas.find(planet => planet.name === name);
      if (!graha) return false;
      const distance = house(graha.sign, sign);
      return distance === 1 || (ASPECTS[name] ?? [7]).includes(distance);
    }).length;
    return { variant, longitude, sign, nakshatra: NAKSHATRA_NAMES[index], lord, kendraGrahas, supporters };
  });
}

/** The strongest of the three. */
export function chooseVariant(moonLongitude: number, planets: VariantPlanet[]): VimshottariVariant {
  const strengths = variantStrengths(moonLongitude, planets);
  // Sorting is stable, so the order Utpanna, Kṣema, Ādhāna settles what is still equal.
  const best = [...strengths].sort((a, b) => b.kendraGrahas - a.kendraGrahas || b.supporters - a.supporters)[0];
  return best.variant;
}

export interface VimshottariVariantResult extends VimshottariResult {
  variant: VimshottariVariant;
  /** True when the strength rule picked the variant, false when it was chosen. */
  automatic: boolean;
  strengths: VariantStrength[];
}

/** Vimśottarī started from the Utpanna, Kṣema or Ādhāna nakṣatra of the Moon. */
export function calculateVimshottariVariant(
  moonLongitude: number,
  planets: VariantPlanet[],
  birthDate: Date,
  choice: VimshottariVariantChoice = 'auto',
): VimshottariVariantResult {
  const variant = choice === 'auto' ? chooseVariant(moonLongitude, planets) : choice;
  const result = calculateVimshottari(variantLongitude(moonLongitude, variant), birthDate);
  return { ...result, variant, automatic: choice === 'auto', strengths: variantStrengths(moonLongitude, planets) };
}

export function isVariantChoice(value: unknown): value is VimshottariVariantChoice {
  return value === 'auto' || value === 'utpanna' || value === 'kshema' || value === 'adhana';
}
