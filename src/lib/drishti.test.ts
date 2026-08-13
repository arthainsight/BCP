import assert from 'node:assert/strict';
import { buildDrishti, buildGrahaDrishti, buildRashiDrishti, getRashiAspectSigns } from './drishti';

// ---------------------------------------------------------------------------
// Dṛṣṭi has its own tab and had no tests. Both systems are fully rule-defined,
// so everything below is exact and needs no external reference data.
// ---------------------------------------------------------------------------
const ALL_SIGNS = Array.from({ length: 12 }, (_, index) => index + 1);
const MOVABLE = [1, 4, 7, 10];
const FIXED = [2, 5, 8, 11];
const DUAL = [3, 6, 9, 12];

function chartWith(planets: Array<{ name: string; sign: number }>, ascendantSign = 1) {
  return {
    ascendant: { sign: ascendantSign },
    planets: planets.map((p) => ({ name: p.name, sign: p.sign, degree: 15, longitude: (p.sign - 1) * 30 + 15 })),
  };
}

// ---------------------------------------------------------------------------
// Graha dṛṣṭi — every planet sees the 7th; the rest have their own extras.
// ---------------------------------------------------------------------------
const SPECIAL: Record<string, number[]> = {
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
  // Rahu and Ketu take the Jupiter aspects in this implementation; some schools
  // differ, so this pins the choice the app has made rather than a universal.
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};
const PLAIN = ['Sun', 'Moon', 'Mercury', 'Venus'];

// A planet in the first house aspects exactly its offsets, read as house numbers.
for (const [name, offsets] of Object.entries(SPECIAL)) {
  const [row] = buildGrahaDrishti(chartWith([{ name, sign: 1 }]));
  assert.equal(row.planet, name);
  assert.equal(row.fromHouse, 1, `${name} sits in the first house`);
  assert.deepEqual(row.aspects, offsets, `${name} aspects houses ${offsets.join(', ')} from the first`);
}

for (const name of PLAIN) {
  const [row] = buildGrahaDrishti(chartWith([{ name, sign: 1 }]));
  assert.deepEqual(row.aspects, [7], `${name} aspects only the 7th`);
}

// The aspects travel with the planet and wrap around the wheel.
for (let house = 1; house <= 12; house += 1) {
  const [mars] = buildGrahaDrishti(chartWith([{ name: 'Mars', sign: house }]));
  assert.deepEqual(
    mars.aspects,
    [4, 7, 8].map((offset) => ((house + offset - 2) % 12) + 1),
    `Mars from house ${house}`,
  );
  for (const target of mars.aspects) {
    assert.ok(target >= 1 && target <= 12, 'aspected houses stay within 1–12');
    assert.notEqual(target, house, 'no planet aspects its own house');
  }
}

// The 7th aspect is mutual: two planets opposite each other always see each other.
for (let sign = 1; sign <= 12; sign += 1) {
  const opposite = ((sign + 5) % 12) + 1;
  const rows = buildGrahaDrishti(chartWith([{ name: 'Sun', sign }, { name: 'Moon', sign: opposite }], sign));
  const sun = rows.find((row) => row.planet === 'Sun')!;
  const moon = rows.find((row) => row.planet === 'Moon')!;
  assert.ok(sun.aspects.includes(moon.fromHouse!), 'the Sun sees the opposite Moon');
  assert.ok(moon.aspects.includes(sun.fromHouse!), 'and the Moon sees back');
}

// Labels stay aligned with the offsets they describe.
const [saturn] = buildGrahaDrishti(chartWith([{ name: 'Saturn', sign: 1 }]));
assert.deepEqual(saturn.labels, ['3th→H3', '7th→H7', '10th→H10'], 'labels pair each offset with its house');

// ---------------------------------------------------------------------------
// Rāśi dṛṣṭi (Jaimini)
// ---------------------------------------------------------------------------
for (const sign of ALL_SIGNS) {
  const aspects = getRashiAspectSigns(sign);

  assert.equal(aspects.length, 3, `sign ${sign} aspects exactly three signs`);
  assert.ok(!aspects.includes(sign), `sign ${sign} does not aspect itself`);
  assert.equal(new Set(aspects).size, 3, `sign ${sign} aspects three distinct signs`);

  // Movable sees fixed, fixed sees movable, dual sees dual.
  if (MOVABLE.includes(sign)) {
    assert.ok(aspects.every((target) => FIXED.includes(target)), `movable ${sign} aspects only fixed signs`);
  } else if (FIXED.includes(sign)) {
    assert.ok(aspects.every((target) => MOVABLE.includes(target)), `fixed ${sign} aspects only movable signs`);
  } else {
    assert.ok(aspects.every((target) => DUAL.includes(target)), `dual ${sign} aspects only dual signs`);
  }

  // The adjacent sign is always excluded for movable and fixed.
  for (const target of aspects) {
    const distance = Math.abs(sign - target);
    assert.ok(distance !== 1 && distance !== 11, `sign ${sign} must not aspect its neighbour ${target}`);
  }
}

// Rāśi dṛṣṭi is mutual: if A aspects B then B aspects A.
for (const sign of ALL_SIGNS) {
  for (const target of getRashiAspectSigns(sign)) {
    assert.ok(
      getRashiAspectSigns(target).includes(sign),
      `rāśi dṛṣṭi must be mutual, but ${target} does not aspect ${sign} back`,
    );
  }
}

// Worked examples: Aries is movable, so it sees the fixed signs bar Taurus.
assert.deepEqual(getRashiAspectSigns(1), [5, 8, 11], 'Aries aspects Leo, Scorpio and Aquarius');
// Leo is fixed, so it sees the movable signs bar Cancer and Virgo — Virgo is dual anyway.
assert.deepEqual(getRashiAspectSigns(5), [1, 7, 10], 'Leo aspects Aries, Libra and Capricorn');
// Gemini is dual and sees the other three duals.
assert.deepEqual(getRashiAspectSigns(3), [6, 9, 12], 'Gemini aspects the other dual signs');
// Pisces wraps: dual, so the other duals again.
assert.deepEqual(getRashiAspectSigns(12), [3, 6, 9], 'Pisces aspects the other dual signs');

// Every sign is aspected by exactly three others, so the relation is a perfect
// pairing across the zodiac rather than lopsided.
for (const target of ALL_SIGNS) {
  const aspectedBy = ALL_SIGNS.filter((sign) => getRashiAspectSigns(sign).includes(target));
  assert.equal(aspectedBy.length, 3, `sign ${target} is aspected by exactly three signs`);
}

// ---------------------------------------------------------------------------
// buildRashiDrishti maps signs onto houses from the ascendant
// ---------------------------------------------------------------------------
for (const ascendant of ALL_SIGNS) {
  const rows = buildRashiDrishti(chartWith([{ name: 'Sun', sign: 1 }], ascendant));
  assert.equal(rows.length, 12, 'every sign gets a row');

  for (const row of rows) {
    assert.equal(row.house, ((row.sign - ascendant + 12) % 12) + 1, `sign ${row.sign} house from ascendant ${ascendant}`);
    assert.equal(row.aspectsHouses.length, row.aspectsSigns.length, 'each aspected sign maps to a house');
    assert.equal(row.labels.length, 3, 'three labels per sign');
    for (const house of row.aspectsHouses) {
      assert.ok(house >= 1 && house <= 12, 'aspected houses stay within 1–12');
    }
  }

  // The ascendant sign is always the first house.
  assert.equal(rows.find((row) => row.sign === ascendant)!.house, 1, 'the ascendant sign is the first house');
}

// ---------------------------------------------------------------------------
// buildDrishti — the combined summary
// ---------------------------------------------------------------------------
const combined = buildDrishti(
  chartWith(
    [
      { name: 'Sun', sign: 1 }, { name: 'Moon', sign: 4 }, { name: 'Mars', sign: 7 },
      { name: 'Mercury', sign: 2 }, { name: 'Jupiter', sign: 9 }, { name: 'Venus', sign: 11 },
      { name: 'Saturn', sign: 6 }, { name: 'Rahu', sign: 3 }, { name: 'Ketu', sign: 9 },
    ],
    1,
  ),
);

assert.equal(combined.houses.length, 12, 'a summary row for every house');
for (const house of combined.houses) {
  assert.ok(house.house >= 1 && house.house <= 12, 'house numbers stay in range');
  assert.equal(
    house.total,
    house.graha.length + house.rashi.length,
    `house ${house.house} total must equal its graha plus rāśi contributions`,
  );
}

// Every graha aspect in the rows must appear in the house summary.
for (const row of combined.graha) {
  for (const target of row.aspects) {
    assert.ok(
      combined.houses[target - 1].graha.length > 0,
      `house ${target} is aspected by ${row.planet} and must show it in the summary`,
    );
  }
}

// A chart with no planets must not throw.
const empty = buildDrishti({ ascendant: { sign: 1 }, planets: [] });
assert.equal(empty.graha.length, 0, 'no planets means no graha rows');
assert.equal(empty.rashi.length, 12, 'rāśi dṛṣṭi is a property of the signs, so it still has twelve rows');

console.log('Dṛṣṭi tests passed');
