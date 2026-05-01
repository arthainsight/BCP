import type { PlanetData, ChartData } from '@/types';
import type { BnnGraha, GrahaKey, TopicKey } from './types';
import { getBnnRelations } from './relations';
import { analyzeBnnTopic } from './topics';
import { buildBnnChains } from './chains';
import { buildBnnAnalysisResult } from './filter';

export type { BnnGraha, GrahaKey, TopicKey };
export type {
  BnnRelation,
  BnnFinding,
  BnnTopicResult,
  BnnChain,
  BnnAnalysisResult,
  RelationType,
  Confidence,
} from './types';

const OUTER_PLANETS = new Set(['Uranus', 'Neptune', 'Pluto']);

const NAME_TO_KEY: Record<string, GrahaKey> = {
  Sun:     'Su',
  Moon:    'Mo',
  Mars:    'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus:   'Ve',
  Saturn:  'Sa',
  Rahu:    'Ra',
  Ketu:    'Ke',
};

// Converts PlanetData[] from the existing chart types into BNN internal format.
// PlanetData.sign is 1-based (1=Aries); signIndex is 0-based (0=Aries).
// PlanetData.degree is degree-within-sign (0–30).
export function adaptPlanetsForBnn(planets: PlanetData[]): BnnGraha[] {
  return planets
    .filter((p) => !OUTER_PLANETS.has(p.name) && NAME_TO_KEY[p.name] !== undefined)
    .map((p) => ({
      graha: NAME_TO_KEY[p.name] as GrahaKey,
      signIndex: p.sign - 1,
      signDegree: p.degree,
      absoluteDegree: p.longitude,
    }));
}

export function analyzeBnnFromChart(
  chart: ChartData,
  topic: TopicKey,
  anchorFilter?: GrahaKey,
) {
  const grahas = adaptPlanetsForBnn(chart.planets);
  const topicResult = analyzeBnnTopic(grahas, topic, anchorFilter);

  // Build chains for all topic anchors (or just the selected anchor)
  const anchorsToChain = anchorFilter ? [anchorFilter] : topicResult.anchorsUsed;
  const seenPaths = new Set<string>();
  const allChains = anchorsToChain
    .flatMap((anchor) => buildBnnChains(grahas, anchor, 3))
    .filter((c) => {
      const key = c.path.join('-');
      if (seenPaths.has(key)) return false;
      seenPaths.add(key);
      return true;
    })
    .sort((a, b) => b.strength - a.strength);

  return buildBnnAnalysisResult(
    topic,
    topicResult.anchorsUsed,
    topicResult.relations,
    topicResult.findings,
    allChains,
  );
}

export function getAllRelationsFromChart(chart: ChartData) {
  const grahas = adaptPlanetsForBnn(chart.planets);
  return getBnnRelations(grahas);
}
