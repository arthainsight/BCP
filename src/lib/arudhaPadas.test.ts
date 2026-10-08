import assert from 'node:assert/strict';
import { ARUDHA_PADAS, arudhaName, calculateArudhaPadas } from './arudhaPadas';

// The chart of 8 October 2026, 10:47:40, Ghaziabad: Scorpio ascendant.
const grahas = [
  { name: 'Sun', sign: 6, degree: 20.72 },
  { name: 'Moon', sign: 5, degree: 20.75 },
  { name: 'Mars', sign: 4, degree: 11.61 },
  { name: 'Mercury', sign: 7, degree: 15.4 },
  { name: 'Jupiter', sign: 4, degree: 26.62 },
  { name: 'Venus', sign: 7, degree: 13.78 },
  { name: 'Saturn', sign: 12, degree: 16.78 },
];

// --- Names -----------------------------------------------------------------------------------
assert.equal(arudhaName(1), 'AL');
assert.equal(arudhaName(2), 'AL2');
assert.equal(arudhaName(12), 'AL12');
assert.equal(ARUDHA_PADAS.length, 12);

// --- Every pada of that chart, worked out by hand -----------------------------------------------
const padas = calculateArudhaPadas(8, grahas);
assert.equal(padas.length, 12);
const sign = (house: number) => padas.find(p => p.house === house)?.sign;
assert.equal(sign(1), 12, 'AL: lord Mars in Cancer, 9th from Scorpio, 9th from Mars is Pisces (as in the reference table)');
assert.equal(sign(2), 11, 'AL2: Sagittarius, Jupiter in Cancer (8th), 8th from Cancer is Aquarius');
assert.equal(sign(3), 2, 'AL3: Capricorn, Saturn in Pisces (3rd), 3rd from Pisces is Taurus');
assert.equal(sign(4), 1, 'AL4: Aquarius, Saturn in Pisces (2nd), Aries');
assert.equal(sign(5), 8, 'AL5: Pisces, Jupiter in Cancer (5th), Scorpio');
assert.equal(sign(6), 4, 'AL6: Aries, Mars in Cancer (4th) lands in Libra, the 7th, so the 10th from it: Cancer');
assert.equal(sign(7), 12, 'AL7: Taurus, Venus in Libra (6th), Pisces');
assert.equal(sign(8), 11, 'AL8: Gemini, Mercury in Libra (5th), Aquarius');
assert.equal(sign(9), 6, 'AL9: Cancer, the Moon in Leo (2nd), Virgo');
assert.equal(sign(10), 7, 'AL10: Leo, the Sun in Virgo (2nd), Libra');
assert.equal(sign(11), 8, 'AL11: Virgo, Mercury in Libra (2nd), Scorpio');
assert.equal(sign(12), 4, 'AL12: Libra with Venus in Libra: its own house, so the 10th from it: Cancer');

// --- The pada takes the degree of the lord, and is placed in the sign ----------------------------------
const al = padas.find(p => p.house === 1)!;
assert.equal(al.name, 'AL');
assert.equal(al.degree, 11.61, 'the degree of Mars');
assert.equal(al.longitude, 11 * 30 + 11.61);

// --- Another Lagna turns every house with it ----------------------------------------------------------------
const aries = calculateArudhaPadas(1, grahas);
assert.equal(aries.find(p => p.house === 1)?.sign, 4, 'Aries Lagna, Mars in Cancer (4th) lands in Libra, the 7th, so the 10th from Libra: Cancer');
assert.equal(aries.find(p => p.house === 4)?.sign, 6, 'AL4 of an Aries Lagna: Cancer, the Moon in Leo (2nd), Virgo');

// --- A lord that is missing leaves its pada out ------------------------------------------------------------------
const withoutMars = calculateArudhaPadas(8, grahas.filter(g => g.name !== 'Mars'));
assert.equal(withoutMars.find(p => p.house === 1), undefined);
assert.equal(withoutMars.find(p => p.house === 6), undefined, 'Aries is also ruled by Mars');
assert.equal(withoutMars.length, 10);

console.log('Arudha pada tests passed');
