import type { ChartData } from '@/types';
import { progressionsAt } from '@/lib/bnn/eventProgressions';
import type { ParayaBody, ParayaOptions } from '@/lib/bnn/nadiParaya';
import { featuresOf, parseFeatureId, type Feature, type FeatureFamily } from './progressionFeatures';
import { hashText, seededRandom } from './random';

// Do the progressions at the time of some events have something in common, more often than at other times? For each feature (a graha in a house, aspecting a
// natal point, …) it counts the events that have it and how many would be expected to by chance: the same chart at random moments of its life. Whether the
// excess is more than chance gives is a permutation test: events are moved to random moments of their own chart again and again, and the p-value is how often
// that gives as many as were seen. With many features some will look striking by chance, so a q-value (false discovery rate, Benjamini–Hochberg) goes with it.

export interface StudyEvent {
  id: string;
  name: string;
  /** The moment of the event, in ms since the epoch. */
  time: number;
  category: string;
  tags: string[];
}

export interface StudyChart {
  id: string;
  name: string;
  chart: ChartData;
  birthTime: number;
  events: StudyEvent[];
}

export interface StudyOptions {
  bodies: readonly ParayaBody[];
  families: readonly FeatureFamily[];
  paraya?: ParayaOptions;
  /** The end of the life the random moments are drawn from, usually now. */
  untilTime: number;
  /** Random moments for each chart (the chance level); 400 to begin with. */
  baselineSamples?: number;
  /** How many times the events are moved at random for the p-values; 2000 to begin with. */
  permutations?: number;
  seed?: number;
}

export interface FeatureResult extends Feature {
  id: string;
  /** The events that have the feature. */
  observed: number;
  /** How many would have it by chance. */
  expected: number;
  /** observed / expected; null when nothing is expected. */
  lift: number | null;
  /** The chance of having as many by chance (one-sided, more than chance). */
  p: number;
  /** The p-value corrected for the number of features looked at (false discovery rate). */
  q: number;
  /** The events that have the feature, as chart id and event id. */
  events: { chartId: string; eventId: string }[];
}

export interface StudyResult {
  /** The charts and events that were studied. */
  charts: number;
  events: number;
  /** Events before the birth of their chart, left out. */
  skipped: number;
  /** The features that at least one event has, which the correction counts. */
  tested: number;
  results: FeatureResult[];
}

const DEFAULT_BASELINE = 400;
const DEFAULT_PERMUTATIONS = 2000;

/** Benjamini–Hochberg q-values for p-values in any order. */
export function adjustedQValues(pValues: readonly number[]): number[] {
  const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(pValues.length);
  let next = 1;
  for (let rank = order.length; rank >= 1; rank--) {
    const { p, i } = order[rank - 1];
    next = Math.min(next, (p * order.length) / rank);
    q[i] = next;
  }
  return q;
}

/** The study of some charts and their events. */
export function runStudy(charts: readonly StudyChart[], options: StudyOptions): StudyResult {
  const { bodies, families, paraya, untilTime } = options;
  const samplesPerChart = options.baselineSamples ?? DEFAULT_BASELINE;
  const permutations = options.permutations ?? DEFAULT_PERMUTATIONS;
  const seed = options.seed ?? 1;
  const index = new Map<string, number>();
  const internAll = (ids: string[]) => Int32Array.from(new Set(ids.map(id => {
    let at = index.get(id);
    if (at === undefined) { at = index.size; index.set(id, at); }
    return at;
  })));

  // For each chart the features of its events and of its random moments.
  interface Prepared { chart: StudyChart; events: { event: StudyEvent; features: Int32Array }[]; pool: Int32Array[] }
  const prepared: Prepared[] = [];
  let skipped = 0;
  for (const item of charts) {
    const featuresAt = (time: number) => {
      const rows = progressionsAt({ chart: item.chart, birthTime: item.birthTime, time, options: paraya, bodies });
      return rows ? internAll(featuresOf(rows, families, item.chart.ascendant.sign)) : null;
    };
    const events: Prepared['events'] = [];
    for (const event of item.events) {
      const features = featuresAt(event.time);
      if (features) events.push({ event, features });
      else skipped++;
    }
    if (events.length === 0 || untilTime <= item.birthTime) continue;
    const random = seededRandom(seed ^ hashText(item.id));
    const pool: Int32Array[] = [];
    for (let i = 0; i < samplesPerChart; i++) {
      const features = featuresAt(item.birthTime + random() * (untilTime - item.birthTime));
      if (features) pool.push(features);
    }
    if (pool.length > 0) prepared.push({ chart: item, events, pool });
  }

  const size = index.size;
  const total = prepared.reduce((sum, item) => sum + item.events.length, 0);
  const observed = new Int32Array(size);
  const expected = new Float64Array(size);
  const eventsWith: { chartId: string; eventId: string }[][] = Array.from({ length: size }, () => []);
  for (const item of prepared) {
    // What share of this chart's random moments has each feature, which is the chance for each of its events.
    const share = new Float64Array(size);
    for (const features of item.pool) for (const f of features) share[f] += 1 / item.pool.length;
    for (const { event, features } of item.events) {
      for (const f of features) { observed[f]++; eventsWith[f].push({ chartId: item.chart.id, eventId: event.id }); }
      for (let f = 0; f < size; f++) expected[f] += share[f];
    }
  }

  // Permutations: every event moves to a random moment of its own chart's life.
  const atLeast = new Int32Array(size);
  const random = seededRandom(seed ^ 0x9e3779b9);
  const simulated = new Int32Array(size);
  for (let round = 0; round < permutations; round++) {
    simulated.fill(0);
    for (const item of prepared) {
      for (let i = 0; i < item.events.length; i++) for (const f of item.pool[Math.floor(random() * item.pool.length)]) simulated[f]++;
    }
    for (let f = 0; f < size; f++) if (observed[f] > 0 && simulated[f] >= observed[f]) atLeast[f]++;
  }

  const names = [...index.keys()];
  const tested = names.map((id, f) => ({ id, f })).filter(({ f }) => observed[f] > 0);
  const p = tested.map(({ f }) => (atLeast[f] + 1) / (permutations + 1));
  const q = adjustedQValues(p);
  const results: FeatureResult[] = tested.map(({ id, f }, i) => ({
    ...parseFeatureId(id),
    id,
    observed: observed[f],
    expected: expected[f],
    lift: expected[f] > 0 ? observed[f] / expected[f] : null,
    p: p[i],
    q: q[i],
    events: eventsWith[f],
  }));
  results.sort((a, b) => a.p - b.p || b.observed - a.observed || a.id.localeCompare(b.id));
  return { charts: prepared.length, events: total, skipped, tested: tested.length, results };
}
