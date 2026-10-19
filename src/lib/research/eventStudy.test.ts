import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { eventFeatures, featureExtractor, leaveOneChartOut, runStudy, testFeature, type StudyChart } from './eventStudy';
import { adjustedQValues } from './stats';
import { featureId, featuresOf, parseFeatureId, type FeatureFamily } from './features';
import { hashText, seededRandom } from './random';
import { progressionsAt } from '@/lib/bnn/eventProgressions';
import { PARAYA_BODIES } from '@/lib/bnn/nadiParaya';
import { JULIAN_YEAR_MS } from '@/lib/time';
import { runningGrahaDashaLords } from '@/lib/dashaEvents';
import { SIGN_LORDS } from '@/lib/signs';
import { DAY_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
const natal = (ascendantSign: number, jupiterSign: number): ChartData => ({
  ascendant: { sign: ascendantSign, degree: 2, longitude: (ascendantSign - 1) * 30 + 2 },
  planets: [planet('Jupiter', jupiterSign, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData);
/** The kinds of feature of the progressions with these families. */
const para = (...families: FeatureFamily[]) => families.map(family => ({ source: 'paraya' as const, family }));
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
  assert.ok(all.includes(featureId('paraya', 'house', 'Jupiter', 1)));
  assert.ok(all.includes(featureId('paraya', 'house', 'Saturn', 6)));
  // Jupiter in Aries aspects the houses of Aries, Leo, Libra and Sagittarius: 1, 5, 7 and 9.
  assert.deepEqual(all.filter(id => id.startsWith('paraya|aspectHouse|Jupiter|')).map(id => parseFeatureId(id).target), ['1', '5', '7', '9']);
  assert.ok(all.includes(featureId('paraya', 'aspectNatal', 'Jupiter', 'Sun')) && all.includes(featureId('paraya', 'aspectNatal', 'Jupiter', 'Moon')));
  assert.ok(all.includes(featureId('paraya', 'exact', 'Jupiter', 'Jupiter')), 'at birth each graha stands on its own natal degree');
  assert.ok(!all.includes(featureId('paraya', 'exact', 'Jupiter', 'Moon')), 'the Moon is 27°, Jupiter 5°');
  // Only the families asked for.
  assert.ok(featuresOf(rows, ['house'], 1).every(id => id.startsWith('paraya|house|')));
  assert.deepEqual(featuresOf(rows, [], 1), []);
  // The houses count from the ascendant: with a Taurus ascendant Aries is the 12th.
  const taurus = featuresOf(progressionsAt({ chart: natal(2, 1), birthTime: birth, time: birth, bodies: ['Jupiter'] })!, ['house', 'aspectHouse'], 2);
  assert.ok(taurus.includes(featureId('paraya', 'house', 'Jupiter', 12)));
  assert.deepEqual(taurus.filter(id => id.startsWith('paraya|aspectHouse|')).map(id => parseFeatureId(id).target), ['4', '6', '8', '12'], 'the houses of Aries, Leo, Libra, Sagittarius from Taurus');
  assert.deepEqual(parseFeatureId(featureId('paraya', 'exact', 'Rahu', 'Asc')), { source: 'paraya', family: 'exact', body: 'Rahu', target: 'Asc' });
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
  const study = runStudy(charts(() => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)]), { bodies: ['Jupiter'], kinds: para('house'), untilTime, permutations: 1000 });
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
  const study = runStudy(charts(() => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)]), { bodies: ['Jupiter'], kinds: para('aspectNatal'), untilTime, permutations: 1000 });
  const rahu = study.results.find(result => result.id === featureId('paraya', 'aspectNatal', 'Jupiter', 'Rahu'))!;
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
  const study = runStudy(charts(events), { bodies: PARAYA_BODIES, kinds: para('house', 'aspectNatal'), untilTime, permutations: 1000 });
  assert.equal(study.events, 36);
  assert.ok(study.results.every(result => result.q > 0.05), 'no feature survives the correction');
  const lifts = study.results.filter(result => result.lift !== null && result.expected > 5).map(result => result.lift!);
  assert.ok(lifts.every(lift => lift > 0.3 && lift < 3), 'features that are common by chance are near chance');
}

// --- The same study twice gives the same answer; another seed another random moments ----------------------------------------------------------------
{
  const events = () => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)];
  const a = runStudy(charts(events), { bodies: ['Jupiter'], kinds: para('house'), untilTime, permutations: 200, baselineSamples: 100 });
  const b = runStudy(charts(events), { bodies: ['Jupiter'], kinds: para('house'), untilTime, permutations: 200, baselineSamples: 100 });
  assert.deepEqual(a.results.map(result => [result.id, result.p, result.expected]), b.results.map(result => [result.id, result.p, result.expected]));
}

// --- Events before birth are left out, and a chart without events is not counted ---------------------------------------------------------------------
{
  const list = charts(index => (index === 0 ? [birth - 1000, jupiterInCancer(0)] : []));
  const study = runStudy(list, { bodies: ['Jupiter'], kinds: para('house'), untilTime, permutations: 50, baselineSamples: 50 });
  assert.equal(study.skipped, 1);
  assert.equal(study.events, 1);
  assert.equal(study.charts, 1);
  const empty = runStudy([], { bodies: ['Jupiter'], kinds: para('house'), untilTime });
  assert.deepEqual([empty.charts, empty.events, empty.skipped, empty.tested, empty.results], [0, 0, 0, 0, []]);
}

// --- A window: a feature counts if it holds at any time within it -------------------------------------------------------------------------------
{
  const item: StudyChart = { id: 'w', name: 'W', chart: natal(1, 1), birthTime: birth, events: [] };
  const at = (years: number) => birth + years * JULIAN_YEAR_MS;
  const options = (windowDays: number, families: ('house' | 'exact')[]) => ({ bodies: ['Jupiter'] as const, kinds: para(...families), untilTime, windowDays });
  // Jupiter (5° Aries) leaves Aries at age 5/6 (a stay of a year, the first sixth of it gone at birth); a month before that it is in Aries alone.
  const before = at(0.8);
  assert.deepEqual(featureExtractor(item, options(0, ['house']))(before), [featureId('paraya', 'house', 'Jupiter', 1)]);
  assert.deepEqual(featureExtractor(item, options(30, ['house']))(before)!.sort(), [featureId('paraya', 'house', 'Jupiter', 1), featureId('paraya', 'house', 'Jupiter', 2)], 'a window of 30 days reaches Taurus');
  assert.deepEqual(featureExtractor(item, options(5, ['house']))(before), [featureId('paraya', 'house', 'Jupiter', 1)], 'a short window does not');
  // Before birth there is nothing, whatever the window.
  assert.equal(featureExtractor(item, options(30, ['house']))(birth - 1000), null);
  // "Exact" over a window is an exact hit inside it: Jupiter is over the Sun (15° Aries) at age 1/3. At 0.2 it is 4° short: not within a degree, but a window of 60 days holds the hit.
  assert.ok(!featureExtractor(item, options(0, ['exact']))(at(0.2))!.includes(featureId('paraya', 'exact', 'Jupiter', 'Sun')));
  assert.ok(featureExtractor(item, options(60, ['exact']))(at(0.2))!.includes(featureId('paraya', 'exact', 'Jupiter', 'Sun')), 'the hit is within 60 days');
  assert.ok(!featureExtractor(item, options(20, ['exact']))(at(0.2))!.includes(featureId('paraya', 'exact', 'Jupiter', 'Sun')), 'and not within 20');
  // The same hit counts from after it too.
  assert.ok(featureExtractor(item, options(60, ['exact']))(at(0.45))!.includes(featureId('paraya', 'exact', 'Jupiter', 'Sun')));
}

// --- The features of the events alone, and the events before birth ------------------------------------------------------------------------------
{
  const list = charts(index => (index === 0 ? [birth - 1000, jupiterInCancer(0)] : [jupiterInCancer(1)]));
  const { events, skipped } = eventFeatures(list, { bodies: ['Jupiter'], kinds: para('house'), untilTime });
  assert.equal(skipped, 1);
  assert.equal(events.length, 3);
  assert.ok(events.every(item => item.features.length === 1 && item.features[0].startsWith('paraya|house|Jupiter|')));
  assert.deepEqual(events.map(item => item.chartName), ['Chart 0', 'Chart 1', 'Chart 2']);
}

// --- A study over a window finds the same situation, and the exact test of a chosen feature -------------------------------------------------------
{
  const study = runStudy(charts(() => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)]), { bodies: ['Jupiter'], kinds: para('aspectNatal'), untilTime, permutations: 500, windowDays: 30 });
  assert.equal(study.events, 9);
  const id = featureId('paraya', 'aspectNatal', 'Jupiter', 'Rahu');
  const test = testFeature(study.data, id);
  assert.deepEqual([test.total, test.observed], [9, 9]);
  assert.ok(test.p < 0.01 && test.lift! > 1.5, `chosen beforehand, it is far from chance (p ${test.p}, ×${test.lift})`);
  assert.equal(test.events.length, 9);
  // A feature never seen anywhere cannot be more than chance.
  const nothing = testFeature(study.data, 'paraya|aspectNatal|Jupiter|Nobody');
  assert.deepEqual([nothing.total, nothing.observed, nothing.p, nothing.lift], [9, 0, 1, null]);
  // Leaving a chart out leaves six events, still all with the feature and still far from chance; leaving them all out but one leaves three.
  const without = leaveOneChartOut(study.data, id);
  assert.deepEqual(without.map(item => item.chartName), ['Chart 0', 'Chart 1', 'Chart 2']);
  for (const item of without) assert.deepEqual([item.test.total, item.test.observed], [6, 6]);
  assert.ok(without.every(item => item.test.p < 0.05), 'the finding does not rest on one chart');
  assert.ok(testFeature(study.data, id, new Set(['chart-0', 'chart-1'])).total === 3);
  assert.ok(testFeature(study.data, id).p < testFeature(study.data, id, new Set(['chart-0'])).p, 'more events with the feature, a smaller p');
}

// --- A feature that rests on one chart is seen as such ---------------------------------------------------------------------------------------------
{
  // Chart 0 has all of its events in Cancer; the others have them at random moments.
  const random = seededRandom(5);
  const list = charts(index => (index === 0 ? [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2), jupiterInCancer(3), jupiterInCancer(0) + 5 * JULIAN_YEAR_MS * 0.01] : Array.from({ length: 4 }, () => birth + random() * (untilTime - birth))));
  const study = runStudy(list, { bodies: ['Jupiter'], kinds: para('aspectNatal'), untilTime, permutations: 200 });
  const id = featureId('paraya', 'aspectNatal', 'Jupiter', 'Rahu');
  const all = testFeature(study.data, id);
  const withoutFirst = testFeature(study.data, id, new Set(['chart-0']));
  assert.ok(all.p < 0.01, `with the first chart it looks strong (${all.p})`);
  assert.ok(withoutFirst.p > 0.1, `without it, nothing (${withoutFirst.p})`);
}

// --- The transits: the houses and aspects of the sampled grahas, and nothing outside the sampled time ------------------------------------------------------
{
  const from = birth - 30 * DAY_MS;
  const to = untilTime + 30 * DAY_MS;
  const steps = Math.round((to - from) / (3 * DAY_MS)) + 1;
  // Jupiter stands still at 100° (10° Cancer) for the whole time, Saturn at 280° (10° Capricorn).
  const sky = { Jupiter: { start: from, step: 3 * DAY_MS, longitudes: Array(steps).fill(100) }, Saturn: { start: from, step: 3 * DAY_MS, longitudes: Array(steps).fill(280) } };
  const item: StudyChart = { id: 't', name: 'T', chart: natal(1, 1), birthTime: birth, events: [] };
  const base = { bodies: ['Jupiter', 'Saturn'] as ('Jupiter' | 'Saturn')[], untilTime, transitSeries: sky };
  const kinds = (families: ('house' | 'aspectHouse' | 'aspectNatal' | 'exact')[]) => families.map(family => ({ source: 'transit' as const, family }));
  const time = birth + 20 * JULIAN_YEAR_MS;
  const found = featureExtractor(item, { ...base, kinds: kinds(['house', 'aspectNatal']) })(time)!;
  // Cancer is the 4th house from an Aries ascendant; Capricorn the 10th.
  assert.ok(found.includes(featureId('transit', 'house', 'Jupiter', 4)) && found.includes(featureId('transit', 'house', 'Saturn', 10)));
  // Jupiter in Cancer is over natal Rahu (20° Cancer, the 1st sign); Capricorn is the 7th from Cancer.
  assert.ok(found.includes(featureId('transit', 'aspectNatal', 'Jupiter', 'Rahu')));
  assert.ok(found.includes(featureId('transit', 'aspectNatal', 'Saturn', 'Rahu')), 'Capricorn is the 7th sign from Cancer');
  assert.ok(found.every(id => id.startsWith('transit|')), 'no progressions are counted when only the transits are asked for');
  // Both sources at once carry their own tag.
  const both = featureExtractor(item, { ...base, kinds: [...kinds(['house']), ...para('house')] })(time)!;
  assert.ok(both.some(id => id.startsWith('paraya|house|')) && both.some(id => id.startsWith('transit|house|')));
  // Nothing is said about a moment the sky was not sampled for.
  assert.equal(featureExtractor(item, { ...base, kinds: kinds(['house']) })(to + 10 * DAY_MS), null);
  // Without the sampled grahas the transits give nothing, not an error.
  assert.deepEqual(featureExtractor(item, { bodies: ['Jupiter'], kinds: kinds(['house']), untilTime })(time), []);
  // Over a window an exact hit of a moving graha counts: Jupiter goes 5° → 25° of Cancer (longitude 95 → 115) in 600 days, over natal Rahu (20° Cancer) at day 450.
  const moving = { Jupiter: { start: from, step: 3 * DAY_MS, longitudes: Array.from({ length: steps }, (_, i) => 95 + Math.min(20, Math.max(0, (i * 3 - 100) / 30))) } };
  // (Day 100 after `from` it starts moving at 1° per 30 days: 20° at day 700, 20° of Cancer is longitude 110: 95 + 15 → day 550 after `from`.)
  const hitTime = from + 550 * DAY_MS;
  const withHit = featureExtractor(item, { bodies: ['Jupiter'], kinds: kinds(['exact']), untilTime, transitSeries: moving, windowDays: 60 })(hitTime - 40 * DAY_MS)!;
  assert.ok(withHit.includes(featureId('transit', 'exact', 'Jupiter', 'Rahu')), 'the hit is 40 days after the moment, inside a window of 60');
  const noHit = featureExtractor(item, { bodies: ['Jupiter'], kinds: kinds(['exact']), untilTime, transitSeries: moving, windowDays: 30 })(hitTime - 40 * DAY_MS)!;
  assert.ok(!noHit.includes(featureId('transit', 'exact', 'Jupiter', 'Rahu')), 'and outside a window of 30');
}

// --- The daśā: the lords running, what they rule and where they stand --------------------------------------------------------------------------------
{
  const planets = [
    planet('Sun', 4, 28.4), planet('Moon', 4, 3.7), planet('Mars', 3, 10.2), planet('Mercury', 4, 15.1), planet('Jupiter', 7, 6.9),
    planet('Venus', 4, 22.6), planet('Saturn', 4, 8.3), planet('Rahu', 2, 5.4), planet('Ketu', 8, 5.4),
  ];
  const chart = { ascendant: { sign: 6, degree: 12.3, longitude: 162.3 }, planets } as unknown as ChartData;
  const item: StudyChart = { id: 'd', name: 'D', chart, birthTime: new Date(1947, 7, 15, 9, 15).getTime(), events: [] };
  const time = new Date(2026, 9, 19, 12).getTime();
  const running = runningGrahaDashaLords('vimshottari', { eventDate: new Date(time), birthDate: new Date(item.birthTime), planets, ascendant: chart.ascendant })!;
  const kinds = (...families: ('mdGraha' | 'mdRules' | 'mdPlaced' | 'adGraha' | 'adRules' | 'adPlaced')[]) => families.map(family => ({ source: 'dasha' as const, family }));
  const found = featureExtractor(item, { bodies: PARAYA_BODIES, kinds: kinds('mdGraha', 'mdRules', 'mdPlaced', 'adGraha', 'adRules', 'adPlaced'), untilTime })(time)!;
  assert.ok(found.every(id => id.startsWith('dasha|')));
  assert.ok(found.includes(featureId('dasha', 'mdGraha', running.md, '*')) && found.includes(featureId('dasha', 'adGraha', running.ad, '*')));
  // What a lord rules, from the Virgo ascendant (sign 6): house H is sign (6 − 1 + H − 1) % 12.
  const ruled = (lord: string) => Array.from({ length: 12 }, (_, i) => i + 1).filter(house => SIGN_LORDS[(6 - 1 + house - 1) % 12] === lord);
  assert.deepEqual(found.filter(id => id.startsWith('dasha|mdRules|')).map(id => Number(parseFeatureId(id).target)).sort((a, b) => a - b), ruled(running.md));
  assert.deepEqual(found.filter(id => id.startsWith('dasha|adRules|')).map(id => Number(parseFeatureId(id).target)).sort((a, b) => a - b), ruled(running.ad));
  // Where the lord stands in the natal chart, counted from the ascendant.
  const placed = (lord: string) => ((planets.find(p => p.name === lord)!.sign - 6 + 12) % 12) + 1;
  assert.ok(found.includes(featureId('dasha', 'mdPlaced', running.md, placed(running.md))));
  assert.ok(found.includes(featureId('dasha', 'adPlaced', running.ad, placed(running.ad))));
  // Rahu and Ketu rule no house: as lords they give no "rules" features.
  assert.ok(ruled('Rahu').length === 0);
  // Over a year either side more lords are running: more of them are found.
  const window = featureExtractor(item, { bodies: PARAYA_BODIES, kinds: kinds('adGraha'), untilTime, windowDays: 365 })(time)!;
  assert.ok(window.length > found.filter(id => id.startsWith('dasha|adGraha|')).length, 'several antardaśās run in two years');
  assert.ok(window.includes(featureId('dasha', 'adGraha', running.ad, '*')));
  // Before birth there is nothing, and another system is another table.
  assert.equal(featureExtractor(item, { bodies: PARAYA_BODIES, kinds: kinds('mdGraha'), untilTime })(item.birthTime - 1000), null);
  const yogini = featureExtractor(item, { bodies: PARAYA_BODIES, kinds: kinds('mdGraha'), untilTime, dashaSystem: 'yogini' })(time)!;
  assert.equal(yogini.length, 1);
}

// --- A study over all three sources has features of each ---------------------------------------------------------------------------------------------
{
  const from = birth - 30 * DAY_MS;
  const to = untilTime + 30 * DAY_MS;
  const steps = Math.round((to - from) / (3 * DAY_MS)) + 1;
  // Jupiter and Saturn drift round the zodiac at the speed of their real stays (a sign a year, and 2½ years).
  const drift = (perYear: number) => ({ start: from, step: 3 * DAY_MS, longitudes: Array.from({ length: steps }, (_, i) => (((i * 3 * perYear) / 365.25) % 360 + 360) % 360) });
  const study = runStudy(charts(() => [jupiterInCancer(0), jupiterInCancer(1), jupiterInCancer(2)]), {
    bodies: ['Jupiter', 'Saturn'],
    kinds: [{ source: 'paraya', family: 'house' }, { source: 'transit', family: 'house' }, { source: 'dasha', family: 'mdGraha' }],
    untilTime, permutations: 100, baselineSamples: 100, transitSeries: { Jupiter: drift(30), Saturn: drift(12) },
  });
  assert.equal(study.events, 9);
  assert.deepEqual([...new Set(study.results.map(result => result.source))].sort(), ['dasha', 'paraya', 'transit']);
  assert.ok(study.results.filter(result => result.source === 'dasha').every(result => result.family === 'mdGraha' && result.target === '*'));
}

console.log('Event study tests passed');
