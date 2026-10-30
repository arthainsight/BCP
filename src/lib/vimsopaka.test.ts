// Vimśopaka Bala (BPHS 7.10-27; vimsopaka.ts, vargaMatrix.ts). The expected numbers were worked out by a separate
// program from the Sanskrit rules (the weights of 7.17-23, the points of 7.24-25 by the compound relation, the
// sixteen vargas from their definitions in BPHS 6), not by the engine.
import assert from 'node:assert/strict';
import { DEFAULT_BALA_OPTIONS } from './balaOptions';
import { buildVargaMatrix, calculateVimsopaka, VIMSOPAKA_SCHEMES } from './vargaMatrix';
import { VIMSOPAKA_RELATION_VISWA, vimsopakaLevel, vimsopakaViswa } from './vimsopaka';
import { REFERENCE_CHART } from './shadbala.fixture';
import { MUMBAI_CASE, SYDNEY_CASE } from './shadbala.fixture2';
import type { ChartData } from '@/types';

const close = (actual: number, expected: number, tolerance: number, message: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
const SCHEMES = ['shadvarga', 'saptavarga', 'dasavarga', 'shodasavarga'] as const;

// ---------------------------------------------------------------------------
// The weights add up to 20, and are the ones of 7.17-23
// ---------------------------------------------------------------------------
for (const [key, scheme] of Object.entries(VIMSOPAKA_SCHEMES)) {
  close(Object.values(scheme.weights).reduce((sum, weight) => sum + weight, 0), 20, 1e-9, `the weights of ${key}`);
}
assert.deepEqual(VIMSOPAKA_SCHEMES.shadvarga.weights, { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 });
assert.deepEqual(VIMSOPAKA_SCHEMES.saptavarga.weights, { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 });
assert.equal(VIMSOPAKA_SCHEMES.dasavarga.weights.D60, 5);
assert.equal(VIMSOPAKA_SCHEMES.dasavarga.weights.D1, 3);
assert.equal(VIMSOPAKA_SCHEMES.shodasavarga.weights.D60, 4);
assert.equal(VIMSOPAKA_SCHEMES.shodasavarga.weights.D1, 3.5);
assert.equal(VIMSOPAKA_SCHEMES.shodasavarga.weights.D16, 2);

// ---------------------------------------------------------------------------
// The points of a sign (7.24-25)
// ---------------------------------------------------------------------------
assert.deepEqual(VIMSOPAKA_RELATION_VISWA, { adhimitra: 18, mitra: 15, sama: 10, shatru: 7, adhishatru: 5 });
{
  // Aries 0 .. Pisces 11. The Sun in Aries (exalted) and Leo (own): 20. In Libra (debilitated): nothing, or the relation to Venus.
  assert.equal(vimsopakaViswa('Sun', 0, {}), 20);
  assert.equal(vimsopakaViswa('Sun', 4, {}), 20);
  assert.equal(vimsopakaViswa('Sun', 6, { Sun: 6, Venus: 6 }), 0);
  // The Sun and Venus are natural enemies; Venus in the same sign is not a temporary friend: adhishatru, 5.
  assert.equal(vimsopakaViswa('Sun', 6, { Sun: 6, Venus: 6 }, 'relation'), 5);
  // Sun in Taurus (Venus): enemy by nature. Venus in the 2nd from the Sun is a temporary friend: sama, 10.
  assert.equal(vimsopakaViswa('Sun', 1, { Sun: 0, Venus: 1 }), 10);
  // Sun in Cancer (the Moon, a natural friend), the Moon in the 4th from the Sun: adhimitra, 18; in the 1st: mitra turns to sama, 10.
  assert.equal(vimsopakaViswa('Sun', 3, { Sun: 0, Moon: 3 }), 18);
  assert.equal(vimsopakaViswa('Sun', 3, { Sun: 3, Moon: 3 }), 10);
  // Mercury (Moon is its enemy) in Cancer: the Moon in the 2nd place a temporary friend: sama, 10; elsewhere adhishatru, 5.
  assert.equal(vimsopakaViswa('Mercury', 3, { Mercury: 2, Moon: 3 }), 10);
  assert.equal(vimsopakaViswa('Mercury', 3, { Mercury: 2, Moon: 8 }), 5);
  // Mars in Gemini (Mercury, an enemy): Mercury in the 3rd, a temporary friend: sama.
  assert.equal(vimsopakaViswa('Mars', 2, { Mars: 0, Mercury: 2 }), 10);
  // Venus in Gemini: Mercury is a natural friend; the 12th place is a temporary friend: adhimitra.
  assert.equal(vimsopakaViswa('Venus', 2, { Venus: 3, Mercury: 2 }), 18);
  // Jupiter in Taurus: Venus is an enemy; Venus in the 7th place is not a temporary friend: adhishatru.
  assert.equal(vimsopakaViswa('Jupiter', 1, { Jupiter: 0, Venus: 6 }), 5);
}

// ---------------------------------------------------------------------------
// What the total gives (7.26-27)
// ---------------------------------------------------------------------------
assert.equal(vimsopakaLevel(4.99), 'none');
assert.equal(vimsopakaLevel(5), 'little');
assert.equal(vimsopakaLevel(9.99), 'little');
assert.equal(vimsopakaLevel(10), 'middling');
assert.equal(vimsopakaLevel(14.99), 'middling');
assert.equal(vimsopakaLevel(15), 'full');
assert.equal(vimsopakaLevel(20), 'full');

// ---------------------------------------------------------------------------
// Three charts: the four schemes of each graha
// ---------------------------------------------------------------------------
const EXPECTED: Record<string, Record<string, number[]>> = {
  'refchart:default': {
    Sun: [15.8, 16.55, 13.6, 13.65],
    Moon: [8.95, 10.45, 12.75, 10.125],
    Mars: [9.0, 9.625, 10.875, 12.0],
    Mercury: [8.5, 9.125, 12.375, 11.45],
    Jupiter: [10.0, 10.0, 12.5, 11.375],
    Venus: [15.45, 14.15, 15.275, 15.2],
    Saturn: [12.0, 13.25, 14.625, 14.175],
  },
  'mumbai:default': {
    Sun: [16.9, 17.15, 14.225, 14.625],
    Moon: [18.45, 17.95, 13.2, 13.75],
    Mars: [11.85, 10.975, 12.8, 12.625],
    Mercury: [11.45, 11.7, 11.925, 11.85],
    Jupiter: [10.8, 10.8, 9.35, 9.35],
    Venus: [7.75, 7.775, 10.675, 10.45],
    Saturn: [10.4, 11.65, 10.975, 9.85],
  },
  'sydney:default': {
    Sun: [12.35, 10.85, 9.775, 11.675],
    Moon: [10.1, 10.7, 10.6, 11.425],
    Mars: [13.0, 12.3, 13.575, 13.975],
    Mercury: [5.4, 7.4, 8.35, 8.325],
    Jupiter: [15.5, 15.0, 14.5, 12.5],
    Venus: [5.45, 6.2, 9.85, 9.8],
    Saturn: [12.75, 12.05, 13.1, 13.725],
  },
  'sydney:varga': {
    Sun: [12.65, 11.15, 8.75, 10.825],
    Moon: [13.3, 12.5, 12.4, 12.225],
    Mars: [11.4, 11.9, 11.575, 11.05],
    Mercury: [5.5, 7.5, 10.125, 9.375],
    Jupiter: [17.5, 17.8, 18.3, 16.1],
    Venus: [5.45, 6.2, 7.4, 7.8],
    Saturn: [13.0, 12.3, 13.85, 14.0],
  },
  'sydney:debrel': {
    Sun: [12.35, 12.1, 10.525, 11.925],
    Moon: [10.1, 10.7, 10.6, 11.425],
    Mars: [14.8, 14.1, 14.925, 14.875],
    Mercury: [8.9, 10.2, 9.925, 10.075],
    Jupiter: [15.5, 15.0, 14.5, 13.25],
    Venus: [13.55, 12.95, 12.55, 13.85],
    Saturn: [13.25, 12.55, 13.475, 13.85],
  },
};
const CHARTS = { refchart: REFERENCE_CHART, mumbai: MUMBAI_CASE.chart, sydney: SYDNEY_CASE.chart };
for (const [key, expected] of Object.entries(EXPECTED)) {
  const [name, variant] = key.split(':') as [keyof typeof CHARTS, string];
  const options = {
    ...DEFAULT_BALA_OPTIONS,
    ...(variant === 'varga' ? { temporaryRelation: 'varga' as const } : {}),
    ...(variant === 'debrel' ? { vimsopakaDebilitated: 'relation' as const } : {}),
  };
  const { rows } = calculateVimsopaka(CHARTS[name] as unknown as ChartData, options);
  assert.equal(rows.length, 7);
  for (const row of rows) {
    SCHEMES.forEach((scheme, index) => close(row[scheme], expected[row.planet][index], 0.001, `${key}, ${row.planet}, ${scheme}`));
  }
}

// ---------------------------------------------------------------------------
// The sixteen vargas of the matrix (D1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60), sign by sign, from their
// definitions in BPHS 6 worked in the separate program (Aries 0 to Pisces 11)
// ---------------------------------------------------------------------------
const DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
const VARGA_SIGNS: Record<string, Record<string, number[]>> = {
  sydney: {
    Sun: [11, 3, 11, 11, 6, 4, 8, 1, 11, 7, 7, 2, 5, 1, 4, 10],
    Moon: [6, 4, 10, 9, 8, 9, 9, 10, 5, 6, 0, 3, 8, 1, 3, 2],
    Mars: [8, 3, 0, 2, 11, 4, 1, 2, 4, 2, 5, 2, 8, 9, 8, 4],
    Mercury: [11, 3, 11, 11, 6, 4, 8, 0, 10, 7, 6, 1, 1, 0, 3, 8],
    Jupiter: [3, 3, 7, 6, 0, 7, 3, 8, 7, 9, 2, 10, 11, 1, 9, 7],
    Venus: [9, 4, 5, 6, 9, 5, 2, 8, 2, 6, 1, 4, 7, 7, 5, 4],
    Saturn: [1, 4, 9, 10, 1, 5, 6, 0, 7, 3, 2, 5, 7, 8, 11, 10],
  },
  mumbai: {
    Sun: [3, 4, 7, 9, 0, 7, 4, 9, 8, 10, 3, 11, 11, 3, 11, 10],
    Moon: [1, 3, 1, 4, 9, 11, 0, 4, 9, 2, 10, 11, 5, 6, 6, 7],
    Mars: [0, 3, 8, 9, 6, 8, 9, 11, 3, 7, 2, 1, 6, 2, 6, 9],
    Mercury: [3, 4, 7, 9, 0, 8, 4, 9, 9, 11, 4, 0, 11, 4, 1, 1],
    Jupiter: [0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 1, 1, 1],
    Venus: [4, 3, 8, 10, 8, 5, 9, 11, 1, 7, 6, 4, 8, 11, 6, 3],
    Saturn: [3, 3, 3, 3, 9, 3, 11, 3, 0, 0, 4, 10, 1, 7, 1, 5],
  },
};
for (const [name, expected] of Object.entries(VARGA_SIGNS)) {
  const chart = CHARTS[name as keyof typeof CHARTS];
  const longitudes = Object.fromEntries(chart.planets!.map(planet => [planet.name, planet.longitude]));
  const matrix = buildVargaMatrix(longitudes as Record<string, number>, chart.ascendant?.longitude, DIVISIONS);
  for (const [planet, signs] of Object.entries(expected)) {
    DIVISIONS.forEach((division, index) => assert.equal(matrix[planet][`D${division}`].signIndex, signs[index], `${name}, ${planet}, D${division}`));
  }
}

// The default is the verse's reading, and the two choices change the numbers.
{
  const chart = SYDNEY_CASE.chart as unknown as ChartData;
  const byPlanet = (options = DEFAULT_BALA_OPTIONS) => Object.fromEntries(calculateVimsopaka(chart, options).rows.map(row => [row.planet, row.shodasavarga]));
  assert.deepEqual(byPlanet(), byPlanet(DEFAULT_BALA_OPTIONS));
  assert.notDeepEqual(byPlanet(), byPlanet({ ...DEFAULT_BALA_OPTIONS, vimsopakaDebilitated: 'relation' }));
  assert.notDeepEqual(byPlanet(), byPlanet({ ...DEFAULT_BALA_OPTIONS, temporaryRelation: 'varga' }));
  assert.equal(calculateVimsopaka(chart).rows.length, calculateVimsopaka(chart, DEFAULT_BALA_OPTIONS).rows.length);
}

// A graha without a longitude gets no row; the matrix is whole signs.
{
  const matrix = buildVargaMatrix({ Sun: 10 }, undefined, [1, 9]);
  assert.equal(matrix.Sun.D1.signIndex, 0);
  assert.equal(matrix.Moon.D1.signIndex, null);
}

console.log('Vimsopaka tests passed');
