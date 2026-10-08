import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { calculateCharaKarakas } from './karakas';

function planet(name: string, degree: number): PlanetData {
  return { name, degree, longitude: degree, sign: 1, house: 1 };
}

const planets = [
  planet('Sun', 26 + 12 / 60),
  planet('Moon', 6 + 54 / 60),
  planet('Mars', 10 + 42 / 60),
  planet('Mercury', 20 + 30 / 60),
  planet('Jupiter', 3 + 48 / 60),
  planet('Venus', 10 + 36 / 60),
  planet('Saturn', 24 + 24 / 60),
  planet('Rahu', 8 + 18 / 60), // reversed: 21°42′
];

const degreeRanking = calculateCharaKarakas(planets, 'degree');
assert.equal(degreeRanking[0].planet, 'Sun');
assert.equal(degreeRanking[0].karaka, 'AK');
assert.equal(degreeRanking.at(-1)?.planet, 'Jupiter');

const minuteRanking = calculateCharaKarakas(planets, 'minute');
assert.equal(minuteRanking[0].planet, 'Moon');
assert.equal(minuteRanking[0].karaka, 'AK');
assert.equal(minuteRanking[1].planet, 'Jupiter');
assert.equal(minuteRanking[2].planet, 'Rahu'); // Mars also has 42′; full effective degree breaks the tie.
assert.equal(minuteRanking[3].planet, 'Mars');

assert.deepEqual(
  calculateCharaKarakas(planets).map((entry) => entry.planet),
  degreeRanking.map((entry) => entry.planet),
);

// --- Seven karakas: Rahu is left out and there is no Pitṛkāraka ------------------------------------------
const seven = calculateCharaKarakas(planets, 'degree', 7);
assert.equal(seven.length, 7);
assert.ok(!seven.some(entry => entry.planet === 'Rahu'));
assert.deepEqual(seven.map(entry => entry.karaka), ['AK', 'AmK', 'BK', 'MK', 'PuK', 'GK', 'DK']);
assert.deepEqual(seven.map(entry => entry.planet), ['Sun', 'Saturn', 'Mercury', 'Mars', 'Venus', 'Moon', 'Jupiter']);
assert.equal(seven[0].karakaFull, 'Ātmakāraka');
assert.equal(seven[4].karakaFull, 'Putrakāraka');
assert.equal(seven.at(-1)?.karakaFull, 'Dārakāraka');

// --- Eight karakas are the default, and have Rahu measured in reverse ------------------------------------------
const eight = calculateCharaKarakas(planets, 'degree', 8);
assert.equal(eight.length, 8);
assert.deepEqual(eight.map(entry => entry.karaka), ['AK', 'AmK', 'BK', 'MK', 'PiK', 'PuK', 'GK', 'DK']);
assert.deepEqual(eight, degreeRanking);

// --- Seven karakas by the minutes of the degree ----------------------------------------------------------------------
const sevenByMinute = calculateCharaKarakas(planets, 'minute', 7);
// 54′, 48′, 42′, 36′, 30′, 24′ and 12′.
assert.deepEqual(sevenByMinute.map(entry => entry.planet), ['Moon', 'Jupiter', 'Mars', 'Venus', 'Mercury', 'Saturn', 'Sun']);
assert.equal(sevenByMinute[0].karaka, 'AK');

// --- With Rahu the Atmakaraka can change between the schemes ---------------------------------------------------------------
const rahuLeads = [...planets.filter(p => p.name !== 'Rahu'), planet('Rahu', 2)]; // reversed: 28°
assert.equal(calculateCharaKarakas(rahuLeads, 'degree', 8)[0].planet, 'Rahu');
assert.equal(calculateCharaKarakas(rahuLeads, 'degree', 7)[0].planet, 'Sun');

console.log('Chara Karaka ranking tests passed');
