import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import type { StudyChart } from './eventStudy';
import { runControlStudy } from './controlStudy';
import { testFeature } from './eventStudy';
import { featureId } from './features';
import { JULIAN_YEAR_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
const natal = (): ChartData => ({
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Jupiter', 1, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData);
const untilTime = Date.UTC(2040, 0, 1);
const event = (id: string, time: number) => ({ id, name: id, time, category: 'home', tags: [] as string[] });
const options = { bodies: ['Jupiter'] as const, kinds: [{ source: 'paraya' as const, family: 'house' as const }], untilTime };
const house4 = featureId('paraya', 'house', 'Jupiter', 4);

// --- Every chart born at once: the others have what each event has, so the date is nothing unusual ----------------------------------------------------------------
{
  const birth = Date.UTC(1980, 0, 1);
  const charts: StudyChart[] = Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, name: `S${i}`, chart: natal(), birthTime: birth, events: [0, 1, 2, 3].map(n => event(`s${i}${n}`, birth + (3.5 + 12 * n) * JULIAN_YEAR_MS)) }));
  const result = runControlStudy(charts, options);
  assert.equal(result.events, 20);
  assert.equal(result.skipped, 0);
  const feature = result.results.find(item => item.id === house4)!;
  assert.equal(feature.observed, 20);
  assert.ok(Math.abs(feature.expected - 20) < 1e-9 && Math.abs(feature.lift! - 1) < 1e-9, 'the others have it every time too');
  assert.ok(feature.p > 0.3, `nothing unusual about the date (${feature.p})`);
}

// --- Charts born years apart: Jupiter in Cancer at the events of one is seldom where the others are --------------------------------------------------------------
{
  const births = [1980, 1983, 1986, 1989, 1992].map(year => Date.UTC(year, 0, 1));
  const charts: StudyChart[] = births.map((birth, i) => ({ id: `d${i}`, name: `D${i}`, chart: natal(), birthTime: birth, events: [0, 1, 2].map(n => event(`d${i}${n}`, birth + (3.5 + 12 * n) * JULIAN_YEAR_MS)) }));
  const result = runControlStudy(charts, options);
  assert.equal(result.events, 15);
  const feature = result.results.find(item => item.id === house4)!;
  assert.equal(feature.observed, 15);
  assert.ok(feature.lift! > 3, `far more often than the others have it at those dates (×${feature.lift})`);
  assert.ok(feature.p < 1e-4, `p ${feature.p}`);
  assert.ok(feature.q <= 1 && feature.q >= feature.p, 'q corrects p');
  assert.equal(result.tested, result.results.length);
  // The data is the usual kind: the exact test of a single feature, and without a chart, work on it.
  assert.ok(Math.abs(testFeature(result.data, house4).p - feature.p) < 1e-12);
  assert.equal(testFeature(result.data, house4, new Set(['d0'])).total, 12);
}

// --- No other chart, no control ------------------------------------------------------------------------------------------------------------------------------------
{
  const birth = Date.UTC(1980, 0, 1);
  const result = runControlStudy([{ id: 'only', name: 'Only', chart: natal(), birthTime: birth, events: [event('o', birth + 3.5 * JULIAN_YEAR_MS)] }], options);
  assert.deepEqual([result.events, result.skipped, result.tested], [0, 1, 0]);
}

// --- An event before the birth of every other chart has nothing to be compared with --------------------------------------------------------------------------------
{
  const early = Date.UTC(1970, 0, 1);
  const late = Date.UTC(2000, 0, 1);
  const charts: StudyChart[] = [
    { id: 'a', name: 'A', chart: natal(), birthTime: early, events: [event('a1', Date.UTC(1975, 0, 1)), event('a2', Date.UTC(2005, 0, 1))] },
    { id: 'b', name: 'B', chart: natal(), birthTime: late, events: [] },
  ];
  const result = runControlStudy(charts, options);
  assert.equal(result.events, 1, 'only the event after the other chart was born');
  assert.equal(result.skipped, 1);
}

console.log('Control study tests passed');
