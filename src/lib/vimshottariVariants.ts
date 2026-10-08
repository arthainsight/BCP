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
// Which of the three applies follows the house of the Moon from the Lagna
// (Sanjay Rath):
//   Moon in the 3rd or 11th house  -> Utpanna
//   Moon in the 2nd or 6th house   -> Kṣema
//   Moon in the 8th or 12th house  -> Ādhāna
// With the Moon in any other house (1, 4, 5, 7, 9, 10) none of the three is
// used, so the daśā does not apply, as with the Aṣṭottarī when its condition is
// not met. A variant fixed by hand in Settings is used whatever the house.

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

/** The variant the Moon's house (from the Lagna) calls for; the other houses have none. */
export const HOUSE_VARIANT: Partial<Record<number, VimshottariVariant>> = {
  3: 'utpanna', 11: 'utpanna',
  2: 'kshema', 6: 'kshema',
  8: 'adhana', 12: 'adhana',
};

/** The houses of the Moon in which the daśā applies, in order. */
export const VARIANT_HOUSES = Object.keys(HOUSE_VARIANT).map(Number).sort((a, b) => a - b);

const NAKSHATRA_SIZE = 360 / 27;
const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;

const normalize = (value: number) => ((value % 360) + 360) % 360;

/** The Moon turned forward to the variant's nakṣatra, the same fraction into it as the Moon is into its own. */
export function variantLongitude(moonLongitude: number, variant: VimshottariVariant): number {
  return normalize(normalize(moonLongitude) + (VARIANT_POSITION[variant] - 1) * NAKSHATRA_SIZE);
}

export interface VariantCandidate {
  variant: VimshottariVariant;
  /** The point in the zodiac the variant's nakṣatra is taken at. */
  longitude: number;
  nakshatra: string;
  lord: string;
}

/** The Utpanna, Kṣema and Ādhāna nakṣatras of the Moon with their lords. */
export function variantCandidates(moonLongitude: number): VariantCandidate[] {
  return VIMSHOTTARI_VARIANTS.map(variant => {
    const longitude = variantLongitude(moonLongitude, variant);
    const index = Math.floor(longitude / NAKSHATRA_SIZE) % 27;
    return { variant, longitude, nakshatra: NAKSHATRA_NAMES[index], lord: LORDS[index % 9] };
  });
}

/** The house of the Moon from the Lagna sign (whole signs), or null without a Lagna. */
export function moonHouse(moonLongitude: number, ascendantSign?: number): number | null {
  if (!ascendantSign) return null;
  const moonSign = Math.floor(normalize(moonLongitude) / 30) + 1;
  return ((moonSign - ascendantSign + 12) % 12) + 1;
}

/** How the variant was arrived at: by the Moon's house, or chosen by hand. */
export type VariantBasis = 'house' | 'chosen';

export interface VariantDecision {
  /** The variant to use, or null when the Moon's house calls for none. */
  variant: VimshottariVariant | null;
  basis: VariantBasis;
  moonHouse: number | null;
}

/** Which variant applies: the one chosen by hand, else the one the Moon's house gives. */
export function decideVariant(
  moonLongitude: number,
  ascendantSign?: number,
  choice: VimshottariVariantChoice = 'auto',
): VariantDecision {
  const house = moonHouse(moonLongitude, ascendantSign);
  if (choice !== 'auto') return { variant: choice, basis: 'chosen', moonHouse: house };
  return { variant: (house && HOUSE_VARIANT[house]) || null, basis: 'house', moonHouse: house };
}

export interface VimshottariVariantResult extends VimshottariResult {
  variant: VimshottariVariant;
  basis: VariantBasis;
  moonHouse: number | null;
}

/** Vimśottarī started from the Utpanna, Kṣema or Ādhāna nakṣatra of the Moon; null when the Moon's house calls for none. */
export function calculateVimshottariVariant(
  moonLongitude: number,
  birthDate: Date,
  choice: VimshottariVariantChoice = 'auto',
  ascendantSign?: number,
): VimshottariVariantResult | null {
  const { variant, basis, moonHouse: house } = decideVariant(moonLongitude, ascendantSign, choice);
  if (!variant) return null;
  const result = calculateVimshottari(variantLongitude(moonLongitude, variant), birthDate);
  return { ...result, variant, basis, moonHouse: house };
}

/** The note for a chart whose Moon stands in a house that calls for none of the three. */
export function variantNotApplicable(house: number | null): string {
  return `Conditional: not applicable (Moon in ${house ?? '?'}H; used with the Moon in ${VARIANT_HOUSES.join(', ')})`;
}

export function isVariantChoice(value: unknown): value is VimshottariVariantChoice {
  return value === 'auto' || value === 'utpanna' || value === 'kshema' || value === 'adhana';
}
