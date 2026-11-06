import assert from 'node:assert/strict';
import {
  arudhaSign, calculateSpecialSphutas, equationOfTimeMinutes, formatDms, induSign, ishtaGhatis, nakshatraAndPada, varnadaSign,
} from './specialSphutas';

// The chart of 8 October 2026, 10:47:40, Ghaziabad (28.66535 N, 77.43915 E, UTC+5.5), Lahiri, mean node.
const input = {
  ascendantLongitude: 228.03597691,
  sunLongitude: 170.71987,
  moonLongitude: 140.74793,
  rahuLongitude: 303.10181,
  planets: [
    { name: 'Mars', sign: 4, degree: 11.61209 },
    { name: 'Saturn', sign: 12, degree: 16.7802 },
  ],
  // The ishṭa the reference table is worked with: 10.7979 ghaṭīs, a sunrise at 06:28:31.
  ishta: ((10 * 3600 + 47 * 60 + 40) - (6 * 3600 + 28 * 60 + 31)) / 3600 * 2.5,
};
const byKey = Object.fromEntries(calculateSpecialSphutas(input).map(s => [s.key, s]));
const longitudeOf = (sign: number, d: number, m: number, s: number) => (sign - 1) * 30 + d + m / 60 + s / 3600;
const near = (actual: number, expected: number, tolerance: number, label: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);

// --- The points that do not depend on the sunrise match the reference table to a few thousandths of a second -----
// The Moon of the reference table is 0.0001° (0.4″) from ours, and Śrī Lagna turns it 27 times over.
near(byKey.SL.longitude, longitudeOf(3, 8, 14, 2.06), 0.005, 'Sree Lagna, Gemini 8°14′02.06″');
// Bhrigu Bindu is the middle of the arc from Rahu forward to the Moon. The reference table gives 11°55′29.73″ for it, which is
// ours to the second; its sign is Scorpio, 180° from the point the arc gives (Taurus). JHora's own value for a chart with the
// Moon the lesser of the two (below) is in Aries, where the arc puts it, so Taurus it is here.
near(byKey.BB.longitude, longitudeOf(2, 11, 55, 29.73), 0.001, 'Bhrigu Bindu, Taurus 11°55′29.73″');
assert.equal(byKey.AL.sign, 12, 'Arudha Lagna in Pisces');
near(byKey.AL.degree, 11 + 36 / 60 + 43.54 / 3600, 0.0005, 'Arudha Lagna 11°36′43.54″, the degree of Mars');
assert.equal(byKey.IL.sign, 2, 'Indu Lagna in Taurus');
near(byKey.IL.degree, 20 + 44 / 60 + 52.94 / 3600, 0.0005, 'Indu Lagna 20°44′52.94″, the degree of the Moon');
assert.equal(byKey.D22.sign, 7, '22nd Drekkana in Libra');
assert.equal(byKey.N64.sign, 12, '64th Navamsa in Pisces');
near(byKey.D22.degree, 18 + 2 / 60 + 9.52 / 3600, 0.0005, '22nd Drekkana 18°02′09.52″');
assert.equal(byKey.VL.sign, 1, 'Varnada Lagna in Aries');
near(byKey.VL.degree, 18 + 2 / 60 + 9.52 / 3600, 0.0005, 'Varnada Lagna 18°02′09.52″, the degree of the Lagna');

// --- The lagnas that run with the ishṭa match when the same ishṭa is used ------------------------------------------
near(byKey.BL.longitude, longitudeOf(8, 25, 30, 26.51), 0.002, 'Bhava Lagna, Scorpio 25°30′26.51″');
near(byKey.HL.longitude, longitudeOf(11, 0, 17, 41.51), 0.004, 'Hora Lagna, Aquarius 0°17′41.51″');
near(byKey.GL.longitude, longitudeOf(5, 14, 39, 26.51), 0.01, 'Ghati Lagna, Leo 14°39′26.51″');
near(byKey.PP.longitude, longitudeOf(12, 3, 54, 41.51), 0.002, 'Pranapada Lagna, Pisces 3°54′41.51″');

// --- Nakṣatra and pada follow the point's own longitude, so the Khara points take that of Asc + 210° -----------------
assert.deepEqual(nakshatraAndPada(byKey.D22.longitude), { nakshatra: 'Ardra', pada: 4 });
assert.deepEqual(nakshatraAndPada(byKey.N64.longitude), { nakshatra: 'Ardra', pada: 4 });
assert.deepEqual(nakshatraAndPada(byKey.SL.longitude), { nakshatra: 'Ardra', pada: 1 });
assert.deepEqual(nakshatraAndPada(byKey.BB.longitude), { nakshatra: 'Rohini', pada: 1 });
assert.deepEqual(nakshatraAndPada(byKey.AL.longitude), { nakshatra: 'Uttara Bhadrapada', pada: 3 });
assert.deepEqual(nakshatraAndPada(byKey.IL.longitude), { nakshatra: 'Rohini', pada: 4 });
assert.deepEqual(nakshatraAndPada(byKey.VL.longitude), { nakshatra: 'Bharani', pada: 2 });
assert.deepEqual(nakshatraAndPada(byKey.BL.longitude), { nakshatra: 'Jyeshtha', pada: 3 });
assert.deepEqual(nakshatraAndPada(byKey.HL.longitude), { nakshatra: 'Dhanishtha', pada: 3 });
assert.deepEqual(nakshatraAndPada(byKey.GL.longitude), { nakshatra: 'Purva Phalguni', pada: 1 });
assert.deepEqual(nakshatraAndPada(byKey.PP.longitude), { nakshatra: 'Uttara Bhadrapada', pada: 1 });

// --- The rules on their own -----------------------------------------------------------------------------------------------
assert.equal(arudhaSign(8, 4), 12, 'lagna Scorpio, lord Mars in Cancer: the 9th from Mars');
assert.equal(arudhaSign(1, 1), 10, 'a lord in the lagna puts the Arudha in the 1st, so the 10th from it');
assert.equal(arudhaSign(1, 7), 10, 'a lord in the 7th gives the 1st from it again: its 10th');
assert.equal(arudhaSign(1, 4), 4, 'a lord in the 4th lands in the 7th (Libra), which gives way to the 10th from it, Cancer');
assert.equal(induSign(8, 5), 2, 'Indu Lagna for a Scorpio Lagna and a Leo Moon');
assert.equal(varnadaSign(8, 5), 1, 'Scorpio and Leo: an even and an odd sign, 5 - 5 = 0, counted back from Pisces as 12');
assert.equal(varnadaSign(1, 3), 4, 'Aries (1) and Gemini (3): both odd, 1 + 3 = 4 from Aries');

// --- Dates and times ---------------------------------------------------------------------------------------------------------
const eot = equationOfTimeMinutes(2026, 10, 8, 1);
assert.ok(eot > 11.5 && eot < 13, `the equation of time in early October is about 12 minutes: ${eot}`);
assert.ok(Math.abs(equationOfTimeMinutes(2026, 4, 15, 6)) < 1, 'it passes through zero in mid April');
assert.ok(equationOfTimeMinutes(2026, 2, 11, 6) < -13, 'and is at its lowest in February');
const birth = 10 + 47 / 60 + 40 / 3600;
near(ishtaGhatis(birth, 6.28111, 'true', 12.33), 11.2833, 0.001, 'ishta from the true sunrise');
near(ishtaGhatis(birth, 6.28111, 'mean', 12.33), 10.7694, 0.002, 'ishta from the mean-time sunrise');
near(ishtaGhatis(5, 6, 'true', 0), 57.5, 0.0001, 'before sunrise the time runs from the day before');

// --- Formatting -------------------------------------------------------------------------------------------------------------------
assert.equal(formatDms(25 + 30 / 60 + 26.51 / 3600), `25° 30' 26.51"`);
assert.equal(formatDms(0.999999999), `1° 0' 0.00"`, 'rounding carries into the minutes and degrees');
assert.deepEqual(nakshatraAndPada(0), { nakshatra: 'Ashwini', pada: 1 });
assert.deepEqual(nakshatraAndPada(359.99), { nakshatra: 'Revati', pada: 4 });

// --- Bhrigu Bindu against JHora ----------------------------------------------------------------------------------
// JHora gives Aries 21°27′29.62″ for the chart of 13.10.1987 00:15:00 in Kotka (Lahiri, mean node). Our Moon (65.1636°) and
// Rahu (337.7208°) are those of the chart, as the app calculates them; the Moon is the lesser, so the arc forward from Rahu runs
// through 0° Aries and the point is in Aries. JHora's value is 56″ further on than the app's and PyJHora's (its ayanamsa or
// its clock is a little other), so the tolerance is a minute of arc; the sign is the thing that a sum halved gets wrong.
const kotka = calculateSpecialSphutas({ ...input, moonLongitude: 65.1636, rahuLongitude: 337.7208 }).find(s => s.key === 'BB')!;
assert.equal(kotka.sign, 1, 'Bhrigu Bindu in Aries, as JHora has it');
near(kotka.degree, 21 + 27 / 60 + 29.62 / 3600, 0.02, 'Bhrigu Bindu 21°27′29.62″ Aries');
// The arc runs forward from Rahu: the same point whichever of the two is the greater, and the other arc is 180° away.
const middle = (moon: number, rahu: number) => calculateSpecialSphutas({ ...input, moonLongitude: moon, rahuLongitude: rahu }).find(s => s.key === 'BB')!.longitude;
near(middle(99.8, 35.0), 67.4, 1e-9, 'Moon greater than Rahu: the plain middle');
near(middle(65, 337.5), 21.25, 1e-9, 'Moon less than Rahu: across 0° Aries');
near(middle(350, 10), 180, 1e-9, 'Rahu at 10°, the Moon at 350°: the arc is 340° long, its middle 180°');
near(middle(10, 350), 0, 1e-9, 'Rahu at 350°, the Moon at 10°: the arc is 20° long, its middle at 0°');
near(middle(120, 120), 120, 1e-9, 'Moon on Rahu');

console.log('Special sphuta tests passed');
