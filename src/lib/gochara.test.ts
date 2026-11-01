import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { bavStrength, buildGochara, FAVOURABLE_FROM_MOON, gocharaRowOf, gocharaTables, VEDHA_FROM_MOON } from './gochara';
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

// Vedha (Phaladīpikā 26.3–8): every good house has one vedha house, and the pairs are the ones of the verses.
for (const [name, houses] of Object.entries(FAVOURABLE_FROM_MOON)) {
  const pairs = VEDHA_FROM_MOON[name as keyof typeof VEDHA_FROM_MOON];
  if (name === 'Venus') continue; // the verse gives nine good houses; checked below
  assert.deepEqual(Object.keys(pairs).map(Number).sort((a, b) => a - b), [...houses].sort((a, b) => a - b), `${name}: a vedha house for each good house`);
}
assert.deepEqual(Object.keys(VEDHA_FROM_MOON.Venus).map(Number).sort((a, b) => a - b), [...FAVOURABLE_FROM_MOON.Venus].sort((a, b) => a - b));
assert.deepEqual(VEDHA_FROM_MOON.Sun, { 3: 9, 6: 12, 10: 4, 11: 5 });
assert.deepEqual(VEDHA_FROM_MOON.Jupiter, { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 });
assert.deepEqual(VEDHA_FROM_MOON.Venus, { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 3, 12: 6 });

// A worked case: the natal Moon in Aries (sign 1), so the house from the Moon is the sign number.
const tables = gocharaTables({ ascendant: chart.ascendant, planets: natal.map(item => item.name === 'Moon' ? { ...item, sign: 1 } : item) })!;
assert.equal(tables.moonSign, 1);
// The Sun in Gemini (3rd from the Moon, good) is obstructed by Mars in the 9th (Sagittarius), as the verse has it…
const sunBlocked = gocharaRowOf(tables, 'Sun', 3, [{ planet: 'Mars', sign: 9 }]);
assert.equal(sunBlocked.favourable, true);
assert.equal(sunBlocked.vedhaHouse, 9);
assert.deepEqual(sunBlocked.blockedBy, ['Mars']);
// …but not by Saturn (the Sun and Saturn do not obstruct each other), nor by a graha in another house, nor by Rāhu.
assert.deepEqual(gocharaRowOf(tables, 'Sun', 3, [{ planet: 'Saturn', sign: 9 }]).blockedBy, []);
assert.deepEqual(gocharaRowOf(tables, 'Sun', 3, [{ planet: 'Mars', sign: 8 }]).blockedBy, []);
assert.deepEqual(gocharaRowOf(tables, 'Sun', 3, [{ planet: 'Rahu', sign: 9 }]).blockedBy, []);
// Saturn does not obstruct the Sun, nor the Sun Saturn; the Moon and Mercury likewise.
assert.deepEqual(gocharaRowOf(tables, 'Saturn', 3, [{ planet: 'Sun', sign: 12 }]).blockedBy, []);
assert.deepEqual(gocharaRowOf(tables, 'Moon', 1, [{ planet: 'Mercury', sign: 5 }]).blockedBy, []);
assert.deepEqual(gocharaRowOf(tables, 'Moon', 1, [{ planet: 'Jupiter', sign: 5 }]).blockedBy, ['Jupiter']);
// A graha does not obstruct itself; an unfavourable house has no vedha.
assert.deepEqual(gocharaRowOf(tables, 'Mars', 3, [{ planet: 'Mars', sign: 12 }]).blockedBy, []);
assert.equal(gocharaRowOf(tables, 'Mars', 4, [{ planet: 'Venus', sign: 12 }]).vedhaHouse, null);
// Several obstructing grahas are all named; with no others given nothing is blocked.
assert.deepEqual(gocharaRowOf(tables, 'Venus', 1, [{ planet: 'Mars', sign: 8 }, { planet: 'Jupiter', sign: 8 }]).blockedBy, ['Mars', 'Jupiter']);
assert.deepEqual(gocharaRowOf(tables, 'Venus', 1).blockedBy, []);
// buildGochara gives each row the others of the same moment.
const built = buildGochara({ ascendant: chart.ascendant, planets: natal.map(item => item.name === 'Moon' ? { ...item, sign: 1 } : item) }, [planet('Sun', 3), planet('Mars', 9)])!;
assert.deepEqual(built.rows.find(row => row.planet === 'Sun')!.blockedBy, ['Mars']);
