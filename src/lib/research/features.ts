import type { ChartData } from '@/types';
import type { EventProgression } from '@/lib/bnn/eventProgressions';
import { aspectRelationOf } from '@/lib/bnn/parayaAspects';
import { PROGRESSION_RELATIONS, transitRelationsOf } from '@/lib/transitHits';
import { SIGN_LORDS } from '@/lib/signs';
import { gocharaRowOf, type GocharaPlanet, type GocharaTables } from '@/lib/gochara';

// What can be said about a moment (an event, or a random moment of a life) in a way that holds for any chart: where the progressing (Paraya) grahas and the
// transiting grahas are, in terms of houses counted from the ascendant and of the natal points (the same nine grahas and the ascendant in every chart),
// and which daśā lords are running, in terms of what they rule and where they stand in the natal chart. Charts with different ascendants can be compared.

/** Where a feature comes from: the progressions (Paraya), the transits, the daśā, or the traditional rules of the transits (gochara). */
export type FeatureSource = 'paraya' | 'transit' | 'dasha' | 'gochara';
export const FEATURE_SOURCES: readonly FeatureSource[] = ['paraya', 'transit', 'dasha', 'gochara'];

/** For progressions and transits: a graha in a house, aspecting a house by sign, aspecting a natal point by sign, and standing within a degree of a natal point. */
export type PositionFamily = 'house' | 'aspectHouse' | 'aspectNatal' | 'exact';
export const POSITION_FAMILIES: readonly PositionFamily[] = ['house', 'aspectHouse', 'aspectNatal', 'exact'];

/** For the daśā: the lord of the mahādaśā or antardaśā as a graha, the houses it rules, and the house it stands in at birth. */
export type DashaFamily = 'mdGraha' | 'mdRules' | 'mdPlaced' | 'adGraha' | 'adRules' | 'adPlaced';
export const DASHA_FAMILIES: readonly DashaFamily[] = ['mdGraha', 'mdRules', 'mdPlaced', 'adGraha', 'adRules', 'adPlaced'];

/**
 * For the gochara, the traditional reading of the transits of the slow grahas: the house from the natal Moon; whether that house is a favourable one for the
 * graha (Jupiter and Saturn); the bindus of the graha's own Bhinnāṣṭakavarga in the sign it moves through (strong, average, weak); the Sarvāṣṭakavarga of the sign
 * (28 or more, or less); and the rules of Saturn from the Moon (Sade Sati, the fourth, the eighth).
 */
export type GocharaFamily = 'fromMoon' | 'favourable' | 'bindu' | 'sav' | 'rule';
export const GOCHARA_FAMILIES: readonly GocharaFamily[] = ['fromMoon', 'favourable', 'bindu', 'sav', 'rule'];

export type FeatureFamily = PositionFamily | DashaFamily | GocharaFamily;

/** The kinds of feature a source has. */
export const familiesOf = (source: FeatureSource): readonly FeatureFamily[] => (source === 'dasha' ? DASHA_FAMILIES : source === 'gochara' ? GOCHARA_FAMILIES : POSITION_FAMILIES);

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

/** What a family points at: a house, a natal point, one of a few named things (a list), or nothing (the daśā lord as a graha). */
export type TargetKind = 'house' | 'natal' | 'list' | 'none';
export const targetKindOf = (family: FeatureFamily): TargetKind => {
  if (family === 'house' || family === 'aspectHouse' || family === 'mdRules' || family === 'mdPlaced' || family === 'adRules' || family === 'adPlaced' || family === 'fromMoon') return 'house';
  if (family === 'aspectNatal' || family === 'exact') return 'natal';
  return family === 'favourable' || family === 'bindu' || family === 'sav' || family === 'rule' ? 'list' : 'none';
};

/** The named targets of a family whose target is one of a few. */
export const TARGET_LISTS: Record<'favourable' | 'bindu' | 'sav' | 'rule', readonly string[]> = {
  favourable: ['favourable', 'unfavourable'],
  bindu: ['strong', 'average', 'weak'],
  sav: ['high', 'low'],
  rule: ['sadeSati', 'kantaka', 'ashtama'],
};

/**
 * The features that positions have at a moment: for each graha, its house; each house whose sign it aspects (it is in the same sign, or in a sign it aspects: the 5th,
 * 7th or 9th for a progressing graha, and for a transiting one its own aspects, Saturn the 3rd, 7th and 10th and so on); each natal point it aspects by sign; and each
 * natal point it stands within a degree of in an aspecting sign. `ascendantSign` is 1–12.
 */
export function featuresOf(rows: readonly EventProgression[], families: readonly FeatureFamily[], ascendantSign: number, source: 'paraya' | 'transit' = 'paraya'): string[] {
  const wanted = new Set(families);
  const features: string[] = [];
  for (const row of rows) {
    if (wanted.has('house')) features.push(featureId(source, 'house', row.body, row.house));
    if (wanted.has('aspectHouse')) {
      for (let house = 1; house <= 12; house++) {
        if (aspectRelationOf(row.signIndex, (ascendantSign - 1 + house - 1) % 12, source === 'transit' ? transitRelationsOf : PROGRESSION_RELATIONS, row.body)) features.push(featureId(source, 'aspectHouse', row.body, house));
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

/** The Sarvāṣṭakavarga of a sign is high from this many bindus (the average is 28). */
export const SAV_HIGH = 28;

/**
 * The gochara features of some transiting grahas (each by its sign, 1–12), read against the tables of a chart: the house from the natal Moon, whether it is a
 * favourable one (Jupiter and Saturn), the strength of the bindus of the graha's own Bhinnāṣṭakavarga in the sign (Jupiter and Saturn), the Sarvāṣṭakavarga of the
 * sign, and for Saturn the rules from the Moon: Sade Sati (the 12th, 1st or 2nd), the fourth and the eighth.
 */
export function gocharaFeaturesOf(tables: GocharaTables, positions: readonly { body: string; sign: number }[], families: readonly FeatureFamily[]): string[] {
  const wanted = new Set(families);
  const features: string[] = [];
  for (const position of positions) {
    const row = gocharaRowOf(tables, position.body as GocharaPlanet, position.sign);
    if (wanted.has('fromMoon')) features.push(featureId('gochara', 'fromMoon', position.body, row.houseFromMoon));
    if (wanted.has('favourable') && row.favourable !== null) features.push(featureId('gochara', 'favourable', position.body, row.favourable ? 'favourable' : 'unfavourable'));
    if (wanted.has('bindu') && row.strength !== null) features.push(featureId('gochara', 'bindu', position.body, row.strength));
    if (wanted.has('sav')) features.push(featureId('gochara', 'sav', position.body, row.sav >= SAV_HIGH ? 'high' : 'low'));
    if (wanted.has('rule') && position.body === 'Saturn') {
      if (row.houseFromMoon === 12 || row.houseFromMoon === 1 || row.houseFromMoon === 2) features.push(featureId('gochara', 'rule', 'Saturn', 'sadeSati'));
      if (row.houseFromMoon === 4) features.push(featureId('gochara', 'rule', 'Saturn', 'kantaka'));
      if (row.houseFromMoon === 8) features.push(featureId('gochara', 'rule', 'Saturn', 'ashtama'));
    }
  }
  return features;
}
