import assert from 'node:assert/strict';
import { SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

const body = (name: string, sign: number, degree = 10, isRetrograde = false): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, isRetrograde });
/** A quiet default chart: nothing of the rules is met by it. Planets are moved by name. */
const DEFAULT: Record<string, [number, number]> = {
  Sun: [12, 5], Moon: [2, 6], Mars: [11, 7], Mercury: [9, 8], Jupiter: [8, 9], Venus: [3, 10], Saturn: [6, 11], Rahu: [4, 12], Ketu: [10, 12],
};
const chart = (ascendantSign: number, moved: Record<string, [number, number?]> = {}, strong: Partial<Record<SevenGraha, number>> = {}, retro: string[] = []): TopicContext => {
  const ratio: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) ratio[name] = strong[name] ?? 0.8;
  const planets = Object.entries(DEFAULT).map(([name, [sign, degree]]) => { const [s, d] = moved[name] ?? [sign, degree]; return body(name, s, d ?? degree, retro.includes(name)); });
  return { planets, ascendantSign, ratio };
};
const rule = (context: TopicContext, id: string) => evaluateTopic('illness', context).find(result => result.rule.id === id)!;

// The verses: chapters 17 (28), 9 (45) and 10 (9), each in Devanagari with two half-verses.
for (const [chapter, count] of [[17, 28], [9, 45], [10, 9]] as const) {
  const verses = TOPIC_VERSES[chapter];
  assert.equal(verses.length, count);
  assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: count }, (_, index) => index + 1));
  for (const verse of verses) assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0] + verse.sanskrit[1]) && verse.iast[0].length > 5 && verse.gloss.length > 10);
}
for (const result of evaluateTopic('illness', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);

// 17.2: Aries lagna, the 6th is Virgo and its lord Mercury; Mercury in Gemini (its own sign) is met, in Pisces not (it is not the 8th: that is Scorpio).
const wound = rule(chart(1, { Mercury: [3] }), 'wound-6th-lord');
assert.equal(wound.outcome.met, true);
assert.ok(wound.outcome.lines[0].includes('the waist'));
assert.equal(rule(chart(1, { Mercury: [12] }), 'wound-6th-lord').outcome.met, false);
assert.equal(rule(chart(1, { Mercury: [8] }), 'wound-6th-lord').outcome.met, true);

// 17.6: Aries lagna, Mars in Aries... Mars (lagna lord) in Gemini (a sign of Mercury), Mercury in Libra aspects Aries but not Gemini: use Mercury in Sagittarius (the 7th from Gemini).
assert.equal(rule(chart(1, { Mars: [3], Mercury: [9] }), 'face-lagna-lord').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [3], Mercury: [10] }), 'face-lagna-lord').outcome.met, false);

// 17.7: the lagna lord Mars with the Moon, Rāhu and Saturn.
assert.equal(rule(chart(1, { Mars: [5], Moon: [5], Rahu: [5], Saturn: [5] }), 'leprosy-lagna-lord').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [5], Moon: [5], Rahu: [5] }), 'leprosy-lagna-lord').outcome.met, false);

// 17.8-9: the Moon in the lagna with Rāhu and without Mars (the lagna lord of Aries): white leprosy.
const white = rule(chart(1, { Moon: [1], Rahu: [1] }), 'leprosy-moon-lagna');
assert.equal(white.outcome.met, true);
assert.ok(white.outcome.lines[0].includes('white leprosy'));
// With the lagna lord (Mars) there as well the verse does not apply.
assert.equal(rule(chart(1, { Moon: [1], Rahu: [1], Mars: [1] }), 'leprosy-moon-lagna').outcome.met, false);

// 17.9-11: Aries lagna, the 6th lord Mercury and the 8th lord Mars with the Sun in the lagna; Venus there too.
const boils = rule(chart(1, { Mercury: [1], Mars: [1], Sun: [1], Venus: [1] }), 'boils-6-8-sun');
assert.equal(boils.outcome.met, true);
assert.ok(boils.outcome.lines[0].includes('Venus: disease from women'));
assert.equal(rule(chart(1, { Mercury: [1], Mars: [1] }), 'boils-6-8-sun').outcome.met, false);

// 17.14: Saturn with Rāhu.
assert.equal(rule(chart(1, { Saturn: [4], Rahu: [4] }), 'saturn-rahu').outcome.met, true);
// 17.19: the lagna lord in the lagna, Saturn with the Sun (an enemy).
assert.equal(rule(chart(1, { Mars: [1], Saturn: [12], Sun: [12] }), 'red-leprosy-55').outcome.met, true);
// 17.26: Aries lagna, the 11th lord Saturn in Virgo (6th), the 6th lord Mercury in Aquarius (11th).
assert.equal(rule(chart(1, { Saturn: [6], Mercury: [11] }), 'enemies-11-6').outcome.met, true);

// 9.3: the Moon in the 8th (Scorpio for Aries) seen by Saturn from Taurus? Saturn in Pisces 8th... Saturn aspects 3rd, 7th, 10th: from Taurus (2) the 7th is Scorpio.
const dusthana = rule(chart(1, { Moon: [8], Saturn: [2] }), 'moon-dusthana');
assert.equal(dusthana.outcome.met, true);
assert.ok(dusthana.outcome.lines[0].includes('Saturn'));
assert.equal(rule(chart(1, { Moon: [8], Saturn: [12], Venus: [4] }), 'moon-dusthana').outcome.met, false);

// 9.5: the Sun, Saturn, the Moon and Mars in the 5th (Leo).
assert.equal(rule(chart(1, { Sun: [5], Saturn: [5], Moon: [5], Mars: [5] }), 'mother-brother-5th').outcome.met, true);
assert.equal(rule(chart(1, { Sun: [5], Saturn: [5], Moon: [5] }), 'mother-brother-5th').outcome.met, false);

// 9.19: the Moon in the lagna between two malefics (the 12th and 2nd).
const hemmed = rule(chart(1, { Moon: [1], Sun: [12], Mars: [2] }), 'moon-hemmed');
assert.equal(hemmed.outcome.met, true);
assert.equal(rule(chart(1, { Moon: [1], Sun: [12], Jupiter: [2], Mars: [3] }), 'moon-hemmed').outcome.met, false);

// 9.21: Saturn in the 12th, the Sun in the 9th, Mars in the 8th; a benefic aspect cancels it (Jupiter in Cancer sees Scorpio by its 5th).
assert.equal(rule(chart(1, { Saturn: [12], Sun: [9], Mars: [8], Jupiter: [5], Venus: [4], Moon: [3], Mercury: [4] }), 'saturn-12-sun-9-mars-8').outcome.met, false);
assert.equal(rule(chart(1, { Saturn: [12], Sun: [9], Mars: [8], Jupiter: [10], Venus: [5], Moon: [5], Mercury: [5] }), 'saturn-12-sun-9-mars-8').outcome.met, true);

// 9.23 needs the strength of every graha: a missing one cannot be judged.
const all = chart(1, { Sun: [3], Moon: [6], Mars: [9], Mercury: [12], Jupiter: [3], Venus: [6], Saturn: [9] });
assert.equal(rule(all, 'all-apoklima-weak').outcome.met, true);
assert.equal(rule({ ...all, ratio: { Sun: 0.5 } }, 'all-apoklima-weak').outcome.met, null);

// 9.38: Mars in the 10th (Capricorn is its exaltation: not an enemy sign); in Libra-lagna's 10th (Cancer) it is debilitated, an enemy sign? Cancer is the Moon's, a friend: use Gemini lagna, 10th Pisces (Jupiter's, a friend); Virgo lagna 10th Gemini (Mercury's, an enemy).
assert.equal(rule(chart(6, { Mars: [3] }), 'mars-10th-enemy').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [10] }), 'mars-10th-enemy').outcome.met, false);

// 10.2: one of Mercury, Jupiter, Venus in a kendra; none in the default (Mercury 9th, Jupiter 8th, Venus 3rd for Aries).
assert.equal(rule(chart(1), 'benefic-kendra').outcome.met, false);
assert.equal(rule(chart(1, { Jupiter: [4] }), 'benefic-kendra').outcome.met, true);
// 10.3: Jupiter in the lagna needs its strength.
assert.equal(rule(chart(1, { Jupiter: [1] }, { Jupiter: 1.3 }), 'jupiter-lagna').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [1] }), 'jupiter-lagna').outcome.met, false);
// 10.6: a Libra lagna with the Sun in the 12th (Virgo).
assert.equal(rule(chart(7, { Sun: [6] }), 'libra-sun-12').outcome.met, true);
assert.equal(rule(chart(1, { Sun: [12] }), 'libra-sun-12').outcome.met, false);
// 10.7: Jupiter and Mars together.
assert.equal(rule(chart(1, { Jupiter: [1], Mars: [1] }), 'jupiter-mars').outcome.met, true);

// What is not judged is listed: 9.7 needs the eclipse; 17.2 is judged.
const left = notEvaluatedVerses('illness').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left.includes('9.7'));
assert.ok(left.includes('17.3'));
assert.ok(!left.includes('17.2'));
assert.ok(!left.includes('9.5'));
