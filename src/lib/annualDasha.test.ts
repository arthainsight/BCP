import assert from 'node:assert/strict';
import {
  ASHTOTTARI_CYCLE,
  MUDDA_CYCLE,
  VIMSHOTTARI_CYCLE,
  buildAnnualDasha,
  muddaFirstLord,
  tithiAshtottariFirstLord,
  tithiLord,
  vimshottariFirstLord,
} from './annualDasha';

const close = (a: number, b: number, tolerance: number, label: string) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${label}: expected ${b}, got ${a}`);

// --- Cycle totals -----------------------------------------------------------
assert.equal(MUDDA_CYCLE.reduce((s, l) => s + l.units, 0), 360, 'Mudda fills 360 days: Vimśottarī ÷ 120 × 360');
assert.equal(ASHTOTTARI_CYCLE.reduce((s, l) => s + l.units, 0), 108, 'Aṣṭottarī totals 108');

// --- Mudda entry lord -------------------------------------------------------
// At age 0 the first lord is the natal nakṣatra lord: Aśvinī → Ketu,
// Bharaṇī → Venus, Kṛttikā → Sun, Rohiṇī → Moon, Revatī → Mercury.
const lordAt = (nak: number, years: number) => MUDDA_CYCLE[muddaFirstLord(nak, years)].name;
assert.equal(lordAt(1, 0), 'Ketu');
assert.equal(lordAt(2, 0), 'Venus');
assert.equal(lordAt(3, 0), 'Sun');
assert.equal(lordAt(4, 0), 'Moon');
assert.equal(lordAt(27, 0), 'Mercury');
// Each completed year moves one lord on, and nine years come full circle.
assert.equal(lordAt(1, 1), 'Venus');
assert.equal(lordAt(1, 2), 'Sun');
for (let nak = 1; nak <= 27; nak++) assert.equal(lordAt(nak, 9), lordAt(nak, 0), `nakṣatra ${nak} repeats after nine years`);

// --- Tithi lords -------------------------------------------------------------
assert.equal(tithiLord(1), 'Sun', 'Śukla Pratipadā');
assert.equal(tithiLord(8), 'Rahu', 'Śukla Aṣṭamī');
assert.equal(tithiLord(15), 'Saturn', 'Pūrṇimā');
assert.equal(tithiLord(16), 'Sun', 'Kṛṣṇa Pratipadā');
assert.equal(tithiLord(30), 'Rahu', 'Amāvāsyā');
for (let t = 1; t <= 30; t++) assert.ok(tithiAshtottariFirstLord(t) >= 0, `tithi ${t} has an Aṣṭottarī lord`);

// --- Period arithmetic --------------------------------------------------------
const yearStart = 2450000;
const yearLength = 365.25;
const dasha = buildAnnualDasha(MUDDA_CYCLE, 3, 0.25, yearStart, yearLength);
assert.equal(dasha.length, 9, 'nine mahādaśās');
assert.equal(dasha[0].lord, 'Rahu');
close(dasha[0].endJd - dasha[0].startJd, 54 * yearLength / 360, 1e-9, 'Rahu takes 54/360 of the year');
close(yearStart - dasha[0].startJd, 0.25 * 54 * yearLength / 360, 1e-9, 'a quarter of it was spent before the year began');
close(dasha[8].endJd - dasha[0].startJd, yearLength, 1e-9, 'the cycle spans exactly one year');
for (let i = 1; i < dasha.length; i++) close(dasha[i].startJd, dasha[i - 1].endJd, 1e-9, 'mahādaśās are contiguous');
for (const md of dasha) {
  assert.equal(md.antardashas[0].lord, md.lord, 'antardaśās open with the mahādaśā lord');
  close(md.antardashas[0].startJd, md.startJd, 1e-9, 'and start with it');
  close(md.antardashas[8].endJd, md.endJd, 1e-9, 'and end with it');
}

// PVR Example 122 / Chart 67 (via PyJHora's test suite): Mudda periods for the
// 22nd year, in days, with a 365.2422-day year. The order and lengths must match.
const book = [['Rahu', 54.79], ['Jupiter', 48.7], ['Saturn', 57.83], ['Mercury', 51.74], ['Ketu', 21.31],
  ['Venus', 60.87], ['Sun', 18.26], ['Moon', 30.44], ['Mars', 21.31]] as const;
const example = buildAnnualDasha(MUDDA_CYCLE, 3, 0, 0, 365.2422);
book.forEach(([lord, days], i) => {
  assert.equal(example[i].lord, lord, `Example 122 period ${i + 1}`);
  close(example[i].endJd - example[i].startJd, days, 0.01, `${lord} length`);
});

// --- Vimśottarī in the year (Nakṣatra Praveśa and Yoga Praveśa) -------------------------------------------------
assert.deepEqual(VIMSHOTTARI_CYCLE.map((lord) => lord.name), ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']);
assert.equal(VIMSHOTTARI_CYCLE.reduce((sum, lord) => sum + lord.units, 0), 120, 'Vimśottarī has 120 years');
assert.deepEqual(VIMSHOTTARI_CYCLE.map((lord) => lord.units), [7, 20, 6, 10, 7, 18, 16, 19, 17]);
// The lord of nakṣatra (or yoga) 1–27: the nine lords three times over.
assert.equal(VIMSHOTTARI_CYCLE[vimshottariFirstLord(1)].name, 'Ketu', 'Ashwini: Ketu');
assert.equal(VIMSHOTTARI_CYCLE[vimshottariFirstLord(8)].name, 'Saturn', 'Pushya: Saturn');
assert.equal(VIMSHOTTARI_CYCLE[vimshottariFirstLord(10)].name, 'Ketu', 'Magha: Ketu');
assert.equal(VIMSHOTTARI_CYCLE[vimshottariFirstLord(27)].name, 'Mercury', 'Revati: Mercury');
for (let n = 1; n <= 27; n++) assert.equal(vimshottariFirstLord(n), vimshottariFirstLord(n + 9), `the lords repeat every nine (${n})`);

// Pushya, 36 % spent: Saturn first, with 19 of 120 of the year, 36 % of which was spent before the year began.
const pushya = buildAnnualDasha(VIMSHOTTARI_CYCLE, vimshottariFirstLord(8), 0.36, yearStart, yearLength);
assert.equal(pushya.length, 9);
assert.deepEqual(pushya.map((md) => md.lord), ['Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter']);
close(pushya[0].endJd - pushya[0].startJd, 19 * yearLength / 120, 1e-9, 'Saturn takes 19/120 of the year');
close(yearStart - pushya[0].startJd, 0.36 * 19 * yearLength / 120, 1e-9, 'a third of it was spent before the year began');
close(pushya[8].endJd - pushya[0].startJd, yearLength, 1e-9, 'the cycle spans exactly one year');
for (let i = 1; i < pushya.length; i++) close(pushya[i].startJd, pushya[i - 1].endJd, 1e-9, 'mahādaśās are contiguous');
assert.deepEqual(pushya[1].antardashas.map((ad) => ad.lord), ['Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn'], 'antardaśās open with the mahādaśā lord');

console.log('Annual dasha tests passed');
