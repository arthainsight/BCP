import assert from 'node:assert/strict';
import {
  calculateVimshottari,
  calculateAntardashas,
  calculatePratyantardashas,
  type MahadashaEntry,
} from './vimshottari';

// ---------------------------------------------------------------------------
// Golden vectors — Vimśottarī is entirely rule-defined, so every check here is
// chart-independent and needs no external reference data.
// ---------------------------------------------------------------------------
const LORD_YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};
const LORD_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const CYCLE_YEARS = 120;
const NAKSHATRA_SIZE = 360 / 27;
const DAYS_PER_YEAR = 365.25;

assert.equal(
  Object.values(LORD_YEARS).reduce((sum, years) => sum + years, 0),
  CYCLE_YEARS,
  'the nine lord periods must sum to exactly 120 years',
);

const birth = new Date(2000, 0, 1, 12, 0, 0);
const yearsBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / (DAYS_PER_YEAR * 86400000);

// ---------------------------------------------------------------------------
// Nakshatra to lord mapping: 27 nakshatras, three cycles of the nine lords.
// ---------------------------------------------------------------------------
const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanistha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

for (let index = 0; index < 27; index += 1) {
  // Sample the middle of each nakshatra so no boundary rounding is involved.
  const longitude = (index + 0.5) * NAKSHATRA_SIZE;
  const result = calculateVimshottari(longitude, birth);
  assert.equal(result.nakshatra, NAKSHATRA_NAMES[index], `nakshatra name at index ${index}`);
  assert.equal(result.nakshatraLord, LORD_ORDER[index % 9], `nakshatra ${NAKSHATRA_NAMES[index]} lord`);
}

// Ashwini, Magha and Mula all open the Ketu cycle.
for (const index of [0, 9, 18]) {
  assert.equal(calculateVimshottari((index + 0.5) * NAKSHATRA_SIZE, birth).nakshatraLord, 'Ketu');
}

// ---------------------------------------------------------------------------
// Mahādaśā sequence and durations
// ---------------------------------------------------------------------------
for (let index = 0; index < 27; index += 1) {
  const longitude = (index + 0.5) * NAKSHATRA_SIZE;
  const { entries } = calculateVimshottari(longitude, birth);
  const startLordIndex = index % 9;

  assert.equal(entries.length, 9, 'nine mahadashas');

  // The order always continues around the fixed wheel from the birth lord.
  assert.deepEqual(
    entries.map((entry) => entry.lord),
    Array.from({ length: 9 }, (_, step) => LORD_ORDER[(startLordIndex + step) % 9]),
    `sequence from ${LORD_ORDER[startLordIndex]}`,
  );

  // Only the first period is shortened by the birth balance; the rest are full.
  for (let step = 1; step < 9; step += 1) {
    assert.ok(
      Math.abs(entries[step].durationYears - LORD_YEARS[entries[step].lord]) < 1e-9,
      `${entries[step].lord} must run its full ${LORD_YEARS[entries[step].lord]} years`,
    );
  }

  // Periods are contiguous: each starts exactly where the previous ended.
  for (let step = 1; step < 9; step += 1) {
    assert.equal(
      entries[step].startDate.getTime(),
      entries[step - 1].endDate.getTime(),
      'mahadashas must be contiguous',
    );
  }
  assert.equal(entries[0].startDate.getTime(), birth.getTime(), 'the first period starts at birth');

  // Elapsed time must match the declared duration.
  for (const entry of entries) {
    assert.ok(
      Math.abs(yearsBetween(entry.startDate, entry.endDate) - entry.durationYears) < 1e-6,
      `${entry.lord} elapsed time must match its duration`,
    );
  }
}

// ---------------------------------------------------------------------------
// Birth balance — the opening period is the unexpired part of the nakshatra.
// ---------------------------------------------------------------------------
// Exactly at the start of Ashwini the whole Ketu period of 7 years remains.
const atStart = calculateVimshottari(0, birth);
assert.ok(Math.abs(atStart.entries[0].durationYears - 7) < 1e-9, 'a full balance at the nakshatra start');

// Halfway through Ashwini, half of Ketu remains.
const atHalf = calculateVimshottari(NAKSHATRA_SIZE / 2, birth);
assert.ok(Math.abs(atHalf.entries[0].durationYears - 3.5) < 1e-9, 'half a balance at the midpoint');

// Three quarters through Rohini (Moon, 10 years) leaves a quarter, so 2.5 years.
const rohini = calculateVimshottari(3 * NAKSHATRA_SIZE + NAKSHATRA_SIZE * 0.75, birth);
assert.equal(rohini.nakshatraLord, 'Moon');
assert.ok(Math.abs(rohini.entries[0].durationYears - 2.5) < 1e-9, 'a quarter of the Moon period remains');

// The balance shrinks monotonically as the Moon advances through a nakshatra.
let previousBalance = Infinity;
for (const fraction of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
  const balance = calculateVimshottari(fraction * NAKSHATRA_SIZE, birth).entries[0].durationYears;
  assert.ok(balance < previousBalance, 'the birth balance must decrease across the nakshatra');
  previousBalance = balance;
}

// A full run from the start of a nakshatra spans the whole 120-year cycle.
const fullCycle = calculateVimshottari(0, birth);
const cycleSpan = yearsBetween(fullCycle.entries[0].startDate, fullCycle.entries[8].endDate);
assert.ok(Math.abs(cycleSpan - CYCLE_YEARS) < 1e-6, 'a full cycle from a nakshatra start covers 120 years');

// ---------------------------------------------------------------------------
// Sub-periods: proportional, contiguous, and starting from the parent lord.
// ---------------------------------------------------------------------------
function assertSubPeriods(parent: MahadashaEntry, children: MahadashaEntry[], label: string) {
  assert.equal(children.length, 9, `${label}: nine sub-periods`);
  assert.equal(children[0].lord, parent.lord, `${label}: starts from the parent lord`);

  const parentIndex = LORD_ORDER.indexOf(parent.lord);
  assert.deepEqual(
    children.map((child) => child.lord),
    Array.from({ length: 9 }, (_, step) => LORD_ORDER[(parentIndex + step) % 9]),
    `${label}: order continues around the wheel`,
  );

  for (const child of children) {
    const expected = (parent.durationYears * LORD_YEARS[child.lord]) / CYCLE_YEARS;
    assert.ok(
      Math.abs(child.durationYears - expected) < 1e-9,
      `${label}: ${child.lord} must be ${LORD_YEARS[child.lord]}/120 of the parent`,
    );
  }

  // The children must exactly fill the parent, with no gap or overrun.
  const summed = children.reduce((sum, child) => sum + child.durationYears, 0);
  assert.ok(Math.abs(summed - parent.durationYears) < 1e-9, `${label}: sub-periods must fill the parent`);
  assert.equal(children[0].startDate.getTime(), parent.startDate.getTime(), `${label}: aligned start`);
  assert.ok(
    Math.abs(children[8].endDate.getTime() - parent.endDate.getTime()) < 2,
    `${label}: aligned end`,
  );
  for (let step = 1; step < 9; step += 1) {
    assert.equal(children[step].startDate.getTime(), children[step - 1].endDate.getTime(), `${label}: contiguous`);
  }
}

const { entries } = calculateVimshottari(NAKSHATRA_SIZE * 4.5, birth);
for (const md of entries) {
  const ads = calculateAntardashas(md);
  assertSubPeriods(md, ads, `${md.lord} MD`);
  for (const ad of ads) {
    assertSubPeriods(ad, calculatePratyantardashas(ad), `${md.lord}/${ad.lord} AD`);
  }
}

// The classical check: Venus AD inside a Venus MD is 20 × 20 / 120 = 3⅓ years.
const venusMd = entries.find((entry) => entry.lord === 'Venus')!;
assert.ok(Math.abs(venusMd.durationYears - 20) < 1e-9, 'a full Venus mahadasha is 20 years');
const venusVenus = calculateAntardashas(venusMd)[0];
assert.ok(Math.abs(venusVenus.durationYears - (20 * 20) / 120) < 1e-9, 'Venus/Venus is 400/120 years');

// ---------------------------------------------------------------------------
// Longitude handling at the extremes
// ---------------------------------------------------------------------------
// The very end of the zodiac is Revati, ruled by Mercury.
const lastDegree = calculateVimshottari(359.999, birth);
assert.equal(lastDegree.nakshatra, 'Revati');
assert.equal(lastDegree.nakshatraLord, 'Mercury');
assert.ok(lastDegree.entries[0].durationYears > 0, 'a positive balance even at the last degree');

console.log('Vimśottarī tests passed');
