import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { bhavaMadhyas, bhavaOf, bhavas, buildChalit } from './bhavaChalit';

const near = (actual: number, expected: number, message: string, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${message}: ${actual} vs ${expected}`);

// Equal bhavas: the Lagna is the middle of the 1st, each next one thirty degrees on.
const equal = bhavaMadhyas(100, undefined, 'equal')!;
assert.deepEqual(equal.slice(0, 3), [100, 130, 160]);
assert.equal(equal[11], 70);
const equalSpans = bhavas(equal);
near(equalSpans[0].start, 85, 'the 1st starts 15° before the Lagna');
near(equalSpans[0].end, 115, 'and ends 15° after it');

// Śrīpati needs the Midheaven.
assert.equal(bhavaMadhyas(100, undefined, 'sripati'), null);

// Śrīpati (Porphyry): Lagna 100°, Midheaven 20° → IC 200°, Descendant 280°.
// 1 → 4 is 100° (cusps 2 and 3 at 133.33° and 166.67°), 4 → 7 is 80°, 7 → 10 is 100°, 10 → 1 is 80°.
const sripati = bhavaMadhyas(100, 20, 'sripati')!;
const expected = [100, 133.3333333333, 166.6666666667, 200, 226.6666666667, 253.3333333333, 280, 313.3333333333, 346.6666666667, 20, 46.6666666667, 73.3333333333];
expected.forEach((value, index) => near(sripati[index], value, `madhya ${index + 1}`, 1e-6));
// The angles are the madhyas of the 1st, 4th, 7th and 10th.
assert.equal(sripati[0], 100);
assert.equal(sripati[3], 200);
assert.equal(sripati[6], 280);
assert.equal(sripati[9], 20);

// The bhavas fill the circle without gaps or overlaps, and each holds its own madhya.
const spans = bhavas(sripati);
let total = 0;
spans.forEach((bhava, index) => {
  const next = spans[(index + 1) % 12];
  near(bhava.end, next.start, `the end of ${bhava.house} is the start of ${next.house}`);
  total += (((bhava.end - bhava.start) % 360) + 360) % 360;
  assert.equal(bhavaOf(bhava.madhya, spans), bhava.house, `madhya of ${bhava.house}`);
});
near(total, 360, 'the bhavas add to the whole circle', 1e-6);
// The 1st bhava runs from halfway to the 12th madhya (73.33°) to halfway to the 2nd (133.33°): 86.67° to 116.67°.
near(spans[0].start, 86.6666666667, 'start of the 1st', 1e-6);
near(spans[0].end, 116.6666666667, 'end of the 1st', 1e-6);
assert.equal(bhavaOf(86, spans), 12);
assert.equal(bhavaOf(87, spans), 1);
assert.equal(bhavaOf(116.5, spans), 1);
assert.equal(bhavaOf(117, spans), 2);
// Across 0°: the 9th bhava runs from 330° to 3.33° and the 10th, whose madhya is 20°, takes over from there.
assert.equal(bhavaOf(355, spans), 9);
assert.equal(bhavaOf(5, spans), 10);

// A chart placed by bhava: the Lagna is 100° (Cancer 10°), so a graha at 117° is in Cancer (house 1 of the rasi) but in the 2nd bhava.
const planet = (name: string, longitude: number): PlanetData => ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: 0 });
const chart = {
  ascendant: { sign: 4, degree: 10, longitude: 100 },
  midheaven: 20,
  planets: [planet('Sun', 117), planet('Moon', 100), planet('Mars', 86)],
};
const chalit = buildChalit(chart, 'sripati')!;
assert.deepEqual(chalit.planets.map(item => [item.name, item.rasiHouse, item.bhavaHouse, item.moved]), [
  ['Sun', 1, 2, true], ['Moon', 1, 1, false], ['Mars', 12, 12, false],
]);
// Mars at 86° is in Gemini (the 12th of the rasi) and still in the 12th bhava; the Sun moves forward.
assert.equal(buildChalit({ ...chart, midheaven: undefined }, 'sripati'), null);
assert.equal(buildChalit({ ...chart, midheaven: undefined }, 'equal')!.planets[0].bhavaHouse, 2, 'equal: 117° is past the sandhi at 115°');

console.log('Bhava Chalit tests passed');
