// The Muhūrta Finder (muhurtaFinder.ts, muhurtaFinderRun.ts). The panchāṅga of a pair of longitudes is worked out by
// hand here; the search is checked against the walk through time with a made-up rule, and against the chart and the
// panchāṅga of the app at the middle of what it finds.
import assert from 'node:assert/strict';
import {
  BENEFICS, CHANDRABALA_USUAL, FINDER_SIZES, FINDER_WEIGHTS, PREFER_KEYS, TARABALA_USUAL, TARA_NAMES, findStretches, momentScore, scoredKeys, KARANA_NAMES, MALEFICS, effectiveRules, findWindows, formatChandra, formatRule, houseFrom, isImpossible, isLimited, karanaOf, localParts,
  matchesVara, momentMatches, nakshatraOf, neededBodies, parseChandra, parseRule, parseTara, formatTara, taraOf, ruleMatches, signOf, tithiLabel, tithiOf, yogaOf,
  type FinderCriteria, type FinderMoment, type FinderRule,
} from './muhurtaFinder';
import { FINDER_PRESETS, FINDER_PRESET_CATEGORIES, NOT_APPLIED } from './muhurtaFinderPresets';
import { FI } from './i18n';
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

// The ready-made choices of Classical Muhurta, chapter 22, as the book prints them.
{
  const preset = (id: string) => FINDER_PRESETS.find(entry => entry.id === id)!;
  const names = (indices: number[]) => indices.map(index => NAKSHATRA_NAMES[index]);
  const sign = (indices: number[]) => indices.map(index => ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][index]);
  const weekdays = (indices: number[]) => indices.map(index => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]);

  const wedding = preset('marriage-wedding');
  assert.deepEqual(names(wedding.nakshatra!), ['Rohini', 'Mrigashira', 'Magha', 'Uttara Phalguni', 'Hasta', 'Swati', 'Anuradha', 'Mula', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Revati']);
  assert.deepEqual(wedding.tithi, [2, 3, 5, 7, 10, 11, 13, 17, 18, 20, 22], 'the favourable tithis, the dark half only to its 8th');
  assert.deepEqual(wedding.middling!.tithi, [1, 6, 8, 12, 15, 16, 21, 23], 'the middling ones: 1, 6, 8, 12 and Purnima, and the dark 1, 6 and 8');
  assert.equal(wedding.karana!.includes(6), false, 'Viṣṭi is left out');
  assert.equal(wedding.karana!.length, 10);
  assert.deepEqual(weekdays(wedding.vara!), ['Monday', 'Wednesday', 'Thursday', 'Friday'], 'not the vāras of the Sun, Mars and Saturn');
  assert.deepEqual(sign(wedding.signs!.Asc!), ['Gemini', 'Virgo', 'Libra']);
  assert.deepEqual(sign(wedding.middling!.asc!), ['Taurus', 'Cancer', 'Leo', 'Sagittarius', 'Aquarius'], 'the others than the four to avoid are middling');
  assert.deepEqual(wedding.rules!.map(formatRule), [
    'none:Moon,Sun,Mars,Saturn,Rahu,Ketu:1', 'none:Saturn:12', 'none:Mars:8,10', 'none:Venus:6', 'none:Moon:6,8', 'none:Mercury,Jupiter,Venus:8',
  ]);
  assert.equal(wedding.avoid!.length, 11, 'the eleven the book names first');
  assert.ok(['udayasta', 'sankranti', 'ekargala', 'bhriguShatka', 'ashtamaKuja', 'gandanta', 'kartari', 'sangraha', 'ashtamaLagna', 'vyatipata', 'vaidhriti'].every(id => wedding.avoid!.includes(id as never)));
  assert.equal(wedding.avoid!.includes('jamitra' as never), false, 'Jāmitra with the rest leaves no time in a year');

  const construction = preset('construction-start');
  assert.deepEqual(names(construction.nakshatra!), ['Rohini', 'Mrigashira', 'Pushya', 'Uttara Phalguni', 'Chitra', 'Swati', 'Anuradha', 'Mula', 'Uttara Ashadha', 'Shravana', 'Uttara Bhadrapada', 'Revati']);
  assert.deepEqual(names(construction.middling!.nakshatra!), ['Ashwini', 'Punarvasu', 'Hasta', 'Dhanishtha', 'Shatabhisha']);
  assert.deepEqual(construction.tithi!.filter(tithi => tithi <= 15), [1, 2, 3, 5, 6, 7, 10, 11, 13, 15], 'the 2nd, 6th, 10th and the odd ones but the 9th');
  assert.equal(construction.tithi!.includes(30), false, 'Amāvasyā is left out');
  assert.deepEqual(weekdays(construction.vara!), ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
  assert.deepEqual(sign(construction.signs!.Asc!), ['Taurus', 'Leo', 'Scorpio', 'Aquarius'], 'the fixed Rāśis');

  const entering = preset('house-entering');
  assert.deepEqual(names(entering.nakshatra!), ['Rohini', 'Mrigashira', 'Uttara Phalguni', 'Anuradha', 'Uttara Ashadha', 'Uttara Bhadrapada', 'Revati']);
  assert.deepEqual(names(entering.middling!.nakshatra!), ['Punarvasu', 'Pushya', 'Hasta', 'Chitra', 'Shravana', 'Shatabhisha'], 'the ones one of the two classical lists adds');
  assert.deepEqual(entering.tithi, [2, 3, 5, 7, 10, 11, 13, 16, 17, 18, 20, 22, 25], 'not the 4th, 9th, 14th or the last five of the dark half');
  assert.deepEqual(weekdays(entering.vara!), ['Monday', 'Wednesday', 'Thursday', 'Friday']);

  const purchase = preset('real-estate-purchase');
  assert.equal(purchase.nakshatra!.length, 14);
  assert.deepEqual(weekdays(purchase.vara!), ['Monday', 'Tuesday', 'Wednesday', 'Saturday']);
  assert.deepEqual(all(30, 1).filter(tithi => !purchase.tithi!.includes(tithi)), [4, 9, 14, 19, 24, 29]);
  assert.equal(purchase.karana!.includes(6), false);

  const journey = preset('journey-start');
  assert.deepEqual(names(journey.nakshatra!), ['Ashwini', 'Mrigashira', 'Pushya', 'Hasta', 'Anuradha', 'Shravana', 'Dhanishtha', 'Revati']);
  assert.deepEqual(names(journey.middling!.nakshatra!), ['Rohini', 'Punarvasu', 'Uttara Phalguni', 'Chitra', 'Mula', 'Uttara Ashadha', 'Shatabhisha']);
  assert.deepEqual(journey.tithi, [2, 3, 5, 7, 10, 11, 13, 17, 18, 20, 22, 25, 26, 28]);
  assert.deepEqual(weekdays(journey.vara!), ['Wednesday', 'Thursday', 'Friday']);
  assert.deepEqual(sign(journey.signs!.Asc!), ['Taurus', 'Leo', 'Libra', 'Sagittarius']);
  assert.deepEqual(sign(journey.middling!.asc!), ['Aries', 'Cancer', 'Virgo', 'Scorpio', 'Capricorn'], 'the other moveable Rāśis and the other Śīrṣodaya ones');

  // Every preset is in one of the listed kinds, has a name that is said in Finnish too, and names only what exists.
  assert.equal(new Set(FINDER_PRESETS.map(entry => entry.id)).size, FINDER_PRESETS.length);
  for (const entry of FINDER_PRESETS) {
    assert.ok((FINDER_PRESET_CATEGORIES as readonly string[]).includes(entry.category), entry.id);
    for (const text of [entry.category, entry.label, entry.note]) assert.ok(text in FI, `Finnish for "${text.slice(0, 40)}"`);
    for (const key of entry.notApplied ?? []) assert.ok(NOT_APPLIED[key] in FI, `Finnish for "${NOT_APPLIED[key]}"`);
    assert.ok((entry.nakshatra ?? []).every(index => index >= 0 && index <= 26), entry.id);
    assert.ok((entry.tithi ?? []).every(tithi => tithi >= 1 && tithi <= 30), entry.id);
    assert.ok(Object.values(entry.middling ?? {}).every(list => list.length > 0), entry.id);
    for (const [key, list] of [['nakshatra', entry.middling?.nakshatra], ['tithi', entry.middling?.tithi], ['asc', entry.middling?.asc]] as const) {
      const ticked = key === 'asc' ? entry.signs?.Asc : entry[key];
      assert.ok((list ?? []).every(value => !(ticked ?? []).includes(value)), `${entry.id}: what is middling is not ticked (${key})`);
    }
  }
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
// Wishes: the weights, the score of a moment, and the stretches of one score (worked by hand)
// ---------------------------------------------------------------------------
{
  // The scale of the Atharvaṇa Jyotiṣa extended by the Phalita Navaratna Saṅgraha.
  assert.deepEqual(FINDER_WEIGHTS, { tithi: 1, nakshatra: 4, vara: 8, karana: 16, yoga: 32, tara: 60, chandra: 100 });
  assert.equal(PREFER_KEYS.length, 7);
  // Born in Taurus (sign 1) and in Rohiṇī (3): the Moon at 100° is in Cancer (the 3rd house from Taurus: suits) and in Puṣya (index 7, the 5th from Rohiṇī: Pratyak, does not).
  const wishes = only({
    chandra: { moonSign: 1, houses: CHANDRABALA_USUAL }, tara: { nakshatra: 3, taras: TARABALA_USUAL },
    tithi: [1, 2, 3], vara: [4], prefer: ['chandra', 'tara', 'tithi', 'vara'],
  });
  const at = (moon: number, sun: number, vara: number): FinderMoment => ({ vara, sun, moon, others: {} });
  assert.deepEqual(scoredKeys(wishes), ['chandra', 'tara', 'tithi', 'vara']);
  // Moon 100°, Sun 90°: the 1st tithi (10° ahead, wait: 10° is the 1st tithi), Thursday: tithi 1 + vara 8 + chandra 100, tara not (Pratyak): 109 of 169.
  assert.deepEqual(momentScore(at(100, 90, 4), wishes), { score: 109, max: 169, held: ['chandra', 'tithi', 'vara'] });
  // Moon at 55° (Mṛgaśīrṣa, the 2nd tārā: suits; Taurus, the 1st house: suits), Sun 200°, a Monday: the 28th tithi, not the 1st to 3rd.
  assert.deepEqual(momentScore(at(55, 200, 1), wishes), { score: 160, max: 169, held: ['chandra', 'tara'] });
  // A group that is a wish does not limit: the moment is still a match, and a condition that is not a wish still does.
  assert.equal(momentMatches(at(100, 90, 4), wishes), true);
  assert.equal(momentMatches(at(100, 90, 1), wishes), true, 'the vāra is a wish, not a condition');
  assert.equal(momentMatches(at(100, 90, 1), { ...wishes, prefer: ['chandra', 'tara', 'tithi'] }), false, 'without the wish on the vāra it is a condition');
  assert.equal(momentMatches(at(100, 90, 4), { ...wishes, prefer: ['tithi'] }), false, 'the Moon in Cancer in Puṣya fails the Tarabala as a condition');
  // A wish with every item chosen scores nothing and is not scored; a wish with nothing chosen is not impossible.
  assert.deepEqual(scoredKeys(only({ prefer: ['tithi'] })), []);
  assert.equal(isImpossible(only({ tithi: [], prefer: ['tithi'] })), false, 'a wish with nothing chosen is never held, and limits nothing');
  assert.equal(isImpossible(only({ tithi: [] })), true, 'but a condition with nothing chosen is');
  assert.deepEqual(momentScore(at(100, 90, 4), only({ tithi: [], prefer: ['tithi'] })), { score: 0, max: 1, held: [] });
  assert.equal(matchesVara(only({ vara: [4], prefer: ['vara'] }), 1), true);
  assert.equal(neededBodies(only({ nakshatra: [1], prefer: ['nakshatra'] })).luminaries, true, 'a wish on the nakṣatra needs the Moon to score');
}

async function stretches() {
  // Stretches over which the value is the same: 0 to 2 days is 5, 2 to 5 is 9, 5 to 6 is out (-1), 6 to 10 is 5 again, the step is a day.
  const value = async (jd: number) => (jd < 2 ? 5 : jd < 5 ? 9 : jd < 6 ? -1 : 5);
  const found = await findStretches(value, 0, 10, 24 * 60 / 2, v => v >= 0);
  assert.deepEqual(found.stretches.map(stretch => stretch.value), [5, 9, 5]);
  assert.ok(Math.abs(found.stretches[0].endJd - 2) <= 1 / 1440 && Math.abs(found.stretches[1].startJd - 2) <= 1 / 1440);
  assert.ok(Math.abs(found.stretches[1].endJd - 5) <= 1 / 1440 && Math.abs(found.stretches[2].startJd - 6) <= 1 / 1440);
  assert.equal(found.stretches[2].endJd, 10);
  assert.equal(found.truncated, false);
  // Only the stretches whose value is kept; and the most stretches.
  assert.deepEqual((await findStretches(value, 0, 10, 720, v => v >= 9)).stretches.map(stretch => stretch.value), [9]);
  const many = await findStretches(async jd => Math.floor(jd), 0, 20, 360, v => v >= 0, 5);
  assert.equal(many.stretches.length, 5);
  assert.equal(many.truncated, true);
  // The value changes twice inside one step (a quarter of a day long): both stretches are found.
  const quick = await findStretches(async jd => (jd < 1.1 ? 1 : jd < 1.2 ? 2 : 3), 0, 3, 1440, v => v >= 0);
  assert.deepEqual(quick.stretches.map(stretch => stretch.value), [1, 2, 3]);
  assert.ok(Math.abs(quick.stretches[1].startJd - 1.1) <= 1 / 1440 && Math.abs(quick.stretches[1].endJd - 1.2) <= 1 / 1440);
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
  // The wedding: the eleven Mahādoṣas, the Lagna and the Bhāva rules together still leave stretches in a year, and each holds
  // what the book asks of the chart of the app: Gemini, Virgo or Libra rising and neither the Moon nor a malefic in the Lagna.
  {
    const wedding = FINDER_PRESETS.find(entry => entry.id === 'marriage-wedding')!;
    const result = await runMuhurtaFinder(request({
      ...open, nakshatra: wedding.nakshatra!, tithi: wedding.tithi!, vara: wedding.vara!, karana: wedding.karana!, signs: wedding.signs!, rules: wedding.rules!, avoid: wedding.avoid!,
    }, 365));
    assert.ok(result.windows.length >= 3, `${result.windows.length} stretches of the wedding in a year`);
    for (const window of result.windows.slice(0, 4)) {
      assert.ok([2, 5, 6].includes(window.at.ascendantSign), `the Lagna is sign ${window.at.ascendantSign}`);
      assert.ok(wedding.nakshatra!.includes(window.at.nakshatra) && wedding.tithi!.includes(window.at.tithi) && window.at.karana !== 6);
      const middle = new Date((window.start + window.end) / 2);
      const local = new Date(middle.getTime() + (middle.getUTCMonth() >= 3 && middle.getUTCMonth() <= 9 ? 3 : 2) * 3_600_000);
      const chart = await calculateChart(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0, PLACE.lat, PLACE.lng, middle.getUTCMonth() >= 3 && middle.getUTCMonth() <= 9 ? 3 : 2, 'lahiri');
      const ascSign = chart.ascendant.sign;
      const houseOf = (name: string) => ((chart.planets.find(planet => planet.name === name)!.sign - ascSign + 12) % 12) + 1;
      for (const name of ['Moon', 'Sun', 'Mars', 'Saturn']) assert.notEqual(houseOf(name), 1, `${name} is in the Lagna`);
      assert.notEqual(houseOf('Saturn'), 12);
      assert.ok(![8, 10].includes(houseOf('Mars')));
      assert.ok(![6, 8].includes(houseOf('Moon')));
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

  // Wishes against the chart of the app: the Moon born in Taurus, Rohiṇī, the usual houses and tārās as wishes. The stretches fill the span, each with
  // the score its wishes give: 160 when both hold, 100 for the Chandrabala alone, 60 for the Tarabala alone, 0 for none.
  const wished = await runMuhurtaFinder(request(only({
    chandra: { moonSign: 1, houses: CHANDRABALA_USUAL }, tara: { nakshatra: 3, taras: TARABALA_USUAL }, prefer: ['chandra', 'tara'],
  }), 30));
  assert.ok(wished.windows.length >= 20, `${wished.windows.length} stretches in 30 days`);
  assert.equal(wished.windows[0].start, wished.from);
  assert.equal(wished.windows[wished.windows.length - 1].end, wished.to);
  for (let index = 1; index < wished.windows.length; index += 1) {
    assert.ok(Math.abs(wished.windows[index].start - wished.windows[index - 1].end) <= 60_000, 'the stretches follow one another');
    assert.notEqual(wished.windows[index].score, wished.windows[index - 1].score, 'a new stretch where the score changes');
  }
  assert.ok(wished.windows.every(window => window.maxScore === 160 && [0, 60, 100, 160].includes(window.score!)));
  const bestShare = wished.windows.filter(window => window.score === 160).reduce((sum, window) => sum + window.end - window.start, 0) / (wished.to - wished.from);
  assert.ok(bestShare > 0.2 && bestShare < 0.36, `${(bestShare * 100).toFixed(1)} % of the time holds both (6 of 12 houses and 5 of 9 tārās: 28 %)`);
  for (const window of wished.windows.slice(0, 8)) {
    const middle = new Date((window.start + window.end) / 2);
    const local = new Date(middle.getTime() + 2 * 3_600_000);
    const chart = await calculateChart(
      local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0,
      PLACE.lat, PLACE.lng, 2, 'lahiri',
    );
    const moon = chart.planets.find(planet => planet.name === 'Moon')!;
    const house = ((moon.sign - 1 - 1 + 12) % 12) + 1;
    const nakshatra = Math.floor((moon.longitude % 360) / (360 / 27));
    const tara = ((nakshatra - 3 + 27) % 27) % 9 + 1;
    const score = (CHANDRABALA_USUAL.includes(house) ? 100 : 0) + (TARABALA_USUAL.includes(tara) ? 60 : 0);
    assert.equal(window.score, score, `the stretch at ${middle.toISOString()}: house ${house}, tārā ${tara}`);
  }
  // The lowest score: only the stretches that hold both.
  const best = await runMuhurtaFinder(request(only({
    chandra: { moonSign: 1, houses: CHANDRABALA_USUAL }, tara: { nakshatra: 3, taras: TARABALA_USUAL }, prefer: ['chandra', 'tara'], minScore: 160,
  }), 30));
  assert.ok(best.windows.length >= 5 && best.windows.every(window => window.score === 160));
  assert.equal(best.windows.length, wished.windows.filter(window => window.score === 160).length);
  // A wish with every item chosen is no wish at all: one stretch, no score.
  const nothing = await runMuhurtaFinder(request(only({ chandra: { moonSign: 1, houses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }, prefer: ['chandra'] }), 5));
  assert.equal(nothing.windows.length, 1);
  assert.equal(nothing.windows[0].score, undefined);
  // The same houses as conditions are the stretches of the 100 and the 160 together.
  const conditions = await runMuhurtaFinder(request(only({ chandra: { moonSign: 1, houses: CHANDRABALA_USUAL } }), 30));
  const withHouse = wished.windows.filter(window => window.score === 100 || window.score === 160).reduce((sum, window) => sum + window.end - window.start, 0);
  assert.ok(Math.abs(conditions.windows.reduce((sum, window) => sum + window.end - window.start, 0) - withHouse) < 30 * 60_000, 'as a condition the Chandrabala gives the stretches that score 100 or more');

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
  await stretches();
  await searches();
  console.log('Muhurta Finder tests passed');
}
main().catch(error => { console.error(error); process.exit(1); });
void FINDER_SIZES;
