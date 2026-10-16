import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { NAISARGIKA_DEFINITIONS, NAISARGIKA_TOTAL_YEARS, calculateNaisargika, calculateNaisargikaSubDashas } from './naisargika';
import { addDashaYears } from './time';

// --- The mahādaśās: the order of natural strength, the years, no balance at birth -----------------------------------------
assert.deepEqual(NAISARGIKA_DEFINITIONS.map(definition => [definition.lord, definition.years]),
  [['Moon', 1], ['Mars', 2], ['Mercury', 9], ['Venus', 20], ['Jupiter', 18], ['Sun', 20], ['Saturn', 50], ['Lagna', 12]]);
assert.equal(NAISARGIKA_TOTAL_YEARS, 132, 'the seven of BPHS make 120, the Lagna adds 12');
const birth = new Date(2000, 0, 1, 10);
const { entries } = calculateNaisargika(birth);
assert.equal(entries.length, 8);
assert.equal(entries[0].startDate.getTime(), birth.getTime(), 'the Moon period begins at birth, whole');
assert.equal(entries[0].durationYears, 1);
for (let index = 1; index < entries.length; index++) assert.equal(entries[index].startDate.getTime(), entries[index - 1].endDate.getTime(), 'the periods follow one another');
assert.equal(entries.at(-1)!.endDate.getTime(), addDashaYears(birth, 132).getTime());

// --- The antardaśās, worked out by hand for this chart --------------------------------------------------------------------
const planet = (name: string, sign: number): PlanetData => ({ name, sign, house: sign, degree: 10, longitude: (sign - 1) * 30 + 10 });
const planets = [planet('Sun', 6), planet('Moon', 3), planet('Mars', 6), planet('Mercury', 7), planet('Jupiter', 1), planet('Venus', 7), planet('Saturn', 8), planet('Rahu', 12), planet('Ketu', 6)];
const lordsOf = (parent: (typeof entries)[number]) => calculateNaisargikaSubDashas(parent, planets, 4).map(entry => entry.lord);
const mars = entries[1];
// From Virgo (Mars's sign): the 1st is Virgo (the Sun; Mars itself is left out, Ketu is a node), the 4th Sagittarius, the 7th Pisces,
// the 10th Gemini (the Moon), the 2nd Libra (Mercury, Venus), the 5th Capricorn, the 8th Aries (Jupiter), the 11th Cancer,
// the 3rd Scorpio (Saturn), then nothing in Aquarius, Taurus or Leo.
assert.deepEqual(lordsOf(mars), ['Sun', 'Moon', 'Mercury', 'Venus', 'Jupiter', 'Saturn']);
const marsPeriods = calculateNaisargikaSubDashas(mars, planets, 4);
for (const period of marsPeriods) assert.ok(Math.abs(period.durationYears - 2 / 6) < 1e-12, 'an equal share each');
assert.equal(marsPeriods[0].startDate.getTime(), mars.startDate.getTime());
assert.ok(Math.abs(marsPeriods.at(-1)!.endDate.getTime() - mars.endDate.getTime()) < 1, 'the shares fill the daśā');
// The Lagna's daśā counts from the Lagna's sign (here Cancer) and has all seven grahas: the 1st Cancer (nothing), the 4th Libra
// (Mercury, Venus), the 7th Capricorn, the 10th Aries (Jupiter), the 2nd Leo, the 5th Scorpio (Saturn), the 8th Aquarius, the 11th
// Taurus, the 3rd Virgo (Sun, Mars), the 6th Sagittarius, the 9th Pisces and the 12th Gemini (the Moon).
assert.deepEqual(lordsOf(entries[7]), ['Mercury', 'Venus', 'Jupiter', 'Saturn', 'Sun', 'Mars', 'Moon']);
// A daśā inside a daśā works the same way from the sign of its own lord: the Sun's (Virgo here, as Mars's) without the Sun.
assert.deepEqual(lordsOf(marsPeriods[0]), ['Mars', 'Moon', 'Mercury', 'Venus', 'Jupiter', 'Saturn']);
// A chart without the lord has no periods.
assert.deepEqual(calculateNaisargikaSubDashas(mars, planets.filter(item => item.name !== 'Mars'), 4), []);

console.log('Naisargika Daśā tests passed');
