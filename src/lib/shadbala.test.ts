import assert from 'node:assert/strict';
// These come from the real engine in src/lib/shadbala.ts. An earlier version of
// this file declared its own local copies of the constants and its own
// reimplementations of the percentage/status helpers, so every assertion
// compared a literal against itself and the suite could not fail no matter what
// the application computed.
import {
  NAISARGIKA_BALA_VIRUPA,
  SHADBALA_REQUIRED_VIRUPA,
  DIG_BALA_MAX_HOUSE,
  buildShadbalaRows,
  calculateDigBalaVirupa,
  calculateUcchaBalaVirupa,
  calculateKendradiBalaVirupa,
  calculateOjhayugmaBalaVirupa,
  calculateDrekkanaBalaVirupa,
  calculateSaptavargajaBalaVirupa,
  classifyMotion,
  getDignity,
  virupaToRupa,
  type ShadbalaPlanet,
  type ShadbalaRow,
} from './shadbala';

const PLANETS: readonly ShadbalaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ---------------------------------------------------------------------------
// Golden vectors — fixed classical virupa values (BPHS)
// ---------------------------------------------------------------------------
const CLASSICAL_NAISARGIKA: Record<ShadbalaPlanet, number> = {
  Sun: 60, Moon: 51, Venus: 43, Jupiter: 34, Mercury: 26, Mars: 17, Saturn: 9,
};

const CLASSICAL_REQUIRED: Record<ShadbalaPlanet, number> = {
  Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300,
};

// Dig Bala is full in the direction each planet owns: Sun and Mars in the 10th,
// Moon and Venus in the 4th, Jupiter and Mercury in the 1st, Saturn in the 7th.
const CLASSICAL_DIG_HOUSE: Record<ShadbalaPlanet, number> = {
  Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7,
};

for (const planet of PLANETS) {
  assert.equal(NAISARGIKA_BALA_VIRUPA[planet], CLASSICAL_NAISARGIKA[planet], `Naisargika Bala for ${planet}`);
  assert.equal(SHADBALA_REQUIRED_VIRUPA[planet], CLASSICAL_REQUIRED[planet], `required Shadbala for ${planet}`);
  assert.equal(DIG_BALA_MAX_HOUSE[planet], CLASSICAL_DIG_HOUSE[planet], `Dig Bala best house for ${planet}`);
}

// Naisargika strictly descends Sun → Moon → Venus → Jupiter → Mercury → Mars → Saturn.
const NAISARGIKA_ORDER: readonly ShadbalaPlanet[] = ['Sun', 'Moon', 'Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'];
for (let index = 0; index < NAISARGIKA_ORDER.length - 1; index += 1) {
  const stronger = NAISARGIKA_BALA_VIRUPA[NAISARGIKA_ORDER[index]];
  const weaker = NAISARGIKA_BALA_VIRUPA[NAISARGIKA_ORDER[index + 1]];
  assert.ok(stronger > weaker, `${NAISARGIKA_ORDER[index]} must outrank ${NAISARGIKA_ORDER[index + 1]}`);
}

// ---------------------------------------------------------------------------
// Component balas — bounds and the classical extremes
// ---------------------------------------------------------------------------
for (const planet of PLANETS) {
  const best = CLASSICAL_DIG_HOUSE[planet];
  // Full 60 vp in the planet's own direction, 0 vp six houses away.
  assert.equal(calculateDigBalaVirupa(planet, best), 60, `${planet} Dig Bala peak`);
  assert.equal(calculateDigBalaVirupa(planet, ((best + 5) % 12) + 1), 0, `${planet} Dig Bala nadir`);
  for (let house = 1; house <= 12; house += 1) {
    const value = calculateDigBalaVirupa(planet, house);
    assert.ok(value >= 0 && value <= 60, `${planet} Dig Bala in H${house} must stay within 0–60`);
  }
}

// Kendra 60, panapara 30, apoklima 15.
for (const house of [1, 4, 7, 10]) assert.equal(calculateKendradiBalaVirupa(house), 60, `H${house} is a kendra`);
for (const house of [2, 5, 8, 11]) assert.equal(calculateKendradiBalaVirupa(house), 30, `H${house} is a panapara`);
for (const house of [3, 6, 9, 12]) assert.equal(calculateKendradiBalaVirupa(house), 15, `H${house} is an apoklima`);

// Uccha Bala is 60 vp at the exaltation degree and 0 vp at the opposite point.
const EXALTATION_LONGITUDE: Record<string, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};
for (const [planet, longitude] of Object.entries(EXALTATION_LONGITUDE)) {
  assert.ok(Math.abs(calculateUcchaBalaVirupa(planet, longitude) - 60) < 1e-9, `${planet} Uccha Bala peak`);
  assert.ok(Math.abs(calculateUcchaBalaVirupa(planet, (longitude + 180) % 360)) < 1e-9, `${planet} Uccha Bala at debilitation`);
}

// Ojhayugma awards 0/15/30; Drekkana awards 0 or 15; Saptavargaja stays in range.
for (const planet of PLANETS) {
  for (const longitude of [0, 37, 95, 158, 212, 274, 331]) {
    const ojha = calculateOjhayugmaBalaVirupa(planet, longitude);
    assert.ok([0, 15, 30].includes(ojha), `${planet} Ojhayugma must be 0, 15 or 30 (got ${ojha})`);
    const drekkana = calculateDrekkanaBalaVirupa(planet, longitude);
    assert.ok([0, 15].includes(drekkana), `${planet} Drekkana must be 0 or 15 (got ${drekkana})`);
    const saptavargaja = calculateSaptavargajaBalaVirupa(planet, longitude);
    assert.ok(saptavargaja >= 0 && saptavargaja <= 45, `${planet} Saptavargaja must stay within 0–45 (got ${saptavargaja})`);
  }
}

assert.equal(virupaToRupa(60), 1, 'sixty virupa make one rupa');

// ---------------------------------------------------------------------------
// Full engine — the six balas must reconstruct the reported total
// ---------------------------------------------------------------------------
const chart = {
  ascendant: { sign: 1, longitude: 5 },
  debug: {
    inputDateTime: '2000-01-01 12:00:00',
    ayanamsa: 23.85,
    sunriseLocalHours: 6.5,
    sunsetLocalHours: 18.25,
    nextSunriseLocalHours: 30.5,
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

  // Kala is the sum of its five reported components (Natonnata, Paksha,
  // Tribhaaga, Varsheshadi, Ayana).
  const kala = row.kalaBreakdown;
  assert.ok(
    Math.abs(kala.total - (kala.natonnata + kala.paksha + kala.tribhaaga + kala.varsheshadi + kala.ayana)) < 1e-9,
    `${row.planet} Kala Bala must equal its five components`,
  );

  // The headline total is the sum of the six balas — not a rescale or an average.
  const sixBalas = sthana.total + row.digVirupa + kala.total + row.cheshtaVirupa + row.naisargikaVirupa + row.drikVirupa;
  assert.ok(
    Math.abs(row.totalVirupa - sixBalas) < 1e-9,
    `${row.planet} Shadbala total must be the sum of the six balas`,
  );

  // Rupa is virupa/60, and the ratio is measured against the planet's own minimum.
  assert.ok(Math.abs(row.total - row.totalVirupa / 60) < 1e-9, `${row.planet} rupa conversion`);
  assert.equal(row.requiredVirupa, CLASSICAL_REQUIRED[row.planet], `${row.planet} required minimum`);
  assert.ok(Math.abs(row.ratio - row.totalVirupa / row.requiredVirupa) < 1e-9, `${row.planet} ratio`);

  // Naisargika is a constant per planet and must survive into the row unchanged.
  assert.equal(row.naisargikaVirupa, CLASSICAL_NAISARGIKA[row.planet], `${row.planet} Naisargika in row`);

  // Sanity: a real chart should land in a plausible band. Drik Bala can be
  // negative, so the floor is generous, but the total must not be absurd.
  assert.ok(row.totalVirupa > 0 && row.totalVirupa < 900, `${row.planet} total ${row.totalVirupa} vp is out of plausible range`);
}

// Dig Bala must peak for a planet actually standing in its own direction: the
// fixture puts the Sun in H10 and the Moon in H4.
const sun = rows.find((row) => row.planet === 'Sun')!;
const moon = rows.find((row) => row.planet === 'Moon')!;
assert.equal(sun.digVirupa, 60, 'Sun in the 10th has full Dig Bala');
assert.equal(moon.digVirupa, 60, 'Moon in the 4th has full Dig Bala');

// ---------------------------------------------------------------------------
// Ayana Bala — true declination (v2.16)
// ---------------------------------------------------------------------------
const declinationChart = (planet: string, declination: number) => ({
  ascendant: { sign: 1 },
  debug: { inputDateTime: '2000-01-01 12:00:00' },
  planets: [{ name: planet, sign: 1, house: 1, degree: 0, longitude: 0, declination, speed: 1 }],
});
const ayanaOf = (planet: string, declination: number) =>
  buildShadbalaRows(declinationChart(planet, declination))[0].kalaBreakdown.ayana;

// North-strong planets peak at +24° and bottom out at −24°; the Sun is doubled.
for (const planet of ['Mars', 'Jupiter', 'Venus'] as const) {
  assert.ok(Math.abs(ayanaOf(planet, 24) - 60) < 1e-9, `${planet} Ayana peaks at +24 deg`);
  assert.ok(Math.abs(ayanaOf(planet, -24)) < 1e-9, `${planet} Ayana bottoms at -24 deg`);
  assert.ok(Math.abs(ayanaOf(planet, 0) - 30) < 1e-9, `${planet} Ayana is half on the equator`);
}
assert.ok(Math.abs(ayanaOf('Sun', 24) - 120) < 1e-9, 'the Sun Ayana Bala is doubled');
assert.ok(Math.abs(ayanaOf('Sun', 0) - 60) < 1e-9, 'the doubled Sun is 60 on the equator');

// South-strong planets are the mirror image.
for (const planet of ['Moon', 'Saturn'] as const) {
  assert.ok(Math.abs(ayanaOf(planet, -24) - 60) < 1e-9, `${planet} Ayana peaks at -24 deg`);
  assert.ok(Math.abs(ayanaOf(planet, 24)) < 1e-9, `${planet} Ayana bottoms at +24 deg`);
}

// Mercury is strong in either direction, so it is symmetric and never below 30.
assert.ok(Math.abs(ayanaOf('Mercury', 20) - ayanaOf('Mercury', -20)) < 1e-9, 'Mercury Ayana is symmetric');
assert.ok(ayanaOf('Mercury', 0) >= 30, 'Mercury Ayana never drops below half');

// Declinations beyond the traditional obliquity stay inside the scale.
assert.ok(ayanaOf('Moon', -28.5) <= 60, 'a lunar extreme declination stays clamped');
assert.ok(ayanaOf('Moon', 28.5) >= 0, 'the opposite extreme stays non-negative');

// ---------------------------------------------------------------------------
// Cheshta Bala — eightfold motion from real speed (v2.16)
// ---------------------------------------------------------------------------
const MEAN_MOTION: Record<string, number> = { Mars: 0.5240, Mercury: 0.9856, Jupiter: 0.0831, Venus: 0.9856, Saturn: 0.0335 };

for (const planet of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) {
  const mean = MEAN_MOTION[planet];
  assert.equal(classifyMotion(planet, -mean), 'vakra', `${planet} retrograde is vakra`);
  assert.equal(classifyMotion(planet, mean * 0.001), 'vikala', `${planet} stationary is vikala`);
  assert.equal(classifyMotion(planet, mean * 0.1), 'mandatara', `${planet} far slow is mandatara`);
  assert.equal(classifyMotion(planet, mean * 0.5), 'manda', `${planet} slow is manda`);
  assert.equal(classifyMotion(planet, mean), 'sama', `${planet} at mean is sama`);
  assert.equal(classifyMotion(planet, mean * 1.3), 'chara', `${planet} fast is chara`);
  assert.equal(classifyMotion(planet, mean * 3), 'atichara', `${planet} far fast is atichara`);
}

// Retrograde must outscore every direct state — the classical point of Vakra.
const cheshtaOf = (planet: string, speed: number) => {
  const built = buildShadbalaRows({
    ascendant: { sign: 1 },
    debug: { inputDateTime: '2000-01-01 12:00:00' },
    planets: [{ name: planet, sign: 1, house: 1, degree: 0, longitude: 0, speed, declination: 0 }],
  });
  return built[0].cheshtaVirupa;
};
assert.equal(cheshtaOf('Saturn', -0.02), 60, 'retrograde Saturn scores the full 60');
assert.ok(cheshtaOf('Saturn', -0.02) > cheshtaOf('Saturn', 0.0335 * 3), 'vakra beats atichara');

// The luminaries borrow from Kala rather than from motion.
const sunRow = rows.find((row) => row.planet === 'Sun')!;
const moonRow = rows.find((row) => row.planet === 'Moon')!;
assert.ok(Math.abs(sunRow.cheshtaVirupa - sunRow.kalaBreakdown.ayana) < 1e-9, 'Sun Cheshta equals its Ayana Bala');
assert.ok(Math.abs(moonRow.cheshtaVirupa - moonRow.kalaBreakdown.paksha) < 1e-9, 'Moon Cheshta equals its Paksha Bala');

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

// ---------------------------------------------------------------------------
// Moolatrikona (v2.16)
// ---------------------------------------------------------------------------
// Leo 0–20° is the Sun's Moolatrikona; the rest of Leo is merely its own sign.
assert.equal(getDignity('Sun', 4, 10), 'moolatrikona', 'Leo 10 deg is the Sun Moolatrikona');
assert.equal(getDignity('Sun', 4, 25), 'own', 'Leo 25 deg is only own sign');
assert.equal(getDignity('Sun', 4), 'own', 'without a degree it falls back to own');
// Moon: exalted below Taurus 4°, Moolatrikona above it.
assert.equal(getDignity('Moon', 1, 2), 'exalted', 'Taurus 2 deg is lunar exaltation');
assert.equal(getDignity('Moon', 1, 10), 'moolatrikona', 'Taurus 10 deg is lunar Moolatrikona');
// Debilitation still wins over everything.
assert.equal(getDignity('Sun', 6, 5), 'debilitated', 'Libra keeps the Sun debilitated');
// Moolatrikona must actually raise Saptavargaja above a plain own sign.
const moolatrikonaScore = calculateSaptavargajaBalaVirupa('Sun', 4 * 30 + 10);
const ownScore = calculateSaptavargajaBalaVirupa('Sun', 4 * 30 + 25);
assert.ok(moolatrikonaScore > ownScore, 'Moolatrikona outscores a plain own sign');

console.log('Shadbala tests passed');
