import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AV_CONTRIBUTORS, AV_PLANETS, SHODHANA_RULES, bhinnaBySign, buildPrastara, buildShodhana, trikonaShodhana } from './ashtakavargaShodhana';
import type { AshtakavargaChartLike } from './ashtakavarga';

// The Aṣṭakavarga checked against another program: 120 charts of random placements of the Lagna and the nine grahas, the Bhinnā-
// and Sarvāṣṭakavarga, the Prastāra, the Trikoṇa and Ekādhipatya Śodhana and the Piṇḍas as PyJHora 4.8.7 works them
// (fixtures/pyjhoraAshtakavarga.json, made by scripts/pyjhora_ashtakavarga.py). PyJHora differs from the verses of BPHS 67–69 in the
// Rāśi number of Virgo, in a graha-held sign against an empty one of the same value, and in counting the Lagna among the occupants; the
// 'pyjhora' rules of the module are those three, to check the rest, which is the greater part, number by number.
type Reference = {
  lagna: number; signs: number[]; bav: number[][]; sav: number[]; prastara: string[][]; trikona: number[][]; ekadhipatya: number[][];
  rasiPinda: number[]; grahaPinda: number[]; sodhyaPinda: number[];
};
const { charts, rasiMultipliers, grahaMultipliers } = JSON.parse(readFileSync(new URL('./fixtures/pyjhoraAshtakavarga.json', import.meta.url), 'utf8')) as { charts: Reference[]; rasiMultipliers: number[]; grahaMultipliers: number[] };
assert.equal(charts.length, 120);
assert.deepEqual(rasiMultipliers, [...SHODHANA_RULES.pyjhora.rasiMultipliers], 'the numbers of the signs that PyJHora has');
assert.deepEqual(grahaMultipliers, [5, 5, 8, 5, 10, 7, 5]);

const NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const chartOf = (reference: Reference): AshtakavargaChartLike => ({
  ascendant: { sign: reference.lagna + 1 },
  planets: NAMES.map((name, index) => ({ name, sign: reference.signs[index] + 1, house: ((reference.signs[index] - reference.lagna + 12) % 12) + 1 })),
});

const wrong: string[] = [];
const note = (message: string) => { if (wrong.length < 12) wrong.push(message); };
let numbers = 0;
let emptyOccupancy = 0;
for (const [index, reference] of charts.entries()) {
  const chart = chartOf(reference);
  const bav = bhinnaBySign(chart);
  const shodhana = buildShodhana(chart, 'Parashara', SHODHANA_RULES.pyjhora);
  const prastara = buildPrastara(chart);
  emptyOccupancy += shodhana.occupied.filter(held => !held).length;
  AV_PLANETS.forEach((planet, p) => {
    numbers += 12 * 3 + 3;
    if (bav[planet].join() !== reference.bav[p].join()) note(`#${index} ${planet} Bhinnāṣṭakavarga: ${bav[planet]} against ${reference.bav[p]}`);
    if (trikonaShodhana(reference.bav[p]).join() !== reference.trikona[p].join()) note(`#${index} ${planet} Trikoṇa: ${trikonaShodhana(reference.bav[p])} against ${reference.trikona[p]}`);
    if (shodhana.afterTrikona[planet].join() !== reference.trikona[p].join()) note(`#${index} ${planet} Trikoṇa of the chart`);
    if (shodhana.sodhita[planet].join() !== reference.ekadhipatya[p].join()) note(`#${index} ${planet} Ekādhipatya: ${shodhana.sodhita[planet]} against ${reference.ekadhipatya[p]}`);
    if (shodhana.rasiPinda[planet] !== reference.rasiPinda[p]) note(`#${index} ${planet} Rāśi Piṇḍa ${shodhana.rasiPinda[planet]} against ${reference.rasiPinda[p]}`);
    if (shodhana.grahaPinda[planet] !== reference.grahaPinda[p]) note(`#${index} ${planet} Graha Piṇḍa ${shodhana.grahaPinda[planet]} against ${reference.grahaPinda[p]}`);
    if (shodhana.sodhyaPinda[planet] !== reference.sodhyaPinda[p]) note(`#${index} ${planet} Śodhya Piṇḍa ${shodhana.sodhyaPinda[planet]} against ${reference.sodhyaPinda[p]}`);
    AV_CONTRIBUTORS.forEach((contributor, op) => {
      const ours = prastara[planet].rows[op].bindu.map(held => (held ? '1' : '0')).join('');
      if (ours !== reference.prastara[p][op]) note(`#${index} ${planet} Prastāra of ${contributor}: ${ours} against ${reference.prastara[p][op]}`);
    });
  });
  const sav = Array.from({ length: 12 }, (_, sign) => AV_PLANETS.reduce((sum, planet) => sum + bav[planet][sign], 0));
  if (sav.join() !== reference.sav.join()) note(`#${index} Sarvāṣṭakavarga`);
}
assert.deepEqual(wrong, [], 'the Aṣṭakavarga of every chart agrees with PyJHora');
assert.ok(emptyOccupancy > 120 * 4, 'the charts leave signs empty, as the Ekādhipatya rules need');

// Every case of the Ekādhipatya rules came up in the charts, so that the agreement means something.
const cases = new Set<string>();
for (const reference of charts) {
  const shodhana = buildShodhana(chartOf(reference), 'Parashara', SHODHANA_RULES.pyjhora);
  for (const planet of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) {
    const row = shodhana.afterTrikona[planet];
    const [a, b] = { Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] }[planet];
    if (row[a] === 0 || row[b] === 0) { cases.add('a sign with no bindu'); continue; }
    const held = [shodhana.occupied[a], shodhana.occupied[b]];
    if (held[0] && held[1]) cases.add('both occupied');
    else if (!held[0] && !held[1]) cases.add(row[a] === row[b] ? 'both empty, equal' : 'both empty, unequal');
    else { const [heldSign, emptySign] = held[0] ? [a, b] : [b, a]; cases.add(row[emptySign] > row[heldSign] ? 'one held, the empty one greater' : row[emptySign] < row[heldSign] ? 'one held, the empty one less' : 'one held, equal'); }
  }
}
assert.deepEqual([...cases].sort(), ['a sign with no bindu', 'both empty, equal', 'both empty, unequal', 'both occupied', 'one held, equal', 'one held, the empty one greater', 'one held, the empty one less']);

// Where the verses differ from PyJHora, and by how much, in the same charts: only the three things named above.
let differ = 0;
for (const reference of charts) {
  const chart = chartOf(reference);
  const bphs = buildShodhana(chart);
  const pyjhora = buildShodhana(chart, 'Parashara', SHODHANA_RULES.pyjhora);
  for (const planet of AV_PLANETS) {
    if (bphs.sodhyaPinda[planet] !== pyjhora.sodhyaPinda[planet]) differ += 1;
    // Whatever the rules, the reductions only take away: Śodhita ≤ after the Trikoṇa Śodhana ≤ the Bhinnāṣṭakavarga.
    for (const shodhana of [bphs, pyjhora]) {
      shodhana.sodhita[planet].forEach((value, sign) => assert.ok(value <= shodhana.afterTrikona[planet][sign] && shodhana.afterTrikona[planet][sign] <= shodhana.original[planet][sign], `${planet} sign ${sign}`));
    }
  }
}
assert.ok(differ > 0, 'the verses and PyJHora do differ in some Piṇḍa');

console.log(`PyJHora Aṣṭakavarga tests passed: ${numbers} numbers in ${charts.length} charts agree; the verses differ from PyJHora in ${differ} of ${charts.length * 7} Śodhya Piṇḍas.`);
