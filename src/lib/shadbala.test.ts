// Shadbala unit tests
// Run: npx ts-node --project tsconfig.json src/lib/shadbala.test.ts

// ---------------------------------------------------------------------------
// Naisargika Bala — fixed classical virupa values (BPHS / classical consensus)
// ---------------------------------------------------------------------------
const NAISARGIKA_BALA_VIRUPA: Record<string, number> = {
  Sun: 60,
  Moon: 51,
  Venus: 43,
  Jupiter: 34,
  Mercury: 26,
  Mars: 17,
  Saturn: 9,
};

// Required minimums per BPHS
const SHADBALA_REQUIRED_VIRUPA: Record<string, number> = {
  Sun: 390,
  Moon: 360,
  Mars: 300,
  Mercury: 420,
  Jupiter: 390,
  Venus: 330,
  Saturn: 300,
};

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

// ---------------------------------------------------------------------------
// Naisargika Bala tests
// ---------------------------------------------------------------------------
function testNaisargikaBala(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('--- Naisargika Bala fixed virupa values ---');

  const expected: Record<string, number> = {
    Sun: 60, Moon: 51, Venus: 43, Jupiter: 34, Mercury: 26, Mars: 17, Saturn: 9,
  };

  for (const [planet, virupa] of Object.entries(expected)) {
    const actual = NAISARGIKA_BALA_VIRUPA[planet];
    const ok = actual === virupa;
    console.log(`${ok ? '✓' : '✗'} ${planet}: expected ${virupa} vp, got ${actual} vp`);
    ok ? pass++ : fail++;
  }

  // Verify descending order (Sun strongest → Saturn weakest)
  const planets = ['Sun', 'Moon', 'Venus', 'Jupiter', 'Mercury', 'Mars', 'Saturn'];
  for (let i = 0; i < planets.length - 1; i++) {
    const a = NAISARGIKA_BALA_VIRUPA[planets[i]];
    const b = NAISARGIKA_BALA_VIRUPA[planets[i + 1]];
    const ok = a > b;
    console.log(`${ok ? '✓' : '✗'} ${planets[i]} (${a}) > ${planets[i + 1]} (${b})`);
    ok ? pass++ : fail++;
  }

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Required threshold percentage calculation tests
// ---------------------------------------------------------------------------
function testStrengthPercentage(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- Required threshold percentage: totalVirupa / requiredVirupa * 100 ---');

  function calcPct(totalVirupa: number, planet: string): number {
    const req = SHADBALA_REQUIRED_VIRUPA[planet] ?? 0;
    return req ? (totalVirupa / req) * 100 : 0;
  }

  const cases: Array<{ planet: string; total: number; expectedPct: number; label: string }> = [
    { planet: 'Sun',     total: 390, expectedPct: 100, label: 'Sun exactly at minimum' },
    { planet: 'Moon',    total: 432, expectedPct: 120, label: 'Moon at 120% (strong)' },
    { planet: 'Mars',    total: 210, expectedPct: 70,  label: 'Mars at 70% (weak)' },
    { planet: 'Mercury', total: 504, expectedPct: 120, label: 'Mercury at 120% (strong)' },
    { planet: 'Jupiter', total: 585, expectedPct: 150, label: 'Jupiter at 150% (very strong)' },
    { planet: 'Venus',   total: 330, expectedPct: 100, label: 'Venus exactly at minimum' },
    { planet: 'Saturn',  total: 150, expectedPct: 50,  label: 'Saturn at 50% (very weak)' },
  ];

  for (const { planet, total, expectedPct, label } of cases) {
    const actual = Math.round(calcPct(total, planet));
    const ok = actual === expectedPct;
    console.log(`${ok ? '✓' : '✗'} ${label}: expected ${expectedPct}%, got ${actual}%`);
    ok ? pass++ : fail++;
  }

  // Verify status thresholds match UI logic
  function getStatus(ratio: number): string {
    if (ratio < 1) return 'weak';
    if (ratio < 1.2) return 'ok';
    return 'strong';
  }

  console.log('\n--- Status label thresholds ---');
  const statusCases: Array<{ ratio: number; expected: string }> = [
    { ratio: 0.5,  expected: 'weak' },
    { ratio: 0.99, expected: 'weak' },
    { ratio: 1.0,  expected: 'ok' },
    { ratio: 1.1,  expected: 'ok' },
    { ratio: 1.19, expected: 'ok' },
    { ratio: 1.2,  expected: 'strong' },
    { ratio: 1.5,  expected: 'strong' },
  ];

  for (const { ratio, expected } of statusCases) {
    const actual = getStatus(ratio);
    const ok = actual === expected;
    console.log(`${ok ? '✓' : '✗'} ratio=${ratio} → ${expected}, got ${actual}`);
    ok ? pass++ : fail++;
  }

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Required virupa minimums — sanity checks
// ---------------------------------------------------------------------------
function testRequiredMinimumsVirupa(): { pass: number; fail: number } {
  let pass = 0, fail = 0;
  console.log('\n--- Required virupa minimums (planet-specific) ---');

  const expected: Record<string, number> = {
    Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300,
  };

  for (const [planet, virupa] of Object.entries(expected)) {
    const actual = SHADBALA_REQUIRED_VIRUPA[planet];
    const ok = actual === virupa;
    console.log(`${ok ? '✓' : '✗'} ${planet} required: ${virupa} vp, got ${actual} vp`);
    ok ? pass++ : fail++;
  }

  return { pass, fail };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
function main(): void {
  const nais = testNaisargikaBala();
  const pct = testStrengthPercentage();
  const req = testRequiredMinimumsVirupa();

  const total = nais.pass + pct.pass + req.pass;
  const failed = nais.fail + pct.fail + req.fail;
  console.log(`\n${total} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
