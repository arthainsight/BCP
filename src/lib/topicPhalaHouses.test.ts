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

// ── chapter 13: the span of life ──
const verses13 = PHALA_VERSES[13];
assert.equal(verses13.length, 25);
assert.deepEqual(verses13.map(verse => verse.verse), Array.from({ length: 25 }, (_, index) => index + 1));
for (const verse of verses13) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 13.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 13.${verse.verse} has stray characters`);
}
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// 13.8: the Moon in Mūla (240° to 253°20'), the 2nd quarter at 245°: the mother; a benefic in the lagna spares it.
const mula = rule(chart(1, { Moon: [9, 5] }), 'p13-mula-ashlesha');
assert.equal(mula.outcome.met, true);
assert.ok(mula.outcome.lines[0].includes('the mother'));
assert.equal(rule(chart(1, { Moon: [9, 5], Jupiter: [1] }), 'p13-mula-ashlesha').outcome.met, false);
assert.equal(rule(chart(1), 'p13-mula-ashlesha').outcome.met, false);
// 13.12: malefics in the 8th and the 7th; a benefic in a kendra saves.
assert.equal(rule(chart(1, { Mars: [8], Saturn: [7] }), 'p13-quick-death').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [8], Saturn: [7], Jupiter: [4] }), 'p13-quick-death').outcome.met, false);
assert.equal(rule(chart(1), 'p13-quick-death').outcome.met, false);
// 13.13: Mars (the lagna lord, weak) in the 8th (Scorpio, 8 years), malefics in the 5th and 8th.
const time = rule(chart(1, { Mars: [8], Saturn: [5] }), 'p13-time-of-death');
assert.equal(time.outcome.met, true);
assert.ok(time.outcome.lines[0].includes('Mars: 8 years'));
// 13.14, 13.15: at most one class holds by the majority of the three pairs.
for (const prefix of ['p13-span-', 'p13-friend-']) {
  const classes = ['long', 'middle', 'short'].map(span => rule({ ...chart(1), ascendantLongitude: 10 }, prefix + span).outcome.met);
  assert.ok(classes.filter(value => value === true).length <= 1, prefix);
}
// 13.15: Mars the lagna lord and Jupiter in Cancer, a kendra: long life.
const housesSpan = rule(chart(1, { Mars: [4], Jupiter: [4] }), 'p13-houses-span');
assert.equal(housesSpan.outcome.met, true);
assert.ok(housesSpan.outcome.lines[0].includes('long life'));
// 13.17: Taurus lagna: the 8th lord Jupiter in Scorpio, a kendra, stronger than Venus, with malefics in Sagittarius and Aries.
assert.equal(rule(chart(2, { Mars: [9], Saturn: [1] }, { Jupiter: 1.2 }), 'p13-eighth-lord-strong').outcome.met, true);
// 13.21: the lagna lord Mars strong in Capricorn, a kendra, seen by Venus in Cancer, unseen by malefics.
assert.equal(rule(chart(1, { Mars: [10], Venus: [4] }, { Mars: 1.2 }), 'p13-lagna-lord-guards').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [10], Venus: [4] }), 'p13-lagna-lord-guards').outcome.met, false);
// 13.22: Jupiter strong in the lagna.
assert.equal(rule(chart(1, { Jupiter: [1] }, { Jupiter: 1.1 }), 'p13-jupiter-lagna').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [1] }), 'p13-jupiter-lagna').outcome.met, false);
// 13.24: Taurus lagna with no malefic in the kendras, trines or the 8th, Venus and Jupiter in kendras.
assert.equal(rule(chart(2, { Venus: [5], Mars: [1], Saturn: [3], Ketu: [12] }), 'p13-hundred-years').outcome.met, true);
const left13 = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left13.includes('13.18'));
assert.ok(left13.includes('13.10'));
assert.ok(!left13.includes('13.12'));

// ── chapter 14: illness and death ──
const verses14 = PHALA_VERSES[14];
assert.equal(verses14.length, 29);
assert.deepEqual(verses14.map(verse => verse.verse), Array.from({ length: 29 }, (_, index) => index + 1));
for (const verse of verses14) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 14.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 14.${verse.verse} has stray characters`);
}
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// 14.1-2: the Sun in the 6th with the 6th lord Mercury: two of the three agree; alone in the 12th it is one.
assert.equal(rule(chart(1, { Sun: [6], Mercury: [6] }), 'p14-graha-sun').outcome.met, true);
assert.equal(rule(chart(1), 'p14-graha-sun').outcome.met, false);
// 14.8: Saturn in the 6th with the 6th lord.
assert.equal(rule(chart(1, { Mercury: [6] }), 'p14-graha-saturn').outcome.met, true);
// 14.10: the Sun in the 12th joined by Mars and seen by Saturn: the eye.
assert.equal(rule(chart(1, { Mars: [12] }), 'p14-eye').outcome.met, true);
assert.equal(rule(chart(1), 'p14-eye').outcome.met, false);
assert.equal(rule(chart(1, { Mars: [5], Mercury: [5] }), 'p14-belly').outcome.met, true);
assert.equal(rule(chart(1, { Mercury: [7], Mars: [7] }), 'p14-anus').outcome.met, true);
assert.equal(rule(chart(1, { Mercury: [7], Mars: [7] }), 'p14-genital').outcome.met, false);
assert.equal(rule(chart(1, { Mercury: [7], Mars: [7], Venus: [7] }), 'p14-genital').outcome.met, true);
// 14.11: Jupiter is in the 8th of the default chart: consumption.
assert.ok(rule(chart(1), 'p14-6th-8th').outcome.lines[0].includes('Jupiter: consumption'));
// 14.12-19: the cause of death always names the sign of the 8th.
assert.ok(rule(chart(1), 'p14-death-cause').outcome.lines[0].includes('the 8th sign Scorpio'));
// 14.20: Mars in the 8th (a sign of Mars); Mars and Saturn in kendras in opposition.
assert.equal(rule(chart(1, { Mars: [8] }), 'p14-weapons').outcome.met, true);
assert.equal(rule(chart(1), 'p14-weapons').outcome.met, false);
assert.equal(rule(chart(1, { Mars: [1], Saturn: [7] }), 'p14-kings-wrath').outcome.met, true);
// 14.21: Jupiter in Pisces, its own sign, the lord of the 12th (Aries lagna).
assert.equal(rule(chart(1, { Jupiter: [12] }), 'p14-easy-death').outcome.met, true);
// 14.22: the 12th lord Jupiter in Leo (a friend\'s sign): upward; in Capricorn (its fall): downward.
assert.equal(rule(chart(1, { Jupiter: [5] }), 'p14-upward').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [10] }), 'p14-downward').outcome.met, true);
assert.equal(rule(chart(1, { Jupiter: [10] }), 'p14-upward').outcome.met, false);
assert.ok(rule(chart(1), 'p14-after-death').outcome.lines[0].length > 0);
// 14.25: the 9th lord Jupiter exalted in Cancer; the 5th lord Sun exalted in Aries.
assert.equal(rule(chart(1, { Jupiter: [4] }), 'p14-former-birth-land').outcome.met, true);
assert.equal(rule(chart(1, { Sun: [1] }), 'p14-next-birth-land').outcome.met, true);
const left14 = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left14.includes('14.26'));
assert.ok(!left14.includes('14.2'));

// ── chapter 15: the good and bad of the houses ──
const verses15 = PHALA_VERSES[15];
assert.equal(verses15.length, 30);
assert.deepEqual(verses15.map(verse => verse.verse), Array.from({ length: 30 }, (_, index) => index + 1));
for (const verse of verses15) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 15.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 15.${verse.verse} has stray characters`);
}
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// 15.1: Jupiter in the lagna, its lord Mars the only malefic that touches it: the 1st flourishes.
assert.ok(rule(chart(1, { Jupiter: [1] }), 'p15-flourish').outcome.lines[0].includes('the 1st'));
// 15.3: the lagna lord Mars in the 8th.
assert.ok(rule(chart(1, { Mars: [8] }), 'p15-lord-lost').outcome.lines[0].includes('by the lord: the 1st'));
// 15.4: Mars in the 6th is in the 6th from the lagna.
assert.ok(rule(chart(1, { Mars: [6] }), 'p15-malefics-6-8-12').outcome.lines[0].includes('the 1st'));
// 15.5: the lagna lord in the 6th.
assert.ok(rule(chart(1, { Mars: [6] }), 'p15-lord-in-dusthana').outcome.lines[0].includes('the 1st'));
// 15.9: the lagna lord and its place.
assert.ok(rule(chart(1), 'p15-lagna-lord-gives').outcome.lines[0].includes('the lagna lord Mars is in the 11th'));
// 15.11: Mars rules the 1st (its mūlatrikoṇa) and the 8th.
assert.ok(rule(chart(1), 'p15-two-houses').outcome.lines.some(line => line.includes('Mars rules the 1st and the 8th: the 1st in full, the 8th half')));
// 15.18: Jupiter exalted in the 4th.
assert.ok(rule(chart(1, { Jupiter: [4] }), 'p15-dignity-grows').outcome.lines[0].includes('the 4th'));
assert.ok(rule(chart(1), 'p15-benefics-malefics').outcome.lines[0].includes('grow:'));
// 15.26: the Sun in the 9th.
assert.equal(rule(chart(1, { Sun: [9] }), 'p15-karaka-harms').outcome.met, true);
assert.equal(rule(chart(1), 'p15-karaka-harms').outcome.met, false);
// 15.29: Mercury, lord of the 6th, in Gemini, its own sign and the 3rd house.
assert.equal(rule(chart(1, { Mercury: [3] }), 'p15-dusthana-lord-own').outcome.met, true);
assert.equal(rule(chart(1), 'p15-dusthana-lord-own').outcome.met, false);
const left15 = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left15.includes('15.7'));
assert.ok(left15.includes('15.30'));
assert.ok(!left15.includes('15.1'));

// ── chapter 16: the houses together ──
const verses16 = PHALA_VERSES[16];
assert.equal(verses16.length, 35);
assert.deepEqual(verses16.map(verse => verse.verse), Array.from({ length: 35 }, (_, index) => index + 1));
for (const verse of verses16) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 16.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 16.${verse.verse} has stray characters`);
}
for (const result of evaluateTopic('phalaHouses', chart(1))) assert.ok(result.verses.length === result.rule.verses.length, result.rule.id);
// 16.4: the lagna lord Mars exalted in Capricorn, a kendra; in its own sign Aries it is not "bad".
assert.equal(rule(chart(1, { Mars: [10] }), 'p16-lagna-lord-good').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [1] }), 'p16-lagna-lord-bad').outcome.met, false);
assert.equal(rule(chart(1), 'p16-lagna-lord-bad').outcome.met, true);
// 16.5: the 2nd lord Venus in the lagna with Mercury.
assert.equal(rule(chart(1, { Venus: [1], Mercury: [1] }), 'p16-2nd-lord-lagna').outcome.met, true);
// 16.7: the lords of the lagna and the 3rd in each other's signs, both strong.
assert.equal(rule(chart(1, { Mars: [3], Mercury: [1] }, { Mars: 1.1, Mercury: 1.1 }), 'p16-3rd-exchange').outcome.met, true);
assert.equal(rule(chart(1, { Mars: [3], Mercury: [1] }), 'p16-3rd-exchange').outcome.met, false);
// 16.10: the Moon (the 4th lord) in Virgo with Saturn, in an evil house.
assert.equal(rule(chart(1, { Moon: [6] }), 'p16-mother-lost').outcome.met, true);
// 16.11: the lagna lord in the 4th, seen by the Moon in Capricorn.
assert.equal(rule(chart(1, { Mars: [4], Moon: [10] }), 'p16-last-rites').outcome.met, true);
// 16.13: the 4th lord in the lagna, Venus in the 4th.
assert.equal(rule(chart(1, { Moon: [1], Venus: [4] }), 'p16-4th-venus').outcome.met, true);
// 16.16: Saturn in the 6th (the default chart).
assert.equal(rule(chart(1), 'p16-enemy-trouble').outcome.met, true);
// 16.20: Jupiter in the 7th and the 7th lord strong.
assert.equal(rule(chart(1, { Jupiter: [7] }, { Venus: 1.2 }), 'p16-wife-virtuous').outcome.met, true);
// 16.22: the Sun in the 9th, its lord Jupiter in the 8th.
assert.equal(rule(chart(1, { Sun: [9] }), 'p16-father-dies').outcome.met, true);
// 16.28: the Sun in the 10th.
assert.ok(rule(chart(1, { Sun: [10] }), 'p16-10th-occupants').outcome.lines[0].includes('energetic'));
const left16 = notEvaluatedVerses('phalaHouses').map(verse => `${verse.chapter}.${verse.verse}`);
assert.ok(left16.includes('16.1'));
assert.ok(left16.includes('16.12'));
assert.ok(left16.includes('16.31'));
assert.ok(!left16.includes('16.2'));

// ── chapter 17: death by the transits (the verses only) ──
const verses17 = PHALA_VERSES[17];
assert.equal(verses17.length, 28);
assert.deepEqual(verses17.map(verse => verse.verse), Array.from({ length: 28 }, (_, index) => index + 1));
for (const verse of verses17) {
  assert.ok(verse.sanskrit.every(line => /[ऀ-ॿ…]/.test(line)), `verse 17.${verse.verse}`);
  assert.ok(!verse.sanskrit.some(line => /[A-Za-z0-9_$]/.test(line)), `verse 17.${verse.verse} has stray characters`);
}
// No rule reads chapter 17: all its verses are listed as not judged.
const left17 = notEvaluatedVerses('phalaHouses').filter(verse => verse.chapter === 17);
assert.equal(left17.length, 28);
