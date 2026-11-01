import assert from 'node:assert/strict';
import { PARASHARA_AV, VARAHAMIHIRA_AV, buildAshtakavarga, buildBhinnaAshtakavarga, mapAshtakavargaHousesToSigns } from './ashtakavarga';

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
  Moon:     [  6,   7,   6,   8,  7,  7,  4,  4],
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
// The verses of BPHS 66.16-68, read from the Sanskrit
// ---------------------------------------------------------------------------
// (1) The numbers of the karana verses 16, 20-21, 23-24, 28, 31-32, 35-36, 39: how many of the eight bodies have
// NO bindu in each house (1 to 12) of the planet's Ashtakavarga. With all eight in one sign, a contributor's
// house h is the target house h, so the BAV of house h is 8 less this number.
const VERSE_NO_BINDU: Record<keyof typeof CLASSICAL_BAV_TOTALS, number[]> = {
  //         1  2  3  4  5  6  7  8  9 10 11 12
  Sun:     [5, 5, 5, 4, 6, 3, 4, 5, 3, 2, 1, 5],
  Moon:    [5, 6, 1, 5, 4, 3, 3, 5, 6, 1, 0, 8],
  Mars:    [5, 7, 4, 6, 6, 2, 6, 5, 7, 3, 0, 6],
  Mercury: [3, 3, 6, 3, 5, 3, 6, 2, 3, 3, 0, 5],
  Jupiter: [3, 1, 5, 3, 3, 4, 3, 5, 3, 2, 1, 7],
  Venus:   [5, 5, 2, 3, 2, 6, 8, 2, 1, 5, 0, 5],
  Saturn:  [6, 7, 4, 6, 5, 1, 7, 6, 7, 4, 0, 4],
};
{
  const allInAries = buildBhinnaAshtakavarga(chartWithOffsets(1, [0, 0, 0, 0, 0, 0, 0]));
  for (const row of allInAries) {
    row.houses.forEach((bindus, index) => assert.equal(8 - bindus, VERSE_NO_BINDU[row.planet][index], `${row.planet}, house ${index + 1}: the verse's number`));
  }
}

// (2) The sthana verses 44-50 and 51-53 name the bodies that give a bindu in each house, house by house: the Sun's,
// the Moon's, Mars's and Mercury's. Su Mo Ma Me Ju Ve Sa A (Ascendant).
const VERSE_SPLIT = (text: string) => text.split(' ').filter(Boolean).sort();
const VERSE_BINDU_BY_HOUSE: Record<'Sun' | 'Moon' | 'Mars' | 'Mercury', string[]> = {
  // 66.44-46: svayustanusu 1, 2, 8; jivabudhau 5; vikrame jnendulagnani 3; grhe 4; khabhe 10; aye all but Venus; vyaye 12; satrau 6; dyune 7; dharme 9
  Sun: ['Su Ma Sa', 'Su Ma Sa', 'Me Mo A', 'Su Ma Sa A', 'Ju Me', 'Me Ju Mo Ve A', 'Su Ma Sa Ve', 'Su Ma Sa', 'Su Ma Sa Me Ju', 'Su Ma Sa A Me Mo', 'Su Mo Ma Me Ju Sa A', 'Me Ve A'],
  // 66.46-48 in order of the houses (kramat): 11th all, 12th none
  Moon: ['Mo Me Ju', 'Ma Ju', 'Su Mo Ma Me Ve Sa A', 'Me Ju Ve', 'Ma Me Ve Sa', 'Su Mo Ma Sa A', 'Su Mo Me Ju Ve', 'Su Me Ju', 'Mo Ve', 'Su Mo Ma Me Ju Ve A', 'Su Mo Ma Me Ju Ve Sa A', ''],
  // 66.49-50
  Mars: ['Ma Sa A', 'Ma', 'Su Mo Me A', 'Ma Sa', 'Su Me', 'Su Mo Me Ju Ve A', 'Ma Sa', 'Ma Sa Ve', 'Sa', 'Su Ma Ju Sa A', 'Su Mo Ma Me Ju Ve Sa A', 'Ju Ve'],
  // 66.51-53
  Mercury: ['Ma Me Ve Sa A', 'Ma Mo Ve Sa A', 'Me Ve', 'Ma Mo Ve Sa A', 'Su Me Ve', 'Su Mo Me Ju A', 'Ma Sa', 'Ma Sa Mo Ve Ju A', 'Su Ma Me Sa Ve', 'Ma Mo Me Sa A', 'Su Mo Ma Me Ju Ve Sa A', 'Su Me Ju'],
};
const CONTRIBUTOR_SHORT: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Ascendant: 'A' };
for (const [owner, byHouse] of Object.entries(VERSE_BINDU_BY_HOUSE)) {
  const table = PARASHARA_AV[owner as keyof typeof PARASHARA_AV];
  for (let house = 1; house <= 12; house += 1) {
    const fromTable = Object.entries(table).filter(([, houses]) => houses.includes(house)).map(([contributor]) => CONTRIBUTOR_SHORT[contributor]).sort();
    assert.deepEqual(fromTable, VERSE_SPLIT(byHouse[house - 1]), `${owner}'s Ashtakavarga, house ${house}: who gives a bindu`);
  }
}
// Venus from Mars gives at the 4th, not the 5th (66.35-38); that is where Brihat Jataka differs.
assert.deepEqual(PARASHARA_AV.Venus.Mars, [3, 4, 6, 9, 11, 12]);

// ---------------------------------------------------------------------------
// Varāhamihira — Bṛhajjātaka 9.1–9.7
// Sanskrit-based differences from the BPHS table. The four rows preserve the
// same row totals; only the benefic relative houses differ.
// ---------------------------------------------------------------------------
assert.deepEqual(VARAHAMIHIRA_AV.Moon.Moon, [1, 3, 6, 7, 10, 11]);
assert.deepEqual(VARAHAMIHIRA_AV.Moon.Mars, [2, 3, 5, 6, 9, 10, 11]);
assert.deepEqual(VARAHAMIHIRA_AV.Moon.Jupiter, [1, 4, 7, 8, 10, 11, 12]);
assert.deepEqual(VARAHAMIHIRA_AV.Venus.Mars, [3, 5, 6, 9, 11, 12]);
assert.equal(VARAHAMIHIRA_AV.Moon.Moon.length, PARASHARA_AV.Moon.Moon.length - 1);
assert.equal(VARAHAMIHIRA_AV.Moon.Mars.length, PARASHARA_AV.Moon.Mars.length + 1);
assert.equal(VARAHAMIHIRA_AV.Moon.Jupiter.length, PARASHARA_AV.Moon.Jupiter.length);
assert.equal(VARAHAMIHIRA_AV.Venus.Mars.length, PARASHARA_AV.Venus.Mars.length);

// Exhaustive comparison: only the four rows stated by Bṛhajjātaka 9.2 and
// 9.6 may differ from the BPHS table. This guards against accidental drift in
// inherited rows as well as unrecorded differences in the source comparison.
const EXPECTED_VARAHAMIHIRA_DIFFERENCES = new Set([
  'Moon.Moon',
  'Moon.Mars',
  'Moon.Jupiter',
  'Venus.Mars',
]);
for (const planet of PLANET_NAMES) {
  for (const contributor of [...CONTRIBUTOR_ORDER, 'Ascendant'] as const) {
    const key = `${planet}.${contributor}`;
    const differs =
      JSON.stringify(VARAHAMIHIRA_AV[planet][contributor]) !==
      JSON.stringify(PARASHARA_AV[planet][contributor]);
    assert.equal(
      differs,
      EXPECTED_VARAHAMIHIRA_DIFFERENCES.has(key),
      `Varāhamihira source difference must be explicitly accounted for: ${key}`,
    );
  }
}

// The public default remains Parāśara; selecting it explicitly must be
// identical to omitting the system argument.
{
  const chart = chartWithOffsets(4, [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(buildAshtakavarga(chart), buildAshtakavarga(chart, 'Parashara'));
}

for (const ascendant of [1, 4, 7, 10, 12]) {
  for (const offsets of ARRANGEMENTS) {
    const result = buildAshtakavarga(chartWithOffsets(ascendant, offsets), 'Varahamihira');
    assert.equal(result.sav.total, CLASSICAL_SAV_TOTAL, 'Varāhamihira SAV total remains 337');
    for (const row of result.bav) {
      assert.equal(row.total, CLASSICAL_BAV_TOTALS[row.planet], `Varāhamihira ${row.planet} BAV total`);
    }
  }
}

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
