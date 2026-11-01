import assert from 'node:assert/strict';
import { PRAVRAJYA_TYPES, SEVEN, evaluateTopic, notEvaluatedVerses, type SevenGraha, type TopicContext, type TopicPlanet } from './topicYogas';
import { TOPIC_VERSES } from './topicVerses';

const BPHS79_VERSES = TOPIC_VERSES[79];

const body = (name: string, sign: number, degree: number): TopicPlanet => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree });
const context = (planets: TopicPlanet[], ascendantSign: number, strong: Partial<Record<SevenGraha, number>> = {}): TopicContext => {
  const ratio: Partial<Record<SevenGraha, number>> = {};
  for (const name of SEVEN) ratio[name] = strong[name] ?? 0.8;
  return { planets, ascendantSign, ratio };
};
const rule = (results: ReturnType<typeof evaluateTopic>, id: string) => results.find(result => result.rule.id === id)!;

// The verses: 15 of them, in Devanagari, with the two half-verses.
assert.equal(BPHS79_VERSES.length, 15);
assert.deepEqual(BPHS79_VERSES.map(verse => verse.verse), Array.from({ length: 15 }, (_, index) => index + 1));
for (const verse of BPHS79_VERSES) assert.ok(/[ऀ-ॿ]/.test(verse.sanskrit[0] + verse.sanskrit[1]) && (verse.iast?.[0].length ?? 0) > 5);
// The seven kinds of renunciation, one for each graha in the order of 79.2-3.
assert.equal(Object.keys(PRAVRAJYA_TYPES).length, 7);

// Five grahas in Taurus; Mercury is the strongest of the strong ones: an ekadaṇḍī (79.2-3). Mars is weak and does not count.
const crowded = context([body('Sun', 2, 5), body('Moon', 2, 10), body('Mars', 2, 15), body('Mercury', 2, 20), body('Venus', 2, 25), body('Jupiter', 5, 3), body('Saturn', 9, 3)], 1,
  { Sun: 1.1, Moon: 1.2, Mercury: 1.6, Venus: 1.3, Mars: 0.7 });
const four = rule(evaluateTopic('spirituality', crowded), 'pravrajya-four-strong');
assert.equal(four.outcome.met, true);
assert.ok(four.outcome.lines[0].includes('Sun, Moon, Mercury, Venus'));
assert.ok(four.outcome.lines[0].includes('the strongest is Mercury'));
assert.ok(four.outcome.lines[0].includes('ekadaṇḍī'));
assert.deepEqual(four.verses.map(verse => verse.verse), [2, 3, 12, 13]);
// With Venus weak too only three are strong: not met, and the line says so.
const three = rule(evaluateTopic('spirituality', context(crowded.planets, 1, { Sun: 1.1, Moon: 1.2, Mercury: 1.6, Venus: 0.9 })), 'pravrajya-four-strong');
assert.equal(three.outcome.met, false);
assert.ok(three.outcome.lines[0].includes('only 3 are strong'));
// No crowd: not met.
const spread = context(SEVEN.map((name, index) => body(name, index + 1, 10)), 1);
assert.equal(rule(evaluateTopic('spirituality', spread), 'pravrajya-four-strong').outcome.met, false);
// A graha with no Ṣaḍbala cannot be judged.
const unknown = { ...crowded, ratio: { Sun: 1.1, Moon: 1.2, Mercury: 1.6 } };
assert.equal(rule(evaluateTopic('spirituality', unknown), 'pravrajya-four-strong').outcome.met, null);

// 79.15: Saturn in the 9th (Aries Lagna → Sagittarius) and no graha sees it.
const kingPlanets = [body('Sun', 1, 5), body('Moon', 1, 10), body('Mars', 1, 7), body('Mercury', 1, 20), body('Jupiter', 6, 5), body('Venus', 1, 25), body('Saturn', 9, 15)];
assert.equal(rule(evaluateTopic('spirituality', context(kingPlanets, 1)), 'pravrajya-initiated-king').outcome.met, true);
// Jupiter in Leo (the 9th from Leo is Aries… the 5th from Leo to Sagittarius) sees Sagittarius: not free of aspect.
const seen = kingPlanets.map(planet => (planet.name === 'Jupiter' ? body('Jupiter', 5, 5) : planet));
assert.equal(rule(evaluateTopic('spirituality', context(seen, 1)), 'pravrajya-initiated-king').outcome.met, false);
// Saturn not in the 9th.
assert.equal(rule(evaluateTopic('spirituality', context(kingPlanets.map(planet => (planet.name === 'Saturn' ? body('Saturn', 10, 15) : planet)), 1)), 'pravrajya-initiated-king').outcome.met, false);

// 79.14: Aries Lagna, Jupiter in Sagittarius (the 9th), Saturn in Gemini (sees the 7th: Sagittarius, the 3rd: Leo, the 10th: Pisces)… the Moon in Pisces and the Lagna Aries: Saturn in Aquarius sees the 3rd (Aries), the 7th (Leo), the 10th (Scorpio).
// Saturn in Libra sees the 3rd (Sagittarius), the 7th (Aries) and the 10th (Cancer): Jupiter (Sagittarius) and the Lagna (Aries) and the Moon in Cancer.
const tirthakrit = context([body('Sun', 5, 5), body('Moon', 4, 10), body('Mars', 8, 5), body('Mercury', 5, 20), body('Jupiter', 9, 5), body('Venus', 6, 25), body('Saturn', 7, 15)], 1);
assert.equal(rule(evaluateTopic('spirituality', tirthakrit), 'pravrajya-tirthakrit').outcome.met, true);
assert.equal(rule(evaluateTopic('spirituality', context(tirthakrit.planets.map(planet => (planet.name === 'Moon' ? body('Moon', 5, 10) : planet)), 1)), 'pravrajya-tirthakrit').outcome.met, false);

// 79.8: the Moon in Capricorn 0-10° (the drekkāṇa of Capricorn, Saturn's), the navāṁśa of Capricorn 0-3°20′ is Capricorn's (Aries-start of the fire… check by the function) and seen by Saturn.
const capricorn = (degree: number) => context([body('Sun', 1, 5), body('Moon', 10, degree), body('Mars', 3, 5), body('Mercury', 1, 20), body('Jupiter', 6, 5), body('Venus', 1, 25), body('Saturn', 4, 15)], 1);
// Saturn in Cancer sees the 7th: Capricorn.
const moonSaturn = rule(evaluateTopic('spirituality', capricorn(1)), 'pravrajya-moon-saturn');
assert.ok(moonSaturn.outcome.lines[0].includes('drekkāṇa of the Moon is of Saturn'));
assert.equal(moonSaturn.outcome.met, moonSaturn.outcome.lines[0].includes('navāṁśa of Saturn') || moonSaturn.outcome.lines[0].includes('navāṁśa of Mars'));
// 20-30° of Capricorn is the Virgo-sign drekkāṇa (the 9th from Capricorn is Virgo), not Saturn's.
assert.equal(rule(evaluateTopic('spirituality', capricorn(25)), 'pravrajya-moon-saturn').outcome.met, false);

// The verses no rule judges: the war of the grahas and the daśā (79.1, 9-11, 13).
assert.deepEqual(notEvaluatedVerses('spirituality').map(verse => verse.verse), [1, 9, 10, 11]);
