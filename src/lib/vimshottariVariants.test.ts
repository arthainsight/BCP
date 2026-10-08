import assert from 'node:assert/strict';
import {
  calculateVimshottariVariant, decideVariant, moonHouse, variantCandidates, variantLongitude, variantNotApplicable,
  isVariantChoice, VARIANT_HOUSES, VARIANT_POSITION,
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

// The candidates with their nakṣatras and lords: from Ashwini the 5th is Mrigashira (Mars), the 4th Rohini (Moon) and the 8th Pushya (Saturn).
assert.deepEqual(
  variantCandidates(moon).map(item => [item.variant, item.nakshatra, item.lord]),
  [['utpanna', 'Mrigashira', 'Mars'], ['kshema', 'Rohini', 'Moon'], ['adhana', 'Pushya', 'Saturn']],
);

// The balance is the Moon's own fraction carried to the new nakṣatra.
const birth = new Date(1990, 5, 15, 12);
const lagnaFor = (house: number) => ((1 - house + 12) % 12) + 1; // Moon at 10° is in Aries
const utpanna = calculateVimshottariVariant(moon, birth, 'utpanna', lagnaFor(1))!;
assert.equal(utpanna.variant, 'utpanna');
assert.equal(utpanna.basis, 'chosen');
assert.equal(utpanna.nakshatra, 'Mrigashira');
assert.equal(utpanna.nakshatraLord, 'Mars');
const fractionLeft = 1 - (moon % NAKSHATRA) / NAKSHATRA;
near(utpanna.entries[0].durationYears, 7 * fractionLeft, 'Mars balance');
near(calculateVimshottari(moon, birth).entries[0].durationYears, 7 * fractionLeft, 'Ketu balance (also 7 years)');
assert.equal(utpanna.entries.length, 9);
assert.equal(utpanna.entries[1].lord, 'Rahu');

// The house of the Moon from the Lagna.
for (let house = 1; house <= 12; house++) assert.equal(moonHouse(moon, lagnaFor(house)), house, `house ${house}`);
assert.equal(moonHouse(moon), null, 'no Lagna, no house');

// Sanjay Rath: Moon in 3 and 11 Utpanna, in 2 and 6 Kshema, in 8 and 12 Adhana; the other houses call for none.
const expected: Record<number, string | null> = {
  1: null, 2: 'kshema', 3: 'utpanna', 4: null, 5: null, 6: 'kshema', 7: null, 8: 'adhana', 9: null, 10: null, 11: 'utpanna', 12: 'adhana',
};
for (let house = 1; house <= 12; house++) {
  const decision = decideVariant(moon, lagnaFor(house));
  assert.equal(decision.moonHouse, house);
  assert.equal(decision.variant, expected[house], `Moon in house ${house}`);
  assert.equal(decision.basis, 'house');
  const result = calculateVimshottariVariant(moon, birth, 'auto', lagnaFor(house));
  assert.equal(result?.variant ?? null, expected[house], `daśā for Moon in house ${house}`);
}
assert.deepEqual(VARIANT_HOUSES, [2, 3, 6, 8, 11, 12]);

// Without a Lagna the house is unknown, so auto has nothing to go by.
assert.equal(decideVariant(moon).variant, null);
assert.equal(calculateVimshottariVariant(moon, birth), null);

// A variant fixed by hand is used whatever the house, even where the rule gives none.
assert.deepEqual(decideVariant(moon, lagnaFor(1), 'kshema'), { variant: 'kshema', basis: 'chosen', moonHouse: 1 });
assert.deepEqual(decideVariant(moon, lagnaFor(3), 'adhana'), { variant: 'adhana', basis: 'chosen', moonHouse: 3 });
assert.equal(calculateVimshottariVariant(moon, birth, 'adhana', lagnaFor(4))?.variant, 'adhana');

// The note says where the daśā is used.
assert.equal(variantNotApplicable(4), 'Conditional: not applicable (Moon in 4H; used with the Moon in 2, 3, 6, 8, 11, 12)');
assert.match(variantNotApplicable(null), /Moon in \?H/);

assert.ok(isVariantChoice('auto') && isVariantChoice('adhana') && !isVariantChoice('janma') && !isVariantChoice(undefined));

console.log('Vimshottari variant tests passed');
