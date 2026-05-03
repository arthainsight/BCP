// Bhava Bala verification fixture
// Run: npx ts-node --project tsconfig.json src/lib/bhavaBala.test.ts
//
// Uses a fixed Aries ascendant chart so every component can be manually reproduced.
// Two houses (H1 and H4) are fully worked through step-by-step in comments below.

import { buildClassicalBhavaBala } from './bhavaBala';

// ---------------------------------------------------------------------------
// Fixed chart: Aries ascendant, planets placed at sign midpoints
// ---------------------------------------------------------------------------
//
// Ascendant: sign=1 (Aries, 1-indexed)
//
// Planet longitudes (sidereal, placed at sign midpoints for clarity):
//   Sun     135° — Leo      (sign 5,  H5)
//   Moon     45° — Taurus   (sign 2,  H2)
//   Mars    225° — Scorpio  (sign 8,  H8)
//   Mercury 165° — Virgo    (sign 6,  H6)
//   Jupiter 105° — Cancer   (sign 4,  H4) ← occupies H4
//   Venus   195° — Libra    (sign 7,  H7) ← occupies H7
//   Saturn  285° — Capricorn(sign 10, H10) ← occupies H10
//
// House lords (whole sign from Aries ascendant):
//   H1=Ar(Mars)  H2=Ta(Venus)  H3=Ge(Mercury)  H4=Cn(Moon)   H5=Le(Sun)
//   H6=Vi(Mercury) H7=Li(Venus) H8=Sc(Mars)    H9=Sg(Jupiter)
//   H10=Cp(Saturn) H11=Aq(Saturn) H12=Pi(Jupiter)

const FIXTURE_CHART = {
  ascendant: { sign: 1 },
  planets: [
    { name: 'Sun',     longitude: 135, sign: 5  },
    { name: 'Moon',    longitude: 45,  sign: 2  },
    { name: 'Mars',    longitude: 225, sign: 8  },
    { name: 'Mercury', longitude: 165, sign: 6  },
    { name: 'Jupiter', longitude: 105, sign: 4  },
    { name: 'Venus',   longitude: 195, sign: 7  },
    { name: 'Saturn',  longitude: 285, sign: 10 },
  ],
};

// Pre-set Ṣaḍbala virupa — round numbers for easy manual arithmetic.
// Not real chart values; chosen to make the verification self-contained.
const FIXTURE_SHADBALA = [
  { planet: 'Sun',     totalVirupa: 450, requiredVirupa: 390 }, // ratio ≈ 1.154
  { planet: 'Moon',    totalVirupa: 420, requiredVirupa: 360 }, // ratio ≈ 1.167
  { planet: 'Mars',    totalVirupa: 350, requiredVirupa: 300 }, // ratio ≈ 1.167
  { planet: 'Mercury', totalVirupa: 480, requiredVirupa: 420 }, // ratio ≈ 1.143
  { planet: 'Jupiter', totalVirupa: 520, requiredVirupa: 390 }, // ratio ≈ 1.333
  { planet: 'Venus',   totalVirupa: 380, requiredVirupa: 330 }, // ratio ≈ 1.152
  { planet: 'Saturn',  totalVirupa: 310, requiredVirupa: 300 }, // ratio ≈ 1.033
];

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function approxEqual(a: number, b: number, epsilon = 0.6): boolean {
  return Math.abs(a - b) <= epsilon;
}

// ---------------------------------------------------------------------------
// House 1 — Aries (lord: Mars, no occupants)
//
// Sign midpoint = signIndex(0) × 30 + 15 = 15°
//
// Drig Bala — diff = normalizeDegrees(15 − planet.longitude):
//
//   Sun   (135°): diff = (15−135+360)%360 = 240°
//                 std |240−180|=60 > 45 → 0; no special → no aspect
//
//   Moon   (45°): diff = (15−45+360)%360 = 330°
//                 std |330−180|=150 > 45 → 0 → no aspect
//
//   Mars  (225°): diff = (15−225+360)%360 = 150°
//                 std |150−180|=30 ≤ 45 → 1−30/45 = 0.333
//                 special 90°: |150−90|=60 > 35 → 0
//                 special 210°: |150−210|=60 > 35 → 0
//                 → strength 0.333 (malefic, < 0.66) → drig4 += −60×0.333 = −20.0
//
//   Mercury(165°): diff = (15−165+360)%360 = 210°
//                 std |210−180|=30 ≤ 45 → 1−30/45 = 0.333
//                 → strength 0.333 (benefic, < 0.66) → drig2 += +100×0.333 = +33.33
//
//   Jupiter(105°): diff = (15−105+360)%360 = 270°
//                 std |270−180|=90 > 45 → 0
//                 special 120°: |270−120|=150 > 35 → 0
//                 special 240°: |270−240|=30 ≤ 35 → 1−30/35 = 0.143
//                 → strength 0.143 (benefic, < 0.66) → drig2 += +100×0.143 = +14.29
//
//   Venus  (195°): diff = (15−195+360)%360 = 180°
//                 std |180−180|=0 ≤ 45 → 1.0
//                 → strength 1.0 (benefic, ≥ 0.66) → drig1 += +180×1.0 = +180.0
//
//   Saturn (285°): diff = (15−285+360)%360 = 90°
//                 std |90−180|=90 > 45 → 0
//                 special 60°: |90−60|=30 ≤ 35 → 1−30/35 = 0.143
//                 special 270°: |90−270|=180 > 35 → 0
//                 → strength 0.143 (malefic, < 0.66) → drig4 += −60×0.143 = −8.57
//
//   drig1 = 180.0, drig2 = 33.33+14.29 = 47.62, drig3 = 0, drig4 = −20.0+(−8.57) = −28.57
//
// Bhavadhipati: Mars Ṣaḍbala = 350 vp / 300 req = 1.167×  → bhavesha = 350
//
// Occupants: none
//
// ~Dig Bala: H1 is kendra (angular) → +15 vp
//
// Total = 180.0 + 47.62 + 0 + (−28.57) + 350 + 0 + 15 = 564.05
// ---------------------------------------------------------------------------
function testHouse1(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('--- House 1 (Aries, lord: Mars, no occupants) ---');

  const rows = buildClassicalBhavaBala(FIXTURE_CHART, FIXTURE_SHADBALA);
  const h1 = rows[0];

  let ok = h1.sign === 'Ar' && h1.lord === 'Mars';
  console.log(`${ok ? '✓' : '✗'} H1: sign=Ar lord=Mars, got sign=${h1.sign} lord=${h1.lord}`);
  ok ? pass++ : fail++;

  ok = h1.bhavesha === 350;
  console.log(`${ok ? '✓' : '✗'} H1 bhavesha: expected 350 vp (Mars), got ${h1.bhavesha}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h1.drig1, 180.0);
  console.log(`${ok ? '✓' : '✗'} H1 drig1 (Venus full 7th): expected 180.0, got ${h1.drig1.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h1.drig2, 47.62);
  console.log(`${ok ? '✓' : '✗'} H1 drig2 (Mercury+Jupiter weak): expected ~47.62, got ${h1.drig2.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h1.drig3, 0, 0.01);
  console.log(`${ok ? '✓' : '✗'} H1 drig3 (no strong malefic): expected 0, got ${h1.drig3.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h1.drig4, -28.57);
  console.log(`${ok ? '✓' : '✗'} H1 drig4 (Mars+Saturn weak): expected ~−28.57, got ${h1.drig4.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = h1.occupants.length === 0 && h1.occupantTotal === 0;
  console.log(`${ok ? '✓' : '✗'} H1 occupants: expected none, got ${h1.occupants.length}`);
  ok ? pass++ : fail++;

  ok = h1.kendra === 15;
  console.log(`${ok ? '✓' : '✗'} H1 ~Dig: expected +15 vp (kendra), got ${h1.kendra}`);
  ok ? pass++ : fail++;

  // 180.0 + 47.62 + 0 + (−28.57) + 350 + 0 + 15 = 564.05
  ok = approxEqual(h1.total, 564.05, 1.5);
  console.log(`${ok ? '✓' : '✗'} H1 total: expected ~564.05, got ${h1.total.toFixed(2)}`);
  ok ? pass++ : fail++;

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// House 4 — Cancer (lord: Moon, Jupiter occupies)
//
// Sign midpoint = signIndex(3) × 30 + 15 = 105°
//
// Drig Bala — diff = normalizeDegrees(105 − planet.longitude):
//
//   Sun   (135°): diff=(105−135+360)%360=330°; std |330−180|=150>45→0 → no aspect
//   Moon   (45°): diff=(105−45+360)%360=60°; std |60−180|=120>45→0 → no aspect
//
//   Mars  (225°): diff=(105−225+360)%360=240°
//                 std |240−180|=60>45→0
//                 special 90°: |240−90|=150>35→0
//                 special 210°: |240−210|=30≤35→1−30/35=0.143
//                 → strength 0.143 (malefic, <0.66) → drig4 += −60×0.143 = −8.57
//
//   Mercury(165°): diff=(105−165+360)%360=300°; std |300−180|=120>45→0; no special → no aspect
//
//   Jupiter(105°): diff=(105−105+360)%360=0°
//                 std |0−180|=180>45→0; special 120°:|0−120|=120>35→0; special 240°:|0−240|=240>35→0
//                 → no aspect (Jupiter is the occupant; 0° diff yields no drishti)
//
//   Venus  (195°): diff=(105−195+360)%360=270°; std |270−180|=90>45→0; no special → no aspect
//
//   Saturn (285°): diff=(105−285+360)%360=180°
//                 std |180−180|=0≤45→1.0
//                 special 60°:|180−60|=120>35→0; special 270°:|180−270|=90>35→0
//                 → strength 1.0 (malefic, ≥0.66) → drig3 += −90×1.0 = −90.0
//
//   drig1=0, drig2=0, drig3=−90.0, drig4=−8.57
//
// Bhavadhipati: Moon Ṣaḍbala = 420 vp / 360 req = 1.167× → bhavesha = 420
//
// Occupants: Jupiter (sign=4, benefic)
//   Ṣaḍbala ratio = 520/390 = 1.333
//   contribution = +45 × min(1.333, 2.0) = 45 × 1.333 = +60.0 vp
//
// ~Dig Bala: H4 is kendra (angular) → +15 vp
//
// Total = 0 + 0 + (−90.0) + (−8.57) + 420 + 60.0 + 15 = 396.43
// ---------------------------------------------------------------------------
function testHouse4(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- House 4 (Cancer, lord: Moon, Jupiter occupies) ---');

  const rows = buildClassicalBhavaBala(FIXTURE_CHART, FIXTURE_SHADBALA);
  const h4 = rows[3];

  let ok = h4.sign === 'Cn' && h4.lord === 'Moon';
  console.log(`${ok ? '✓' : '✗'} H4: sign=Cn lord=Moon, got sign=${h4.sign} lord=${h4.lord}`);
  ok ? pass++ : fail++;

  ok = h4.bhavesha === 420;
  console.log(`${ok ? '✓' : '✗'} H4 bhavesha: expected 420 vp (Moon), got ${h4.bhavesha}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h4.drig3, -90.0);
  console.log(`${ok ? '✓' : '✗'} H4 drig3 (Saturn full 7th): expected −90.0, got ${h4.drig3.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h4.drig4, -8.57);
  console.log(`${ok ? '✓' : '✗'} H4 drig4 (Mars special 4th): expected ~−8.57, got ${h4.drig4.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = approxEqual(h4.drig1 + h4.drig2, 0, 0.01);
  console.log(`${ok ? '✓' : '✗'} H4 drig+ (no benefic aspects): expected 0, got ${(h4.drig1 + h4.drig2).toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = h4.occupants.length === 1 && h4.occupants[0].name === 'Jupiter';
  console.log(`${ok ? '✓' : '✗'} H4 occupant: expected Jupiter, got ${h4.occupants.map((o) => o.name).join(',') || 'none'}`);
  ok ? pass++ : fail++;

  // +45 × min(520/390, 2.0) = 45 × 1.333 = 60.0
  ok = approxEqual(h4.occupantTotal, 60.0, 1.0);
  console.log(`${ok ? '✓' : '✗'} H4 occupantTotal: expected ~60.0 (+45×1.333), got ${h4.occupantTotal.toFixed(2)}`);
  ok ? pass++ : fail++;

  ok = h4.kendra === 15;
  console.log(`${ok ? '✓' : '✗'} H4 ~Dig: expected +15 vp (kendra), got ${h4.kendra}`);
  ok ? pass++ : fail++;

  // 0 + 0 + (−90.0) + (−8.57) + 420 + 60.0 + 15 = 396.43
  ok = approxEqual(h4.total, 396.43, 1.5);
  console.log(`${ok ? '✓' : '✗'} H4 total: expected ~396.43 (0+0−90−8.57+420+60+15), got ${h4.total.toFixed(2)}`);
  ok ? pass++ : fail++;

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// House 12 — Pisces (lord: Jupiter, no occupants, cadent)
// ---------------------------------------------------------------------------
function testHouse12(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- House 12 (Pisces, lord: Jupiter, cadent) ---');

  const rows = buildClassicalBhavaBala(FIXTURE_CHART, FIXTURE_SHADBALA);
  const h12 = rows[11];

  let ok = h12.sign === 'Pi' && h12.lord === 'Jupiter';
  console.log(`${ok ? '✓' : '✗'} H12: sign=Pi lord=Jupiter, got sign=${h12.sign} lord=${h12.lord}`);
  ok ? pass++ : fail++;

  ok = h12.bhavesha === 520;
  console.log(`${ok ? '✓' : '✗'} H12 bhavesha: expected 520 vp (Jupiter), got ${h12.bhavesha}`);
  ok ? pass++ : fail++;

  // H12 is apoklima (cadent) → kendra/Dig = 0
  ok = h12.kendra === 0;
  console.log(`${ok ? '✓' : '✗'} H12 ~Dig: expected 0 (apoklima/cadent), got ${h12.kendra}`);
  ok ? pass++ : fail++;

  // Jupiter is in H4, not H12
  ok = h12.occupants.length === 0;
  console.log(`${ok ? '✓' : '✗'} H12 occupants: expected none (Jupiter is in H4), got ${h12.occupants.length}`);
  ok ? pass++ : fail++;

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// All 12 house signs and lords (Aries ascendant, whole-sign)
// ---------------------------------------------------------------------------
function testAllHouseSigns(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- All 12 house signs and lords (Aries ascendant) ---');

  const EXPECTED = [
    { sign: 'Ar', lord: 'Mars'    },
    { sign: 'Ta', lord: 'Venus'   },
    { sign: 'Ge', lord: 'Mercury' },
    { sign: 'Cn', lord: 'Moon'    },
    { sign: 'Le', lord: 'Sun'     },
    { sign: 'Vi', lord: 'Mercury' },
    { sign: 'Li', lord: 'Venus'   },
    { sign: 'Sc', lord: 'Mars'    },
    { sign: 'Sg', lord: 'Jupiter' },
    { sign: 'Cp', lord: 'Saturn'  },
    { sign: 'Aq', lord: 'Saturn'  },
    { sign: 'Pi', lord: 'Jupiter' },
  ];

  const rows = buildClassicalBhavaBala(FIXTURE_CHART, FIXTURE_SHADBALA);
  assert(rows.length === 12, `expected 12 rows, got ${rows.length}`);
  pass++;

  for (let i = 0; i < 12; i++) {
    const ok = rows[i].sign === EXPECTED[i].sign && rows[i].lord === EXPECTED[i].lord;
    console.log(`${ok ? '✓' : '✗'} H${i + 1}: expected ${EXPECTED[i].sign}/${EXPECTED[i].lord}, got ${rows[i].sign}/${rows[i].lord}`);
    ok ? pass++ : fail++;
  }

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Occupants across all houses — spot-check Saturn in H10, Venus in H7
// ---------------------------------------------------------------------------
function testOccupants(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- Occupant placement and contribution ---');

  const rows = buildClassicalBhavaBala(FIXTURE_CHART, FIXTURE_SHADBALA);

  // Saturn (malefic) in H10 (Capricorn)
  const h10 = rows[9];
  let ok = h10.occupants.length === 1 && h10.occupants[0].name === 'Saturn';
  console.log(`${ok ? '✓' : '✗'} H10 occupant: expected Saturn, got ${h10.occupants.map((o) => o.name).join(',') || 'none'}`);
  ok ? pass++ : fail++;

  // Saturn is malefic: contribution = −30 × min(310/300, 2) = −30 × 1.033 = −31.0
  ok = h10.occupants[0].nature === 'malefic' && h10.occupants[0].contribution < 0;
  console.log(`${ok ? '✓' : '✗'} H10 Saturn: malefic with negative contribution (${h10.occupants[0]?.contribution?.toFixed(1)})`);
  ok ? pass++ : fail++;

  // Venus (benefic) in H7
  const h7 = rows[6];
  ok = h7.occupants.length === 1 && h7.occupants[0].name === 'Venus';
  console.log(`${ok ? '✓' : '✗'} H7 occupant: expected Venus, got ${h7.occupants.map((o) => o.name).join(',') || 'none'}`);
  ok ? pass++ : fail++;

  ok = h7.occupants[0].nature === 'benefic' && h7.occupants[0].contribution > 0;
  console.log(`${ok ? '✓' : '✗'} H7 Venus: benefic with positive contribution (${h7.occupants[0]?.contribution?.toFixed(1)})`);
  ok ? pass++ : fail++;

  // Empty houses should have no occupants
  const h1 = rows[0];
  ok = h1.occupants.length === 0;
  console.log(`${ok ? '✓' : '✗'} H1 (no occupants): expected 0, got ${h1.occupants.length}`);
  ok ? pass++ : fail++;

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Panapara houses get +7.5 Dig, apoklima get 0
// ---------------------------------------------------------------------------
function testDigBala(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- ~Dig Bala (kendra +15, panapara +7.5, apoklima 0) ---');

  const rows = buildClassicalBhavaBala(FIXTURE_CHART, FIXTURE_SHADBALA);

  const kendraHouses = [1, 4, 7, 10];
  const panaparaHouses = [2, 5, 8, 11];
  const apoklimaHouses = [3, 6, 9, 12];

  for (const h of kendraHouses) {
    const ok = rows[h - 1].kendra === 15;
    console.log(`${ok ? '✓' : '✗'} H${h} kendra: expected 15, got ${rows[h - 1].kendra}`);
    ok ? pass++ : fail++;
  }
  for (const h of panaparaHouses) {
    const ok = rows[h - 1].kendra === 7.5;
    console.log(`${ok ? '✓' : '✗'} H${h} panapara: expected 7.5, got ${rows[h - 1].kendra}`);
    ok ? pass++ : fail++;
  }
  for (const h of apoklimaHouses) {
    const ok = rows[h - 1].kendra === 0;
    console.log(`${ok ? '✓' : '✗'} H${h} apoklima: expected 0, got ${rows[h - 1].kendra}`);
    ok ? pass++ : fail++;
  }

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function main(): void {
  const h1 = testHouse1();
  const h4 = testHouse4();
  const h12 = testHouse12();
  const all = testAllHouseSigns();
  const occ = testOccupants();
  const dig = testDigBala();

  const total = h1.pass + h4.pass + h12.pass + all.pass + occ.pass + dig.pass;
  const failed = h1.fail + h4.fail + h12.fail + all.fail + occ.fail + dig.fail;
  console.log(`\n${total} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
