import assert from 'node:assert/strict';
import { SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { PHALA_VERSES } from './phalaVerses';

const body = (name: string, sign: number, degree = 10): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree });
const DEFAULT: Record<string, [number, number]> = {
  Sun: [12, 5], Moon: [2, 6], Mars: [11, 7], Mercury: [9, 8], Jupiter: [8, 9], Venus: [3, 10], Saturn: [6, 11], Rahu: [4, 12], Ketu: [10, 12],
};
const chart = (ascendantSign: number, moved: Record<string, [number, number?]> = {}, strong: Partial<Record<SevenGraha, number>> = {}): TopicContext => {
  const ratio: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) ratio[name] = strong[name] ?? 0.8;
  const planets = Object.entries(DEFAULT).map(([name, [sign, degree]]) => { const [s, d] = moved[name] ?? [sign, degree]; return body(name, s, d ?? degree); });
  return { planets, ascendantSign, ratio };
};
const rule = (context: TopicContext, id: string) => evaluateTopic('phalaHouses', context).find(result => result.rule.id === id)!;

// The verses of chapter 10: 15, in order, in Devanagari, with no stray characters.
const verses = PHALA_VERSES[10];
assert.equal(verses.length, 15);
assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: 15 }, (_, index) => index + 1));
for (const verse of verses) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse ${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse ${verse.verse} has stray characters`);
  assert.ok(verse.gloss.length > 20);
}
// The rules name verses that exist, and the verses come back with them.
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);

// 10.2: Aries lagna, the 7th lord Venus in the 5th (Leo): the wife is lost.
assert.equal(rule(chart(1, { Venus: [5] }), 'p10-7lord-5th').outcome.met, true);
assert.equal(rule(chart(1, { Venus: [6] }), 'p10-7lord-5th').outcome.met, false);
// 10.2: the 5th lord (Sun) in the 7th.
assert.equal(rule(chart(1, { Sun: [7] }), 'p10-5th-or-8th-lord-in-7th').outcome.met, true);
// 10.3: Venus in Scorpio in the 7th: the lagna Taurus has the 7th Scorpio.
assert.equal(rule(chart(2, { Venus: [8] }), 'p10-7th-sign-placements').outcome.met, true);
assert.equal(rule(chart(2, { Venus: [8] }), 'p10-7th-sign-placements').outcome.lines[0].includes('Venus in Scorpio'), true);
assert.equal(rule(chart(2, { Venus: [9] }), 'p10-7th-sign-placements').outcome.met, false);
// 10.3: Mars and Saturn in Cancer in the 7th (Capricorn lagna).
assert.equal(rule(chart(10, { Mars: [4], Saturn: [4] }), 'p10-mars-saturn-cancer').outcome.met, true);
// 10.4: the 7th lord debilitated: Aries lagna, Venus in Virgo.
assert.equal(rule(chart(1, { Venus: [6] }), 'p10-7th-afflicted').outcome.met, true);
// 10.8: the Moon with Saturn in the 7th.
assert.equal(rule(chart(1, { Moon: [7], Saturn: [7] }), 'p10-moon-saturn-7th').outcome.met, true);
// 10.9: strength needs a value; Taurus lagna, the 7th Scorpio (even), its lord Mars in an even sign (Taurus, Pisces...), Venus even.
assert.equal(rule(chart(2, { Mars: [12], Venus: [2], Mercury: [6], Sun: [9] }, { Mars: 1.2, Venus: 1.1, Mercury: 1.1 }), 'p10-even-signs').outcome.met, true);
assert.equal(rule(chart(2, { Mars: [12], Venus: [2], Mercury: [6], Sun: [9] }, { Mars: 0.8 }), 'p10-even-signs').outcome.met, false);
// 10.12: the direction is told for the signs of the 7th, the 7th lord and Venus.
const direction = rule(chart(1, { Venus: [5] }), 'p10-direction');
assert.equal(direction.outcome.met, true);
assert.ok(direction.outcome.lines[0].includes('Leo (east)'));
// 10.1: the 5th and 7th joined or seen by benefics: Jupiter in Cancer (aspects Scorpio, Pisces, Virgo) is no help to Leo; use Jupiter in Leo and Venus in Aries.
assert.equal(rule(chart(1, { Jupiter: [5], Venus: [1] }), 'p10-5th-7th-benefic').outcome.met, true);

// What is not judged is listed.
const left = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left.includes('10.11'));
assert.ok(left.includes('10.13'));
assert.ok(!left.includes('10.2'));

// ── chapter 11: the woman's chart ──
import { trimshamshaLord, WOMAN_BY_TRIMSHAMSHA } from './topicPhalaHouses';
const verses11 = PHALA_VERSES[11];
assert.equal(verses11.length, 11);
assert.deepEqual(verses11.map(verse => verse.verse), Array.from({ length: 11 }, (_, index) => index + 1));
for (const verse of verses11) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 11.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 11.${verse.verse} has stray characters`);
}
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// The trimshāṁśa lord: odd signs Mars 0-5, Saturn 5-10, Jupiter 10-18, Mercury 18-25, Venus 25-30; even signs the reverse.
assert.equal(trimshamshaLord(1, 3), 'Mars');
assert.equal(trimshamshaLord(1, 7), 'Saturn');
assert.equal(trimshamshaLord(1, 12), 'Jupiter');
assert.equal(trimshamshaLord(1, 20), 'Mercury');
assert.equal(trimshamshaLord(1, 29), 'Venus');
assert.equal(trimshamshaLord(2, 3), 'Venus');
assert.equal(trimshamshaLord(2, 8), 'Mercury');
assert.equal(trimshamshaLord(2, 15), 'Jupiter');
assert.equal(trimshamshaLord(2, 22), 'Saturn');
assert.equal(trimshamshaLord(2, 28), 'Mars');
// The table: seven rows of five.
assert.equal(Object.keys(WOMAN_BY_TRIMSHAMSHA).length, 7);
for (const row of Object.values(WOMAN_BY_TRIMSHAMSHA)) assert.equal(Object.keys(row).length, 5);
// 11.3: Mars in the 7th (Aries lagna: Libra) makes a widow.
assert.equal(rule(chart(1, { Mars: [7] }), 'p11-mars-7th').outcome.met, true);
// 11.1: a benefic in the 7th and no malefic other than its lord: Aries lagna, Jupiter in Libra; the 7th lord Venus.
assert.equal(rule(chart(1, { Jupiter: [7] }), 'p11-7th-good').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [7], Saturn: [7] }), 'p11-7th-good').outcome.met, false);
assert.equal(rule(chart(1, { Saturn: [7] }), 'p11-7th-bad').outcome.met, true);
// A malefic that is the lord of the house is not counted: Taurus lagna, the 8th is Sagittarius; Jupiter is benefic anyway; use Aries lagna, the 8th Scorpio, its lord Mars in Scorpio.
assert.equal(rule(chart(1, { Mars: [8] }), 'p11-8th-bad').outcome.met, false);
// 11.8: the trimshāṁśa of the Moon: the Moon at 12° of Aries is in Jupiter's: virtuous and rich.
const trim = rule(chart(1, { Moon: [1, 12] }), 'p11-trimshamsha-Moon');
assert.equal(trim.outcome.met, true);
assert.ok(trim.outcome.lines[0].includes('Jupiter: virtuous and rich'));
// The lagna's trimshāṁśa needs the longitude of the lagna.
assert.equal(rule(chart(1), 'p11-trimshamsha-lagna').outcome.met, null);
// 11.9: the Moon in Jyeṣṭhā (nakṣatra 18: 226°40' to 240°, Scorpio 16°40' to 30°): Scorpio 20°.
assert.equal(rule(chart(1, { Moon: [8, 20] }), 'p11-nakshatra-kin').outcome.met, true);
assert.equal(rule(chart(1, { Moon: [2, 6] }), 'p11-nakshatra-kin').outcome.met, false);
const left11 = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left11.includes('11.11'));
assert.ok(!left11.includes('11.3'));

// ── chapter 12: children ──
import { navamshaSign } from './birthConditions';
const verses12 = PHALA_VERSES[12];
assert.equal(verses12.length, 34);
assert.deepEqual(verses12.map(verse => verse.verse), Array.from({ length: 34 }, (_, index) => index + 1));
for (const verse of verses12) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 12.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 12.${verse.verse} has stray characters`);
}
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// 12.3: the 5th Leo (Aries lagna): a sign of few sons; Gemini lagna: Libra, not.
assert.equal(rule(chart(1), 'p12-alpasuta-5th').outcome.met, true);
assert.equal(rule(chart(3), 'p12-alpasuta-5th').outcome.met, false);
// 12.3: the Sun in Leo, its own sign, in the 5th.
assert.equal(rule(chart(1, { Sun: [5] }), 'p12-malefic-own-5th').outcome.met, true);
assert.equal(rule(chart(1), 'p12-malefic-own-5th').outcome.met, false);
// 12.3 (the Sanskrit): Taurus lagna: the 5th Virgo, a sign of Mercury, with Saturn in it.
assert.equal(rule(chart(2), 'p12-benefic-sign-malefic').outcome.met, true);
assert.equal(rule(chart(2, { Saturn: [7] }), 'p12-benefic-sign-malefic').outcome.met, false);
// 12.5: the 5th Cancer (Pisces lagna) with Saturn: many sons.
const cancer = rule(chart(12, { Saturn: [4] }), 'p12-cancer-5th');
assert.equal(cancer.outcome.met, true);
assert.ok(cancer.outcome.lines[0].includes('many sons'));
// 12.6: malefics in the 12th, 8th, 5th and lagna (Aries lagna).
assert.equal(rule(chart(1, { Mars: [8], Saturn: [5], Rahu: [1] }), 'p12-lineage-ends').outcome.met, true);
assert.equal(rule(chart(1), 'p12-lineage-ends').outcome.met, false);
// 12.7: a malefic in the lagna, the lagna lord in the 5th, the 5th lord in the 3rd, the Moon in the 4th.
assert.equal(rule(chart(1, { Rahu: [1], Mars: [5], Sun: [3], Moon: [4] }), 'p12-sonless').outcome.met, true);
// 12.8: the 5th Gemini (Aquarius lagna) with Saturn in it.
assert.equal(rule(chart(11, { Saturn: [3] }), 'p12-adopted-son').outcome.met, true);
// 12.9: the 5th lord (the Sun for Aries) in its fall.
assert.equal(rule(chart(1, { Sun: [7] }), 'p12-5th-lord-lost').outcome.met, true);
assert.equal(rule(chart(1), 'p12-5th-lord-lost').outcome.met, false);
// 12.14: the sum of the longitudes of Jupiter, the Moon and Mars; the sign and the navāṁśa decide which of the two rules holds.
const sum = (8 * 30 - 30 + 9 + 30 + 6 + 10 * 30 + 7) % 360;
const parity = [Math.floor(sum / 30) + 1, navamshaSign(sum)].map(value => value % 2);
const strongField = parity[0] === 0 && parity[1] === 0; const mixedField = parity[0] !== parity[1];
assert.equal(rule(chart(1), 'p12-field-woman').outcome.met, strongField);
assert.equal(rule(chart(1), 'p12-field-woman-effort').outcome.met, mixedField);
// 12.22: Rāhu in the 5th with the 5th lord; Ketu in the 5th.
assert.equal(rule(chart(1, { Rahu: [5], Sun: [5] }), 'p12-serpent-curse').outcome.met, true);
assert.equal(rule(chart(1, { Ketu: [5] }), 'p12-brahmin-curse').outcome.met, true);
const left12 = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left12.includes('12.12'));
assert.ok(left12.includes('12.34'));
assert.ok(!left12.includes('12.2'));
