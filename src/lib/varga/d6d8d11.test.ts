import assert from 'node:assert/strict';
import { calcD6, calcD8, calcD11, calculateVargaMatrix, getVargaSignIndex } from './index';

// D6, D8 and D11 worked out by hand from their rules (signs 0 = Aries … 11 = Pisces); the PyJHora comparison of
// pyjhoraVargas.test.ts checks the same rules on thousands of positions.
const sign = (index: number, degree: number) => index * 30 + degree;

// --- D6 Ṣaṣṭhāṁśa: six parts of 5°; odd signs from Aries, even signs from Libra -------------------------------------
assert.equal(calcD6(sign(0, 0)), 0, 'Aries 0°: Aries');
assert.equal(calcD6(sign(0, 4.99)), 0);
assert.equal(calcD6(sign(0, 5)), 1, 'Aries 5°: the second part, Taurus');
assert.equal(calcD6(sign(0, 29.99)), 5, 'Aries 29°: the sixth part, Virgo');
assert.equal(calcD6(sign(1, 0)), 6, 'Taurus (even) 0°: Libra');
assert.equal(calcD6(sign(1, 12)), 8, 'Taurus 12°: the third part, Sagittarius');
assert.equal(calcD6(sign(1, 29.99)), 11, 'Taurus 29°: Pisces');
assert.equal(calcD6(sign(2, 12)), 2, 'Gemini (odd) 12°: the third part from Aries, Gemini');
assert.equal(calcD6(sign(11, 0)), 6, 'Pisces (even) 0°: Libra');

// --- D8 Aṣṭāṁśa: eight parts of 3°45′; movable from Aries, fixed from Sagittarius, dual from Leo -----------------------
assert.equal(calcD8(sign(0, 0)), 0, 'Aries (movable) 0°: Aries');
assert.equal(calcD8(sign(0, 3.75)), 1, 'Aries 3°45′: Taurus');
assert.equal(calcD8(sign(0, 29.99)), 7, 'Aries 29°: the eighth part, Scorpio');
assert.equal(calcD8(sign(3, 0)), 0, 'Cancer (movable) 0°: Aries too, not Cancer');
assert.equal(calcD8(sign(1, 0)), 8, 'Taurus (fixed) 0°: Sagittarius');
assert.equal(calcD8(sign(1, 3.75)), 9, 'Taurus 3°45′: Capricorn');
assert.equal(calcD8(sign(1, 29.99)), 3, 'Taurus 29°: Sagittarius + 7 = Cancer');
assert.equal(calcD8(sign(2, 0)), 4, 'Gemini (dual) 0°: Leo');
assert.equal(calcD8(sign(2, 29.99)), 11, 'Gemini 29°: Leo + 7 = Pisces');

// --- D11 Rudrāṁśa: eleven parts of 2°43′38″, forward from the sign as far back from Aries as the sign is on from it ----
assert.equal(calcD11(sign(0, 0)), 0, 'Aries 0°: Aries');
assert.equal(calcD11(sign(0, 2.74)), 1, 'Aries 2°44′: the second part, Taurus');
assert.equal(calcD11(sign(0, 29.99)), 10, 'Aries 29°: the eleventh part, Aquarius');
assert.equal(calcD11(sign(1, 0)), 11, 'Taurus 0°: Pisces');
assert.equal(calcD11(sign(1, 2.74)), 0, 'Taurus 2°44′: Aries');
assert.equal(calcD11(sign(2, 0)), 10, 'Gemini 0°: Aquarius');
assert.equal(calcD11(sign(11, 0)), 1, 'Pisces 0°: Taurus');
assert.equal(calcD11(sign(6, 0)), 6, 'Libra 0°: Libra, the sign opposite Aries is its own mirror');

// --- What holds for every longitude ----------------------------------------------------------------------------------
for (const [name, calc, parts] of [['D6', calcD6, 6], ['D8', calcD8, 8], ['D11', calcD11, 11]] as const) {
  for (let s = 0; s < 12; s += 1) {
    const seen: number[] = [];
    for (let part = 0; part < parts; part += 1) seen.push(calc(sign(s, (part + 0.5) * (30 / parts))));
    // The parts of a sign are consecutive signs, going forward round the zodiac.
    for (let part = 1; part < parts; part += 1) assert.equal(seen[part], (seen[part - 1] + 1) % 12, `${name} sign ${s}: the parts follow one another`);
  }
  // Every longitude falls in a sign, the end of the zodiac included, and the same longitude another turn round is the same sign.
  for (let longitude = 0; longitude < 360; longitude += 0.37) {
    const found = calc(longitude);
    assert.ok(Number.isInteger(found) && found >= 0 && found <= 11, `${name} ${longitude}`);
    assert.equal(calc(longitude + 360), found, `${name} ${longitude}: a whole turn makes no difference`);
  }
}

// --- They are in the dispatch and in the matrix, and the others are where they were ----------------------------------------
assert.equal(getVargaSignIndex(sign(1, 12), 6), calcD6(sign(1, 12)));
assert.equal(getVargaSignIndex(sign(1, 12), 8), calcD8(sign(1, 12)));
assert.equal(getVargaSignIndex(sign(1, 12), 11), calcD11(sign(1, 12)));
const row = calculateVargaMatrix(sign(4, 17.3));
assert.equal(row.D6, calcD6(sign(4, 17.3)));
assert.equal(row.D8, calcD8(sign(4, 17.3)));
assert.equal(row.D11, calcD11(sign(4, 17.3)));
assert.equal(row.D9, getVargaSignIndex(sign(4, 17.3), 9));
assert.equal(row.D60, getVargaSignIndex(sign(4, 17.3), 60));

console.log('D6, D8 and D11 tests passed');
