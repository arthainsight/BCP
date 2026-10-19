import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { adjustedQValues, runStudy, type StudyChart } from './eventStudy';
import { featureId, featuresOf, parseFeatureId } from './progressionFeatures';
import { hashText, seededRandom } from './random';
import { progressionsAt } from '@/lib/bnn/eventProgressions';
import { PARAYA_BODIES } from '@/lib/bnn/nadiParaya';
import { JULIAN_YEAR_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
const natal = (ascendantSign: number, jupiterSign: number): ChartData => ({
  ascendant: { sign: ascendantSign, degree: 2, longitude: (ascendantSign - 1) * 30 + 2 },
  planets: [planet('Jupiter', jupiterSign, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData);
const birth = Date.UTC(1980, 0, 1);
const untilTime = Date.UTC(2020, 0, 1);

// --- The random number generator is the same for the same seed, and spread over [0, 1) -----------------------------------------------------
{
  const a = seededRandom(7);
  const b = seededRandom(7);
  const values = Array.from({ length: 1000 }, () => a());
  assert.deepEqual(values.slice(0, 5), Array.from({ length: 5 }, () => b()));
  assert.ok(values.every(value => value >= 0 && value < 1));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(Math.abs(mean - 0.5) < 0.05, 'the mean of a thousand is near a half');
  assert.notEqual(seededRandom(8)(), seededRandom(7)());
  assert.equal(hashText('abc'), hashText('abc'));
  assert.notEqual(hashText('abc'), hashText('abd'));
}

// --- The false discovery rate: Benjamini–Hochberg on a hand-worked set ---------------------------------------------------------------------
// p = 0.01, 0.04, 0.03, 0.2 (four tests): sorted 0.01, 0.03, 0.04, 0.2 → p·4/rank = 0.04, 0.06, 0.0533…, 0.2 → monotone from the end: 0.04, 0.0533, 0.0533, 0.2.
{
  const q = adjustedQValues([0.01, 0.04, 0.03, 0.2]);
  assert.ok(Math.abs(q[0] - 0.04) < 1e-12);
  assert.ok(Math.abs(q[1] - 0.16 / 3) < 1e-12 && Math.abs(q[2] - 0.16 / 3) < 1e-12);
  assert.ok(Math.abs(q[3] - 0.2) < 1e-12);
  assert.deepEqual(adjustedQValues([]), []);
  assert.deepEqual(adjustedQValues([0.5]), [0.5]);
}

// --- The features of the progressions at a moment -------------------------------------------------------------------------------------------
{
  // At birth: Jupiter in Aries (house 1 for an Aries ascendant), over the Sun (1) and the ascendant, and the 5th sign from the Moon in Sagittarius.
  const rows = progressionsAt({ chart: natal(1, 1), birthTime: birth, time: birth, bodies: PARAYA_BODIES })!;
  const all = featuresOf(rows, ['house', 'aspectHouse', 'aspectNatal', 'exact'], 1);
  assert.ok(all.includes(featureId('house', 'Jupiter', 1)));
  assert.ok(all.includes(featureId('house', 'Saturn', 6)));
  // Jupiter in Aries aspects the houses of Aries, Leo, Libra and Sagittarius: 1, 5, 7 and 9.
  assert.deepEqual(all.filter(id => id.startsWith('aspectHouse|Jupiter|')).map(id => parseFeatureId(id).target), ['1', '5', '7', '9']);
  assert.ok(all.includes(featureId('aspectNatal', 'Jupiter', 'Sun')) && all.includes(featureId('aspectNatal', 'Jupiter', 'Moon')));
  assert.ok(all.includes(featureId('exact', 'Jupiter', 'Jupiter')), 'at birth each graha stands on its own natal degree');
  assert.ok(!all.includes(featureId('exact', 'Jupiter', 'Moon')), 'the Moon is 27°, Jupiter 5°');
  // Only the families asked for.
  assert.ok(featuresOf(rows, ['house'], 1).every(id => id.startsWith('house|')));
  assert.deepEqual(featuresOf(rows, [], 1), []);
  // The houses count from the ascendant: with a Taurus ascendant Aries is the 12th.
  const taurus = featuresOf(progressionsAt({ chart: natal(2, 1), birthTime: birth, time: birth, bodies: ['Jupiter'] })!, ['house', 'aspectHouse'], 2);
  assert.ok(taurus.includes(featureId('house', 'Jupiter', 12)));
  assert.deepEqual(taurus.filter(id => id.startsWith('aspectHouse|')).map(id => parseFeatureId(id).target), ['4', '6', '8', '12'], 'the houses of Aries, Leo, Libra, Sagittarius from Taurus');
  assert.deepEqual(parseFeatureId(featureId('exact', 'Rahu', 'Asc')), { family: 'exact', body: 'Rahu', target: 'Asc' });
}

// --- A study in which every event is made to fall in one situation finds it, and nothing else of the kind ------------------------------------
// Jupiter walks a sign a year from natal Aries: it stands in house 4 (Cancer) when the age (mod 12) is between 3 and 4. The events are put there.
const charts = (eventTimes: (index: number) => number[]): StudyChart[] => [1, 4, 7].map((ascendant, index) => ({
  id: `chart-${index}`,
  name: `Chart ${index}`,
  chart: natal(ascendant, 1),
  birthTime: birth,
  events: eventTimes(index).map((time, i) => ({ id: `e${index}-${i}`, name: 'Moved', time, category: 'home', tags: [] })),
}));
// In chart i with Jupiter in Aries and ascendant a, house H holds Aries when (a - 1 + H - 1) % 12 === 0, so house 1 for Aries, 9 for Taurus-less ... the
// houses differ per chart; the situation to give every event is therefore Jupiter in the sign Cancer, and the feature to find is in its own chart's house.
const jupiterInCancer = (years: number) => birth + (3.5 + 12 * years) * JULIAN_YEAR_MS; // age 3½, 15½, 27½: a year each in Cancer
{
  const study = runStudy(charts(() => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)]), { bodies: ['Jupiter'], families: ['house'], untilTime, permutations: 1000 });
  assert.equal(study.charts, 3);
  assert.equal(study.events, 9);
  assert.equal(study.skipped, 0);
  // Each chart's events have Jupiter in a different house (Cancer is the 4th from Aries, the 1st from Cancer, the 10th from Libra), so no one house is shared by
  // all nine; but within a chart all three events share one, which in a chart of three is 3/9 for each of the three houses.
  const top = study.results.filter(result => result.observed === 3);
  assert.equal(top.length, 3, 'three houses each have three events');
  for (const result of top) assert.ok(result.lift! > 2, `${result.id} is much more common than chance (${result.lift})`);
}

// --- When every event of every chart is in the same sign, the house differs but the aspect to the natal point is the same ------------------------------
{
  // Jupiter in Cancer aspects natal Rahu (20° Cancer, the 1st) in every chart, whatever the ascendant.
  const study = runStudy(charts(() => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)]), { bodies: ['Jupiter'], families: ['aspectNatal'], untilTime, permutations: 1000 });
  const rahu = study.results.find(result => result.id === featureId('aspectNatal', 'Jupiter', 'Rahu'))!;
  assert.equal(rahu.observed, 9, 'all nine events');
  assert.ok(rahu.expected < 4, `by chance about a third of the time (${rahu.expected})`);
  assert.ok(rahu.p < 0.01, `a p-value well under one in a hundred (${rahu.p})`);
  assert.ok(rahu.q <= 0.05, `and it holds after the correction (${rahu.q})`);
  assert.equal(rahu.events.length, 9);
}

// --- Events at random moments find nothing: the p-values are not small, and nothing holds after the correction --------------------------------------
{
  const random = seededRandom(123);
  const events = (index: number) => Array.from({ length: 12 }, () => birth + random() * (untilTime - birth) + index);
  const study = runStudy(charts(events), { bodies: PARAYA_BODIES, families: ['house', 'aspectNatal'], untilTime, permutations: 1000 });
  assert.equal(study.events, 36);
  assert.ok(study.results.every(result => result.q > 0.05), 'no feature survives the correction');
  const lifts = study.results.filter(result => result.lift !== null && result.expected > 5).map(result => result.lift!);
  assert.ok(lifts.every(lift => lift > 0.3 && lift < 3), 'features that are common by chance are near chance');
}

// --- The same study twice gives the same answer; another seed another random moments ----------------------------------------------------------------
{
  const events = () => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)];
  const a = runStudy(charts(events), { bodies: ['Jupiter'], families: ['house'], untilTime, permutations: 200, baselineSamples: 100 });
  const b = runStudy(charts(events), { bodies: ['Jupiter'], families: ['house'], untilTime, permutations: 200, baselineSamples: 100 });
  assert.deepEqual(a.results.map(result => [result.id, result.p, result.expected]), b.results.map(result => [result.id, result.p, result.expected]));
}

// --- Events before birth are left out, and a chart without events is not counted ---------------------------------------------------------------------
{
  const list = charts(index => (index === 0 ? [birth - 1000, jupiterInCancer(0)] : []));
  const study = runStudy(list, { bodies: ['Jupiter'], families: ['house'], untilTime, permutations: 50, baselineSamples: 50 });
  assert.equal(study.skipped, 1);
  assert.equal(study.events, 1);
  assert.equal(study.charts, 1);
  assert.deepEqual(runStudy([], { bodies: ['Jupiter'], families: ['house'], untilTime }), { charts: 0, events: 0, skipped: 0, tested: 0, results: [] });
}

console.log('Event study tests passed');
