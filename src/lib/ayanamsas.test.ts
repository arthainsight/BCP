import assert from 'node:assert/strict';
import { AYANAMSA_OPTIONS, applyAyanamsaOffset, ayanamsaModeNumber, normalizeAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { sweGetAyanamsa, sweJulday } from './ephemerisAdapter';
import { calculateChart } from './ephemeris';

function assertClose(actual: number, expected: number, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} was not within ${tolerance} of ${expected}`);
}

assert.equal(AYANAMSA_OPTIONS.filter((option) => option.group === 'Common').length, 10);
assert.equal(ayanamsaModeNumber('custom-lahiri'), 1);
assert.equal(ayanamsaModeNumber('chandra-hari'), 35);
assert.equal(ayanamsaModeNumber('wilhelm-mula'), 36);
assert.equal(ayanamsaModeNumber('mardyks'), 34);
assert.equal(ayanamsaModeNumber('babylonian-britton'), 38);
assert.equal(ayanamsaModeNumber('ushashashi'), 4);
assert.equal(resolveAyanamsaMode('unknown'), 'lahiri');
assert.equal(normalizeAyanamsaOffset(1.12345678), 1.123457);
assert.equal(normalizeAyanamsaOffset(-999), -180);
assertClose(applyAyanamsaOffset(23.85, 'custom-lahiri', 1), 24.85);
assertClose(applyAyanamsaOffset(23.85, 'custom-lahiri', -1), 22.85);
assert.equal(applyAyanamsaOffset(23.85, 'lahiri', 1), 23.85);

async function main() {
  const jd = await sweJulday(2000, 1, 1, 12);
  const modes = ['lahiri', 'chandra-hari', 'wilhelm-mula', 'mardyks', 'babylonian-britton', 'ushashashi'] as const;
  const values = await Promise.all(modes.map((mode) => sweGetAyanamsa(jd, mode)));
  values.forEach((value) => assert.ok(Number.isFinite(value) && value > 15 && value < 40));
  assert.equal(new Set(values.map((value) => value.toFixed(7))).size, values.length);

  const lahiri = await calculateChart(2000, 1, 1, 12, 0, 0, 60.1699, 24.9384, 2, 'lahiri', 'mean');
  const custom = await calculateChart(2000, 1, 1, 12, 0, 0, 60.1699, 24.9384, 2, 'custom-lahiri', 'mean', 1);
  assertClose(custom.debug.ayanamsa - lahiri.debug.ayanamsa, 1);
  assertClose(((lahiri.ascendant.longitude - custom.ascendant.longitude) + 360) % 360, 1);
  assertClose(((lahiri.planets[0].longitude - custom.planets[0].longitude) + 360) % 360, 1);
  console.log('Ayanamsa tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
