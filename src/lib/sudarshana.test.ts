import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { SUDARSHANA_DRAWING, SUDARSHANA_RINGS, jdToLocalParts, signOfHouse, sudarshanaApplies, sudarshanaFacts, sudarshanaHouse, sudarshanaRings, sudarshanaSubPeriods, sudarshanaVerdict } from './sudarshana';

// --- The signs of a house ----------------------------------------------------------------------------------------------
assert.equal(signOfHouse(1, 1), 1);
assert.equal(signOfHouse(4, 1), 4, 'the first house is the reference sign itself');
assert.equal(signOfHouse(4, 10), 1, 'Cancer: the 10th is Aries');
assert.equal(signOfHouse(12, 2), 1, 'round the zodiac');
assert.equal(signOfHouse(7, 12), 6);

// --- The three rings ------------------------------------------------------------------------------------------------------
const planet = (name: string, sign: number): PlanetData => ({ name, sign, degree: 10, longitude: (sign - 1) * 30 + 10, house: sign });
const grahas = [planet('Sun', 7), planet('Moon', 4), planet('Mars', 10), planet('Mercury', 7), planet('Jupiter', 4), planet('Venus', 8), planet('Saturn', 1), planet('Rahu', 3), planet('Ketu', 9)];
const rings = sudarshanaRings(1, 4, 7, grahas);
assert.deepEqual(rings.map(ring => ring.id), [...SUDARSHANA_RINGS]);
assert.deepEqual(rings.map(ring => ring.referenceSign), [1, 4, 7]);
for (const ring of rings) {
  assert.equal(ring.houses.length, 12);
  assert.deepEqual(ring.houses.map(house => house.house), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(new Set(ring.houses.map(house => house.sign)).size, 12, 'every sign once in a ring');
  assert.equal(ring.houses[0].sign, ring.referenceSign);
}
// The same house number in the three rings: house 3 is Gemini from the Lagna, Libra from the Moon, Sagittarius from the Sun.
assert.deepEqual(rings.map(ring => ring.houses[2].sign), [3, 6, 9]);
assert.equal(rings[0].houses[2].lord, 'Mercury');
assert.deepEqual(rings[1].houses[0].planets, ['Moon', 'Jupiter'], 'the grahas in the sign, in the order given');
assert.deepEqual(rings[2].houses[0].planets, ['Sun', 'Mercury']);
assert.deepEqual(rings[0].houses[0].planets, ['Saturn'], 'Aries holds Saturn');
// Every graha is in exactly one house of every ring.
for (const ring of rings) assert.equal(ring.houses.flatMap(house => house.planets).length, grahas.length);

// --- The house a period makes active -------------------------------------------------------------------------------------
assert.equal(sudarshanaHouse(0), 1, 'the first year of life: the 1st house');
assert.equal(sudarshanaHouse(1), 2);
assert.equal(sudarshanaHouse(11), 12);
assert.equal(sudarshanaHouse(12), 1, 'the 13th year: the 1st again');
assert.equal(sudarshanaHouse(25), 2);
assert.equal(sudarshanaHouse(120), 1);
assert.equal(sudarshanaHouse(0, 5), 6, 'the 6th month of the first year');
assert.equal(sudarshanaHouse(1, 11), 1, 'the last month of the second year is the 12th house on from the 2nd, round to the 1st');
assert.equal(sudarshanaHouse(1, 0, 3), 5, 'the 4th Pratyantara of the 1st month of the second year');
assert.equal(sudarshanaHouse(-1), 12, 'a count before birth stays inside 1 to 12');

// --- A period in twelve ----------------------------------------------------------------------------------------------------
const months = sudarshanaSubPeriods(2451545, 2451545 + 365.25, 3);
assert.equal(months.length, 12);
assert.deepEqual(months.map(month => month.house), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2], 'the first month has the house of the year, the rest follow');
assert.equal(months[0].startJd, 2451545);
assert.equal(months[11].endJd, 2451545 + 365.25, 'the last part ends where the whole does');
for (let index = 1; index < 12; index++) assert.equal(months[index].startJd, months[index - 1].endJd, 'the parts follow without a gap');
for (const month of months) assert.ok(Math.abs(month.endJd - month.startJd - 365.25 / 12) < 1e-9, 'equal parts');
// A month is divided into twelve Pratyantara periods, each into twelve Vidāśās.
const firstMonth = sudarshanaSubPeriods(2451545, 2451545 + 365.25 / 12, 4);
assert.deepEqual(firstMonth.map(period => period.house), [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]);
const pratyantaras = sudarshanaSubPeriods(firstMonth[0].startJd, firstMonth[0].endJd, firstMonth[0].house);
assert.deepEqual(pratyantaras.map(period => period.house), [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]);
assert.ok(Math.abs(pratyantaras[0].endJd - pratyantaras[0].startJd - 365.25 / 144) < 1e-9);
const vidasas = sudarshanaSubPeriods(pratyantaras[0].startJd, pratyantaras[0].endJd, pratyantaras[0].house);
assert.deepEqual(vidasas.map(period => period.house), [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]);
assert.ok(Math.abs(vidasas[0].endJd - vidasas[0].startJd - 365.25 / 1728) < 1e-9);

// --- The local time of a Julian day ----------------------------------------------------------------------------------------
assert.deepEqual(jdToLocalParts(2451545, 0), { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 });
assert.deepEqual(jdToLocalParts(2451545, 5.5), { year: 2000, month: 1, day: 1, hour: 17, minute: 30, second: 0 });
assert.deepEqual(jdToLocalParts(2451545, -5), { year: 2000, month: 1, day: 1, hour: 7, minute: 0, second: 0 });
assert.deepEqual(jdToLocalParts(2451545.75, 0), { year: 2000, month: 1, day: 2, hour: 6, minute: 0, second: 0 }, 'over midnight');

// --- What stands in a house ----------------------------------------------------------------------------------------------------
// The Moon ring's 1st house is Cancer. The Moon and Jupiter stand in it; of the others only Mars in Capricorn casts an
// aspect on it (its 7th). Saturn in Aries looks at Gemini, Libra and Capricorn; Rahu in Gemini at Libra, Sagittarius and
// Aquarius; Ketu in Sagittarius at Aries, Gemini and Leo; the Sun and Mercury in Libra at Aries; Venus in Scorpio at Taurus.
const facts = sudarshanaFacts(rings[1], 1, grahas);
assert.deepEqual(facts.occupants, ['Moon', 'Jupiter']);
assert.deepEqual(facts.aspecting, ['Mars']);
assert.deepEqual(facts.lordPlace, { lord: 'Moon', sign: 4, house: 1 }, 'the lord of Cancer is the Moon, in Cancer: the 1st house of the Moon ring');
assert.equal(facts.benefics, 1, 'Jupiter (the Moon, 90° short of the full Moon, is neither)');
assert.equal(facts.malefics, 1, 'Mars');
// The Lagna ring's 3rd house is Gemini: Rahu stands in it; Saturn (3rd aspect) and Ketu (7th aspect) look at it.
const gemini = sudarshanaFacts(rings[0], 3, grahas);
assert.deepEqual(gemini.occupants, ['Rahu']);
assert.deepEqual(gemini.aspecting.sort(), ['Ketu', 'Saturn']);
assert.deepEqual(gemini.lordPlace, { lord: 'Mercury', sign: 7, house: 7 }, 'the lord of Gemini, Mercury, is in Libra: the 7th from Aries');

// --- BPHS 74: the order of the rings and when the chakra is used ---------------------------------------------------------
assert.deepEqual([...SUDARSHANA_DRAWING], ['sun', 'moon', 'lagna'], 'the Sun\'s chart is the outermost ring and the Lagna\'s the innermost');
assert.deepEqual([...SUDARSHANA_RINGS], ['lagna', 'moon', 'sun'], 'the order they are read in');
assert.equal(sudarshanaApplies(1, 4, 7), true, 'three different signs');
assert.equal(sudarshanaApplies(1, 4, 4), false, 'the Moon and the Sun in one sign');
assert.equal(sudarshanaApplies(6, 6, 6), false);

// --- The verdict on a house ----------------------------------------------------------------------------------------------------
const verdict = (ring: number, house: number) => sudarshanaVerdict(rings[ring], house, grahas);
// The grahas in the house decide. The Moon ring's 1st house is Cancer: Jupiter (benefic) and the Moon (90° short of the full Moon, neither).
assert.deepEqual(verdict(1, 1), { basis: 'occupants', nature: 'benefic', benefics: ['Jupiter'], malefics: [] });
// Gemini of the Lagna ring holds Rahu.
assert.deepEqual(verdict(0, 3), { basis: 'occupants', nature: 'malefic', benefics: [], malefics: ['Rahu'] });
// The Sun is a benefic only in the 1st house of the ring: in the Sun ring's Libra it is one, and Mercury, with the Sun in its sign, is a malefic: mixed.
assert.deepEqual(verdict(2, 1), { basis: 'occupants', nature: 'mixed', benefics: ['Sun'], malefics: ['Mercury'] });
// In the Lagna ring Libra (the 7th house) holds the same two, and now the Sun is a malefic too: two malefics.
assert.deepEqual(verdict(0, 7), { basis: 'occupants', nature: 'malefic', benefics: [], malefics: ['Sun', 'Mercury'] });
// With none in the house the grahas that aspect it decide: Taurus (2nd of the Lagna ring) is aspected only by Venus in Scorpio.
assert.deepEqual(verdict(0, 2), { basis: 'aspects', nature: 'benefic', benefics: ['Venus'], malefics: [] });
// With none of those either, the lord: nothing stands in or aspects Virgo (6th of the Lagna ring); its lord Mercury is a malefic with the Sun.
assert.deepEqual(verdict(0, 6), { basis: 'lord', nature: 'malefic', benefics: [], malefics: ['Mercury'] });

// A malefic in its exaltation sign does no harm, so the grahas that aspect the house decide instead.
const second = [planet('Sun', 2), planet('Moon', 2), planet('Mars', 5), planet('Mercury', 5), planet('Jupiter', 12), planet('Venus', 12), planet('Saturn', 7), planet('Rahu', 9), planet('Ketu', 3)];
const ring = sudarshanaRings(1, 2, 3, second)[0];
// Libra holds Saturn, exalted there; Ketu in Gemini aspects Libra by its 5th aspect.
assert.deepEqual(sudarshanaVerdict(sudarshanaRings(7, 2, 3, second)[0], 1, second), { basis: 'aspects', nature: 'malefic', benefics: [], malefics: ['Ketu'] });
assert.equal(ring.houses[0].sign, 1);

console.log('sudarshana tests passed');
