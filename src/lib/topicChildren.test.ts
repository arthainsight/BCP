import assert from 'node:assert/strict';
import { SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

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
const rule = (context: TopicContext, id: string) => evaluateTopic('children', context).find(result => result.rule.id === id)!;

// Chapter 83: 111 verses, in order, in Devanagari and IAST.
const verses = TOPIC_VERSES[83];
assert.equal(verses.length, 111);
assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: 111 }, (_, index) => index + 1));
for (const verse of verses) {
  assert.ok(verse.sanskrit.length === 2 && verse.sanskrit.every(line => /[ऀ-ॿ]/.test(line)), `verse ${verse.verse}`);
  assert.ok(verse.gloss.length > 10);
}
for (const result of evaluateTopic('children', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// The remedy verses come with the rule.
assert.deepEqual(rule(chart(1), 'c83-sarpa-9').verses.map(verse => verse.verse), [9, 17, 18, 19]);

// 83.7: all four without strength; with strength it is not met.
assert.equal(rule(chart(1), 'c83-general-weak').outcome.met, true);
assert.equal(rule(chart(1, {}, { Jupiter: 1.1, Mars: 1.1, Venus: 1.1, Sun: 1.1 }), 'c83-general-weak').outcome.met, false);
// 83.9: Rāhu in a sign of Mars.
assert.equal(rule(chart(1, { Rahu: [1] }), 'c83-sarpa-9').outcome.met, true);
assert.equal(rule(chart(1), 'c83-sarpa-9').outcome.met, false);
// 83.14: Sagittarius lagna: the 5th Aries, a sign of Mars; the 5th lord Mars with Rāhu.
assert.equal(rule(chart(9, { Rahu: [11] }), 'c83-sarpa-14').outcome.met, true);
// 83.20: Gemini lagna: the 5th Libra; the Sun at Libra 10° (the navāṁśa of Capricorn, Saturn), Saturn in Virgo and Mars in Scorpio on both sides.
assert.equal(rule(chart(3, { Sun: [7, 10], Mars: [8] }), 'c83-pitri-20').outcome.met, true);
assert.equal(rule(chart(3, { Sun: [7, 5], Mars: [8] }), 'c83-pitri-20').outcome.met, false);
// 83.22: Taurus lagna: Jupiter in Leo, the 5th lord Mercury with the Sun, the lagna and 5th seen by Mars.
assert.equal(rule(chart(2, { Jupiter: [5], Mercury: [12] }), 'c83-pitri-22').outcome.met, true);
// 83.44: Cancer lagna with Mars and Rāhu, the Moon and Saturn in the 5th (Scorpio).
assert.equal(rule(chart(4, { Mars: [4], Rahu: [4], Moon: [8], Saturn: [8] }), 'c83-matri-44').outcome.met, true);
assert.equal(rule(chart(4), 'c83-matri-44').outcome.met, false);
// 83.84: Taurus lagna: Venus in the 5th (Virgo), the 7th lord Mars in the 8th (Sagittarius), Jupiter with Saturn.
assert.equal(rule(chart(2, { Venus: [6], Mars: [9], Saturn: [8] }), 'c83-patni-84').outcome.met, true);
// 83.100: Rāhu in the lagna, Saturn in the 5th, Jupiter in the 8th (Scorpio, Aries lagna).
assert.equal(rule(chart(1, { Rahu: [1], Saturn: [5] }), 'c83-preta-100').outcome.met, true);
assert.equal(rule(chart(1, { Rahu: [1], Saturn: [5], Jupiter: [9] }), 'c83-preta-100').outcome.met, false);
// 83.99: the Sanskrit has Mars, Saturn and Mercury in the 5th.
assert.equal(rule(chart(3, { Mars: [7], Saturn: [7], Mercury: [7], Sun: [2], Rahu: [3], Venus: [10] }), 'c83-preta-99').outcome.met, true);
assert.equal(rule(chart(3, { Saturn: [7], Mercury: [7], Sun: [2], Rahu: [3], Venus: [10] }), 'c83-preta-99').outcome.met, false);

// What is not judged is listed.
const left = notEvaluatedVerses('children').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left.includes('83.13'));
assert.ok(left.includes('83.104'));
assert.ok(left.includes('83.1'));
assert.ok(!left.includes('83.9'));
assert.ok(!left.includes('83.17'));
