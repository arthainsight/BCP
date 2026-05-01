import type { BnnGraha, BnnChain, BnnRelation, GrahaKey } from './types';
import { getBnnRelationsFromAnchor, computeRelationStrength } from './relations';
import { GRAHA_FULL_NAMES, GRAHA_KARAKAS, PAIR_THEMES, pairKey } from './karakas';

const MIN_CHAIN_STRENGTH = 70;

// Resolves a planet from the list, failing fast to avoid repeated undefined checks
function planet(planets: BnnGraha[], g: GrahaKey): BnnGraha | undefined {
  return planets.find((p) => p.graha === g);
}

function relStrength(rel: BnnRelation, planets: BnnGraha[]): number {
  const a = planet(planets, rel.anchor);
  const b = planet(planets, rel.related);
  if (!a || !b) return 0;
  return computeRelationStrength(rel, a, b);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeChainScore(
  path: GrahaKey[],
  relations: BnnRelation[],
  anchorTotalRelationCount: number,
  planets: BnnGraha[],
): number {
  if (relations.length === 0) return 0;

  const strengths = relations.map((r) => relStrength(r, planets));
  const base = strengths.reduce((s, v) => s + v, 0) / strengths.length;

  let mod = 0;
  if (relations.some((r) => r.relationType === 'conjunction'))                         mod += 10;
  if (relations.some((r) => r.relationType === 'fifthFrom' || r.relationType === 'ninthFrom')) mod += 5;
  if (anchorTotalRelationCount >= 2)                                                   mod += 5;
  if (path.includes('Ju'))                                                              mod += 5;
  if (path.includes('Sa'))                                                              mod += 5;
  if (path.includes('Ke'))                                                              mod -= 5;
  if (path.includes('Ra'))                                                              mod += 5; // amplifies, flagged as unstable in filter

  return Math.max(0, Math.min(100, Math.round(base + mod)));
}

// ─── Interpretation ────────────────────────────────────────────────────────────

function buildChainInterpretation(path: GrahaKey[]): string {
  const parts = path.map((g) => `${GRAHA_FULL_NAMES[g]} [${GRAHA_KARAKAS[g][0]}]`);

  const themes: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const key = pairKey(path[i], path[i + 1]);
    const t = PAIR_THEMES[key];
    if (t && t.length > 0) themes.push(t[0]);
  }

  const chain = parts.join(' → ');
  return themes.length > 0 ? `${chain}: ${themes.join(' + ')}` : chain;
}

function buildCombinedKarakas(path: GrahaKey[]): string[] {
  const raw = path.flatMap((g) => GRAHA_KARAKAS[g].slice(0, 2));
  return [...new Set(raw)].slice(0, 6);
}

// ─── Chain assembly ────────────────────────────────────────────────────────────

function makeChain(
  path: GrahaKey[],
  relations: BnnRelation[],
  anchorTotalRelationCount: number,
  planets: BnnGraha[],
): BnnChain {
  return {
    path,
    relations,
    combinedKarakas: buildCombinedKarakas(path),
    strength: computeChainScore(path, relations, anchorTotalRelationCount, planets),
    interpretation: buildChainInterpretation(path),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function buildBnnChains(
  planets: BnnGraha[],
  anchorGraha: GrahaKey,
  maxDepth: 2 | 3 = 3,
): BnnChain[] {
  const results: BnnChain[] = [];

  // For modifier: how many valid relations does this anchor have in total
  const anchorTotalRelationCount = getBnnRelationsFromAnchor(planets, anchorGraha)
    .filter((r) => relStrength(r, planets) >= MIN_CHAIN_STRENGTH).length;

  // First-level links (depth 1)
  const firstLinks = getBnnRelationsFromAnchor(planets, anchorGraha)
    .filter((r) => relStrength(r, planets) >= MIN_CHAIN_STRENGTH)
    .sort((a, b) => relStrength(b, planets) - relStrength(a, planets));

  for (const link1 of firstLinks) {
    const path2: GrahaKey[] = [anchorGraha, link1.related];
    const rels2: BnnRelation[] = [link1];

    // Depth-2 chain always recorded
    results.push(makeChain(path2, rels2, anchorTotalRelationCount, planets));

    if (maxDepth < 3) continue;

    // Expand to depth 3 — take at most 2 branches per node to limit explosion
    const secondLinks = getBnnRelationsFromAnchor(planets, link1.related)
      .filter((r) => !path2.includes(r.related))
      .filter((r) => relStrength(r, planets) >= MIN_CHAIN_STRENGTH)
      .sort((a, b) => relStrength(b, planets) - relStrength(a, planets))
      .slice(0, 2);

    for (const link2 of secondLinks) {
      const path3: GrahaKey[] = [...path2, link2.related];
      const rels3: BnnRelation[] = [...rels2, link2];
      results.push(makeChain(path3, rels3, anchorTotalRelationCount, planets));
    }
  }

  // Deduplicate by path string, sort by strength descending
  const seen = new Set<string>();
  return results
    .filter((c) => {
      const key = c.path.join('-');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.strength - a.strength);
}

export function interpretBnnChain(chain: BnnChain): string {
  return chain.interpretation;
}
