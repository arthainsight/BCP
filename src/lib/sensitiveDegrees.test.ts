import assert from 'node:assert/strict';
import {
  GANDANTA_CORE, GANDANTA_ORB, MRITYU_BHAGA, MRITYU_POINTS, PUSHKARA_BHAGA, gandantaOf, mrityuBhagaOf, pushkaraBhagaOf, pushkaraNavamsaOf,
  pushkaraNavamsaRanges, sandhiOf, sensitiveDegreesOf,
} from './sensitiveDegrees';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

// --- Sandhi: within 1° of the boundary of a sign -------------------------------------------------------------------------------------
assert.deepEqual(sandhiOf(0.5), { edge: 'start', distance: 0.5 });
near(sandhiOf(90 + 29.25)!.distance, 0.75);
assert.equal(sandhiOf(90 + 29.25)!.edge, 'end');
assert.equal(sandhiOf(1), null, 'exactly 1° in is out');
assert.equal(sandhiOf(29), null, 'and exactly 1° from the end');
assert.equal(sandhiOf(15), null);
assert.equal(sandhiOf(359.9)!.edge, 'end');
assert.equal(sandhiOf(0)!.edge, 'start');

// --- Gandanta: the last pada of Ashlesha, Jyeshtha, Revati and the first of Magha, Mula, Ashwini ------------------------------------
near(GANDANTA_ORB, 10 / 3);
near(GANDANTA_CORE, 40 / 90);
// Cancer / Leo: Ashlesha is 106°40'–120°, Magha 120°–133°20'.
const ashlesha = gandantaOf(118)!;
assert.equal(ashlesha.nakshatra, 'Ashlesha');
assert.equal(ashlesha.across, 'Magha');
assert.equal(ashlesha.side, 'before');
near(ashlesha.distance, 2);
assert.equal(ashlesha.core, false);
assert.equal(gandantaOf(119.8)!.core, true, 'within 0°26\'40" of the junction');
assert.equal(gandantaOf(116.6), null, 'the third pada of Ashlesha is not in it (the last pada begins at 116°40\')');
const magha = gandantaOf(121)!;
assert.equal(magha.nakshatra, 'Magha');
assert.equal(magha.across, 'Ashlesha');
assert.equal(magha.side, 'after');
near(magha.distance, 1);
assert.equal(gandantaOf(123.4), null, 'the second pada of Magha');
// Scorpio / Sagittarius: Jyeshtha 226°40'–240°, Mula 240°–253°20'.
assert.equal(gandantaOf(239)!.nakshatra, 'Jyeshtha');
assert.equal(gandantaOf(239)!.across, 'Mula');
assert.equal(gandantaOf(241)!.nakshatra, 'Mula');
// Pisces / Aries: Revati 346°40'–360°, Ashwini 0°–13°20', round the end of the zodiac.
assert.equal(gandantaOf(359)!.nakshatra, 'Revati');
assert.equal(gandantaOf(359)!.across, 'Ashwini');
assert.equal(gandantaOf(1)!.nakshatra, 'Ashwini');
assert.equal(gandantaOf(1)!.across, 'Revati');
assert.equal(gandantaOf(0)!.side, 'after');
// Other nakṣatra ends are not junctions of a water and a fire sign (Magha's end, the Moon's own Rohini and the like).
for (const longitude of [50, 133, 200, 266, 300, 340]) assert.equal(gandantaOf(longitude), null, String(longitude));

// --- Mṛtyu Bhāga ------------------------------------------------------------------------------------------------------------------------------
assert.equal(MRITYU_BHAGA.length, 12);
for (const row of MRITYU_BHAGA) {
  assert.equal(row.length, MRITYU_POINTS.length);
  for (const degree of row) assert.ok(degree >= 1 && degree <= 29);
}
// Aries: the Sun's degree is the 20th (an orb of 1/3°), the Moon's the 26th (2/3°), the Lagna's the 1st (2/3°).
assert.deepEqual(mrityuBhagaOf('Sun', 20.3)!.degree, 20);
assert.equal(mrityuBhagaOf('Sun', 20.4), null);
assert.equal(mrityuBhagaOf('Sun', 19.7)!.degree, 20);
assert.equal(mrityuBhagaOf('Sun', 19.6), null);
assert.ok(mrityuBhagaOf('Moon', 26.6));
assert.equal(mrityuBhagaOf('Moon', 26.7), null);
assert.ok(mrityuBhagaOf('Lagna', 1.5));
// Taurus: the Sun's is the 9th; Pisces: Ketu's is the 14th (an orb of ¼°).
assert.ok(mrityuBhagaOf('Sun', 30 + 9.2));
assert.equal(mrityuBhagaOf('Sun', 9.2), null, 'the Aries degree of the Sun is another');
assert.ok(mrityuBhagaOf('Ketu', 330 + 14.2));
assert.equal(mrityuBhagaOf('Ketu', 330 + 14.3), null);
// Each planet reads its own column: Mars in Aries is the 19th, Saturn the 10th, Rahu the 14th.
assert.ok(mrityuBhagaOf('Mars', 19));
assert.ok(mrityuBhagaOf('Saturn', 10));
assert.ok(mrityuBhagaOf('Rahu', 14));
assert.equal(mrityuBhagaOf('Mars', 10), null);

// --- Puṣkara navāṁśa -------------------------------------------------------------------------------------------------------------------------
// Fire signs: 20°–23°20' (the 7th navāṁśa) and 26°40'–30° (the 9th).
assert.deepEqual(pushkaraNavamsaOf(22), { which: 1, navamsa: 7, navamsaSign: 7, from: 20, to: 20 + 10 / 3 });
assert.equal(pushkaraNavamsaOf(24), null);
assert.equal(pushkaraNavamsaOf(27)!.which, 2);
assert.equal(pushkaraNavamsaOf(27)!.navamsa, 9);
assert.equal(pushkaraNavamsaOf(27)!.navamsaSign, 9, 'the 9th navamsa of Aries is Sagittarius');
assert.equal(pushkaraNavamsaOf(23.4), null, 'just past the first');
assert.equal(pushkaraNavamsaOf(120 + 21)!.which, 1, 'Leo is a fire sign too');
// Earth signs: 6°40'–10° (3rd) and 13°20'–16°40' (5th).
assert.equal(pushkaraNavamsaOf(30 + 8)!.navamsa, 3);
assert.equal(pushkaraNavamsaOf(30 + 8)!.navamsaSign, 12, 'the 3rd navamsa of Taurus is Pisces');
assert.equal(pushkaraNavamsaOf(30 + 14)!.navamsaSign, 2, 'and the 5th is Taurus');
assert.equal(pushkaraNavamsaOf(30 + 14)!.navamsa, 5);
assert.equal(pushkaraNavamsaOf(30 + 12), null);
// Air signs: 16°40'–20° (6th) and 23°20'–26°40' (8th).
assert.equal(pushkaraNavamsaOf(60 + 18)!.navamsa, 6);
assert.equal(pushkaraNavamsaOf(60 + 25)!.navamsa, 8);
assert.equal(pushkaraNavamsaOf(60 + 22), null);
// Water signs: 0°–3°20' (1st) and 6°40'–10° (3rd).
assert.equal(pushkaraNavamsaOf(90 + 1)!.navamsa, 1);
assert.equal(pushkaraNavamsaOf(90 + 7)!.navamsa, 3);
assert.equal(pushkaraNavamsaOf(90 + 5), null);
// The ranges tile the same two thirds of a sign in all twelve signs: two ranges 3°20' wide.
for (let sign = 0; sign < 12; sign += 1) {
  const ranges = pushkaraNavamsaRanges(sign);
  assert.equal(ranges.length, 2);
  for (const range of ranges) near(range.to - range.from, 10 / 3);
  near(ranges[1].from - ranges[0].from, 20 / 3);
}

// --- Puṣkara Bhāga: the degree that ends at the number -------------------------------------------------------------------------------
assert.deepEqual(PUSHKARA_BHAGA.slice(0, 4), [21, 14, 24, 7]);
assert.deepEqual(pushkaraBhagaOf(20.5), { degree: 21 });
assert.equal(pushkaraBhagaOf(21), null, 'the 21st degree ends at 21°');
assert.equal(pushkaraBhagaOf(19.9), null);
assert.ok(pushkaraBhagaOf(90 + 6.5), 'Cancer: the 7th degree');
assert.ok(pushkaraBhagaOf(30 + 13.5), 'Taurus: the 14th');
assert.equal(pushkaraBhagaOf(60 + 22), null, 'Gemini has the 24th');
assert.ok(pushkaraBhagaOf(60 + 23.5));

// --- Everything for a point -------------------------------------------------------------------------------------------------------------------
const all = sensitiveDegreesOf('Sun', 20.2);
assert.ok(all.mrityu && all.pushkaraNavamsa && all.pushkaraBhaga, 'the Sun at 20°12\' of Aries is in all three');
assert.equal(all.sandhi, null);
assert.equal(all.gandanta, null);
// The nakṣatra offset moves the Gandanta only: 105° and the 13°20' of the next nakṣatra is in the last pada of Ashlesha.
const shifted = sensitiveDegreesOf('Moon', 105, 13 + 20 / 60);
assert.equal(shifted.gandanta!.nakshatra, 'Ashlesha');
assert.equal(sensitiveDegreesOf('Moon', 105).gandanta, null);
assert.equal(shifted.sandhi, null);

console.log('Sensitive degrees tests passed');
