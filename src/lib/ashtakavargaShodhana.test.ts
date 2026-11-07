import assert from 'node:assert/strict';
import {
  GRAHA_MULTIPLIERS, KAKSHYA_LORDS, RASI_MULTIPLIERS_BPHS, SHODHANA_RULES, buildPrastara, buildShodhana, ekadhipatyaShodhana, kakshyaOf, trikonaShodhana,
} from './ashtakavargaShodhana';
import { buildAshtakavarga, type AshtakavargaChartLike } from './ashtakavarga';

// The reductions and Piṇḍas worked out by hand from the verses of BPHS 67–69 (docs/ashtakavarga-sources.md quotes them). The
// comparison with PyJHora is in pyjhoraAshtakavarga.test.ts.

// --- Trikoṇa Śodhana (67.4–5): the least of the three is taken from each; a nought stops it; all alike go --------------------------
const row = (values: Record<number, number>) => Array.from({ length: 12 }, (_, sign) => values[sign] ?? 9);
// The trine Aries–Leo–Sagittarius is signs 0, 4, 8.
assert.deepEqual(trikonaShodhana(row({ 0: 5, 4: 3, 8: 4 })).filter((_, sign) => [0, 4, 8].includes(sign)), [2, 0, 1], 'the least, 3, is taken from each');
assert.deepEqual(trikonaShodhana(row({ 0: 4, 4: 4, 8: 4 })).filter((_, sign) => [0, 4, 8].includes(sign)), [0, 0, 0], 'all alike: all go');
assert.deepEqual(trikonaShodhana(row({ 0: 5, 4: 0, 8: 4 })).filter((_, sign) => [0, 4, 8].includes(sign)), [5, 0, 4], 'one nought: no reduction');
// The four trines are each worked alone: Taurus–Virgo–Capricorn (1, 5, 9), Gemini–Libra–Aquarius (2, 6, 10), Cancer–Scorpio–Pisces (3, 7, 11).
const four = trikonaShodhana([5, 4, 6, 2, 5, 3, 7, 6, 4, 9, 3, 1]);
// Aries–Leo–Sagittarius 5, 5, 4 lose 4; Taurus–Virgo–Capricorn 4, 3, 9 lose 3; Gemini–Libra–Aquarius 6, 7, 3 lose 3; Cancer–Scorpio–Pisces 2, 6, 1 lose 1.
assert.deepEqual(four, [1, 1, 3, 1, 1, 0, 4, 5, 0, 6, 0, 0], 'each trine loses its own least: 4, 3, 3, 1');
const given = [5, 4, 6, 2, 5, 3, 7, 6, 4, 9, 3, 1];
trikonaShodhana(given);
assert.deepEqual(given, [5, 4, 6, 2, 5, 3, 7, 6, 4, 9, 3, 1], 'the row that was given is not changed');

// --- Ekādhipatya Śodhana (68.2–5), Mars (Aries 0 and Scorpio 7) ---------------------------------------------------------------
const mars = (a: number, b: number, heldA: boolean, heldB: boolean, rules = SHODHANA_RULES.bphs) => {
  const values = new Array<number>(12).fill(0);
  values[0] = a; values[7] = b;
  const occupied = new Array<boolean>(12).fill(false);
  occupied[0] = heldA; occupied[7] = heldB;
  const out = ekadhipatyaShodhana('Mars', values, occupied, rules);
  return [out[0], out[7]];
};
assert.deepEqual(mars(0, 5, false, false), [0, 5], 'no bindu in one sign: nothing is done');
assert.deepEqual(mars(4, 5, true, true), [4, 5], 'a graha in both: never reduced');
assert.deepEqual(mars(4, 6, false, false), [4, 4], 'both empty: the greater is made equal to the lesser');
assert.deepEqual(mars(6, 4, false, false), [4, 4]);
assert.deepEqual(mars(5, 5, false, false), [0, 0], 'both empty and equal: both go');
assert.deepEqual(mars(3, 6, true, false), [3, 3], 'a graha in the one that has the less: the empty one is made equal to it');
assert.deepEqual(mars(6, 3, true, false), [6, 0], 'a graha in the one that has the more: the empty one goes');
assert.deepEqual(mars(3, 6, false, true), [0, 6], 'the same the other way round');
assert.deepEqual(mars(5, 5, true, false), [5, 0], 'a graha in one, the other empty, equal: the empty one goes (68.5)');
assert.deepEqual(mars(5, 5, true, false, SHODHANA_RULES.pyjhora), [5, 5], 'PyJHora keeps both here');
// The Sun and the Moon own one sign each (68.6): nothing to reduce.
assert.deepEqual(ekadhipatyaShodhana('Sun', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], new Array(12).fill(false)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

// --- Piṇḍa (69.2–4) ----------------------------------------------------------------------------------------------------------
assert.deepEqual([...RASI_MULTIPLIERS_BPHS], [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12], 'Aries 7 … Virgo 5 … Pisces 12');
assert.equal(RASI_MULTIPLIERS_BPHS.reduce((sum, value) => sum + value, 0), 96, 'the sum of the numbers of the signs, 96');
assert.deepEqual(GRAHA_MULTIPLIERS, { Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5 });

// A chart worked through: Lagna Aries, Sun in Aries, Moon in Cancer, Mars in Leo, Mercury in Virgo, Jupiter in Sagittarius,
// Venus in Libra, Saturn in Aquarius, Rahu in Taurus, Ketu in Scorpio.
const chart: AshtakavargaChartLike = {
  ascendant: { sign: 1 },
  planets: [['Sun', 1], ['Moon', 4], ['Mars', 5], ['Mercury', 6], ['Jupiter', 9], ['Venus', 7], ['Saturn', 11], ['Rahu', 2], ['Ketu', 8]]
    .map(([name, sign]) => ({ name: name as string, sign: sign as number, house: sign as number })),
};
const result = buildShodhana(chart);
const bav = buildAshtakavarga(chart).bav;
// The Bhinnāṣṭakavarga by sign is that of the houses (the Lagna is Aries, so sign = house).
for (const planetRow of bav) assert.deepEqual(result.original[planetRow.planet], planetRow.houses);
// Every number that comes out is a whole number not above what went in, and the Piṇḍas are the sums they say.
for (const planet of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) {
  result.sodhita[planet].forEach((value, sign) => assert.ok(Number.isInteger(value) && value >= 0 && value <= result.afterTrikona[planet][sign] && result.afterTrikona[planet][sign] <= result.original[planet][sign], `${planet} sign ${sign}`));
  assert.equal(result.rasiPinda[planet], result.sodhita[planet].reduce((sum, value, sign) => sum + value * RASI_MULTIPLIERS_BPHS[sign], 0));
  const held = [['Sun', 0], ['Moon', 3], ['Mars', 4], ['Mercury', 5], ['Jupiter', 8], ['Venus', 6], ['Saturn', 10]] as const;
  assert.equal(result.grahaPinda[planet], held.reduce((sum, [graha, sign]) => sum + GRAHA_MULTIPLIERS[graha] * result.sodhita[planet][sign], 0), `${planet} Graha Piṇḍa: the grahas' own numbers on their own signs`);
  assert.equal(result.sodhyaPinda[planet], result.rasiPinda[planet] + result.grahaPinda[planet]);
}
// Rahu and Ketu make Taurus and Scorpio occupied but have no number of their own: the Graha Piṇḍa leaves them out.
assert.equal(result.occupied[1] && result.occupied[7], true);
// The Lagna does not make a sign occupied under the verses (a Lagna in Aries, empty of grahas, would not): here the Sun is in it as well.
const lagnaOnly = buildShodhana({ ...chart, planets: chart.planets!.map(p => (p.name === 'Sun' ? { ...p, sign: 3, house: 3 } : p)) });
assert.equal(lagnaOnly.occupied[0], false, 'the Lagna alone leaves a sign empty');
assert.equal(buildShodhana({ ...chart, planets: chart.planets!.map(p => (p.name === 'Sun' ? { ...p, sign: 3, house: 3 } : p)) }, 'Parashara', SHODHANA_RULES.pyjhora).occupied[0], true, 'PyJHora counts it');
// The two systems of tables (Parāśara and Varāhamihira) both work.
assert.notDeepEqual(buildShodhana(chart, 'Varahamihira').original.Moon, buildShodhana(chart).original.Moon);

// --- Prastāra: the table the Bhinnāṣṭakavarga is made of ---------------------------------------------------------------------
const prastara = buildPrastara(chart);
for (const planetRow of bav) {
  const table = prastara[planetRow.planet];
  assert.equal(table.rows.length, 8, 'seven grahas and the Lagna');
  assert.deepEqual(table.totals, planetRow.houses, `${planetRow.planet}: the columns of the Prastāra add up to the Bhinnāṣṭakavarga`);
  assert.equal(table.rows.reduce((sum, r) => sum + r.bindu.filter(Boolean).length, 0), planetRow.total);
}
// The Sun's bindu from the Sun in Aries: the 1st, 2nd, 4th, 7th, 8th, 9th, 10th and 11th signs from it.
assert.deepEqual(prastara.Sun.rows[0].bindu.map((held, sign) => (held ? sign : -1)).filter(sign => sign >= 0), [0, 1, 3, 6, 7, 8, 9, 10]);

// --- Kakṣyā: eight parts of 3°45′, the lords in the order of the speed of the grahas ------------------------------------------
assert.deepEqual([...KAKSHYA_LORDS], ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Ascendant']);
assert.deepEqual([kakshyaOf(0), kakshyaOf(3.74), kakshyaOf(3.75), kakshyaOf(29.99)].map(k => [k.index, k.lord]), [[0, 'Saturn'], [0, 'Saturn'], [1, 'Jupiter'], [7, 'Ascendant']]);
assert.equal(kakshyaOf(30 + 10).lord, 'Mars', 'Taurus 10°: the third kakṣyā, 7°30′ to 11°15′');
assert.equal(kakshyaOf(40).sign, 1);
assert.deepEqual([kakshyaOf(40).from, kakshyaOf(40).to], [7.5, 11.25]);
assert.equal(kakshyaOf(-0.5).sign, 11, 'a negative longitude is taken round');

console.log('Aṣṭakavarga Śodhana tests passed');
