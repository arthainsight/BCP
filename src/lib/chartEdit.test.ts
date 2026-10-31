// Editing a chart: a body moved to the next or the previous house (worked by hand).
import assert from 'node:assert/strict';
import { applyChartEdits, editCount, moveBody, movedSigns, resetBody } from './chartEdit';
import { calculatePanchang } from './panchang';
import type { ChartData, PlanetData } from '@/types';

// Signs are numbered 1 (Aries) to 12 (Pisces), houses from the Lagna. The Lagna at 18°23′ Gemini (78.38°), the Moon at 15°02′ Gemini
// (75.04°, the 1st house), the Sun at 13°05′ Libra (193.09°, the 5th), Mars at 23°46′ Cancer (113.76°, the 2nd), Rāhu at 1°56′
// Aquarius (301.93°, the 9th) and Ketu opposite it at 1°56′ Leo (121.93°, the 3rd).
const ASC = 78.38;
const planet = (name: string, longitude: number): PlanetData => ({
  name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: ((Math.floor(longitude / 30) - Math.floor(ASC / 30) + 12) % 12) + 1,
});
const chart: ChartData = {
  ascendant: { sign: 3, degree: ASC - 60, longitude: ASC },
  planets: [planet('Sun', 193.09), planet('Moon', 75.04), planet('Mars', 113.76), planet('Rahu', 301.93), planet('Ketu', 121.93)],
  specialLagnas: [{ name: 'Hora Lagna', longitude: 186.7, sign: 7, degree: 6.7 }],
  midheaven: 345,
  debug: { julianDay: 0, ayanamsa: 24, utcOffset: 2, ascendantDegree: ASC - 60, ascendantSign: 3, ephemerisEngine: 'test', inputDateTime: '2026-01-01 00:00:00', latitude: 60, longitude: 25 },
};
const get = (result: ChartData, name: string) => result.planets.find(entry => entry.name === name)!;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
assert.deepEqual(chart.planets.map(entry => entry.house), [5, 1, 2, 9, 3], 'the chart of the test is what the comment says');

// Nothing is edited: the same chart.
assert.equal(applyChartEdits(chart, {}), chart);

// The Moon one house on: Cancer (4), the 2nd house, the same 15°02′; the others are where they were.
{
  const edits = moveBody({}, 'Moon', 1);
  const moved = applyChartEdits(chart, edits);
  assert.equal(get(moved, 'Moon').sign, 4);
  assert.equal(get(moved, 'Moon').house, 2);
  assert.ok(near(get(moved, 'Moon').degree, 15.04), 'the degree in the sign is kept');
  assert.ok(near(get(moved, 'Moon').longitude, 105.04));
  assert.equal(get(moved, 'Sun').longitude, 193.09);
  assert.equal(get(moved, 'Sun').house, 5);
  assert.equal(moved.ascendant.sign, 3);
  assert.equal(movedSigns(edits, 'Moon'), 1);
  assert.equal(editCount(edits), 1);
  assert.equal(chart.planets.find(entry => entry.name === 'Moon')!.longitude, 75.04, 'the chart that was given is not changed');
}

// The Moon one house back: Taurus (2), the 12th house.
{
  const edits = moveBody({}, 'Moon', -1);
  const moved = applyChartEdits(chart, edits);
  assert.equal(get(moved, 'Moon').sign, 2);
  assert.equal(get(moved, 'Moon').house, 12);
  assert.ok(near(get(moved, 'Moon').longitude, 45.04));
  assert.equal(movedSigns(edits, 'Moon'), -1);
}

// A move on and a move back are no move, and twelve moves round the zodiac are none.
assert.deepEqual(moveBody(moveBody({}, 'Moon', 1), 'Moon', -1), {});
{
  let edits = {};
  for (let i = 0; i < 12; i++) edits = moveBody(edits, 'Mars', 1);
  assert.deepEqual(edits, {});
}

// Ketu goes with Rāhu, and Rāhu with Ketu: Rāhu from Aquarius (11) to Pisces (12), the 10th house, Ketu from Leo (5) to Virgo (6), the 4th.
{
  const edits = moveBody({}, 'Ketu', 1);
  assert.deepEqual(edits, { Rahu: 1 });
  const moved = applyChartEdits(chart, edits);
  assert.equal(get(moved, 'Rahu').sign, 12);
  assert.equal(get(moved, 'Rahu').house, 10);
  assert.equal(get(moved, 'Ketu').sign, 6);
  assert.equal(get(moved, 'Ketu').house, 4);
  assert.equal(movedSigns(edits, 'Ketu'), 1);
  assert.deepEqual(moveBody(edits, 'Rahu', -1), {});
}

// The Lagna one house on: Cancer (4) at the same 18°23′, and every house number is one less; the special lagnas are left out.
{
  const edits = moveBody({}, 'Asc', 1);
  const moved = applyChartEdits(chart, edits);
  assert.equal(moved.ascendant.sign, 4);
  assert.ok(near(moved.ascendant.degree, ASC - 60));
  assert.ok(near(moved.ascendant.longitude, ASC + 30));
  assert.deepEqual(moved.planets.map(entry => entry.house), [4, 12, 1, 8, 2], 'Sun 5→4, Moon 1→12, Mars 2→1, Rāhu 9→8, Ketu 3→2');
  assert.equal(moved.specialLagnas, undefined);
  assert.equal(moved.midheaven, 15, 'the Midheaven goes with the Lagna: 345° + 30°');
  assert.equal(moved.debug!.ascendantSign, 4);
  assert.deepEqual(moved.planets.map(entry => entry.longitude), chart.planets.map(entry => entry.longitude), 'no graha moved');
}

// One body's move can be taken back, or all of them.
{
  const edits = moveBody(moveBody({}, 'Moon', 1), 'Sun', -1);
  assert.deepEqual(resetBody(edits, 'Moon'), { Sun: 11 });
  assert.deepEqual(resetBody(edits), {});
  assert.deepEqual(resetBody(edits, 'Ketu'), edits, 'nothing to take back');
}

// The panchāṅga follows the longitudes. The Moon 241.95° ahead of the Sun is the 6th tithi of the dark half and the Moon in Ardrā; one house on it is
// 271.95° ahead, the 8th of the dark half, and in Pushya (93°20′ to 106°40′).
{
  const before = calculatePanchang(chart, '15.08.1947 09.15.00', 2, 'lahiri');
  assert.equal(before.paksha, 'Krishna');
  assert.equal(before.tithiNumber, 6);
  assert.equal(before.nakshatra, 'Ardra');
  const after = calculatePanchang(applyChartEdits(chart, moveBody({}, 'Moon', 1)), '15.08.1947 09.15.00', 2, 'lahiri');
  assert.equal(after.paksha, 'Krishna');
  assert.equal(after.tithiNumber, 8);
  assert.equal(after.nakshatra, 'Pushya');
}
