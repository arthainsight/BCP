import type { ChartData } from '@/types';
import type { EventProgression } from '@/lib/bnn/eventProgressions';
import { aspectRelationOf } from '@/lib/bnn/parayaAspects';
import { SIGN_LORDS } from '@/lib/signs';

// What can be said about a moment (an event, or a random moment of a life) in a way that holds for any chart: where the progressing (Paraya) grahas and the
// transiting grahas are, in terms of houses counted from the ascendant and of the natal points (the same nine grahas and the ascendant in every chart),
// and which daśā lords are running, in terms of what they rule and where they stand in the natal chart. Charts with different ascendants can be compared.

/** Where a feature comes from: the progressions (Paraya), the transits, or the daśā. */
export type FeatureSource = 'paraya' | 'transit' | 'dasha';
export const FEATURE_SOURCES: readonly FeatureSource[] = ['paraya', 'transit', 'dasha'];

/** For progressions and transits: a graha in a house, aspecting a house by sign, aspecting a natal point by sign, and standing within a degree of a natal point. */
export type PositionFamily = 'house' | 'aspectHouse' | 'aspectNatal' | 'exact';
export const POSITION_FAMILIES: readonly PositionFamily[] = ['house', 'aspectHouse', 'aspectNatal', 'exact'];

/** For the daśā: the lord of the mahādaśā or antardaśā as a graha, the houses it rules, and the house it stands in at birth. */
export type DashaFamily = 'mdGraha' | 'mdRules' | 'mdPlaced' | 'adGraha' | 'adRules' | 'adPlaced';
export const DASHA_FAMILIES: readonly DashaFamily[] = ['mdGraha', 'mdRules', 'mdPlaced', 'adGraha', 'adRules', 'adPlaced'];

export type FeatureFamily = PositionFamily | DashaFamily;

/** The kinds of feature a source has. */
export const familiesOf = (source: FeatureSource): readonly FeatureFamily[] => (source === 'dasha' ? DASHA_FAMILIES : POSITION_FAMILIES);

export interface Feature {
  source: FeatureSource;
  family: FeatureFamily;
  /** The graha: the progressing or transiting one, or the daśā lord. */
  body: string;
  /** The house (1–12) as a string, the natal point ('Sun' … 'Ketu', 'Asc'), or '*' for the lord as a graha. */
  target: string;
}

export const featureId = (source: FeatureSource, family: FeatureFamily, body: string, target: string | number) => `${source}|${family}|${body}|${target}`;

export function parseFeatureId(id: string): Feature {
  const [source, family, body, target] = id.split('|');
  return { source: source as FeatureSource, family: family as FeatureFamily, body, target };
}

/** A kind of feature: its source and family, as one text. */
export const kindId = (source: FeatureSource, family: FeatureFamily) => `${source}|${family}`;
export const kindOfFeature = (feature: Pick<Feature, 'source' | 'family'>) => kindId(feature.source, feature.family);

/** What a family points at: a house, a natal point, or nothing (the daśā lord as a graha). */
export type TargetKind = 'house' | 'natal' | 'none';
export const targetKindOf = (family: FeatureFamily): TargetKind => {
  if (family === 'house' || family === 'aspectHouse' || family === 'mdRules' || family === 'mdPlaced' || family === 'adRules' || family === 'adPlaced') return 'house';
  return family === 'aspectNatal' || family === 'exact' ? 'natal' : 'none';
};

/**
 * The features that positions have at a moment: for each graha, its house; each house whose sign it aspects (it is in the same sign, or the 5th, 7th or 9th
 * sign from it); each natal point it aspects by sign; and each natal point it stands within a degree of in an aspecting sign. `ascendantSign` is 1–12.
 */
export function featuresOf(rows: readonly EventProgression[], families: readonly FeatureFamily[], ascendantSign: number, source: 'paraya' | 'transit' = 'paraya'): string[] {
  const wanted = new Set(families);
  const features: string[] = [];
  for (const row of rows) {
    if (wanted.has('house')) features.push(featureId(source, 'house', row.body, row.house));
    if (wanted.has('aspectHouse')) {
      for (let house = 1; house <= 12; house++) {
        if (aspectRelationOf(row.signIndex, (ascendantSign - 1 + house - 1) % 12)) features.push(featureId(source, 'aspectHouse', row.body, house));
      }
    }
    for (const aspect of row.aspects) {
      if (wanted.has('aspectNatal')) features.push(featureId(source, 'aspectNatal', row.body, aspect.natal));
      if (wanted.has('exact') && aspect.exact) features.push(featureId(source, 'exact', row.body, aspect.natal));
    }
  }
  return features;
}

/**
 * The features of the daśā lords running (the mahādaśā and antardaśā lords at a moment, or all that run in a window): each lord as a graha, the houses it rules
 * (from the ascendant; Rahu and Ketu rule none) and the house it stands in at birth.
 */
export function dashaFeaturesOf(lords: readonly { md: string; ad: string }[], chart: ChartData, families: readonly FeatureFamily[]): string[] {
  const wanted = new Set(families);
  const ascendant = chart.ascendant.sign;
  const features: string[] = [];
  for (const pair of lords) {
    for (const level of ['md', 'ad'] as const) {
      const lord = pair[level];
      if (wanted.has(`${level}Graha` as FeatureFamily)) features.push(featureId('dasha', `${level}Graha` as DashaFamily, lord, '*'));
      if (wanted.has(`${level}Rules` as FeatureFamily)) {
        for (let house = 1; house <= 12; house++) if (SIGN_LORDS[(ascendant - 1 + house - 1) % 12] === lord) features.push(featureId('dasha', `${level}Rules` as DashaFamily, lord, house));
      }
      if (wanted.has(`${level}Placed` as FeatureFamily)) {
        const planet = chart.planets.find(item => item.name === lord);
        if (planet) features.push(featureId('dasha', `${level}Placed` as DashaFamily, lord, ((planet.sign - ascendant + 12) % 12) + 1));
      }
    }
  }
  return features;
}
