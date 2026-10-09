import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { bavStrength, buildGochara, FAVOURABLE_FROM_MOON } from './gochara';
import { buildAshtakavarga, mapAshtakavargaHousesToSigns } from './ashtakavarga';

const planet = (name: string, sign: number): PlanetData => ({ name, sign, degree: 10, longitude: (sign - 1) * 30 + 10, house: 0 });
const ascendantSign = 4; // Cancer
const house = (sign: number) => ((sign - ascendantSign + 12) % 12) + 1;
const natal = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
  .map((name, index) => planet(name, ((index * 5 + 2) % 12) + 1))
  .map(item => ({ ...item, house: house(item.sign) }));
const chart = { ascendant: { sign: ascendantSign, degree: 5, longitude: 95 }, planets: natal };

// Transiting grahas in chosen signs.
const transit = [
  planet('Sun', 9), planet('Moon', 1), planet('Mars', 5), planet('Mercury', 7), planet('Jupiter', 3),
  planet('Venus', 12), planet('Saturn', 6), planet('Rahu', 11), planet('Ketu', 5),
];

const result = buildGochara(chart, transit)!;
assert.ok(result);
assert.deepEqual(result.rows.map(row => row.planet), ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']);

// The houses from the natal Lagna and Moon.
const natalMoonSign = natal[1].sign;
const sun = result.rows[0];
assert.equal(sun.sign, 9);
assert.equal(sun.houseFromLagna, ((9 - ascendantSign + 12) % 12) + 1);
assert.equal(sun.houseFromMoon, ((9 - natalMoonSign + 12) % 12) + 1);

// The bindus are the graha's own Bhinnāṣṭakavarga in the sign, and the SAV that of the sign.
const { bav, sav } = buildAshtakavarga(chart);
const savBySign = mapAshtakavargaHousesToSigns(sav.houses, ascendantSign);
for (const row of result.rows) {
  assert.equal(row.sav, savBySign[row.sign - 1], `${row.planet} SAV`);
  if (row.planet === 'Rahu' || row.planet === 'Ketu') {
    assert.equal(row.bindus, null);
    assert.equal(row.strength, null);
    assert.equal(row.favourable, null);
  } else {
    const own = bav.find(item => item.planet === row.planet)!;
    assert.equal(row.bindus, mapAshtakavargaHousesToSigns(own.houses, ascendantSign)[row.sign - 1], `${row.planet} BAV`);
    assert.equal(row.favourable, FAVOURABLE_FROM_MOON[row.planet].includes(row.houseFromMoon));
  }
}
assert.equal(result.savBySign.reduce((a, b) => a + b, 0), 337, 'the Sarvashtakavarga always adds to 337');
assert.equal(Object.keys(result.bavBySign).length, 7);

// Strength of a transit by its bindus.
assert.deepEqual([0, 3, 4, 5, 8].map(bavStrength), ['weak', 'weak', 'average', 'strong', 'strong']);

// The classical favourable houses from the Moon.
assert.deepEqual(FAVOURABLE_FROM_MOON.Sun, [3, 6, 10, 11]);
assert.deepEqual(FAVOURABLE_FROM_MOON.Saturn, [3, 6, 11]);
assert.equal(FAVOURABLE_FROM_MOON.Venus.length, 9);

// Missing transit bodies are left out; a chart without a Moon gives nothing.
assert.equal(buildGochara(chart, transit.slice(0, 3))!.rows.length, 3);
assert.equal(buildGochara({ ...chart, planets: natal.filter(item => item.name !== 'Moon') }, transit), null);

console.log('Gochara tests passed');
