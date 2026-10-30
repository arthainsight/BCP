// Iṣṭa and Kaṣṭa Phala (BPHS 28.2–6; ishtaKashta.ts). The expected numbers are B. V. Raman's printed
// examples and values worked out by a separate program from the verses (the rays of 28.2–6, the Sūrya
// Siddhānta's revolutions for the mean positions), not the output of the engine.
import assert from 'node:assert/strict';
import { DEFAULT_BALA_OPTIONS } from './balaOptions';
import {
  buildIshtaKashtaRows,
  ishtaKashtaPhala,
  ishtaKashtaVerdict,
  moonCheshtaBalaVirupa,
  reducedKendra,
  sunCheshtaBalaVirupa,
} from './ishtaKashta';
import { buildShadbalaRows } from './shadbala';
import { REFERENCE_CHART } from './shadbala.fixture';
import { MUMBAI_CASE, SYDNEY_CASE } from './shadbala.fixture2';

const close = (actual: number, expected: number, tolerance: number, message: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);

// ---------------------------------------------------------------------------
// The kendra and the two strengths of the luminaries (28.4), with Raman's examples 61 and 62
// ---------------------------------------------------------------------------
assert.equal(reducedKendra(100), 100);
assert.equal(reducedKendra(290), 70);
assert.equal(reducedKendra(-10), 10);
assert.equal(reducedKendra(180), 180);
// Example 61: the sāyana Sun 200°24′ and three signs is 290°24′, reduced 69°36′, over three 23.2.
close(sunCheshtaBalaVirupa(200 + 24 / 60), 23.2, 0.01, 'Raman example 61, the Sun');
// The Sun's strength is nil when its sāyana longitude is 270° (Capricorn 0°, a kendra of 0) and full at 90°.
close(sunCheshtaBalaVirupa(270), 0, 1e-9, 'sāyana Sun at 270°');
close(sunCheshtaBalaVirupa(90), 60, 1e-9, 'sāyana Sun at 90°');
// Example 62: the Moon at 311°40′ and the Sun at 179°08′, a kendra of 132°32′, over three 44.18.
close(moonCheshtaBalaVirupa(311 + 40 / 60, 179 + 8 / 60), 44.18, 0.01, 'Raman example 62, the Moon');
close(moonCheshtaBalaVirupa(10, 190), 60, 1e-9, 'the full Moon');
close(moonCheshtaBalaVirupa(10, 10), 0, 1e-9, 'the new Moon');

// ---------------------------------------------------------------------------
// The formulas
// ---------------------------------------------------------------------------
// The verse (28.6): the mean, and Kaṣṭa is what is left of sixty.
for (const [uccha, cheshta, ishta] of [[60, 60, 60], [0, 0, 0], [60, 0, 30], [12, 48, 30], [40, 20, 30]]) {
  const phala = ishtaKashtaPhala(uccha, cheshta, 'bphs');
  close(phala.ishta, ishta, 1e-9, `the mean of ${uccha} and ${cheshta}`);
  close(phala.ishta + phala.kashta, 60, 1e-9, `Iṣṭa and Kaṣṭa make sixty (${uccha}, ${cheshta})`);
}
// Raman's printed examples 63 and 64 (the square root of the product), with his Uccha and Cheṣṭā figures, which he rounded (so ±0.06).
{
  const jupiter = ishtaKashtaPhala(56.2, 35.33, 'raman');
  close(jupiter.ishta, 44.56, 0.06, 'Raman, Jupiter Iṣṭa');
  close(jupiter.kashta, 9.73, 0.06, 'Raman, Jupiter Kaṣṭa');
  const moon = ishtaKashtaPhala(32.9, 44.2, 'raman');
  close(moon.ishta, 38.13, 0.06, 'Raman, Moon Iṣṭa');
  close(moon.kashta, 20.66, 0.06, 'Raman, Moon Kaṣṭa');
  const saturn = ishtaKashtaPhala(34.9, 21.06, 'raman');
  close(saturn.ishta, 27.11, 0.06, 'Raman, Saturn Iṣṭa');
  close(saturn.kashta, 31.26, 0.06, 'Raman, Saturn Kaṣṭa');
  // Raman's two do not make sixty: that is the difference from the verse.
  assert.ok(Math.abs(moon.ishta + moon.kashta - 60) > 1);
}
assert.equal(ishtaKashtaVerdict(30, 30), 'equal');
assert.equal(ishtaKashtaVerdict(31, 29), 'ishta');
assert.equal(ishtaKashtaVerdict(10, 50), 'kashta');

// ---------------------------------------------------------------------------
// Three charts, with the Sūrya Siddhānta's mean positions (the program that worked the numbers used them)
// [Uccha, Cheṣṭā, Iṣṭa and Kaṣṭa by the verse, Iṣṭa and Kaṣṭa by Raman], in virūpa
// ---------------------------------------------------------------------------
const EXPECTED: Record<string, number[][]> = {
  refchart: [
    [4.88, 23.65, 14.27, 45.73, 10.74, 44.76], // Sun,
    [49.28, 36.73, 43.01, 16.99, 42.55, 15.79], // Moon,
    [13.65, 7.36, 10.51, 49.49, 10.02, 49.39], // Mars,
    [48.76, 46.84, 47.80, 12.20, 47.79, 12.16], // Mercury,
    [28.92, 58.01, 43.46, 16.54, 40.96, 7.87], // Jupiter,
    [3.96, 10.74, 7.35, 52.65, 6.52, 52.54], // Venus,
    [48.95, 18.33, 33.64, 26.36, 29.96, 21.46], // Saturn
  ],
  mumbai: [
    [28.01, 46.84, 37.42, 22.58, 36.22, 20.52], // Sun,
    [57.84, 22.16, 40.00, 20.00, 35.80, 9.05], // Moon,
    [29.81, 34.67, 32.24, 27.76, 32.15, 27.65], // Mars,
    [40.70, 2.61, 21.66, 38.34, 10.31, 33.28], // Mercury,
    [28.64, 36.37, 32.51, 27.49, 32.28, 27.22], // Jupiter,
    [13.03, 52.03, 32.53, 27.47, 26.03, 19.35], // Venus,
    [23.76, 6.68, 15.22, 44.78, 12.59, 43.96], // Saturn
  ],
  sydney: [
    [48.65, 29.95, 39.30, 20.70, 38.18, 18.46], // Sun,
    [7.51, 48.49, 28.00, 32.00, 19.08, 24.57], // Moon,
    [46.08, 31.01, 38.55, 21.45, 37.80, 20.08], // Mars,
    [3.37, 8.80, 6.08, 53.92, 5.44, 53.85], // Mercury,
    [56.84, 44.93, 50.88, 9.12, 50.53, 6.90], // Jupiter,
    [40.30, 22.61, 31.46, 28.54, 30.19, 27.14], // Venus,
    [12.96, 28.44, 20.70, 39.30, 19.20, 38.53], // Saturn
  ],
};
const CHARTS = { refchart: REFERENCE_CHART, mumbai: MUMBAI_CASE.chart, sydney: SYDNEY_CASE.chart };
for (const [name, chart] of Object.entries(CHARTS)) {
  const rows = buildShadbalaRows(chart, { ...DEFAULT_BALA_OPTIONS, cheshtaMeans: 'surya-siddhanta' });
  const bphs = buildIshtaKashtaRows(chart, rows, 'bphs');
  const raman = buildIshtaKashtaRows(chart, rows, 'raman');
  assert.equal(bphs.length, 7);
  bphs.forEach((row, index) => {
    const [uccha, cheshta, ishta, kashta, ramanIshta, ramanKashta] = EXPECTED[name][index];
    const tag = `${name}, ${row.planet}`;
    close(row.uccha, uccha, 0.02, `${tag}: Uccha`);
    close(row.cheshta ?? NaN, cheshta, 0.02, `${tag}: Cheṣṭā`);
    close(row.ishta ?? NaN, ishta, 0.02, `${tag}: Iṣṭa by the verse`);
    close(row.kashta ?? NaN, kashta, 0.02, `${tag}: Kaṣṭa by the verse`);
    close(raman[index].ishta ?? NaN, ramanIshta, 0.02, `${tag}: Iṣṭa by Raman`);
    close(raman[index].kashta ?? NaN, ramanKashta, 0.02, `${tag}: Kaṣṭa by Raman`);
    assert.equal(row.verdict, ishtaKashtaVerdict(ishta, kashta), `${tag}: which is greater`);
  });
}

// The setting for the luminaries' Cheṣṭā Bala in the total does not change theirs here.
{
  const left = buildShadbalaRows(REFERENCE_CHART, { ...DEFAULT_BALA_OPTIONS, luminaryCheshta: 'left-out' });
  const inTotal = buildShadbalaRows(REFERENCE_CHART);
  assert.deepEqual(buildIshtaKashtaRows(REFERENCE_CHART, left, 'bphs'), buildIshtaKashtaRows(REFERENCE_CHART, inTotal, 'bphs'));
}

// Without the Julian day the five grahas have no Cheṣṭā by the kendra and so no Phala; the luminaries still have.
{
  const chart = { ...REFERENCE_CHART, debug: { ...REFERENCE_CHART.debug, julianDay: undefined } };
  const rows = buildShadbalaRows(chart);
  const phala = buildIshtaKashtaRows(chart, rows, 'bphs');
  assert.notEqual(phala[0].ishta, null);
  assert.notEqual(phala[1].ishta, null);
  for (const row of phala.slice(2)) {
    assert.equal(row.cheshta, null, `${row.planet} has no Cheṣṭā`);
    assert.equal(row.ishta, null);
    assert.equal(row.verdict, null);
  }
  assert.deepEqual(buildIshtaKashtaRows({ planets: [] }, [], 'bphs'), []);
}

console.log('Ishta and Kashta Phala tests passed');
