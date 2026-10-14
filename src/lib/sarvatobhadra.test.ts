import assert from 'node:assert/strict';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import {
  ABHIJIT_END, ABHIJIT_START, SBC_GRID, SBC_NAKSHATRA_CELLS, SBC_SIGN_CELLS, SBC_TITHI_CELLS, TITHI_GROUPS,
  sbcCellOf, sbcLetterSquares, sbcMarkLayout, sbcNakshatra, sbcPierces, sbcVedha, tithiOf, vedicWeekday, weekdayGroup,
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

// --- Vedha: across the chart and on the two diagonals -----------------------------------------------------------
const nameAt = ([r, col]: readonly [number, number]) => SBC_GRID[r][col].nakshatra;
const across = (name: string) => nameAt(sbcVedha(SBC_NAKSHATRA_CELLS[name])!.find(line => line.direction === 'across')!.target);
const diagonals = (name: string) => sbcVedha(SBC_NAKSHATRA_CELLS[name])!.filter(line => line.direction === 'diagonal').map(line => nameAt(line.target)).sort();

// Ashwini (top edge): straight down to Purva Phalguni, and the diagonals to Jyeshtha and Rohini.
assert.equal(across('Ashwini'), 'Purva Phalguni');
assert.deepEqual(diagonals('Ashwini'), ['Jyeshtha', 'Rohini']);
// Dhanishtha (first on the top edge): across to Vishakha, the diagonals to Ashlesha and, next door, Shravana.
assert.equal(across('Dhanishtha'), 'Vishakha');
assert.deepEqual(diagonals('Dhanishtha'), ['Ashlesha', 'Shravana']);
// An edge on the left looks right, one on the right looks left, and one at the bottom looks up.
assert.equal(across('Mula'), 'Punarvasu');
assert.equal(across('Punarvasu'), 'Mula');
assert.equal(across('Hasta'), 'Uttara Bhadrapada');
assert.equal(across('Uttara Bhadrapada'), 'Hasta');
assert.deepEqual(diagonals('Mula'), ['Chitra', 'Revati']);
// Every graha has exactly one nakshatra across and two on the diagonals.
for (const name of [...NAKSHATRA_NAMES, 'Abhijit']) {
  assert.equal(sbcVedha(SBC_NAKSHATRA_CELLS[name])!.filter(line => line.direction === 'across').length, 1);
  assert.equal(diagonals(name).length, 2);
}

for (const name of [...NAKSHATRA_NAMES, 'Abhijit']) {
  const from = SBC_NAKSHATRA_CELLS[name];
  const lines = sbcVedha(from)!;
  assert.equal(lines.length, 3, `${name} has three lines`);
  const targets = lines.map(line => nameAt(line.target)!);
  assert.equal(new Set(targets).size, 3, `${name}: three different nakshatras`);
  assert.ok(!targets.includes(name), `${name} does not pierce itself`);
  for (const line of lines) {
    // Every line ends on a nakṣatra at the edge and runs in a straight line, square by square.
    const [r, col] = line.target;
    assert.ok(r === 0 || r === 8 || col === 0 || col === 8, `${name}: the line ends at the edge`);
    assert.ok(SBC_GRID[r][col].nakshatra, `${name}: the line ends on a nakshatra`);
    assert.deepEqual(line.path.at(-1), line.target);
    const step = [line.path[0][0] - from[0], line.path[0][1] - from[1]];
    assert.ok(Math.abs(step[0]) <= 1 && Math.abs(step[1]) <= 1 && (step[0] !== 0 || step[1] !== 0));
    line.path.forEach((square, index) => assert.deepEqual(square, [from[0] + step[0] * (index + 1), from[1] + step[1] * (index + 1)]));
    // The vedha goes both ways: the nakṣatra at the end has it on this one.
    assert.ok(sbcVedha(line.target)!.some(back => nameAt(back.target) === name), `${name} and ${nameAt(line.target)} pierce each other`);
  }
}
// Squares that are not a nakṣatra's have no vedha of their own.
assert.equal(sbcVedha([4, 4]), null);
assert.equal(sbcVedha([0, 0]), null);

// --- The squares the lines cross --------------------------------------------------------------------------------
const labelAt = ([r, col]: readonly [number, number]) => SBC_GRID[r][col].label;
const crossed = (name: string) => sbcVedha(SBC_NAKSHATRA_CELLS[name])!.map(line => line.path.map(labelAt));
// Ashwini: straight down the column through the Taurus square to Purva Phalguni; one diagonal to Rohini (two squares), the other to Jyeshtha.
const ashwini = crossed('Ashwini');
const byFirstLabel = (paths: string[][]) => [...paths].sort((x, y) => x[0].localeCompare(y[0]));
assert.deepEqual(byFirstLabel(ashwini), byFirstLabel([
  ['l', 'lu', 'Ta', 'Ge', 'Cn', 'luu', 'm', 'PPha'],
  ['ch', 'Pi', 'ah', 'Sg', 'y', 'Jye'],
  ['u', 'Rohi'],
]), 'the three lines of Ashwini, square by square');

// Saturn in Ashlesha (the chart of 15.08.1947): the diagonal crosses Cancer and the Rikta square.
const ashlesha = crossed('Ashlesha');
assert.ok(ashlesha.some(path => path.includes('Cn') && path.includes('Rikta') && path.includes('Nanda')), 'a diagonal from Ashlesha crosses Cancer, Nanda and Rikta');
// The squares of one graha's three lines are all different (three rays leave one square).
for (const name of [...NAKSHATRA_NAMES, 'Abhijit']) {
  const squares = sbcVedha(SBC_NAKSHATRA_CELLS[name])!.flatMap(line => line.path.map(([r, col]) => `${r}-${col}`));
  assert.equal(new Set(squares).size, squares.length, `${name}: no square is on two of its lines`);
}

// --- The letters of a name ---------------------------------------------------------------------------------------
assert.deepEqual(sbcLetterSquares('ch'), [[1, 5]]);
assert.deepEqual(sbcLetterSquares(' CH '), [[1, 5]], 'case and spaces do not matter');
assert.equal(sbcLetterSquares('d').length, 2, 'd has two squares');
assert.equal(sbcLetterSquares('a').length, 2, 'a has two squares, as in the chart it is copied from');
assert.deepEqual(sbcLetterSquares(''), []);
assert.deepEqual(sbcLetterSquares('Aq'), [], 'a sign is not a letter');
assert.deepEqual(sbcLetterSquares('Krit'), [], 'a nakshatra is not a letter');
assert.deepEqual(sbcLetterSquares('zzz'), []);

// --- What a graha pierces ----------------------------------------------------------------------------------------
const at = (label: string): [number, number] => cells.map((cell, index) => [cell, index] as const).filter(([cell]) => cell.label === label).map(([, index]) => [Math.floor(index / 9), index % 9] as [number, number])[0];
const points = [
  { id: 'janma' as const, position: SBC_NAKSHATRA_CELLS.Pushya },
  { id: 'moonSign' as const, position: SBC_SIGN_CELLS[4] },
  { id: 'lagnaSign' as const, position: SBC_SIGN_CELLS[6] },
  { id: 'tithi' as const, position: SBC_TITHI_CELLS.Rikta },
  { id: 'vara' as const, position: SBC_TITHI_CELLS.Rikta },
  { id: 'name' as const, position: at('ch') },
];
// Saturn in Ashlesha pierces the Moon's sign (Cancer) and the Rikta square (tithi and weekday), each crossed by a line.
const saturn = sbcPierces(sbcVedha(SBC_NAKSHATRA_CELLS.Ashlesha)!, points);
assert.deepEqual(saturn.map(hit => [hit.point.id, hit.at]), [['moonSign', 'line'], ['tithi', 'line'], ['vara', 'line']]);
// A graha has vedha on the nakshatra at the end of a line: Jupiter in Vishakha reaches Dhanishtha, which is the Moon's here.
const reaches = sbcPierces(sbcVedha(SBC_NAKSHATRA_CELLS.Vishakha)!, [{ id: 'janma', position: SBC_NAKSHATRA_CELLS.Dhanishtha }]);
assert.deepEqual(reaches.map(hit => [hit.point.id, hit.direction, hit.at]), [['janma', 'across', 'end']]);
// A point on none of the lines is not reached, and a graha does not pierce its own square.
assert.deepEqual(sbcPierces(sbcVedha(SBC_NAKSHATRA_CELLS.Vishakha)!, [{ id: 'janma', position: SBC_NAKSHATRA_CELLS.Vishakha }]), []);
assert.deepEqual(sbcPierces(sbcVedha(SBC_NAKSHATRA_CELLS.Ashwini)!, [{ id: 'name', position: at('kh') }]), []);

console.log('sarvatobhadra tests passed');
