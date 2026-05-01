import type { TopicKey, BnnGraha, BnnTopicResult, BnnFinding, GrahaKey } from './types';
import { getBnnRelationsFromAnchor, buildFinding } from './relations';

export const TOPIC_ANCHORS: Record<TopicKey, GrahaKey[]> = {
  career:       ['Sa', 'Su', 'Me', 'Ju'],
  marriage:     ['Ve', 'Ju', 'Ma'],
  education:    ['Me', 'Ju'],
  wealth:       ['Ju', 'Ve', 'Me'],
  children:     ['Ju', 'Su', 'Mo'],
  spirituality: ['Ju', 'Ke', 'Sa'],
  health:       ['Su', 'Mo', 'Ma', 'Sa'],
  general:      ['Ju', 'Sa', 'Mo', 'Su'],
};

export const TOPIC_LABELS: Record<TopicKey, string> = {
  career:       'Career',
  marriage:     'Marriage',
  education:    'Education',
  wealth:       'Wealth',
  children:     'Children',
  spirituality: 'Spirituality',
  health:       'Health',
  general:      'General',
};

function buildSummary(topic: TopicKey, findings: BnnFinding[]): string {
  if (findings.length === 0) {
    return `No significant ${topic} combinations found in the relevant anchor grahas.`;
  }
  const top = findings.slice(0, 3);
  const uniqueTags = [...new Set(top.flatMap((f) => f.tags))].slice(0, 4);
  return `${TOPIC_LABELS[topic]} themes: ${uniqueTags.join(', ')}.`;
}

export function analyzeBnnTopic(
  planets: BnnGraha[],
  topic: TopicKey,
  anchorFilter?: GrahaKey,
): BnnTopicResult {
  const topicAnchors = TOPIC_ANCHORS[topic];
  const anchorsToUse: GrahaKey[] = anchorFilter
    ? [anchorFilter]
    : topicAnchors.filter((a) => planets.some((p) => p.graha === a));

  const allRelations = anchorsToUse.flatMap((anchor) =>
    getBnnRelationsFromAnchor(planets, anchor),
  );

  const seen = new Set<string>();
  const findings: BnnFinding[] = [];

  for (const rel of allRelations) {
    const dedupKey = `${rel.anchor}-${rel.related}-${rel.relationType}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    const finding = buildFinding(rel, planets);
    if (finding) findings.push(finding);
  }

  findings.sort((a, b) => b.strength - a.strength);

  return {
    topic,
    anchorsUsed: anchorsToUse,
    relations: allRelations,
    findings,
    summary: buildSummary(topic, findings),
  };
}
