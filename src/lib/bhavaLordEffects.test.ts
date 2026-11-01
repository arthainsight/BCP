import assert from 'node:assert/strict';
import { BHAVA_LORD_RULES, BHAVA_LORD_VERSES, bhavaLordReadings, bhavaLordVerse } from './bhavaLordEffects';

// 144 verses, 12 lords in 12 houses each, once each; then four verses of rules.
assert.equal(BHAVA_LORD_VERSES.length, 144);
assert.deepEqual(BHAVA_LORD_VERSES.map(verse => verse.verse), Array.from({ length: 144 }, (_, index) => index + 1));
const pairs = new Set(BHAVA_LORD_VERSES.map(verse => `${verse.lordOf}-${verse.inHouse}`));
assert.equal(pairs.size, 144, 'each lord in each house once');
assert.deepEqual(BHAVA_LORD_RULES.map(rule => rule.verse), [145, 146, 147, 148]);
for (const verse of BHAVA_LORD_VERSES) {
  assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0]) && /[ऀ-ॿ]/.test(verse.sanskrit[1]), `verse ${verse.verse} is in Devanagari`);
  assert.ok(verse.iast[0].length > 5 && verse.iast[1].length > 5);
  assert.ok(verse.gloss.length > 10);
}

// The text names the lord and the house in its first words; they must agree with the place of the verse.
const LORD_WORDS: Record<number, string[]> = {
  1: ['lagneśe'], 2: ['dhaneśe'], 3: ['sahajādhīśe', 'trtīyeśe'], 4: ['sukheśe'], 5: ['suteśe'], 6: ['ṣaṣṭheśe'], 7: ['dāreśe'],
  8: ['aṣṭameśe', 'randhreśe'], 9: ['bhāgyeśe', 'bhāgyeśo'], 10: ['karmeśe', 'rājyeśe'], 11: ['lābheśe', 'labheśe'], 12: ['vyayeśe'],
};
const HOUSE_STEMS: Record<number, string[]> = {
  1: ['lagna', 'tanau'], 2: ['dhan', 'dvitīy'], 3: ['sahaj', 'bhrātṛbhāva'], 4: ['sukh', 'turya'], 5: ['sut', 'putr', 'pañcam'], 6: ['ṣaṣṭh', 'ripu', 'rog'], 7: ['saptam', 'dār'],
  8: ['ṣṭam', 'randhr', 'mṛtyu'], 9: ['bhāgy', 'dharm', 'tapaḥ', 'navam'], 10: ['karm', 'rājy', 'daśam'], 11: ['lābh', 'labh'], 12: ['vyay'],
};
for (const verse of BHAVA_LORD_VERSES) {
  const text = verse.iast[0].replace(/^\d+\.\s*/, '');
  const lordWord = LORD_WORDS[verse.lordOf].find(word => text.includes(word));
  assert.ok(lordWord, `verse ${verse.verse}: the lord of the ${verse.lordOf}th is named`);
  const rest = text.replace(lordWord!, ' ');
  let best: { house: number; at: number } | null = null;
  for (const [house, stems] of Object.entries(HOUSE_STEMS)) {
    for (const stem of stems) {
      const at = rest.indexOf(stem);
      if (at >= 0 && (!best || at < best.at)) best = { house: Number(house), at };
    }
  }
  // Verse 37 reads dhanage (the 2nd), as verse 38 does; it is placed in the 1st by the order, and says so.
  const expected = verse.verse === 37 ? 2 : verse.inHouse;
  assert.equal(best?.house, expected, `verse ${verse.verse}: the house named in the text`);
}
assert.ok(bhavaLordVerse(4, 1).note?.includes('dhanage'));
assert.equal(bhavaLordVerse(4, 1).verse, 37);
assert.equal(BHAVA_LORD_VERSES.filter(verse => verse.note).length, 1, 'only verse 37 is irregular');
assert.equal(bhavaLordVerse(1, 1).verse, 1);
assert.equal(bhavaLordVerse(12, 12).verse, 144);
assert.equal(bhavaLordVerse(7, 3).verse, 75);
assert.throws(() => bhavaLordVerse(13, 1));

// A chart: Aries Lagna, Mars in Cancer (the 4th). The lord of the 1st and of the 8th is Mars: the verses 1.. (lord of the 1st in the 4th = 4) and (the 8th in the 4th = 88).
const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((name, index) => ({ name, sign: name === 'Mars' ? 4 : ((index * 5) % 12) + 1 }));
const readings = bhavaLordReadings(planets, 1);
assert.equal(readings.length, 12);
const first = readings.find(reading => reading.house === 1)!;
assert.equal(first.lord, 'Mars');
assert.equal(first.inHouse, 4);
assert.equal(first.verse.verse, 4);
assert.equal(first.alsoLordOf, 8);
assert.equal(first.alsoVerse!.verse, 88, 'a lord of two signs gives the effect of both (24.146)');
const eighth = readings.find(reading => reading.house === 8)!;
assert.equal(eighth.verse.verse, 88);
assert.equal(eighth.alsoLordOf, 1);
// The Sun and the Moon have one house each.
assert.equal(readings.find(reading => reading.lord === 'Sun')!.alsoLordOf, null);
// The order of the houses: the lord of the 2nd for Aries is Venus (Taurus).
assert.equal(readings.find(reading => reading.house === 2)!.lord, 'Venus');
