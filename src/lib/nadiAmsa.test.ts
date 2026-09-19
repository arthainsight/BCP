import assert from 'node:assert/strict';
import { calculateDevaKeralamNadiAmsa, calculateNadiD150 } from './nadiAmsa';

const almostAt = (degrees: number) => degrees - 1e-9;

// Deva Keralam modality ordering and exact 0°12′ boundaries.
assert.equal(calculateDevaKeralamNadiAmsa(0).nadiNumber, 1);
assert.equal(calculateDevaKeralamNadiAmsa(0).nadiName, 'Vasudhā');
assert.equal(calculateDevaKeralamNadiAmsa(0.2).nadiNumber, 2);
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(30)).nadiNumber, 150);
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(30)).nadiName, 'Parameśvarī');
assert.equal(calculateDevaKeralamNadiAmsa(30).nadiNumber, 150);
assert.equal(calculateDevaKeralamNadiAmsa(30.2).nadiNumber, 149);
assert.equal(calculateDevaKeralamNadiAmsa(60).nadiNumber, 76);
assert.equal(calculateDevaKeralamNadiAmsa(60).nadiName, 'Mahāmārī');
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(75)).nadiNumber, 150);
assert.equal(calculateDevaKeralamNadiAmsa(75).nadiNumber, 1);
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(90)).nadiNumber, 75);

// Rāśi-modality D150 placement and 0°06′ halves.
assert.deepEqual(calculateNadiD150(0), {
  system: 'nadi-d150', rawDivision: 1, signIndex: 0, half: 'purva', halfNumber: 1, offsetDegrees: 0,
});
assert.equal(calculateNadiD150(0.1).half, 'para');
assert.equal(calculateNadiD150(0.1).halfNumber, 2);
assert.equal(calculateNadiD150(0.2).signIndex, 1);

// Supplied worked examples: Capricorn 2°29′, Scorpio 17°32′, Sagittarius 29°18′.
assert.equal(calculateNadiD150(272 + 29 / 60).signIndex, 9);
assert.equal(calculateNadiD150(227 + 32 / 60).signIndex, 8);
assert.equal(calculateNadiD150(269 + 18 / 60).signIndex, 4);
assert.equal(calculateNadiD150(-0.1).halfNumber, 300);

console.log('Nāḍī-aṁśa tests passed');
