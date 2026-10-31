import assert from 'node:assert/strict';
import { DEFAULT_DASHA_SETTINGS, type PlanetData } from '@/types';
import { calculateCleanCharaMD, calculateCleanCharaSubDashas, jaiminiSubSigns } from './charaClean';

const planets: PlanetData[] = [
  { name: 'Sun', sign: 6, house: 3, degree: 20, longitude: 170 },
  { name: 'Moon', sign: 3, house: 12, degree: 6, longitude: 66 },
  { name: 'Mars', sign: 6, house: 3, degree: 10, longitude: 160 },
  { name: 'Mercury', sign: 7, house: 4, degree: 20, longitude: 200 },
  { name: 'Jupiter', sign: 1, house: 10, degree: 3, longitude: 3 },
  { name: 'Venus', sign: 7, house: 4, degree: 10, longitude: 190 },
  { name: 'Saturn', sign: 8, house: 5, degree: 24, longitude: 234 },
  { name: 'Rahu', sign: 12, house: 9, degree: 8, longitude: 338 },
  { name: 'Ketu', sign: 6, house: 3, degree: 8, longitude: 158 },
];
const settings = DEFAULT_DASHA_SETTINGS.charaOptions;
const custom = { ...settings, method: 'custom' as const };
const result = calculateCleanCharaMD(planets, 4, new Date(2000, 0, 1), settings);
assert.ok(result);
assert.equal(result.startSign, 4);
assert.equal(result.entries.length, 12);

assert.equal(settings.method, 'jaimini', 'the rules of the Jaimini Sūtras are the start');

// The Jaimini Sūtras (2.3.29): Cancer rising, the 9th is Pisces, an even pada: the signs run in reverse.
assert.deepEqual(result.entries.map(entry => entry.sign), [4, 3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5]);
// The years (2.3.26–29, BPHS 46.156): the count to the lord, less one, in the direction of the pada of the sign.
//  Cancer (even pada, reverse): the Moon in Gemini, 1 sign back: 1 year. Gemini (odd, direct): Mercury in Libra, 4 signs on: 4 years.
//  Taurus (odd, direct): Venus in Libra, 5 on: 5. Aries (odd, direct): Mars in Virgo, 5 on: 5.
//  Pisces (even, reverse): Jupiter in Aries; counting back from Pisces, Aries is the 11th sign (it is next only going forward): 11 years.
assert.deepEqual(result.entries.slice(0, 5).map(entry => entry.durationYears), [1, 4, 5, 5, 11]);

// The sub-periods (2.4.7–10): Cancer is movable and even: from the stronger of Cancer and Capricorn, the twelve signs in reverse.
const children = calculateCleanCharaSubDashas(result.entries[0], settings);
assert.equal(children.length, 12);
assert.ok(Math.abs(children.reduce((sum, entry) => sum + entry.durationYears, 0) - result.entries[0].durationYears) < 1e-10);
assert.deepEqual(children.map(entry => entry.sign), [children[0].sign, ...Array.from({ length: 11 }, (_, index) => ((children[0].sign - 2 - index + 24) % 12) + 1)], 'a movable even sign runs in reverse');
const grandchildren = calculateCleanCharaSubDashas(children[0], settings);
assert.equal(grandchildren.length, 12, 'the next level reads the same chart');

// The orders of the sub-periods from the commentary of the Tattvadarśa (Jaimini 2.4.8–10 with the Vṛddhakārikā), by name of the sign.
const NAMES = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const names = (parent: number, strong: number) => jaiminiSubSigns(parent, strong).map(sign => NAMES[sign - 1]).join(' ');
assert.equal(names(1, 1), 'Ar Ta Ge Cn Le Vi Li Sc Sg Cp Aq Pi', 'Aries, movable and odd: direct');
assert.equal(names(7, 1), 'Ar Ta Ge Cn Le Vi Li Sc Sg Cp Aq Pi', 'Libra, the strong one Aries: direct from Aries');
assert.equal(names(4, 4), 'Cn Ge Ta Ar Pi Aq Cp Sg Sc Li Vi Le', 'Cancer: reverse');
assert.equal(names(10, 10), 'Cp Sg Sc Li Vi Le Cn Ge Ta Ar Pi Aq', 'Capricorn: reverse');
assert.deepEqual(jaiminiSubSigns(5, 5).slice(0, 3), [5, 10, 3], 'Leo, direct by sixths: Leo, the 6th from it (Capricorn), the 6th from that (Cancer)');
assert.equal(new Set(jaiminiSubSigns(5, 5)).size, 12, 'by sixths every sign comes once');
assert.deepEqual(jaiminiSubSigns(2, 2).slice(0, 3), [2, 9, 4], 'Taurus, in reverse by sixths: Taurus, the 6th back (Capricorn), the 6th back from that (Cancer)');
assert.equal(names(3, 3), 'Ge Vi Sg Pi Li Cp Ar Cn Aq Ta Le Sc', 'Gemini: the angles, the next, the rest (the commentary)');
assert.equal(names(6, 6), 'Vi Ge Pi Sg Ta Aq Sc Le Cp Li Cn Ar', 'Virgo: the same in reverse (the commentary)');

// The custom method keeps the choices of the settings: Cancer, movable, runs forward with the next sign, Leo, and counts the sign itself.
const oldResult = calculateCleanCharaMD(planets, 4, new Date(2000, 0, 1), custom)!;
assert.equal(calculateCleanCharaSubDashas(oldResult.entries[0], custom)[0].sign, 5);
assert.equal(oldResult.entries[0].durationYears, 12, 'movable signs count forward, and inclusive: Cancer to Gemini is 11 signs on, 12 counting the sign itself');

// Starting from the Ātmakāraka follows the chart's karaka scheme: Rahu (reversed, 29.5°) leads only among eight karakas.
const rahuLeads = planets.map((p) => (p.name === 'Rahu' ? { ...p, degree: 0.5, longitude: 330.5 } : p));
const akOptions = { ...settings, start: 'ak' as const };
assert.equal(calculateCleanCharaMD(rahuLeads, 4, new Date(2000, 0, 1), { ...akOptions, karaka: { rankMode: 'degree', count: 8 } })?.startSign, 12);
assert.equal(calculateCleanCharaMD(rahuLeads, 4, new Date(2000, 0, 1), { ...akOptions, karaka: { rankMode: 'degree', count: 7 } })?.startSign, 8); // Saturn, 24°

console.log('Chara Daśā tests passed');
