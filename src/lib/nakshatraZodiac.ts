// Which zodiac the nakṣatras are counted in. The grahas stand in the ayanāṁśa chosen in Settings; the nakṣatras
// follow the same one unless another is asked for: any choice of the ayanamsa list (Lahiri, Raman, Krishnamurti and
// the others, Custom Lahiri with its adjustment, or the tropical zodiac).

import { AYANAMSA_OPTIONS, applyAyanamsaOffset, type AyanamsaMode } from './ayanamsas';

export type NakshatraMode = 'same' | AyanamsaMode;

export const NAKSHATRA_MODES: readonly NakshatraMode[] = ['same', ...AYANAMSA_OPTIONS.map((option) => option.value)];

export const DEFAULT_NAKSHATRA_MODE: NakshatraMode = 'same';

/**
 * A stored nakṣatra zodiac. Before there was a choice of "same as the grahas" the default was called
 * "sidereal (Lahiri)" and was kept as 'sidereal', so a stored 'sidereal' is the old default and means the same
 * as the grahas now; anything unknown is the default. The earlier choices 'lahiri' and 'tropical' are choices of
 * the ayanamsa list and mean what they did.
 */
export function readNakshatraMode(stored: unknown): NakshatraMode {
  if (stored === 'sidereal') return DEFAULT_NAKSHATRA_MODE;
  return (NAKSHATRA_MODES as readonly unknown[]).includes(stored) ? (stored as NakshatraMode) : DEFAULT_NAKSHATRA_MODE;
}

/**
 * The number of degrees to add to a graha's longitude to get the longitude the nakṣatra is read from.
 * A graha's longitude is the tropical longitude less the ayanāṁśa of the chart, so the nakṣatra longitude in
 * another zodiac is the graha's plus the chart's ayanāṁśa less the ayanāṁśa of that zodiac (0 for the tropical one).
 *
 * `ayanamsas` holds the ayanāṁśa of each choice of the ayanamsa list at the chart's moment (DebugInfo.ayanamsas).
 * Custom Lahiri is the Lahiri one with `offsetDegrees`, the adjustment of Settings. A zodiac whose ayanāṁśa is
 * not known changes nothing.
 */
export function nakshatraAdjustFor(
  mode: NakshatraMode,
  chartAyanamsa: number,
  ayanamsas: Readonly<Record<string, number>> = {},
  offsetDegrees = 0,
): number {
  if (mode === 'same') return 0;
  if (mode === 'tropical') return chartAyanamsa;
  const lahiri = ayanamsas.lahiri;
  const target = mode === 'custom-lahiri' ? (lahiri === undefined ? undefined : applyAyanamsaOffset(lahiri, 'custom-lahiri', offsetDegrees)) : ayanamsas[mode];
  return target === undefined ? 0 : chartAyanamsa - target;
}
