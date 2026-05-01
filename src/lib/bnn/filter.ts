import type { BnnFinding, BnnChain, BnnRelation, BnnAnalysisResult, TopicKey, GrahaKey } from './types';
import { TOPIC_LABELS } from './topics';
import { GRAHA_FULL_NAMES } from './karakas';

// Grahas that must have at least one finding in the output (signal coverage)
const MUST_COVER: GrahaKey[] = ['Sa', 'Ju', 'Mo'];

// ─── Dedup + coverage filter ──────────────────────────────────────────────────

export function filterBnnFindings(findings: BnnFinding[]): BnnFinding[] {
  // Deduplicate by interpretation text
  const seenText = new Set<string>();
  const deduped = findings.filter((f) => {
    if (seenText.has(f.interpretation)) return false;
    seenText.add(f.interpretation);
    return true;
  });

  const sorted = [...deduped].sort((a, b) => b.strength - a.strength);
  const top = sorted.slice(0, 7);

  // Ensure Sa, Ju, Mo each appear at least once
  const coveredGrahas = new Set<GrahaKey>(top.flatMap((f) => [f.anchor, f.relatedGraha]));
  for (const g of MUST_COVER) {
    if (coveredGrahas.has(g)) continue;
    const candidate = sorted.find(
      (f) => !top.includes(f) && (f.anchor === g || f.relatedGraha === g),
    );
    if (!candidate) continue;
    if (top.length >= 7) top.splice(top.length - 1, 1); // drop weakest
    top.push(candidate);
    coveredGrahas.add(g);
  }

  return top.sort((a, b) => b.strength - a.strength);
}

// ─── Classification ───────────────────────────────────────────────────────────

type FindingClass = 'risk' | 'support' | 'key';

function classifyOne(f: BnnFinding): FindingClass {
  const hasKe = f.anchor === 'Ke' || f.relatedGraha === 'Ke';
  const hasRa = f.anchor === 'Ra' || f.relatedGraha === 'Ra';
  const hasMo = f.anchor === 'Mo' || f.relatedGraha === 'Mo';
  const hasJu = f.anchor === 'Ju' || f.relatedGraha === 'Ju';

  if (hasKe) return 'risk';
  if (hasRa && hasMo) return 'risk';
  if (hasJu) return 'support';
  if (f.relationType === 'fifthFrom' || f.relationType === 'ninthFrom') return 'support';
  return 'key';
}

export function classifyFindings(findings: BnnFinding[]): {
  keyFindings: BnnFinding[];
  riskFactors: BnnFinding[];
  supportFactors: BnnFinding[];
} {
  const keyFindings: BnnFinding[] = [];
  const riskFactors: BnnFinding[] = [];
  const supportFactors: BnnFinding[] = [];
  for (const f of findings) {
    const cls = classifyOne(f);
    if (cls === 'risk') riskFactors.push(f);
    else if (cls === 'support') supportFactors.push(f);
    else keyFindings.push(f);
  }
  return { keyFindings, riskFactors, supportFactors };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function buildSummary(
  topic: TopicKey,
  anchorsUsed: GrahaKey[],
  topChains: BnnChain[],
  keyFindings: string[],
  supportFactors: string[],
  riskFactors: string[],
): string {
  const lines: string[] = [];

  lines.push(
    `${TOPIC_LABELS[topic]}: anchors ${anchorsUsed.map((g) => GRAHA_FULL_NAMES[g]).join(', ')}.`,
  );

  if (topChains.length > 0) {
    const c = topChains[0];
    lines.push(`Dominant chain: ${c.path.join(' → ')} [strength ${c.strength}].`);
  }

  if (keyFindings.length > 0) lines.push(`Key: ${keyFindings[0]}`);
  if (supportFactors.length > 0) lines.push(`Support: ${supportFactors[0]}`);
  if (riskFactors.length > 0) lines.push(`Risk: ${riskFactors[0]}`);

  return lines.slice(0, 5).join('\n');
}

// ─── Result builder ───────────────────────────────────────────────────────────

function topRelationsByType(relations: BnnRelation[]): BnnRelation[] {
  const typeWeight: Record<string, number> = {
    conjunction: 4, seventhFrom: 3, fifthFrom: 2, ninthFrom: 2,
    secondFrom: 1, twelfthFrom: 1,
  };
  return [...relations]
    .sort((a, b) => (typeWeight[b.relationType] ?? 0) - (typeWeight[a.relationType] ?? 0))
    .slice(0, 10);
}

export function buildBnnAnalysisResult(
  topic: TopicKey,
  anchorsUsed: GrahaKey[],
  allRelations: BnnRelation[],
  allFindings: BnnFinding[],
  topChains: BnnChain[],
): BnnAnalysisResult {
  const filtered = filterBnnFindings(allFindings);
  const { keyFindings, riskFactors, supportFactors } = classifyFindings(filtered);

  const keyFindingStrings = keyFindings.map((f) => f.interpretation);
  const riskStrings = riskFactors.map((f) => f.interpretation);
  const supportStrings = supportFactors.map((f) => f.interpretation);

  return {
    topic,
    anchorsUsed,
    topRelations: topRelationsByType(allRelations),
    topChains: topChains.slice(0, 3),
    findings: filtered,
    keyFindings: keyFindingStrings,
    riskFactors: riskStrings,
    supportFactors: supportStrings,
    summary: buildSummary(topic, anchorsUsed, topChains, keyFindingStrings, supportStrings, riskStrings),
  };
}
