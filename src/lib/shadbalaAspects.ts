// Sphuṭa dṛṣṭi: how much of a full aspect (60 virūpa) a graha casts at a given angle, by BPHS 26.6–12.
//
// The angle is how far the aspected graha stands ahead of the aspecting one, 0–360°. A general table
// covers every graha (26.6–8); Saturn, Mars and Jupiter have special values in some stretches of the
// circle that replace it (26.9–12). The special values were read from the Sanskrit of the verses and
// checked against the translation of R. Santhanam; the verse numbers are those of the text the app was
// audited against, and other editions number them differently.

import type { MoonRule } from './balaOptions';

export type AspectingGraha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

/** The general aspect value of every graha (BPHS 26.6–8). */
function generalAspect(angle: number): number {
  if (angle < 30 || angle >= 300) return 0;
  if (angle < 60) return (angle - 30) / 2;
  if (angle < 90) return angle - 45;
  if (angle < 120) return 30 + (120 - angle) / 2;
  if (angle < 150) return 150 - angle;
  if (angle < 180) return 2 * (angle - 150);
  return (300 - angle) / 2; // 180–300°
}

/** The values that replace the general one in some stretches of the circle (BPHS 26.9–12), or null where none does. */
function specialAspect(graha: AspectingGraha, angle: number): number | null {
  if (graha === 'Saturn') {
    if (angle >= 30 && angle < 60) return 2 * (angle - 30);
    if (angle >= 60 && angle < 90) return 60 - (angle - 60) / 2;
    if (angle >= 240 && angle < 270) return angle - 240 + 30;
    if (angle >= 270 && angle < 300) return 2 * (300 - angle);
  }
  if (graha === 'Mars') {
    if (angle >= 60 && angle < 90) return 1.5 * (angle - 60) + 15;
    if (angle >= 90 && angle < 120) return 60 - (angle - 90);
    if (angle >= 180 && angle < 210) return 60; // 26.11: in the sixth completed sign the aspect is always one rupa
    if (angle >= 210 && angle < 240) return 60 - (angle - 210);
  }
  if (graha === 'Jupiter') {
    if (angle >= 90 && angle < 120) return (angle - 90) / 2 + 45;
    if (angle >= 120 && angle < 150) return 60 - (angle - 120);
    if (angle >= 210 && angle < 240) return (angle - 210) / 2 + 45;
    if (angle >= 240 && angle < 270) return 60 - (angle - 240);
  }
  return null;
}

/** The aspect, in virūpa (0–60), that `graha` casts on a graha standing `angle` degrees ahead of it. */
export function aspectVirupa(graha: AspectingGraha, angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  return specialAspect(graha, normalized) ?? generalAspect(normalized);
}

/**
 * Whether the Moon counts as a benefic: BPHS 3.11 lists the waning Moon (kṣīṇa-indu) among the malefics
 * and 34.9 sets the full Moon against it, but no verse says where one ends and the other begins.
 *
 *  - 'dark-half' (the default): the bright half (after the new Moon up to and with the full Moon) is waxing and
 *    benefic, the dark half with the new Moon itself waning and malefic (Santhanam: "the Moon in the dark half is
 *    a malefic").
 *  - 'tithi-8': B. V. Raman puts the change at the eighth tithi: the Moon is a benefic from the eighth tithi of
 *    the bright half (84° from the Sun) up to the eighth of the dark half (264°) and a malefic from there to the
 *    eighth tithi of the bright half.
 *
 * `elongation` is the Moon's longitude minus the Sun's.
 */
export function isMoonBenefic(elongation: number, rule: MoonRule = 'dark-half'): boolean {
  const normalized = ((elongation % 360) + 360) % 360;
  if (rule === 'tithi-8') return normalized >= 84 && normalized < 264;
  return normalized > 0 && normalized <= 180;
}
