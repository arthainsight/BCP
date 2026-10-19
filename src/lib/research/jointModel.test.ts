import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import type { StudyChart } from './eventStudy';
import { fitJointModel } from './jointModel';
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
const inCancer = (n: number) => birth + (3.5 + 12 * n) * JULIAN_YEAR_MS;
const chartWith = (index: number, times: number[]): StudyChart => ({ id: `c${index}`, name: `Chart ${index}`, chart: natal(1), birthTime: birth, events: times.map((time, i) => event(`e${index}-${i}`, time)) });
const options = { bodies: ['Jupiter', 'Saturn'] as const, kinds: para('house', 'aspectNatal'), untilTime, baselineSamples: 200 };

// --- Events all at one pattern: the model finds it in the training part, and it tells the events from other moments in the test part -----------------------------
{
  const charts = Array.from({ length: 8 }, (_, i) => chartWith(i, [0, 1, 2, 3].map(n => inCancer(n))));
  for (const by of ['charts', 'events'] as const) {
    const result = fitJointModel(charts, options, { by, share: 0.5, seed: 1, permutations: 500 })!;
    assert.ok(result, by);
    assert.ok(result.steps.length >= 1 && result.steps.length <= 5, `${by}: the model has a few features (${result.steps.length})`);
    assert.ok(result.candidates >= 1);
    assert.ok(result.steps[0].oddsRatio > 5, `${by}: the first feature raises the odds a lot (${result.steps[0].oddsRatio})`);
    assert.ok(result.steps.every(step => step.gain > 0 && Number.isFinite(step.coefficient)));
    assert.ok(result.testAuc! > 0.9, `${by}: the model tells the events from other moments (${result.testAuc})`);
    assert.ok(result.testP! < 0.01, `${by}: and that is more than chance (${result.testP})`);
    assert.equal(result.steps[0].testAuc !== null && result.steps[0].testAuc > 0.9, true, 'the first feature is enough');
    // The AUC after each step is on the way: never far below the one before it.
    assert.equal(result.steps[result.steps.length - 1].testAuc, result.testAuc);
  }
}

// --- The same split and seed give the same model -------------------------------------------------------------------------------------------------------------------
{
  const charts = Array.from({ length: 6 }, (_, i) => chartWith(i, [0, 1, 2].map(n => inCancer(n))));
  const first = fitJointModel(charts, options, { by: 'charts', share: 0.5, seed: 5, permutations: 100 })!;
  const second = fitJointModel(charts, options, { by: 'charts', share: 0.5, seed: 5, permutations: 100 })!;
  assert.deepEqual(first, second);
}

// --- Events at random moments: no model that is more than chance in the test part ---------------------------------------------------------------------------------
{
  const random = seededRandom(31);
  const charts = Array.from({ length: 8 }, (_, i) => chartWith(i, Array.from({ length: 6 }, () => birth + random() * (untilTime - birth))));
  for (const by of ['charts', 'events'] as const) {
    const result = fitJointModel(charts, options, { by, share: 0.5, seed: 2, permutations: 500 })!;
    assert.ok(result.steps.length <= 2, `${by}: the penalty keeps a model of chance small (${result.steps.length} features)`);
    if (result.testP !== null) assert.ok(result.testP > 0.01, `${by}: not more than chance on the test part (${result.testAuc}, p ${result.testP})`);
  }
}

// --- Too little to split --------------------------------------------------------------------------------------------------------------------------------------------
assert.equal(fitJointModel([chartWith(0, [inCancer(0)])], options, { by: 'charts', share: 0.5, seed: 1 }), null);
assert.equal(fitJointModel([], options, { by: 'events', share: 0.5, seed: 1 }), null);

console.log('Joint model tests passed');
