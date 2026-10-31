import assert from 'node:assert/strict';
import { drigAspected, drigOrder, kendradiOrder, kendradiStart, mandookaOrder, mandookaStart, shulaOrder, SHULA_HOUSES, trikonaOrder, yogardhaOrder, yogardhaYears, charaYears, sthiraYears } from './jaiminiRasiDashas';
import { toJaiminiChart } from './jaiminiStrength';
import { SIGN_ABBR } from './signs';

const names = (signs: number[]) => signs.map(sign => SIGN_ABBR[sign]).join(',');
const chartOf = (ascendantSign: number, signs: Record<string, number>) =>
  toJaiminiChart(Object.entries(signs).map(([name, sign]) => ({ name, sign, degree: 10 })), ascendantSign);

// --- Dṛg (2.4.21–23): the example of the commentary, Libra rising ------------------------------------------------------------------------
// Gemini, the 9th, with Virgo, Sagittarius and Pisces; Cancer, the 10th, with Taurus, Aquarius and Scorpio (backwards, as a movable sign counts);
// Leo, the 11th, with Libra, Capricorn and Aries (forwards).
assert.equal(names(drigOrder(6)), 'Ge,Vi,Sg,Pi,Cn,Ta,Aq,Sc,Le,Li,Cp,Ar');
// The signs a sign glances at: the nearer first, by the kind of the sign (BPHS 46.187).
assert.equal(names(drigAspected(0)), 'Aq,Sc,Le', 'Aries, movable: backwards the 3rd, 6th and 9th');
assert.equal(names(drigAspected(1)), 'Cn,Li,Cp', 'Taurus, fixed: forwards');
assert.equal(names(drigAspected(5)), 'Ge,Pi,Sg', 'Virgo, dual and even: the 4th, 7th, 10th backwards');
// A fixed 9th sign is glanced at by the 11th (movable): a sign already placed is not placed twice, and the text names no more than ten.
// Virgo rising: Taurus (9th) with Cancer, Libra and Capricorn; Gemini (10th) with Virgo, Sagittarius and Pisces; Cancer (11th) is placed already, and
// of the signs it glances at Taurus is too, leaving Aquarius and Scorpio. Aries and Leo are not reached.
assert.equal(names(drigOrder(5)), 'Ta,Cn,Li,Cp,Ge,Vi,Sg,Pi,Aq,Sc');
assert.equal(drigOrder(6).length, 12);
for (let lagna = 0; lagna < 12; lagna++) assert.equal(new Set(drigOrder(lagna)).size, drigOrder(lagna).length, `no sign twice, Lagna ${lagna}`);

// --- Trikoṇa (2.4.24–25): the example of the commentary --------------------------------------------------------------------------------
// Libra rising, the 5th Aquarius the strongest of Lagna, 5th and 9th: Aquarius with Gemini and Libra, Pisces with Cancer and Scorpio, Aries with Leo and Sagittarius, Taurus with Virgo and Capricorn.
const trikona = trikonaOrder(chartOf(7, { Sun: 11, Moon: 11, Mars: 3, Jupiter: 4 }), 6);
assert.equal(names([trikona.start]), 'Aq');
assert.equal(names(trikona.order), 'Aq,Ge,Li,Pi,Cn,Sc,Ar,Le,Sg,Ta,Vi,Cp');
// From an even sign the groups and the trines run backwards (BPHS 46.184): Taurus rising, Virgo (the 5th) the strongest: Virgo with Taurus and Capricorn, then Leo with Aries and Sagittarius.
const reverse = trikonaOrder(chartOf(2, { Sun: 6, Moon: 6 }), 1);
assert.equal(names(reverse.order), 'Vi,Ta,Cp,Le,Ar,Sg,Cn,Pi,Sc,Ge,Aq,Li');

// --- Yogārdha (2.4.19–20): half the sum of the Chara and the Sthira years -------------------------------------------------------------------
// The commentary: Libra, Chara 2 (Venus in Sagittarius), Sthira 7: four and a half years.
const libra = chartOf(7, { Venus: 9 });
assert.equal(charaYears(libra, 6), 2);
assert.equal(sthiraYears(6), 7);
assert.equal(yogardhaYears(libra, 6), 4.5);
assert.equal(names(yogardhaOrder(libra, 6)), 'Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi');

// --- Kendrādi (2.4.11–14): the start, the angles, the 2nd/5th/8th/11th, the rest -----------------------------------------------------------
// From Sagittarius (odd): the angles are Pisces, Gemini and Virgo, the next group Capricorn, Aries, Cancer and Libra, the last Aquarius, Taurus, Leo and Scorpio.
const sagittarius = kendradiOrder(chartOf(1, { Venus: 9 }), 8);
assert.equal(SIGN_ABBR[sagittarius[0]], 'Sg');
assert.deepEqual([...sagittarius.slice(1, 4)].sort((a, b) => a - b), [2, 5, 11], 'Gemini, Virgo, Pisces');
assert.deepEqual([...sagittarius.slice(4, 8)].sort((a, b) => a - b), [0, 3, 6, 9], 'Aries, Cancer, Libra, Capricorn');
assert.deepEqual([...sagittarius.slice(8)].sort((a, b) => a - b), [1, 4, 7, 10], 'Taurus, Leo, Scorpio, Aquarius');
// From an even sign the houses are counted from the 7th backwards: from Taurus the 2nd group is the 5th, 8th, 11th and 2nd of that count.
const taurus = kendradiOrder(chartOf(1, { Venus: 2 }), 1);
assert.equal(new Set(taurus).size, 12);
assert.deepEqual([...taurus.slice(1, 4)].sort((a, b) => a - b), [4, 7, 10], 'the angles: Leo, Scorpio, Aquarius');
// The more grahas a sign has the earlier it comes in its group: Virgo with two before Gemini and Pisces with none.
const strongVirgo = kendradiOrder(chartOf(1, { Sun: 6, Moon: 6, Venus: 9 }), 8);
assert.equal(SIGN_ABBR[strongVirgo[1]], 'Vi');
// The start is the stronger of the Ātmakāraka's sign and its 7th.
assert.equal(SIGN_ABBR[kendradiStart(chartOf(1, { Sun: 4, Moon: 4 }), 3)], 'Cn');
assert.equal(SIGN_ABBR[kendradiStart(chartOf(1, { Sun: 10, Moon: 10 }), 3)], 'Cp', 'the 7th, with two grahas');

// --- Śūla (2.3.18–25, BPHS 46.181–182) ------------------------------------------------------------------------------------------------------------
// Aries rising: the 8th is Scorpio, the 8th from the 7th is Taurus; with two grahas in Taurus it is the stronger, and as an even sign it runs backwards.
const shula = shulaOrder(chartOf(1, { Sun: 2, Moon: 2 }), 0, SHULA_HOUSES.self);
assert.equal(names([shula.start]), 'Ta');
assert.equal(names(shula.order), 'Ta,Ar,Pi,Aq,Cp,Sg,Sc,Li,Vi,Le,Cn,Ge');
// For the father the 9th (from the Lagna and from the 7th): Sagittarius or Gemini.
assert.equal(SHULA_HOUSES.father, 9);
assert.deepEqual(Object.values(SHULA_HOUSES), [8, 9, 4, 3, 5, 11]);

// --- Maṇḍūka (Jaimini Sūtras 2.4.15–16): the two examples of the commentary ------------------------------------------------------------------
// The Taurus daśā (Taurus stronger than Scorpio, an even sign, so reverse): Taurus, Aquarius, Scorpio, Leo; Aries, Capricorn, Libra, Cancer; Pisces, Sagittarius, Virgo, Gemini.
assert.equal(names(mandookaOrder(1)), 'Ta,Aq,Sc,Le,Ar,Cp,Li,Cn,Pi,Sg,Vi,Ge');
// The Gemini daśā (Sagittarius stronger than Gemini, an odd sign, so direct): Sagittarius, Pisces, Gemini, Virgo; Capricorn, Aries, Cancer, Libra; Aquarius, Taurus, Leo, Scorpio.
assert.equal(names(mandookaOrder(8)), 'Sg,Pi,Ge,Vi,Cp,Ar,Cn,Li,Aq,Ta,Le,Sc');
assert.equal(new Set(mandookaOrder(5)).size, 12);
// The start is the stronger of the sign and its 7th: two grahas in Scorpio make it the stronger of Taurus and Scorpio.
assert.equal(SIGN_ABBR[mandookaStart(chartOf(1, { Sun: 8, Moon: 8 }), 1)], 'Sc');
assert.equal(SIGN_ABBR[mandookaStart(chartOf(1, { Sun: 2, Moon: 2 }), 1)], 'Ta');
console.log('Jaimini rāśi daśā tests passed');
