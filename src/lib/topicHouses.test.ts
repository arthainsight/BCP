import assert from 'node:assert/strict';
import { SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

const body = (name: string, sign: number, degree = 10, isRetrograde = false): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, isRetrograde });
/** A quiet default chart: nothing of the rules is met by it. Planets are moved by name. */
const DEFAULT: Record<string, [number, number]> = {
  Sun: [12, 5], Moon: [2, 6], Mars: [11, 7], Mercury: [9, 8], Jupiter: [8, 9], Venus: [3, 10], Saturn: [6, 11], Rahu: [4, 12], Ketu: [10, 12],
};
const chart = (ascendantSign: number, moved: Record<string, [number, number?]> = {}, strong: Partial<Record<SevenGraha, number>> = {}, ascendantLongitude?: number): TopicContext => {
  const ratio: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) ratio[name] = strong[name] ?? 0.8;
  const planets = Object.entries(DEFAULT).map(([name, [sign, degree]]) => { const [s, d] = moved[name] ?? [sign, degree]; return body(name, s, d ?? degree); });
  return { planets, ascendantSign, ratio, ascendantLongitude };
};
const rule = (context: TopicContext, id: string) => evaluateTopic('houses', context).find(result => result.rule.id === id)!;

// The verses: chapters 12 (15), 13 (13), 14 (15), 15 (14) and 16 (32), each in Devanagari with two half-verses.
for (const [chapter, count] of [[12, 15], [13, 13], [14, 15], [15, 14], [16, 32]] as const) {
  const verses = TOPIC_VERSES[chapter];
  assert.equal(verses.length, count);
  assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: count }, (_, index) => index + 1));
  for (const verse of verses) assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0] + verse.sanskrit[1]) && verse.iast[0].length > 5 && verse.gloss.length > 10);
}
for (const result of evaluateTopic('houses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);

// 12.1: Aries lagna, the lagna lord Mars with Saturn in the 6th (Virgo) with malefics; and in a kendra (Cancer).
assert.equal(rule(chart(1, { Mars: [6], Saturn: [6] }), 'lagna-lord-trika-malefic').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [6], Saturn: [12] }), 'lagna-lord-trika-malefic').outcome.met, false);
assert.equal(rule(chart(1, { Mars: [4] }), 'lagna-lord-kendra-trikona').outcome.met, true);
// 12.2: the lagna lord debilitated (Mars in Cancer) makes disease.
const weak = rule(chart(1, { Mars: [4] }), 'lagna-lord-weak');
assert.equal(weak.outcome.met, true);
assert.ok(weak.outcome.lines[0].includes('debilitated'));
// 12.6: the lagna lord in a movable sign seen by a benefic: Mars in Cancer, Venus in Capricorn (7th).
assert.equal(rule(chart(1, { Mars: [4], Venus: [10] }), 'lagna-lord-movable').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [5], Venus: [11] }), 'lagna-lord-movable').outcome.met, false);
// 12.12-14: the limbs need the longitude of the lagna.
assert.equal(rule(chart(1), 'drekkana-limbs').outcome.met, null);
assert.ok(rule(chart(1, {}, {}, 25), 'drekkana-limbs').outcome.lines[0].includes('bladder'));

// 13.3: Jupiter in the 2nd (Taurus) makes a wealthy man.
assert.equal(rule(chart(1, { Jupiter: [2] }), 'wealthy-2nd-jupiter-mars').outcome.met, true);
// 13.2: a benefic in the 2nd; a malefic in the 2nd.
assert.equal(rule(chart(1, { Venus: [2] }), 'benefic-in-2nd').outcome.met, true);
assert.equal(rule(chart(1, { Saturn: [2] }), 'malefic-in-2nd').outcome.met, true);
// 13.10: the 2nd lord Venus in its own sign (Libra).
assert.equal(rule(chart(1, { Venus: [7] }), 'second-lord-dignified').outcome.met, true);
assert.equal(rule(chart(1, { Venus: [1] }), 'second-lord-dignified').outcome.met, false);

// 14.2: Mars in the 3rd (Gemini); 14.14: the Sun and Saturn in the 3rd.
assert.equal(rule(chart(1, { Mars: [3] }), 'third-lord-mars').outcome.met, true);
assert.equal(rule(chart(1, { Sun: [3], Saturn: [3] }), 'elder-younger').outcome.met, true);
// 14.12: Mars with Jupiter and the Moon in the 3rd.
assert.equal(rule(chart(1, { Mars: [8], Jupiter: [8], Moon: [3] }), 'seven-siblings').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [8], Jupiter: [9], Moon: [3] }), 'seven-siblings').outcome.met, false);

// 15.2: Cancer (4th of Aries) with the Moon (the 4th lord) in it and Jupiter in Scorpio (aspects Cancer by its 9th) seeing it.
assert.equal(rule(chart(1, { Moon: [4], Jupiter: [8] }), 'fourth-home-happiness').outcome.met, true);
// 15.9: Libra lagna's 4th is Capricorn (movable) with its lord Saturn in it, Mars in the 6th (Pisces).
assert.equal(rule(chart(7, { Saturn: [10], Mars: [12] }), 'muteness').outcome.met, true);
assert.equal(rule(chart(7, { Saturn: [10], Mars: [1] }), 'muteness').outcome.met, false);
// 15.8: Saturn and the Sun in the 4th, the Moon in the 9th, Mars in the 11th.
assert.equal(rule(chart(1, { Saturn: [4], Sun: [4], Moon: [9], Mars: [11] }), 'cattle').outcome.met, true);

// 16.2: the 5th lord (Sun for Aries) in the 6th: childlessness; in a kendra: happiness.
assert.equal(rule(chart(1, { Sun: [6] }), 'childless-5th-lord-trika').outcome.met, true);
assert.equal(rule(chart(1, { Sun: [4] }), 'children-happiness').outcome.met, true);
// 16.3: the 5th lord combust (Sun lord itself is never combust); use Taurus lagna: the 5th is Virgo, its lord Mercury; Mercury close to the Sun.
const combust = rule(chart(2, { Sun: [9, 10], Mercury: [9, 12] }), 'no-son');
assert.equal(combust.outcome.met, true);
assert.ok(combust.outcome.lines[0].includes('combust'));
// 16.10: the Sun and Moon in one sign and one navāṁśa.
assert.equal(rule(chart(1, { Sun: [3, 1], Moon: [3, 2] }), 'raised-by-three-mothers').outcome.met, true);
assert.equal(rule(chart(1, { Sun: [3, 1], Moon: [3, 10] }), 'raised-by-three-mothers').outcome.met, false);
// 16.28-29: the 2nd lord (Venus) and the 5th lord (Sun) in the 5th: six sons.
assert.equal(rule(chart(1, { Venus: [5], Sun: [5] }), 'six-sons').outcome.met, true);
// 16.32: the lagna lord Mars in the 2nd and the 5th lord Sun with Mars.
assert.equal(rule(chart(1, { Mars: [2], Sun: [2] }), 'children-die').outcome.met, true);
// 16.26-27: Jupiter in the 5th, the 5th lord strong, the 2nd lord Venus in the 10th: eight sons; the strength needs a value.
assert.equal(rule(chart(1, { Jupiter: [5], Venus: [10] }, { Sun: 1.2 }), 'eight-sons').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [5], Venus: [10] }), 'eight-sons').outcome.met, false);

// What is not judged is listed: 12.9 (twins) needs more than the verse gives; 14.1 is judged.
const left = notEvaluatedVerses('houses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left.includes('12.9'));
assert.ok(left.includes('13.12'));
assert.ok(!left.includes('14.1'));
assert.ok(!left.includes('16.32'));
