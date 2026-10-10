import assert from 'node:assert/strict';
import { DEFAULT_NAKSHATRA_MODE, NAKSHATRA_MODES, nakshatraAdjustFor, readNakshatraMode } from './nakshatraZodiac';

// --- What is stored ----------------------------------------------------------------------------
assert.equal(DEFAULT_NAKSHATRA_MODE, 'same', 'the nakshatras follow the grahas to begin with');
assert.equal(readNakshatraMode(undefined), 'same');
assert.equal(readNakshatraMode('same'), 'same');
assert.equal(readNakshatraMode('lahiri'), 'lahiri');
assert.equal(readNakshatraMode('tropical'), 'tropical');
assert.equal(readNakshatraMode('sidereal'), 'same', 'the old default, "sidereal (Lahiri)", is the same as the grahas now');
assert.equal(readNakshatraMode('raman'), 'same', 'an unknown value is the default');
assert.equal(readNakshatraMode(3), 'same');
assert.deepEqual([...NAKSHATRA_MODES], ['same', 'lahiri', 'tropical']);

// --- The adjustment, with a chart in the Raman ayanamsa (22.6°) and Lahiri at 24.2° -----------------
const raman = 22.6;
const lahiri = 24.2;
assert.equal(nakshatraAdjustFor('same', raman, lahiri), 0, 'the same ayanamsa as the grahas: no change');
assert.ok(Math.abs(nakshatraAdjustFor('lahiri', raman, lahiri) - (raman - lahiri)) < 1e-12, 'Lahiri is 1.6 degrees further on than Raman');
assert.equal(nakshatraAdjustFor('tropical', raman, lahiri), raman, 'the tropical longitude is the sidereal one plus the ayanamsa');

// A chart in Lahiri itself: Lahiri and the same one agree.
assert.equal(nakshatraAdjustFor('lahiri', lahiri, lahiri), 0);
assert.equal(nakshatraAdjustFor('same', lahiri, lahiri), 0);
assert.equal(nakshatraAdjustFor('lahiri', lahiri), 0, 'without a separate Lahiri value there is nothing to adjust');

// A graha at sidereal 10° Aries (Raman) is at tropical 32.6° = 2.6° Taurus; in Lahiri it is 8.4° Aries.
const longitude = 10;
assert.ok(Math.abs(longitude + nakshatraAdjustFor('tropical', raman, lahiri) - 32.6) < 1e-9);
assert.ok(Math.abs(longitude + nakshatraAdjustFor('lahiri', raman, lahiri) - 8.4) < 1e-9);

console.log('Nakshatra zodiac tests passed');
