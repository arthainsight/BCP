import assert from 'node:assert/strict';
import { DASHA_FAMILIES, DASHA_REGISTRY, RENDERABLE_DASHAS } from './dashaRegistry';
import { DEFAULT_DASHA_SETTINGS } from '@/types';

// The Systems tab draws the daśā systems in three groups: every system is in exactly one, and every group is a known one.
assert.deepEqual(DASHA_FAMILIES.map(family => family.key), ['nakshatra', 'rasi', 'other']);
const families = new Set(DASHA_FAMILIES.map(family => family.key));
for (const item of DASHA_REGISTRY) assert.ok(families.has(item.family), `${item.key} is in a known group`);

const keys = (family: string) => RENDERABLE_DASHAS.filter(item => item.family === family).map(item => item.key);
assert.deepEqual(keys('nakshatra'), ['vimshottari', 'vimshottariVariant', 'vds', 'yogini', 'ashtottari'], 'the daśās that run by the Moon\'s nakṣatra');
assert.deepEqual(keys('rasi'), ['chara', 'kalaChakra', 'narayana', 'moola', 'sthira'], 'the daśās that run by signs');
assert.deepEqual(keys('other'), [], 'no system is in the third group yet');
assert.equal(keys('nakshatra').length + keys('rasi').length + keys('other').length, RENDERABLE_DASHAS.length);

// A system in the Settings list that the registry does not know cannot be chosen in the tab: every setting is a registry system.
assert.deepEqual(Object.keys(DEFAULT_DASHA_SETTINGS.dashas).sort(), DASHA_REGISTRY.map(item => item.key).sort());
// The older labels of the nakṣatra and rāśi kinds in Settings agree with the groups where they are given.
for (const item of DASHA_REGISTRY) if (item.kind === 'nakshatra' || item.kind === 'rasi') assert.equal(item.family, item.kind, `${item.key}: kind and group agree`);

console.log('Dasha registry tests passed');
