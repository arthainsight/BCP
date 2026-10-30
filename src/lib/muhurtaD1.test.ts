// The wishes about the Rāśi chart (muhurtaD1.ts): each by hand from made-up positions, then the search against the chart of the app.
import assert from 'node:assert/strict';
import { D1_KEYS, D1_WISHES, d1Held, isD1Key, moonNature, type D1Key } from './muhurtaD1';
import type { DoshaSky } from './mahadosha';
import type { FinderCriteria } from './muhurtaFinder';
import { finderStepMinutes, runMuhurtaFinder } from './muhurtaFinderRun';
import { calculateChart } from './ephemeris';
import { getUtcOffsetHours } from './timezone';
import { getVargaSignIndex } from './varga';

/** The longitude `degree` into a sign (0 Aries to 11 Pisces). */
const at = (sign: number, degree = 15) => sign * 30 + degree;

/**
 * A sky with the Ascendant in Cancer (houses from Cancer: Leo 2nd, Virgo 3rd, Libra 4th, Scorpio 5th, Sagittarius 6th,
 * Capricorn 7th, Aquarius 8th, Pisces 9th, Aries 10th, Taurus 11th, Gemini 12th). The Sun in Leo, the Moon (waxing, 150°
 * from the Sun) in Libra, and the others out of the angles and out of the 8th and 12th.
 */
const sky = (change: Partial<Omit<DoshaSky, 'others'>> = {}, others: DoshaSky['others'] = {}): DoshaSky => ({
  vara: 3, sun: at(4, 5), moon: at(4, 5) + 150, asc: at(3, 10), ...change,
  others: { Mars: at(11, 20), Mercury: at(5), Jupiter: at(8), Venus: at(5), Saturn: at(4), Rahu: at(5, 25), ...others },
});

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------
assert.equal(D1_KEYS.length, 5);
assert.ok(D1_KEYS.every(isD1Key) && !isD1Key('nope'));
assert.ok(D1_KEYS.every(key => D1_WISHES[key].name && D1_WISHES[key].what));

// The Moon as the book has it.
assert.equal(moonNature(0, 130), 'benefic');
assert.equal(moonNature(0, 120), 'benefic');
assert.equal(moonNature(0, 240), 'benefic');
assert.equal(moonNature(0, 30), 'malefic', 'within 60° of the Sun');
assert.equal(moonNature(0, 320), 'malefic', 'within 60° the other way');
assert.equal(moonNature(0, 90), 'neutral');
assert.equal(moonNature(0, 270), 'neutral');

// ---------------------------------------------------------------------------
// By hand
// ---------------------------------------------------------------------------
{
  // The Lagna of a benefic: Taurus, Gemini, Cancer, Virgo, Libra, Sagittarius, Pisces; not Aries, Leo, Scorpio, Capricorn, Aquarius.
  const lagna = (asc: number, rest: Partial<Omit<DoshaSky, 'others'>> = {}) => d1Held('lagnaBenefic', sky({ asc, ...rest }));
  assert.deepEqual([1, 2, 3, 5, 6, 8, 11].map(sign => lagna(at(sign, 5))), Array(7).fill(true));
  assert.deepEqual([0, 4, 7, 9, 10].map(sign => lagna(at(sign, 5))), Array(5).fill(false));
  // Cancer is the Moon's, and the Moon within 60° of the Sun is a malefic.
  assert.equal(lagna(at(3, 5), { sun: 100, moon: 120 }), false, 'Cancer with the Moon 20° from the Sun');
  assert.equal(lagna(at(3, 5), { sun: 100, moon: 240 }), true, 'Cancer with the Moon 140° from the Sun');
  assert.equal(lagna(at(6, 5), { sun: 100, moon: 120 }), true, 'Libra with the same Moon');

  // The Navāṁśa Lagna: Aries 0°30′ is in the navāṁśa of Aries; 3°30′ of Taurus; 10° of Cancer (the 4th navāṁśa of Aries).
  const navamsa = (asc: number, rest: Partial<Omit<DoshaSky, 'others'>> = {}) => d1Held('navamsaLagnaBenefic', sky({ asc, ...rest }));
  assert.equal(getVargaSignIndex(at(0, 3.5), 9), 1);
  assert.equal(navamsa(0.5), false);
  assert.equal(navamsa(at(0, 3.5)), true);
  assert.equal(navamsa(at(0, 10)), true, 'Cancer, with the Moon a benefic');
  assert.equal(navamsa(at(0, 10), { sun: 100, moon: 120 }), false, 'Cancer, with the Moon a malefic');

  // The Moon in an upachaya from the Lagna: the 3rd (Virgo), 10th (Aries) or 11th (Taurus) from Cancer; not the 6th (Sagittarius) or 12th (Gemini).
  const moon = (sign: number) => d1Held('moonUpachaya', sky({ moon: at(sign, 5) }));
  assert.deepEqual([5, 0, 1].map(moon), [true, true, true]);
  assert.deepEqual([8, 2, 3, 7].map(moon), [false, false, false, false]);

  // The 8th (Aquarius) and 12th (Gemini) empty: Ketu is opposite Rāhu.
  assert.equal(d1Held('eighthTwelfthEmpty', sky()), true);
  assert.equal(d1Held('eighthTwelfthEmpty', sky({}, { Mars: at(10, 4) })), false, 'Mars in Aquarius');
  assert.equal(d1Held('eighthTwelfthEmpty', sky({}, { Venus: at(2, 4) })), false, 'Venus in Gemini');
  assert.equal(d1Held('eighthTwelfthEmpty', sky({}, { Rahu: at(4, 4) })), false, 'Rāhu in Leo puts Ketu in Aquarius');
  assert.equal(d1Held('eighthTwelfthEmpty', sky({ moon: at(10, 9) })), false, 'the Moon in Aquarius');

  // More benefics than malefics in the angles: Cancer, Libra, Capricorn, Aries (the 1st, 4th, 7th, 10th).
  const angles = (others: DoshaSky['others'], rest: Partial<Omit<DoshaSky, 'others'>> = {}) => d1Held('beneficsInAngles', sky(rest, others));
  assert.equal(angles({}), true, 'the Moon, a benefic, in Libra and nothing else');
  assert.equal(angles({ Jupiter: at(3, 4), Venus: at(6, 4) }), true, 'Jupiter in the Lagna, Venus and the Moon in Libra');
  assert.equal(angles({ Mars: at(0, 4), Saturn: at(9, 4) }), false, 'the Moon and two malefics: 1 to 2');
  assert.equal(angles({ Mars: at(0, 4) }), false, 'the Moon against Mars: 1 to 1 is not more');
  assert.equal(angles({ Mars: at(0, 4), Jupiter: at(3, 4) }), true, 'Jupiter and the Moon against Mars');
  // The Moon a malefic (within 60° of the Sun) in an angle counts against; a neutral Moon counts for neither.
  assert.equal(angles({ Jupiter: at(3, 4) }, { moon: at(4, 5) + 30 }), true, 'Jupiter in the Lagna; the Moon in Leo is not in an angle');
  assert.equal(angles({ Jupiter: at(3, 4) }, { sun: at(6, 1), moon: at(6, 20) }), false, 'the Moon in Libra within 60° of the Sun: Jupiter against the Moon and the Sun');
  assert.equal(angles({}, { moon: at(6, 5), sun: at(4, 5) + 100 }), false, 'a neutral Moon in an angle counts for neither: 0 to 0');
}

// ---------------------------------------------------------------------------
// The search, against the chart of the app
// ---------------------------------------------------------------------------
const PLACE = { lat: 60.46667, lng: 26.94583, zone: 'Europe/Helsinki', tz: 2 };
const open: FinderCriteria = {
  vara: [0, 1, 2, 3, 4, 5, 6], tithi: Array.from({ length: 30 }, (_, i) => i + 1), nakshatra: Array.from({ length: 27 }, (_, i) => i),
  yoga: Array.from({ length: 27 }, (_, i) => i), karana: Array.from({ length: 11 }, (_, i) => i), signs: {},
};
const request = (criteria: FinderCriteria, days: number, start: string) => ({ start, days, ...PLACE, ayanamsa: 'lahiri', nodeMode: 'mean', ayanamsaOffset: 0, criteria });

async function searches() {
  assert.equal(finderStepMinutes({ ...open, d1: ['moonUpachaya'] }), 5, 'the wishes about the chart depend on the Ascendant');
  assert.equal(finderStepMinutes({ ...open, d1: ['nope'] }), 15, 'an id the search does not know is not read');

  const all: D1Key[] = [...D1_KEYS];
  const found = await runMuhurtaFinder(request({ ...open, d1: all }, 6, '2026-11-02'));
  assert.ok(found.windows.length >= 15, `${found.windows.length} stretches in 6 days`);
  assert.equal(found.stepMinutes, 5);
  assert.equal(found.windows[0].start, found.from);
  assert.equal(found.windows[found.windows.length - 1].end, found.to);
  assert.ok(found.windows.every(window => window.maxScore === 5 && window.score! >= 0 && window.score! <= 5 && window.held!.length === window.score));
  assert.ok(new Set(found.windows.map(window => window.score)).size >= 3, 'the scores differ');

  // At the middle of each stretch the chart of the app holds exactly the wishes the stretch says.
  const BENEFIC_SIGNS = [1, 2, 3, 5, 6, 8, 11];
  for (const window of found.windows.slice(0, 14)) {
    const middleMs = (window.start + window.end) / 2;
    const offset = getUtcOffsetHours(PLACE.zone, new Date(middleMs));
    const local = new Date(middleMs + offset * 3_600_000);
    const chart = await calculateChart(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0, PLACE.lat, PLACE.lng, offset, 'lahiri');
    const planet = (name: string) => chart.planets.find(item => item.name === name)!;
    const ascSign = chart.ascendant.sign - 1;
    const house = (name: string) => ((planet(name).sign - 1 - ascSign + 12) % 12) + 1;
    const elongation = (((planet('Moon').longitude - planet('Sun').longitude) % 360) + 360) % 360;
    const moonMalefic = elongation < 60 || elongation > 300;
    const benefic = (sign: number) => BENEFIC_SIGNS.includes(sign) && !(sign === 3 && moonMalefic);
    const held: D1Key[] = [];
    if (benefic(ascSign)) held.push('lagnaBenefic');
    if (benefic(getVargaSignIndex(chart.ascendant.longitude, 9))) held.push('navamsaLagnaBenefic');
    const inAngle = (name: string) => [1, 4, 7, 10].includes(house(name));
    const moonBenefic = elongation >= 120 && elongation <= 240;
    const benefics = ['Mercury', 'Jupiter', 'Venus'].filter(inAngle).length + (moonBenefic && inAngle('Moon') ? 1 : 0);
    const malefics = ['Sun', 'Mars', 'Saturn'].filter(inAngle).length + (moonMalefic && inAngle('Moon') ? 1 : 0);
    if (benefics > malefics) held.push('beneficsInAngles');
    if ([3, 10, 11].includes(house('Moon'))) held.push('moonUpachaya');
    if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].some(name => [8, 12].includes(house(name)))) held.push('eighthTwelfthEmpty');
    // The nodes: the chart counts them like the search does, so the benefics against malefics in the angles and the empty 8th and 12th are checked with them.
    const withNodes = (names: string[]) => names.some(name => [8, 12].includes(house(name)));
    if (held.includes('eighthTwelfthEmpty') && withNodes(['Rahu', 'Ketu'])) held.splice(held.indexOf('eighthTwelfthEmpty'), 1);
    const maleficNodes = ['Rahu', 'Ketu'].filter(inAngle).length;
    if (held.includes('beneficsInAngles') && benefics <= malefics + maleficNodes) held.splice(held.indexOf('beneficsInAngles'), 1);
    if (!held.includes('beneficsInAngles') && benefics > malefics + maleficNodes) held.push('beneficsInAngles');
    assert.deepEqual([...(window.held as D1Key[])].sort(), [...held].sort(), `at ${new Date(middleMs).toISOString()}`);
  }

  // The lowest score: only the stretches with at least three of the five.
  const best = await runMuhurtaFinder(request({ ...open, d1: all, minScore: 3 }, 6, '2026-11-02'));
  assert.ok(best.windows.length >= 3 && best.windows.every(window => window.score! >= 3));
  // The Moon in an upachaya alone is a stretch of hours each day or two; with the wish on nothing it is the whole span with no score.
  const moon = await runMuhurtaFinder(request({ ...open, d1: ['moonUpachaya'] }, 6, '2026-11-02'));
  assert.ok(moon.windows.every(window => window.score === 0 || window.score === 1));
  const none = await runMuhurtaFinder(request({ ...open, d1: [] }, 6, '2026-11-02'));
  assert.equal(none.windows.length, 1);
  assert.equal(none.windows[0].score, undefined);
  // With the wishes of the Pañcāṅga groups together the points add: the Chandrabala (100) and a wish (1) give 101 at most.
  const together = await runMuhurtaFinder(request({
    ...open, d1: ['moonUpachaya'], chandra: { moonSign: 1, houses: [1, 3, 6, 7, 10, 11] }, prefer: ['chandra'],
  }, 6, '2026-11-02'));
  assert.ok(together.windows.every(window => window.maxScore === 101 && [0, 1, 100, 101].includes(window.score!)));
  assert.ok(together.windows.some(window => window.score === 101), 'both together somewhere');
}

searches().then(() => console.log('Muhurta D1 tests passed')).catch(error => { console.error(error); process.exit(1); });
