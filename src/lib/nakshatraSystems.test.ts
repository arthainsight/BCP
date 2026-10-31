import assert from 'node:assert/strict';
import { birthHalves, horaLord, isBrightHalf, isDayBirth, navamshaSign } from './birthConditions';
import { calculateNakshatraSystem, evaluateNakshatraSystem, nakshatraCount, NAKSHATRA_SYSTEMS, nakshatraSystemSubDashas, type ConditionChart } from './nakshatraSystems';
import { evaluateAshtottariEligibility } from './ashtottari';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';

const birth = new Date(2000, 0, 1);
const startOf = (name: string) => NAKSHATRA_NAMES.indexOf(name as (typeof NAKSHATRA_NAMES)[number]) * NAKSHATRA_SIZE;
const first = (key: Parameters<typeof calculateNakshatraSystem>[0], nakshatra: string, offset = 0.01) =>
  calculateNakshatraSystem(key, startOf(nakshatra) + offset, birth);

// --- The totals are the years of the names (BPHS 46.26, 28, 31, 34, 36, 38, 41, 43) ------------------------------------------------
const totals = Object.fromEntries(NAKSHATRA_SYSTEMS.map(system => [system.key, system.lords.reduce((sum, item) => sum + item.years, 0)]));
assert.deepEqual(totals, { shodashottari: 116, dvadashottari: 112, panchottari: 105, shatabdika: 100, chaturashitisama: 84, dvisaptatisama: 72, shashtihayani: 60, shattrimshatsama: 36 });

// --- The first lord: the count includes the starting nakṣatra and the birth star, as the Viṃśottarī of 46.13 does ------------------------
assert.equal(first('shodashottari', 'Pushya').startLord, 'Sun', 'Puṣya is 1');
assert.equal(first('shodashottari', 'Ashlesha').startLord, 'Mars', 'Āśleṣā is 2');
assert.equal(first('shodashottari', 'Ashwini').startLord, 'Ketu', 'Aśvinī is the 21st from Puṣya: 21 = 2 × 8 + 5, the fifth lord');
assert.equal(first('shodashottari', 'Hasta').startLord, 'Moon', 'Hasta is the 6th from Puṣya');
assert.equal(first('shodashottari', 'Swati').startLord, 'Venus', 'Svāti is the 8th from Puṣya: a whole number of eights is the last lord');
assert.equal(first('dvadashottari', 'Revati').startLord, 'Sun', 'Revatī is 1');
assert.equal(first('dvadashottari', 'Ashwini').startLord, 'Ketu', 'Aśvinī is the 27th to Revatī: 27 = 3 × 8 + 3');
assert.equal(first('panchottari', 'Anuradha').startLord, 'Sun');
assert.equal(first('panchottari', 'Jyeshtha').startLord, 'Mercury');
assert.equal(first('shatabdika', 'Revati').startLord, 'Sun');
assert.equal(first('shatabdika', 'Ashwini').startLord, 'Moon');
assert.equal(first('shatabdika', 'Ardra').startLord, 'Saturn', 'Ārdrā is the 7th from Revatī');
assert.equal(first('chaturashitisama', 'Swati').startLord, 'Sun');
assert.equal(first('chaturashitisama', 'Vishakha').startLord, 'Moon');
assert.equal(first('dvisaptatisama', 'Mula').startLord, 'Sun');
assert.equal(first('dvisaptatisama', 'Purva Ashadha').startLord, 'Moon');
assert.equal(first('shattrimshatsama', 'Shravana').startLord, 'Moon');
assert.equal(first('shattrimshatsama', 'Dhanishtha').startLord, 'Sun');
assert.equal(first('shashtihayani', 'Ashwini').startLord, 'Jupiter');
assert.equal(first('shashtihayani', 'Krittika').startLord, 'Jupiter', 'the first three nakṣatras are one group');
assert.equal(first('shashtihayani', 'Rohini').startLord, 'Sun', 'the next four');
assert.equal(nakshatraCount('shatabdika', 26), 1);
assert.equal(nakshatraCount('dvadashottari', 0), 27);


// --- The balance is the part of the nakṣatra still to pass times the years of the lord -------------------------------------------------
const pushyaStart = calculateNakshatraSystem('shodashottari', startOf('Pushya'), birth);
assert.ok(Math.abs(pushyaStart.entries[0].durationYears - 11) < 1e-9, 'the whole of 11 years at the start of the nakṣatra');
const pushyaMiddle = calculateNakshatraSystem('shodashottari', startOf('Pushya') + NAKSHATRA_SIZE / 2, birth);
assert.ok(Math.abs(pushyaMiddle.entries[0].durationYears - 5.5) < 1e-9);
// The next daśā is that of the next lord, with its own years in full.
assert.equal(pushyaMiddle.entries[1].lord, 'Mars');
assert.ok(Math.abs(pushyaMiddle.entries[1].durationYears - 12) < 1e-9);

// --- The sub-periods fill the daśā, from its own lord, in proportion to the years -------------------------------------------------------
for (const system of NAKSHATRA_SYSTEMS) {
  const result = calculateNakshatraSystem(system.key, 100, birth);
  const parent = result.entries[1];
  const children = nakshatraSystemSubDashas(system.key, parent);
  assert.equal(children.length, system.lords.length, system.key);
  assert.equal(children[0].lord, parent.lord, `${system.key}: begins with the lord of the daśā`);
  assert.ok(Math.abs(children.reduce((sum, child) => sum + child.durationYears, 0) - parent.durationYears) < 1e-9, system.key);
  assert.ok(Math.abs(children[0].durationYears - parent.durationYears * system.lords[system.lords.findIndex(l => l.lord === parent.lord)].years / result.totalYears) < 1e-9, system.key);
  assert.ok(result.entries.at(-1)!.endDate.getFullYear() >= 2120, `${system.key}: covers a life`);
}

// --- The pieces of the conditions --------------------------------------------------------------------------------------------------------
assert.equal(navamshaSign(0), 1);
assert.equal(navamshaSign(3.4), 2);
assert.equal(navamshaSign(30), 10, 'the first navāṁśa of Taurus is Capricorn');
assert.equal(navamshaSign(359.9), 12);
assert.equal(horaLord(5), 'Sun', 'odd sign, first half');
assert.equal(horaLord(20), 'Moon', 'odd sign, second half');
assert.equal(horaLord(35), 'Moon', 'even sign, first half');
assert.equal(horaLord(50), 'Sun', 'even sign, second half');
assert.equal(isDayBirth(200, 0), true, 'the Sun in the 7th house or beyond is above the horizon');
assert.equal(isDayBirth(100, 0), false);
assert.equal(isBrightHalf(0, 90), true);
assert.equal(isBrightHalf(0, 270), false);
assert.deepEqual(birthHalves(0, 270, 100), { day: true, bright: false });

// --- The conditions on charts built to meet and to miss them ---------------------------------------------------------------------------
const chart = (ascendantLongitude: number, planets: Record<string, number>): ConditionChart => ({
  ascendant: { longitude: ascendantLongitude, sign: Math.floor(ascendantLongitude / 30) + 1 },
  planets: Object.entries(planets).map(([name, longitude]) => ({ name, longitude, sign: Math.floor(longitude / 30) + 1 })),
});
const met = (key: Parameters<typeof evaluateNakshatraSystem>[0], c: ConditionChart) => evaluateNakshatraSystem(key, c).met;

// Ṣoḍaśottarī (46.24): the Moon's hora in the dark half, the Sun's hora in the bright half.
assert.equal(met('shodashottari', chart(20, { Sun: 100, Moon: 10 })), true, 'Aries 20° is the Moon\'s hora; the Moon 90° behind the Sun is the dark half');
assert.equal(met('shodashottari', chart(20, { Sun: 100, Moon: 250 })), false, 'the Moon\'s hora in the bright half');
assert.equal(met('shodashottari', chart(5, { Sun: 100, Moon: 160 })), true, 'the Sun\'s hora in the bright half');
assert.equal(met('shodashottari', chart(5, { Sun: 100, Moon: 10 })), false, 'the Sun\'s hora in the dark half');
// Ṣaṭtriṃśatsamā (46.43): the Sun's hora by day, the Moon's by night.
assert.equal(met('shattrimshatsama', chart(5, { Sun: 200, Moon: 10 })), true, 'day (the Sun 195° ahead of the Lagna), the Sun\'s hora');
assert.equal(met('shattrimshatsama', chart(5, { Sun: 100, Moon: 10 })), false, 'night with the Sun\'s hora');
assert.equal(met('shattrimshatsama', chart(20, { Sun: 100, Moon: 10 })), true, 'night with the Moon\'s hora');
// Dvādaśottarī (46.27): the Lagna in a navāṁśa of Venus: in Aries the 2nd (3°20′–6°40′, Taurus) and the 7th (20°–23°20′, Libra).
assert.equal(met('dvadashottari', chart(5, {})), true);
assert.equal(met('dvadashottari', chart(21, {})), true);
assert.equal(met('dvadashottari', chart(12, {})), false);
// Pañcottarī (46.29): the Lagna Cancer, in the navāṁśa that the Sun goes to: the Lagna and the Sun in the same navāṁśa sign.
// The Lagna at Cancer 5° (95°) is in the navāṁśa of Leo; the Sun at Leo 14° (134°) is in the navāṁśa of Leo too.
assert.equal(met('panchottari', chart(95, { Sun: 134 })), true, 'the Lagna and the Sun in the navāṁśa of Leo');
assert.equal(met('panchottari', chart(95, { Sun: 100 })), false, 'the Sun in another navāṁśa');
assert.equal(met('panchottari', chart(35, { Sun: 35 })), false, 'not Cancer');
assert.equal(met('panchottari', chart(95, {})), null, 'without the Sun it cannot be read');
// Śatābdikā (46.32): the Lagna Vargottama.
assert.equal(met('shatabdika', chart(1, {})), true, 'Aries in the navāṁśa of Aries');
assert.equal(met('shatabdika', chart(5, {})), false);
// Caturaśītisamā (46.35): the lord of the 10th in the 10th. Aries Lagna: the 10th is Capricorn, its lord Saturn.
assert.equal(met('chaturashitisama', chart(10, { Saturn: 280 })), true);
assert.equal(met('chaturashitisama', chart(10, { Saturn: 100 })), false);
assert.equal(met('chaturashitisama', chart(10, {})), null, 'without the lord the condition cannot be read');
// Dvisaptatisamā (46.38): the lord of the Lagna in the 7th, or the lord of the 7th in the Lagna. Aries: Mars, and Venus for Libra.
assert.equal(met('dvisaptatisama', chart(10, { Mars: 190, Venus: 100 })), true, 'Mars in Libra');
assert.equal(met('dvisaptatisama', chart(10, { Mars: 100, Venus: 20 })), true, 'Venus in Aries');
assert.equal(met('dvisaptatisama', chart(10, { Mars: 100, Venus: 100 })), false);
// Ṣaṣṭihāyanī (46.40): the Sun in the sign of the Lagna.
assert.equal(met('shashtihayani', chart(10, { Sun: 25 })), true);
assert.equal(met('shashtihayani', chart(10, { Sun: 35 })), false);

// --- Aṣṭottarī, the second condition (46.23): by day in the dark half or by night in the bright half ------------------------------------------
const rahuRuleMissed = [{ name: 'Moon', sign: 3, longitude: 80 }, { name: 'Rahu', sign: 4, longitude: 100 }, { name: 'Sun', sign: 4, longitude: 100 }];
const byDayDark = evaluateAshtottariEligibility(rahuRuleMissed.map(p => p.name === 'Sun' ? { ...p, longitude: 200 } : p), 4, 5);
assert.equal(byDayDark.rahuRule, false);
assert.equal(byDayDark.birthRule, true, 'day (the Sun 195° from the Lagna) in the dark half (the Moon 120° behind the Sun)');
assert.equal(byDayDark.eligible, true, 'either condition of the text is enough');
const byNightDark = evaluateAshtottariEligibility(rahuRuleMissed, 4, 5);
assert.equal(byNightDark.birthRule, false, 'night in the dark half is neither');
assert.equal(byNightDark.eligible, false);
assert.equal(evaluateAshtottariEligibility([{ name: 'Moon', sign: 3 }, { name: 'Rahu', sign: 12 }], 4).birthRule, null, 'without the degrees the second condition is not read');

console.log('Nakshatra systems tests passed');
