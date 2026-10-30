// Vimśopaka Bala (BPHS 7.10–27): how well a graha stands in the divisional charts, out of 20.
//
// A graha is given points for the sign it holds in each varga of a scheme, and each varga counts for its
// weight out of 20 (the weights are in vargaMatrix.ts: 7.17–23). The points of one sign (7.24–25) are
// 20 for its own sign, 18 in the sign of an adhimitra (a great friend), 15 of a mitra, 10 of a sama, 7 of
// a śatru and 5 of an adhiśatru; the relation is the compound one (natural and temporary together), the
// same as in Saptavargaja Bala. Exaltation is full strength, 20, and debilitation nil (7.11: full strength
// in its own sign or its exaltation, none in the seventh from it). 7.26–27 reads the total: under 5 it
// gives no results, over 5 little, over 10 a middling result and over 15 the full one.
//
// The verses also give a strength that runs by degrees through the sign (*gṛhaviṃśopaka*, 7.11–16) and one
// from the distance to the Sun (*udayāsta*, 7.28–29); the app does not calculate them.

import type { BalaOptions } from './balaOptions';
import { DEFAULT_BALA_OPTIONS } from './balaOptions';
import { getCompoundRelation, getDignity, type CompoundRelation, type RasiSigns, type ShadbalaPlanet } from './shadbala';
import { SIGN_LORDS } from './signs';

/** The points of a sign by the compound relation of the graha to the sign's lord (7.24–25). */
export const VIMSOPAKA_RELATION_VISWA: Record<CompoundRelation, number> = { adhimitra: 18, mitra: 15, sama: 10, shatru: 7, adhishatru: 5 };
export const VIMSOPAKA_OWN_VISWA = 20;

export type VimsopakaLevel = 'none' | 'little' | 'middling' | 'full';

/** What the total out of 20 gives (7.26–27): under 5 no results, 5 to 10 little, 10 to 15 middling, over 15 the full. */
export function vimsopakaLevel(score: number): VimsopakaLevel {
  return score < 5 ? 'none' : score < 10 ? 'little' : score < 15 ? 'middling' : 'full';
}

/**
 * The points of a graha in one sign of one varga. `relationSigns` are the signs the temporary friendship is
 * read from (the rāśi chart, or the varga's own, by the choice C3).
 */
export function vimsopakaViswa(
  planet: ShadbalaPlanet,
  signIndex: number,
  relationSigns: RasiSigns,
  debilitated: BalaOptions['vimsopakaDebilitated'] = DEFAULT_BALA_OPTIONS.vimsopakaDebilitated,
): number {
  const dignity = getDignity(planet, signIndex);
  if (dignity === 'own' || dignity === 'exalted' || dignity === 'moolatrikona') return VIMSOPAKA_OWN_VISWA;
  if (dignity === 'debilitated' && debilitated === 'zero') return 0;
  const lord = SIGN_LORDS[signIndex] as ShadbalaPlanet;
  return VIMSOPAKA_RELATION_VISWA[getCompoundRelation(planet, lord, relationSigns)];
}
