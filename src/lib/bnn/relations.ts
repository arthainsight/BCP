import type { BnnGraha, BnnRelation, BnnFinding, RelationType, Confidence, GrahaKey } from './types';
import {
  GRAHA_FULL_NAMES,
  GRAHA_KARAKAS,
  PAIR_THEMES,
  RELATION_MODIFIER,
  RELATION_LABEL,
  pairKey,
} from './karakas';

// Returns 1–12: same sign = 1, next sign = 2, opposite = 7, etc.
export function getSignDistance(anchorSignIndex: number, targetSignIndex: number): number {
  return ((targetSignIndex - anchorSignIndex + 12) % 12) + 1;
}

export function getRelationType(distance: number): RelationType | null {
  switch (distance) {
    case 1:  return 'conjunction';
    case 2:  return 'secondFrom';
    case 5:  return 'fifthFrom';
    case 7:  return 'seventhFrom';
    case 9:  return 'ninthFrom';
    case 12: return 'twelfthFrom';
    default: return null;
  }
}

// Returns the three sign indices in the same trinal circuit (0-based)
export function getTrineGroup(signIndex: number): [number, number, number] {
  return [
    signIndex % 12,
    (signIndex + 4) % 12,
    (signIndex + 8) % 12,
  ];
}

export function getBnnRelationsFromAnchor(
  planets: BnnGraha[],
  anchorGraha: GrahaKey,
): BnnRelation[] {
  const anchor = planets.find((p) => p.graha === anchorGraha);
  if (!anchor) return [];

  const result: BnnRelation[] = [];
  for (const planet of planets) {
    if (planet.graha === anchorGraha) continue;
    const distance = getSignDistance(anchor.signIndex, planet.signIndex);
    const relationType = getRelationType(distance);
    if (!relationType) continue;
    result.push({ anchor: anchorGraha, related: planet.graha, relationType, distance });
  }
  return result;
}

export function getBnnRelations(planets: BnnGraha[]): BnnRelation[] {
  return planets.flatMap((p) => getBnnRelationsFromAnchor(planets, p.graha));
}

export function computeRelationStrength(rel: BnnRelation, anchor: BnnGraha, related: BnnGraha): number {
  let base: number;
  switch (rel.relationType) {
    case 'conjunction':  base = 95; break;
    case 'seventhFrom':  base = 80; break;
    case 'fifthFrom':
    case 'ninthFrom':    base = 75; break;
    default:             base = 70; // secondFrom, twelfthFrom
  }

  if (
    rel.relationType === 'conjunction' &&
    anchor.signDegree !== undefined &&
    related.signDegree !== undefined
  ) {
    const orb = Math.abs(anchor.signDegree - related.signDegree);
    if (orb > 10) base -= 10;
    else if (orb > 5) base -= 5;
  }

  return base;
}

function getConfidence(strength: number): Confidence {
  if (strength >= 85) return 'high';
  if (strength >= 70) return 'medium';
  return 'low';
}

export function buildFinding(rel: BnnRelation, planets: BnnGraha[]): BnnFinding | null {
  const anchorPlanet = planets.find((p) => p.graha === rel.anchor);
  const relatedPlanet = planets.find((p) => p.graha === rel.related);
  if (!anchorPlanet || !relatedPlanet) return null;

  const strength = computeRelationStrength(rel, anchorPlanet, relatedPlanet);
  const confidence = getConfidence(strength);
  const anchorName = GRAHA_FULL_NAMES[rel.anchor];
  const relatedName = GRAHA_FULL_NAMES[rel.related];
  const modifier = RELATION_MODIFIER[rel.relationType];
  const label = RELATION_LABEL[rel.relationType];

  const key = pairKey(rel.anchor, rel.related);
  const themes = PAIR_THEMES[key];

  if (themes && themes.length > 0) {
    return {
      anchor: rel.anchor,
      relatedGraha: rel.related,
      relationType: rel.relationType,
      strength,
      title: `${anchorName} — ${relatedName} (${label})`,
      interpretation: `${anchorName} ${modifier} ${relatedName}. ${themes.slice(0, 4).join(', ')}.`,
      confidence,
      tags: themes.slice(0, 3),
    };
  }

  // Fallback: build from individual karaka keywords
  const aKw = GRAHA_KARAKAS[rel.anchor][0] ?? rel.anchor.toLowerCase();
  const bKw = GRAHA_KARAKAS[rel.related][0] ?? rel.related.toLowerCase();
  return {
    anchor: rel.anchor,
    relatedGraha: rel.related,
    relationType: rel.relationType,
    strength,
    title: `${anchorName} — ${relatedName} (${label})`,
    interpretation: `${anchorName} ${modifier} ${relatedName}. Combines ${aKw} with ${bKw}.`,
    confidence,
    tags: [aKw, bKw],
  };
}
