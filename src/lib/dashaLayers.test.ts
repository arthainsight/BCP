import assert from 'node:assert/strict';
import { dashaHouseBorders, dashaMark, withDashaLayers } from '@/components/chartLayers';
import { DEFAULT_CHART_DISPLAY } from '@/types';

const lords = { md: 'Saturn', ad: 'Mercury', label: 'Vim' };
const on = { showDashaLords: true, showDashaHouses: true };

// The marks and the house borders are two layers that switch separately.
assert.equal(withDashaLayers(null, on), null);
assert.equal(withDashaLayers(lords, { showDashaLords: false, showDashaHouses: false }), null);
assert.deepEqual(withDashaLayers(lords, on), { ...lords, marks: true, houses: true });
assert.equal(dashaMark('Saturn', withDashaLayers(lords, { showDashaLords: false, showDashaHouses: true })), '');
assert.equal(dashaMark('Saturn', withDashaLayers(lords, on)), 'ᴹ');
assert.equal(dashaMark('Mercury', lords), 'ᴬ', 'a bare lords object still marks the planets');

// A house gets a border for each lord that sits in it; both in one house gives both.
const at = (...planets: string[]) => (planet: string) => planets.includes(planet);
assert.deepEqual(dashaHouseBorders(lords, at('Moon'), false), []);
assert.deepEqual(dashaHouseBorders(lords, at('Saturn'), false).map(b => b.key), ['md']);
assert.deepEqual(dashaHouseBorders(lords, at('Mercury'), true).map(b => b.key), ['ad']);
assert.deepEqual(dashaHouseBorders(lords, at('Saturn', 'Mercury'), false).map(b => b.key), ['md', 'ad']);
assert.match(dashaHouseBorders(lords, at('Saturn'), false)[0].title, /Mahadasha lord Saturn/);
assert.deepEqual(dashaHouseBorders(withDashaLayers(lords, { showDashaLords: true, showDashaHouses: false }), at('Saturn'), false), []);
assert.deepEqual(dashaHouseBorders(null, at('Saturn'), false), []);

// The house borders are on by default.
assert.equal(DEFAULT_CHART_DISPLAY.showDashaHouses, true);

console.log('Daśā layer tests passed');
