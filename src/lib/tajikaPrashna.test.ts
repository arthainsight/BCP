import assert from 'node:assert/strict';
import { DIPTAMSHA, HOUSE_MATTERS, moonGrade, naktaYogas, pairYoga, readPrashna, type PrashnaBody } from './tajikaPrashna';

const body = (name: string, sign: number, degree: number, speed?: number): PrashnaBody => ({ name, sign, degree, speed });

// The dīptāṁśa: the Sun 15, the Moon 12, Mars 8, Mercury 7, Jupiter 9, Venus 7, Saturn 9.
assert.deepEqual(DIPTAMSHA, { Sun: 15, Moon: 12, Mars: 8, Mercury: 7, Jupiter: 9, Venus: 7, Saturn: 9 });
assert.equal(Object.keys(HOUSE_MATTERS).length, 12);

// Ithasāla: Mercury (the swifter) at 10° of Leo is behind Jupiter at 16° of Gemini (the 11th from Leo: a sextile); the gap of 6° is within the 7° of Mercury.
const ithasala = pairYoga(body('Mercury', 5, 10, 1.4), body('Jupiter', 3, 16, 0.1))!;
assert.equal(ithasala.kind, 'ithasala');
assert.equal(ithasala.fast, 'Mercury');
assert.equal(ithasala.slow, 'Jupiter');
assert.equal(ithasala.aspect, 'sextile');
assert.equal(ithasala.gap, 6);
// Not when the gap is more than the dīptāṁśa of the swifter (7), nor when the signs have no aspect (the 2nd from each other).
assert.equal(pairYoga(body('Mercury', 5, 10, 1.4), body('Jupiter', 3, 18, 0.1)), null);
assert.equal(pairYoga(body('Mercury', 5, 10, 1.4), body('Jupiter', 6, 12, 0.1)), null);
// Īśarāpha: the swifter is a degree or more past the slower.
const isarapha = pairYoga(body('Mercury', 5, 14, 1.4), body('Jupiter', 3, 12, 0.1))!;
assert.equal(isarapha.kind, 'isarapha');
assert.equal(isarapha.gap, -2);
// Less than a degree past it is still the Ithasāla; past it by more than the orb, nothing.
assert.equal(pairYoga(body('Mercury', 5, 12.5, 1.4), body('Jupiter', 3, 12, 0.1))!.kind, 'ithasala');
assert.equal(pairYoga(body('Mercury', 5, 25, 1.4), body('Jupiter', 3, 12, 0.1)), null);
// The same sign is a conjunction and counts.
assert.equal(pairYoga(body('Venus', 2, 5, 1.2), body('Saturn', 2, 9, 0.03))!.aspect, 'conjunction');
// The swifter is told by the speed, not by the order given: Venus (swifter) at 9° is ahead of Saturn at 5°, so it has passed it by 4°.
const passed = pairYoga(body('Saturn', 2, 5, 0.03), body('Venus', 2, 9, 1.2))!;
assert.equal(passed.fast, 'Venus');
assert.equal(passed.kind, 'isarapha');

// Nakta: Mars in Aries 5° and Venus in Taurus 20° have no aspect (the 2nd from each other). The Moon in Aquarius 12° is swifter than both,
// between their degrees, a sextile to Aries (the 3rd) and a square to Taurus (the 4th), 7° from Mars and 8° from Venus, both within its 12°.
const mars = body('Mars', 1, 5, 0.5);
const venus = body('Venus', 2, 20, 1.2);
assert.equal(pairYoga(mars, venus), null);
const nakta = naktaYogas(mars, venus, [body('Moon', 11, 12, 13)]);
assert.equal(nakta.length, 1);
assert.equal(nakta[0].carrier, 'Moon');
assert.equal(nakta[0].behind, 'Mars');
assert.equal(nakta[0].ahead, 'Venus');
assert.equal(nakta[0].fromBehind, 7);
assert.equal(nakta[0].toAhead, 8);
// Not a carrier: outside the degrees between, slower than one of them, or no aspect to one of them.
assert.deepEqual(naktaYogas(mars, venus, [body('Moon', 11, 3, 13)]), []);
assert.deepEqual(naktaYogas(mars, venus, [body('Jupiter', 11, 12, 0.1)]), []);
assert.deepEqual(naktaYogas(mars, venus, [body('Moon', 6, 12, 13)]), []);
// Nor when the two do have an aspect between them.
assert.deepEqual(naktaYogas(body('Mars', 1, 5, 0.5), body('Venus', 3, 20, 1.2), [body('Moon', 11, 12, 13)]), []);

// The Moon's grade: Cancer and Taurus the best, Scorpio the lowest.
assert.equal(moonGrade(4), 'uttama');
assert.equal(moonGrade(2), 'uttama');
assert.equal(moonGrade(8), 'adhama');
assert.equal(moonGrade(6), 'sama');

// A reading: Libra Lagna (lord Venus), a question of the 10th (Cancer, lord the Moon). The Moon in Gemini 5° is behind Venus in Leo 10° (a sextile).
const all = [body('Sun', 7, 3, 1), body('Moon', 3, 5, 13), body('Mars', 8, 20, 0.5), body('Mercury', 7, 28, 1.4), body('Jupiter', 12, 8, 0.1), body('Venus', 5, 10, 1.2), body('Saturn', 10, 15, 0.03)];
const reading = readPrashna(7, all, 10)!;
assert.equal(reading.lagnesha, 'Venus');
assert.equal(reading.karyesha, 'Moon');
assert.equal(reading.pair!.kind, 'ithasala');
assert.equal(reading.pair!.fast, 'Moon');
assert.equal(reading.days, 60, 'five degrees times twelve');
assert.equal(reading.kambula, null, 'the Moon is one of the two');
// The 7th from Libra is Aries: Mars.
assert.equal(readPrashna(7, all, 7)!.karyesha, 'Mars');
// The first house: one lord for both.
const first = readPrashna(7, all, 1)!;
assert.equal(first.sameLord, true);
assert.equal(first.pair, null);
// The Kambūla: Aries Lagna (Mars in Aries 5°), a question of the 5th (Leo, the Sun at Leo 2°): the Sun is behind Mars by 3° (a trine). The Moon in Gemini 1° is behind both: 4° behind Mars (a sextile) and 1° behind the Sun (a sextile).
const kambula = readPrashna(1, [body('Sun', 5, 2, 1), body('Moon', 3, 1, 13), body('Mars', 1, 5, 0.5), body('Mercury', 6, 20, 1.4), body('Jupiter', 12, 8, 0.1), body('Venus', 7, 25, 1.2), body('Saturn', 10, 15, 0.03)], 5)!;
assert.equal(kambula.karyesha, 'Sun');
assert.equal(kambula.pair!.kind, 'ithasala');
assert.equal(kambula.pair!.fast, 'Sun');
assert.ok(kambula.kambula, 'the Ithasāla of the Moon with both');
assert.equal(kambula.kambula!.withLagnesha!.gap, 4);
assert.equal(kambula.kambula!.withKaryesha!.gap, 1);
assert.equal(kambula.kambula!.grade, 'sama');
// Without the Moon in Ithasāla with either, no Kambūla.
assert.equal(readPrashna(1, [body('Sun', 5, 2, 1), body('Moon', 3, 25, 13), body('Mars', 1, 5, 0.5), body('Mercury', 6, 20, 1.4), body('Jupiter', 12, 8, 0.1), body('Venus', 7, 25, 1.2), body('Saturn', 10, 15, 0.03)], 5)!.kambula, null);
// Fewer than seven grahas: no reading.
assert.equal(readPrashna(1, [body('Sun', 5, 2, 1)], 5), null);
