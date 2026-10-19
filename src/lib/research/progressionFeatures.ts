import type { EventProgression } from '@/lib/bnn/eventProgressions';
import { aspectRelationOf } from '@/lib/bnn/parayaAspects';
import type { ParayaBody } from '@/lib/bnn/nadiParaya';

// What can be said about the progressions (Paraya) at one moment in a way that holds for any chart: the house a graha stands in, the houses it aspects by
// sign, the natal points it aspects by sign and the ones it stands exactly on. Houses count from the ascendant, so charts with different ascendants can be
// compared; the natal points are the same nine grahas and the ascendant in every chart.

/** The kinds of feature: a graha in a house, aspecting a house by sign, aspecting a natal point by sign, and standing within a degree of a natal point. */
export type FeatureFamily = 'house' | 'aspectHouse' | 'aspectNatal' | 'exact';

export const FEATURE_FAMILIES: readonly FeatureFamily[] = ['house', 'aspectHouse', 'aspectNatal', 'exact'];

export interface Feature {
  family: FeatureFamily;
  body: ParayaBody;
  /** The house, 1–12, as a string, or the natal point ('Sun' … 'Ketu', 'Asc'). */
  target: string;
}

export const featureId = (family: FeatureFamily, body: ParayaBody, target: string | number) => `${family}|${body}|${target}`;

export function parseFeatureId(id: string): Feature {
  const [family, body, target] = id.split('|');
  return { family: family as FeatureFamily, body: body as ParayaBody, target };
}

/**
 * The features the progressions have at a moment: for each graha, its house; each house whose sign it aspects (it is in the same sign, or the 5th, 7th or 9th
 * sign from it); each natal point it aspects by sign; and each natal point it stands within a degree of in an aspecting sign. `ascendantSign` is 1–12.
 */
export function featuresOf(rows: readonly EventProgression[], families: readonly FeatureFamily[], ascendantSign: number): string[] {
  const wanted = new Set(families);
  const features: string[] = [];
  for (const row of rows) {
    if (wanted.has('house')) features.push(featureId('house', row.body, row.house));
    if (wanted.has('aspectHouse')) {
      for (let house = 1; house <= 12; house++) {
        if (aspectRelationOf(row.signIndex, (ascendantSign - 1 + house - 1) % 12)) features.push(featureId('aspectHouse', row.body, house));
      }
    }
    for (const aspect of row.aspects) {
      if (wanted.has('aspectNatal')) features.push(featureId('aspectNatal', row.body, aspect.natal));
      if (wanted.has('exact') && aspect.exact) features.push(featureId('exact', row.body, aspect.natal));
    }
  }
  return features;
}
