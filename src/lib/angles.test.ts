import assert from 'node:assert/strict';
import { normalizeDegrees } from './angles';
import { getSignIndex, normalizeLongitude } from './varga/utils';

// ---------------------------------------------------------------------------
// The whole point of this helper is that an in-range value comes back
// bit-identical. The naive ((x % 360) + 360) % 360 does not, and the resulting
// one-ULP shortfall filed bodies sitting exactly on a boundary one step early.
// ---------------------------------------------------------------------------
const naive = (value: number) => ((value % 360) + 360) % 360;

// Values that the naive form actually corrupts.
const BOUNDARIES = [
  360 / 27,        // one nakṣatra
  (360 / 27) * 2,
  10 / 3,          // one D9 part
  30 / 7,          // one D7 part
  360 / 60,
  13.333333333333334,
];

for (const value of BOUNDARIES) {
  assert.equal(normalizeDegrees(value), value, `${value} must survive untouched`);
}

// Demonstrate the defect this replaces: at least one boundary genuinely moved.
const corrupted = BOUNDARIES.filter((value) => naive(value) !== value);
assert.ok(corrupted.length > 0, 'the naive form must actually corrupt some of these, or the test proves nothing');

// The shift goes either way depending on the value; what matters is that a
// downward one exists, since that is what pushed a body into the previous
// division. 360/27 is the case that actually broke the nakṣatra lookup.
assert.ok(
  corrupted.some((value) => naive(value) < value),
  'at least one boundary is undershot by the naive form',
);
assert.ok(naive(360 / 27) < 360 / 27, 'the nakṣatra width is the case that broke Panchang');

// ---------------------------------------------------------------------------
// Every whole degree and every sign cusp round-trips exactly.
// ---------------------------------------------------------------------------
for (let degree = 0; degree < 360; degree += 1) {
  assert.equal(normalizeDegrees(degree), degree, `whole degree ${degree}`);
}
for (let sign = 0; sign < 12; sign += 1) {
  const cusp = sign * 30;
  assert.equal(normalizeDegrees(cusp), cusp, `sign cusp at ${cusp}`);
  assert.equal(getSignIndex(cusp), sign, `a body exactly on the ${cusp}° cusp belongs to sign index ${sign}`);
}

// Nakṣatra cusps land in the nakṣatra they open, not the one before.
const NAKSHATRA = 360 / 27;
for (let index = 0; index < 27; index += 1) {
  const cusp = index * NAKSHATRA;
  assert.equal(
    Math.floor(normalizeDegrees(cusp) / NAKSHATRA),
    index,
    `a body exactly on nakṣatra cusp ${index} must belong to that nakṣatra`,
  );
}

// ---------------------------------------------------------------------------
// Wrapping behaviour
// ---------------------------------------------------------------------------
assert.equal(normalizeDegrees(0), 0);
assert.equal(normalizeDegrees(359.9), 359.9);
assert.equal(normalizeDegrees(360), 0, 'a full turn comes back to zero');
assert.equal(normalizeDegrees(361), 1);
assert.equal(normalizeDegrees(720), 0);
assert.equal(normalizeDegrees(-1), 359);
assert.equal(normalizeDegrees(-90), 270);
assert.equal(normalizeDegrees(-360), 0, 'a negative full turn is still zero, not 360');
assert.equal(normalizeDegrees(-361), 359);

// The result is always inside [0, 360).
for (const value of [-1000, -360.5, -0.001, 0, 0.001, 359.999, 360, 1000, 12345.678]) {
  const wrapped = normalizeDegrees(value);
  assert.ok(wrapped >= 0 && wrapped < 360, `${value} wrapped to ${wrapped}, outside [0, 360)`);
}

// varga/utils delegates rather than keeping a second copy.
for (const value of [...BOUNDARIES, -45, 400]) {
  assert.equal(normalizeLongitude(value), normalizeDegrees(value), `varga normalizeLongitude agrees at ${value}`);
}

console.log('Angle normalization tests passed');
