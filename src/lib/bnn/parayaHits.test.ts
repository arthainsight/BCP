import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { findParayaHits } from './parayaHits';
import { ALL_PARAYA_BODIES, calculateBetaParaya, calculateNadiParaya } from './nadiParaya';
import { RELATION_OFFSET } from '@/lib/transitHits';

const YEAR = 365.25 * 24 * 60 * 60 * 1000;
const planet = (name: string, sign: number, degree: number, isRetrograde = false): PlanetData => ({
  name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde,
});

// Natal Jupiter in Aries, Saturn in Virgo, Rahu in Cancer; the Sun at 15° Aries.
const chart = {
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Jupiter', 1, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Sun', 1, 15)],
} as unknown as ChartData;
const birth = Date.UTC(2000, 0, 1);
const window = (years: number) => ({ chart, birthTime: birth, fromTime: birth, toTime: birth + years * YEAR });

// --- Paraya Jupiter walks Aries, Taurus, … one sign a year from its natal sign ------
// It stands at 15° Aries at age 0.5, at 15° Leo (the 5th) at 4.5 and at 15° Sagittarius (the 9th) at 8.5.
const jupiterToSun = findParayaHits({ ...window(10), relations: [1, 5, 9] })
  .filter(hit => hit.body === 'Jupiter' && hit.natal === 'Sun');
assert.deepEqual(jupiterToSun.map(hit => hit.relation), [1, 5, 9]);
assert.deepEqual(jupiterToSun.map(hit => Math.round(hit.ageYears * 100) / 100), [0.5, 4.5, 8.5]);
assert.equal(jupiterToSun[0].time, birth + 0.5 * YEAR);

// --- The 1st, 5th and 9th are chosen separately ---------------------------------------
const first = findParayaHits({ ...window(10), relations: [1] }).filter(hit => hit.body === 'Jupiter' && hit.natal === 'Sun');
assert.deepEqual(first.map(hit => hit.relation), [1]);

// --- A window leaves out hits before and after it ---------------------------------------
const later = findParayaHits({ chart, birthTime: birth, fromTime: birth + 4 * YEAR, toTime: birth + 5 * YEAR, relations: [1, 5, 9] })
  .filter(hit => hit.body === 'Jupiter' && hit.natal === 'Sun');
assert.deepEqual(later.map(hit => hit.relation), [5], 'only the hit at age 4.5');

// --- The round repeats: Jupiter is back at 15° Aries at age 12.5 -------------------------
const second = findParayaHits({ ...window(13), relations: [1] }).filter(hit => hit.body === 'Jupiter' && hit.natal === 'Sun');
assert.deepEqual(second.map(hit => Math.round(hit.ageYears * 10) / 10), [0.5, 12.5]);

// --- Every Paraya graha is covered and the hits come out in time order --------------------
const all = findParayaHits({ ...window(30), relations: [1, 5, 9] });
assert.deepEqual([...new Set(all.map(hit => hit.body))].sort(), ['Jupiter', 'Ketu', 'Rahu', 'Saturn']);
assert.ok(all.every((hit, i) => i === 0 || all[i - 1].time <= hit.time));
assert.ok(all.some(hit => hit.natal === 'Asc'), 'the ascendant counts as a natal point');

// --- Nothing to find without the three slow grahas, or in an empty window ------------------
assert.deepEqual(findParayaHits({ chart: { ...chart, planets: [planet('Sun', 1, 15)] } as ChartData, birthTime: birth, fromTime: birth, toTime: birth + YEAR, relations: [1] }), []);
assert.deepEqual(findParayaHits({ chart, birthTime: birth, fromTime: birth + YEAR, toTime: birth, relations: [1] }), []);

// --- Round trip: at every hit the chart's own Paraya calculation stands on the natal degree ---
// (Retrograde natal Jupiter and Saturn start their walk one sign back, so both cases are covered.)
const optionSets = [
  { saturn: 'alternating', rahu: 'alternating' },
  { saturn: 'even', rahu: 'alternating' },
  { saturn: 'alternating', rahu: 'even' },
  { saturn: 'even', rahu: 'even' },
] as const;
for (const options of optionSets) for (const retro of [false, true]) {
  const natalChart = {
    ascendant: { sign: 1, degree: 2, longitude: 2 },
    planets: [planet('Jupiter', 1, 5, retro), planet('Saturn', 6, 10, retro), planet('Rahu', 4, 20), planet('Sun', 1, 15), planet('Moon', 9, 27.5)],
  } as unknown as ChartData;
  const everything = findParayaHits({ chart: natalChart, birthTime: birth, fromTime: birth, toTime: birth + 40 * YEAR, relations: [1, 5, 9], options });
  assert.ok(everything.length > 40, 'a good number of hits in forty years');
  for (const hit of everything) {
    const point = natalChart.planets.find(p => p.name === hit.natal) ?? { sign: 1, degree: 2 };
    const paraya = calculateNadiParaya({
      ageYears: hit.ageYears,
      natalJupiterSignIndex: 0, natalSaturnSignIndex: 5, natalRahuSignIndex: 3,
      jupiterRetrograde: retro, saturnRetrograde: retro, options,
    });
    const period = { Jupiter: paraya.jupiter, Saturn: paraya.saturn, Rahu: paraya.rahu, Ketu: paraya.ketu }[hit.body as 'Jupiter' | 'Saturn' | 'Rahu' | 'Ketu'];
    const wantedSign = (point.sign - 1 + RELATION_OFFSET[hit.relation] / 30) % 12;
    assert.equal(period.signIndex, wantedSign, `${hit.body} → ${hit.natal} (${hit.relation}) is in the wanted sign (${options.saturn}/${options.rahu})`);
    assert.ok(Math.abs(period.degree - point.degree) < 0.05, `${hit.body} → ${hit.natal} (${hit.relation}) is at the natal degree`);
  }
}

// --- The choice changes the dates: Saturn reaches its second sign at 3 years, or at 2.5 --------------
const saturnToSun = (saturn: 'alternating' | 'even') => findParayaHits({ ...window(5), relations: [1, 5, 9], options: { saturn, rahu: 'alternating' } })
  .filter(hit => hit.body === 'Saturn').map(hit => hit.time);
assert.notDeepEqual(saturnToSun('alternating'), saturnToSun('even'));


// --- The beta grahas (Mars, Mercury, Venus) are counted when they are asked for --------------------------------------------
assert.deepEqual([...new Set(findParayaHits({ ...window(30), relations: [1, 5, 9] }).map(hit => hit.body))].sort(), ['Jupiter', 'Ketu', 'Rahu', 'Saturn'], 'the beta grahas are not counted by default');
const betaChart = {
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Jupiter', 1, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Sun', 1, 15), planet('Mars', 1, 5), planet('Mercury', 3, 10), planet('Venus', 2, 20)],
} as unknown as ChartData;
const betaWindow = (years: number, bodies: readonly (typeof ALL_PARAYA_BODIES)[number][]) => ({ chart: betaChart, birthTime: birth, fromTime: birth, toTime: birth + years * YEAR, bodies });
// Mars starts in Aries and stays two months in a sign: it is at 15° Aries (the Sun) at age 1/12, at 15° Leo (the 5th) at 3/4, at 15° Sagittarius (the 9th)
// at 1 5/12, and again every two years.
const marsToSun = findParayaHits({ ...betaWindow(3, ['Mars']), relations: [1, 5, 9] }).filter(hit => hit.natal === 'Sun');
assert.deepEqual(marsToSun.map(hit => hit.relation), [1, 5, 9, 1, 5]);
assert.deepEqual(marsToSun.map(hit => Math.round(hit.ageYears * 1000) / 1000), [0.083, 0.75, 1.417, 2.083, 2.75]);
// Every hit of Mars, Mercury and Venus: the Paraya calculation puts the graha in the wanted sign at the natal degree, direct or retrograde at birth.
for (const retro of [false, true]) {
  const chartAt = {
    ...betaChart,
    planets: betaChart.planets.map(p => (['Mars', 'Mercury', 'Venus'].includes(p.name) ? { ...p, isRetrograde: retro } : p)),
  } as unknown as ChartData;
  const hits = findParayaHits({ chart: chartAt, birthTime: birth, fromTime: birth, toTime: birth + 6 * YEAR, relations: [1, 5, 9], bodies: ['Mars', 'Mercury', 'Venus'] });
  assert.ok(hits.length > 200, 'Mercury and Venus hit every natal point every year');
  assert.deepEqual([...new Set(hits.map(hit => hit.body))].sort(), ['Mars', 'Mercury', 'Venus']);
  for (const hit of hits) {
    const point = chartAt.planets.find(p => p.name === hit.natal) ?? { sign: 1, degree: 2 };
    const period = calculateBetaParaya({
      ageYears: hit.ageYears,
      natal: { Mars: { signIndex: 0, retrograde: retro }, Mercury: { signIndex: 2, retrograde: retro }, Venus: { signIndex: 1, retrograde: retro } },
    }).find(item => item.body === hit.body)!;
    const wantedSign = (point.sign - 1 + RELATION_OFFSET[hit.relation] / 30) % 12;
    assert.equal(period.signIndex, wantedSign, `${hit.body} → ${hit.natal} (${hit.relation}) is in the wanted sign`);
    assert.ok(Math.abs(period.degree - point.degree) < 0.05, `${hit.body} → ${hit.natal} (${hit.relation}) is at the natal degree`);
  }
}
// A chart without Mars has no Mars hits.
assert.equal(findParayaHits({ ...betaWindow(3, ['Mars']), chart: { ...betaChart, planets: betaChart.planets.filter(p => p.name !== 'Mars') } as ChartData, relations: [1] }).length, 0);

console.log('Paraya hit tests passed');
