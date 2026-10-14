import assert from 'node:assert/strict';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { ABHIJIT_END, ABHIJIT_START } from './sarvatobhadra';
import { KOTA_PALA, KOTA_PLACES, KOTA_RINGS, KOTA_STARS, kotaLayout, kotaNakshatra, kotaPada, kotaPala, kotaPalaAt, kotaSquareOf, kotaSwami, kotaZone } from './kotaChakra';

// --- The 28 nakṣatras and the four squares --------------------------------------------------------------------------
assert.equal(KOTA_STARS.length, 28);
assert.equal(KOTA_STARS[20], 'Uttara Ashadha');
assert.equal(KOTA_STARS[21], 'Abhijit');
assert.equal(KOTA_STARS[22], 'Shravana');
assert.deepEqual(KOTA_STARS.filter(name => name !== 'Abhijit'), [...NAKSHATRA_NAMES]);
assert.deepEqual(KOTA_RINGS.map(ring => ring.size), [8, 8, 8, 4]);
assert.deepEqual(KOTA_PLACES.map(ring => ring.length), [8, 8, 8, 4]);
// Every place of the count from 1 to 28 is in exactly one square.
assert.deepEqual([...KOTA_PLACES.flat()].sort((a, b) => a - b), Array.from({ length: 28 }, (_, index) => index + 1));

// --- The JHora screenshot: the natal Moon in Mrigashira -----------------------------------------------------------------
// The outer square, clockwise from the top left: Mrig, PPha, UPha, Jye, Mool, Sata, PBha, Rohi; the wall: Ardr, Magh,
// Hast, Anu, PSha, Dhan, UBha, Krit; inside the wall: Puna, Asre, Chit, Visa, USha, Srav, Reva, Bhar; the pillar:
// Push (top), Swat (right), Abhi (bottom), Aswi (left).
const layout = kotaLayout('Mrigashira');
assert.deepEqual(layout.map(ring => ring.map(square => square.nakshatra)), [
  ['Mrigashira', 'Purva Phalguni', 'Uttara Phalguni', 'Jyeshtha', 'Mula', 'Shatabhisha', 'Purva Bhadrapada', 'Rohini'],
  ['Ardra', 'Magha', 'Hasta', 'Anuradha', 'Purva Ashadha', 'Dhanishtha', 'Uttara Bhadrapada', 'Krittika'],
  ['Punarvasu', 'Ashlesha', 'Chitra', 'Vishakha', 'Uttara Ashadha', 'Shravana', 'Revati', 'Bharani'],
  ['Pushya', 'Swati', 'Abhijit', 'Ashwini'],
]);
// Grahas in the screenshot: Moon in Mrig (outer square), Mars and Ketu in UPha (outer), Sun in Chit (inside the wall),
// Jupiter in Aswi (pillar), Mercury and Venus in Swat (pillar), Saturn in Jye (outer), Rahu in UBha (wall).
const ringOf = (star: string) => kotaSquareOf(layout, star)?.ring;
assert.deepEqual(
  ['Mrigashira', 'Uttara Phalguni', 'Chitra', 'Ashwini', 'Swati', 'Jyeshtha', 'Uttara Bhadrapada'].map(ringOf),
  [0, 0, 2, 3, 3, 0, 1],
);

// Every nakṣatra is in exactly one square, whatever the birth nakṣatra is.
for (const birthStar of KOTA_STARS) {
  const squares = kotaLayout(birthStar).flat();
  assert.equal(squares.length, 28);
  assert.equal(new Set(squares.map(square => square.nakshatra)).size, 28, `every nakshatra once, from ${birthStar}`);
  assert.equal(kotaLayout(birthStar)[0][0].nakshatra, birthStar, 'the birth nakshatra is the first square of the outside');
}
// The count wraps round Revati to Ashwini: from Revati the second place is Ashwini, from Ashwini the second is Bharani.
assert.equal(kotaLayout('Revati')[1][0].nakshatra, 'Ashwini');
assert.equal(kotaLayout('Ashwini')[1][0].nakshatra, 'Bharani');
assert.throws(() => kotaLayout('Nowhere'));

// --- The nakṣatra and the pada of a longitude, Abhijit included ---------------------------------------------------------
assert.equal(kotaNakshatra(0), 'Ashwini');
assert.equal(kotaNakshatra(ABHIJIT_START + 0.01), 'Abhijit');
assert.equal(kotaNakshatra(ABHIJIT_END - 0.01), 'Abhijit');
assert.equal(kotaNakshatra(ABHIJIT_END + 0.01), 'Shravana');
assert.equal(kotaNakshatra(359.9), 'Revati');
assert.equal(kotaNakshatra(100, 1), kotaNakshatra(101), 'the nakshatra zodiac adjust moves the longitude');
// Outside Abhijit the pada is the quarter of the whole 13°20′ (3°20′ each), as it is for the 27 nakṣatras.
for (let index = 0; index < 27; index++) {
  const start = index * NAKSHATRA_SIZE;
  [[0.01, 1], [NAKSHATRA_SIZE / 4 + 0.01, 2], [NAKSHATRA_SIZE / 2 + 0.01, 3], [NAKSHATRA_SIZE - 0.01, 4]].forEach(([offset, pada]) => {
    if (kotaNakshatra(start + offset) !== 'Abhijit') assert.equal(kotaPada(start + offset), pada, `nakshatra ${index + 1}, offset ${offset}`);
  });
}
// Mrigashira (53°20′ to 66°40′): Taurus up to 60°, so padas 1 and 2 are in Taurus and 3 and 4 in Gemini.
assert.equal(kotaPada(53 + 20 / 60 + 0.01), 1);
assert.equal(kotaPada(60.01), 3);
// The span of Abhijit is cut into four equal parts.
const abhijitQuarter = (ABHIJIT_END - ABHIJIT_START) / 4;
assert.deepEqual([0.01, 1.01, 2.01, 3.01].map(quarters => kotaPada(ABHIJIT_START + abhijitQuarter * quarters)), [1, 2, 3, 4]);

// --- Kota Swāmī and Kota Pāla: the screenshot's Mercury and Mars ----------------------------------------------------------
assert.equal(kotaSwami(3), 'Mercury', 'the Moon in Gemini');
assert.equal(kotaSwami(4), 'Moon');
assert.equal(kotaSwami(1), 'Mars');
assert.equal(kotaPala('Mrigashira', kotaPada(60.5)), 'Mars', 'Mrigashira pada 3: Mars, as in the screenshot');
assert.equal(kotaPala('Mrigashira', 4), 'Mars');
assert.equal(kotaPala('Mrigashira', 1), 'Moon');
assert.equal(KOTA_PALA.length, 27, 'the table has a row for each of the 27 nakshatras, none for Abhijit');
assert.ok(KOTA_PALA.every(row => row.length === 4), 'four padas to a nakshatra');
assert.throws(() => kotaPala('Nowhere', 1));
assert.throws(() => kotaPala('Abhijit', 1), 'Abhijit has no row');
// The table is read by the 27 nakshatras, so the ones after Abhijit are the right rows: the name syllables of Revati
// are de, do, cha, chi (Jupiter, Jupiter, Venus, Venus) and those of Dhanishtha are all Mercury in JHora's table.
assert.deepEqual(['Revati', 'Revati', 'Revati', 'Revati'].map((name, index) => kotaPala(name, index + 1)), ['Jupiter', 'Jupiter', 'Venus', 'Venus']);
assert.equal(kotaPala('Dhanishtha', 2), 'Mercury');
assert.deepEqual([1, 2, 3, 4].map(pada => kotaPala('Shatabhisha', pada)), ['Mercury', 'Rahu', 'Rahu', 'Rahu']);
assert.deepEqual([1, 2, 3, 4].map(pada => kotaPala('Purva Bhadrapada', pada)), ['Rahu', 'Rahu', 'Jupiter', 'Jupiter']);
assert.equal(kotaPala('Pushya', 2), 'Rahu', 'the chart of India of 15.08.1947: the Moon in Pushya, pada 2');
// By longitude: Mrigashira pada 3 begins at 60°, and the Abhijit span is read by the 27 nakshatras.
assert.equal(kotaPalaAt(60.5), 'Mars');
assert.equal(kotaPalaAt(278), 'Venus', 'Abhijit, in the last pada of Uttara Ashadha');
assert.equal(kotaPalaAt(280.5), 'Mercury', 'Abhijit, in the first pada of Shravana (the first 3°20′ after 280°)');
assert.equal(kotaPalaAt(299.9), 'Mercury', 'Dhanishtha');
assert.equal(kotaPalaAt(359.9), 'Venus', 'Revati pada 4');
assert.equal(kotaPalaAt(0.01), 'Venus', 'Ashwini pada 1');
assert.equal(kotaPalaAt(13.3), 'Moon', 'Ashwini pada 4');
assert.equal(kotaPalaAt(60.5 - 1, 1), 'Mars', 'the nakshatra zodiac adjust moves the longitude');

// --- The heart of the fort -------------------------------------------------------------------------------------------------------
assert.deepEqual([0, 1, 2, 3].map(kotaZone), ['outer', 'outer', 'heart', 'heart']);

// --- The count can begin at Krittika, as the fort wheel of Agni Purana 128 does ------------------------------------------------
// Counted from Krittika the squares are the same as for a Moon in Krittika; Pushya is then the 6th place.
assert.deepEqual(kotaLayout('Krittika').flat().find(square => square.nakshatra === 'Pushya'), { ring: 1, slot: 1, place: 6, nakshatra: 'Pushya' });
assert.deepEqual(kotaLayout('Krittika')[0].map(square => square.nakshatra), ['Krittika', 'Ashlesha', 'Magha', 'Vishakha', 'Anuradha', 'Shravana', 'Dhanishtha', 'Bharani']);

console.log('kota chakra tests passed');
