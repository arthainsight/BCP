// Which zodiac the nakṣatras are counted in. The grahas stand in the ayanāṁśa chosen in Settings; the nakṣatras
// follow the same one unless another is asked for: the Lahiri ayanāṁśa (whatever the grahas use), or the tropical
// zodiac.

export type NakshatraMode = 'same' | 'lahiri' | 'tropical';

export const NAKSHATRA_MODES: readonly NakshatraMode[] = ['same', 'lahiri', 'tropical'];

export const DEFAULT_NAKSHATRA_MODE: NakshatraMode = 'same';

/**
 * A stored nakṣatra zodiac. Before there was a choice of "same as the grahas" the default was called
 * "sidereal (Lahiri)" and was kept as 'sidereal', so a stored 'sidereal' is the old default and means the same
 * as the grahas now; anything unknown is the default.
 */
export function readNakshatraMode(stored: unknown): NakshatraMode {
  if (stored === 'sidereal') return DEFAULT_NAKSHATRA_MODE;
  return (NAKSHATRA_MODES as readonly unknown[]).includes(stored) ? (stored as NakshatraMode) : DEFAULT_NAKSHATRA_MODE;
}

/**
 * The number of degrees to add to a graha's longitude to get the longitude the nakṣatra is read from.
 * A graha's longitude is the tropical longitude less the ayanāṁśa of the chart, so the nakṣatra longitude in
 * another zodiac is the graha's plus the chart's ayanāṁśa less the ayanāṁśa of that zodiac.
 */
export function nakshatraAdjustFor(mode: NakshatraMode, chartAyanamsa: number, lahiriAyanamsa?: number): number {
  switch (mode) {
    case 'same': return 0;
    case 'tropical': return chartAyanamsa;
    case 'lahiri': return chartAyanamsa - (lahiriAyanamsa ?? chartAyanamsa);
  }
}
