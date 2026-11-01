import assert from 'node:assert/strict';
import { SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

const body = (name: string, sign: number, degree = 10): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree });
/** A quiet default chart (nothing of the rules is met by it) with some grahas moved. */
const DEFAULT: Record<string, [number, number]> = {
  Sun: [12, 5], Moon: [11, 6], Mars: [11, 7], Mercury: [9, 8], Jupiter: [8, 9], Venus: [3, 10], Saturn: [6, 11], Rahu: [4, 12], Ketu: [10, 12],
};
const chart = (ascendantSign: number, moved: Record<string, [number, number?]> = {}, strong: Partial<Record<SevenGraha, number>> = {}, ascendantLongitude?: number): TopicContext => {
  const ratio: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) ratio[name] = strong[name] ?? 0.8;
  const planets = Object.entries(DEFAULT).map(([name, [sign, degree]]) => { const [s, d] = moved[name] ?? [sign, degree]; return body(name, s, d ?? degree); });
  return { planets, ascendantSign, ratio, ascendantLongitude };
};
const rule = (context: TopicContext, id: string) => evaluateTopic('wealth', context).find(result => result.rule.id === id)!;

// The verses: chapters 39 to 42 whole, each in Devanagari with the two half-verses.
for (const [chapter, count] of [[39, 48], [40, 15], [41, 34], [42, 18]] as const) {
  const verses = TOPIC_VERSES[chapter];
  assert.equal(verses.length, count);
  assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: count }, (_, index) => index + 1));
  for (const verse of verses) assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0] + verse.sanskrit[1]) && verse.iast[0].length > 5 && verse.gloss.length > 10);
}
// Every rule names verses that exist.
for (const result of evaluateTopic('wealth', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);

// 39.6: Aries lagna, Mars (lagna lord) in Leo (the 5th), the Sun (5th lord) in Aries.
const exchange = chart(1, { Mars: [5], Sun: [1] });
assert.equal(rule(exchange, 'exchange-1-5').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [5] }), 'exchange-1-5').outcome.met, false);
// 39.7: the exchange alone is not the Mahārāja yoga.
assert.equal(rule(exchange, 'maharaja').outcome.met, false);

// 39.18: the Moon exalted in Taurus, the 2nd of Aries.
assert.equal(rule(chart(1, { Moon: [2] }), 'exalted-in-2nd').outcome.met, true);
assert.equal(rule(chart(1, { Moon: [2], Jupiter: [2] }), 'exalted-in-2nd').outcome.met, true);
assert.equal(rule(chart(1, { Moon: [3] }), 'exalted-in-2nd').outcome.met, false);

// 39.33-34: Aries lagna, Jupiter (9th lord) and the Sun (5th lord) in Sagittarius together; apart, Jupiter sees Leo but the Sun does not see Sagittarius.
assert.equal(rule(chart(1, { Jupiter: [9], Sun: [9] }), 'lords-9-5').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [9], Sun: [5] }), 'lords-9-5').outcome.met, false);
// Sun and Jupiter in each other's 7th: Jupiter in Gemini, Sun in Sagittarius (the 9th lord opposite the 5th lord).
assert.equal(rule(chart(1, { Jupiter: [3], Sun: [9] }), 'lords-9-5').outcome.met, true);

// 39.45-46: four grahas in exaltation or mūlatrikoṇa.
const four = chart(1, { Sun: [5], Moon: [2], Mars: [1], Mercury: [6], Jupiter: [4], Venus: [12], Saturn: [7] });
assert.equal(rule(four, 'exalted-trikona-4-5').outcome.met, false);
const five = chart(1, { Sun: [5], Moon: [2], Mars: [1], Mercury: [6], Jupiter: [9], Venus: [3], Saturn: [3] });
assert.equal(rule(five, 'exalted-trikona-4-5').outcome.met, true);
// 39.44: one exalted (the Moon in Taurus) is "three or fewer"; none is not.
assert.equal(rule(chart(1, { Moon: [2] }), 'exalted-1-3').outcome.met, true);
assert.equal(rule(chart(1), 'exalted-1-3').outcome.met, false);

// 39.42: the Moon at 1° of Aries is vargottama; strong; aspected by Mars (Capricorn, its 4th aspect), Jupiter (Sagittarius, its 5th), Saturn (Aquarius, its 3rd) and Mercury (Libra, the 7th).
const moon = chart(1, { Moon: [1, 1], Mars: [10], Jupiter: [9], Saturn: [11], Mercury: [7] }, { Moon: 1.2 });
assert.equal(rule(moon, 'moon-vargottama').outcome.met, true);
assert.equal(rule(chart(1, { Moon: [1, 1], Mars: [10], Jupiter: [9], Saturn: [11], Mercury: [7] }, { Moon: 0.9 }), 'moon-vargottama').outcome.met, false);
// 39.43 needs the longitude of the lagna.
assert.equal(rule(chart(1), 'lagna-vargottama').outcome.met, null);
assert.equal(rule(chart(1, {}, {}, 1), 'lagna-vargottama').outcome.met, false);

// 40: the Amātyakāraka is the second by degree (Rahu counts from the end of the sign). Sun 25°, Moon 20° → the Moon.
const minister = chart(1, { Sun: [12, 25], Moon: [1, 20], Rahu: [4, 29.9] });
assert.equal(rule(minister, 'amk-lagna-5-9').outcome.met, true);
assert.ok(rule(minister, 'amk-from-ak').outcome.lines[0].includes('Ātmakāraka is Sun'));
// Sun in Pisces, Moon in Aries: Aries is the 2nd from Pisces, not a kendra or trikoṇa.
assert.equal(rule(minister, 'amk-from-ak').outcome.met, false);
// 40.13: the lagna lord Mars in the 10th (Capricorn) and the 10th lord Saturn in the lagna (Aries).
assert.equal(rule(chart(1, { Mars: [10], Saturn: [1] }), 'exchange-1-10').outcome.met, true);

// 41.2: Gemini lagna, the 5th is Libra (Venus); Venus in Libra, Mars in Aries (the 11th).
assert.equal(rule(chart(3, { Venus: [7], Mars: [1] }), 'dhana-5th-venus').outcome.met, true);
assert.equal(rule(chart(3, { Venus: [7], Mars: [2] }), 'dhana-5th-venus').outcome.met, false);
// 41.9: Leo lagna with the Sun in it; Mars with it, Jupiter in Sagittarius aspects Leo by its 9th aspect.
assert.equal(rule(chart(5, { Sun: [5], Mars: [5], Jupiter: [9] }), 'dhana-lagna-sun').outcome.met, true);
assert.equal(rule(chart(5, { Sun: [5], Mars: [5], Jupiter: [2] }), 'dhana-lagna-sun').outcome.met, false);
// 41.16 always names the grahas.
assert.equal(rule(chart(1), 'lords-2-9').outcome.met, true);

// 42.2: Aries lagna; Mars (lagna lord) in Pisces (12th), Jupiter (12th lord) in Aries; Venus (the 2nd and 7th lord) with Mars.
const poor = chart(1, { Mars: [12], Jupiter: [1], Venus: [12] });
assert.equal(rule(poor, 'poor-1-12-exchange').outcome.met, true);
assert.ok(rule(poor, 'poor-1-12-exchange').outcome.lines[0].includes('Venus'));
assert.equal(rule(chart(1, { Mars: [12], Jupiter: [1] }), 'poor-1-12-exchange').outcome.met, false);
// 42.16-17: Mars in Taurus (the 2nd); Mercury in Scorpio aspects it, so the verse gives great wealth.
const mars2 = rule(chart(1, { Mars: [2], Mercury: [8] }), 'mars-saturn-2nd');
assert.equal(mars2.outcome.met, true);
assert.ok(mars2.outcome.lines[0].includes('great wealth'));
// 42.17-18: the Sun in the 2nd with and without Saturn's aspect (Saturn in Scorpio aspects Taurus by its 7th).
assert.ok(rule(chart(1, { Sun: [2], Saturn: [8] }), 'sun-2nd').outcome.lines[0].includes('poverty'));
assert.ok(rule(chart(1, { Sun: [2] }), 'sun-2nd').outcome.lines[0].includes('great wealth and fame'));

// What is not judged is listed: 39.3 needs the kārakas; 39.33 is judged.
const left = notEvaluatedVerses('wealth').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left.includes('39.3'));
assert.ok(left.includes('41.18'));
assert.ok(!left.includes('39.33'));
assert.ok(!left.includes('42.2'));
