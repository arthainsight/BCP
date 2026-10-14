import assert from 'node:assert/strict';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import {
  ABHIJIT_END, ABHIJIT_START, SBC_GRID, SBC_NAKSHATRA_CELLS, SBC_SIGN_CELLS, SBC_TITHI_CELLS, TITHI_GROUPS,
  sbcCellOf, sbcMarkLayout, sbcNakshatra, tithiOf, vedicWeekday, weekdayGroup,
} from './sarvatobhadra';

const cells = SBC_GRID.flat();

// --- The chart is 9 × 9 and has what it should ---------------------------------------------------------------------
assert.equal(SBC_GRID.length, 9);
assert.ok(SBC_GRID.every(row => row.length === 9), 'nine squares in every row');
assert.equal(cells.length, 81);
const count = (kind: string) => cells.filter(cell => cell.kind === kind).length;
assert.equal(count('nakshatra'), 28, 'the 27 nakṣatras and Abhijit');
assert.equal(count('sign'), 12);
assert.equal(count('tithi'), 5);
assert.equal(count('vowel') + count('consonant'), 36);

// Every nakṣatra and every rāśi once; the nakṣatras are the edge of the chart.
const nakshatras = cells.map(cell => cell.nakshatra).filter(Boolean);
assert.equal(new Set(nakshatras).size, 28);
for (const name of [...NAKSHATRA_NAMES, 'Abhijit']) assert.ok(SBC_NAKSHATRA_CELLS[name], `${name} has a square`);
for (const [r, col] of Object.values(SBC_NAKSHATRA_CELLS)) assert.ok(r === 0 || r === 8 || col === 0 || col === 8, 'a nakṣatra is on the edge');
for (let sign = 1; sign <= 12; sign++) assert.ok(SBC_SIGN_CELLS[sign], `sign ${sign} has a square`);
assert.equal(new Set(Object.values(SBC_SIGN_CELLS).map(([r, col]) => `${r},${col}`)).size, 12);

// The weekdays are shared out once among the five tithi squares.
const weekdays = Object.values(SBC_TITHI_CELLS).flatMap(([r, col]) => SBC_GRID[r][col].weekdays ?? []).sort();
assert.deepEqual(weekdays, [0, 1, 2, 3, 4, 5, 6]);
assert.deepEqual(TITHI_GROUPS, ['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Poorna']);

// The signs sit in the order of the zodiac, as in the chart: Capricorn, Aquarius, Pisces, Aries … in the ring.
assert.deepEqual(SBC_SIGN_CELLS[11], [2, 3]);
assert.deepEqual(SBC_SIGN_CELLS[1], [2, 5]);
assert.deepEqual(SBC_SIGN_CELLS[7], [6, 3]);

// --- The nakṣatra of a longitude, with Abhijit ---------------------------------------------------------------------
for (let index = 0; index < 27; index++) {
  const start = index * NAKSHATRA_SIZE;
  // The middle of a nakṣatra, which no change to Abhijit moves, except for the two it cuts into.
  if (NAKSHATRA_NAMES[index] === 'Uttara Ashadha' || NAKSHATRA_NAMES[index] === 'Shravana') continue;
  assert.equal(sbcNakshatra(start + NAKSHATRA_SIZE / 2), NAKSHATRA_NAMES[index], `the middle of ${NAKSHATRA_NAMES[index]}`);
}
assert.equal(sbcNakshatra(0), 'Ashwini');
assert.equal(sbcNakshatra(359.99), 'Revati');
assert.equal(sbcNakshatra(-0.01), 'Revati');
assert.equal(sbcNakshatra(720.5), 'Ashwini');
assert.equal(sbcNakshatra(ABHIJIT_START - 0.0001), 'Uttara Ashadha');
assert.equal(sbcNakshatra(ABHIJIT_START), 'Abhijit');
assert.equal(sbcNakshatra(278), 'Abhijit');
assert.equal(sbcNakshatra(ABHIJIT_END - 0.0001), 'Abhijit');
assert.equal(sbcNakshatra(ABHIJIT_END), 'Shravana');
assert.equal(sbcNakshatra(266 + 40 / 60), 'Uttara Ashadha');
assert.equal(sbcNakshatra(266 + 39 / 60), 'Purva Ashadha');
assert.equal(sbcNakshatra(293 + 21 / 60), 'Dhanishtha');
assert.equal(sbcNakshatra(293 + 19 / 60), 'Shravana');

// The square of a graha is that of its nakṣatra; the nakṣatra zodiac's offset moves it.
assert.deepEqual(sbcCellOf(10), SBC_NAKSHATRA_CELLS.Ashwini, 'the first 13°20\' is Ashwini');
assert.deepEqual(sbcCellOf(10, 3.5), SBC_NAKSHATRA_CELLS.Bharani);
assert.deepEqual(sbcCellOf(10, 3), SBC_NAKSHATRA_CELLS.Ashwini);
assert.deepEqual(sbcCellOf(0, -1), SBC_NAKSHATRA_CELLS.Revati);
assert.deepEqual(sbcCellOf(278), SBC_NAKSHATRA_CELLS.Abhijit);

// --- Tithi and weekday --------------------------------------------------------------------------------------------
assert.deepEqual(tithiOf(0, 1), { tithi: 1, group: 'Nanda' });
assert.deepEqual(tithiOf(0, 12), { tithi: 2, group: 'Bhadra' });
assert.deepEqual(tithiOf(0, 36), { tithi: 4, group: 'Rikta' });
assert.deepEqual(tithiOf(0, 60), { tithi: 6, group: 'Nanda' });
assert.deepEqual(tithiOf(0, 179.9), { tithi: 15, group: 'Poorna' });
assert.deepEqual(tithiOf(0, 180), { tithi: 16, group: 'Nanda' });
assert.deepEqual(tithiOf(0, 359.99), { tithi: 30, group: 'Poorna' });
assert.deepEqual(tithiOf(350, 5), { tithi: 2, group: 'Bhadra' }, 'the Moon ahead of the Sun across 0°');
assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(weekdayGroup), ['Nanda', 'Bhadra', 'Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Poorna']);
assert.equal(weekdayGroup(7), 'Nanda');

// 15 August 1947 was a Friday; before sunrise it still belongs to Thursday.
assert.equal(vedicWeekday({ year: 1947, month: 8, day: 15 }, 9.25, 5.9), 5);
assert.equal(vedicWeekday({ year: 1947, month: 8, day: 15 }, 4.0, 5.9), 4);
assert.equal(vedicWeekday({ year: 1947, month: 8, day: 15 }, 4.0, undefined), 5);
assert.equal(vedicWeekday({ year: 2026, month: 10, day: 12 }, 3, 7), 0, 'before sunrise on a Monday is Sunday');

// --- The grahas inside a square: always room for them ---------------------------------------------------------------
for (const longest of [2, 3, 4]) {
  let before = Infinity;
  for (let count = 1; count <= 24; count++) {
    const { perLine, size, lineHeight } = sbcMarkLayout(count, longest);
    const lines = Math.ceil(count / perLine);
    assert.ok(size >= 6, `${count} grahas keep a readable size`);
    assert.ok(size <= before, 'the letters never grow as more grahas come');
    before = size;
    assert.ok(lines * lineHeight <= 58, `${count} grahas of ${longest} characters fit the height`);
    assert.ok(perLine * longest * 0.62 * size <= 94, `${count} grahas of ${longest} characters fit the width`);
  }
}
assert.equal(sbcMarkLayout(1, 2).size, 26, 'a graha alone is large');

console.log('sarvatobhadra tests passed');
