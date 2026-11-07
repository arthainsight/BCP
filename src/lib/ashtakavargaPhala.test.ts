import assert from 'node:assert/strict';
import { KEY_HOUSE, SIGNIFICATIONS, buildPhala, classifySav, nakshatraName, remainderFrom1 } from './ashtakavargaPhala';
import { bhinnaBySign, buildShodhana } from './ashtakavargaShodhana';
import { buildAshtakavarga, type AshtakavargaChartLike } from './ashtakavarga';

// What the numbers say (BPHS 70 and 72), worked out by hand from the verses. It is not checked against another program.

// --- The remainder: nought is the divisor itself ----------------------------------------------------------------------------
assert.equal(remainderFrom1(1, 27), 1);
assert.equal(remainderFrom1(27, 27), 27, 'a remainder of nought is 27: Revatī');
assert.equal(remainderFrom1(28, 27), 1);
assert.equal(remainderFrom1(54, 27), 27);
assert.equal(remainderFrom1(100, 27), 19, '100 = 3 × 27 + 19');
assert.equal(remainderFrom1(24, 12), 12, 'a remainder of nought over 12 is 12: Pisces');
assert.equal(remainderFrom1(25, 12), 1);
assert.equal(remainderFrom1(134, 12), 2, '134 = 11 × 12 + 2');
assert.equal(nakshatraName(0), 'Ashwini');
assert.equal(nakshatraName(26), 'Revati');

// --- What the verses fix: the house each graha's number is worked from ----------------------------------------------------------
assert.deepEqual(Object.fromEntries(Object.entries(KEY_HOUSE).map(([planet, key]) => [planet, key.house])), { Sun: 9, Moon: 4, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 7, Saturn: 8 });
assert.deepEqual(Object.keys(SIGNIFICATIONS), ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']);

// --- The Sarvāṣṭakavarga classes (72.3): more than thirty good, twenty-five to thirty middling, fewer poor -----------------------------
assert.deepEqual([24, 25, 28, 30, 31, 45].map(classifySav), ['poor', 'middle', 'middle', 'middle', 'good', 'good']);

// --- A chart worked through ---------------------------------------------------------------------------------------------------------
// Lagna Aries; Sun in Aries, Moon in Cancer, Mars in Leo, Mercury in Virgo, Jupiter in Sagittarius, Venus in Libra, Saturn in Aquarius, Rahu in Taurus, Ketu in Scorpio.
const chart: AshtakavargaChartLike = {
  ascendant: { sign: 1 },
  planets: [['Sun', 1], ['Moon', 4], ['Mars', 5], ['Mercury', 6], ['Jupiter', 9], ['Venus', 7], ['Saturn', 11], ['Rahu', 2], ['Ketu', 8]]
    .map(([name, sign]) => ({ name: name as string, sign: sign as number, house: sign as number })),
};
const phala = buildPhala(chart);
const shodhana = buildShodhana(chart);
const bhinna = bhinnaBySign(chart);
const own = { Sun: 0, Moon: 3, Mars: 4, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10 } as const;

for (const point of phala.saturn) {
  const house = KEY_HOUSE[point.planet].house;
  const sign = (own[point.planet] + house - 1) % 12;
  assert.equal(point.houseSign, sign, `${point.planet}: the ${house}th from its own sign`);
  assert.equal(point.bindus, bhinna[point.planet][sign], `${point.planet}: the bindus of its own Bhinnāṣṭakavarga there`);
  assert.equal(point.sodhyaPinda, shodhana.sodhyaPinda[point.planet]);
  assert.equal(point.product, point.sodhyaPinda * point.bindus, `${point.planet}: the Piṇḍa times the bindus`);
  if (point.product === 0) {
    assert.equal(point.nakshatra, null);
  } else {
    // The remainder over 27 and over 12, from one, and the trines (nine and eighteen on; four and eight).
    assert.equal(point.nakshatra, (point.product - 1) % 27, `${point.planet}: the nakṣatra`);
    assert.equal(point.sign, (point.product - 1) % 12, `${point.planet}: the sign`);
    assert.deepEqual(point.nakshatraTrine, [point.nakshatra!, (point.nakshatra! + 9) % 27, (point.nakshatra! + 18) % 27]);
    assert.deepEqual(point.signTrine, [point.sign!, (point.sign! + 4) % 12, (point.sign! + 8) % 12]);
  }
}
// By hand for the Sun: the 9th from Aries is Sagittarius (8).
assert.equal(phala.saturn[0].houseSign, 8);
// And the arithmetic once through, on a product that is known: 27 × 3 + 1 = 82 → the 1st nakṣatra, and 82 = 6 × 12 + 10 → the 10th sign.
assert.equal(remainderFrom1(82, 27) - 1, 0);
assert.equal(remainderFrom1(82, 12) - 1, 9);

// The signs with no bindu in the Sun's and the Moon's Aṣṭakavarga, and those with the most.
for (const [empty, richest, planet] of [[phala.sunEmpty, phala.sunRichest, 'Sun'], [phala.moonEmpty, phala.moonRichest, 'Moon']] as const) {
  assert.deepEqual(empty, bhinna[planet].flatMap((value, sign) => (value === 0 ? [sign] : [])));
  const best = Math.max(...bhinna[planet]);
  assert.ok(richest.length >= 1 && richest.every(sign => bhinna[planet][sign] === best), `${planet}: the richest signs`);
}

// The Sarvāṣṭakavarga by house from the Lagna: the same as the table of the houses, class by class; a Lagna of more than thirty is of enjoyment.
const sav = buildAshtakavarga(chart).sav.houses;
phala.houses.forEach(item => {
  assert.equal(item.bindus, sav[item.house - 1], `house ${item.house}`);
  assert.equal(item.kind, classifySav(item.bindus));
  assert.equal(item.sign, (item.house - 1) % 12, 'Lagna Aries: the house is the sign');
});
assert.equal(phala.houses.reduce((sum, item) => sum + item.bindus, 0), 337);
assert.equal(phala.lagna.enjoyment, phala.houses[0].bindus > 30);

// The three parts of the houses and the malefics in them: Aries 1–4 (the Sun in the 1st, Rahu in the 2nd), 5–8 (Mars in the 5th, Ketu in the 8th), 9–12 (Saturn in the 11th).
assert.deepEqual(phala.khandas.map(item => [item.houses, item.stage]), [[[1, 4], 'childhood'], [[5, 8], 'adulthood'], [[9, 12], 'old age']]);
assert.deepEqual(phala.khandas.map(item => item.malefics), [['Sun', 'Rahu'], ['Mars', 'Ketu'], ['Saturn']]);
assert.equal(phala.khandas.reduce((sum, item) => sum + item.bindus, 0), 337, 'the three parts hold the whole');

// The other system of tables works too.
assert.equal(buildPhala(chart, 'Varahamihira').saturn.length, 7);

console.log('Aṣṭakavarga Phala tests passed');
