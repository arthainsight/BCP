import { runStudy, testFeature, type FeatureKind, type StudyChart, type StudyOptions } from './eventStudy';
import { parseFeatureId, type Feature } from './features';
import { adjustedQValues } from './stats';

// A traditional rule is seldom one thing: a daśā lord works when the gochara supports it, Saturn over the Moon matters in the daśā of the Moon. A combination is a
// feature of two features that are there at the same time ("MD lord Saturn" and "Saturn in the 4th from the Moon"), and it has its chance level like any other:
// how often both are there at random moments of the same chart. It is interesting only if it beats each of its parts, so each combination comes with the p of both.

/** Between the two ids of a combination. */
export const COMBO_SEPARATOR = ' & ';

export const comboId = (first: string, second: string) => `${first}${COMBO_SEPARATOR}${second}`;

/** The two feature ids a combination is made of, or null when the id is not a combination. */
export function parseComboId(id: string): [string, string] | null {
  const at = id.indexOf(COMBO_SEPARATOR);
  return at < 0 ? null : [id.slice(0, at), id.slice(at + COMBO_SEPARATOR.length)];
}

/** Two kinds of feature to put together, and whether only the same graha counts (the lord of the daśā with its own transit). */
export interface ComboSpec {
  left: FeatureKind;
  right: FeatureKind;
  sameGraha: boolean;
}

const isKind = (id: string, kind: FeatureKind) => {
  const feature = parseFeatureId(id);
  return feature.source === kind.source && feature.family === kind.family;
};

/** The hook for `StudyOptions.combine`: from the ids found at a moment, the combinations of the two kinds. */
export function comboHook(spec: ComboSpec): (ids: string[]) => string[] {
  const same = spec.left.source === spec.right.source && spec.left.family === spec.right.family;
  return ids => {
    const lefts = ids.filter(id => isKind(id, spec.left));
    const rights = same ? lefts : ids.filter(id => isKind(id, spec.right));
    const made: string[] = [];
    for (const a of lefts) {
      const body = spec.sameGraha ? parseFeatureId(a).body : '';
      for (const b of rights) {
        if (a === b || (same && a > b)) continue;
        if (spec.sameGraha && parseFeatureId(b).body !== body) continue;
        made.push(comboId(a, b));
      }
    }
    return made;
  };
}

export interface ComboRow {
  id: string;
  parts: [Feature, Feature];
  observed: number;
  expected: number;
  lift: number | null;
  /** The exact chance of as many events with it by chance, and corrected for the number of combinations looked at (false discovery rate). */
  p: number;
  q: number;
  /** The exact p of each part on its own. */
  partP: [number, number];
  /** The combination is more unusual than either part: its p is below both. */
  beyondParts: boolean;
  events: { chartId: string; eventId: string }[];
}

export interface ComboResult {
  charts: number;
  events: number;
  skipped: number;
  /** The combinations that at least one event has, which the correction counts. */
  tested: number;
  rows: ComboRow[];
}

/** The study of the combinations of two kinds of feature, the most unusual first. */
export function comboStudy(charts: readonly StudyChart[], options: StudyOptions, spec: ComboSpec): ComboResult {
  const kinds: FeatureKind[] = spec.left.source === spec.right.source && spec.left.family === spec.right.family ? [spec.left] : [spec.left, spec.right];
  // Only the exact test is used, so the permutations are not run.
  const study = runStudy(charts, { ...options, kinds, combine: comboHook(spec), permutations: 0 });
  const found = study.data.names.filter(id => parseComboId(id) !== null);
  const tests = found.map(id => testFeature(study.data, id)).filter(test => test.observed > 0);
  const q = adjustedQValues(tests.map(test => test.p));
  const rows = tests.map((test, i): ComboRow => {
    const [first, second] = parseComboId(test.id)!;
    const partP: [number, number] = [testFeature(study.data, first).p, testFeature(study.data, second).p];
    return {
      id: test.id,
      parts: [parseFeatureId(first), parseFeatureId(second)],
      observed: test.observed,
      expected: test.expected,
      lift: test.lift,
      p: test.p,
      q: q[i],
      partP,
      beyondParts: test.lift !== null && test.lift > 1 && test.p < Math.min(...partP),
      events: test.events,
    };
  });
  rows.sort((a, b) => a.p - b.p || b.observed - a.observed || a.id.localeCompare(b.id));
  return { charts: study.charts, events: study.events, skipped: study.skipped, tested: rows.length, rows };
}
