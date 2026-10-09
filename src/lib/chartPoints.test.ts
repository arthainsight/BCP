import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { atmakarakaOf, karakamsa, pointsForDivision, selectedChartPoints, upagrahaPoints, DEFAULT_POINTS_SELECTION } from './chartPoints';

const planet = (name: string, longitude: number): PlanetData =>
  ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: 0 });
const planets = [
  planet('Sun', 170.72), planet('Moon', 66.1), planet('Mars', 160), planet('Mercury', 201), planet('Jupiter', 3),
  planet('Venus', 190), planet('Saturn', 234), planet('Rahu', 338), planet('Ketu', 158),
];
const saturnPortion = { night: false, weekday: 4, portion: 2, ascendants: { begin: 100, middle: 110, end: 120 } };
const chart = { planets, saturnPortion };

// All seven upagrahas: Gulika and Maandi from the Lagna in Saturn's part, five from the Sun.
const all = upagrahaPoints(chart);
assert.deepEqual(all.map(point => point.key), ['Gu', 'Md', 'Dh', 'Vy', 'Pa', 'In', 'Uk']);
assert.equal(all[0].longitude, 100, 'Gulika at the beginning by default');
assert.equal(all[1].longitude, 110, 'Maandi at the middle by default');
assert.equal(upagrahaPoints(chart, 'end', 'begin')[0].longitude, 120);
assert.equal(upagrahaPoints(chart, 'end', 'begin')[1].longitude, 100);
// Upaketu is the Sun − 30°.
assert.ok(Math.abs(all[6].longitude - (170.72 - 30)) < 1e-9);
// Without Saturn's part (no sunrise) only the Sun-based ones are there.
assert.deepEqual(upagrahaPoints({ planets }).map(point => point.key), ['Dh', 'Vy', 'Pa', 'In', 'Uk']);

// Karakamsa is the Ātmakāraka's Navāṁśa sign. Mercury at 21° Libra is in the 7th navamsa of that sign (index 6);
// Libra is movable, so the count starts from Libra itself and the 7th navamsa falls in Aries.
const ka = karakamsa(planets, 'Mercury')!;
assert.equal(ka.sign, 1);
assert.ok(Math.abs(ka.degree - ((21 % (30 / 9)) / (30 / 9)) * 30) < 1e-9);
assert.equal(karakamsa(planets, 'Nobody'), null);
assert.equal(atmakarakaOf({ Sun: 'MK', Mercury: 'AK' }), 'Mercury');
assert.equal(atmakarakaOf({}), undefined);

// Only the chosen points are marked, named by their codes; none chosen gives none.
assert.deepEqual(selectedChartPoints(chart, DEFAULT_POINTS_SELECTION, 'Mercury'), []);
const marks = selectedChartPoints(chart, { ...DEFAULT_POINTS_SELECTION, keys: ['Md', 'KA', 'Dh'] }, 'Mercury');
assert.deepEqual(marks.map(mark => mark.name).sort(), ['Dh', 'KA', 'Md']);
assert.equal(marks.find(mark => mark.name === 'Md')!.sign, 4);
assert.equal(marks.find(mark => mark.name === 'KA')!.sign, 1);
// Karakamsa needs an Ātmakāraka; without one it is left out.
assert.deepEqual(selectedChartPoints(chart, { ...DEFAULT_POINTS_SELECTION, keys: ['KA'] }), []);

// Karakamsa is a rāśi sign, so the divisional charts leave it out.
assert.equal(pointsForDivision(marks, 1).length, 3);
assert.deepEqual(pointsForDivision(marks, 9).map(mark => mark.name).sort(), ['Dh', 'Md']);

console.log('Chart point tests passed');
