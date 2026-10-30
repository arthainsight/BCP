// The Mahādoṣas of the Muhūrta Finder (mahadosha.ts, mahadoshaEvents.ts, and the search of muhurtaFinderRun.ts). The doṣas
// of a sky are worked out by hand from made-up positions; the doṣas of a stretch around an event are checked against known
// events (the eclipses of 2026) and against the declinations of the ephemeris; the search is checked against the panchāṅga
// and the chart of the app at the middle of each stretch.
import assert from 'node:assert/strict';
import {
  DOSHAS, DOSHAS_NOT_WORKED_OUT, DOSHA_IDS, EVENT_DOSHAS, doshaNeeds, doshaUsesAscendant, hasDosha, isDoshaId, jamitraNavamsa, jamitraRasi, panchangaReasons, tithyamsaOf,
  vishanadiOfSky, type DoshaId, type DoshaNatal, type DoshaOptions, type DoshaSky,
} from './mahadosha';
import {
  VYATIPATA_SHORT_HOURS, aroundEvent, ardhayama, calendarDays, declinationEqualities, eclipseMoments, insideWindows, mergeWindows,
  sankrantiMoments, varaVishanadi,
} from './mahadoshaEvents';
import { SE_MOON, SE_SUN, sweCalcUtEquatorial, sweJulday } from './ephemerisAdapter';
import { MALEFICS, type FinderCriteria } from './muhurtaFinder';
import { finderStepMinutes, runMuhurtaFinder } from './muhurtaFinderRun';
import { calculateChart } from './ephemeris';
import { calculatePanchang } from './panchang';
import { getUtcOffsetHours } from './timezone';
import { getVargaSignIndex } from './varga';

/** The longitude `degree` into a sign (0 Aries to 11 Pisces). */
const at = (sign: number, degree = 15) => sign * 30 + degree;

/**
 * A quiet sky, the Ascendant in Cancer 10°. From Cancer the houses run Cancer 1st, Leo 2nd, Virgo 3rd, Libra 4th, Scorpio
 * 5th, Sagittarius 6th, Capricorn 7th, Aquarius 8th, Pisces 9th, Aries 10th, Taurus 11th, Gemini 12th. The Moon is in
 * Taurus (the 11th), the Sun and Saturn in Leo (the 2nd), Rāhu in Virgo and Ketu in Pisces. Nothing is wrong in it.
 */
const quietOthers = (): DoshaSky['others'] => ({
  Mars: at(11, 20), Mercury: at(6), Jupiter: at(8), Venus: at(5), Saturn: at(4), Rahu: at(5, 25),
});
const sky = (change: Partial<Omit<DoshaSky, 'others'>> = {}, others: DoshaSky['others'] = {}): DoshaSky => ({
  vara: 3, sun: at(4, 5), moon: at(1, 20), asc: at(3, 10), ...change, others: { ...quietOthers(), ...others },
});
const has = (id: DoshaId, value: DoshaSky, natal?: DoshaNatal, options?: DoshaOptions) => hasDosha(id, value, natal, options);

// ---------------------------------------------------------------------------
// The list
// ---------------------------------------------------------------------------
assert.equal(DOSHA_IDS.length, 24);
assert.equal(new Set(DOSHA_IDS.map(id => DOSHAS[id].number)).size, 19, 'each has its own place in the list, the six Daśa Doṣas the 15th');
assert.deepEqual(DOSHA_IDS.filter(id => DOSHAS[id].number === 15).sort(), ['dashaYoga', 'ekargala', 'jamitra', 'latta', 'pata', 'upagraha']);
assert.deepEqual(
  [...new Set([...DOSHA_IDS.map(id => DOSHAS[id].number), ...DOSHAS_NOT_WORKED_OUT.map(item => item.number)])].sort((a, b) => a - b),
  Array.from({ length: 21 }, (_, index) => index + 1),
  'every one of the 21 is either worked out or listed with its reason',
);
assert.ok(DOSHA_IDS.every(isDoshaId) && !isDoshaId('vajra'));
assert.ok(EVENT_DOSHAS.every(id => !doshaNeeds(id).luminaries && !doshaNeeds(id).asc), 'the doṣas of a stretch need no sky');
assert.equal(doshaUsesAscendant('gandanta'), true, 'the Lagna gaṇḍānta');
assert.equal(doshaUsesAscendant('udayasta'), true);
assert.equal(doshaUsesAscendant('panchanga'), false);
assert.equal(doshaUsesAscendant('sangraha'), false);
assert.equal(finderStepMinutes({ vara: [0, 1, 2, 3, 4, 5, 6], tithi: [], nakshatra: [], yoga: [], karana: [], signs: {}, avoid: ['panchanga'] }), 15);
assert.equal(finderStepMinutes({ vara: [0, 1, 2, 3, 4, 5, 6], tithi: [], nakshatra: [], yoga: [], karana: [], signs: {}, avoid: ['panchanga', 'kartari'] }), 5, 'a doṣa of the Ascendant');

// The quiet sky has none of the doṣas of a sky (the weekday is a Wednesday, so the Pañcāṅga Doṣa is for the Sun and Moon below).
const NEW_ONES: DoshaId[] = ['panchanga', 'papashadvarga', 'vishaGhati', 'durmuhurta', 'ekargala', 'dashaYoga', 'jamitra', 'latta', 'upagraha', 'pata'];
for (const id of DOSHA_IDS) {
  if (NEW_ONES.includes(id)) continue;
  assert.equal(has(id, sky(), { ascSign: 0, moonSign: 0 }), false, `${id} in the quiet sky`);
}

// ---------------------------------------------------------------------------
// 1. Pañcāṅga Doṣa: each fault alone (the Sun and the Moon in degrees, the weekday)
// ---------------------------------------------------------------------------
{
  const panchanga = (vara: number, sun: number, moon: number) => panchangaReasons(sky({ vara, sun, moon }));
  // (0°, 14°): the 2nd tithi, Bālava, the sum 14° is Prīti, the Moon in Bharaṇī.
  assert.deepEqual(panchanga(3, 0, 14), [], 'a Wednesday of the 2nd tithi: clean');
  assert.deepEqual(panchanga(0, 0, 14), ['vara'], 'Sunday');
  assert.deepEqual(panchanga(2, 0, 14), ['vara'], 'Tuesday');
  assert.deepEqual(panchanga(3, 0, 36), ['tithi'], '36° ahead is the 4th tithi: Riktā');
  assert.deepEqual(panchanga(3, 0, 41), ['tithi'], 'still the 4th (Vanija)');
  assert.deepEqual(panchanga(3, 0, 48), [], 'the 5th is not');
  // Sun at 100°: the 9th tithi is 96° to 108° ahead (Moon 196° to 208°), the 14th 156° to 168°, the 19th 216° to 228°, the 30th 348° to 360°.
  for (const ahead of [100, 160, 220, 355]) assert.ok(panchanga(3, 100, 100 + ahead).includes('tithi'), `${ahead}° ahead`);
  assert.ok(!panchanga(3, 100, 100 + 120).includes('tithi'), 'the 11th tithi is not Riktā');
  // Viṣṭi: half-tithi 14 (84° to 90° ahead). Kiṃstughna: the first half of the 1st tithi.
  assert.deepEqual(panchanga(3, 0, 87), ['karana'], 'Viṣṭi in the 8th tithi');
  assert.deepEqual(panchanga(3, 100, 103), ['karana'], 'Kiṃstughna in the 1st tithi');
  // The yoga: the sum 6° is the first width, Viṣkambha.
  assert.deepEqual(panchanga(4, 0, 6), ['yoga'], 'Viṣkambha on a Thursday');
  // Wednesday with the Moon in Mūla (240° to 253°20′) is Yamaghaṇṭa; on Thursday it is not. Sunday with the Moon in Maghā (120° to 133°20′) is Sunday as well.
  assert.deepEqual(panchanga(3, 10, 245), ['yamaghanta']);
  assert.deepEqual(panchanga(4, 10, 245), []);
  assert.deepEqual(panchanga(0, 10, 125), ['vara', 'yamaghanta']);
  assert.equal(has('panchanga', sky({ vara: 3, sun: 0, moon: 14 })), false);
  assert.equal(has('panchanga', sky({ vara: 3, sun: 0, moon: 36 })), true);
}

// ---------------------------------------------------------------------------
// 2, 5, 6, 8, 9, 10, 11: places of the grahas
// ---------------------------------------------------------------------------
{
  // Udayāsta Śuddhi: a malefic in the 1st or the 7th, or the lord of either in the 6th, 8th or 12th.
  assert.equal(has('udayasta', sky({}, { Mars: at(3, 20) })), true, 'Mars in the 1st');
  assert.equal(has('udayasta', sky({ sun: at(3, 4) })), true, 'the Sun in the 1st');
  assert.equal(has('udayasta', sky({}, { Saturn: at(9, 2) })), true, 'Saturn in the 7th');
  assert.equal(has('udayasta', sky({}, { Rahu: at(9, 2) })), true, 'Rāhu in the 7th');
  assert.equal(has('udayasta', sky({}, { Rahu: at(3, 2) })), true, 'Rāhu in the 1st');
  assert.equal(has('udayasta', sky({}, { Rahu: at(9, 5) })), true, 'Rāhu in the 7th puts Ketu in the 1st (and itself in the 7th)');
  // The lord of the 1st is the Moon (Cancer), of the 7th Saturn (Capricorn).
  assert.equal(has('udayasta', sky({ moon: at(10, 12) })), true, 'the lord of the 1st in the 8th');
  assert.equal(has('udayasta', sky({ moon: at(2, 12) })), true, 'the lord of the 1st in the 12th');
  assert.equal(has('udayasta', sky({}, { Saturn: at(8, 20) })), true, 'the lord of the 7th in the 6th');
  assert.equal(has('udayasta', sky({}, { Saturn: at(6, 20) })), false, 'the lord of the 7th in the 4th');
  assert.equal(has('udayasta', sky({}, { Mars: at(0, 3) })), false, 'Mars in the 10th does no harm');

  // Bhṛgu ṣaṭka and Aṣṭama Kuja.
  assert.equal(has('bhriguShatka', sky({}, { Venus: at(8, 5) })), true, 'Venus in Sagittarius, the 6th from Cancer');
  assert.equal(has('bhriguShatka', sky({}, { Venus: at(9, 5) })), false);
  assert.equal(has('ashtamaKuja', sky({}, { Mars: at(10, 5) })), true, 'Mars in Aquarius, the 8th from Cancer');
  assert.equal(has('ashtamaKuja', sky({}, { Mars: at(9, 5) })), false);

  // Kartarī: malefics in both neighbours of the Ascendant (Gemini and Leo) or of the Moon (Aries and Gemini). In the quiet sky Leo holds the Sun and Saturn.
  assert.equal(has('kartari', sky({}, { Mars: at(2, 5) })), true, 'Mars in Gemini, the Sun and Saturn in Leo: around the Ascendant');
  assert.equal(has('kartari', sky({ sun: at(6, 3) }, { Saturn: at(6, 20), Mars: at(2, 5) })), false, 'Mars alone on one side of the Ascendant and of the Moon');
  assert.equal(has('kartari', sky({ sun: at(6, 3) }, { Saturn: at(0, 20), Mars: at(2, 5) })), true, 'Saturn in Aries and Mars in Gemini around the Moon');
  assert.equal(has('kartari', sky({ sun: at(0, 3) }, { Saturn: at(6, 20), Mars: at(2, 5) })), true, 'the Sun in Aries and Mars in Gemini around the Moon');
  assert.equal(has('kartari', sky({ sun: at(6, 3) }, { Saturn: at(0, 20), Rahu: at(8, 10) })), true, 'Rāhu in Sagittarius puts Ketu in Gemini: Ketu and Saturn around the Moon');
  assert.equal(has('kartari', sky({ sun: at(6, 3) }, { Saturn: at(0, 20), Rahu: at(7, 10) })), false, 'Jupiter and the Moon are not malefics: Aries alone');

  // The 7th house as the pivot too: Capricorn, with Mars in Aquarius and Saturn in Sagittarius around it.
  assert.equal(has('kartari', sky({ sun: at(6, 3) }, { Mars: at(10, 5), Saturn: at(8, 20) })), true, 'malefics on both sides of the 7th house');
  assert.equal(has('kartari', sky({ sun: at(6, 3) }, { Mars: at(10, 5), Saturn: at(6, 20) })), false, 'on one side only');

  // Ṣaḍaṣṭariṣpha Candra: the Moon in the 6th, 8th or 12th from the Ascendant.
  for (const [sign, expected] of [[8, true], [10, true], [2, true], [9, false], [1, false], [3, false]] as const) {
    assert.equal(has('chandraShadashtaka', sky({ moon: at(sign, 5) })), expected, `the Moon in sign ${sign}`);
  }

  // Saṅgraha: the Moon in the sign of another graha; Ketu is opposite Rāhu.
  assert.equal(has('sangraha', sky({}, { Jupiter: at(1, 3) })), true, 'Jupiter with the Moon in Taurus');
  assert.equal(has('sangraha', sky({ sun: at(1, 3) })), true, 'the Sun with the Moon');
  assert.equal(has('sangraha', sky({}, { Rahu: at(7, 5) })), true, 'Rāhu in Scorpio puts Ketu in Taurus with the Moon');
  assert.equal(has('sangraha', sky({}, { Rahu: at(1, 5) })), true, 'Rāhu in Taurus with the Moon');
  assert.equal(has('sangraha', sky({ moon: at(9, 5) })), false);

  // Aṣṭama Lagna: the Lagna in the 8th sign from the Ascendant of the birth chart (Cancer: Aquarius) or from its Moon (Leo: Pisces).
  const natal: DoshaNatal = { ascSign: 3, moonSign: 4 };
  assert.equal(has('ashtamaLagna', sky({ asc: at(10, 5) }), natal), true, 'Aquarius');
  assert.equal(has('ashtamaLagna', sky({ asc: at(11, 5) }), natal), true, 'Pisces');
  assert.equal(has('ashtamaLagna', sky({ asc: at(0, 5) }), natal), false);
  assert.equal(has('ashtamaLagna', sky({ asc: at(10, 5) })), false, 'without a birth chart there is nothing to count from');
}

// ---------------------------------------------------------------------------
// 7. Gaṇḍānta: 2 ghaṭīs of 60 is a thirtieth of the tithi (0.4°) and of the nakṣatra (0°26′40″)
// ---------------------------------------------------------------------------
{
  const gandanta = (sun: number, moon: number) => has('gandanta', sky({ sun, moon }));
  // The end of the 5th tithi (47.6°+ ... 60° ahead): the last 0.4° is 59.6° to 60°.
  assert.equal(gandanta(0, 59.7), true, 'the last 2 ghaṭīs of the 5th tithi');
  assert.equal(gandanta(0, 59.5), false);
  assert.equal(gandanta(0, 60.2), true, 'the first 2 ghaṭīs of the 6th');
  assert.equal(gandanta(0, 60.5), false);
  assert.equal(gandanta(100, (100 + 239.7) % 360), true, 'the end of the 20th tithi (the 5th of the dark half)');
  assert.equal(gandanta(100, (100 + 359.7) % 360), true, 'the end of the 30th');
  assert.equal(gandanta(100, (100 + 180.2) % 360), true, 'the start of the 16th (the 1st of the dark half)');
  assert.equal(gandanta(0, 40), false, 'the middle of a tithi');
  // Nakṣatras (the Sun placed so that the tithi is not at an end): Āśleṣā ends and Maghā starts at 120°, Jyeṣṭhā ends and Mūla starts at 240°,
  // Revatī ends and Aśvinī starts at 0°. The text: the last pada (3°20′) of the first three and the first pada of the others.
  assert.equal(gandanta(50, 119.7), true, 'the end of Āśleṣā');
  assert.equal(gandanta(50, 116.8), true, 'the last pada of Āśleṣā begins at 116°40′');
  assert.equal(gandanta(50, 116.5), false);
  assert.equal(gandanta(50, 120.2), true, 'the start of Maghā');
  assert.equal(gandanta(50, 123.2), true, 'the first pada of Maghā ends at 123°20′');
  assert.equal(gandanta(50, 123.6), false);
  assert.equal(gandanta(100, 239.7), true, 'the end of Jyeṣṭhā');
  assert.equal(gandanta(100, 240.2), true, 'the start of Mūla');
  assert.equal(gandanta(100, 359.8), true, 'the end of Revatī');
  assert.equal(gandanta(100, 0.2), true, 'the start of Aśvinī');
  assert.equal(gandanta(100, 180), false, 'the middle of Citrā');
  // The shorter parts the text allows: 4 ghaṭīs (53′20″) or 2 ghaṭīs (26′40″) of the nakṣatra.
  const part = (moon: number, gandantaNakshatra: DoshaOptions['gandantaNakshatra']) => has('gandanta', sky({ sun: 50, moon }), undefined, { gandantaNakshatra });
  assert.equal(part(119.5, 'two'), false, '26′40″ of Āśleṣā ends at 119°33′20″');
  assert.equal(part(119.7, 'two'), true);
  assert.equal(part(119.0, 'four'), false, '53′20″ of Āśleṣā begins at 119°06′40″');
  assert.equal(part(119.2, 'four'), true);
  assert.equal(part(120.5, 'two'), false);
  assert.equal(part(120.5, 'four'), true);
  // The Lagna: the last 3° of Cancer, Scorpio and Pisces and the first 3° of Leo, Sagittarius and Aries.
  const lagna = (asc: number) => has('gandanta', sky({ asc }));
  assert.deepEqual([at(3, 28), at(3, 26.9), at(4, 2.9), at(4, 3.1)].map(lagna), [true, false, true, false], 'Cancer into Leo');
  assert.deepEqual([at(7, 27.1), at(7, 26.9), at(8, 0.5), at(8, 3.1)].map(lagna), [true, false, true, false], 'Scorpio into Sagittarius');
  assert.deepEqual([at(11, 29.9), at(11, 26.9), at(0, 0.1), at(0, 3.2)].map(lagna), [true, false, true, false], 'Pisces into Aries');
  assert.deepEqual([at(2, 29.9), at(5, 29.9), at(9, 29.9), at(1, 0.5), at(6, 1)].map(lagna), [false, false, false, false, false], 'the other junctions are not gaṇḍānta');
}

// ---------------------------------------------------------------------------
// 19. Kunavāṁśa: the navāṁśa of the Lagna, and a malefic in it
// ---------------------------------------------------------------------------
{
  // Aries 0°30′ is in the first navāṁśa, Aries, a sign of Mars.
  assert.equal(has('kunavamsa', sky({ asc: 0.5 })), true, 'the Lagna in the navāṁśa of Aries');
  // Aries 3°30′ is in the second, Taurus (Venus): not a malefic's. A malefic in the navāṁśa of Taurus is the fault.
  const asc = at(0, 3.5);
  assert.equal(getVargaSignIndex(asc, 9), 1);
  const clean = sky({ asc, sun: at(4, 20) });
  assert.ok(MALEFICS.every(graha => {
    const longitude = graha === 'Sun' ? clean.sun : graha === 'Ketu' ? (clean.others.Rahu! + 180) % 360 : clean.others[graha]!;
    return getVargaSignIndex(longitude, 9) !== 1;
  }), 'set-up: no malefic in the navāṁśa of Taurus');
  assert.equal(has('kunavamsa', clean), false);
  assert.equal(has('kunavamsa', sky({ asc, sun: at(0, 3.5) })), true, 'the Sun at 3°30′ of Aries is in the navāṁśa of Taurus too');
}

// ---------------------------------------------------------------------------
// The tables of the Viṣanāḍī, typed as the text prints them (degrees; the Krishna half of the tithis is 180° on)
// ---------------------------------------------------------------------------
const TITHI_TABLE: [number, number][] = [
  [4.8, 5.6], [14.4, 15.2], [35, 35.8], [37, 37.8], [58.8, 59.6], [61, 61.8], [78.8, 79.6], [86, 86.8], [100.2, 101], [109.4, 110.2],
  [125.8, 126.6], [133.2, 134], [146.6, 147.4], [160.2, 161], [175, 175.8],
];
const TITHI_RANGES: [number, number][] = [...TITHI_TABLE, ...TITHI_TABLE.map(([from, to]) => [from + 180, to + 180] as [number, number])];
/** Not Rohiṇī, Mṛgaśīrṣa, Ārdrā, Svāti, Anurādhā, Uttara Āṣāḍhā and Śravaṇa, which have none of significance; Mūla has two. */
const NAKSHATRA_RANGES: [number, number][] = [
  [11.1111, 12], [18.6667, 19.5556], [33.3333, 34.2222], [86.6667, 87.5556], [97.7778, 98.6667], [113.7778, 114.6667], [126.6667, 127.5556],
  [137.7778, 138.6667], [150.6667, 151.5556], [164.6667, 165.5556], [177.7778, 178.6667], [203.1111, 204], [229.7778, 230.6667],
  [244.4444, 245.3333], [252.4444, 253.3333], [258.6667, 259.5556], [295.5556, 296.4444], [310.6667, 311.5556], [323.5556, 324.4444],
  [338.6667, 339.5556], [353.3333, 354.2222],
];
const insideRanges = (value: number, ranges: [number, number][]) => ranges.some(([from, to]) => value >= from && value < to);
const nearRanges = (value: number, ranges: [number, number][]) => ranges.some(([from, to]) => Math.abs(value - from) < 0.003 || Math.abs(value - to) < 0.003);

// ---------------------------------------------------------------------------
// 4, 12, 13, 15: Pāpaṣaḍvarga, Viṣanāḍī, Dūrmuhūrta and the Daśa Doṣas (by hand)
// ---------------------------------------------------------------------------
{
  // Pāpaṣaḍvarga. The Lagna at Aries 0°30′ is in the sign of Mars in the Rāśi, Drekkāṇa, Navāṁśa, Dvādaśāṁśa and Triṁśāṁśa, and of the Sun in the Horā.
  assert.equal(has('papashadvarga', sky({ asc: 0.5 })), true, 'all six of a malefic');
  // Libra 1°: Venus's sign in the Rāśi, Drekkāṇa, Navāṁśa and Dvādaśāṁśa; the Sun's in the Horā; Mars's in the Triṁśāṁśa: two malefics of six.
  assert.equal(has('papashadvarga', sky({ asc: at(6, 1) })), false);
  // Cancer 1° is the Moon's sign in five vargas: a benefic with the Moon waxing, a malefic waning.
  const waxing = { sun: 0, moon: 90 }; // the 8th tithi
  const waning = { sun: 0, moon: 270 }; // the 23rd tithi
  assert.equal(has('papashadvarga', sky({ asc: at(3, 1), ...waxing })), false, 'the Moon waxing');
  assert.equal(has('papashadvarga', sky({ asc: at(3, 1), ...waning })), true, 'the Moon waning');

  // Viṣanāḍī of the tithi and the nakṣatra against the tables, over the whole circle.
  for (let degree = 0; degree < 360; degree += 0.01) {
    if (!nearRanges(degree, TITHI_RANGES)) assert.equal(vishanadiOfSky(sky({ sun: 0, moon: degree })).tithi, insideRanges(degree, TITHI_RANGES), `tithi at ${degree.toFixed(2)}°`);
    if (!nearRanges(degree, NAKSHATRA_RANGES)) assert.equal(vishanadiOfSky(sky({ sun: 200, moon: degree })).nakshatra, insideRanges(degree, NAKSHATRA_RANGES), `nakṣatra at ${degree.toFixed(2)}°`);
  }
  assert.equal(has('vishaGhati', sky({ sun: 0, moon: 5 })), true, 'the first tithi at 5°');
  assert.equal(has('vishaGhati', sky({ sun: 0, moon: 7 })), false);
  // The weekday's Viṣanāḍī: from the 30th nāḍī after sunrise on Sunday, 4 nāḍīs; the day from sunrise 0 to the next at 1 has 60 nāḍīs.
  const sundayPoison = varaVishanadi(0, 1, 30);
  assert.ok(Math.abs(sundayPoison.startJd - 0.5) < 1e-12 && Math.abs(sundayPoison.endJd - (0.5 + 4 / 60)) < 1e-12);

  // Dūrmuhūrta: the tithyaṁśa is the thirtieth part of the tithi, 0.4° of the Sun–Moon distance.
  const dur = (vara: number, within: number) => has('durmuhurta', sky({ vara, sun: 0, moon: within }));
  assert.equal(tithyamsaOf(sky({ sun: 0, moon: 0.1 })), 1);
  assert.equal(tithyamsaOf(sky({ sun: 0, moon: 13 })), 3, 'the third part of the second tithi');
  assert.equal(dur(3, 0.1), true, 'the 1st tithyaṁśa (Rudra) is always unfavourable');
  assert.equal(dur(3, 0.9), false, 'the 3rd (Mitra) is not, on a Wednesday');
  assert.equal(dur(0, 5.4), true, 'the Sun\'s 14th (Aryaman) on a Sunday');
  assert.equal(dur(1, 5.4), false, 'the Sun\'s 14th is not the Moon\'s');
  assert.equal(dur(1, 3.4), true, 'the Moon\'s 9th (Vidhata) on a Monday');
  assert.equal(dur(3, 2.9), true, 'Mercury\'s 8th (Abhijit) on a Wednesday');
  assert.equal(dur(4, 2.1), true, 'Jupiter\'s 6th (Ambu) on a Thursday');
  assert.deepEqual([1, 2, 4, 10, 11, 12, 15, 16, 17, 21, 22].map(part => dur(3, (part - 0.5) * 0.4)), Array(11).fill(true), 'the unfavourable tithyaṁśas on any weekday');
  assert.deepEqual([3, 5, 6, 7, 8, 9, 13, 14, 18, 19, 20, 23].map(part => dur(3, (part - 0.5) * 0.4)), [false, false, false, false, true, false, false, false, false, false, false, false], 'a Wednesday has only the 8th besides');

  // Ekārgalā: Vyāghāta runs for the sum 160° to 173°20′; the 13th yoga's nakṣatra is Pūrva Āṣāḍhā (the 20th, index 19); the Sun in Ārdrā (index 5) and the Moon
  // in Punarvasu (6) add up to 11 = twice 19, less 27.
  assert.equal(has('ekargala', sky({ sun: 75, moon: 92 })), true);
  assert.equal(has('ekargala', sky({ sun: 75, moon: 100 })), false, 'the Moon in Puṣya: Harṣaṇa runs, which is not unfavourable');
  // Daśa Yoga: the numbers of the nakṣatras added, the remainder over 27.
  assert.equal(has('dashaYoga', sky({ sun: 5, moon: 30 })), true, 'Aśvinī 1 and Kṛttikā 3: 4');
  assert.equal(has('dashaYoga', sky({ sun: 5, moon: 50 })), false, 'Aśvinī 1 and Rohiṇī 4: 5');
  assert.equal(has('dashaYoga', sky({ sun: 170, moon: 185 })), true, 'Hasta 13 and Citrā 14: 27, remainder 0');
  // Jāmitra: a graha in the 7th from the Lagna (Cancer, so Capricorn) or from the Moon (Taurus, so Scorpio); Mercury in the 7th from the Moon is good.
  assert.equal(jamitraRasi(sky({}, { Saturn: at(9, 4) })), true, 'Saturn in Capricorn');
  assert.equal(jamitraRasi(sky({}, { Mars: at(7, 4) })), true, 'Mars in Scorpio, the 7th from the Moon');
  assert.equal(jamitraRasi(sky({}, { Mercury: at(7, 4) })), false, 'Mercury in the 7th from the Moon');
  assert.equal(jamitraRasi(sky()), false);
  // In the navāṁśa: Mars at Pisces 20° is in the navāṁśa of Capricorn, the 7th from the navāṁśa of the Moon (Taurus 20°: Cancer).
  assert.equal(jamitraNavamsa(sky()), true);
  assert.equal(jamitraNavamsa(sky({}, { Mars: at(11, 2) })), false, 'Mars at Pisces 2° is in the navāṁśa of Cancer');
  assert.equal(has('jamitra', sky()), true);
  // Lattā: the quiet sky has the Sun in Maghā (kicks 20), Mars in Revatī (1), Mercury in Svāti (8), Jupiter in Pūrva Āṣāḍhā (24), Venus in Hasta (8), Saturn in Maghā's neighbour (17), Rāhu in Svāti's (5).
  assert.equal(has('latta', sky()), false, 'the Moon in Rohiṇī');
  assert.equal(has('latta', sky({ moon: 110 })), true, 'the Moon in Āśleṣā (8), kicked by Mercury (7th before Svāti) and Venus (5th before Hasta)');
  assert.equal(has('latta', sky({ sun: 5, moon: 150 })), true, 'the Sun in Aśvinī kicks the 12th, Uttara Phalgunī');
  // Upagraha: the Moon in the 5th, 7th, 8th ... nakṣatra from the Sun's (Aśvinī is the 1st).
  assert.equal(has('upagraha', sky({ sun: 5, moon: 55 })), true, 'Mṛgaśīrṣa is the 5th from Aśvinī');
  assert.equal(has('upagraha', sky({ sun: 5, moon: 20 })), false, 'Bharaṇī is the 2nd');
  // Pāta: counted from the Sun in Aśvinī to Āśleṣā is 9, so the Moon in the 9th from Aśvinī, Āśleṣā itself.
  assert.equal(has('pata', sky({ sun: 5, moon: 110 })), true);
  assert.equal(has('pata', sky({ sun: 5, moon: 55 })), false);
  // Ardhayāma: Sunday is 1, ×3 = 3, remainder 3 over 8, +1 = the 4th eighth; for Saturday, 7 × 3 = 21, 5, the 6th. The day from sunrise 0.25 to sunset 0.75, the night to 1.25.
  const sundayParts = ardhayama(0, 0.25, 0.75, 1.25);
  assert.ok(Math.abs(sundayParts[0].startJd - 0.4375) < 1e-12 && Math.abs(sundayParts[0].endJd - 0.5) < 1e-12, 'the 4th eighth of the day');
  assert.ok(Math.abs(sundayParts[1].startJd - 0.9375) < 1e-12 && Math.abs(sundayParts[1].endJd - 1) < 1e-12, 'and of the night');
  assert.ok(Math.abs(ardhayama(6, 0.25, 0.75, 1.25)[0].startJd - 0.5625) < 1e-12, 'the 6th on Saturday');
  // Śūnya tithis of the month and Mṛtyu yoga in the Pañcāṅga Doṣa. Karttika: the 5th by the Kālaprakāśikā, the dark 5th by the Muhūrta Cintāmaṇi.
  const withMasa = (masa: number | undefined, sun: number, moon: number) => panchangaReasons({ ...sky({ vara: 3, sun, moon }), masa });
  assert.deepEqual(withMasa(7, 0, 50), ['shunya'], 'the bright 5th in Karttika');
  assert.deepEqual(withMasa(7, 0, 235), ['shunya'], 'the dark 5th (the 20th tithi) in Karttika');
  assert.deepEqual(withMasa(undefined, 0, 50), [], 'without the month it is not looked at');
  assert.deepEqual(withMasa(0, 0, 50), [], 'the 5th is not Śūnya in Chaitra (the 8th and 11th, the 8th and 9th)');
  assert.deepEqual(panchangaReasons(sky({ vara: 3, sun: 340, moon: 5 })), ['mrityu'], 'a Wednesday with the Moon in Aśvinī');
}

// ---------------------------------------------------------------------------
// The stretches around events
// ---------------------------------------------------------------------------
{
  const merged = mergeWindows([{ startJd: 7, endJd: 8 }, { startJd: 2, endJd: 5 }, { startJd: 1, endJd: 3 }, { startJd: 5, endJd: 6 }]);
  assert.deepEqual(merged, [{ startJd: 1, endJd: 6 }, { startJd: 7, endJd: 8 }], 'overlapping and touching stretches are made one');
  assert.equal(insideWindows(merged, 1), true);
  assert.equal(insideWindows(merged, 5.99), true);
  assert.equal(insideWindows(merged, 6), false, 'the end is outside');
  assert.equal(insideWindows(merged, 6.5), false);
  assert.equal(insideWindows(merged, 7.5), true);
  assert.equal(insideWindows(merged, 0.5), false);
  assert.equal(insideWindows([], 3), false);
  assert.deepEqual(aroundEvent(10, 7, 7), { startJd: 3, endJd: 17 });
}

async function events() {
  // A Vyatipāta at 5 November 2026 22:30 UT is 6 November 00:30 by a clock 2 hours ahead: the day before, the day of and the day after
  // are 5, 6 and 7 November, from the midnight that begins the 5th (4 November 22:00 UT) to the one that ends the 7th (7 November 22:00 UT).
  const event = await sweJulday(2026, 11, 5, 22.5);
  const days = calendarDays(event, 2, 1, 1);
  assert.ok(Math.abs(days.startJd - (await sweJulday(2026, 11, 4, 22))) < 1e-6, 'from the midnight that begins the day before');
  assert.ok(Math.abs(days.endJd - (await sweJulday(2026, 11, 7, 22))) < 1e-6, 'to the midnight that ends the day after');
  // The same moment by a clock 1 hour behind (the 5th, 21:30): 4, 5 and 6 November.
  const west = calendarDays(event, -1, 1, 1);
  assert.ok(Math.abs(west.startJd - (await sweJulday(2026, 11, 4, 1))) < 1e-6);

  // The Sun enters a sign: a made-up Sun at one degree a day, 100° at day 0 (Julian day 2461000).
  const found = await sankrantiMoments(async jd => (100 + (jd - 2461000)) % 360, 2461000, 2461060);
  assert.equal(found.length, 2);
  assert.ok(Math.abs(found[0] - 2461020) < 2 / 1440, `120° is reached at day 20 (${found[0]})`);
  assert.ok(Math.abs(found[1] - 2461050) < 2 / 1440);
  // Across 360° to 0°.
  const across = await sankrantiMoments(async jd => (350 + (jd - 2461000)) % 360, 2461000, 2461020);
  assert.equal(across.length, 1, 'only 0° at day 10: 30° is at day 40');
  assert.ok(Math.abs(across[0] - 2461010) < 2 / 1440);

  // The eclipses of 2026 (the maxima, UT): solar 17 February 12:12 and 12 August 17:46, lunar 3 March 11:33 and 28 August 04:13.
  const start = await sweJulday(2026, 1, 1, 0);
  const end = await sweJulday(2026, 12, 31, 0);
  const eclipses = await eclipseMoments(start, end);
  const known = async (month: number, day: number, hour: number) => sweJulday(2026, month, day, hour);
  assert.equal(eclipses.solar.length, 2);
  assert.equal(eclipses.lunar.length, 2, 'the penumbral eclipses are not counted');
  assert.ok(Math.abs(eclipses.solar[0] - (await known(2, 17, 12.2))) < 15 / 1440);
  assert.ok(Math.abs(eclipses.solar[1] - (await known(8, 12, 17.77))) < 15 / 1440);
  assert.ok(Math.abs(eclipses.lunar[0] - (await known(3, 3, 11.55))) < 15 / 1440);
  assert.ok(Math.abs(eclipses.lunar[1] - (await known(8, 28, 4.2))) < 15 / 1440);

  // The Vyatipāta and the Vaidhṛti: the Sun and the Moon at the same distance from the equator, on one side and on opposite sides.
  const equalities = await declinationEqualities(start, end);
  for (const [name, moments, sign] of [['Vyatipāta', equalities.vyatipata, 1], ['Vaidhṛti', equalities.vaidhriti, -1]] as const) {
    assert.ok(moments.length >= 11 && moments.length <= 16, `${moments.length} ${name} in a year`);
    for (const moment of moments) {
      const sun = (await sweCalcUtEquatorial(moment, SE_SUN)).declination;
      const moon = (await sweCalcUtEquatorial(moment, SE_MOON)).declination;
      assert.ok(Math.abs(sun - sign * moon) < 0.02, `${name}: the Sun at ${sun.toFixed(3)}° and the Moon at ${moon.toFixed(3)}°`);
    }
  }
  // Same side for the first, opposite sides for the second (away from the equator, where the sides are plain).
  for (const moment of equalities.vyatipata) {
    const sun = (await sweCalcUtEquatorial(moment, SE_SUN)).declination;
    const moon = (await sweCalcUtEquatorial(moment, SE_MOON)).declination;
    if (Math.abs(sun) > 0.5) assert.equal(Math.sign(sun), Math.sign(moon), 'Vyatipāta: the same side');
  }
  for (const moment of equalities.vaidhriti) {
    const sun = (await sweCalcUtEquatorial(moment, SE_SUN)).declination;
    const moon = (await sweCalcUtEquatorial(moment, SE_MOON)).declination;
    if (Math.abs(sun) > 0.5) assert.equal(Math.sign(sun), -Math.sign(moon), 'Vaidhṛti: opposite sides');
  }
}

// ---------------------------------------------------------------------------
// The search, against the panchāṅga and the chart of the app
// ---------------------------------------------------------------------------
const PLACE = { lat: 60.46667, lng: 26.94583, zone: 'Europe/Helsinki', tz: 2 };
const open: FinderCriteria = { vara: [0, 1, 2, 3, 4, 5, 6], tithi: Array.from({ length: 30 }, (_, i) => i + 1), nakshatra: Array.from({ length: 27 }, (_, i) => i), yoga: Array.from({ length: 27 }, (_, i) => i), karana: Array.from({ length: 11 }, (_, i) => i), signs: {} };
const request = (criteria: FinderCriteria, days: number, start: string) => ({ start, days, ...PLACE, ayanamsa: 'lahiri', nodeMode: 'mean', ayanamsaOffset: 0, criteria });
const totalDays = (windows: { start: number; end: number }[]) => windows.reduce((sum, window) => sum + (window.end - window.start), 0) / 86_400_000;

/** The chart and the panchāṅga of the app at the middle of a stretch (Helsinki is +2 h in the winter, +3 h in the summer). */
async function appAt(middleMs: number) {
  const offset = getUtcOffsetHours(PLACE.zone, new Date(middleMs));
  const local = new Date(middleMs + offset * 3_600_000);
  const chart = await calculateChart(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0, PLACE.lat, PLACE.lng, offset, 'lahiri');
  const pad = (value: number) => String(value).padStart(2, '0');
  const date = `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()} ${pad(local.getUTCHours())}.${pad(local.getUTCMinutes())}.00`;
  return { chart, panchang: calculatePanchang(chart, date, offset, 'lahiri') };
}

async function searches() {
  // Pañcāṅga Doṣa: at the middle of each stretch the panchāṅga of the app has none of the faults.
  const panchanga = await runMuhurtaFinder(request({ ...open, avoid: ['panchanga'] }, 40, '2026-11-02'));
  assert.ok(panchanga.windows.length >= 10, `${panchanga.windows.length} stretches free of the Pañcāṅga Doṣa`);
  assert.equal(panchanga.stepMinutes, 15);
  const share = totalDays(panchanga.windows) / 40;
  assert.ok(share > 0.1 && share < 0.45, `${(share * 100).toFixed(0)} % of the time is free`);
  const YAMAGHANTA = [['Sunday', 'Magha'], ['Monday', 'Vishakha'], ['Tuesday', 'Ardra'], ['Wednesday', 'Mula'], ['Thursday', 'Krittika'], ['Friday', 'Rohini'], ['Saturday', 'Hasta']];
  const BAD_YOGAS = ['Vishkambha', 'Atiganda', 'Shula', 'Ganda', 'Vyaghata', 'Vajra', 'Vyatipata', 'Parigha', 'Vaidhriti'];
  for (const window of panchanga.windows.slice(0, 8)) {
    const { panchang } = await appAt((window.start + window.end) / 2);
    assert.ok(!['Sunday', 'Tuesday'].includes(panchang.vara), panchang.vara);
    assert.ok(!(panchang.paksha === 'Krishna' && panchang.tithiNumber === 15), 'not Amāvasyā');
    assert.ok(![4, 9, 14].includes(panchang.tithiNumber), `the ${panchang.tithiNumber}th tithi`);
    assert.ok(!['Vishti', 'Shakuni', 'Chatushpada', 'Naga', 'Kintughna'].includes(panchang.karana), panchang.karana);
    assert.ok(!BAD_YOGAS.includes(panchang.yoga), panchang.yoga);
    assert.ok(!YAMAGHANTA.some(([vara, nakshatra]) => vara === panchang.vara && nakshatra === panchang.nakshatra), `${panchang.vara} ${panchang.nakshatra}`);
    // The first Mṛtyu yoga: the weekday and the nakṣatra Anurādhā, Uttara Āṣāḍhā, Śatabhiṣā, Aśvinī, Mṛgaśīrṣa, Āśleṣā, Hasta (as the app names them).
    const MRITYU = [['Sunday', 'Anuradha'], ['Monday', 'Uttara Ashadha'], ['Tuesday', 'Shatabhisha'], ['Wednesday', 'Ashwini'], ['Thursday', 'Mrigashira'], ['Friday', 'Ashlesha'], ['Saturday', 'Hasta']];
    assert.ok(!MRITYU.some(([vara, nakshatra]) => vara === panchang.vara && nakshatra === panchang.nakshatra), `Mṛtyu: ${panchang.vara} ${panchang.nakshatra}`);
    // The Śūnya tithis of the lunar month the chart is in, by the table of the text (Chaitra first): by the month alone and by the month and the half.
    const KALAPRAKASIKA = [[8, 11], [12], [13], [6], [15], [7], [9], [5], [2, 9], [1], [4, 10], [14]];
    const CINTAMANI: Record<'Shukla' | 'Krishna', number[][]> = {
      Shukla: [[8, 9], [12], [13], [7], [2, 3], [1, 2], [10, 11], [14], [7, 8], [4, 5], [6], [3]],
      Krishna: [[8, 9], [12], [14], [6], [2, 3], [1, 2], [10, 11], [5], [7, 8], [4, 5], [5], [4]],
    };
    const masa = (await appAt((window.start + window.end) / 2)).chart.lunarMonth!.masaIndex;
    assert.ok(!KALAPRAKASIKA[masa].includes(panchang.tithiNumber) && !CINTAMANI[panchang.paksha][masa].includes(panchang.tithiNumber), `Śūnya: the ${panchang.tithiNumber}th of ${panchang.paksha}, month ${masa}`);
  }

  // Aṣṭama Lagna: the Ascendant of the chart is never the 8th sign from the Ascendant or the Moon of the birth.
  const natal = { ascSign: 0, moonSign: 5 }; // Aries rising, the Moon in Virgo: the 8th signs are Scorpio and Aries
  const eighth = await runMuhurtaFinder(request({ ...open, avoid: ['ashtamaLagna'], natal }, 3, '2026-11-02'));
  assert.equal(eighth.stepMinutes, 5);
  assert.ok(eighth.windows.length >= 3);
  for (const window of eighth.windows.slice(0, 6)) {
    const { chart } = await appAt((window.start + window.end) / 2);
    assert.ok(![7, 0].includes(chart.ascendant.sign - 1), `the Lagna in sign ${chart.ascendant.sign - 1}`);
  }
  // The time lost is the time the Lagna is in those two signs, which the search for the signs of the Ascendant finds on its own.
  const without = await runMuhurtaFinder(request(open, 3, '2026-11-02'));
  const inTheSigns = await runMuhurtaFinder(request({ ...open, signs: { Asc: [7, 0] } }, 3, '2026-11-02'));
  const lost = totalDays(without.windows) - totalDays(eighth.windows);
  assert.ok(Math.abs(lost - totalDays(inTheSigns.windows)) < 20 / 1440, `${lost.toFixed(3)} days lost, the Lagna in the two signs for ${totalDays(inTheSigns.windows).toFixed(3)} days`);

  // Udayāsta Śuddhi: no Sun, Mars or Saturn in the 1st or 7th at the middle of a stretch, and the lords of the 1st and 7th not in the 6th, 8th or 12th.
  const udayasta = await runMuhurtaFinder(request({ ...open, avoid: ['udayasta'] }, 20, '2026-11-02'));
  assert.ok(udayasta.windows.length >= 5, `${udayasta.windows.length} stretches`);
  const LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  for (const window of udayasta.windows.slice(0, 8)) {
    const { chart } = await appAt((window.start + window.end) / 2);
    const ascSign = chart.ascendant.sign - 1;
    const house = (name: string) => ((chart.planets.find(planet => planet.name === name)!.sign - 1 - ascSign + 12) % 12) + 1;
    for (const malefic of ['Sun', 'Mars', 'Saturn']) assert.ok(house(malefic) !== 1 && house(malefic) !== 7, `${malefic} in the ${house(malefic)}th`);
    for (const first of [1, 7]) assert.ok(![6, 8, 12].includes(house(LORDS[(ascSign + first - 1) % 12])), `the lord of the ${first}th in the ${house(LORDS[(ascSign + first - 1) % 12])}th`);
  }

  // Grahaṇa: the eclipses of August 2026 (solar on the 12th, lunar on the 28th) leave no stretch in the 7 and 3 days around them.
  const august = await runMuhurtaFinder(request({ ...open, avoid: ['eclipse'] }, 40, '2026-08-01'));
  const solarAt = Date.UTC(2026, 7, 12, 17, 46);
  const lunarAt = Date.UTC(2026, 7, 28, 4, 13);
  const day = 86_400_000;
  for (const window of august.windows) {
    assert.ok(window.end <= solarAt - 7 * day + 120_000 || window.start >= solarAt + 7 * day - 120_000, 'nothing within 7 days of the solar eclipse');
    assert.ok(window.end <= lunarAt - 3 * day + 120_000 || window.start >= lunarAt + 3 * day - 120_000, 'nothing within 3 days of the lunar eclipse');
  }
  assert.ok(august.windows.length >= 2);
  // The nakṣatra of an eclipse is avoided for six months: the Moon in the nakṣatra of the lunar eclipse of 3 March 2026 (and of the solar one of 17 February)
  // is not in any stretch of the weeks after, and the time lost to them is a day for each nakṣatra and each month.
  const marchChart = await calculateChart(2026, 3, 3, 13, 33, 0, PLACE.lat, PLACE.lng, 2, 'lahiri');
  const lunarNakshatra = Math.floor((marchChart.planets.find(planet => planet.name === 'Moon')!.longitude % 360) / (360 / 27));
  const april = await runMuhurtaFinder(request({ ...open, avoid: ['eclipse'] }, 30, '2026-03-12'));
  const aprilFree = await runMuhurtaFinder(request(open, 30, '2026-03-12'));
  const lostToNakshatras = totalDays(aprilFree.windows) - totalDays(april.windows);
  assert.ok(lostToNakshatras > 1.2 && lostToNakshatras < 3.2, `${lostToNakshatras.toFixed(2)} days lost to the nakṣatras of the two eclipses`);
  for (const window of april.windows.slice(0, 6)) {
    const { chart } = await appAt((window.start + window.end) / 2);
    const nakshatra = Math.floor((chart.planets.find(planet => planet.name === 'Moon')!.longitude % 360) / (360 / 27));
    assert.notEqual(nakshatra, lunarNakshatra, 'not in the nakṣatra of the eclipse');
  }

  // Saṅkrānti: 16′ of the Sun's longitude on each side of its entry into Libra (about 17 October 2026): the Sun moves 0.99° a day, so about 6.5 hours.
  const sankranti = await runMuhurtaFinder(request({ ...open, avoid: ['sankranti'] }, 8, '2026-10-14'));
  assert.equal(sankranti.windows.length, 2);
  const gap = (sankranti.windows[1].start - sankranti.windows[0].end) / 3_600_000;
  assert.ok(gap > 12.6 && gap < 13.2, `${gap.toFixed(2)} hours around the Saṅkrānti`);
  const wider = await runMuhurtaFinder(request({ ...open, avoid: ['sankranti'], sankrantiArc: 60 }, 8, '2026-10-14'));
  const widerGap = (wider.windows[1].start - wider.windows[0].end) / 3_600_000;
  assert.ok(widerGap > 47 && widerGap < 50, `a degree on each side is two days (${widerGap.toFixed(1)} h): the minutes are the user's`);
  // The Sun is at 180° of the sidereal zodiac at the middle of the gap, and 16′ short of it at its start and 16′ past it at its end.
  const middle = (sankranti.windows[0].end + sankranti.windows[1].start) / 2;
  const sunAt = async (ms: number) => (await appAt(ms)).chart.planets.find(planet => planet.name === 'Sun')!.longitude;
  assert.ok(Math.abs((await sunAt(middle)) - 180) < 0.02, 'the Sun at 180° in the middle');
  assert.ok(Math.abs((await sunAt(sankranti.windows[0].end)) - (180 - 16 / 60)) < 0.01, '16′ short of the entry at the start');
  assert.ok(Math.abs((await sunAt(sankranti.windows[1].start)) - (180 + 16 / 60)) < 0.01, '16′ past it at the end');
  // At the entry into Capricorn (about 14 January 2027) it is 3° on each side, about 6 days.
  const makar = await runMuhurtaFinder(request({ ...open, avoid: ['sankranti'] }, 20, '2027-01-04'));
  assert.equal(makar.windows.length, 2);
  const makarGap = (makar.windows[1].start - makar.windows[0].end) / 86_400_000;
  assert.ok(makarGap > 5.7 && makarGap < 6.2, `${makarGap.toFixed(2)} days around the entry into Capricorn`);
  assert.ok(Math.abs((await sunAt(makar.windows[0].end)) - (270 - 3)) < 0.02, '3° short of Capricorn at the start');
  // In the tropical zodiac the entry into Libra is the equinox, 23 September 2026 at 00:05 UT.
  const tropical = await runMuhurtaFinder({ ...request({ ...open, avoid: ['sankranti'] }, 8, '2026-09-20'), ayanamsa: 'tropical' });
  assert.equal(tropical.windows.length, 2);
  const equinox = Date.UTC(2026, 8, 23, 0, 5);
  assert.ok(Math.abs((tropical.windows[0].end + tropical.windows[1].start) / 2 - equinox) < 20 * 60_000, 'the middle is the equinox');

  // Vyatipāta and Vaidhṛti: the day before, the day of and the day after (three days of the clock of Helsinki, two when the clock changes).
  const from = await sweJulday(2026, 11, 2, 0);
  const roots = await declinationEqualities(from, from + 70);
  const vyatipata = await runMuhurtaFinder(request({ ...open, avoid: ['vyatipata'] }, 70, '2026-11-02'));
  assert.ok(roots.vyatipata.length >= 2);
  const interior = roots.vyatipata.filter(moment => moment > from + 2 && moment < from + 68).length;
  const lost3 = 70 - totalDays(vyatipata.windows);
  assert.ok(lost3 >= 3 * interior - 0.1 && lost3 <= 3 * interior + 6, `${lost3.toFixed(1)} days lost to ${roots.vyatipata.length} Vyatipātas (${interior} inside the span)`);

  // Vāra Doṣa: Rāhu Kāla, Yamaghaṇṭa and the Ardhayāma of the day are an eighth of the daylight each (about 1 hour in November at 60° N), the Ardhayāma of the night an eighth of the night (about 2 hours).
  const vara = await runMuhurtaFinder(request({ ...open, avoid: ['varaDosha'] }, 14, '2026-11-02'));
  const freeShare = totalDays(vara.windows) / 14;
  assert.ok(freeShare > 0.76 && freeShare < 0.84, `${(freeShare * 100).toFixed(1)} % of the time is free of Rāhu Kāla, Yamaghaṇṭa and the Ardhayāma`);

  // Vyatipāta and Vaidhṛti by the short time of the book: 1.036 hours on each side of the moment.
  const shortStretch = await runMuhurtaFinder(request({ ...open, avoid: ['vyatipata'], vyatipataLength: 'short' }, 70, '2026-11-02'));
  const lostShort = 70 - totalDays(shortStretch.windows);
  const eachShort = (2 * VYATIPATA_SHORT_HOURS) / 24;
  assert.ok(lostShort >= interior * eachShort - 0.01 && lostShort <= (interior + 2) * eachShort + 0.01, `${lostShort.toFixed(3)} days lost to ${interior} Vyatipātas of ${(eachShort * 24).toFixed(2)} hours`);

  // The doṣas of the nakṣatras and the tithyaṁśa, against the chart of the app at the middle of each stretch.
  const sky20 = await runMuhurtaFinder(request({ ...open, avoid: ['durmuhurta', 'dashaYoga', 'upagraha', 'pata', 'latta', 'vishaGhati'] }, 20, '2026-11-02'));
  assert.ok(sky20.windows.length >= 8, `${sky20.windows.length} stretches`);
  const nakOf = (longitude: number) => Math.floor((((longitude % 360) + 360) % 360) / (360 / 27));
  for (const window of sky20.windows.slice(0, 10)) {
    const { chart, panchang } = await appAt((window.start + window.end) / 2);
    const lon = (name: string) => chart.planets.find(planet => planet.name === name)!.longitude;
    const sunNak = nakOf(lon('Sun'));
    const moonNak = nakOf(lon('Moon'));
    const elongation = (((lon('Moon') - lon('Sun')) % 360) + 360) % 360;
    assert.ok(![0, 1, 4, 6, 10, 11, 15, 18, 19, 20].includes((sunNak + 1 + moonNak + 1) % 27), 'Daśa Yoga');
    assert.ok(![5, 7, 8, 10, 14, 15, 18, 19, 21, 22, 23, 24, 25].includes(((moonNak - sunNak + 27) % 27) + 1), 'Upagraha');
    assert.ok(![8, 9, 13, 16, 21, 26].some(target => moonNak === (target - sunNak + 27) % 27), 'Pāta');
    const kicks: Record<string, number> = { Sun: 11, Mars: 2, Jupiter: 5, Saturn: 7, Mercury: -6, Venus: -4 };
    for (const [name, offset] of Object.entries(kicks)) assert.notEqual(moonNak, (((nakOf(lon(name)) + offset) % 27) + 27) % 27, `Lattā by ${name}`);
    assert.ok(!insideRanges(elongation % 360, TITHI_RANGES), `tithi Viṣanāḍī at ${elongation.toFixed(2)}°`);
    assert.ok(!insideRanges(lon('Moon') % 360, NAKSHATRA_RANGES), `nakṣatra Viṣanāḍī at ${(lon('Moon') % 360).toFixed(2)}°`);
    const part = Math.floor((elongation % 12) / 0.4) + 1;
    const vara = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(panchang.vara);
    const byVara = [[14], [12, 9], [4, 11], [8], [6, 12], [4, 9], [1, 2]];
    assert.ok(![1, 2, 4, 10, 11, 12, 15, 16, 17, 21, 22].includes(part) && !byVara[vara].includes(part), `Dūrmuhūrta: the ${part}th tithyaṁśa on ${panchang.vara}`);
  }

  // Pāpaṣaḍvarga, against the chart: the Lagna is not in more signs of malefics than of benefics in the six vargas (and when equal, the navāṁśa is a benefic's).
  const papa = await runMuhurtaFinder(request({ ...open, avoid: ['papashadvarga'] }, 10, '2026-11-02'));
  assert.ok(papa.windows.length >= 4, `${papa.windows.length} stretches`);
  const MALEFIC_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  for (const window of papa.windows.slice(0, 8)) {
    const { chart, panchang } = await appAt((window.start + window.end) / 2);
    const waxing = panchang.paksha === 'Shukla';
    const bad = (sign: number) => ['Sun', 'Mars', 'Saturn'].includes(MALEFIC_LORDS[sign]) || (MALEFIC_LORDS[sign] === 'Moon' && !waxing);
    const asc = chart.ascendant.longitude;
    const signs = [Math.floor(asc / 30), ...[2, 3, 9, 12, 30].map(division => getVargaSignIndex(asc, division))];
    const malefic = signs.filter(bad).length;
    assert.ok(malefic < 3 || (malefic === 3 && !bad(getVargaSignIndex(asc, 9))), `${malefic} of six in malefic signs`);
  }

  // Everything at once leaves almost nothing, and it is a answer, not an error.
  const all = await runMuhurtaFinder(request({ ...open, avoid: [...DOSHA_IDS], natal }, 30, '2026-11-02'));
  assert.ok(totalDays(all.windows) / 30 < 0.05, 'all fifteen together leave less than a twentieth of the time');
  // A doṣa the search does not know is not read.
  const unknown = await runMuhurtaFinder(request({ ...open, avoid: ['vajra'] }, 3, '2026-11-02'));
  assert.equal(unknown.windows.length, 1);
}

async function main() {
  await events();
  await searches();
  console.log('Mahadosha tests passed');
}
main().catch(error => { console.error(error); process.exit(1); });
