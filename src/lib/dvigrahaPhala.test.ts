import assert from 'node:assert/strict';
import { ASPECTING_IN_NAVAMSHA, ASPECTING_IN_SIGNS, DVIGRAHA_VERSES, PAIR_RESULTS, dvigrahaReading, moonInNavamshaResult, moonInSignResult } from './dvigrahaPhala';
import { SEVEN, type SevenGraha, type TopicContext, type TopicPlanet } from './topicCore';

// 17 verses; the 21 pairs of the seven grahas, once each, each in verses 1-5.
assert.deepEqual(DVIGRAHA_VERSES.map(verse => verse.verse), Array.from({ length: 17 }, (_, index) => index + 1));
for (const verse of DVIGRAHA_VERSES) assert.ok(verse.sanskrit.length >= 2 && verse.sanskrit.every(line => /[ऀ-ॿ]/.test(line)), `verse ${verse.verse}`);
const expectedPairs: string[] = [];
for (let a = 0; a < 7; a++) for (let b = a + 1; b < 7; b++) expectedPairs.push(`${SEVEN[a]}+${SEVEN[b]}`);
assert.deepEqual(Object.keys(PAIR_RESULTS).sort(), expectedPairs.sort());
assert.ok(Object.values(PAIR_RESULTS).every(item => item.verse >= 1 && item.verse <= 5 && item.gloss.length > 5));
// The Moon in each of the 12 signs with each of the six aspecting grahas, and in the navāṁśa of each of the seven.
for (let sign = 1; sign <= 12; sign++) for (const graha of ASPECTING_IN_SIGNS) assert.ok(moonInSignResult(sign, graha), `${sign} ${graha}`);
for (const lord of ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Jupiter', 'Saturn']) for (const graha of ASPECTING_IN_NAVAMSHA) assert.ok(moonInNavamshaResult(lord, graha), `${lord} ${graha}`);
assert.equal(moonInSignResult(1, 'Mars')!.gloss, 'a king');
assert.equal(moonInSignResult(1, 'Sun')!.gloss, 'poor');
assert.equal(moonInSignResult(4, 'Saturn')!.gloss, 'an iron-worker');
assert.equal(moonInSignResult(12, 'Jupiter')!.verse, 11);
assert.equal(moonInSignResult(13, 'Mars'), null);
assert.equal(moonInNavamshaResult('Saturn', 'Sun')!.gloss, 'with few children');
assert.equal(moonInNavamshaResult('Rahu', 'Sun'), null);
assert.equal(moonInNavamshaResult('Mars', 'Jupiter')!.verse, 12);

const body = (name: string, sign: number, degree = 10): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree });
const chart = (placed: Record<string, number>, ascendantSign = 1): TopicContext => {
  const base: Record<string, number> = { Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 2 };
  const ratio: TopicContext['ratio'] = {};
  for (const name of SEVEN) ratio[name as SevenGraha] = 1;
  return { planets: Object.entries({ ...base, ...placed }).map(([name, sign]) => body(name, sign)), ascendantSign, ratio };
};
// Venus and Saturn together: short-sighted, a writer or painter; no other pair.
const reading = dvigrahaReading(chart({ Venus: 7 }));
assert.deepEqual(reading.pairs.map(item => item.pair), ['Venus+Saturn']);
assert.equal(reading.pairs[0].verse, 5);
assert.deepEqual(reading.crowdedSigns, []);
// Three in one sign: three pairs and the sign is named as crowded (18.5: the pairs are combined).
const crowded = dvigrahaReading(chart({ Mars: 5, Jupiter: 5, Venus: 5 }));
assert.deepEqual(crowded.pairs.map(item => item.pair), ['Mars+Jupiter', 'Mars+Venus', 'Jupiter+Venus']);
assert.deepEqual(crowded.crowdedSigns, [5]);
// The Moon in Aries (sign 1), seen by Libra's 7th: Saturn in Libra sees Aries (the 7th), so the Moon is seen by Saturn: a thief.
const moonAries = dvigrahaReading(chart({ Moon: 1, Sun: 2, Mars: 3, Mercury: 4, Jupiter: 6, Venus: 6, Saturn: 7 }));
assert.deepEqual(moonAries.moon!.seenBy.map(item => item.graha), ['Saturn']);
assert.equal(moonAries.moon!.seenBy[0].gloss, 'a thief');
// The navāṁśa of the Moon at Aries 10°: the 4th navāṁśa (6°40′–10°), Cancer-start: Aries is fire, navāṁśa counted from Aries: 10° is the 4th: Cancer, own (Moon).
assert.equal(moonAries.moon!.navamshaSign, 4);
assert.equal(moonAries.moon!.navamshaLord, 'Moon');
assert.equal(moonAries.moon!.placement, 'own');
assert.equal(moonAries.moon!.seenInNavamsha[0].gloss, 'devoted to work', 'Saturn sees the Moon in its own navāṁśa: devoted to work (18.13)');
// A vargottama Moon: Aries 1° is in the first navāṁśa, which is Aries.
const atOne = chart({ Moon: 1 });
atOne.planets = atOne.planets.map(planet => (planet.name === 'Moon' ? body('Moon', 1, 1) : planet));
assert.equal(dvigrahaReading(atOne).moon!.placement, 'vargottama');
// Another's navāṁśa: Aries 20° is the 7th navāṁśa, Libra, of Venus.
const atTwenty = chart({ Moon: 1 });
atTwenty.planets = atTwenty.planets.map(planet => (planet.name === 'Moon' ? body('Moon', 1, 20) : planet));
const other = dvigrahaReading(atTwenty).moon!;
assert.equal(other.navamshaLord, 'Venus');
assert.equal(other.placement, 'other');
