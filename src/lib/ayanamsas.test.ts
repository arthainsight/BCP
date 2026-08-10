import assert from 'node:assert/strict';
import { AYANAMSA_OPTIONS, ayanamsaModeNumber, resolveAyanamsaMode } from './ayanamsas';
import { sweGetAyanamsa, sweJulday } from './ephemerisAdapter';

assert.equal(AYANAMSA_OPTIONS.filter((option) => option.group === 'Common').length, 10);
assert.equal(ayanamsaModeNumber('chandra-hari'), 35);
assert.equal(ayanamsaModeNumber('wilhelm-mula'), 36);
assert.equal(ayanamsaModeNumber('mardyks'), 34);
assert.equal(ayanamsaModeNumber('babylonian-britton'), 38);
assert.equal(ayanamsaModeNumber('ushashashi'), 4);
assert.equal(resolveAyanamsaMode('unknown'), 'lahiri');

async function main() {
  const jd = await sweJulday(2000, 1, 1, 12);
  const modes = ['lahiri', 'chandra-hari', 'wilhelm-mula', 'mardyks', 'babylonian-britton', 'ushashashi'] as const;
  const values = await Promise.all(modes.map((mode) => sweGetAyanamsa(jd, mode)));
  values.forEach((value) => assert.ok(Number.isFinite(value) && value > 15 && value < 40));
  assert.equal(new Set(values.map((value) => value.toFixed(7))).size, values.length);
  console.log('Ayanamsa tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });