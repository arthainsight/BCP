// Varga matrix tests
// Run: npx ts-node --project tsconfig.json src/lib/varga/varga.test.ts
//
// Expected output verified against classical Parashara rules.
// Cross-check D5 against JHora before trusting in production.

import { calculateVargaMatrix, calcD9, SIGN_ABBR } from './index';

// ---------------------------------------------------------------------------
// D9 sanity checks (movable / fixed / dual sign coverage)
// ---------------------------------------------------------------------------
const D9_CASES: Array<{ lon: number; label: string; expected: string }> = [
  // Movable signs — start from same sign
  { lon: 0,          label: '0° Aries',    expected: 'Ar' }, // Ar start, part 0 → Aries
  { lon: 10 / 3,     label: '3°20′ Aries', expected: 'Ta' }, // part 1 → Taurus
  { lon: 29 + 59/60, label: '29°59′ Aries',expected: 'Sg' }, // part 8 → Sagittarius

  // Fixed signs — start from 9th sign (sign + 8)
  { lon: 30,         label: '0° Taurus',   expected: 'Cp' }, // (1+8)%12=9 Cp, part 0
  { lon: 53,         label: '23° Taurus',  expected: 'Cn' }, // part 6 → (9+6)%12=3 Cancer

  // Dual signs — start from 5th sign (sign + 4)
  { lon: 60,         label: '0° Gemini',   expected: 'Li' }, // (2+4)%12=6 Li, part 0
  { lon: 89 + 59/60, label: '29°59′ Gemini',expected: 'Ge'}, // part 8 → (6+8)%12=2 Gemini
];

function runD9Tests(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('--- D9 sanity checks ---');
  for (const { lon, label, expected } of D9_CASES) {
    const actual = SIGN_ABBR[calcD9(lon)];
    const ok = actual === expected;
    console.log(`${ok ? '✓' : '✗'} D9 ${label}: expected ${expected}, got ${actual}`);
    ok ? pass++ : fail++;
  }
  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Full varga matrix — 23° Taurus (longitude 53°)
// ---------------------------------------------------------------------------
const LON = 53;

const MATRIX_EXPECTED: Record<string, string> = {
  D1:  'Ta', // natal sign
  D2:  'Le', // even sign, 23°>15° → Sun hora
  D3:  'Cp', // part=2 → (1+2×4)%12=9
  D4:  'Aq', // part=3 → (1+3×3)%12=10
  D5:  'Cp', // UNCERTAIN — even sign, part 3 → D5_EVEN[3]=9
  D7:  'Ar', // even, start=(1+6)%12=7, part 5 → (7+5)%12=0
  D9:  'Cn', // Fixed, 9th from Taurus=(1+8)%12=9(Cp), part 6 → (9+6)%12=3
  D10: 'Le', // even, start=(1+8)%12=9(Cp), part 7 → (9+7)%12=4
  D12: 'Aq', // part=9 → (1+9)%12=10
  D16: 'Le', // Fixed, start=Le(4), part 12 → (4+12)%12=4
  D20: 'Pi', // Fixed, start=Sg(8), part 15 → (8+15)%12=11
  D24: 'Cp', // even, start=Cn(3), part 18 → (3+18)%12=9
  D27: 'Pi', // Earth, start=Cn(3), part 20 → (3+20)%12=11
  D30: 'Cp', // even, 23° in Saturn bracket (20–25°) → Capricorn
};

function runMatrixTests(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- Full varga matrix (23° Taurus) ---');
  const row = calculateVargaMatrix(LON);
  for (const [key, expected] of Object.entries(MATRIX_EXPECTED)) {
    const actual = SIGN_ABBR[(row as unknown as Record<string, number>)[key]];
    const ok = actual === expected;
    console.log(`${ok ? '✓' : '✗'} ${key}: expected ${expected}, got ${actual}`);
    ok ? pass++ : fail++;
  }
  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function main() {
  const d9 = runD9Tests();
  const mat = runMatrixTests();
  const total = d9.pass + mat.pass;
  const failed = d9.fail + mat.fail;
  console.log(`\n${total} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
