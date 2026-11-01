import assert from 'node:assert/strict';
import { patyamshaDasha, patyamshaShares } from './patyamsha';

const bodies = [
  { name: 'Sun', degree: 10 }, { name: 'Moon', degree: 20 }, { name: 'Mars', degree: 5 }, { name: 'Mercury', degree: 2.5 },
  { name: 'Jupiter', degree: 12 }, { name: 'Venus', degree: 27 }, { name: 'Saturn', degree: 17 }, { name: 'Lagna', degree: 8 },
];

// In order from the smallest degrees; each share is the degrees less those before; the shares add up to the greatest degrees.
const shares = patyamshaShares(bodies);
assert.deepEqual(shares.map(share => share.name), ['Mercury', 'Mars', 'Lagna', 'Sun', 'Jupiter', 'Saturn', 'Moon', 'Venus']);
assert.deepEqual(shares.map(share => share.patyamsha), [2.5, 2.5, 3, 2, 2, 5, 3, 7]);
assert.equal(shares.reduce((sum, share) => sum + share.patyamsha, 0), 27);

// The year is divided among them in proportion, and fills it.
const start = 2460000;
const span = 365.25;
const dasha = patyamshaDasha(bodies, start, span);
assert.equal(dasha.length, 8);
assert.ok(Math.abs(dasha[0].startJd - start) < 1e-9);
assert.ok(Math.abs(dasha[7].endJd - (start + span)) < 1e-9);
for (let i = 1; i < dasha.length; i++) assert.ok(Math.abs(dasha[i].startJd - dasha[i - 1].endJd) < 1e-9, 'one after the other');
assert.ok(Math.abs((dasha[7].endJd - dasha[7].startJd) - (span * 7) / 27) < 1e-9, 'Venus 7 of 27');
// The sub-periods begin with the lord and fill the daśā; a graha's share in another's is the product of their days over the days of the year.
for (const md of dasha) {
  assert.equal(md.antardashas[0].lord, md.lord);
  assert.equal(md.antardashas.length, 8);
  assert.ok(Math.abs(md.antardashas[7].endJd - md.endJd) < 1e-9);
}
const venus = dasha[7];
const venusDays = venus.endJd - venus.startJd;
const mercuryIn = venus.antardashas.find(ad => ad.lord === 'Mercury')!;
const mercuryDays = dasha[0].endJd - dasha[0].startJd;
assert.ok(Math.abs((mercuryIn.endJd - mercuryIn.startJd) - (venusDays * mercuryDays) / span) < 1e-9);

// Equal degrees: the slower first; the second has no pātyāṁśa and so no period.
const tied = patyamshaShares([{ name: 'Mars', degree: 10, speed: 0.7 }, { name: 'Saturn', degree: 10, speed: 0.1 }, { name: 'Sun', degree: 4, speed: 1 }]);
assert.deepEqual(tied.map(share => share.name), ['Sun', 'Saturn', 'Mars']);
assert.equal(tied[2].patyamsha, 0);
assert.equal(patyamshaDasha([{ name: 'Mars', degree: 10, speed: 0.7 }, { name: 'Saturn', degree: 10, speed: 0.1 }], 0, 360).length, 1);
assert.deepEqual(patyamshaDasha([], 0, 360), []);
