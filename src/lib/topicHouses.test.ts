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
  for (const verse of verses) assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0] + verse.sanskrit[1]) && (verse.iast?.[0].length ?? 0) > 5 && verse.gloss.length > 10);
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

// ── chapters 20 to 23 ──
for (const [chapter, count] of [[20, 32], [21, 22], [22, 11], [23, 14]] as const) {
  const verses = TOPIC_VERSES[chapter];
  assert.equal(verses.length, count);
  assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: count }, (_, index) => index + 1));
  for (const verse of verses) assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0] + verse.sanskrit[1]) && (verse.iast?.[0].length ?? 0) > 5 && verse.gloss.length > 10);
}
for (const result of evaluateTopic('houses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);

// 20.1: Aries lagna, the 9th lord Jupiter in the 9th (Sagittarius) and strong.
assert.equal(rule(chart(1, { Jupiter: [9] }, { Jupiter: 1.3 }), 'ninth-lord-strong').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [9] }), 'ninth-lord-strong').outcome.met, false);
// 20.4: the 9th lord Jupiter in the 10th (Capricorn is its debilitation: also met).
assert.equal(rule(chart(1, { Jupiter: [10] }), 'father-poor').outcome.met, true);
// 20.10: the 9th lord Jupiter in the 2nd (Taurus) and the 2nd lord Venus in the 9th.
assert.equal(rule(chart(1, { Jupiter: [2], Venus: [9] }), 'exchange-9-2').outcome.met, true);
// 20.14b-15a: the Sun in the 8th and the 8th lord Mars in the 9th: the first year.
const first = rule(chart(1, { Sun: [8], Mars: [9] }), 'father-year-1');
assert.equal(first.outcome.met, true);
assert.deepEqual(first.verses.map(verse => verse.verse), [14, 15]);
// 20.19b-20a: the 9th lord Jupiter in the 12th (Pisces) and the 12th lord (Jupiter) in the 9th: only if one graha, so an Aries lagna cannot; Taurus lagna: 9th Capricorn (Saturn), 12th Aries (Mars).
assert.equal(rule(chart(2, { Saturn: [1], Mars: [10] }), 'father-year-44').outcome.met, true);
// 20.17b-18a: Rāhu in the 4th and the Sun in the 5th.
assert.equal(rule(chart(1, { Rahu: [4], Sun: [5] }), 'father-year-16-18').outcome.met, true);

// 21.5: malefics in the 10th and 11th.
assert.equal(rule(chart(1, { Saturn: [10], Sun: [11] }), 'malefics-10-11').outcome.met, true);
// 21.8: the 10th lord Saturn exalted (Libra) with Jupiter, the 9th lord Jupiter in the 10th (Capricorn): Jupiter and Saturn cannot share Libra and Capricorn; check the parts: Saturn exalted.
assert.equal(rule(chart(1, { Saturn: [7], Jupiter: [7] }), 'tenth-lord-exalted-jupiter').outcome.met, false);
assert.equal(rule(chart(1, { Saturn: [10], Jupiter: [10] }), 'tenth-lord-exalted-jupiter').outcome.met, false);
// 21.13: a kendra lord in the 11th (the 4th lord Moon in Aquarius), the 11th lord Saturn in the lagna, Venus in the 10th.
assert.equal(rule(chart(1, { Moon: [11], Saturn: [1], Venus: [10] }), 'jewels').outcome.met, true);
// 21.3: the 10th lord's strength needs a value.
assert.equal(rule(chart(1, {}, { Saturn: 0.7 }), 'tenth-lord-weak').outcome.met, true);

// 22.8: the 11th lord (Saturn) in the lagna and the lagna lord (Mars) in the 11th (Aquarius).
assert.equal(rule(chart(1, { Saturn: [1], Mars: [11] }), 'exchange-11-1').outcome.met, true);
// 22.6: Jupiter in the 11th, the Moon in the 2nd, Venus in the 9th.
assert.equal(rule(chart(1, { Jupiter: [11], Moon: [2], Venus: [9] }), 'jupiter-11-moon-2-venus-9').outcome.met, true);

// 23.14: the lagna lord Mars in the 12th (Pisces), the 12th lord Jupiter in the lagna with Venus.
assert.equal(rule(chart(1, { Mars: [12], Jupiter: [1], Venus: [1] }), 'exchange-1-12-venus').outcome.met, true);
// 23.8 always lists the halves.
assert.ok(rule(chart(1), 'visible-half').outcome.lines[0].includes('Visible half'));
// 23.9: Rāhu in the 12th with Mars, Saturn and the Sun (the 12th lord Jupiter with the Sun).
assert.equal(rule(chart(1, { Rahu: [12], Mars: [12], Saturn: [12], Sun: [12], Jupiter: [12] }), 'rahu-12-hell').outcome.met, true);

const left2 = notEvaluatedVerses('houses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(!left2.includes('20.14'));
assert.ok(!left2.includes('23.14'));
assert.ok(left2.includes('21.16'));
