import assert from 'node:assert/strict';
// These come from the real engine in src/pages/VargaMatrix.jsx. An earlier
// version of this file declared its own local copies of the constants and its
// own reimplementations of the percentage/status helpers, so every assertion
// compared a literal against itself and the suite could not fail no matter what
// the application computed.
import {
  NAISARGIKA_BALA_VIRUPA as NAISARGIKA_RAW,
  SHADBALA_REQUIRED_VIRUPA as REQUIRED_RAW,
  DIG_BALA_MAX_HOUSE as DIG_HOUSE_RAW,
  buildShadbalaRows,
  calculateDigBalaVirupa,
  calculateUcchaBalaVirupa,
  calculateKendradiBalaVirupa,
  calculateOjhayugmaBalaVirupa,
  calculateDrekkanaBalaVirupa,
  calculateSaptavargajaBalaVirupa,
  virupaToRupa,
} from '@/pages/VargaMatrix';

// VargaMatrix.jsx is untyped JavaScript, so these arrive as fixed object
// literals. Widen them to keyed lookups for the loops below.
const NAISARGIKA_BALA_VIRUPA: Record<string, number> = NAISARGIKA_RAW;
const SHADBALA_REQUIRED_VIRUPA: Record<string, number> = REQUIRED_RAW;
const DIG_BALA_MAX_HOUSE: Record<string, number> = DIG_HOUSE_RAW;

const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

// ---------------------------------------------------------------------------
// Golden vectors — fixed classical virupa values (BPHS)
// ---------------------------------------------------------------------------
const CLASSICAL_NAISARGIKA: Record<string, number> = {
  Sun: 60, Moon: 51, Venus: 43, Jupiter: 34, Mercury: 26, Mars: 17, Saturn: 9,
};

const CLASSICAL_REQUIRED: Record<string, number> = {
  Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300,
};

// Dig Bala is full in the direction each planet owns: Sun and Mars in the 10th,
// Moon and Venus in the 4th, Jupiter and Mercury in the 1st, Saturn in the 7th.
const CLASSICAL_DIG_HOUSE: Record<string, number> = {
  Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7,
};

for (const [planet, virupa] of Object.entries(CLASSICAL_NAISARGIKA)) {
  assert.equal(NAISARGIKA_BALA_VIRUPA[planet], virupa, `Naisargika Bala for ${planet}`);
}
for (const [planet, virupa] of Object.entries(CLASSICAL_REQUIRED)) {
  assert.equal(SHADBALA_REQUIRED_VIRUPA[planet], virupa, `required Shadbala for ${planet}`);
}
for (const [planet, house] of Object.entries(CLASSICAL_DIG_HOUSE)) {
  assert.equal(DIG_BALA_MAX_HOUSE[planet], house, `Dig Bala best house for ${planet}`);
}

// Naisargika strictly descends Sun → Moon → Venus → Jupiter → Mercury → Mars → Saturn.
const NAISARGIKA_ORDER = ['Sun', 'Moon', 'Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'];
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
  debug: { inputDateTime: '2000-01-01 12:00:00', ayanamsa: 23.85 },
  planets: [
    { name: 'Sun', sign: 10, house: 10, degree: 15, longitude: 285 },
    { name: 'Moon', sign: 4, house: 4, degree: 3, longitude: 93 },
    { name: 'Mars', sign: 8, house: 8, degree: 22, longitude: 232 },
    { name: 'Mercury', sign: 9, house: 9, degree: 8, longitude: 248 },
    { name: 'Jupiter', sign: 2, house: 2, degree: 27, longitude: 57 },
    { name: 'Venus', sign: 11, house: 11, degree: 12, longitude: 312 },
    { name: 'Saturn', sign: 2, house: 2, degree: 4, longitude: 34 },
  ],
};

type ShadbalaRow = {
  planet: string;
  sthanaBreakdown: { uccha: number; saptavargaja: number; ojhayugma: number; kendradi: number; drekkana: number; total: number };
  kalaBreakdown: { natonnata: number; paksha: number; tribhaaga: number; varsheshadi: number; ayana: number; total: number };
  digVirupa: number;
  cheshtaVirupa: number;
  naisargikaVirupa: number;
  drikVirupa: number;
  totalVirupa: number;
  total: number;
  requiredVirupa: number;
  ratio: number;
};

const rows = buildShadbalaRows(chart) as ShadbalaRow[];
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

console.log('Shadbala tests passed');
