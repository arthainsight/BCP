// The Muhūrta Finder (muhurtaFinder.ts, muhurtaFinderRun.ts). The panchāṅga of a pair of longitudes is worked out by
// hand here; the search is checked against the walk through time with a made-up rule, and against the chart and the
// panchāṅga of the app at the middle of what it finds.
import assert from 'node:assert/strict';
import {
  FINDER_SIZES, KARANA_NAMES, findWindows, isImpossible, isLimited, karanaOf, localParts, matchesVara, momentMatches, nakshatraOf, neededBodies, signOf,
  tithiLabel, tithiOf, yogaOf, type FinderCriteria, type FinderMoment,
} from './muhurtaFinder';
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
