import assert from 'node:assert/strict';
// These come from the real engine in src/lib/shadbala.ts. The expected numbers are not taken from the
// engine: they are the verses' own constants (BPHS 27, in the edition the app was audited against) and
// values worked out separately from the Sanskrit rules and compared with the worked examples of
// R. Santhanam and B. V. Raman (the audit notes list each one). A test that compared the engine with
// itself could not fail.
import {
  NAISARGIKA_BALA_VIRUPA,
  SHADBALA_REQUIRED_VIRUPA,
  DIG_BALA_STRONG_POINT,
  buildShadbalaRows,
  calculateDigBalaVirupa,
  calculateUcchaBalaVirupa,
  calculateKendradiBalaVirupa,
  calculateOjhayugmaBalaVirupa,
  calculateDrekkanaBalaVirupa,
  calculateSaptavargajaBalaVirupa,
  calculateDrikBalaVirupa,
  declinationFromSayanaLongitude,
  getCompoundRelation,
  getDignity,
  rasiSignsOf,
  virupaToRupa,
  type RasiSigns,
  type ShadbalaChartLike,
  type ShadbalaPlanet,
  type ShadbalaRow,
} from './shadbala';
import { aspectVirupa, isMoonBenefic } from './shadbalaAspects';
import { cheshtaKendra, cheshtaKendraBalaVirupa, meanLongitudes } from './shadbalaCheshta';
import { ahargana, horaLord, yearMonthDayLords } from './shadbalaTime';

const PLANETS: readonly ShadbalaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const close = (actual: number, expected: number, tolerance: number, message: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);

// ---------------------------------------------------------------------------
// Constants of the verses
// ---------------------------------------------------------------------------
// 27.14: 60/7 times 1 to 7 for Saturn, Mars, Mercury, Jupiter, Venus, the Moon and the Sun, not rounded.
const NAISARGIKA_ORDER: readonly ShadbalaPlanet[] = ['Saturn', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Moon', 'Sun'];
NAISARGIKA_ORDER.forEach((planet, index) => {
  close(NAISARGIKA_BALA_VIRUPA[planet], (60 / 7) * (index + 1), 1e-12, `Naisargika Bala for ${planet}`);
});
close(NAISARGIKA_BALA_VIRUPA.Mars, 17.142857, 1e-6, 'Mars is 17.14, not 17');
assert.equal(NAISARGIKA_BALA_VIRUPA.Sun, 60, 'the Sun has the full 60');

// 27.32–33: 390, 360, 300, 420, 390, 330, 300 virūpa.
const REQUIRED: Record<ShadbalaPlanet, number> = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 };
for (const planet of PLANETS) assert.equal(SHADBALA_REQUIRED_VIRUPA[planet], REQUIRED[planet], `required Shadbala for ${planet}`);

// 27.7–8 take the 4th house from the Sun and Mars, the 7th from Jupiter and Mercury, the 1st from Saturn
// and the 10th from the Moon and Venus, so the strongest points are the opposite ones.
assert.deepEqual(DIG_BALA_STRONG_POINT, {
  Sun: 'mc', Mars: 'mc', Moon: 'ic', Venus: 'ic', Jupiter: 'asc', Mercury: 'asc', Saturn: 'desc',
});

// ---------------------------------------------------------------------------
// Dig Bala: the distance from the powerless angle, divided by three
// ---------------------------------------------------------------------------
{
  const angles = { ascendant: 100, midheaven: 10 }; // descendant 280, nadir 190
  const point: Record<string, number> = { asc: 100, desc: 280, mc: 10, ic: 190 };
  for (const planet of PLANETS) {
    const strong = point[DIG_BALA_STRONG_POINT[planet]];
    close(calculateDigBalaVirupa(planet, strong, angles), 60, 1e-9, `${planet} Dig Bala at its strong point`);
    close(calculateDigBalaVirupa(planet, strong + 180, angles), 0, 1e-9, `${planet} Dig Bala at the powerless point`);
    close(calculateDigBalaVirupa(planet, strong + 90, angles), 30, 1e-9, `${planet} Dig Bala a quarter circle away`);
    close(calculateDigBalaVirupa(planet, strong - 30 + 360, angles), 50, 1e-9, `${planet} Dig Bala 30 degrees from the strong point`);
  }
  // Without a midheaven it is 90 degrees before the descendant.
  close(calculateDigBalaVirupa('Sun', 100 + 270, { ascendant: 100 }), 60, 1e-9, 'Sun Dig Bala with the midheaven assumed');
  assert.equal(calculateDigBalaVirupa('Sun', 10, {}), 0, 'no ascendant, no Dig Bala');
}

// ---------------------------------------------------------------------------
// Sthana components
// ---------------------------------------------------------------------------
// Kendra 60, panapara 30, apoklima 15.
for (const house of [1, 4, 7, 10]) assert.equal(calculateKendradiBalaVirupa(house), 60, `H${house} is a kendra`);
for (const house of [2, 5, 8, 11]) assert.equal(calculateKendradiBalaVirupa(house), 30, `H${house} is a panapara`);
for (const house of [3, 6, 9, 12]) assert.equal(calculateKendradiBalaVirupa(house), 15, `H${house} is an apoklima`);

// Uccha Bala is 60 vp at the exaltation degree and 0 vp at the opposite point (27.1–2, 3.49–50).
const EXALTATION_LONGITUDE: Record<string, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};
for (const [planet, longitude] of Object.entries(EXALTATION_LONGITUDE)) {
  close(calculateUcchaBalaVirupa(planet, longitude), 60, 1e-9, `${planet} Uccha Bala peak`);
  close(calculateUcchaBalaVirupa(planet, (longitude + 180) % 360), 0, 1e-9, `${planet} Uccha Bala at debilitation`);
}

// Ojhayugma (27.5): the Moon and Venus in even signs, all the others, Mercury and Saturn too, in odd
// signs; 15 for the rāśi and 15 for the navāṃśa. 0° of Aries is an odd sign, and so is its navāṃśa.
for (const planet of PLANETS) {
  const evenKind = planet === 'Moon' || planet === 'Venus';
  assert.equal(calculateOjhayugmaBalaVirupa(planet, 1), evenKind ? 0 : 30, `${planet} Ojhayugma in Aries navamsa 1`);
  // 31° is Taurus (even) and its navāṃśa 31/3.33 = the 10th from Aries, Capricorn (even).
  assert.equal(calculateOjhayugmaBalaVirupa(planet, 31), evenKind ? 30 : 0, `${planet} Ojhayugma in Taurus`);
  // 1° of Aries is the 1st navāṃśa (Aries, odd) while 35° is in Taurus (even) and in the 11th navāṃśa (Aquarius, odd).
  assert.equal(calculateOjhayugmaBalaVirupa(planet, 35), 15, `${planet} Ojhayugma with the rāśi and the navāṃśa of different kinds`);
}

// Drekkana (27.6, 3.19): males in the first decanate, neuters second, females third; 15 vp.
const DREKKANA_DECANATE: Record<ShadbalaPlanet, number> = { Sun: 1, Mars: 1, Jupiter: 1, Mercury: 2, Saturn: 2, Moon: 3, Venus: 3 };
for (const planet of PLANETS) {
  for (const decanate of [1, 2, 3]) {
    const longitude = 30 + (decanate - 1) * 10 + 5; // in Taurus: 5, 15 and 25 degrees
    assert.equal(calculateDrekkanaBalaVirupa(planet, longitude), DREKKANA_DECANATE[planet] === decanate ? 15 : 0, `${planet} Drekkana in decanate ${decanate}`);
  }
}

// Mūlatrikoṇa bands (3.51–54), the first 3° of Taurus being the Moon's exaltation and the first 15° of
// Virgo the exaltation of Mercury.
assert.equal(getDignity('Sun', 4, 10), 'moolatrikona', 'Leo 10 deg is the Sun Moolatrikona');
assert.equal(getDignity('Sun', 4, 25), 'own', 'Leo 25 deg is only own sign');
assert.equal(getDignity('Sun', 4), 'own', 'without a degree it falls back to own');
assert.equal(getDignity('Moon', 1, 2.99), 'exalted', 'Taurus 2.99 deg is lunar exaltation');
assert.equal(getDignity('Moon', 1, 3), 'moolatrikona', 'the Moolatrikona of the Moon begins at 3 deg');
assert.equal(getDignity('Moon', 1, 29.9), 'moolatrikona', 'and runs to the end of Taurus');
assert.equal(getDignity('Mercury', 5, 14.99), 'exalted', 'Virgo 14.99 deg is exaltation of Mercury');
assert.equal(getDignity('Mercury', 5, 15), 'moolatrikona', 'the Moolatrikona of Mercury begins at 15 deg');
assert.equal(getDignity('Mercury', 5, 19.99), 'moolatrikona', 'and holds to 20 deg');
assert.equal(getDignity('Mercury', 5, 20), 'exalted', 'after which Virgo is only a sign of exaltation and of its own');
assert.equal(getDignity('Sun', 6, 5), 'debilitated', 'Libra keeps the Sun debilitated');

// ---------------------------------------------------------------------------
// Saptavargaja: the compound relations (3.55–58) and the table 45/30/20/15/10/4/2 (27.2–4)
// ---------------------------------------------------------------------------
{
  // Sun and Moon are natural friends. The 4th place from the Sun is a temporary friend, the 1st is not.
  const signs = (sun: number, other: number, name: ShadbalaPlanet): RasiSigns => ({ Sun: sun, [name]: other });
  assert.equal(getCompoundRelation('Sun', 'Moon', signs(0, 3, 'Moon')), 'adhimitra', 'friend + temporary friend');
  assert.equal(getCompoundRelation('Sun', 'Moon', signs(0, 0, 'Moon')), 'sama', 'friend + temporary enemy');
  // Sun and Jupiter: natural friends, Jupiter in the 9th place (not 2,3,4,10,11,12) is a temporary enemy.
  assert.equal(getCompoundRelation('Sun', 'Jupiter', signs(0, 8, 'Jupiter')), 'sama');
  // Moon and Jupiter are neutral to one another.
  assert.equal(getCompoundRelation('Moon', 'Jupiter', { Moon: 5, Jupiter: 8 }), 'mitra', 'neutral + temporary friend (4th place)');
  assert.equal(getCompoundRelation('Moon', 'Jupiter', { Moon: 5, Jupiter: 9 }), 'shatru', 'neutral + temporary enemy (5th place)');
  // Sun and Venus are natural enemies.
  assert.equal(getCompoundRelation('Sun', 'Venus', signs(0, 1, 'Venus')), 'sama', 'enemy + temporary friend');
  assert.equal(getCompoundRelation('Sun', 'Venus', signs(0, 6, 'Venus')), 'adhishatru', 'enemy + temporary enemy');
  // Unknown positions: the natural relation alone.
  assert.equal(getCompoundRelation('Sun', 'Moon', {}), 'mitra');
  assert.equal(getCompoundRelation('Sun', 'Venus', {}), 'shatru');
  assert.equal(getCompoundRelation('Sun', 'Mercury', {}), 'sama');
}

for (const planet of PLANETS) {
  const rasi = rasiSignsOf({ planets: PLANETS.map((name, index) => ({ name, longitude: index * 41 + 3 })) });
  for (const longitude of [0, 37, 95, 158, 212, 274, 331]) {
    const saptavargaja = calculateSaptavargajaBalaVirupa(planet, longitude, rasi);
    assert.ok(saptavargaja >= 14 && saptavargaja <= 315, `${planet} Saptavargaja is a sum of seven scores, 2 to 45 each (got ${saptavargaja})`);
  }
}

// Mūlatrikoṇa scores 45 in the rāśi only: the Sun at 1° of Leo has it there, and in each of the other six
// vargas it scores 2 to 30 (an own sign is 30, never 45), so the sum lies between 45 + 6 x 2 and 45 + 6 x 30.
{
  const score = calculateSaptavargajaBalaVirupa('Sun', 120 + 1, { Sun: 4 });
  assert.ok(score >= 45 + 6 * 2 && score <= 45 + 6 * 30, `the rāśi gives the Sun its 45 and no other varga does (got ${score})`);
}

// ---------------------------------------------------------------------------
// Sphuṭa dṛṣṭi (26.6–12) and the Moon's nature
// ---------------------------------------------------------------------------
{
  // The general table is continuous and reaches 60 only at 180 degrees.
  const general = (angle: number) => aspectVirupa('Venus', angle);
  const knots: Array<[number, number]> = [[29.99, 0], [30, 0], [60, 15], [90, 45], [120, 30], [150, 0], [180, 60], [240, 30], [299.99, 0.005], [300, 0]];
  for (const [angle, value] of knots) close(general(angle), value, 0.02, `general aspect at ${angle}`);
  close(general(45), 7.5, 1e-9, 'general aspect at 45');
  close(general(75), 30, 1e-9, 'general aspect at 75');
  close(general(105), 37.5, 1e-9, 'general aspect at 105');
  close(general(135), 15, 1e-9, 'general aspect at 135');
  close(general(165), 30, 1e-9, 'general aspect at 165');
  // The other four grahas without special aspects use the same table.
  for (const graha of ['Sun', 'Moon', 'Mercury'] as const) close(aspectVirupa(graha, 100), general(100), 1e-12, `${graha} aspects as the general table`);

  // Special aspects (26.9–12) at their ends and middles.
  close(aspectVirupa('Mars', 90), 60, 1e-9, 'Mars at 90 (4th)');
  close(aspectVirupa('Mars', 75), 37.5, 1e-9, 'Mars at 75: 1.5 x 15 + 15');
  close(aspectVirupa('Mars', 195), 60, 1e-9, 'Mars in the sixth completed sign');
  close(aspectVirupa('Mars', 210), 60, 1e-9, 'Mars at 210 (8th)');
  close(aspectVirupa('Mars', 225), 45, 1e-9, 'Mars at 225');
  close(aspectVirupa('Jupiter', 120), 60, 1e-9, 'Jupiter at 120 (5th)');
  close(aspectVirupa('Jupiter', 105), 52.5, 1e-9, 'Jupiter at 105');
  close(aspectVirupa('Jupiter', 135), 45, 1e-9, 'Jupiter at 135');
  close(aspectVirupa('Jupiter', 240), 60, 1e-9, 'Jupiter at 240 (9th)');
  close(aspectVirupa('Jupiter', 225), 52.5, 1e-9, 'Jupiter at 225');
  close(aspectVirupa('Saturn', 60), 60, 1e-9, 'Saturn at 60');
  close(aspectVirupa('Saturn', 45), 30, 1e-9, 'Saturn at 45');
  close(aspectVirupa('Saturn', 75), 52.5, 1e-9, 'Saturn at 75');
  close(aspectVirupa('Saturn', 270), 60, 1e-9, 'Saturn at 270 (10th)');
  close(aspectVirupa('Saturn', 285), 30, 1e-9, 'Saturn at 285');
  close(aspectVirupa('Saturn', 255), 45, 1e-9, 'Saturn at 255');
  // Every graha casts the full aspect at 180 degrees and nothing under 30 or from 300 on.
  for (const graha of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) {
    close(aspectVirupa(graha, 180), 60, 1e-9, `${graha} opposes at full strength`);
    assert.equal(aspectVirupa(graha, 20), 0, `${graha} casts nothing at 20`);
    assert.equal(aspectVirupa(graha, 330), 0, `${graha} casts nothing at 330`);
    assert.equal(aspectVirupa(graha, -180), aspectVirupa(graha, 180), `${graha} angles are modular`);
  }
}

// The Moon (3.11, 34.9): the bright half up to the full Moon is a benefic, the dark half and the new Moon are not.
assert.equal(isMoonBenefic(0), false, 'new Moon');
assert.equal(isMoonBenefic(0.01), true, 'just after the new Moon');
assert.equal(isMoonBenefic(90), true, 'waxing quarter');
assert.equal(isMoonBenefic(180), true, 'full Moon');
assert.equal(isMoonBenefic(180.01), false, 'just after the full Moon');
assert.equal(isMoonBenefic(249.8), false, 'the Moon of the reference chart is waning');
assert.equal(isMoonBenefic(359.99), false, 'waning crescent');
assert.equal(isMoonBenefic(-90), false, 'negative angles are modular');

// Dṛg Bala of a lone target: a quarter of the benefic aspects less a quarter of the malefic ones.
{
  const target = (extra: Array<{ name: string; longitude: number }>) => ({
    planets: [{ name: 'Saturn', longitude: 120 }, ...extra],
  });
  // Jupiter 120 degrees behind Saturn aspects it at 120: 60 virūpa, benefic, so +15.
  close(calculateDrikBalaVirupa('Saturn', target([{ name: 'Jupiter', longitude: 0 }])), 15, 1e-9, 'Jupiter aspect');
  // Mars 195 degrees behind: 60 virūpa, malefic, so -15.
  close(calculateDrikBalaVirupa('Saturn', target([{ name: 'Mars', longitude: 285 }])), -15, 1e-9, 'Mars aspect');
  // Venus, benefic, 180 degrees away.
  close(calculateDrikBalaVirupa('Saturn', target([{ name: 'Venus', longitude: 300 }])), 15, 1e-9, 'Venus opposition');
  // A graha under 30 degrees away casts nothing.
  close(calculateDrikBalaVirupa('Saturn', target([{ name: 'Venus', longitude: 100 }])), 0, 1e-9, 'conjunction casts no aspect');
  // The Sun and Mars are malefics.
  close(calculateDrikBalaVirupa('Saturn', target([{ name: 'Sun', longitude: 300 }])), -15, 1e-9, 'Sun opposition');
  // Sun at 0 and the Moon at 300 (elongation 300, waning) 180 degrees from Saturn at 120.
  const moonChart = (moon: number) => ({ planets: [{ name: 'Saturn', longitude: 120 }, { name: 'Sun', longitude: 0 }, { name: 'Moon', longitude: moon }] });
  // Sun 120 degrees behind Saturn casts 30, the waning Moon 180 degrees behind casts 60; both are malefics.
  close(calculateDrikBalaVirupa('Saturn', moonChart(300)), -(aspectVirupa('Sun', 120) + aspectVirupa('Moon', 180)) / 4, 1e-9, 'a waning Moon counts as a malefic');
  // A waxing Moon (elongation 120) 180 degrees from Saturn at 300 is a benefic; the Sun at 0 casts nothing there.
  const waxing = { planets: [{ name: 'Saturn', longitude: 300 }, { name: 'Sun', longitude: 0 }, { name: 'Moon', longitude: 120 }] };
  close(calculateDrikBalaVirupa('Saturn', waxing), 15 + (-aspectVirupa('Sun', 300) / 4), 1e-9, 'a waxing Moon counts as a benefic');
}

// Mercury is a malefic in the company of a malefic (the same sign) and a benefic otherwise.
{
  const aspectOnSaturn = (mercury: number, extra: Array<{ name: string; longitude: number }>) =>
    calculateDrikBalaVirupa('Saturn', { planets: [{ name: 'Saturn', longitude: 300 }, { name: 'Mercury', longitude: mercury }, ...extra] });
  // Mercury at 120 is 180 degrees from Saturn at 300: the full 60 virūpa.
  close(aspectOnSaturn(120, []), 15, 1e-9, 'a lone Mercury is a benefic');
  close(aspectOnSaturn(120, [{ name: 'Mars', longitude: 125 }]), -15 - aspectVirupa('Mars', (300 - 125 + 360) % 360) / 4, 1e-9, 'with Mars in its sign Mercury is a malefic');
  close(aspectOnSaturn(120, [{ name: 'Rahu', longitude: 130 }]), -15, 1e-9, 'Rahu counts as a malefic companion');
  close(aspectOnSaturn(120, [{ name: 'Venus', longitude: 125 }]), 15 + aspectVirupa('Venus', (300 - 125 + 360) % 360) / 4, 1e-9, 'with Venus it stays a benefic');
}

// ---------------------------------------------------------------------------
// Ayana Bala: the declination from the table 45:33:12 (27.15–17)
// ---------------------------------------------------------------------------
{
  const declinations: Array<[number, number]> = [
    [0, 0], [30, 12], [60, 20.8], [90, 24], [120, 20.8], [150, 12], [180, 0],
    [210, -12], [240, -20.8], [270, -24], [300, -20.8], [330, -12], [15, 6], [45, 16.4],
  ];
  for (const [longitude, declination] of declinations) close(declinationFromSayanaLongitude(longitude), declination, 1e-9, `declination at ${longitude}`);
  close(declinationFromSayanaLongitude(360), 0, 1e-9, 'declination at 360');
  close(declinationFromSayanaLongitude(-90), -24, 1e-9, 'declination at -90');
}

const ayanaOf = (planet: string, sayanaLongitude: number) => {
  // A chart whose longitudes are tropical (ayanamsa 0), so the longitude is the sāyana one.
  const chart = {
    ascendant: { sign: 1 },
    debug: { inputDateTime: '2000-01-01 12:00:00', ayanamsa: 0 },
    planets: [{ name: planet, sign: 1, house: 1, degree: 0, longitude: sayanaLongitude, declination: 0, speed: 1 }],
  };
  return buildShadbalaRows(chart)[0].kalaBreakdown.ayana;
};
// North-strong planets peak at the northern solstice and bottom out at the southern one.
for (const planet of ['Sun', 'Mars', 'Jupiter', 'Venus'] as const) {
  close(ayanaOf(planet, 90), 60, 1e-9, `${planet} Ayana peaks at 90`);
  close(ayanaOf(planet, 270), 0, 1e-9, `${planet} Ayana bottoms at 270`);
  close(ayanaOf(planet, 0), 30, 1e-9, `${planet} Ayana is half on the equinox`);
}
// The Sun is not doubled in Kāla; its Cheṣṭā Bala is the same number (27.18).
close(ayanaOf('Sun', 90), 60, 1e-9, 'the Sun Ayana Bala is not doubled');
// South-strong planets are the mirror image.
for (const planet of ['Moon', 'Saturn'] as const) {
  close(ayanaOf(planet, 270), 60, 1e-9, `${planet} Ayana peaks at 270`);
  close(ayanaOf(planet, 90), 0, 1e-9, `${planet} Ayana bottoms at 90`);
}
// Mercury is strong in either direction, so it is symmetric and never below 30.
close(ayanaOf('Mercury', 60), ayanaOf('Mercury', 300), 1e-9, 'Mercury Ayana is symmetric');
assert.ok(ayanaOf('Mercury', 0) >= 30, 'Mercury Ayana never drops below half');
// Without an ayanamsa the true declination stands in.
{
  const bare = buildShadbalaRows({
    ascendant: { sign: 1 },
    debug: { inputDateTime: '2000-01-01 12:00:00' },
    planets: [{ name: 'Mars', sign: 1, house: 1, degree: 0, longitude: 10, declination: 24, speed: 1 }],
  })[0].kalaBreakdown.ayana;
  close(bare, 60, 1e-9, 'declination fallback');
}

// ---------------------------------------------------------------------------
// Varṣa-Māsa-Dina-Horā Bala (27.13): the ahargaṇa method gives the commentators' own examples
// ---------------------------------------------------------------------------
{
  // Santhanam: 1 June 1984 gives Thursday, Friday and Friday as the lords of the year, month and day.
  const santhanam = yearMonthDayLords({ year: 1984, month: 6, day: 1 });
  assert.deepEqual([santhanam.abda, santhanam.masa, santhanam.vara], ['Jupiter', 'Venus', 'Venus'], 'Santhanam example');
  // Raman: Wednesday 16 October 1918, ahargaṇa 714,404,130,045, Saturn, Mercury, Mercury.
  const raman = yearMonthDayLords({ year: 1918, month: 10, day: 16 });
  assert.equal(raman.ahargana, 714_404_130_045, 'Raman ahargana');
  assert.deepEqual([raman.abda, raman.masa, raman.vara], ['Saturn', 'Mercury', 'Mercury'], 'Raman example');
  assert.equal(ahargana({ year: 1860, month: 1, day: 1 }), 714_404_108_573, 'the anchor');
  // The lord of the day matches the weekday.
  assert.equal(yearMonthDayLords({ year: 2024, month: 7, day: 14 }).vara, 'Sun', '14 July 2024 was a Sunday');
  // The first hora is the day lord's, and the following ones run Venus, Mercury, Moon, Saturn, Jupiter, Mars.
  assert.equal(horaLord('Sun', 0.5), 'Sun');
  assert.equal(horaLord('Sun', 1.2), 'Venus');
  assert.equal(horaLord('Sun', 6.9), 'Mars');
  assert.equal(horaLord('Sun', 7), 'Sun', 'the eighth hour starts the order again');
  assert.equal(horaLord('Moon', 17.527), 'Mars', 'the reference chart: Monday, 18th hour');
}

// ---------------------------------------------------------------------------
// Cheṣṭā Bala by the cheṣṭā-kendra (27.24–25)
// ---------------------------------------------------------------------------
{
  // Raman's worked example (articles 94–104): 6862.578 days after the Ujjain midnight of 1 January 1900.
  const jd = 2415020.5 - 76 / 360 + 6862.578;
  close(meanLongitudes('Mars', jd).sun, 181.2275, 0.01, 'Raman mean Sun');
  close(meanLongitudes('Mars', jd).planet, 266.34, 0.02, 'Raman mean Mars');
  close(meanLongitudes('Jupiter', jd).planet, 66.91, 0.1, 'Raman mean Jupiter');
  close(meanLongitudes('Saturn', jd).planet, 111.23, 0.02, 'Raman mean Saturn');
  close(meanLongitudes('Mercury', jd).planet, 174.49, 0.05, 'Raman sighrocca of Mercury');
  close(meanLongitudes('Venus', jd).planet, 158.35, 0.05, 'Raman sighrocca of Venus');

  // The kendra is the sighrocca less the mean of the mean and true longitudes, over six signs taken from the circle.
  const sun = meanLongitudes('Mars', jd).sun;
  const mars = meanLongitudes('Mars', jd).planet;
  close(cheshtaKendra('Mars', jd, mars), (() => { const k = (sun - mars + 720) % 360; return k > 180 ? 360 - k : k; })(), 1e-9, 'kendra with true = mean');
  // A planet whose true and mean longitudes both lie opposite the sighrocca has the full 60.
  close(cheshtaKendraBalaVirupa('Saturn', jd, (sun + 180) % 360) , (() => {
    const mean = meanLongitudes('Saturn', jd).planet;
    const diff = ((((sun + 180) % 360) - mean + 540) % 360) - 180;
    const average = (mean + diff / 2 + 720) % 360;
    const k = (sun - average + 720) % 360;
    return (k > 180 ? 360 - k : k) / 3;
  })(), 1e-9, 'Saturn Cheshta from the formula');
  assert.ok(cheshtaKendraBalaVirupa('Venus', jd, 200) >= 0 && cheshtaKendraBalaVirupa('Venus', jd, 200) <= 60, 'Cheshta stays within 0–60');
}

// ---------------------------------------------------------------------------
// The reference chart: 13 October 1987, 00:15 EET, Kotka (60.46667 N, 26.94583 E), Lahiri ayanamsa
// ---------------------------------------------------------------------------
// The positions are the app's own. The expected numbers were worked out separately from the Sanskrit
// rules, with the decisions of the audit: the waning Moon a malefic, the mūlatrikoṇa 45 in the rāśi only,
// the Sun's and the Moon's Cheṣṭā Bala added to the total, and Dṛg Bala a quarter of the net aspect.
const REFERENCE_CHART: ShadbalaChartLike = {
  ascendant: { sign: 4, longitude: 114.54414658026127 },
  midheaven: 359.70649166138884,
  debug: {
    julianDay: 2447081.4270833335,
    ayanamsa: 23.686388896283233,
    siderealAyanamsa: 23.686388896283233,
    inputDateTime: '1987-10-13 00:15:00',
    sunriseLocalHours: 6.764217132702925,
    sunsetLocalHours: 17.168893737718008,
    nextSunriseLocalHours: 30.806000037118338,
    previousSunriseLocalHours: -17.277436288074114,
  },
  planets: [
    { name: 'Sun', longitude: 175.35945018610008, sign: 6, house: 3, speed: 0.9895424227498335, declination: -7.459388811762785 },
    { name: 'Moon', longitude: 65.16355521542967, sign: 3, house: 12, speed: 12.22188189209701, declination: 28.688789056814585 },
    { name: 'Mars', longitude: 158.9588132147914, sign: 6, house: 3, speed: 0.6430602219606304, declination: -0.14504848813216933 },
    { name: 'Mercury', longitude: 198.70672644229387, sign: 7, house: 4, speed: 0.4145030031744527, declination: -18.740312708833574 },
    { name: 'Jupiter', longitude: 1.754213422011535, sign: 1, house: 10, speed: -0.13369810487429085, declination: 8.363950439435337, isRetrograde: true },
    { name: 'Venus', longitude: 188.87826045970806, sign: 7, house: 4, speed: 1.2449938119996466, declination: -11.770605887604804 },
    { name: 'Saturn', longitude: 233.14880397832485, sign: 8, house: 5, speed: 0.07992155076193948, declination: -21.54586845038315 },
    { name: 'Rahu', longitude: 337.72078702269863, sign: 12, house: 9 },
    { name: 'Ketu', longitude: 157.7207870226987, sign: 6, house: 3 },
  ],
};

const EXPECTED: Record<ShadbalaPlanet, {
  uccha: number; saptavargaja: number; ojhayugma: number; kendradi: number; drekkana: number; sthana: number;
  dig: number; natonnata: number; paksha: number; tribhaga: number; varsheshadi: number; ayana: number; kala: number;
  cheshta: number; naisargika: number; drik: number; total: number;
}> = {
  Sun:     { uccha: 4.88,  saptavargaja: 145, ojhayugma: 15, kendradi: 15, drekkana: 0,  sthana: 179.9, dig: 1.45,  natonnata: 1.42,  paksha: 23.27, tribhaga: 0,  varsheshadi: 0,  ayana: 20.48, kala: 45.2,  cheshta: 20.48, naisargika: 60,    drik: 3.08,   total: 310.0 },
  Moon:    { uccha: 49.28, saptavargaja: 109, ojhayugma: 15, kendradi: 15, drekkana: 0,  sthana: 188.3, dig: 21.82, natonnata: 58.58, paksha: 36.73, tribhaga: 0,  varsheshadi: 45, ayana: 0.15,  kala: 140.5, cheshta: 36.73, naisargika: 51.43, drik: -2.24,  total: 436.5 },
  Mars:    { uccha: 13.65, saptavargaja: 85,  ojhayugma: 0,  kendradi: 15, drekkana: 15, sthana: 128.7, dig: 6.92,  natonnata: 58.58, paksha: 23.27, tribhaga: 0,  varsheshadi: 60, ayana: 28.68, kala: 170.5, cheshta: 7.42,  naisargika: 17.14, drik: -14.27, total: 316.4 },
  Mercury: { uccha: 48.76, saptavargaja: 86,  ojhayugma: 15, kendradi: 60, drekkana: 15, sthana: 224.8, dig: 31.95, natonnata: 60,    paksha: 36.73, tribhaga: 0,  varsheshadi: 30, ayana: 49.54, kala: 176.3, cheshta: 49.05, naisargika: 25.71, drik: 7.55,   total: 515.3 },
  Jupiter: { uccha: 28.92, saptavargaja: 70,  ojhayugma: 30, kendradi: 60, drekkana: 15, sthana: 203.9, dig: 22.40, natonnata: 1.42,  paksha: 36.73, tribhaga: 60, varsheshadi: 0,  ayana: 42.72, kala: 140.9, cheshta: 58.63, naisargika: 34.29, drik: -17.01, total: 443.1 },
  Venus:   { uccha: 3.96,  saptavargaja: 133, ojhayugma: 0,  kendradi: 60, drekkana: 0,  sthana: 197.0, dig: 56.94, natonnata: 1.42,  paksha: 36.73, tribhaga: 60, varsheshadi: 0,  ayana: 14.06, kala: 112.2, cheshta: 9.08,  naisargika: 42.86, drik: 7.54,   total: 425.6 },
  Saturn:  { uccha: 48.95, saptavargaja: 112, ojhayugma: 0,  kendradi: 30, drekkana: 0,  sthana: 191.0, dig: 39.53, natonnata: 58.58, paksha: 23.27, tribhaga: 0,  varsheshadi: 15, ayana: 58.24, kala: 155.1, cheshta: 18.87, naisargika: 8.57,  drik: -5.27,  total: 407.8 },
};

{
  const reference = buildShadbalaRows(REFERENCE_CHART);
  assert.equal(reference.length, 7);
  for (const row of reference) {
    const expected = EXPECTED[row.planet];
    const tag = `${row.planet} of the reference chart`;
    close(row.sthanaBreakdown.uccha, expected.uccha, 0.01, `${tag}: Uccha`);
    assert.equal(row.sthanaBreakdown.saptavargaja, expected.saptavargaja, `${tag}: Saptavargaja`);
    assert.equal(row.sthanaBreakdown.ojhayugma, expected.ojhayugma, `${tag}: Ojhayugma`);
    assert.equal(row.sthanaBreakdown.kendradi, expected.kendradi, `${tag}: Kendradi`);
    assert.equal(row.sthanaBreakdown.drekkana, expected.drekkana, `${tag}: Drekkana`);
    close(row.sthanaBreakdown.total, expected.sthana, 0.05, `${tag}: Sthana`);
    close(row.digVirupa, expected.dig, 0.02, `${tag}: Dig`);
    close(row.kalaBreakdown.natonnata, expected.natonnata, 0.02, `${tag}: Natonnata`);
    close(row.kalaBreakdown.paksha, expected.paksha, 0.02, `${tag}: Paksha`);
    assert.equal(row.kalaBreakdown.tribhaaga, expected.tribhaga, `${tag}: Tribhaga`);
    assert.equal(row.kalaBreakdown.varsheshadi, expected.varsheshadi, `${tag}: Varsha-Masa-Dina-Hora`);
    close(row.kalaBreakdown.ayana, expected.ayana, 0.02, `${tag}: Ayana`);
    close(row.kalaBreakdown.total, expected.kala, 0.05, `${tag}: Kala`);
    close(row.cheshtaVirupa, expected.cheshta, 0.1, `${tag}: Cheshta`);
    close(row.naisargikaVirupa, expected.naisargika, 0.01, `${tag}: Naisargika`);
    close(row.drikVirupa, expected.drik, 0.02, `${tag}: Drig`);
    close(row.totalVirupa, expected.total, 0.3, `${tag}: total`);
  }
  assert.deepEqual(reference[0].kalaBreakdown.varsheshadiLords, { abda: 'Saturn', masa: 'Mercury', vara: 'Moon', hora: 'Mars' }, 'lords of the reference birth');

  // Mars, 316 against 300 required, passes; the Sun, 310 against 390, does not.
  assert.ok(reference.find((row) => row.planet === 'Mars')!.ratio > 1, 'Mars passes its minimum');
  assert.ok(reference.find((row) => row.planet === 'Sun')!.ratio < 1, 'the Sun does not');

  // The Sun's and the Moon's Cheṣṭā Bala are their Ayana and Pakṣa Bala, once more beside the Kāla (27.18, 27.25).
  const sunRow = reference.find((row) => row.planet === 'Sun')!;
  const moonRow = reference.find((row) => row.planet === 'Moon')!;
  assert.equal(sunRow.cheshtaVirupa, sunRow.kalaBreakdown.ayana, 'Sun Cheshta equals its Ayana Bala');
  assert.equal(moonRow.cheshtaVirupa, moonRow.kalaBreakdown.paksha, 'Moon Cheshta equals its Paksha Bala');
  assert.equal(rasiSignsOf(REFERENCE_CHART).Sun, 5, 'Sun in Virgo');

  // The tropical zodiac and another ayanamsa give the same Cheshta Bala: the positions are moved to Lahiri's.
  const raman = 22.240087567723947;
  const shifted = {
    ...REFERENCE_CHART,
    debug: { ...REFERENCE_CHART.debug, ayanamsa: raman },
    planets: REFERENCE_CHART.planets!.map((planet) => ({ ...planet, longitude: (planet.longitude! + 23.686388896283233 - raman + 360) % 360 })),
  };
  const shiftedRows = buildShadbalaRows(shifted);
  for (const row of shiftedRows) {
    if (['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(row.planet)) {
      close(row.cheshtaVirupa, EXPECTED[row.planet].cheshta, 0.1, `${row.planet} Cheshta in another zodiac`);
    }
  }
}

// ---------------------------------------------------------------------------
// Full engine — the six balas must reconstruct the reported total
// ---------------------------------------------------------------------------
const chart: ShadbalaChartLike = {
  ascendant: { sign: 1, longitude: 5 },
  midheaven: 275,
  debug: {
    inputDateTime: '2000-01-01 12:00:00',
    julianDay: 2451545,
    ayanamsa: 23.85,
    siderealAyanamsa: 23.85,
    sunriseLocalHours: 6.5,
    sunsetLocalHours: 18.25,
    nextSunriseLocalHours: 30.5,
    previousSunriseLocalHours: -17.5,
  },
  planets: [
    { name: 'Sun', sign: 10, house: 10, degree: 15, longitude: 285, speed: 1.019, declination: -23.0 },
    { name: 'Moon', sign: 4, house: 4, degree: 3, longitude: 93, speed: 12.4, declination: 18.2 },
    { name: 'Mars', sign: 8, house: 8, degree: 22, longitude: 232, speed: 0.72, declination: -14.5 },
    { name: 'Mercury', sign: 9, house: 9, degree: 8, longitude: 248, speed: -0.5, declination: -20.1, isRetrograde: true },
    { name: 'Jupiter', sign: 2, house: 2, degree: 27, longitude: 57, speed: 0.04, declination: 16.4 },
    { name: 'Venus', sign: 11, house: 11, degree: 12, longitude: 312, speed: 1.21, declination: -19.8 },
    { name: 'Saturn', sign: 2, house: 2, degree: 4, longitude: 34, speed: 0.001, declination: 11.9 },
  ],
};

const rows: ShadbalaRow[] = buildShadbalaRows(chart);
assert.equal(rows.length, 7, 'every classical planet must produce a row');

for (const row of rows) {
  // Sthana is the sum of its own five components.
  const sthana = row.sthanaBreakdown;
  assert.ok(
    Math.abs(sthana.total - (sthana.uccha + sthana.saptavargaja + sthana.ojhayugma + sthana.kendradi + sthana.drekkana)) < 1e-9,
    `${row.planet} Sthana Bala must equal its five components`,
  );

  // Kala is the sum of its five reported components (Natonnata, Paksha, Tribhaaga, Varsheshadi, Ayana).
  const kala = row.kalaBreakdown;
  assert.ok(
    Math.abs(kala.total - (kala.natonnata + kala.paksha + kala.tribhaaga + kala.varsheshadi + kala.ayana)) < 1e-9,
    `${row.planet} Kala Bala must equal its five components`,
  );

  // The headline total is the sum of the six balas — not a rescale or an average.
  const sixBalas = sthana.total + row.digVirupa + kala.total + row.cheshtaVirupa + row.naisargikaVirupa + row.drikVirupa;
  assert.ok(Math.abs(row.totalVirupa - sixBalas) < 1e-9, `${row.planet} Shadbala total must be the sum of the six balas`);

  // Rupa is virupa/60, and the ratio is measured against the planet's own minimum.
  assert.ok(Math.abs(row.total - row.totalVirupa / 60) < 1e-9, `${row.planet} rupa conversion`);
  assert.equal(row.requiredVirupa, REQUIRED[row.planet], `${row.planet} required minimum`);
  assert.ok(Math.abs(row.ratio - row.totalVirupa / row.requiredVirupa) < 1e-9, `${row.planet} ratio`);

  // Naisargika is a constant per planet and must survive into the row unchanged.
  assert.equal(row.naisargikaVirupa, NAISARGIKA_BALA_VIRUPA[row.planet], `${row.planet} Naisargika in row`);

  // Sanity: a real chart should land in a plausible band (Drig can be negative).
  assert.ok(row.totalVirupa > 0 && row.totalVirupa < 1000, `${row.planet} total ${row.totalVirupa} vp is out of plausible range`);
}

assert.equal(virupaToRupa(60), 1, 'sixty virupa make one rupa');

// Dig Bala peaks for a planet standing at its own angle: Saturn at the descendant, Jupiter at the ascendant.
{
  const digChart = (planet: string, longitude: number) => ({
    ascendant: { sign: 1, longitude: 5 },
    midheaven: 275,
    debug: { inputDateTime: '2000-01-01 12:00:00' },
    planets: [{ name: planet, sign: 1, house: 1, degree: 0, longitude, speed: 1, declination: 0 }],
  });
  assert.equal(buildShadbalaRows(digChart('Saturn', 185))[0].digVirupa, 60, 'Saturn at the descendant');
  assert.equal(buildShadbalaRows(digChart('Jupiter', 5))[0].digVirupa, 60, 'Jupiter at the ascendant');
  assert.equal(buildShadbalaRows(digChart('Sun', 275))[0].digVirupa, 60, 'the Sun at the midheaven');
  assert.equal(buildShadbalaRows(digChart('Moon', 95))[0].digVirupa, 60, 'the Moon at the nadir');
}

// ---------------------------------------------------------------------------
// Natonnata and Tribhaga — real sunrise and sunset (v2.16)
// ---------------------------------------------------------------------------
// Sunrise 06:30, sunset 18:15, so local noon falls at 12:22:30.
const atHour = (hour: number) => {
  const h = Math.floor(hour), m = Math.floor((hour - h) * 60), s = Math.round((((hour - h) * 60) - m) * 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    ascendant: { sign: 1 },
    debug: {
      inputDateTime: `2000-01-01 ${pad(h)}:${pad(m)}:${pad(s)}`,
      sunriseLocalHours: 6.5,
      sunsetLocalHours: 18.25,
      nextSunriseLocalHours: 30.5,
    },
    planets: [
      { name: 'Sun', sign: 1, house: 1, degree: 0, longitude: 0, speed: 1, declination: 0 },
      { name: 'Moon', sign: 1, house: 1, degree: 0, longitude: 0, speed: 13, declination: 0 },
      { name: 'Mars', sign: 1, house: 1, degree: 0, longitude: 0, speed: 0.5, declination: 0 },
      { name: 'Mercury', sign: 1, house: 1, degree: 0, longitude: 0, speed: 1, declination: 0 },
      { name: 'Jupiter', sign: 1, house: 1, degree: 0, longitude: 0, speed: 0.08, declination: 0 },
      { name: 'Venus', sign: 1, house: 1, degree: 0, longitude: 0, speed: 1, declination: 0 },
      { name: 'Saturn', sign: 1, house: 1, degree: 0, longitude: 0, speed: 0.03, declination: 0 },
    ],
  };
};
const kalaAt = (hour: number, planet: string) =>
  buildShadbalaRows(atHour(hour)).find((row) => row.planet === planet)!.kalaBreakdown;

const solarNoon = (6.5 + 18.25) / 2;

// Day-strong and night-strong planets are complements that always sum to 60.
for (const hour of [0, 3, 6.5, 9, solarNoon, 15, 18.25, 21, 23.5]) {
  const day = kalaAt(hour, 'Sun').natonnata;
  const night = kalaAt(hour, 'Saturn').natonnata;
  assert.ok(Math.abs(day + night - 60) < 1e-9, `Natonnata pair must sum to 60 at ${hour} h`);
  assert.ok(day >= 0 && day <= 60, `Natonnata stays in range at ${hour} h`);
}
assert.ok(Math.abs(kalaAt(solarNoon, 'Sun').natonnata - 60) < 1e-9, 'a day planet is full at true local noon');
assert.ok(Math.abs(kalaAt(solarNoon, 'Saturn').natonnata) < 1e-9, 'a night planet is empty at true local noon');
assert.equal(kalaAt(9, 'Mercury').natonnata, 60, 'Mercury always takes the full Natonnata');
// True noon is 12:22:30, not clock noon — the old 6am/6pm assumption would tie these.
assert.ok(
  kalaAt(solarNoon, 'Sun').natonnata > kalaAt(12, 'Sun').natonnata,
  'strength peaks at true local noon rather than at 12:00',
);

// Tribhaga: the day splits sunrise→sunset in three, the night sunset→sunrise.
const dayThird = (18.25 - 6.5) / 3;
assert.equal(kalaAt(6.5 + dayThird * 0.5, 'Sun').tribhagaLord, 'Mercury', 'first day third is Mercury');
assert.equal(kalaAt(6.5 + dayThird * 1.5, 'Sun').tribhagaLord, 'Sun', 'second day third is the Sun');
assert.equal(kalaAt(6.5 + dayThird * 2.5, 'Sun').tribhagaLord, 'Saturn', 'third day third is Saturn');

const nightThird = (30.5 - 18.25) / 3;
assert.equal(kalaAt(18.25 + nightThird * 0.5, 'Sun').tribhagaLord, 'Moon', 'first night third is the Moon');
assert.equal(kalaAt(18.25 + nightThird * 1.5, 'Sun').tribhagaLord, 'Venus', 'second night third is Venus');
// Before sunrise belongs to the previous night, whose last third is Mars.
assert.equal(kalaAt(5.5, 'Sun').tribhagaLord, 'Mars', 'the small hours fall in the last night third');

// The ruling planet takes 60, others nothing, and Jupiter always takes 60.
const middayLord = kalaAt(6.5 + dayThird * 1.5, 'Sun');
assert.equal(middayLord.tribhaaga, 60, 'the ruling planet of the third scores 60');
assert.equal(kalaAt(6.5 + dayThird * 1.5, 'Venus').tribhaaga, 0, 'a non-ruling planet scores nothing');
assert.equal(kalaAt(6.5 + dayThird * 1.5, 'Jupiter').tribhaaga, 60, 'Jupiter is strong in every third');


// Charts saved before sunrise data existed must still calculate.
const legacy = buildShadbalaRows({
  ascendant: { sign: 1 },
  debug: { inputDateTime: '2000-01-01 09:00:00' },
  planets: [{ name: 'Saturn', sign: 1, house: 1, degree: 0, longitude: 0, speed: 0.03, declination: 5 }],
});
assert.equal(legacy.length, 1, 'a chart without sun times still produces rows');
assert.ok(Number.isFinite(legacy[0].totalVirupa), 'and a finite total');

console.log('Shadbala tests passed');
