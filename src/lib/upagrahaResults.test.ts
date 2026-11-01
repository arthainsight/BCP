import assert from 'node:assert/strict';
import { UPAGRAHA_BODIES, UPAGRAHA_CLOSE, UPAGRAHA_VERSES, upagrahaReadings, upagrahaVerse } from './upagrahaResults';

// 84 verses: seven bodies in twelve houses once each, verses 2-85 in order; two verses close the chapter.
assert.equal(UPAGRAHA_VERSES.length, 84);
assert.deepEqual(UPAGRAHA_VERSES.map(verse => verse.verse), Array.from({ length: 84 }, (_, index) => index + 2));
assert.equal(new Set(UPAGRAHA_VERSES.map(verse => `${verse.body}-${verse.house}`)).size, 84);
assert.deepEqual(UPAGRAHA_CLOSE.map(verse => verse.verse), [86, 87]);
for (const verse of UPAGRAHA_VERSES) {
  assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0]) && /[ऀ-ॿ]/.test(verse.sanskrit[1]) && verse.iast[0].length > 5 && verse.gloss.length > 10, `verse ${verse.verse}`);
}
// The text names the body in the verse: the block of twelve for each body is the block of that body.
const NAMES: Record<string, RegExp> = {
  Dhuma: /dh[ūu]m/i, Pata: /p[āa]t/i, Paridhi: /paridh/i, Chapa: /(c[āa]p|k[āa]rmuk|dhanu)/i, Ketu: /(ketu|dhvaj|[śs]ikhi)/i, Gulika: /(gulik|yam[āa]tmaj)/i, Pranapada: /pr[āa][ṇn]/i,
};
for (const verse of UPAGRAHA_VERSES) {
  assert.ok(NAMES[verse.body].test(`${verse.iast[0]} ${verse.iast[1]}`), `verse ${verse.verse} names ${verse.body}`);
}
// The seven bodies and the keys of the app.
assert.deepEqual(UPAGRAHA_BODIES.map(item => item.pointKey), ['Dh', 'Vy', 'Pa', 'In', 'Uk', 'Gu', 'PP']);
assert.equal(upagrahaVerse('Dhuma', 1).verse, 2);
assert.equal(upagrahaVerse('Gulika', 7).verse, 68);
assert.equal(upagrahaVerse('Pranapada', 12).verse, 85);
assert.throws(() => upagrahaVerse('Dhuma', 13));

// A chart: Aries Lagna, Gulika in Libra (the 7th), Dhūma in Aries 10° (the 1st), Prāṇapada in Pisces (the 12th).
const readings = upagrahaReadings([{ pointKey: 'Gu', longitude: 190 }, { pointKey: 'Dh', longitude: 10 }, { pointKey: 'PP', longitude: 345 }], 1);
assert.deepEqual(readings.map(reading => [reading.body, reading.house, reading.verse.verse]), [['Dhuma', 1, 2], ['Gulika', 7, 68], ['Pranapada', 12, 85]]);
assert.equal(readings[1].sign, 7);
assert.equal(Math.round(readings[1].degree), 10);
// Points that are not given are left out; a longitude past 360 wraps.
assert.equal(upagrahaReadings([], 1).length, 0);
assert.equal(upagrahaReadings([{ pointKey: 'Dh', longitude: 370 }], 1)[0].sign, 1);
