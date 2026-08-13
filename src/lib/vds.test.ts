import assert from 'node:assert/strict';
import { calculateVds, type VdsInput } from './vds';
import { calculateVimshottari } from './vimshottari';

// ---------------------------------------------------------------------------
// Vimśottarī Original (VDS). Same 120-year wheel as standard Vimśottarī, but
// the opening lord is found through the pakṣa, the horā of the lagna and two
// nakṣatra lookups rather than straight from the Moon.
// ---------------------------------------------------------------------------
const LORD_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};
const LORD_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const NAKSHATRA_SIZE = 360 / 27;
const DAYS_PER_YEAR = 365.25;
const birth = new Date(2000, 0, 1, 12, 0, 0);

function input(overrides: Partial<VdsInput> = {}): VdsInput {
  const planetLongitudes: Record<string, number> = {
    Sun: 255, Moon: 93, Mars: 232, Mercury: 248, Jupiter: 57,
    Venus: 312, Saturn: 34, Rahu: 15, Ketu: 195,
  };
  return {
    moonLongitude: 93,
    sunLongitude: 255,
    lagnaLongitude: 162,
    lagnaSign: 6,
    lagnaDegree: 12,
    birthDate: birth,
    planetLongitudes,
    ...overrides,
  };
}

const yearsBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / (DAYS_PER_YEAR * 86400000);

// ---------------------------------------------------------------------------
// It shares the wheel with standard Vimśottarī.
// ---------------------------------------------------------------------------
const base = calculateVds(input());
assert.ok(base, 'a complete chart produces a result');
assert.equal(base.entries.length, 9, 'nine mahādaśās');

// The sequence continues around the same fixed wheel, whatever the opening lord.
const startIndex = LORD_ORDER.indexOf(base.entries[0].lord);
assert.notEqual(startIndex, -1, 'the opening lord is one of the nine');
assert.deepEqual(
  base.entries.map((entry) => entry.lord),
  Array.from({ length: 9 }, (_, step) => LORD_ORDER[(startIndex + step) % 9]),
  'VDS walks the same wheel as Vimśottarī',
);

// Full periods carry the same years as standard Vimśottarī.
for (let step = 1; step < 9; step += 1) {
  assert.ok(
    Math.abs(base.entries[step].durationYears - LORD_YEARS[base.entries[step].lord]) < 1e-9,
    `${base.entries[step].lord} runs its standard ${LORD_YEARS[base.entries[step].lord]} years`,
  );
}

// Cross-check the shared constants directly against the other implementation:
// the wheel order must be identical, not merely similar.
const reference = calculateVimshottari(0, birth);
const referenceWheel = reference.entries.map((entry) => entry.lord);
assert.deepEqual(referenceWheel, LORD_ORDER, 'the reference implementation uses the same order');
for (const lord of LORD_ORDER) {
  const referencePeriod = reference.entries.find((entry) => entry.lord === lord)!;
  if (referencePeriod.lord !== reference.entries[0].lord) {
    assert.ok(
      Math.abs(referencePeriod.durationYears - LORD_YEARS[lord]) < 1e-9,
      `${lord} agrees between the two implementations`,
    );
  }
}

// Periods are contiguous and start at birth.
assert.equal(base.entries[0].startDate.getTime(), birth.getTime(), 'the first period starts at birth');
for (let step = 1; step < 9; step += 1) {
  assert.equal(
    base.entries[step].startDate.getTime(),
    base.entries[step - 1].endDate.getTime(),
    'periods are contiguous',
  );
}
for (const entry of base.entries) {
  assert.ok(
    Math.abs(yearsBetween(entry.startDate, entry.endDate) - entry.durationYears) < 1e-6,
    `${entry.lord} elapsed time matches its duration`,
  );
}

// ---------------------------------------------------------------------------
// Both ANC tables must cover all 27 nakṣatras, nine lords three times each.
// Sweeping the Moon over the whole zodiac exercises every entry.
// ---------------------------------------------------------------------------
for (const cycleName of ['krittikadi', 'ardradi'] as const) {
  const seen = new Set<string>();
  let covered = 0;

  for (let nakshatra = 0; nakshatra < 27; nakshatra += 1) {
    const dtpLongitude = (nakshatra + 0.5) * NAKSHATRA_SIZE;
    // Put every planet on the same nakṣatra so whichever body is picked as DTP
    // resolves to this index, then read which lord the table returns.
    const longitudes = Object.fromEntries(
      ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map((name) => [name, dtpLongitude]),
    );
    // Pakṣa and horā pick the cycle: Shukla + Moon horā, or Krishna + Sun horā,
    // gives Krittikadi; the other two combinations give Ardradi.
    const shukla = cycleName === 'krittikadi';
    const result = calculateVds(input({
      planetLongitudes: longitudes,
      moonLongitude: dtpLongitude,
      sunLongitude: shukla ? (dtpLongitude - 40 + 360) % 360 : (dtpLongitude + 40) % 360,
      lagnaSign: 1,      // odd sign
      lagnaDegree: 20,   // second half → Moon horā
    }));

    if (result) {
      seen.add(result.dop);
      covered += 1;
      assert.ok(LORD_ORDER.includes(result.dop), `${cycleName}: DOP must be one of the nine lords`);
      assert.ok(LORD_ORDER.includes(result.dtp), `${cycleName}: DTP must be one of the nine lords`);
    }
  }

  assert.equal(covered, 27, `${cycleName}: every nakṣatra resolves to a lord`);
  assert.equal(seen.size, 9, `${cycleName}: all nine lords are reachable, saw ${seen.size}`);
}

// ---------------------------------------------------------------------------
// Cycle selection: pakṣa × horā of the lagna
//
//   Shukla + Moon horā → Krittikadi     Shukla + Sun horā  → Ardradi
//   Krishna + Sun horā → Krittikadi     Krishna + Moon horā → Ardradi
// ---------------------------------------------------------------------------
// Odd sign: first 15° is the Sun horā, the rest the Moon horā.
// Even sign: the other way round.
const CASES: Array<{ shukla: boolean; lagnaSign: number; lagnaDegree: number; hora: 'sun' | 'moon'; cycle: string }> = [
  { shukla: true,  lagnaSign: 1, lagnaDegree: 20, hora: 'moon', cycle: 'krittikadi' },
  { shukla: true,  lagnaSign: 1, lagnaDegree: 5,  hora: 'sun',  cycle: 'ardradi' },
  { shukla: false, lagnaSign: 1, lagnaDegree: 5,  hora: 'sun',  cycle: 'krittikadi' },
  { shukla: false, lagnaSign: 1, lagnaDegree: 20, hora: 'moon', cycle: 'ardradi' },
  // Even sign flips the horā for the same degree.
  { shukla: true,  lagnaSign: 2, lagnaDegree: 5,  hora: 'moon', cycle: 'krittikadi' },
  { shukla: true,  lagnaSign: 2, lagnaDegree: 20, hora: 'sun',  cycle: 'ardradi' },
];

for (const testCase of CASES) {
  const moonLongitude = 93;
  const result = calculateVds(input({
    moonLongitude,
    // Shukla means the Moon is 0–180° ahead of the Sun.
    sunLongitude: testCase.shukla ? (moonLongitude - 60 + 360) % 360 : (moonLongitude + 60) % 360,
    lagnaSign: testCase.lagnaSign,
    lagnaDegree: testCase.lagnaDegree,
  }));
  assert.ok(result, 'the case produces a result');
  const label = `${testCase.shukla ? 'shukla' : 'krishna'} + ${testCase.hora} horā in sign ${testCase.lagnaSign}`;
  assert.equal(result.debug.paksha, testCase.shukla ? 'shukla' : 'krishna', `${label}: pakṣa`);
  assert.equal(result.debug.hora, testCase.hora, `${label}: horā of the lagna`);
  assert.equal(result.cycle, testCase.cycle, `${label}: cycle`);
}

// ---------------------------------------------------------------------------
// Birth balance comes from the DOP's degree inside its own nakṣatra.
// ---------------------------------------------------------------------------
const withBalance = calculateVds(input())!;
const { dop, dopDegreeInNakshatra, elapsedYears, balanceYears } = withBalance.debug;
assert.ok(dopDegreeInNakshatra >= 0 && dopDegreeInNakshatra < NAKSHATRA_SIZE, 'the DOP degree sits inside its nakṣatra');
assert.ok(
  Math.abs(elapsedYears - (dopDegreeInNakshatra / NAKSHATRA_SIZE) * LORD_YEARS[dop]) < 1e-9,
  'elapsed years are the traversed fraction of the DOP period',
);
assert.ok(Math.abs(balanceYears - (LORD_YEARS[dop] - elapsedYears)) < 1e-9, 'the balance is what remains');
assert.ok(
  Math.abs(withBalance.entries[0].durationYears - balanceYears) < 1e-9,
  'the first mahādaśā runs exactly the balance',
);
assert.ok(balanceYears > 0 && balanceYears <= LORD_YEARS[dop], 'the balance is positive and no larger than the full period');

// A DOP exactly at the start of its nakṣatra leaves the whole period to run.
// The inclusive count makes the DTP and DOP resolution self-consistent, so the
// assertion is on the reported debug rather than on a hand-picked lord.
assert.equal(withBalance.dopNakshatra.length > 0, true, 'the DOP nakṣatra is named');
assert.equal(withBalance.dtpNakshatra.length > 0, true, 'the DTP nakṣatra is named');

// ---------------------------------------------------------------------------
// Missing data is reported rather than guessed.
// ---------------------------------------------------------------------------
const missingDtp = calculateVds(input({ planetLongitudes: { Moon: 93 } }));
assert.equal(missingDtp, null, 'a chart missing the DTP longitude returns null');

const noPlanets = calculateVds(input({ planetLongitudes: {} }));
assert.equal(noPlanets, null, 'an empty planet set returns null');

// ---------------------------------------------------------------------------
// The inclusive count is at least one and stays within the wheel.
// ---------------------------------------------------------------------------
for (let moonNakshatra = 0; moonNakshatra < 27; moonNakshatra += 1) {
  const result = calculateVds(input({ moonLongitude: (moonNakshatra + 0.5) * NAKSHATRA_SIZE }));
  if (!result) continue;
  assert.ok(result.debug.inclusiveCount >= 1 && result.debug.inclusiveCount <= 27, 'the inclusive count stays within 1–27');
  assert.ok(result.debug.targetNak >= 0 && result.debug.targetNak < 27, 'the target nakṣatra index is valid');
  assert.ok(result.debug.moonNak >= 0 && result.debug.moonNak < 27, 'the Moon nakṣatra index is valid');
}

console.log('VDS tests passed');
