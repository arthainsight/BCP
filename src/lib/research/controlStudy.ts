import { featureExtractor, testFeature, type FeatureResult, type StudyChart, type StudyData, type StudyOptions, type StudyResult, windowOfEvent } from './eventStudy';
import { parseFeatureId } from './features';
import { adjustedQValues } from './stats';

// The chance level of the usual study is the same chart at random moments of its life: it asks whether the events fall at unusual moments of that life. A second
// question has another chance level: is it the date that is unusual? For each event the other charts are read at the very same moment (with the same window), and
// the share of them that have a feature then is the chance of the feature for that event. Where a feature is there for everyone at that time (a transit of the
// slow grahas, a long stretch of one daśā lord's period for people of the same age) it is no news; where only the person's own chart has it, it may be. The p-values
// are the exact ones for each event having the chance its own control gives it, as for a feature chosen beforehand, and q corrects for the number of features.

/**
 * The study with the other charts as the chance level: an event is compared with the same moment in each of the other charts (those already born). An event with
 * none to be compared with (the only chart, or before every other birth) is left out.
 */
export function runControlStudy(charts: readonly StudyChart[], options: StudyOptions): StudyResult {
  const extractors = new Map(charts.map(item => [item.id, featureExtractor(item, options)]));
  interface Entry { chart: StudyChart; event: StudyChart['events'][number]; window: number; own: string[]; controls: string[][] }
  const entries: Entry[] = [];
  let skipped = 0;
  for (const item of charts) {
    const own = extractors.get(item.id)!;
    for (const event of item.events) {
      const window = windowOfEvent(event, options.windowDays);
      const features = own(event.time, window);
      if (!features) { skipped++; continue; }
      const controls: string[][] = [];
      for (const other of charts) {
        if (other.id === item.id) continue;
        const found = extractors.get(other.id)!(event.time, window);
        if (found) controls.push(found);
      }
      if (controls.length === 0) { skipped++; continue; }
      entries.push({ chart: item, event, window, own: features, controls });
    }
  }

  const index = new Map<string, number>();
  const intern = (id: string) => {
    let at = index.get(id);
    if (at === undefined) { at = index.size; index.set(id, at); }
    return at;
  };
  const owned = entries.map(entry => Int32Array.from(entry.own.map(intern)));
  const controlled = entries.map(entry => entry.controls.map(ids => ids.map(intern)));
  const size = index.size;
  const pool = new Map<string, { counts: Int32Array; size: number }>();
  const data: StudyData = {
    names: [...index.keys()],
    index,
    events: entries.map((entry, i) => ({ chartId: entry.chart.id, chartName: entry.chart.name, event: entry.event, windowDays: entry.window, features: owned[i], poolKey: `control|${entry.chart.id}|${entry.event.id}` })),
    pool,
    smoothing: 'floor',
  };
  entries.forEach((entry, i) => {
    const counts = new Int32Array(size);
    for (const ids of controlled[i]) for (const f of ids) counts[f]++;
    pool.set(`control|${entry.chart.id}|${entry.event.id}`, { counts, size: controlled[i].length });
  });

  const seen = new Set<number>();
  for (const features of owned) for (const f of features) seen.add(f);
  const tests = [...seen].map(f => testFeature(data, data.names[f]));
  const q = adjustedQValues(tests.map(test => test.p));
  const results: FeatureResult[] = tests.map((test, i) => ({ ...parseFeatureId(test.id), id: test.id, observed: test.observed, expected: test.expected, lift: test.lift, p: test.p, q: q[i], events: test.events }));
  results.sort((a, b) => a.p - b.p || b.observed - a.observed || a.id.localeCompare(b.id));
  return { charts: new Set(entries.map(entry => entry.chart.id)).size, events: entries.length, skipped, tested: results.length, results, data };
}
