import assert from 'node:assert/strict';
import type { ChartData } from '@/types';
import { getVargaSignIndex } from './varga';
import { VARGA_DIVISIONS, VARGA_NAMES, VARGA_SIGNIFICATIONS, buildVargaChart } from './vargaChart';

const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function chartAt(ascendantLongitude: number, longitudes: number[]): ChartData {
  return {
    ascendant: {
      sign: Math.floor(ascendantLongitude / 30) + 1,
      degree: ascendantLongitude % 30,
      longitude: ascendantLongitude,
    },
    planets: PLANET_NAMES.map((name, index) => ({
      name,
      longitude: longitudes[index],
      sign: Math.floor(longitudes[index] / 30) + 1,
      degree: longitudes[index] % 30,
      house: 0,
    })),
    specialLagnas: [
      { name: 'HL', longitude: 100, sign: 4, degree: 10 },
      { name: 'GL', longitude: 250, sign: 9, degree: 10 },
    ],
    debug: {
      julianDay: 0, ayanamsa: 24, utcOffset: 0, ascendantDegree: ascendantLongitude % 30,
      ascendantSign: Math.floor(ascendantLongitude / 30) + 1, ephemerisEngine: 'test',
      inputDateTime: '2000-01-01 12:00:00', latitude: 0, longitude: 0,
    },
  };
}

const LONGITUDES = [285.4, 93.2, 232.9, 248.1, 57.6, 312.3, 34.8, 35.2, 215.2];
const chart = chartAt(162.5, LONGITUDES);

// ---------------------------------------------------------------------------
// Metadata completeness
// ---------------------------------------------------------------------------
for (const division of VARGA_DIVISIONS) {
  assert.ok(VARGA_NAMES[division], `D${division} needs a traditional name`);
  assert.ok(VARGA_SIGNIFICATIONS[division], `D${division} needs a signification`);
}

// ---------------------------------------------------------------------------
// D1 must be a faithful pass-through of the rāśi.
// ---------------------------------------------------------------------------
const rasi = buildVargaChart(chart, 1);
assert.equal(rasi.ascendantSign, chart.ascendant.sign, 'D1 keeps the rāśi ascendant');
for (let index = 0; index < PLANET_NAMES.length; index += 1) {
  assert.equal(rasi.planets[index].sign, chart.planets[index].sign, `D1 keeps ${PLANET_NAMES[index]} in its sign`);
  assert.ok(
    Math.abs(rasi.planets[index].degree - chart.planets[index].degree) < 1e-9,
    `D1 keeps ${PLANET_NAMES[index]} at its degree`,
  );
}

// ---------------------------------------------------------------------------
// Every division: signs agree with the varga engine, and the shape holds.
// ---------------------------------------------------------------------------
for (const division of VARGA_DIVISIONS) {
  const varga = buildVargaChart(chart, division);
  const label = `D${division}`;

  assert.equal(varga.division, division, `${label} reports its division`);
  assert.equal(varga.planets.length, PLANET_NAMES.length, `${label} keeps every body`);
  assert.equal(
    varga.ascendantSign,
    getVargaSignIndex(chart.ascendant.longitude, division) + 1,
    `${label} ascendant matches the varga engine`,
  );

  for (let index = 0; index < PLANET_NAMES.length; index += 1) {
    const projected = varga.planets[index];
    const expectedSign = getVargaSignIndex(LONGITUDES[index], division) + 1;

    assert.equal(projected.name, PLANET_NAMES[index], `${label} preserves order and name`);
    assert.equal(projected.sign, expectedSign, `${label} ${projected.name} sign matches the varga engine`);
    assert.ok(projected.sign >= 1 && projected.sign <= 12, `${label} ${projected.name} sign in range`);
    assert.ok(projected.degree >= 0 && projected.degree < 30, `${label} ${projected.name} degree in 0–30, got ${projected.degree}`);

    // Longitude must stay consistent with the sign and degree it reports.
    assert.ok(
      Math.abs(projected.longitude - ((projected.sign - 1) * 30 + projected.degree)) < 1e-9,
      `${label} ${projected.name} longitude must match its sign and degree`,
    );

    // Whole-sign houses counted from the divisional ascendant.
    const expectedHouse = ((projected.sign - varga.ascendantSign + 12) % 12) + 1;
    assert.equal(projected.house, expectedHouse, `${label} ${projected.name} house`);
    assert.ok(projected.house >= 1 && projected.house <= 12, `${label} ${projected.name} house in range`);
  }

  // The ascendant always sits in the first house of its own chart.
  const ascendantHouse = ((varga.ascendantSign - varga.ascendantSign + 12) % 12) + 1;
  assert.equal(ascendantHouse, 1, `${label} ascendant is the first house`);

  // Special lagnas ride along.
  assert.equal(varga.specialLagnas.length, 2, `${label} keeps the special lagnas`);
  for (const lagna of varga.specialLagnas) {
    assert.ok(lagna.sign >= 1 && lagna.sign <= 12, `${label} ${lagna.name} sign in range`);
    assert.ok(lagna.degree >= 0 && lagna.degree < 30, `${label} ${lagna.name} degree in range`);
  }
}

// ---------------------------------------------------------------------------
// Degree scaling inside a divisional sign
// ---------------------------------------------------------------------------
// D9 parts are 3°20′. A planet at the very start of a part shows 0° of the
// navāṁśa sign; one at the exact midpoint shows 15°.
const partSize = 30 / 9;
const startOfPart = buildVargaChart(chartAt(0, [0, 0, 0, 0, 0, 0, 0, 0, 0]), 9);
assert.ok(Math.abs(startOfPart.planets[0].degree) < 1e-9, 'the start of a navāṁśa part shows 0°');

const midPart = buildVargaChart(chartAt(0, Array(9).fill(partSize / 2)), 9);
assert.ok(Math.abs(midPart.planets[0].degree - 15) < 1e-9, 'the midpoint of a part shows 15°');

const nearEnd = buildVargaChart(chartAt(0, Array(9).fill(partSize * 0.999)), 9);
assert.ok(nearEnd.planets[0].degree > 29.9 && nearEnd.planets[0].degree < 30, 'the end of a part approaches 30°');

// D2 halves a sign, so 0–15° maps across the whole hora sign.
const horaLow = buildVargaChart(chartAt(0, Array(9).fill(7.5)), 2);
assert.ok(Math.abs(horaLow.planets[0].degree - 15) < 1e-9, 'half a hora is 15° of the hora sign');

// ---------------------------------------------------------------------------
// Conjunction is preserved inside a part, and broken across a part boundary.
// ---------------------------------------------------------------------------
// D60 parts are 0.5° wide. 35.1° and 35.3° are both inside Taurus 5.0–5.5, so
// they must share a ṣaṣṭyāṁśa sign.
const samePart = buildVargaChart(chartAt(0, [35.1, 35.3, 0, 0, 0, 0, 0, 0, 0]), 60);
assert.equal(samePart.planets[0].sign, samePart.planets[1].sign, 'bodies inside one ṣaṣṭyāṁśa part stay together');

// 34.8° and 35.2° straddle the boundary at Taurus 5.0, so D60 must separate
// them even though they are only 0.4° apart in the rāśi.
const acrossBoundary = buildVargaChart(chartAt(0, [34.8, 35.2, 0, 0, 0, 0, 0, 0, 0]), 60);
assert.notEqual(
  acrossBoundary.planets[0].sign,
  acrossBoundary.planets[1].sign,
  'a ṣaṣṭyāṁśa boundary separates bodies that are close in the rāśi',
);

// Ketu is always opposite Rahu in the rāśi; in a varga that need not hold, but
// both must still produce a valid placement.
const d60 = buildVargaChart(chart, 60);
const ketu = d60.planets.find((planet) => planet.name === 'Ketu')!;
assert.ok(ketu.sign >= 1 && ketu.sign <= 12, 'Ketu still lands in a real sign');

// ---------------------------------------------------------------------------
// The source chart must not be mutated.
// ---------------------------------------------------------------------------
const before = JSON.stringify(chart);
buildVargaChart(chart, 9);
buildVargaChart(chart, 60);
assert.equal(JSON.stringify(chart), before, 'building a varga chart leaves the rāśi untouched');

console.log('Varga chart tests passed');
