import assert from 'node:assert/strict';
import { buildAshtakavarga, buildBhinnaAshtakavarga, mapAshtakavargaHousesToSigns } from './ashtakavarga';

// ---------------------------------------------------------------------------
// Golden vectors — BPHS Ashtakavarga
//
// These are properties of the bindu table itself, not of any single chart, so
// they hold for every possible planetary arrangement. They are the strongest
// check available without an external ephemeris: if any contributor row gains
// or loses an entry, a total moves and one of these assertions fails.
//
// Source: Brihat Parashara Hora Shastra, Ashtakavarga adhyaya. The per-planet
// totals 48/49/39/54/56/52/39 summing to 337 are the standard cited values.
// ---------------------------------------------------------------------------
const CLASSICAL_BAV_TOTALS = {
  Sun: 48,
  Moon: 49,
  Mars: 39,
  Mercury: 54,
  Jupiter: 56,
  Venus: 52,
  Saturn: 39,
} as const;

const CLASSICAL_SAV_TOTAL = 337;

// Bindus granted to each planet's BAV by each contributing body. The row sums
// are the per-planet totals above; this table pins down *which* row moved when
// a total goes wrong.
const CLASSICAL_CONTRIBUTOR_COUNTS: Record<keyof typeof CLASSICAL_BAV_TOTALS, number[]> = {
  //         Sun Moon Mars Merc Jup Ven Sat Asc
  Sun:      [  8,   4,   8,   7,  4,  3,  8,  6],
  Moon:     [  6,   6,   7,   8,  7,  7,  4,  4],
  Mars:     [  5,   3,   7,   4,  4,  4,  7,  5],
  Mercury:  [  5,   6,   8,   8,  4,  8,  8,  7],
  Jupiter:  [  9,   5,   7,   8,  8,  6,  4,  9],
  Venus:    [  3,   9,   6,   5,  5,  9,  7,  8],
  Saturn:   [  7,   3,   6,   6,  4,  3,  4,  6],
};

const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

function chartWithOffsets(ascendant: number, offsets: number[]) {
  return {
    ascendant: { sign: ascendant },
    planets: PLANET_NAMES.map((name, index) => ({
      name,
      sign: ((ascendant - 1 + offsets[index]) % 12) + 1,
    })),
  };
}

// Every contributor row sums to its classical per-planet total.
for (const planet of PLANET_NAMES) {
  const rowSum = CLASSICAL_CONTRIBUTOR_COUNTS[planet].reduce((sum, count) => sum + count, 0);
  assert.equal(rowSum, CLASSICAL_BAV_TOTALS[planet], `${planet} contributor counts must sum to its total`);
}
assert.equal(
  Object.values(CLASSICAL_BAV_TOTALS).reduce((sum, total) => sum + total, 0),
  CLASSICAL_SAV_TOTAL,
  'classical per-planet totals must sum to 337',
);

// ---------------------------------------------------------------------------
// The totals are chart-independent: a planet's BAV total counts table entries,
// and moving the planets only redistributes those bindus between houses.
// ---------------------------------------------------------------------------
const ARRANGEMENTS = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 1, 2, 3, 4, 5, 6],
  [2, 5, 7, 1, 10, 3, 8],
  [11, 9, 4, 6, 0, 7, 2],
  [3, 3, 9, 9, 6, 6, 1],
];

for (const ascendant of [1, 4, 7, 10, 12]) {
  for (const offsets of ARRANGEMENTS) {
    const chart = chartWithOffsets(ascendant, offsets);
    const { bav, sav } = buildAshtakavarga(chart);
    const label = `asc=${ascendant} offsets=${offsets.join(',')}`;

    for (const row of bav) {
      assert.equal(row.total, CLASSICAL_BAV_TOTALS[row.planet], `${row.planet} BAV total (${label})`);
      assert.equal(row.houses.length, 12, `${row.planet} must have 12 houses (${label})`);
      assert.equal(row.houses.reduce((sum, value) => sum + value, 0), row.total, `${row.planet} houses must sum to total (${label})`);
      for (const bindu of row.houses) {
        assert.ok(Number.isInteger(bindu) && bindu >= 0 && bindu <= 8, `bindu must be an integer 0–8 (${label})`);
      }
    }

    assert.equal(sav.total, CLASSICAL_SAV_TOTAL, `SAV total (${label})`);
    assert.equal(sav.houses.length, 12, `SAV must have 12 houses (${label})`);
    // SAV is the per-house sum of the seven BAVs, never an average or a rescale.
    for (let house = 0; house < 12; house += 1) {
      const expected = bav.reduce((sum, row) => sum + row.houses[house], 0);
      assert.equal(sav.houses[house], expected, `SAV house ${house + 1} must equal the BAV column sum (${label})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Per-contributor decomposition. Placing a single contributor in a known house
// with all others absent isolates that contributor's row, so its bindu count is
// directly observable.
// ---------------------------------------------------------------------------
const CONTRIBUTOR_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

CONTRIBUTOR_ORDER.forEach((contributor, contributorIndex) => {
  const isolated = {
    ascendant: { sign: 1 },
    // Only this one contributor is present; the ascendant always contributes.
    planets: [{ name: contributor, sign: 1 }],
  };
  const bav = buildBhinnaAshtakavarga(isolated);
  for (const row of bav) {
    const expected =
      CLASSICAL_CONTRIBUTOR_COUNTS[row.planet][contributorIndex] +
      CLASSICAL_CONTRIBUTOR_COUNTS[row.planet][7]; // ascendant row
    assert.equal(
      row.total,
      expected,
      `${row.planet} BAV with only ${contributor} + ascendant present`,
    );
  }
});

// ---------------------------------------------------------------------------
// Varahamihira variant. It shares the Parashara totals; only the Venus/Mars
// contributor row differs, so per-house distribution can diverge while the
// totals stay put.
// ---------------------------------------------------------------------------
const variantChart = chartWithOffsets(4, [0, 1, 2, 3, 4, 5, 6]);
const parashara = buildAshtakavarga(variantChart, 'parashara');
const varahamihira = buildAshtakavarga(variantChart, 'varahamihira');

assert.deepEqual(
  parashara.bav.map((row) => row.total),
  Object.values(CLASSICAL_BAV_TOTALS),
);
assert.deepEqual(
  varahamihira.bav.map((row) => row.total),
  Object.values(CLASSICAL_BAV_TOTALS),
);
assert.equal(parashara.sav.total, CLASSICAL_SAV_TOTAL);
assert.equal(varahamihira.sav.total, CLASSICAL_SAV_TOTAL);

const parasharaVenus = parashara.bav.find((row) => row.planet === 'Venus')!;
const varahamihiraVenus = varahamihira.bav.find((row) => row.planet === 'Venus')!;
assert.notDeepEqual(
  parasharaVenus.houses,
  varahamihiraVenus.houses,
  'the Venus/Mars row must actually change the Venus BAV distribution',
);

// ---------------------------------------------------------------------------
// House-to-sign mapping
// ---------------------------------------------------------------------------
// Cancer ascendant: Aries is H10, Cancer is H1 and Pisces is H9.
const houses = Array.from({ length: 12 }, (_, index) => index + 1);
assert.deepEqual(
  mapAshtakavargaHousesToSigns(houses, 4),
  [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9],
);

console.log('Aṣṭakavarga tests passed');
