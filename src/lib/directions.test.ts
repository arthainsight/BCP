import assert from 'node:assert/strict';
import { DIG_BALA_DIRECTION, buildCompass, houseDirection, signDirection } from './directions';

// --- Signs: fire east, earth south, air west, water north -----------------------
assert.deepEqual([1, 5, 9].map(signDirection), ['East', 'East', 'East']);
assert.deepEqual([2, 6, 10].map(signDirection), ['South', 'South', 'South']);
assert.deepEqual([3, 7, 11].map(signDirection), ['West', 'West', 'West']);
assert.deepEqual([4, 8, 12].map(signDirection), ['North', 'North', 'North']);

// --- Houses: 1st east, 4th north, 7th west, 10th south ---------------------------
assert.equal(houseDirection(1), 'East');
assert.equal(houseDirection(4), 'North');
assert.equal(houseDirection(7), 'West');
assert.equal(houseDirection(10), 'South');

// --- Dig Bala directions match the angular houses ---------------------------------
assert.equal(DIG_BALA_DIRECTION.Jupiter, houseDirection(1));
assert.equal(DIG_BALA_DIRECTION.Sun, houseDirection(10));
assert.equal(DIG_BALA_DIRECTION.Saturn, houseDirection(7));
assert.equal(DIG_BALA_DIRECTION.Moon, houseDirection(4));

// --- The example of the Nadi book: Sun 4°38' and Mercury R 17°21' in Pisces, Venus 12° in Aquarius, Saturn 21° and
// --- Mars 29° in Capricorn, Rahu 12°15' in Sagittarius, Ketu 12°15' in Gemini, Jupiter R 13°38' in Leo, Moon 4°30' in Virgo
const body = (name: string, sign: number, degree: number, retrograde = false) => ({ name, sign, degree, retrograde });
const book = [
  body('Sun', 12, 4.63), body('Mercury', 12, 17.35, true), body('Venus', 11, 12), body('Saturn', 10, 21), body('Mars', 10, 29),
  body('Rahu', 9, 12.25, true), body('Ketu', 3, 12.25, true), body('Jupiter', 5, 13.63, true), body('Moon', 6, 4.5),
];
const compass = buildCompass(12, book, 'sign');
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
assert.equal(compass.bodies.South[0].digBala, false, 'the Moon is strong in the north, not the south');
assert.equal(compass.bodies.South[1].digBala, false);
assert.equal(buildCompass(12, [body('Moon', 4, 1)], 'sign').bodies.North[0].digBala, true, 'the Moon in the north has Dig Bala');
assert.equal(buildCompass(12, [body('Saturn', 11, 1)], 'sign').bodies.West[0].digBala, true, 'Saturn in the west has Dig Bala');

// --- Aries retrograde aspects Pisces, across the turn of the zodiac -----------------------
const turn = buildCompass(1, [body('Mars', 1, 10, true)], 'sign');
assert.deepEqual(turn.bodies.East.map(p => p.name), ['Mars']);
assert.deepEqual(turn.aspects.North.map(p => [p.name, p.sign]), [['Mars', 12]], 'the 12th from Aries is Pisces: north');

// --- By house: the 1st house is east whatever the sign ----------------------------------------
const byHouse = buildCompass(5, [body('Sun', 5, 3), body('Moon', 4, 3), body('Saturn', 11, 3), body('Rahu', 2, 3), body('Venus', 6, 8, true)], 'house');
assert.deepEqual(byHouse.bodies.East.map(p => p.name), ['Sun'], 'the 1st house is east');
assert.deepEqual(byHouse.bodies.North.map(p => p.name), ['Moon'], 'the 12th house is north');
assert.deepEqual(byHouse.bodies.West.map(p => p.name), ['Saturn'], 'the 7th house is west');
assert.deepEqual(byHouse.bodies.South.map(p => p.name), ['Rahu', 'Venus'], 'the 10th and the 2nd house are south');
assert.deepEqual(byHouse.aspects.East.map(p => [p.name, p.house]), [['Venus', 1]], 'Venus R in the 2nd house aspects the 1st: east');

// --- Transits are kept apart --------------------------------------------------------------------
const withTransit = buildCompass(1, [{ ...body('Sun', 1, 5), transit: true }, body('Moon', 1, 9)], 'sign');
assert.deepEqual(withTransit.bodies.East.map(p => [p.name, p.transit]), [['Sun', true], ['Moon', false]]);

console.log('Direction tests passed');
