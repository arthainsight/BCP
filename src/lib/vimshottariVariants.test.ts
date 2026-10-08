import assert from 'node:assert/strict';
import {
  calculateVimshottariVariant, strongestVariant, decideVariant, moonHouse, variantLongitude, variantStrengths, isVariantChoice,
  VARIANT_POSITION,
} from './vimshottariVariants';
import { calculateVimshottari } from './vimshottari';

const NAKSHATRA = 360 / 27;
const near = (actual: number, expected: number, message: string, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${message}: ${actual} vs ${expected}`);

// Kṣema is the 4th, Utpanna the 5th and Ādhāna the 8th nakṣatra from the Moon's.
assert.deepEqual(VARIANT_POSITION, { utpanna: 5, kshema: 4, adhana: 8 });

// Moon at 10° in Ashwini (index 0): the 5th nakṣatra is Mrigashira (index 4), the same fraction in.
const moon = 10;
near(variantLongitude(moon, 'utpanna'), moon + 4 * NAKSHATRA, 'Utpanna');
near(variantLongitude(moon, 'kshema'), moon + 3 * NAKSHATRA, 'Kshema');
near(variantLongitude(moon, 'adhana'), moon + 7 * NAKSHATRA, 'Adhana');
// The count wraps round the zodiac.
near(variantLongitude(350, 'utpanna'), (350 + 4 * NAKSHATRA) % 360, 'wrap');

// The balance is the Moon's own fraction carried to the new nakṣatra: the first period is as long as that of the Moon's nakṣatra, scaled to the new lord.
const birth = new Date(1990, 5, 15, 12);
const base = calculateVimshottari(moon, birth);
const utpanna = calculateVimshottariVariant(moon, [], birth, 'utpanna');
assert.equal(utpanna.variant, 'utpanna');
assert.equal(utpanna.basis, 'chosen');
assert.equal(utpanna.nakshatra, 'Mrigashira');
assert.equal(utpanna.nakshatraLord, 'Mars');
const fractionLeft = 1 - (moon % NAKSHATRA) / NAKSHATRA;
near(utpanna.entries[0].durationYears, 7 * fractionLeft, 'Mars balance');
near(base.entries[0].durationYears, 7 * fractionLeft, 'Ketu balance (Ketu also 7 years)');
assert.equal(utpanna.entries.length, 9);
assert.equal(utpanna.entries[1].lord, 'Rahu');

// Strength: the variant whose sign has the most grahas in the angles wins.
// Moon at 10° Aries: Utpanna falls in Gemini, Kshema in Taurus and Adhana in Cancer.
const strengths = variantStrengths(moon, []);
assert.deepEqual(strengths.map(s => s.variant), ['utpanna', 'kshema', 'adhana']);
assert.deepEqual(strengths.map(s => s.sign), [3, 2, 4]);
const [, kshemaSign, adhanaSign] = strengths.map(s => s.sign);
const grahaIn = (name: string, sign: number) => ({ name, sign });
const kendraOf = (sign: number) => ((sign + 8) % 12) + 1; // the 10th from a sign, always a kendra
// Two grahas in angles to Adhana's sign only: Adhana wins.
assert.equal(strongestVariant(moon, [grahaIn('Mars', adhanaSign), grahaIn('Venus', kendraOf(adhanaSign))]), 'adhana');
// A single graha in an angle to Kshema's sign only: Kshema wins.
assert.equal(strongestVariant(moon, [grahaIn('Saturn', kshemaSign)]), 'kshema');
// With nothing to tell them apart the order is Utpanna, Kshema, Adhana.
assert.equal(strongestVariant(moon, []), 'utpanna');
// Outer planets are not grahas and do not count.
assert.equal(strongestVariant(moon, [grahaIn('Uranus', adhanaSign), grahaIn('Neptune', adhanaSign)]), 'utpanna');

// Equal in the angles: the lord of the nakṣatra, Jupiter or Mercury joining or looking at the sign decides.
// Jupiter in Taurus joins Kshema's sign but does not look at Utpanna's (Gemini) or Adhana's (Cancer).
const kshemaStrength = variantStrengths(moon, [grahaIn('Jupiter', kshemaSign)]).find(s => s.variant === 'kshema')!;
assert.equal(kshemaStrength.supporters, 1, 'Jupiter joins Kshema');
const utpannaStrength = variantStrengths(moon, [grahaIn('Jupiter', kshemaSign)]).find(s => s.variant === 'utpanna')!;
assert.equal(utpannaStrength.supporters, 0, 'Jupiter in Taurus does not look at Gemini');
const adhanaStrength = variantStrengths(moon, [grahaIn('Jupiter', kshemaSign)]).find(s => s.variant === 'adhana')!;
assert.equal(adhanaStrength.supporters, 0, 'Jupiter in Taurus does not look at Cancer');
// Jupiter in Aquarius looks at its 5th, 7th and 9th: Gemini is the 5th from Aquarius.
assert.equal(variantStrengths(moon, [grahaIn('Jupiter', 11)]).find(s => s.variant === 'utpanna')!.supporters, 1, 'Jupiter aspects the 5th');

// Without a Lagna auto falls back on strength and says so; a chosen variant overrides it.
const grahas = [grahaIn('Mars', adhanaSign), grahaIn('Venus', kendraOf(adhanaSign))];
const auto = calculateVimshottariVariant(moon, grahas, birth);
assert.equal(auto.variant, 'adhana');
assert.equal(auto.basis, 'strength', 'no Lagna given, so no house rule');
assert.equal(calculateVimshottariVariant(moon, grahas, birth, 'kshema').variant, 'kshema');

assert.ok(isVariantChoice('auto') && isVariantChoice('adhana') && !isVariantChoice('janma') && !isVariantChoice(undefined));

// The Moon's house decides (Sanjay Rath): 3 and 11 Utpanna, 2 and 6 Kshema, 8 and 12 Adhana.
// The Moon at 10° is in Aries, so the Lagna that puts it in house h is sign ((1 - h + 12) % 12) + 1.
const lagnaFor = (house: number) => ((1 - house + 12) % 12) + 1;
for (let house = 1; house <= 12; house++) assert.equal(moonHouse(moon, lagnaFor(house)), house, `house ${house}`);
assert.equal(moonHouse(moon), null, 'no Lagna, no house');
const expected: Record<number, string> = { 3: 'utpanna', 11: 'utpanna', 2: 'kshema', 6: 'kshema', 8: 'adhana', 12: 'adhana' };
for (let house = 1; house <= 12; house++) {
  const decision = decideVariant(moon, grahas, lagnaFor(house));
  assert.equal(decision.moonHouse, house);
  if (expected[house]) {
    assert.equal(decision.variant, expected[house], `Moon in house ${house}`);
    assert.equal(decision.basis, 'house');
  } else {
    // 1, 4, 5, 7, 9 and 10 have no rule: the strongest of the three is used (Adhana here, with Mars and Venus in its angles).
    assert.equal(decision.basis, 'strength', `Moon in house ${house}`);
    assert.equal(decision.variant, strongestVariant(moon, grahas));
  }
}
// The house rule beats the strength: Moon in the 3rd gives Utpanna although Adhana is the strongest.
assert.equal(strongestVariant(moon, grahas), 'adhana');
assert.equal(decideVariant(moon, grahas, lagnaFor(3)).variant, 'utpanna');
// A variant chosen in Settings beats the house.
assert.deepEqual(decideVariant(moon, grahas, lagnaFor(3), 'adhana'), { variant: 'adhana', basis: 'chosen', moonHouse: 3 });
// The dasha follows the decision.
assert.equal(calculateVimshottariVariant(moon, grahas, birth, 'auto', lagnaFor(6)).variant, 'kshema');

console.log('Vimshottari variant tests passed');
