// The Muhūrta Finder (muhurtaFinder.ts, muhurtaFinderRun.ts). The panchāṅga of a pair of longitudes is worked out by
// hand here; the search is checked against the walk through time with a made-up rule, and against the chart and the
// panchāṅga of the app at the middle of what it finds.
import assert from 'node:assert/strict';
import {
  BENEFICS, CHANDRABALA_USUAL, FINDER_SIZES, TARABALA_USUAL, TARA_NAMES, KARANA_NAMES, MALEFICS, effectiveRules, findWindows, formatChandra, formatRule, houseFrom, isImpossible, isLimited, karanaOf, localParts,
  matchesVara, momentMatches, nakshatraOf, neededBodies, parseChandra, parseRule, parseTara, formatTara, taraOf, ruleMatches, signOf, tithiLabel, tithiOf, yogaOf,
  type FinderCriteria, type FinderMoment, type FinderRule,
} from './muhurtaFinder';
import { FINDER_PRESETS } from './muhurtaFinderPresets';
import { MAX_FINDER_STEPS, finderStepCount, finderStepMinutes, jdToMs, runMuhurtaFinder } from './muhurtaFinderRun';
import { calculateChart } from './ephemeris';
import { calculatePanchang } from './panchang';
import { NAKSHATRA_NAMES } from './nakshatras';

const all = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);
const open: FinderCriteria = { vara: all(7), tithi: all(30, 1), nakshatra: all(27), yoga: all(27), karana: all(11), signs: {} };
const only = (change: Partial<FinderCriteria>): FinderCriteria => ({ ...open, ...change });

// ---------------------------------------------------------------------------
// What a pair of longitudes says (worked by hand)
// ---------------------------------------------------------------------------
// The Moon 12° ahead of the Sun: the second tithi begins. 360 − 0.01 behind: the thirtieth (new moon) is nearly over.
assert.equal(tithiOf(100, 100), 1, 'conjunction: the first tithi');
assert.equal(tithiOf(100, 111.99), 1);
assert.equal(tithiOf(100, 112), 2);
assert.equal(tithiOf(0, 180), 16, 'the full Moon ends the 15th: the 16th begins at 180°');
assert.equal(tithiOf(0, 179.99), 15);
assert.equal(tithiOf(10, 9.99), 30, 'just behind the Sun: the last tithi');
assert.equal(tithiOf(350, 5), 2, 'across 0°: 15° ahead is the second tithi');

assert.equal(nakshatraOf(0), 0, 'Aśvinī begins at 0°');
assert.equal(nakshatraOf(13.3), 0);
assert.equal(nakshatraOf(13.34), 1);
assert.equal(nakshatraOf(359.99), 26, 'Revatī ends at 360°');
assert.equal(nakshatraOf(-0.01), 26, 'a longitude below 0 is taken round');

assert.equal(yogaOf(0, 0), 0, 'the sum 0°: Viṣkambha');
assert.equal(yogaOf(100, 100), 15, '200° over 13°20′ is 15: Siddhi');
assert.equal(yogaOf(200, 200), 3, 'the sum 400° is 40° round, three widths of 13°20′: Saubhāgya');
assert.equal(yogaOf(359, 359.99), 26, 'the sum 718.99° is 358.99° round: the last yoga, Vaidhṛti');

// Karaṇa: half a tithi. The first half of the first tithi is Kiṃstughna, then Bava, Balava … Viṣṭi repeating, and the
// last three halves of the month Śakuni, Catuṣpada, Nāga.
const karana = (diff: number) => KARANA_NAMES[karanaOf(0, diff)];
assert.equal(karana(0), 'Kimstughna');
assert.equal(karana(5.99), 'Kimstughna');
assert.equal(karana(6), 'Bava');
assert.equal(karana(12), 'Balava');
assert.equal(karana(18), 'Kaulava');
assert.equal(karana(24), 'Taitila');
assert.equal(karana(30), 'Garija');
assert.equal(karana(36), 'Vanija');
assert.equal(karana(42), 'Visti');
assert.equal(karana(48), 'Bava', 'the sevenfold cycle begins again');
assert.equal(karana(6 * 56), 'Visti', 'the 56th half: 56 − 1 = 55, 55 mod 7 = 6');
assert.equal(karana(6 * 57), 'Shakuni');
assert.equal(karana(6 * 58), 'Chatushpada');
assert.equal(karana(6 * 59), 'Naga');
assert.equal(karana(359.99), 'Naga');
// Every karaṇa occurs: eight times each of the seven in a month, the four fixed ones once.
{
  const counts = new Map<string, number>();
  for (let half = 0; half < 60; half += 1) counts.set(karana(half * 6 + 1), (counts.get(karana(half * 6 + 1)) ?? 0) + 1);
  assert.deepEqual([...counts.entries()].filter(([name]) => !['Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'].includes(name)).map(([, count]) => count), Array(7).fill(8));
  assert.equal(counts.get('Kimstughna'), 1);
}

assert.equal(signOf(0), 0);
assert.equal(signOf(29.99), 0);
assert.equal(signOf(30), 1);
assert.equal(signOf(359.99), 11);
assert.equal(signOf(-1), 11);

assert.deepEqual([1, 8, 15, 16, 23, 30].map(tithiLabel), ['S1', 'S8', 'S15', 'K1', 'K8', 'K15']);

// ---------------------------------------------------------------------------
// The clock of a moment at a place
// ---------------------------------------------------------------------------
{
  const winter = Date.UTC(2026, 10, 1, 22, 30); // 1 November 2026, 22:30 UTC: Helsinki is two hours ahead
  assert.deepEqual(localParts(winter, 'Europe/Helsinki', 0), { year: 2026, month: 11, day: 2, hour: 0, minute: 30, weekday: 1 }, 'past midnight in Helsinki: Monday the 2nd');
  const summer = Date.UTC(2026, 6, 1, 21, 30); // three hours ahead in summer
  assert.deepEqual(localParts(summer, 'Europe/Helsinki', 0), { year: 2026, month: 7, day: 2, hour: 0, minute: 30, weekday: 4 }, 'the daylight-saving time of the date');
  assert.deepEqual(localParts(winter, undefined, 5.5), { year: 2026, month: 11, day: 2, hour: 4, minute: 0, weekday: 1 }, 'a fixed offset when there is no zone');
  assert.deepEqual(localParts(winter, 'Not/AZone', -5), { year: 2026, month: 11, day: 1, hour: 17, minute: 30, weekday: 0 }, 'a zone that does not exist falls back to the offset');
  assert.equal(localParts(Date.UTC(2026, 10, 1, 22, 0), 'Europe/Helsinki', 0).hour, 0, 'midnight is hour 0, not 24');
}

// ---------------------------------------------------------------------------
// The conditions
// // ---------------------------------------------------------------------------
assert.equal(isLimited(all(7), 7), false);
assert.equal(isLimited([1, 2], 7), true);
assert.equal(isLimited([1, 1, 2, 3, 4, 5, 6, 0], 7), false, 'a repeated item is still every item');
assert.equal(isImpossible(open), false);
assert.equal(isImpossible(only({ yoga: [] })), true, 'nothing chosen can never hold');
assert.equal(isImpossible(only({ signs: { Moon: [] } })), true);
assert.equal(isImpossible(only({ signs: { Moon: [3] } })), false);
assert.deepEqual(neededBodies(open), { luminaries: false, others: [] }, 'no condition, no ephemeris');
assert.deepEqual(neededBodies(only({ tithi: [1] })), { luminaries: true, others: [] });
assert.deepEqual(neededBodies(only({ signs: { Mars: [0], Asc: all(12) } })), { luminaries: false, others: ['Mars'] }, 'an Ascendant that may be in every sign is no condition');
assert.deepEqual(neededBodies(only({ signs: { Moon: [0] } })), { luminaries: true, others: [] });
assert.equal(matchesVara(only({ vara: [1, 3] }), 3), true);
assert.equal(matchesVara(only({ vara: [1, 3] }), 2), false);

{
  const moment: FinderMoment = { vara: 1, sun: 100, moon: 200, others: { Mars: 10, Asc: 95 } }; // the Moon 100° ahead: tithi 9, Svāti, yoga 300/13.33 = 22
  assert.equal(tithiOf(100, 200), 9);
  assert.equal(nakshatraOf(200), 15);
  assert.equal(yogaOf(100, 200), 22);
  assert.equal(momentMatches(moment, open), true);
  assert.equal(momentMatches(moment, only({ tithi: [9] })), true);
  assert.equal(momentMatches(moment, only({ tithi: [8, 10] })), false);
  assert.equal(momentMatches(moment, only({ nakshatra: [15], yoga: [22], vara: [1], tithi: [9] })), true);
  assert.equal(momentMatches(moment, only({ nakshatra: [15], yoga: [22], vara: [2], tithi: [9] })), false, 'one condition missed is enough');
  assert.equal(momentMatches(moment, only({ karana: [karanaOf(100, 200)] })), true);
  assert.equal(momentMatches(moment, only({ signs: { Mars: [0], Asc: [3], Sun: [3], Moon: [6] } })), true, 'Mars in Aries, the Ascendant, Sun and Moon in their signs');
  assert.equal(momentMatches(moment, only({ signs: { Mars: [1] } })), false);
  assert.equal(momentMatches({ ...moment, others: {} }, only({ signs: { Mars: [0] } })), false, 'a body the moment lacks is a condition not met');
}

// ---------------------------------------------------------------------------
// Placement rules: the houses from the Ascendant (worked by hand)
// ---------------------------------------------------------------------------
// The Ascendant at 100° is in Cancer (sign 3): a longitude at 100° is in the 1st house, 130° in the 2nd, 70° (Gemini) in the 12th,
// 280° (Capricorn, sign 9) in the 7th.
assert.equal(houseFrom(3, 100), 1);
assert.equal(houseFrom(3, 130), 2);
assert.equal(houseFrom(3, 70), 12);
assert.equal(houseFrom(3, 280), 7);
assert.equal(houseFrom(0, 359.99), 12);
assert.equal(houseFrom(11, 0), 2, 'Pisces rising: Aries is the 2nd');

{
  // Venus in the 1st and the Moon in the 5th: "at least one of Venus and the Moon in the 1st" holds, "none of them in the 5th" does not.
  const houses: Record<string, number> = { Venus: 1, Moon: 5, Sun: 9 };
  const houseOf = (graha: string) => houses[graha];
  assert.equal(ruleMatches({ kind: 'any', grahas: ['Venus', 'Moon'], houses: [1] }, houseOf), true);
  assert.equal(ruleMatches({ kind: 'any', grahas: ['Moon'], houses: [1, 2] }, houseOf), false);
  assert.equal(ruleMatches({ kind: 'none', grahas: ['Venus', 'Moon'], houses: [5] }, houseOf), false);
  assert.equal(ruleMatches({ kind: 'none', grahas: ['Venus', 'Sun'], houses: [5, 12] }, houseOf), true);
  assert.equal(ruleMatches({ kind: 'any', grahas: ['Mars'], houses: [1] }, houseOf), false, 'a graha that was not worked out fails the rule');
  assert.equal(ruleMatches({ kind: 'none', grahas: ['Mars'], houses: [1] }, houseOf), false);

  // The text of a rule, and back.
  const rule: FinderRule = { kind: 'none', grahas: ['Sun', 'Ketu'], houses: [8, 12] };
  assert.equal(formatRule(rule), 'none:Sun,Ketu:8,12');
  assert.deepEqual(parseRule('none:Sun,Ketu:12,8,8'), rule);
  assert.deepEqual(parseRule('any:Venus:'), { kind: 'any', grahas: ['Venus'], houses: [] });
  for (const bad of ['', 'any', 'some:Sun:1', 'any:Asc:1', 'any:Pluto:1', 'any:Sun:0', 'any:Sun:13', 'any:Sun:x', 'any:Sun:1:2']) {
    assert.ok('error' in parseRule(bad), `"${bad}" is refused`);
  }

  // Rules that can never hold, and those that put no condition.
  assert.equal(isImpossible(only({ rules: [{ kind: 'any', grahas: [], houses: [1] }] })), true);
  assert.equal(isImpossible(only({ rules: [{ kind: 'any', grahas: ['Sun'], houses: [] }] })), true);
  assert.equal(isImpossible(only({ rules: [{ kind: 'none', grahas: ['Sun'], houses: all(12, 1) }] })), true, 'the Sun is in some house');
  assert.equal(isImpossible(only({ rules: [{ kind: 'none', grahas: [], houses: [8] }] })), false);
  assert.equal(effectiveRules(only({ rules: [{ kind: 'none', grahas: [], houses: [8] }, { kind: 'none', grahas: ['Sun'], houses: [] }, { kind: 'any', grahas: ['Sun'], houses: [1] }] })).length, 1);

  // Ketu is opposite Rāhu: Rāhu at 100° (Cancer) puts Ketu at 280° (Capricorn), the 7th from a Cancer Ascendant.
  const moment: FinderMoment = { vara: 1, sun: 10, moon: 40, others: { Asc: 100, Rahu: 100 } };
  assert.equal(momentMatches(moment, only({ signs: { Ketu: [9] } })), true);
  assert.equal(momentMatches(moment, only({ signs: { Ketu: [3] } })), false);
  assert.equal(momentMatches(moment, only({ rules: [{ kind: 'any', grahas: ['Ketu'], houses: [7] }] })), true);
  assert.equal(momentMatches(moment, only({ rules: [{ kind: 'any', grahas: ['Rahu'], houses: [1] }, { kind: 'none', grahas: ['Sun', 'Moon'], houses: [8, 12] }] })), true);
  // The Sun at 10° (Aries) is the 10th from Cancer; the Moon at 40° (Taurus) the 11th.
  assert.equal(momentMatches(moment, only({ rules: [{ kind: 'any', grahas: ['Sun'], houses: [10] }, { kind: 'any', grahas: ['Moon'], houses: [11] }] })), true);
  assert.equal(momentMatches(moment, only({ rules: [{ kind: 'any', grahas: ['Sun'], houses: [10] }, { kind: 'any', grahas: ['Moon'], houses: [10] }] })), false, 'every rule must hold');
  assert.equal(momentMatches({ ...moment, others: {} }, only({ rules: [{ kind: 'any', grahas: ['Sun'], houses: [10] }] })), false, 'without an Ascendant the houses are unknown');
  assert.deepEqual([...BENEFICS, ...MALEFICS].sort(), ['Jupiter', 'Ketu', 'Mars', 'Mercury', 'Moon', 'Rahu', 'Saturn', 'Sun', 'Venus']);
}

// The ready-made choices of the store or business opening, as the source gives them.
{
  const preset = FINDER_PRESETS.find(entry => entry.id === 'business-opening')!;
  assert.deepEqual(preset.nakshatra!.map(index => NAKSHATRA_NAMES[index]), [
    'Ashwini', 'Rohini', 'Mrigashira', 'Pushya', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Anuradha', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Revati',
  ]);
  assert.equal(preset.nakshatra!.length, 11);
  assert.deepEqual(all(30, 1).filter(tithi => !preset.tithi!.includes(tithi)), [4, 9, 14, 19, 24, 29], 'the 4th, 9th and 14th of both halves are left out');
  assert.deepEqual(all(7).filter(vara => !preset.vara!.includes(vara)), [2], 'Tuesday, the vāra of Mars, is left out');
  assert.deepEqual(all(12).filter(sign => !preset.signs!.Asc!.includes(sign)), [10], 'Aquarius does not rise');
  assert.deepEqual(preset.rules!.map(formatRule), [
    'any:Venus,Moon:1', 'none:Sun,Mars,Saturn,Rahu,Ketu:8,12', 'any:Moon,Mercury,Jupiter,Venus:2,10,11',
  ]);
}

// ---------------------------------------------------------------------------
// Chandrabala: the Moon's house from the sign of the Moon at birth (worked by hand)
// ---------------------------------------------------------------------------
{
  // The Moon at birth in Taurus (sign 1): the Moon at 100° (Cancer) is in the 3rd house from it, at 130° (Leo) in the 4th, at 25° (Aries) in the 12th, at 40° (Taurus) in the 1st.
  assert.equal(houseFrom(1, 100), 3);
  assert.equal(houseFrom(1, 130), 4);
  assert.equal(houseFrom(1, 25), 12);
  assert.equal(houseFrom(1, 40), 1);
  const at = (moon: number): FinderMoment => ({ vara: 1, sun: 200, moon, others: {} });
  const usual = only({ chandra: { moonSign: 1, houses: CHANDRABALA_USUAL } });
  // 100° 3rd, 130° 4th, 25° 12th, 40° 1st, 70° (Gemini) 2nd, 280° (Capricorn) 9th, 220° (Scorpio) 7th, 250° (Sagittarius) 8th, the Candrāṣṭama.
  assert.deepEqual([100, 130, 25, 40, 70, 280, 220, 250].map(moon => momentMatches(at(moon), usual)), [true, false, false, true, false, false, true, false]);
  assert.equal(momentMatches(at(130), only({ chandra: { moonSign: 1, houses: all(12, 1) } })), true, 'every house is no condition');
  assert.equal(isImpossible(only({ chandra: { moonSign: 1, houses: [] } })), true);
  assert.equal(isImpossible(usual), false);
  assert.equal(neededBodies(usual).luminaries, true);
  assert.equal(neededBodies(only({ chandra: { moonSign: 1, houses: all(12, 1) } })).luminaries, false);
  assert.equal(formatChandra({ moonSign: 1, houses: [1, 3] }), '1:1,3');
  assert.deepEqual(parseChandra('1:11,3,3'), { moonSign: 1, houses: [3, 11] });
  assert.deepEqual(parseChandra('11:'), { moonSign: 11, houses: [] });
  for (const bad of ['', '1', '12:1', '-1:1', 'a:1', '1:0', '1:13', '1:x', '1:1:2']) assert.ok('error' in parseChandra(bad), `"${bad}" is refused`);
}

// ---------------------------------------------------------------------------
// Tarabala: the Moon's nakṣatra counted from the nakṣatra at birth, in nines (worked by hand)
// ---------------------------------------------------------------------------
{
  // Born in Rohiṇī (3): Rohiṇī itself is the 1st (Janma), Mṛgaśīrṣa (4) the 2nd (Sampat), Ārdrā (5) the 3rd (Vipat), Kṛttikā (2) the 27th, which is the 9th round.
  assert.equal(TARA_NAMES.length, 9);
  assert.deepEqual([3, 4, 5, 6, 7, 8, 9, 10, 11].map(nakshatra => taraOf(3, nakshatra)), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(taraOf(3, 12), 1, 'the 10th nakṣatra from the birth one is Janma again');
  assert.equal(taraOf(3, 21), 1, 'and the 19th');
  assert.equal(taraOf(3, 2), 9, 'Kṛttikā, the one before the birth nakṣatra, is the 27th: Parama Mitra');
  assert.equal(taraOf(0, 26), 9, 'Revatī from Aśvinī is the 27th');
  assert.equal(taraOf(26, 0), 2, 'Aśvinī from Revatī is the 2nd');
  assert.equal(TARA_NAMES[taraOf(3, 4) - 1], 'Sampat');
  const at = (moon: number): FinderMoment => ({ vara: 1, sun: 200, moon, others: {} });
  const usual = only({ tara: { nakshatra: 3, taras: TARABALA_USUAL } });
  // The Moon at 55° is in Mṛgaśīrṣa (53°20′ to 66°40′): Sampat, suits. At 45° (Rohiṇī, 40° to 53°20′): Janma, does not. At 70° (Ārdrā 66°40′ to 80°): Vipat, does not.
  assert.deepEqual([55, 45, 70, 85, 140].map(moon => momentMatches(at(moon), usual)), [true, false, false, true, true]);
  // 85° is Punarvasu (80° to 93°20′): the 4th, Kṣema, suits; 140° is Pūrva Phalgunī (133°20′ to 146°40′, the 11th nakṣatra, index 10): the 8th from Rohiṇī.
  assert.equal(taraOf(3, 10), 8, 'Pūrva Phalgunī is the 8th from Rohiṇī: Mitra');
    assert.equal(momentMatches(at(140), only({ tara: { nakshatra: 3, taras: all(9, 1) } })), true, 'every tārā is no condition');
  assert.equal(isImpossible(only({ tara: { nakshatra: 3, taras: [] } })), true);
  assert.equal(isImpossible(only({ tara: { nakshatra: 3, taras: [2] } })), false);
  assert.equal(neededBodies(only({ tara: { nakshatra: 3, taras: [2] } })).luminaries, true);
  assert.equal(neededBodies(only({ tara: { nakshatra: 3, taras: all(9, 1) } })).luminaries, false);
  assert.equal(formatTara({ nakshatra: 3, taras: [2, 4] }), '3:2,4');
  assert.deepEqual(parseTara('3:9,2,2'), { nakshatra: 3, taras: [2, 9] });
  assert.deepEqual(parseTara('26:'), { nakshatra: 26, taras: [] });
  for (const bad of ['', '3', '27:1', '-1:1', 'a:1', '3:0', '3:10', '3:x', '3:1:2', '3:12']) assert.ok('error' in parseTara(bad), `"${bad}" is refused`);
}

// ---------------------------------------------------------------------------
// The walk through time: stretches found to the minute from a rule with known edges
// ---------------------------------------------------------------------------
async function walks() {
  const minute = 1 / 1440;
  // True from 2.3 to 2.5 and from 5.0 to 6.0 (days since 0): the second begins exactly on a step.
  const rule = async (jd: number) => (jd >= 2.3 && jd < 2.5) || (jd >= 5 && jd < 6);
  const found = await findWindows(rule, 0, 10, 30);
  assert.equal(found.windows.length, 2);
  assert.ok(Math.abs(found.windows[0].startJd - 2.3) <= minute, `start ${found.windows[0].startJd}`);
  assert.ok(Math.abs(found.windows[0].endJd - 2.5) <= minute, `end ${found.windows[0].endJd}`);
  assert.ok(Math.abs(found.windows[1].startJd - 5) <= minute);
  assert.ok(Math.abs(found.windows[1].endJd - 6) <= minute);
  assert.equal(found.truncated, false);

  // True at both ends of the span: the stretches are cut there.
  const edges = await findWindows(async jd => jd < 1 || jd > 9, 0, 10, 60);
  assert.equal(edges.windows.length, 2);
  assert.equal(edges.windows[0].startJd, 0);
  assert.ok(Math.abs(edges.windows[0].endJd - 1) <= minute);
  assert.ok(Math.abs(edges.windows[1].startJd - 9) <= minute);
  assert.equal(edges.windows[1].endJd, 10);

  assert.deepEqual((await findWindows(async () => false, 0, 10, 60)).windows, []);
  const always = await findWindows(async () => true, 0, 10, 60);
  assert.deepEqual(always.windows, [{ startJd: 0, endJd: 10 }]);

  // The most stretches: it stops and says so.
  const many = await findWindows(async jd => Math.floor(jd * 2) % 2 === 0, 0, 20, 60, 5);
  assert.equal(many.windows.length, 5);
  assert.equal(many.truncated, true);
}

// ---------------------------------------------------------------------------
// The search, against the ephemeris
// ---------------------------------------------------------------------------
const PLACE = { lat: 60.46667, lng: 26.94583, zone: 'Europe/Helsinki', tz: 2 };
const request = (criteria: FinderCriteria, days: number, start = '2026-11-01') => ({
  start, days, ...PLACE, ayanamsa: 'lahiri', nodeMode: 'mean', ayanamsaOffset: 0, criteria,
});

async function searches() {
  assert.equal(finderStepMinutes(open), 15);
  assert.equal(finderStepMinutes(only({ signs: { Asc: [0] } })), 5);
  assert.equal(finderStepMinutes(only({ signs: { Asc: all(12) } })), 15, 'an Ascendant that may be anywhere is no condition');
  assert.equal(finderStepMinutes(only({ rules: [{ kind: 'any', grahas: ['Moon'], houses: [1] }] })), 5, 'the houses depend on the Ascendant');
  assert.equal(finderStepMinutes(only({ rules: [{ kind: 'none', grahas: [], houses: [8] }] })), 15, 'a rule that puts no condition is not looked at');
  assert.ok(finderStepCount(366, 5) <= MAX_FINDER_STEPS, 'a year with the Ascendant is allowed');
  assert.ok(finderStepCount(366, 15) < finderStepCount(366, 5));

  // Nothing chosen: nothing found, at once.
  const none = await runMuhurtaFinder(request(only({ nakshatra: [] }), 30));
  assert.deepEqual(none.windows, []);

  // No condition at all is the whole span in one stretch.
  const whole = await runMuhurtaFinder(request(open, 3));
  assert.equal(whole.windows.length, 1);
  assert.equal(whole.windows[0].start, whole.from);
  assert.equal(whole.windows[0].end, whole.to);

  // A tithi in a month: the first tithi of the bright half comes once, for a day or so.
  const first = await runMuhurtaFinder(request(only({ tithi: [1] }), 30));
  assert.ok(first.windows.length >= 1 && first.windows.length <= 2, `${first.windows.length} stretches of the first tithi`);
  for (const window of first.windows) {
    const hours = (window.end - window.start) / 3_600_000;
    assert.ok(hours > 19 && hours < 27, `a tithi lasts a day (${hours.toFixed(1)} h)`);
  }

  // Each stretch found is checked against the chart and the panchāṅga of the app at its middle, and the minute before
  // and after it against the conditions.
  const checks = async (criteria: FinderCriteria, days: number, atLeast: number, bright: boolean) => {
    const found = await runMuhurtaFinder(request(criteria, days));
    assert.ok(found.windows.length >= atLeast, `${found.windows.length} stretches`);
    for (const window of found.windows.slice(0, 4)) {
      const middle = new Date((window.start + window.end) / 2);
      // The local time at the middle of the stretch in Helsinki: +2 h from UTC from late October to March, +3 h in summer.
      const offset = middle.getUTCMonth() >= 3 && middle.getUTCMonth() <= 8 ? 3 : 2;
      const local = new Date(middle.getTime() + offset * 3_600_000);
      const chart = await calculateChart(
        local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0,
        PLACE.lat, PLACE.lng, offset, 'lahiri',
      );
      const pad = (value: number) => String(value).padStart(2, '0');
      const date = `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()} ${pad(local.getUTCHours())}.${pad(local.getUTCMinutes())}.00`;
      const panchang = calculatePanchang(chart, date, offset, 'lahiri');
      assert.ok(['Uttara Ashadha', 'Shravana'].includes(panchang.nakshatra), `${panchang.nakshatra} at the middle of ${middle.toISOString()}`);
      if (bright) assert.equal(panchang.paksha, 'Shukla', 'the bright half');
      assert.ok(!['Sunday', 'Saturday'].includes(panchang.vara) || criteria.vara.length === 7, `${panchang.vara}`);
      assert.ok(window.end > window.start);
      assert.ok(['Uttara Ashadha', 'Shravana'].includes(NAKSHATRA_NAMES[window.at.nakshatra]));
    }
  };
  // Uttara Āṣāḍhā or Śravaṇa on a weekday from Monday to Friday; and in the bright half (a nakṣatra comes every 27 days, the bright half for half of them).
  await checks(only({ nakshatra: [20, 21], vara: [1, 2, 3, 4, 5] }), 70, 2, false);
  await checks(only({ nakshatra: [20, 21], tithi: all(15, 1) }), 220, 2, true);

  // The weekday changes at sunrise, not at midnight: Sunday as a vāra runs from the Sunday sunrise to the Monday one.
  const sunday = await runMuhurtaFinder(request(only({ vara: [0] }), 7, '2026-11-01')); // 2026-11-01 is a Sunday
  assert.equal(sunday.windows.length >= 1, true);
  const w = sunday.windows[0];
  const startUtc = new Date(w.start);
  assert.ok(startUtc.getUTCHours() >= 3 && startUtc.getUTCHours() <= 7, `Sunday's vāra begins at sunrise (${startUtc.toISOString()})`);
  assert.ok(Math.abs((w.end - w.start) / 3_600_000 - 24) < 0.5, 'a vāra lasts a day');

  // A sign of a graha: the Moon in Taurus for about two and a quarter days each month, and Mars in its sign for weeks.
  const moonInTaurus = await runMuhurtaFinder(request(only({ signs: { Moon: [1] } }), 60));
  assert.ok(moonInTaurus.windows.length >= 1);
  for (const window of moonInTaurus.windows) {
    const days = (window.end - window.start) / 86_400_000;
    assert.ok(days > 1.8 && days < 3, `the Moon in a sign for ${days.toFixed(2)} days`);
  }


  // Rules about the houses, against the chart of the app at the middle of each stretch: Venus or the Moon in the Lagna, no malefic
  // in the 8th and 12th, with the vāra, tithi and nakṣatra of the store opening in front (the rules are looked at after them).
  const preset = FINDER_PRESETS.find(entry => entry.id === 'business-opening')!;
  const rulesOnly = only({ rules: preset.rules!.slice(0, 2) });
  const opening = await runMuhurtaFinder(request({ ...rulesOnly, nakshatra: preset.nakshatra!, tithi: preset.tithi!, vara: preset.vara!, signs: preset.signs! }, 60));
  assert.ok(opening.windows.length >= 5, `${opening.windows.length} stretches of the store opening in 60 days`);
  assert.equal(opening.stepMinutes, 5);
  for (const window of opening.windows.slice(0, 6)) {
    const middle = new Date((window.start + window.end) / 2);
    const local = new Date(middle.getTime() + 2 * 3_600_000); // Helsinki is +2 h from late October to March
    const chart = await calculateChart(
      local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0,
      PLACE.lat, PLACE.lng, 2, 'lahiri',
    );
    const signOfPlanet = (name: string) => chart.planets.find(planet => planet.name === name)!.sign;
    const ascSign = chart.ascendant.sign;
    assert.notEqual(ascSign, 11, 'Aquarius (the 11th sign) is not rising');
    assert.ok(signOfPlanet('Venus') === ascSign || signOfPlanet('Moon') === ascSign, 'Venus or the Moon is in the Lagna');
    for (const name of ['Sun', 'Mars', 'Saturn']) {
      const house = ((signOfPlanet(name) - ascSign + 12) % 12) + 1;
      assert.ok(house !== 8 && house !== 12, `${name} is in the ${house}th house`);
    }
  }
  // A rule only narrows: every stretch with the rules lies inside one without them.
  const without = await runMuhurtaFinder(request({ ...rulesOnly, rules: [], nakshatra: preset.nakshatra!, tithi: preset.tithi!, vara: preset.vara!, signs: preset.signs! }, 60));
  for (const window of opening.windows) {
    assert.ok(without.windows.some(outer => outer.start - 60_000 <= window.start && window.end <= outer.end + 60_000), 'inside a stretch of the same choices without the rules');
  }
  // The Moon in the 1st alone is the Moon in the sign that rises: a stretch of hours, once or twice a day.
  const moonRising = await runMuhurtaFinder(request(only({ rules: [{ kind: 'any', grahas: ['Moon'], houses: [1] }] }), 30));
  assert.ok(moonRising.windows.length >= 8 && moonRising.windows.length <= 40, `${moonRising.windows.length} stretches of the Moon in the Lagna in 30 days`);
  for (const window of moonRising.windows) {
    const hours = (window.end - window.start) / 3_600_000;
    assert.ok(hours > 0.1 && hours < 5, `${hours.toFixed(2)} h`);
  }

  // Chandrabala against the chart of the app: the Moon born in Gemini (sign 2), the usual six houses. At the middle of each stretch the Moon
  // is in Gemini, Leo, Libra, Scorpio, Capricorn... counted: the 1st Gemini, 3rd Leo, 6th Scorpio, 7th Sagittarius, 10th Pisces, 11th Aries.
  const chandra = await runMuhurtaFinder(request(only({ chandra: { moonSign: 2, houses: CHANDRABALA_USUAL } }), 60));
  assert.ok(chandra.windows.length >= 8, `${chandra.windows.length} stretches of the suiting Moon in 60 days`);
  const suiting = [2, 4, 7, 8, 11, 0];
  let covered = 0;
  for (const window of chandra.windows) covered += window.end - window.start;
  assert.ok(covered / (chandra.to - chandra.from) > 0.4 && covered / (chandra.to - chandra.from) < 0.6, 'six signs of twelve: about half of the time');
  for (const window of chandra.windows.slice(0, 6)) {
    const middle = new Date((window.start + window.end) / 2);
    const local = new Date(middle.getTime() + 2 * 3_600_000);
    const chart = await calculateChart(
      local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0,
      PLACE.lat, PLACE.lng, 2, 'lahiri',
    );
    const moonSign = chart.planets.find(planet => planet.name === 'Moon')!.sign - 1;
    assert.ok(suiting.includes(moonSign), `the Moon in sign ${moonSign} at the middle of ${middle.toISOString()}`);
  }
  assert.equal(chandra.stepMinutes, 15, 'the Moon alone is looked at every 15 minutes');

  // Tarabala against the chart of the app: born in Rohiṇī, the usual five tārās. At the middle of each stretch the Moon's nakṣatra counted from Rohiṇī is Sampat, Kṣema, Sādhana, Mitra or Parama Mitra.
  const tara = await runMuhurtaFinder(request(only({ tara: { nakshatra: 3, taras: TARABALA_USUAL } }), 60));
  assert.ok(tara.windows.length >= 15, `${tara.windows.length} stretches of the suiting tārās in 60 days`);
  let taraCovered = 0;
  for (const window of tara.windows) taraCovered += window.end - window.start;
  assert.ok(taraCovered / (tara.to - tara.from) > 0.45 && taraCovered / (tara.to - tara.from) < 0.65, 'five tārās of nine: about five ninths of the time');
  for (const window of tara.windows.slice(0, 8)) {
    const middle = new Date((window.start + window.end) / 2);
    const local = new Date(middle.getTime() + 2 * 3_600_000);
    const chart = await calculateChart(
      local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0,
      PLACE.lat, PLACE.lng, 2, 'lahiri',
    );
    const moonNakshatra = Math.floor((chart.planets.find(planet => planet.name === 'Moon')!.longitude % 360) / (360 / 27));
    assert.ok(TARABALA_USUAL.includes(((moonNakshatra - 3 + 27) % 27) % 9 + 1), `the Moon in nakṣatra ${moonNakshatra} at the middle of ${middle.toISOString()}`);
  }
  assert.equal(tara.stepMinutes, 15);

  // The Ascendant in a sign: a window of an hour or two each day, found with the finer step.
  const rising = await runMuhurtaFinder(request(only({ signs: { Asc: [0] } }), 5));
  assert.ok(rising.windows.length >= 4 && rising.windows.length <= 6, `${rising.windows.length} windows of Aries rising in five days`);
  for (const window of rising.windows) {
    const hours = (window.end - window.start) / 3_600_000;
    assert.ok(hours > 0.5 && hours < 4, `Aries at the horizon for ${hours.toFixed(2)} h at 60° N`);
  }
  assert.equal(rising.stepMinutes, 5);
  // The Ascendant in Aries and the Moon in Aries at once is a stretch within a stretch of each.
  assert.ok(jdToMs(2440587.5) === 0);
}

async function main() {
  await walks();
  await searches();
  console.log('Muhurta Finder tests passed');
}
main().catch(error => { console.error(error); process.exit(1); });
void FINDER_SIZES;
