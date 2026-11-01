import assert from 'node:assert/strict';
import { ANGA_TABLES, SAPTASHALAKA_PAIRS, angaOf, countFrom, lattaNakshatra, phaladipikaTransit, praptaKala, vedhaPartner, type TransitBody, type TransitGraha } from './phaladipikaGochara';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';

const at = (nakshatra: string, name: string, extra: Partial<TransitBody> = {}): TransitBody => {
  const index = NAKSHATRA_NAMES.indexOf(nakshatra as (typeof NAKSHATRA_NAMES)[number]);
  const longitude = index * NAKSHATRA_SIZE + 3;
  return { name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, ...extra };
};

// 26.25: where in the sign the result is given.
assert.deepEqual(praptaKala('Sun', 5), { portion: 'first', active: true });
assert.deepEqual(praptaKala('Sun', 15), { portion: 'first', active: false });
assert.equal(praptaKala('Jupiter', 15)!.active, true);
assert.equal(praptaKala('Saturn', 25)!.active, true);
assert.equal(praptaKala('Saturn', 5)!.active, false);
assert.equal(praptaKala('Mercury', 1)!.active, true);
assert.equal(praptaKala('Ketu', 1), null);

// Counts are inclusive from the birth nakṣatra.
assert.equal(countFrom(3, 3), 1);
assert.equal(countFrom(3, 12), 10);
assert.equal(countFrom(25, 0), 3);

// The limbs: the parts of each table cover 1–27 exactly once.
for (const [graha, table] of Object.entries(ANGA_TABLES)) {
  const covered: number[] = [];
  for (const part of table) for (let count = part.from; count <= part.to; count++) covered.push(count);
  assert.deepEqual(covered, Array.from({ length: 27 }, (_, index) => index + 1), `${graha}: 27 nakṣatras once each`);
}
assert.equal(angaOf('Sun', 1)!.result, 'destruction');
assert.equal(angaOf('Sun', 27)!.limb, 'secret parts');
assert.equal(angaOf('Moon', 19)!.result, 'travel abroad');
assert.equal(angaOf('Saturn', 27)!.limb, 'back');

// The seven-line wheel: 14 pairs, the 28 nakṣatras once each.
assert.equal(SAPTASHALAKA_PAIRS.length, 14);
assert.equal(new Set(SAPTASHALAKA_PAIRS.flat()).size, 28);
assert.equal(vedhaPartner('Rohini'), 'Abhijit');
assert.equal(vedhaPartner('Abhijit'), 'Rohini');
assert.equal(vedhaPartner('Hasta'), 'Uttara Bhadrapada');

// Lattā: the commentary's three examples. The Sun in Krittika → Chitra (the 12th); Venus in Jyeshtha → Chitra (5th backward); Mars in Uttara Phalguni → Chitra (3rd).
const chitra = NAKSHATRA_NAMES.indexOf('Chitra');
assert.equal(lattaNakshatra('Sun', at('Krittika', 'Sun').longitude), chitra);
assert.equal(lattaNakshatra('Venus', at('Jyeshtha', 'Venus').longitude), chitra);
assert.equal(lattaNakshatra('Mars', at('Uttara Phalguni', 'Mars').longitude), chitra);
assert.equal(lattaNakshatra('Ketu', 10), null);

// All three on a birth in Chitra: the lattā is on the birth nakṣatra three times.
const birthMoon = at('Chitra', 'Moon').longitude;
const result = phaladipikaTransit(birthMoon, [at('Krittika', 'Sun'), at('Jyeshtha', 'Venus'), at('Uttara Phalguni', 'Mars')]);
assert.equal(result.birthNakshatra, 'Chitra');
for (const row of result.rows) {
  assert.equal(row.latta!.nakshatra, 'Chitra');
  assert.equal(row.latta!.onBirth, true);
  assert.equal(row.lattaOnBirth, 3, '26.47: the lattās of several grahas multiply the result');
}

// Vedha (26.26): the Sun in Anuradha-pierced Ashlesha… the birth nakṣatra Ashlesha is pierced by a graha in Anuradha.
const ashleshaBirth = at('Ashlesha', 'Moon').longitude;
const sunHit = phaladipikaTransit(ashleshaBirth, [at('Anuradha', 'Sun')]).rows[0];
assert.deepEqual(sunHit.vedha, [{ special: 'Janma', nakshatra: 'Ashlesha', effect: 'life-danger' }]);
// … with a malefic in the same nakṣatra it is death; Mars alone is death (26.27); Jupiter alone only a loss in the work (26.28).
assert.equal(phaladipikaTransit(ashleshaBirth, [at('Anuradha', 'Sun'), at('Anuradha', 'Saturn')]).rows[0].vedha[0].effect, 'death');
assert.equal(phaladipikaTransit(ashleshaBirth, [at('Anuradha', 'Mars')]).rows[0].vedha[0].effect, 'death');
assert.equal(phaladipikaTransit(ashleshaBirth, [at('Anuradha', 'Jupiter')]).rows[0].vedha[0].effect, 'work-loss');
// The karma nakṣatra (the 10th from Ashlesha is Hasta... counted: Ashlesha 8 → +9 = 17 = Anuradha(16)? check by the table).
const karmaIndex = (NAKSHATRA_NAMES.indexOf('Ashlesha') + 9) % 27;
const karmaName = NAKSHATRA_NAMES[karmaIndex];
const karmaPartner = vedhaPartner(karmaName)!;
if (karmaPartner !== 'Abhijit') {
  const hit = phaladipikaTransit(ashleshaBirth, [at(karmaPartner, 'Sun')]).rows[0].vedha.find(item => item.special === 'Karma');
  assert.equal(hit?.effect, 'wealth-loss');
}
// A graha not in a partner nakṣatra pierces nothing.
assert.deepEqual(phaladipikaTransit(ashleshaBirth, [at('Ashwini', 'Mars')]).rows[0].vedha.filter(item => item.special === 'Janma'), []);

// 26.33–34: the places.
const moonSign = Math.floor(birthMoon / 30) + 1;
const inHouse = (house: number, name: string): TransitBody => { const sign = ((moonSign - 1 + house - 1) % 12) + 1; return { name, sign, degree: 5, longitude: (sign - 1) * 30 + 5 }; };
const places = phaladipikaTransit(birthMoon, [inHouse(8, 'Moon'), inHouse(7, 'Mars'), inHouse(1, 'Saturn'), inHouse(8, 'Jupiter'), inHouse(2, 'Venus')]);
const by = (graha: TransitGraha) => places.rows.find(row => row.graha === graha)!;
assert.equal(by('Moon').placeDanger, true);
assert.equal(by('Mars').placeDanger, true);
assert.equal(by('Saturn').placeDanger, true);
assert.equal(by('Saturn').trikaDanger, true);
assert.equal(by('Jupiter').trikaDanger, true);
assert.equal(by('Jupiter').placeDanger, false);
assert.equal(by('Venus').placeDanger, false);
assert.equal(by('Moon').trikaDanger, false, '26.33 names Saturn, the Sun, Mars and Jupiter only');

// 26.30–32: a malefic aspect on a graha in a good house takes the good result away; strength and weakness.
const good = { Jupiter: true, Venus: true, Saturn: false } as const;
const jupiterGoodSigns = phaladipikaTransit(birthMoon, [inHouse(2, 'Jupiter'), inHouse(8, 'Saturn')], good).rows;
assert.ok(jupiterGoodSigns.find(row => row.graha === 'Jupiter')!.modifiers.includes('aspected-by-opposite'), 'Saturn (7th aspect) on Jupiter in a good house');
const exalted: TransitBody = { name: 'Jupiter', sign: 4, degree: 5, longitude: 95 };
assert.ok(phaladipikaTransit(birthMoon, [exalted], { Jupiter: true }).rows[0].modifiers.includes('full-in-strength'));
assert.ok(phaladipikaTransit(birthMoon, [exalted], { Jupiter: false }).rows[0].modifiers.includes('harmless-in-strength'));
const debilitated: TransitBody = { name: 'Jupiter', sign: 10, degree: 5, longitude: 275 };
assert.ok(phaladipikaTransit(birthMoon, [debilitated], { Jupiter: true }).rows[0].modifiers.includes('spoilt-good'));
assert.ok(phaladipikaTransit(birthMoon, [debilitated], { Jupiter: false }).rows[0].modifiers.includes('worse-bad'));
assert.deepEqual(phaladipikaTransit(birthMoon, [debilitated]).rows[0].modifiers, [], 'no modifiers when the house is not known');
