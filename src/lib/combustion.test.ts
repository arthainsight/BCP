import assert from 'node:assert/strict';
import { COMBUSTION_ORBS, angularSeparation, combustionOf } from './combustion';

// The classical orbs.
assert.deepEqual(Object.fromEntries(Object.entries(COMBUSTION_ORBS).map(([name, orb]) => [name, orb.direct])), { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 });
assert.equal(COMBUSTION_ORBS.Mercury.retrograde, 12);
assert.equal(COMBUSTION_ORBS.Venus.retrograde, 8);
for (const name of ['Moon', 'Mars', 'Jupiter', 'Saturn']) assert.equal(COMBUSTION_ORBS[name].retrograde, COMBUSTION_ORBS[name].direct, `${name} has one orb`);

// The separation goes round the end of the zodiac.
assert.equal(angularSeparation(359, 1), 2);
assert.equal(angularSeparation(1, 359), 2);
assert.equal(angularSeparation(10, 190), 180);

// Mercury 13° from the Sun is combust when direct (orb 14°) and not when retrograde (orb 12°).
const direct = combustionOf('Mercury', 113, 100)!;
assert.equal(direct.orb, 14);
assert.equal(direct.distance, 13);
assert.equal(direct.retrograde, false);
assert.equal(combustionOf('Mercury', 113, 100, true), null);
// Exactly at the orb is combust; a hair outside is not.
assert.ok(combustionOf('Venus', 110, 100));
assert.equal(combustionOf('Venus', 110.01, 100), null);
assert.equal(combustionOf('Venus', 108, 100, true)!.orb, 8);
assert.equal(combustionOf('Venus', 108.5, 100, true), null);
// Round the end of the zodiac, either side of the Sun.
assert.ok(combustionOf('Mars', 5, 355));
assert.ok(combustionOf('Mars', 350, 5));
assert.equal(combustionOf('Mars', 30, 5), null);
// The Moon, Jupiter and Saturn each with their own orb.
assert.ok(combustionOf('Moon', 12, 0));
assert.equal(combustionOf('Moon', 12.5, 0), null);
assert.ok(combustionOf('Jupiter', 11, 0));
assert.equal(combustionOf('Jupiter', 11.5, 0), null);
assert.ok(combustionOf('Saturn', 15, 0));
// Never the Sun, the nodes or the outer planets.
for (const name of ['Sun', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto']) assert.equal(combustionOf(name, 1, 0), null, name);

console.log('Combustion tests passed');
