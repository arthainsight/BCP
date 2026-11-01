import assert from 'node:assert/strict';
import { SEVEN, TOPICS, TOPIC_RULES, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicKey, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

// The verses: the chapters, each verse in Devanagari with its two half-verses.
const COUNTS: Record<number, number> = { 18: 42, 19: 15, 44: 46, 79: 15 };
for (const [chapter, count] of Object.entries(COUNTS)) {
  const verses = TOPIC_VERSES[Number(chapter)];
  assert.equal(verses.length, count, `chapter ${chapter}`);
  assert.deepEqual(verses.map(verse => verse.verse), Array.from({ length: count }, (_, index) => index + 1));
  for (const verse of verses) {
    assert.equal(verse.chapter, Number(chapter));
    assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0]) && /[ऀ-ॿ]/.test(verse.sanskrit[1]) && verse.iast[0].length > 5 && verse.gloss.length > 10, `${chapter}.${verse.verse}`);
  }
}
// The rules: unique ids, and each names verses that exist in its chapter and topic.
assert.equal(new Set(TOPIC_RULES.map(rule => rule.id)).size, TOPIC_RULES.length, 'ids are unique per topic file');
for (const rule of TOPIC_RULES) {
  const topic = TOPICS.find(item => item.key === rule.topic)!;
  assert.ok(topic.chapters.includes(rule.chapter), `${rule.id}: chapter ${rule.chapter} belongs to ${rule.topic}`);
  for (const verse of rule.verses) assert.ok(TOPIC_VERSES[rule.chapter].some(item => item.verse === verse), `${rule.id}: verse ${rule.chapter}.${verse} exists`);
}
// What each topic leaves unjudged is stated.
const left = (topic: TopicKey) => notEvaluatedVerses(topic).map(verse => `${verse.chapter}.${verse.verse}`);
assert.deepEqual(left('marriage'), ['18.10', '18.31', '18.32', '18.33', '18.34']);
assert.ok(left('longevity').includes('19.3') && left('longevity').includes('19.7') && left('longevity').includes('44.15'));
assert.ok(!left('longevity').includes('44.21'));

const body = (name: string, sign: number, degree = 10): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree });
const chart = (ascendantSign: number, placed: Record<string, number>, ratio: Partial<Record<SevenGraha, number>> = {}): TopicContext => {
  const base: Record<string, number> = { Sun: 5, Moon: 2, Mars: 3, Mercury: 5, Jupiter: 6, Venus: 6, Saturn: 7, Rahu: 9, Ketu: 3 };
  const planets = Object.entries({ ...base, ...placed }).map(([name, sign]) => body(name, sign));
  const filled: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) filled[name] = ratio[name] ?? 0.8;
  return { planets, ascendantSign, ratio: filled };
};
const ruleOf = (topic: TopicKey, id: string, context: TopicContext) => evaluateTopic(topic, context).find(result => result.rule.id === id)!.outcome;

// ── marriage ──
// Aries Lagna: the 7th is Libra, lord Venus. Venus in Libra: in its own sign and in the 7th.
const venusHome = chart(1, { Venus: 7 });
assert.equal(ruleOf('marriage', 'own-or-exalted', venusHome).met, true);
assert.equal(ruleOf('marriage', 'venus-in-7th', venusHome).met, true);
assert.equal(ruleOf('marriage', 'lord-weak', venusHome).met, true, 'the 7th lord in the 7th (verse 5)');
assert.equal(ruleOf('marriage', 'lord-dusthana', venusHome).met, false);
// Venus in Pisces: exalted in the 12th; with a strong Jupiter and a strong 7th lord, many wives (18.21); the 12th does not count against it (18.2).
const venusPisces = chart(1, { Venus: 12 }, { Venus: 1.2, Jupiter: 1.3 });
assert.equal(ruleOf('marriage', 'own-or-exalted', venusPisces).met, true);
assert.equal(ruleOf('marriage', 'lord-dusthana', venusPisces).met, false);
assert.equal(ruleOf('marriage', 'venus-exalted-dual', venusPisces).met, true);
assert.equal(ruleOf('marriage', 'venus-exalted-dual', chart(1, { Venus: 12 }, { Venus: 1.2, Jupiter: 0.5 })).met, false);
// The 7th lord in the 8th: dusthana, and not in own sign.
assert.equal(ruleOf('marriage', 'lord-dusthana', chart(1, { Venus: 8 })).met, true);
// Venus with a malefic: loss of the wife (18.3).
assert.equal(ruleOf('marriage', 'venus-with-malefic', chart(1, { Venus: 5, Sun: 5 })).met, true);
assert.equal(ruleOf('marriage', 'venus-with-malefic', chart(1, { Venus: 6, Saturn: 7 })).met, false);
// Three wives (18.20): Gemini Lagna (lord Mercury), Mars in the 7th (Sagittarius), Venus and Saturn in the 11th (Aries), Mercury in the 8th (Capricorn).
assert.equal(ruleOf('marriage', 'three-wives', chart(3, { Mars: 9, Venus: 1, Saturn: 1, Mercury: 10 })).met, true);
assert.equal(ruleOf('marriage', 'three-wives', chart(3, { Mars: 9, Venus: 1, Saturn: 2, Mercury: 10 })).met, false);
// The year of marriage, 18th (18.27): Venus in the 7th from the Moon and Saturn in the 7th from Venus.
assert.equal(ruleOf('marriage', 'age-18', chart(1, { Moon: 1, Venus: 7, Saturn: 1 })).met, true);
assert.equal(ruleOf('marriage', 'age-18', chart(1, { Moon: 1, Venus: 7, Saturn: 2 })).met, false);
// Mars in the 6th, Rāhu in the 7th, Saturn in the 8th (18.42).
assert.equal(ruleOf('marriage', 'wife-not-living', chart(1, { Mars: 6, Rahu: 7, Saturn: 8 })).met, true);
// A graha in the 7th: the kinds of wife are listed.
assert.ok(ruleOf('marriage', 'grahas-in-7th', chart(1, { Jupiter: 7 })).lines[0].includes('brahmin wife'));
assert.equal(ruleOf('marriage', 'grahas-in-7th', chart(1, { Saturn: 2 })).met, false);
// A strength that is not known cannot be judged.
assert.equal(ruleOf('marriage', 'lagna-lord-in-7th', { ...chart(1, { Mars: 7 }), ratio: {} }).met, null);
assert.equal(ruleOf('marriage', 'lagna-lord-in-7th', chart(1, { Mars: 7 }, { Mars: 1.4 })).met, true);

// ── longevity ──
// Aries Lagna: the 8th is Scorpio, lord Mars. Mars in Capricorn is in the 10th, a kendra (19.1).
assert.equal(ruleOf('longevity', 'l8-kendra', chart(1, { Mars: 10 })).met, true);
assert.equal(ruleOf('longevity', 'l8-kendra', chart(1, { Mars: 12 })).met, false);
// The 8th lord in the 8th with Saturn: a short life (19.2). Taurus Lagna: the 8th is Sagittarius, lord Jupiter; the lagna lord Venus is elsewhere.
assert.equal(ruleOf('longevity', 'l8-in-8-malefics', chart(2, { Jupiter: 9, Saturn: 9, Rahu: 12, Ketu: 6 })).met, true);
assert.equal(ruleOf('longevity', 'l8-in-8-malefics', chart(2, { Jupiter: 9, Saturn: 7, Rahu: 12, Ketu: 6 })).met, false);
// The lagna lord in the 8th is the other half of the verse: Aries Lagna, Mars is lord of both.
assert.equal(ruleOf('longevity', 'l8-in-8-malefics', chart(1, { Mars: 8 })).met, true);
// Death at the end of a month (19.13): the 8th lord in the 8th, the Moon with a malefic and no benefic aspect.
assert.equal(ruleOf('longevity', 'death-at-month-end', chart(1, { Mars: 8, Moon: 11, Saturn: 11, Jupiter: 1, Venus: 2, Mercury: 2 })).met, true);
assert.equal(ruleOf('longevity', 'death-at-month-end', chart(1, { Mars: 8, Moon: 11, Saturn: 11, Jupiter: 5 })).met, false, 'Jupiter in Leo sees Aquarius by its 7th');
// The māraka (44.2-4): the 2nd and 7th lords, with the malefics in those houses.
const marakas = ruleOf('longevity', 'marakas', chart(1, { Mars: 8, Saturn: 2 }));
assert.equal(marakas.met, true);
assert.ok(marakas.lines[0].includes('Venus') && marakas.lines[0].includes('Saturn'));
// The place of death (44.34): the 3rd of Aries is Gemini, a dual sign: on the road.
assert.ok(ruleOf('longevity', 'place-of-death', chart(1, {})).lines[0].includes('on the road'));
assert.ok(ruleOf('longevity', 'place-of-death', chart(2, {})).lines[0].includes('in a foreign land'), 'Taurus Lagna: the 3rd is Cancer, movable');
// The kind of death by the graha in the 8th (44.35): the Sun in Scorpio.
assert.ok(ruleOf('longevity', 'cause-8th', chart(1, { Sun: 8 })).lines[0].includes('fire'));
assert.equal(ruleOf('longevity', 'cause-8th', chart(1, { Sun: 5 })).met, false);
// Rāhu in the 7th, or a Capricorn lagna (44.22-23).
assert.equal(ruleOf('longevity', 'nodes-marakas', chart(1, { Rahu: 7 })).met, true);
assert.equal(ruleOf('longevity', 'nodes-marakas', chart(10, { Rahu: 2, Ketu: 8 })).met, true);
assert.equal(ruleOf('longevity', 'nodes-marakas', chart(1, { Rahu: 2, Ketu: 8 })).met, true, 'Ketu in the 8th');
assert.equal(ruleOf('longevity', 'nodes-marakas', chart(1, { Rahu: 3, Ketu: 9 })).met, false);
// The chief māraka is the strongest of the 2nd and 7th lords and the malefics in those houses with a known strength.
assert.ok(ruleOf('longevity', 'chief-maraka', chart(1, { Venus: 6 }, { Venus: 1.4 })).lines[0].includes('Venus'));
// Every rule answers for every chart, whatever the chart: no throw, a verdict or null.
for (let asc = 1; asc <= 12; asc++) for (const topic of TOPICS) for (const result of evaluateTopic(topic.key, chart(asc, { Moon: asc, Sun: (asc % 12) + 1 }))) assert.ok([true, false, null].includes(result.outcome.met), `${result.rule.id}`);
