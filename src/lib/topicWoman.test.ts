import assert from 'node:assert/strict';
import { SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

const body = (name: string, sign: number, degree = 10): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree });
const DEFAULT: Record<string, [number, number]> = {
  Sun: [12, 5], Moon: [2, 6], Mars: [11, 7], Mercury: [9, 8], Jupiter: [8, 9], Venus: [3, 10], Saturn: [6, 11], Rahu: [4, 12], Ketu: [10, 12],
};
const chart = (ascendantSign: number, moved: Record<string, [number, number?]> = {}, strong: Partial<Record<SevenGraha, number>> = {}, ascendantLongitude?: number): TopicContext => {
  const ratio: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) ratio[name] = strong[name] ?? 0.8;
  const planets = Object.entries(DEFAULT).map(([name, [sign, degree]]) => { const [s, d] = moved[name] ?? [sign, degree]; return body(name, s, d ?? degree); });
  return { planets, ascendantSign, ratio, ascendantLongitude };
};
const rule = (context: TopicContext, id: string) => evaluateTopic('woman', context).find(result => result.rule.id === id)!;

// Chapter 80: 55 verses, in order, in Devanagari.
const verses = TOPIC_VERSES[80];
assert.equal(verses.length, 55);
assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: 55 }, (_, index) => index + 1));
for (const verse of verses) assert.ok(verse.gloss.length > 10, `verse ${verse.verse}`);
for (const result of evaluateTopic('woman', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);

// 80.18: Mars in the 7th (Aries lagna: Libra).
assert.equal(rule(chart(1, { Mars: [7] }), 'w80-7th-sun-mars').outcome.met, true);
assert.equal(rule(chart(1), 'w80-7th-sun-mars').outcome.met, false);
// 80.19: benefics alone in the 7th, malefics alone, both.
assert.ok(rule(chart(1, { Jupiter: [7] }), 'w80-7th-occupants').outcome.lines[0].includes('chaste'));
assert.ok(rule(chart(1, { Saturn: [7] }), 'w80-7th-occupants').outcome.lines[0].includes('a widow'));
assert.ok(rule(chart(1, { Saturn: [7], Jupiter: [7] }), 'w80-7th-occupants').outcome.lines[0].includes('marries again'));
// 80.21: the lagna Taurus (Venus).
assert.equal(rule(chart(2), 'w80-lagna-venus-saturn').outcome.met, true);
assert.equal(rule(chart(1), 'w80-lagna-venus-saturn').outcome.met, false);
// 80.22-25: the 7th of Aries lagna is Libra, a sign of Venus: fortunate and loving; the navāṁśa needs the lagna longitude.
assert.ok(rule(chart(1), 'w80-7th-husband').outcome.lines[0].includes('fortunate'));
assert.equal(rule(chart(1), 'w80-7th-husband').outcome.lines.length, 1);
assert.equal(rule(chart(1, {}, {}, 10), 'w80-7th-husband').outcome.lines.length, 2);
// 80.26-33: a graha in the 8th (Aries lagna: Scorpio).
assert.equal(rule(chart(1, { Sun: [8] }), 'w80-8th-graha').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [9] }), 'w80-8th-graha').outcome.met, false);
// 80.47: Mars in the 7th without a benefic joining or seeing; Jupiter in the same sign cancels it.
assert.equal(rule(chart(1, { Mars: [7] }), 'w80-mars-kills-husband').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [7], Jupiter: [7] }), 'w80-mars-kills-husband').outcome.met, false);
// 80.54: Mercury in the 8th alone.
assert.equal(rule(chart(1, { Mercury: [8], Saturn: [5] }), 'w80-mercury-8th').outcome.met, true);
// 80.41: Venus and Jupiter in the 8th.
assert.equal(rule(chart(1, { Venus: [8], Jupiter: [8] }), 'w80-miscarriage').outcome.met, true);
// 80.37: the three in the lagna.
assert.equal(rule(chart(1, { Moon: [1], Mercury: [1], Venus: [1] }), 'w80-moon-mercury-venus-lagna').outcome.met, true);
// 80.52: strength needs a value.
assert.equal(rule(chart(2, {}, { Mars: 1.1, Mercury: 1.1, Jupiter: 1.1, Venus: 1.1 }), 'w80-learned').outcome.met, true);
assert.equal(rule(chart(2), 'w80-learned').outcome.met, false);

// What is not judged is listed.
const left = notEvaluatedVerses('woman').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left.includes('80.43'));
assert.ok(!left.includes('80.18'));
