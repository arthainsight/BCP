import assert from 'node:assert/strict';
import { BHAVA_GRAHAS, GRAHA_BHAVA_RESULTS, GRAHA_BHAVA_VERSES, grahaBhavaReading, verseFor, type GrahaBhavaContext } from './grahaBhavaPhala';

// The text: 35 verses, in order, each with its Sanskrit in Devanagari; 33 of them give a graha in its houses.
assert.equal(GRAHA_BHAVA_VERSES.length, 35);
assert.deepEqual(GRAHA_BHAVA_VERSES.map(verse => verse.verse), Array.from({ length: 35 }, (_, index) => index + 1));
for (const verse of GRAHA_BHAVA_VERSES) {
  assert.ok(verse.sanskrit.length >= 2 && verse.sanskrit.every(line => /[ऀ-ॿ]/.test(line)), `verse ${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9$]/.test(line)), `verse ${verse.verse} has stray characters`);
}
// Nine grahas, twelve houses each, and every house is covered by exactly one verse.
for (const graha of BHAVA_GRAHAS) for (let house = 1; house <= 12; house++) {
  assert.ok(GRAHA_BHAVA_RESULTS[graha][house].length > 10, `${graha} ${house}`);
  assert.equal(GRAHA_BHAVA_VERSES.filter(verse => verse.graha === graha && verse.houses.includes(house)).length, 1, `${graha} in the ${house}`);
}
assert.equal(GRAHA_BHAVA_VERSES.filter(verse => verse.graha !== null).length, 33);
assert.deepEqual(GRAHA_BHAVA_VERSES.filter(verse => verse.graha === null).map(verse => verse.verse), [34, 35]);
// The verse of the Sun in the 5th is 8.3; of Saturn in the 8th 8.23; of Ketu in the 12th 8.33.
assert.equal(verseFor('Sun', 5)?.verse, 3);
assert.equal(verseFor('Saturn', 8)?.verse, 23);
assert.equal(verseFor('Ketu', 12)?.verse, 33);

const context = (planets: [string, number, number][], ascendantSign: number, ascendantLongitude?: number, moonWaxing = true): GrahaBhavaContext =>
  ({ ascendantSign, ascendantLongitude, moonWaxing, planets: planets.map(([name, sign, degree]) => ({ name, sign, degree })) });

// Aries lagna at 12°: the Sun in Leo (the 5th) at 15°, Saturn in Capricorn (the 10th), Rāhu in the lagna.
const reading = grahaBhavaReading(context([['Sun', 5, 15], ['Saturn', 10, 3], ['Rahu', 1, 12], ['Moon', 1, 20]], 1, 12));
assert.equal(reading.middleDegree, 12);
const sun = reading.rows.find(row => row.graha === 'Sun')!;
assert.equal(sun.house, 5);
assert.equal(sun.verse, 3);
assert.ok(sun.result.includes('Without happiness, wealth and children'));
assert.equal(sun.fromMiddle, 3);
assert.equal(reading.rows.find(row => row.graha === 'Saturn')!.house, 10);
assert.equal(reading.rows.find(row => row.graha === 'Rahu')!.verse, 25);
// A graha missing from the chart has no row.
assert.equal(reading.rows.find(row => row.graha === 'Mars'), undefined);

// 8.1: the Sun in the lagna of Leo is night-blind; in a lagna that the verse does not name there is no variant.
assert.ok(grahaBhavaReading(context([['Sun', 5, 3]], 5, 10)).rows[0].variant?.includes('night-blind'));
assert.equal(grahaBhavaReading(context([['Sun', 3, 3]], 3, 10)).rows[0].variant, null);
// 8.5: the Moon in the lagna, waxing and waning.
assert.ok(grahaBhavaReading(context([['Moon', 1, 3]], 1, 10, true)).rows[0].variant?.includes('waxing'));
assert.ok(grahaBhavaReading(context([['Moon', 1, 3]], 1, 10, false)).rows[0].variant?.includes('waning'));
// 8.20: Saturn in the lagna in its own sign (Capricorn) or in another.
assert.ok(grahaBhavaReading(context([['Saturn', 10, 3]], 10, 10)).rows[0].variant?.includes('like a king'));
assert.ok(grahaBhavaReading(context([['Saturn', 4, 3]], 4, 10)).rows[0].variant?.includes('pained from childhood'));
// Without the longitude of the lagna there is no distance.
const noLongitude = grahaBhavaReading(context([['Sun', 5, 15]], 1));
assert.equal(noLongitude.middleDegree, null);
assert.equal(noLongitude.rows[0].fromMiddle, null);
