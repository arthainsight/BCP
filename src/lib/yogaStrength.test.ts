import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import type { YogaResult } from './yogas';
import { qualifyYogas, scoreGraha, type YogaStrengthBreakdown } from './yogaStrength';

// ---------------------------------------------------------------------------
// The strength of a yoga after "Qualifying Yogas" (Ernst Wilhelm): the points of the table of the Subha / Asubha yoga, worked out
// here by hand for small charts. A planet that is not named is not in the chart, so only what a case is about is counted.
// ---------------------------------------------------------------------------
const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: sign });
const ZERO: YogaStrengthBreakdown = { rasi: 0, dignity: 0, navamsa: 0, navamsaDignity: 0, vargottama: 0, tara: 0, conjunctions: 0, aspects: 0, kartari: 0 };
const expectScore = (name: string, planets: PlanetData[], expected: Partial<YogaStrengthBreakdown>, label: string, adjust = 0) =>
  assert.deepEqual(scoreGraha(name, planets, adjust), { ...ZERO, ...expected }, label);

// --- Rāśi, Navamsa, dignity and vargottama ----------------------------------------------------------------------------------
// Venus at 5° Taurus: Taurus is ruled by a benefic (+30) and is Venus's own sign (+30). Its Navamsa: 35° x 9 = 315° = 15° Aquarius,
// a malefic sign (-30) with no dignity for Venus.
expectScore('Venus', [planet('Venus', 2, 5)], { rasi: 30, dignity: 30, navamsa: -30 }, 'a planet at home in a benefic sign, in a malefic Navamsa');
// Mars at 5° Cancer is debilitated in a benefic sign: the sign does not help (0) and the dignity is -60. Navamsa: 95° x 9 = 135° = 15° Leo.
expectScore('Mars', [planet('Mars', 4, 5)], { rasi: 0, dignity: -60, navamsa: -30 }, 'a debilitated planet in a benefic sign: no +30');
// Mars at 1° Aries: Aries is a malefic sign but Mars's own and its moolatrikona (0° to 12°): no -30, +45. Its Navamsa is 9° Aries, the
// same sign (vargottama +60), again the moolatrikona: no -30, +45.
expectScore('Mars', [planet('Mars', 1, 1)], { dignity: 45, navamsaDignity: 45, vargottama: 60 }, 'a planet at home in a malefic sign and vargottama');
// Saturn at 1° Aries is debilitated; its Navamsa is Aries too (vargottama): the malefic sign is not held against it (0), the
// dignity is -60 in both, and the vargottama +60.
expectScore('Saturn', [planet('Saturn', 1, 1)], { dignity: -60, navamsaDignity: -60, vargottama: 60 }, 'a vargottama planet: the malefic sign is not held against it');

// --- Conjunctions: the planet that joins counts by its own dignity ------------------------------------------------------------
// Mercury at 20° Gemini (+30 for the benefic sign, +30 as it is at home there; its Navamsa 80° x 9 = 720° = 0° Aries, a malefic sign: -30)
// with Jupiter (1° Gemini: Navamsa 9° Libra, not debilitated: +60), Saturn (5° Gemini: Navamsa 15° Scorpio, no dignity: -60) and Mars
// (2° Gemini: Navamsa 18° Libra, none: -60).
expectScore('Mercury', [planet('Mercury', 3, 20), planet('Jupiter', 3, 1), planet('Saturn', 3, 5), planet('Mars', 3, 2)],
  { rasi: 30, dignity: 30, navamsa: -30, conjunctions: -60 }, 'a benefic and two malefics join');
// A malefic exalted gives +30 (Saturn at 5° Libra with Venus), in its moolatrikona +15 (the Sun at 10° Leo with Mercury), nothing in its
// own sign (Mars at 20° Scorpio with Venus) or when vargottama (Saturn at 1° Aries with Venus).
const conj = (name: string, planets: [string, number, number][]) => scoreGraha(name, planets.map(([n, s, d]) => planet(n, s, d)))!.conjunctions;
assert.equal(conj('Venus', [['Venus', 7, 20], ['Saturn', 7, 5]]), 30, 'a malefic exalted');
assert.equal(conj('Mercury', [['Mercury', 5, 5], ['Sun', 5, 10]]), 15, 'a malefic in its moolatrikona');
assert.equal(conj('Venus', [['Venus', 8, 20], ['Mars', 8, 5]]), 0, 'a malefic in its own sign (Mars at 5° Scorpio, Navamsa 15° Leo)');
assert.equal(conj('Venus', [['Venus', 8, 5], ['Mars', 8, 20]]), 30, 'a malefic in its own sign but exalted in the Navamsa (Mars at 20° Scorpio: 0° Capricorn)');
assert.equal(conj('Venus', [['Venus', 1, 20], ['Saturn', 1, 1]]), 0, 'a malefic that is vargottama');
// A benefic that is debilitated gives nothing: Jupiter at 5° Capricorn with the Sun counts 0 to the Sun.
assert.equal(conj('Sun', [['Sun', 10, 10], ['Jupiter', 10, 5]]), 0, 'a benefic that is debilitated');
// The natural nature counts, not the temporal: Mercury stays a benefic with Saturn, so Jupiter with both has +60 -60.
assert.equal(conj('Jupiter', [['Jupiter', 6, 10], ['Mercury', 6, 5], ['Saturn', 6, 20]]), 0, 'Mercury is a benefic with a malefic too');
// The Moon: a benefic 150° from the Sun (+60), neutral 95° from it (0), a malefic 25° before it (-60).
assert.equal(conj('Jupiter', [['Jupiter', 6, 20], ['Moon', 6, 10], ['Sun', 1, 10]]), 60, 'the Moon, a benefic');
assert.equal(conj('Venus', [['Venus', 4, 20], ['Moon', 4, 5], ['Sun', 1, 0]]), 0, 'the Moon, neutral');
assert.equal(conj('Jupiter', [['Jupiter', 12, 20], ['Moon', 12, 5], ['Sun', 1, 10]]), -60, 'the Moon, a malefic');

// --- Aspects of the whole sign, in virupas ---------------------------------------------------------------------------------
// Mercury at 10° Cancer (rāśi +30; Navamsa 100° x 9 = 900° = 0° Libra, a benefic sign: +30), aspected by Jupiter from Scorpio (the 9th from
// Scorpio: full 60, not debilitated: +60), by Mars from Capricorn (the 7th: 60; Mars is exalted: +30) and by Saturn from Aries (the
// 4th: 45; Saturn is debilitated, not vargottama: -45).
expectScore('Mercury', [planet('Mercury', 4, 10), planet('Jupiter', 8, 10), planet('Mars', 10, 10), planet('Saturn', 1, 10)],
  { rasi: 30, navamsa: 30, aspects: 45 }, 'aspects in virupas');
// The full aspects are those of the planet: Saturn aspects the 3rd and the 10th in full, Mars the 4th and the 8th, Jupiter the 5th and the 9th;
// every planet the 7th in full and the others in part (3rd, 10th: 15; 5th, 9th: 30; 4th, 8th: 45). The planets aspect from 20° Taurus
// (Navamsa 0° Cancer: no dignity for Saturn, Mars or the Sun, Jupiter exalted there, so not debilitated).
const aspect = (from: string, toSign: number) => scoreGraha('Venus', [planet('Venus', toSign, 15), planet(from, 2, 20)])!.aspects;
assert.equal(aspect('Saturn', 4), -60, 'Saturn on the 3rd: full');
assert.equal(aspect('Mars', 4), -15, 'Mars on the 3rd: a quarter');
assert.equal(aspect('Mars', 5), -60, 'Mars on the 4th: full');
assert.equal(aspect('Sun', 5), -45, 'the Sun on the 4th: three quarters');
assert.equal(aspect('Sun', 8), -60, 'the Sun on the 7th: full');
assert.equal(aspect('Sun', 3), 0, 'nothing on the 2nd');
assert.equal(aspect('Jupiter', 6), 60, 'Jupiter on the 5th: full, and a benefic');
assert.equal(aspect('Jupiter', 7), 0, 'nothing on the 6th');
assert.equal(aspect('Jupiter', 10), 60, 'Jupiter on the 9th (Capricorn) is full too');
assert.equal(aspect('Saturn', 2), 0, 'a planet in the same sign is a conjunction, not an aspect');

// --- Tara from the Janma nakshatra ----------------------------------------------------------------------------------------------
const tara = (longitudeSign: number, degree: number, adjust = 0) => scoreGraha('Mercury', [planet('Moon', 1, 0), planet('Mercury', longitudeSign, degree)], adjust)!.tara;
assert.equal(tara(1, 5), 60, 'the Janma nakshatra itself: the 1st is auspicious');
assert.equal(tara(2, 15), 60, 'the 4th nakshatra from the Janma: auspicious');
assert.equal(tara(2, 5), -60, 'the 3rd: inauspicious');
assert.equal(tara(3, 5), -60, 'the 5th: inauspicious');
assert.equal(tara(5, 5), 60, 'the 10th is the 1st of the next round of nine: auspicious');
assert.equal(scoreGraha('Moon', [planet('Moon', 1, 0), planet('Mercury', 2, 5)])!.tara, 0, 'the Moon has no Tara');
assert.equal(tara(2, 15, 9), -60, 'in a nakshatra zodiac 9 degrees on the Moon is in the 1st and Mercury in the 5th nakshatra');

// --- Hemmed between the signs on either side ----------------------------------------------------------------------------------
const hemmed = (before: string, after: string) => scoreGraha('Venus', [planet('Venus', 3, 10), planet(before, 2, 5), planet(after, 4, 5)])!.kartari;
assert.equal(hemmed('Jupiter', 'Mercury'), 60, 'between benefics');
assert.equal(hemmed('Saturn', 'Rahu'), -60, 'between malefics');
assert.equal(hemmed('Jupiter', 'Rahu'), 0, 'between a benefic and a malefic');

// --- A yoga: the sum, the average and the Subha / Asubha / Misra influence ------------------------------------------------------
const stub = (planetsInvolved: string[]): YogaResult => ({ id: 'z', name: 'Z', category: 'general', status: 'active', referencePlanet: 'Moon', planetsInvolved, rule: 'r', resultText: 't' });
// Venus at 5° Taurus (the first case): +30 for a benefic sign, -30 for the malefic Navamsa, so one influence of each: Misra.
const venusOnly = qualifyYogas([stub(['Venus'])], [planet('Venus', 2, 5)])[0];
assert.equal(venusOnly.strength, 30, 'rāśi +30, dignity +30, Navamsa -30');
assert.equal(venusOnly.subhaCount, 1);
assert.equal(venusOnly.asubhaCount, 1);
assert.equal(venusOnly.influence, 'Misra');
// Jupiter exalted at 5° Cancer, with Venus (exalted? no: Venus in Cancer) -- a chart with only benefic influences is Subha.
const subha = qualifyYogas([stub(['Jupiter'])], [planet('Jupiter', 4, 5), planet('Venus', 4, 20)])[0];
assert.equal(subha.influence, 'Subha');
assert.ok(subha.subhaCount > subha.asubhaCount);
// A planet with malefic influences only is Asubha: Saturn at 10° Aries (debilitated, malefic sign, Navamsa Cancer) with Mars.
const asubha = qualifyYogas([stub(['Saturn'])], [planet('Saturn', 1, 10), planet('Rahu', 1, 20)])[0];
assert.equal(asubha.influence, 'Asubha');
// The Tara is counted in the nakshatra zodiac that is passed.
const withMoon = [planet('Moon', 1, 0), planet('Mercury', 2, 15)];
assert.equal(qualifyYogas([stub(['Mercury'])], withMoon)[0].breakdown!.tara, 60);
assert.equal(qualifyYogas([stub(['Mercury'])], withMoon, 9)[0].breakdown!.tara, -60);
// An inactive yoga has no strength and no influence.
const inactive = qualifyYogas([{ ...stub(['Venus']), status: 'inactive' }], [planet('Venus', 2, 5)])[0];
assert.equal(inactive.strength, null);
assert.equal(inactive.influence, null);

console.log('Yoga strength tests passed');
