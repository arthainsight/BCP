import { normalizeDegrees } from './angles';

// Combustion (asta): a graha so close to the Sun that its light is lost. The orbs are the classical ones (BPHS 3): the Moon 12°,
// Mars 17°, Mercury 14°, Jupiter 11°, Venus 10° and Saturn 15°, narrower for Mercury (12°) and Venus (8°) while they are retrograde.
// The Sun, Rahu, Ketu and the outer planets are never combust.

export interface CombustionOrb {
  direct: number;
  retrograde: number;
}

export const COMBUSTION_ORBS: Record<string, CombustionOrb> = {
  Moon: { direct: 12, retrograde: 12 },
  Mars: { direct: 17, retrograde: 17 },
  Mercury: { direct: 14, retrograde: 12 },
  Jupiter: { direct: 11, retrograde: 11 },
  Venus: { direct: 10, retrograde: 8 },
  Saturn: { direct: 15, retrograde: 15 },
};

export interface Combustion {
  /** The orb that applied (the retrograde one for a graha going backwards). */
  orb: number;
  /** Degrees between the graha and the Sun. */
  distance: number;
  retrograde: boolean;
}

/** The angle between two longitudes, 0–180. */
export function angularSeparation(a: number, b: number): number {
  const difference = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(difference, 360 - difference);
}

/** Whether a graha is combust, and by how much; null when it is not (or cannot be). */
export function combustionOf(name: string, longitude: number, sunLongitude: number, retrograde = false): Combustion | null {
  const orbs = COMBUSTION_ORBS[name];
  if (!orbs) return null;
  const orb = retrograde ? orbs.retrograde : orbs.direct;
  const distance = angularSeparation(longitude, sunLongitude);
  return distance <= orb ? { orb, distance, retrograde } : null;
}
