import assert from 'node:assert/strict';
import { calculateDevaKeralamNadiAmsa, calculateSiddharNadiAmsa } from './nadiAmsa';

const almostAt = (degrees: number) => degrees - 1e-9;

// Deva Keralam modality ordering and exact 0°12′ boundaries.
assert.equal(calculateDevaKeralamNadiAmsa(0).nadiNumber, 1);
assert.equal(calculateDevaKeralamNadiAmsa(0.2).nadiNumber, 2);
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(30)).nadiNumber, 150);
assert.equal(calculateDevaKeralamNadiAmsa(30).nadiNumber, 150);
assert.equal(calculateDevaKeralamNadiAmsa(30.2).nadiNumber, 149);
assert.equal(calculateDevaKeralamNadiAmsa(60).nadiNumber, 76);
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(75)).nadiNumber, 150);
assert.equal(calculateDevaKeralamNadiAmsa(75).nadiNumber, 1);
assert.equal(calculateDevaKeralamNadiAmsa(almostAt(90)).nadiNumber, 75);

// Siddhar D150 sign cycle and 0°06′ halves.
assert.deepEqual(calculateSiddharNadiAmsa(0), {
  system: 'siddhar', rawDivision: 1, signIndex: 0, half: 'purva', halfNumber: 1, offsetDegrees: 0,
});
assert.equal(calculateSiddharNadiAmsa(0.1).half, 'para');
assert.equal(calculateSiddharNadiAmsa(0.1).halfNumber, 2);
assert.equal(calculateSiddharNadiAmsa(0.2).signIndex, 1);
assert.equal(calculateSiddharNadiAmsa(30).signIndex, 6);
assert.equal(calculateSiddharNadiAmsa(-0.1).halfNumber, 300);

console.log('Nāḍī-aṁśa tests passed');
