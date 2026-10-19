import type { ChartData } from '@/types';
import { progressionsAt } from '@/lib/bnn/eventProgressions';
import type { ParayaBody, ParayaOptions } from '@/lib/bnn/nadiParaya';
import { findParayaHits } from '@/lib/bnn/parayaHits';
import { PROGRESSION_RELATIONS, type LongitudeSeries } from '@/lib/transitHits';
import { grahaDashaTable, type GrahaDashaSystem } from '@/lib/dashaEvents';
import { dashaLordsDuring } from '@/lib/dashaDuring';
import type { VimshottariVariantChoice } from '@/lib/vimshottariVariants';
import { DAY_MS } from '@/lib/time';
import { gocharaTables } from '@/lib/gochara';
import { dashaFeaturesOf, featureId, featuresOf, gocharaFeaturesOf, parseFeatureId, type DashaFamily, type Feature, type FeatureFamily, type FeatureSource } from './features';
import { longitudeAt, transitHitsOf, transitRowsAt } from './transitPositions';
import { hashText, seededRandom } from './random';
import { adjustedQValues, poissonBinomialTail } from './stats';

// Do the progressions at the time of some events have something in common, more often than at other times? For each feature (a graha in a house, aspecting a
// natal point, …) it counts the events that have it and how many would be expected to by chance: the same chart at random moments of its life. Whether the
// excess is more than chance gives is a permutation test: events are moved to random moments of their own chart again and again, and the p-value is how often
// that gives as many as were seen. With many features some will look striking by chance, so a q-value (false discovery rate, Benjamini–Hochberg) goes with it.
// A feature chosen beforehand needs no correction, and its p-value is worked out exactly (`testFeature`), also without any one of the charts.

/** How exactly the day of an event is known: to the day, to the month (the middle of it is used) or to the year (the middle of it is used). */
export type DateAccuracy = 'day' | 'month' | 'year';

/** The window, in days either side, that each accuracy gets when the window follows the accuracy of the date: half a month, half a year. */
export const AUTO_WINDOW_DAYS: Record<DateAccuracy, number> = { day: 0, month: 15, year: 182 };

/** A window in days either side of an event, or 'auto': the window that the accuracy of each event's date gives. */
export type WindowChoice = number | 'auto';

export interface StudyEvent {
  id: string;
  name: string;
  /** The moment of the event, in ms since the epoch. */
  time: number;
  category: string;
  tags: string[];
  /** How exactly the day is known; the day when not given. */
  accuracy?: DateAccuracy;
}

/** The window of an event, in days either side, under a choice of window. */
export const windowOfEvent = (event: Pick<StudyEvent, 'accuracy'>, choice: WindowChoice | undefined): number => (choice === 'auto' ? AUTO_WINDOW_DAYS[event.accuracy ?? 'day'] : Math.max(0, choice ?? 0));

export interface StudyChart {
  id: string;
  name: string;
  chart: ChartData;
  birthTime: number;
  events: StudyEvent[];
}

/** A kind of feature to look at: where it comes from and which family of features. */
export interface FeatureKind {
  source: FeatureSource;
  family: FeatureFamily;
}

export interface StudyOptions {
  /** The grahas whose progressions (and, of the slow four, transits) are looked at. */
  bodies: readonly ParayaBody[];
  /** The kinds of feature to look at. */
  kinds: readonly FeatureKind[];
  paraya?: ParayaOptions;
  /** The sampled longitudes of the slow grahas, the same for every chart (the sky is the same): needed for the transits. */
  transitSeries?: Record<string, LongitudeSeries>;
  /** The daśā system whose lords are looked at (Vimśottarī to begin with), and the variant it starts from. */
  dashaSystem?: GrahaDashaSystem;
  variantChoice?: VimshottariVariantChoice;
  /** The end of the life the random moments are drawn from, usually now. */
  untilTime: number;
  /**
   * Days either side of a moment in which a feature counts as present: 0 for the moment itself. Over a window a house, an aspect or a degree counts if it
   * holds at any time within it, and "exact" is an exact hit (the same degree as a natal point) inside it, which a window of days can hold and a moment
   * cannot.
   */
  windowDays?: WindowChoice;
  /** Random moments for each chart (the chance level); 600 to begin with. */
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

/** One event with the features its moment has. */
export interface EventFeatures {
  chartId: string;
  chartName: string;
  event: StudyEvent;
  /** Feature ids. */
  features: string[];
}

/** What a study keeps, for tests made after it: the features of the events, and how common each is at random moments of each chart. */
export interface StudyData {
  /** The feature ids, in the order the counts below are. */
  names: string[];
  index: ReadonlyMap<string, number>;
  events: { chartId: string; chartName: string; event: StudyEvent; /** The window the event was read over, in days either side. */ windowDays: number; features: Int32Array }[];
  /** For each chart and window ("chart id|days"), at how many of its random moments each feature was present, and how many moments there were. */
  pool: ReadonlyMap<string, { counts: Int32Array; size: number }>;
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
  data: StudyData;
}

const DEFAULT_BASELINE = 600;
const DEFAULT_PERMUTATIONS = 2000;
/** The moments looked at over a window: every window / 6 days, so thirteen. */
const WINDOW_STEPS = 6;

/** The families of one source among the kinds. */
const familiesFrom = (kinds: readonly FeatureKind[], source: FeatureSource) => kinds.filter(kind => kind.source === source).map(kind => kind.family);

/**
 * Finds the features at a moment of one chart, or null before its birth (or where the transits are not sampled). With a window the features of the moments within
 * it are put together, and the exact hits of the whole life (found once, the first time they are needed) that fall inside it. The window is given with each moment
 * (in days either side) and is otherwise that of the options, when it is a number.
 */
export function featureExtractor(item: StudyChart, options: StudyOptions): (time: number, windowDays?: number) => string[] | null {
  const { bodies, kinds, paraya } = options;
  const defaultWindow = typeof options.windowDays === 'number' ? options.windowDays : 0;
  const ascendant = item.chart.ascendant.sign;
  // The hits of the whole life are found for the latest moment asked, and a margin that holds the widest window.
  const latestEvent = Math.max(options.untilTime, ...item.events.map(event => event.time)) + 200 * DAY_MS;
  const slow = bodies.filter(body => options.transitSeries && body in options.transitSeries);

  // The progressions and the transits both give positions: the houses and aspects by sign at moments, and, over a window, the exact hits inside it.
  const positionSources = (['paraya', 'transit'] as const).flatMap(source => {
    const families = familiesFrom(kinds, source);
    if (families.length === 0 || (source === 'transit' && !options.transitSeries)) return [];
    const rowsAt = (time: number) => (source === 'paraya'
      ? progressionsAt({ chart: item.chart, birthTime: item.birthTime, time, options: paraya, bodies })
      : transitRowsAt(item.chart, options.transitSeries!, slow, time));
    let hits: { time: number; id: string }[] | null = null;
    const lifeHits = () => {
      if (!hits) {
        hits = (source === 'paraya'
          ? findParayaHits({ chart: item.chart, birthTime: item.birthTime, fromTime: item.birthTime, toTime: latestEvent, relations: PROGRESSION_RELATIONS, options: paraya, bodies })
            .map(hit => ({ time: hit.time, id: featureId('paraya', 'exact', hit.body, hit.natal) }))
          : transitHitsOf(item.chart, options.transitSeries!, slow).map(hit => ({ time: hit.time, id: featureId('transit', 'exact', hit.body, hit.natal) })));
      }
      return hits;
    };
    return [{ source, families, rowsAt, lifeHits }];
  });

  // The gochara: the transits of the slow grahas read the traditional way, against the tables of the chart (found once).
  const gocharaFamilies = familiesFrom(kinds, 'gochara');
  const tables = gocharaFamilies.length > 0 && options.transitSeries ? gocharaTables(item.chart) : null;
  const gocharaAt = (time: number) => {
    const positions: { body: string; sign: number }[] = [];
    for (const body of slow) {
      const longitude = longitudeAt(options.transitSeries![body], time);
      if (longitude === null) return null;
      positions.push({ body, sign: Math.floor(longitude / 30) + 1 });
    }
    return positions;
  };

  // The daśā: the lords running at a moment, or in a window, from the stretches of the whole life.
  const dashaFamilies = familiesFrom(kinds, 'dasha') as DashaFamily[];
  const dashaTable = dashaFamilies.length > 0
    ? grahaDashaTable(options.dashaSystem ?? 'vimshottari', { birthDate: new Date(item.birthTime), planets: item.chart.planets, ascendant: item.chart.ascendant, variantChoice: options.variantChoice })
    : null;

  return (time: number, windowDays: number = defaultWindow) => {
    if (time < item.birthTime) return null;
    const windowMs = Math.max(0, windowDays) * DAY_MS;
    const found = new Set<string>();
    const moments = windowMs === 0 ? [time] : Array.from({ length: 2 * WINDOW_STEPS + 1 }, (_, i) => time + ((i - WINDOW_STEPS) * windowMs) / WINDOW_STEPS);
    for (const part of positionSources) {
      const sampled = windowMs > 0 ? part.families.filter(family => family !== 'exact') : part.families;
      if (sampled.length > 0) {
        for (const moment of moments) {
          const rows = part.rowsAt(moment);
          // A moment outside the sampled time of the transits cannot be read: neither can an event there.
          if (!rows) { if (part.source === 'transit' && moment === time) return null; continue; }
          for (const id of featuresOf(rows, sampled, ascendant, part.source)) found.add(id);
        }
      }
      if (windowMs > 0 && part.families.includes('exact')) {
        const all = part.lifeHits();
        // The hits are in time order: find the first one inside the window.
        let low = 0;
        let high = all.length;
        while (low < high) {
          const middle = (low + high) >> 1;
          if (all[middle].time < time - windowMs) low = middle + 1; else high = middle;
        }
        for (let i = low; i < all.length && all[i].time <= time + windowMs; i++) found.add(all[i].id);
      }
    }
    if (tables) {
      for (const moment of moments) {
        const positions = gocharaAt(moment);
        if (!positions) { if (moment === time) return null; continue; }
        for (const id of gocharaFeaturesOf(tables, positions, gocharaFamilies)) found.add(id);
      }
    }
    if (dashaTable) {
      const running = dashaLordsDuring(dashaTable, time - windowMs, time + windowMs + 1);
      for (const id of dashaFeaturesOf(running, item.chart, dashaFamilies)) found.add(id);
    }
    return [...found];
  };
}

/** The features of every event of the charts (those before birth are left out), without any comparison with chance: for comparing two sets of events. */
export function eventFeatures(charts: readonly StudyChart[], options: StudyOptions): { events: EventFeatures[]; skipped: number } {
  const events: EventFeatures[] = [];
  let skipped = 0;
  for (const item of charts) {
    const extract = featureExtractor(item, options);
    for (const event of item.events) {
      const features = extract(event.time, windowOfEvent(event, options.windowDays));
      if (features) events.push({ chartId: item.id, chartName: item.name, event, features });
      else skipped++;
    }
  }
  return { events, skipped };
}

/** The study of some charts and their events. */
export function runStudy(charts: readonly StudyChart[], options: StudyOptions): StudyResult {
  const { untilTime } = options;
  const samplesPerChart = options.baselineSamples ?? DEFAULT_BASELINE;
  const permutations = options.permutations ?? DEFAULT_PERMUTATIONS;
  const seed = options.seed ?? 1;
  const index = new Map<string, number>();
  const intern = (ids: readonly string[]) => Int32Array.from(ids.map(id => {
    let at = index.get(id);
    if (at === undefined) { at = index.size; index.set(id, at); }
    return at;
  }));

  // For each chart the features of its events, and of its random moments for each window its events are read over (the window follows the accuracy of the date).
  interface Prepared { chart: StudyChart; events: { event: StudyEvent; window: number; features: Int32Array }[]; pools: Map<number, Int32Array[]> }
  const prepared: Prepared[] = [];
  let skipped = 0;
  for (const item of charts) {
    const extract = featureExtractor(item, options);
    const events: Prepared['events'] = [];
    for (const event of item.events) {
      const window = windowOfEvent(event, options.windowDays);
      const features = extract(event.time, window);
      if (features) events.push({ event, window, features: intern(features) });
      else skipped++;
    }
    if (events.length === 0 || untilTime <= item.birthTime) continue;
    const pools = new Map<number, Int32Array[]>();
    for (const window of new Set(events.map(entry => entry.window))) {
      const random = seededRandom(seed ^ hashText(`${item.id}|${window}`));
      const pool: Int32Array[] = [];
      for (let i = 0; i < samplesPerChart; i++) {
        const features = extract(item.birthTime + random() * (untilTime - item.birthTime), window);
        if (features) pool.push(intern(features));
      }
      if (pool.length > 0) pools.set(window, pool);
    }
    // An event whose window has no random moments to be set against (the transits not sampled) cannot be compared: it is left out like one before birth.
    const usable = events.filter(entry => pools.has(entry.window));
    skipped += events.length - usable.length;
    if (usable.length > 0) prepared.push({ chart: item, events: usable, pools });
  }

  const size = index.size;
  const total = prepared.reduce((sum, item) => sum + item.events.length, 0);
  const observed = new Int32Array(size);
  const expected = new Float64Array(size);
  const eventsWith: { chartId: string; eventId: string }[][] = Array.from({ length: size }, () => []);
  const poolData = new Map<string, { counts: Int32Array; size: number }>();
  for (const item of prepared) {
    // At how many of this chart's random moments each feature is present, for each window: the chance for each of its events of that window.
    for (const [window, pool] of item.pools) {
      const counts = new Int32Array(size);
      for (const features of pool) for (const f of features) counts[f]++;
      poolData.set(`${item.chart.id}|${window}`, { counts, size: pool.length });
    }
    for (const { event, window, features } of item.events) {
      const { counts, size: poolSize } = poolData.get(`${item.chart.id}|${window}`)!;
      for (const f of features) { observed[f]++; eventsWith[f].push({ chartId: item.chart.id, eventId: event.id }); }
      for (let f = 0; f < size; f++) expected[f] += counts[f] / poolSize;
    }
  }

  // Permutations: every event moves to a random moment of its own chart's life.
  const atLeast = new Int32Array(size);
  const random = seededRandom(seed ^ 0x9e3779b9);
  const simulated = new Int32Array(size);
  for (let round = 0; round < permutations; round++) {
    simulated.fill(0);
    for (const item of prepared) {
      for (const entry of item.events) {
        const pool = item.pools.get(entry.window)!;
        for (const f of pool[Math.floor(random() * pool.length)]) simulated[f]++;
      }
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
  const data: StudyData = {
    names,
    index,
    events: prepared.flatMap(item => item.events.map(({ event, window, features }) => ({ chartId: item.chart.id, chartName: item.chart.name, event, windowDays: window, features }))),
    pool: poolData,
  };
  return { charts: prepared.length, events: total, skipped, tested: tested.length, results, data };
}

export interface FeatureTest {
  id: string;
  /** The events in the test, and those with the feature. */
  total: number;
  observed: number;
  /** How many would have it by chance, and observed / expected (null when nothing is expected). */
  expected: number;
  lift: number | null;
  /** The chance of as many events or more with the feature by chance, worked out exactly (one-sided): for a feature chosen before looking, without correction. */
  p: number;
  events: { chartId: string; eventId: string }[];
}

/**
 * One feature on its own, exactly: each event has the chance its own chart gives it (how often the feature is there at that chart's random moments, with
 * a little added to both counts so that a feature never seen at random is not taken for impossible), and p is the chance of as many events with the feature
 * as there are. Charts in `exclude` are left out, for seeing whether a finding rests on one chart.
 */
export function testFeature(data: StudyData, id: string, exclude: ReadonlySet<string> = new Set()): FeatureTest {
  const at = data.index.get(id);
  const chances: number[] = [];
  const events: FeatureTest['events'] = [];
  let observed = 0;
  let expected = 0;
  for (const item of data.events) {
    if (exclude.has(item.chartId)) continue;
    const pool = data.pool.get(`${item.chartId}|${item.windowDays}`);
    const count = at === undefined || !pool ? 0 : pool.counts[at];
    const size = pool?.size ?? 0;
    chances.push((count + 1) / (size + 2));
    expected += size > 0 ? count / size : 0;
    if (at !== undefined && item.features.includes(at)) { observed++; events.push({ chartId: item.chartId, eventId: item.event.id }); }
  }
  return {
    id,
    total: chances.length,
    observed,
    expected,
    lift: expected > 0 ? observed / expected : null,
    p: observed > 0 ? poissonBinomialTail(chances, observed) : 1,
    events,
  };
}

/** The test of a feature again with each chart left out in turn: whether the finding comes from one chart. */
export function leaveOneChartOut(data: StudyData, id: string): { chartId: string; chartName: string; test: FeatureTest }[] {
  const charts = new Map(data.events.map(item => [item.chartId, item.chartName]));
  return [...charts].map(([chartId, chartName]) => ({ chartId, chartName, test: testFeature(data, id, new Set([chartId])) }));
}
