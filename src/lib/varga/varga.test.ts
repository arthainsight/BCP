// Varga matrix tests
// Run: npx ts-node --project tsconfig.json src/lib/varga/varga.test.ts
//
// Expected output verified against classical Parashara rules.
// Cross-check D5 against JHora before trusting in production.

import { calculateVargaMatrix, calcD9, calcD40, calcD45, calcD60, SIGN_ABBR } from './index';

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
  D40: 'Ar', // even, start=Li(6), part=⌊23/0.75⌋=30 → (6+30)%12=0
  D45: 'Ge', // Fixed, start=Le(4), part=⌊23/(30/45)⌋=34 → (4+34)%12=2
  D60: 'Pi', // same sign start=Ta(1), part=⌊23/0.5⌋=46 → (1+46)%12=11
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
// D40, D45 and D60 — the high divisions.
//
// These had no coverage at all until now, even though all three carry weight in
// the Ṣoḍaśavarga scheme and therefore feed Viṁśopaka Bala.
// ---------------------------------------------------------------------------
const HIGH_DIVISIONS: Array<{
  key: string;
  calc: (longitude: number) => number;
  parts: number;
  // The sign each part sequence starts from, given a natal sign index.
  startSign: (signIndex: number) => number;
}> = [
  // Odd signs start from Aries, even signs from Libra.
  { key: 'D40', calc: calcD40, parts: 40, startSign: (s) => (s % 2 === 0 ? 0 : 6) },
  // Movable from Aries, fixed from Leo, dual from Sagittarius.
  { key: 'D45', calc: calcD45, parts: 45, startSign: (s) => (s % 3 === 0 ? 0 : s % 3 === 1 ? 4 : 8) },
  // Always from the natal sign itself.
  { key: 'D60', calc: calcD60, parts: 60, startSign: (s) => s },
];

function runHighDivisionTests(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- D40 / D45 / D60 ---');

  for (const { key, calc, parts, startSign } of HIGH_DIVISIONS) {
    const partSize = 30 / parts;
    let divisionOk = true;

    for (let signIndex = 0; signIndex < 12; signIndex += 1) {
      const expectedStart = startSign(signIndex);

      // The first part of every sign lands on that sign's start.
      if (calc(signIndex * 30) !== expectedStart) {
        console.log(`✗ ${key}: sign ${signIndex} part 0 should start at ${SIGN_ABBR[expectedStart]}, got ${SIGN_ABBR[calc(signIndex * 30)]}`);
        divisionOk = false;
      }

      for (let part = 0; part < parts; part += 1) {
        // Sample the middle of each part so no boundary rounding is involved.
        const longitude = signIndex * 30 + (part + 0.5) * partSize;
        const actual = calc(longitude);
        const expected = (expectedStart + part) % 12;
        if (actual !== expected) {
          console.log(`✗ ${key}: sign ${signIndex} part ${part} expected ${SIGN_ABBR[expected]}, got ${SIGN_ABBR[actual]}`);
          divisionOk = false;
        }
        if (!Number.isInteger(actual) || actual < 0 || actual > 11) {
          console.log(`✗ ${key}: sign ${signIndex} part ${part} produced an out-of-range index ${actual}`);
          divisionOk = false;
        }
      }

      // The very top of the sign must stay inside the last part, not spill over.
      const lastPart = calc(signIndex * 30 + 30 - 1e-9);
      if (lastPart !== (expectedStart + parts - 1) % 12) {
        console.log(`✗ ${key}: sign ${signIndex} top of sign should be part ${parts - 1}, got ${SIGN_ABBR[lastPart]}`);
        divisionOk = false;
      }
    }

    console.log(`${divisionOk ? '✓' : '✗'} ${key}: all 12 signs × ${parts} parts follow the documented rule`);
    divisionOk ? pass++ : fail++;
  }

  // D60 walks all twelve signs five times over one sign, so every sign appears.
  const d60Signs = new Set(Array.from({ length: 60 }, (_, part) => calcD60((part + 0.5) * 0.5)));
  const d60Ok = d60Signs.size === 12;
  console.log(`${d60Ok ? '✓' : '✗'} D60 covers all twelve signs within one rāśi, got ${d60Signs.size}`);
  d60Ok ? pass++ : fail++;

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function main() {
  const d9 = runD9Tests();
  const mat = runMatrixTests();
  const high = runHighDivisionTests();
  const total = d9.pass + mat.pass + high.pass;
  const failed = d9.fail + mat.fail + high.fail;
  console.log(`\n${total} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
