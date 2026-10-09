import assert from 'node:assert/strict';
import { DIRECTIONS, buildCompass, signDirection } from './directions';

// --- Signs: fire east, earth south, air west, water north -----------------------
assert.deepEqual([1, 5, 9].map(signDirection), ['East', 'East', 'East']);
assert.deepEqual([2, 6, 10].map(signDirection), ['South', 'South', 'South']);
assert.deepEqual([3, 7, 11].map(signDirection), ['West', 'West', 'West']);
assert.deepEqual([4, 8, 12].map(signDirection), ['North', 'North', 'North']);
assert.deepEqual(DIRECTIONS, ['North', 'East', 'South', 'West']);

// --- The example of the Nadi book: Sun 4°38' and Mercury R 17°21' in Pisces, Venus 12° in Aquarius, Saturn 21° and
// --- Mars 29° in Capricorn, Rahu 12°15' in Sagittarius, Ketu 12°15' in Gemini, Jupiter R 13°38' in Leo, Moon 4°30' in Virgo
const body = (name: string, sign: number, degree: number, retrograde = false) => ({ name, sign, degree, retrograde });
const book = [
  body('Sun', 12, 4.63), body('Mercury', 12, 17.35, true), body('Venus', 11, 12), body('Saturn', 10, 21), body('Mars', 10, 29),
  body('Rahu', 9, 12.25, true), body('Ketu', 3, 12.25, true), body('Jupiter', 5, 13.63, true), body('Moon', 6, 4.5),
];
const compass = buildCompass(book);
assert.deepEqual(compass.bodies.North.map(p => p.name), ['Sun', 'Mercury'], 'Pisces is water: north, lowest degree on the left');
assert.deepEqual(compass.bodies.West.map(p => p.name), ['Venus', 'Ketu'], 'Aquarius and Gemini are air: west');
assert.deepEqual(compass.bodies.East.map(p => p.name), ['Rahu', 'Jupiter'], 'Sagittarius and Leo are fire: east');
assert.deepEqual(compass.bodies.South.map(p => p.name), ['Moon', 'Saturn', 'Mars'], 'Virgo and Capricorn are earth: south, by degree and not by sign');
assert.deepEqual(compass.aspects.West.map(p => p.name), ['Mercury'], 'Mercury R in Pisces aspects Aquarius: [Mer] in the west');
assert.deepEqual(compass.aspects.North.map(p => p.name), ['Jupiter'], 'Jupiter R in Leo aspects Cancer: [Jup] in the north');
assert.equal(compass.aspects.North[0].sign, 4);
assert.equal(compass.aspects.North[0].fromSign, 5);
assert.deepEqual(compass.aspects.East, [], 'the nodes have no bracket');
assert.deepEqual(compass.aspects.South, []);

// --- The direction belongs to the sign, whatever the ascendant: nothing here knows about houses ----------
assert.equal(buildCompass.length, 1, 'the chart is made from the grahas alone');
assert.ok(compass.bodies.North.every(item => !('house' in item) && !('digBala' in item) && !('transit' in item)));

// --- Aries retrograde aspects Pisces, across the turn of the zodiac -----------------------
const turn = buildCompass([body('Mars', 1, 10, true)]);
assert.deepEqual(turn.bodies.East.map(p => p.name), ['Mars']);
assert.deepEqual(turn.aspects.North.map(p => [p.name, p.sign]), [['Mars', 12]], 'the 12th from Aries is Pisces: north');

// --- Every graha is in exactly one direction ------------------------------------------------------
const placed = DIRECTIONS.flatMap(direction => compass.bodies[direction].map(item => item.name)).sort();
assert.deepEqual(placed, book.map(item => item.name).sort());

console.log('Direction tests passed');
