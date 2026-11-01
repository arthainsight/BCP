import assert from 'node:assert/strict';
import { DIGNITY_VERSE, LAGNA_PHALA_VERSES, dignityOf, lagnaPhalaReading } from './lagnaPhala';

// The text: 20 verses, in order, each with its Sanskrit in Devanagari and no stray characters.
assert.equal(LAGNA_PHALA_VERSES.length, 20);
assert.deepEqual(LAGNA_PHALA_VERSES.map(verse => verse.verse), Array.from({ length: 20 }, (_, index) => index + 1));
for (const verse of LAGNA_PHALA_VERSES) {
  assert.ok(verse.sanskrit.length >= 2 && verse.sanskrit.every(line => /[ऀ-ॿ]/.test(line)), `verse ${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse ${verse.verse} has stray characters`);
  assert.ok(verse.gloss.length > 20);
}

// Dignity: the Sun in Aries is exalted, in Libra in its fall, in Leo in its own sign; in Sagittarius (Jupiter's) a friend's sign, in Capricorn (Saturn's) an enemy's; Mars in Gemini (Mercury, an enemy)...
assert.equal(dignityOf('Sun', 1), 'exalted');
assert.equal(dignityOf('Sun', 7), 'debilitated');
assert.equal(dignityOf('Sun', 5), 'own');
assert.equal(dignityOf('Sun', 9), 'friend');
assert.equal(dignityOf('Sun', 10), 'enemy');
// Mercury is neutral toward Mars's... use Saturn in Cancer (the Moon: an enemy) and Jupiter in Aquarius (Saturn: neutral to Jupiter).
assert.equal(dignityOf('Saturn', 4), 'enemy');
assert.equal(dignityOf('Jupiter', 11), 'neutral');
assert.equal(DIGNITY_VERSE.exalted, 14);
assert.equal(DIGNITY_VERSE.neutral, 19);

// The reading: Leo lagna, the Moon in Taurus (exalted), Mars retrograde, the Sun with Mercury combust.
const reading = lagnaPhalaReading({
  ascendantSign: 5,
  planets: [
    { name: 'Sun', sign: 5, longitude: 130 }, { name: 'Moon', sign: 2, longitude: 40 },
    { name: 'Mercury', sign: 5, longitude: 134 }, { name: 'Mars', sign: 11, longitude: 305, isRetrograde: true },
    { name: 'Rahu', sign: 1, longitude: 10 },
  ],
});
assert.equal(reading.lagnaVerse, 5);
assert.equal(reading.moonVerse, 2);
const moon = reading.grahas.find(item => item.graha === 'Moon')!;
assert.equal(moon.dignity, 'exalted');
assert.equal(moon.verse, 14);
assert.equal(reading.grahas.find(item => item.graha === 'Sun')!.combust, false);
assert.equal(reading.grahas.find(item => item.graha === 'Mercury')!.combust, true);
assert.equal(reading.grahas.find(item => item.graha === 'Mars')!.retrograde, true);
// Rāhu is not in the chapter.
assert.equal(reading.grahas.find(item => item.graha === ('Rahu' as never)), undefined);
