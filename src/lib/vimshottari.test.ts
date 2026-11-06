import assert from 'node:assert/strict';
import {
  calculateVimshottari,
  calculateAntardashas,
  calculatePratyantardashas,
  runningVimshottariLords,
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
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
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
function assertWholeSubPeriods(parent: MahadashaEntry, children: MahadashaEntry[], label: string) {
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

// A period cut short (the balance at birth, or the antardasha running at birth) is not shared out afresh: its
// sub-periods are those of the whole period, begun where the whole would have begun, less the ones over before birth.
function assertCutSubPeriods(parent: MahadashaEntry, children: MahadashaEntry[], label: string) {
  const whole = parent.fullDurationYears!;
  assert.ok(whole > parent.durationYears, `${label}: a period cut short is shorter than the whole`);
  assert.ok(children.length >= 1 && children.length <= 9, `${label}: between one and nine sub-periods remain`);

  // The order continues around the wheel, starting from the first one not over at birth, and ends with the parent's last.
  const parentIndex = LORD_ORDER.indexOf(parent.lord);
  const firstIndex = parentIndex + (9 - children.length);
  assert.deepEqual(
    children.map((child) => child.lord),
    Array.from({ length: children.length }, (_, step) => LORD_ORDER[(firstIndex + step) % 9]),
    `${label}: the sub-periods that are left`,
  );

  // All but the first run their whole length, which is a share of the WHOLE period; the first is cut at the start.
  children.forEach((child, step) => {
    const wholeChild = (whole * LORD_YEARS[child.lord]) / CYCLE_YEARS;
    if (step === 0) {
      assert.ok(child.durationYears <= wholeChild + 1e-9, `${label}: the first sub-period is cut short, not stretched`);
      if (child.durationYears < wholeChild - 1e-9) assert.ok(Math.abs((child.fullDurationYears ?? 0) - wholeChild) < 1e-9, `${label}: the cut sub-period remembers its whole length`);
    } else {
      assert.ok(Math.abs(child.durationYears - wholeChild) < 1e-9, `${label}: ${child.lord} runs its whole ${LORD_YEARS[child.lord]}/120 of the whole period`);
    }
  });

  const summed = children.reduce((sum, child) => sum + child.durationYears, 0);
  assert.ok(Math.abs(summed - parent.durationYears) < 1e-9, `${label}: the sub-periods fill what is left of the parent`);
  assert.equal(children[0].startDate.getTime(), parent.startDate.getTime(), `${label}: aligned start`);
  assert.ok(Math.abs(children[children.length - 1].endDate.getTime() - parent.endDate.getTime()) < 2, `${label}: aligned end`);
  for (let step = 1; step < children.length; step += 1) {
    assert.equal(children[step].startDate.getTime(), children[step - 1].endDate.getTime(), `${label}: contiguous`);
  }
}

function assertSubPeriods(parent: MahadashaEntry, children: MahadashaEntry[], label: string) {
  if (parent.fullDurationYears === undefined) assertWholeSubPeriods(parent, children, label);
  else assertCutSubPeriods(parent, children, label);
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

// The balance at birth, worked by hand. The Moon has passed exactly a quarter of Ashwini, so three quarters of the
// Ketu period (5.25 of 7 years) remain and 1.75 years are over. The Ketu antardashas (7 × years / 120) are
//   Ketu 0.4083, Venus 1.1667, Sun 0.35, Moon 0.5833, Mars 0.4083, Rahu 1.05, Jupiter 0.9333, Saturn 1.1083, Mercury 0.9917
// which end at 0.4083, 1.575, 1.925, 2.5083, 2.9167, 3.9667, 4.9, 6.0083 and 7.0 years. At 1.75 years the Sun
// antardasha (1.575 to 1.925) is running with 0.175 years left; the Moon to Mercury antardashas follow whole.
{
  const quarter = calculateVimshottari(NAKSHATRA_SIZE * 0.25, birth);
  const md = quarter.entries[0];
  assert.ok(Math.abs(md.durationYears - 5.25) < 1e-9 && md.fullDurationYears === 7, 'three quarters of the Ketu period remain');
  const ads = calculateAntardashas(md);
  assert.deepEqual(ads.map((ad) => ad.lord), ['Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'], 'Ketu-Ketu and Ketu-Venus are over at birth');
  assert.ok(Math.abs(ads[0].durationYears - (7 * 6 / 120 - (1.75 - (7 * 7 / 120 + 7 * 20 / 120)))) < 1e-9, 'Ketu-Sun has what is left of its 0.35 years');
  assert.ok(Math.abs(ads[0].fullDurationYears! - 0.35) < 1e-9, 'Ketu-Sun is a 0.35-year period, cut');
  assert.equal(runningVimshottariLords(NAKSHATRA_SIZE * 0.25, birth, birth)?.ad, 'Sun', 'the antardasha running at birth');
  // A pratyantardasha list inside the cut antardasha is cut in the same way and runs to the antardasha's end.
  const pds = calculatePratyantardashas(ads[0]);
  assert.equal(pds[0].startDate.getTime(), birth.getTime());
  assert.ok(Math.abs(pds[pds.length - 1].endDate.getTime() - ads[0].endDate.getTime()) < 2, 'the pratyantardashas end with the antardasha');
}
// The Moon at the very start of a nakshatra leaves the whole period: nothing is cut and nothing carries a whole length.
assert.equal(calculateVimshottari(0, birth).entries[0].fullDurationYears, undefined);
assert.equal(calculateAntardashas(calculateVimshottari(0, birth).entries[0]).length, 9);

// ---------------------------------------------------------------------------
// Longitude handling at the extremes
// ---------------------------------------------------------------------------
// The very end of the zodiac is Revati, ruled by Mercury.
const lastDegree = calculateVimshottari(359.999, birth);
assert.equal(lastDegree.nakshatra, 'Revati');
assert.equal(lastDegree.nakshatraLord, 'Mercury');
assert.ok(lastDegree.entries[0].durationYears > 0, 'a positive balance even at the last degree');

// --- Running lords at a moment -------------------------------------------------
{
  const birth = new Date(2000, 0, 1, 12);
  // Moon at 0° Aries: Aśvinī, so the full 7-year Ketu mahādaśā runs from birth.
  assert.deepEqual(runningVimshottariLords(0, birth, birth), { md: 'Ketu', ad: 'Ketu' });
  // Ketu–Venus follows Ketu–Ketu (7 × 7 / 120 years ≈ 4.9 months).
  assert.deepEqual(runningVimshottariLords(0, birth, new Date(2000, 6, 1)), { md: 'Ketu', ad: 'Venus' });
  // Venus mahādaśā begins at age 7.
  assert.deepEqual(runningVimshottariLords(0, birth, new Date(2007, 6, 1)), { md: 'Venus', ad: 'Venus' });
  assert.equal(runningVimshottariLords(0, birth, new Date(1999, 0, 1)), null, 'before birth');
}

console.log('Vimśottarī tests passed');
