import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { signDignity } from './dignity';
import { followPlanet } from './vargaFollow';
import { buildVargaChart } from './vargaChart';

// --- Sign dignities (BPHS 3) ----------------------------------------------------
assert.equal(signDignity('Sun', 1), 'exalted');
assert.equal(signDignity('Sun', 7), 'debilitated');
assert.equal(signDignity('Sun', 5), 'own');
assert.equal(signDignity('Mercury', 6), 'exalted', 'exaltation wins over own sign for Mercury in Virgo');
assert.equal(signDignity('Moon', 3), null);
assert.equal(signDignity('Rahu', 2), null, 'nodes have no dignity here');

// --- Following a planet across vargas ---------------------------------------------
const planet = (name: string, longitude: number): PlanetData =>
  ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: 0 });
const chart: ChartData = {
  ascendant: { sign: 6, degree: 12.3, longitude: 162.3 },
  // Venus at 1° Aries: D9 starts from Aries for a movable sign, so it is
  // vargottama; Sun at 10° Aries is exalted in D1.
  planets: [planet('Sun', 10), planet('Venus', 1)],
};

const venus = followPlanet(chart, 'Venus', [1, 9, 12]);
assert.deepEqual(venus.map(p => p.division), [1, 9, 12]);
assert.equal(venus[0].sameAsRasi, false, 'D1 is never marked against itself');
assert.equal(venus[1].sign, 1);
assert.equal(venus[1].sameAsRasi, true, 'vargottama in D9');
for (const place of venus) {
  assert.equal(place.sign, buildVargaChart(chart, place.division).planets.find(p => p.name === 'Venus')?.sign);
}
assert.equal(followPlanet(chart, 'Sun', [1])[0].dignity, 'exalted');
assert.deepEqual(followPlanet(chart, 'Mars', [1, 9]), [], 'a planet not in the chart gives nothing');
