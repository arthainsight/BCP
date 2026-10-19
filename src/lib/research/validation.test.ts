import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import type { StudyChart } from './eventStudy';
import { splitStudy, validateStudy } from './validation';
import { featureId } from './features';
import { seededRandom } from './random';
import { JULIAN_YEAR_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
const natal = (ascendantSign: number): ChartData => ({
  ascendant: { sign: ascendantSign, degree: 2, longitude: (ascendantSign - 1) * 30 + 2 },
  planets: [planet('Jupiter', 1, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData);
const birth = Date.UTC(1980, 0, 1);
const untilTime = Date.UTC(2030, 0, 1);
const para = (...families: ('house' | 'aspectHouse' | 'aspectNatal' | 'exact')[]) => families.map(family => ({ source: 'paraya' as const, family }));
const event = (id: string, time: number) => ({ id, name: id, time, category: 'home', tags: [] as string[] });
/** Jupiter walks a sign a year from natal Aries: it stands in Cancer at age 3½ + 12 n. */
const inCancer = (n: number) => birth + (3.5 + 12 * n) * JULIAN_YEAR_MS;
const chartWith = (index: number, times: number[]): StudyChart => ({ id: `c${index}`, name: `Chart ${index}`, chart: natal(1 + (index % 12)), birthTime: birth, events: times.map((time, i) => event(`e${index}-${i}`, time)) });

// --- The split by charts: each chart goes to one part, the same every time, none lost ---------------------------------------------------------------------------
{
  const charts = Array.from({ length: 6 }, (_, i) => chartWith(i, [inCancer(0)]));
  const split = splitStudy(charts, 'charts', 0.5, 1);
  assert.equal(split.training.length, 3);
  assert.equal(split.test.length, 3);
  assert.deepEqual([...split.training, ...split.test].map(item => item.id).sort(), charts.map(item => item.id));
  assert.deepEqual(splitStudy(charts, 'charts', 0.5, 1).training.map(item => item.id), split.training.map(item => item.id), 'the same seed, the same split');
  assert.notDeepEqual(splitStudy(charts, 'charts', 0.5, 2).training.map(item => item.id), split.training.map(item => item.id), 'another seed another split');
  // Each part has at least one, whatever the share.
  assert.equal(splitStudy(charts, 'charts', 0.99, 1).test.length, 1);
  assert.equal(splitStudy(charts, 'charts', 0.01, 1).training.length, 1);
  assert.equal(splitStudy([charts[0]], 'charts', 0.5, 1).test.length, 0, 'one chart cannot be split');
}

// --- The split by events: each chart keeps some of its events on both sides, and every event goes to one -------------------------------------------------------
{
  const charts = [chartWith(0, [1, 2, 3, 4, 5, 6].map(n => inCancer(n))), chartWith(1, [1, 2, 3, 4].map(n => inCancer(n)))];
  const split = splitStudy(charts, 'events', 0.5, 3);
  const ids = (list: StudyChart[]) => list.flatMap(item => item.events.map(e => e.id));
  assert.equal(ids(split.training).length, 5);
  assert.equal(ids(split.test).length, 5);
  assert.deepEqual([...ids(split.training), ...ids(split.test)].sort(), ids(charts).sort(), 'every event goes to exactly one part');
  assert.ok(split.training.every(item => item.chart === charts.find(c => c.id === item.id)!.chart), 'the charts are the same');
  // One event cannot be split.
  assert.equal(splitStudy([chartWith(0, [inCancer(0)])], 'events', 0.5, 1).test.length, 0);
}

// --- A real pattern found in one part holds in the other ------------------------------------------------------------------------------------------------------
// Every event of every chart is at a moment when Jupiter is in Cancer, which is over natal Rahu (20° Cancer) in every chart.
{
  const charts = Array.from({ length: 8 }, (_, i) => chartWith(i, [0, 1, 2, 3].map(n => inCancer(n))));
  const options = { bodies: ['Jupiter'] as const, kinds: para('aspectNatal'), untilTime, permutations: 300, baselineSamples: 200 };
  for (const by of ['charts', 'events'] as const) {
    const result = validateStudy(charts, options, { by, share: 0.5, seed: 1, top: 5 })!;
    assert.ok(result, by);
    assert.ok(result.trainingEvents >= 14 && result.testEvents >= 14, `${by}: both parts have events`);
    const rahu = result.rows.find(row => row.id === featureId('paraya', 'aspectNatal', 'Jupiter', 'Rahu'))!;
    assert.ok(rahu, `${by}: found in the training part`);
    assert.ok(rahu.test.observed === rahu.test.total && rahu.test.total > 0, `${by}: every event of the test part has it`);
    assert.ok(rahu.holds && rahu.adjustedP <= 0.05, `${by}: and it holds (${rahu.adjustedP})`);
    assert.ok(result.held >= 1 && result.held <= result.rows.length);
    assert.equal(result.expectedByChance, result.rows.length * 0.05);
  }
}

// --- Events at random moments: what looks best in one part does not hold in the other ------------------------------------------------------------------------
{
  const random = seededRandom(77);
  const charts = Array.from({ length: 8 }, (_, i) => chartWith(i, Array.from({ length: 6 }, () => birth + random() * (untilTime - birth))));
  const options = { bodies: ['Jupiter', 'Saturn', 'Rahu', 'Ketu'] as const, kinds: para('house', 'aspectNatal'), untilTime, permutations: 300, baselineSamples: 200 };
  for (const by of ['charts', 'events'] as const) {
    const result = validateStudy(charts, options, { by, share: 0.5, seed: 4, top: 10 })!;
    assert.equal(result.rows.length, 10);
    assert.ok(result.held <= 1, `${by}: at most a chance finding holds, not several (${result.held})`);
    assert.ok(result.rows.every(row => row.training.lift! > 1), 'carried over only what was more than chance in the training part');
    // The training part's best come first.
    assert.ok(result.rows.every((row, i) => i === 0 || row.training.p >= result.rows[i - 1].training.p));
  }
}

// --- Too little to split ---------------------------------------------------------------------------------------------------------------------------------------
assert.equal(validateStudy([chartWith(0, [inCancer(0)])], { bodies: ['Jupiter'], kinds: para('house'), untilTime }, { by: 'charts', share: 0.5, seed: 1, top: 5 }), null);
assert.equal(validateStudy([], { bodies: ['Jupiter'], kinds: para('house'), untilTime }, { by: 'events', share: 0.5, seed: 1, top: 5 }), null);

console.log('Validation tests passed');
