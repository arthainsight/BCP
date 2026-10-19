import { runStudy, testFeature, type FeatureTest, type StudyChart, type StudyOptions } from './eventStudy';
import { parseFeatureId, type Feature } from './features';
import { hashText, seededRandom } from './random';

// A pattern found by looking at many features may be chance, however small its p-value, because so many were looked at. The surest check is to find it on one part of
// the data and test it on another that was not looked at: the charts are split in two, or (with few charts) the events, the best features of the first part are found
// the usual way, and each is then tested exactly on the second part, with a correction only for how many were carried over (the best ten, say) and not for all of
// those looked at. A real pattern holds there; a chance one does not.

export type SplitBy = 'charts' | 'events';

export interface Split {
  training: StudyChart[];
  test: StudyChart[];
}

/** A list in a random order that the seed fixes. */
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * The charts in two parts by chance: the charts themselves go to one or the other, or the events of each chart are shared between them (by events the two parts
 * have the same charts, and the random moments are those of the same lives). `share` is the part that goes to the training (0–1); each part gets at least one chart
 * (by charts) or one event (by events) when there are enough.
 */
export function splitStudy(charts: readonly StudyChart[], by: SplitBy, share: number, seed: number): Split {
  const random = seededRandom(seed ^ hashText(`split|${by}`));
  if (by === 'charts') {
    if (charts.length < 2) return { training: [...charts], test: [] };
    const order = shuffled(charts, random);
    const count = Math.min(charts.length - 1, Math.max(1, Math.round(charts.length * share)));
    return { training: order.slice(0, count), test: order.slice(count) };
  }
  const all = charts.flatMap(item => item.events.map(event => ({ item, event })));
  if (all.length < 2) return { training: [...charts], test: [] };
  const order = shuffled(all, random);
  const count = Math.min(all.length - 1, Math.max(1, Math.round(all.length * share)));
  const training = new Set(order.slice(0, count).map(entry => entry.event.id + '|' + entry.item.id));
  const part = (wanted: boolean) => charts
    .map(item => ({ ...item, events: item.events.filter(event => training.has(event.id + '|' + item.id) === wanted) }))
    .filter(item => item.events.length > 0);
  return { training: part(true), test: part(false) };
}

export interface ValidationRow {
  id: string;
  feature: Feature;
  /** How it stood in the training part: the events with it, those there were, how many would have it by chance, and p. */
  training: { observed: number; total: number; expected: number; lift: number | null; p: number };
  /** How it stands in the test part, tested exactly. */
  test: FeatureTest;
  /** The test p corrected for the number of features carried over (the smaller of one and p times that number). */
  adjustedP: number;
  /** It held: more often than chance in the test part, and still at the level asked for after the correction. */
  holds: boolean;
}

export interface ValidationResult {
  trainingCharts: number;
  trainingEvents: number;
  testCharts: number;
  testEvents: number;
  /** The features carried over from the training part to the test part. */
  rows: ValidationRow[];
  /** How many of them held. */
  held: number;
  /** How many would be expected to pass an uncorrected p of 0.05 by chance alone (the number carried over times 0.05). */
  expectedByChance: number;
}

/** At this level, after the correction, a feature has held in the test part. */
export const HOLDS_AT = 0.05;

/**
 * Finds the best features (`top` of them, more often than chance, the smallest p first) in the training part of a split, and tests each on the test part. Null when a part
 * is empty: there are too few charts or events to split.
 */
export function validateStudy(charts: readonly StudyChart[], options: StudyOptions, config: { by: SplitBy; share: number; seed: number; top: number }): ValidationResult | null {
  const { training, test } = splitStudy(charts, config.by, config.share, config.seed);
  if (training.length === 0 || test.length === 0) return null;
  const found = runStudy(training, options);
  const carried = found.results.filter(result => result.lift !== null && result.lift > 1).slice(0, Math.max(1, config.top));
  // The test part needs no permutation test of its own: each carried feature is tested exactly.
  const tested = runStudy(test, { ...options, permutations: 0 });
  const rows = carried.map((result): ValidationRow => {
    const outcome = testFeature(tested.data, result.id);
    const adjustedP = Math.min(1, outcome.p * carried.length);
    return {
      id: result.id,
      feature: parseFeatureId(result.id),
      training: { observed: result.observed, total: found.events, expected: result.expected, lift: result.lift, p: result.p },
      test: outcome,
      adjustedP,
      holds: outcome.observed > 0 && outcome.lift !== null && outcome.lift > 1 && adjustedP <= HOLDS_AT,
    };
  });
  return {
    trainingCharts: found.charts,
    trainingEvents: found.events,
    testCharts: tested.charts,
    testEvents: tested.events,
    rows,
    held: rows.filter(row => row.holds).length,
    expectedByChance: rows.length * 0.05,
  };
}
