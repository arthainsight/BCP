import assert from 'node:assert/strict';
import { evaluateKalachakraCondition } from './kalachakraCondition';
import { chooseLifespanMethod } from './lifespanMethod';

const sky = (list: Record<string, number>, retrograde: string[] = []) =>
  Object.entries(list).map(([name, longitude]) => ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, isRetrograde: retrograde.includes(name) }));
const base = { Sun: 200, Moon: 100, Mars: 40, Mercury: 190, Jupiter: 5, Venus: 60, Saturn: 130, Rahu: 120, Ketu: 300 };

// --- Phaladīpikā 22.30: the Kālachakra when the lord of the Moon's navāṁśa is strong ---------------------------------------------------------
// The Moon at Cancer 10° (100°) is at navāṁśa 30 of 108 counted from Aries: 30 mod 12 = 6, so Libra, ruled by Venus.
const libra = evaluateKalachakraCondition(sky(base));
assert.ok(libra.facts[0].values?.sign === 'Libra' && libra.facts[0].values?.lord === 'Venus');
// Venus in Gemini (Mercury's sign, a friend's) is strong: the condition is met.
assert.equal(libra.met, true);
// Venus in Aries (Mars's sign, neither own nor a friend's): not strong.
assert.equal(evaluateKalachakraCondition(sky({ ...base, Venus: 10 })).met, false);
// Venus in Virgo, its fall: not strong. In Pisces, its exaltation: strong.
assert.equal(evaluateKalachakraCondition(sky({ ...base, Venus: 170 })).met, false);
assert.equal(evaluateKalachakraCondition(sky({ ...base, Venus: 350 })).met, true);
// A combust graha is weak even in its exaltation (4.4): Venus in Pisces 8° from the Sun.
assert.equal(evaluateKalachakraCondition(sky({ ...base, Venus: 350, Sun: 355 })).met, false);
// A retrograde graha is strong whatever its sign (4.4): Venus in Aries, retrograde.
assert.equal(evaluateKalachakraCondition(sky({ ...base, Venus: 10 }, ['Venus'])).met, true);
assert.equal(evaluateKalachakraCondition(sky(base).filter(planet => planet.name !== 'Moon')).met, null);

// --- Phaladīpikā 22.28–29: which span of life -------------------------------------------------------------------------------------------------
const at = (list: Record<string, number>, ascendantSign: number) => chooseLifespanMethod(sky(list), ascendantSign);
// Two grahas make a sign strong: the Moon with Mars in Taurus is the strongest of the three signs: the Naisargika.
const moonStrong = at({ ...base, Sun: 200, Moon: 35, Mars: 40 }, 1);
assert.deepEqual(moonStrong?.methods, ['naisargika']);
assert.deepEqual(moonStrong?.strongest, ['Moon']);
// The Sun with two grahas in Libra: the Piṇḍāyu.
assert.deepEqual(at({ ...base, Sun: 200, Moon: 35, Mars: 190, Mercury: 195 }, 1)?.methods, ['pinda']);
// The Lagna with two grahas in it: the Aṃśāyu.
assert.deepEqual(at({ ...base, Sun: 200, Moon: 35, Mars: 5, Mercury: 8 }, 1)?.methods, ['amsha']);
// The Sun and the Moon in the same strong sign: equal, the mean of the two.
const equal = at({ ...base, Sun: 200, Moon: 190, Mars: 195 }, 1);
assert.deepEqual([...(equal?.methods ?? [])].sort(), ['naisargika', 'pinda']);
console.log('Kālachakra condition and lifespan method tests passed');
