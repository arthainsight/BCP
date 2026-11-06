import assert from 'node:assert/strict';
import {
  PARIVRITTI_DIVISIONS, VARGA_METHODS, getVargaSignIndex, isVargaMethod, methodAppliesTo, parivrittiScheme, parivrittiSign,
} from './index';
import { buildVargaChart } from '../vargaChart';
import { vargaChartProps } from '../vargaChartProps';
import { buildVargaMatrix } from '../vargaMatrix';
import { followPlanet } from '../vargaFollow';
import { migrateChartDisplaySettings } from '../chartDisplaySettings';
import { DEFAULT_CHART_DISPLAY, type ChartData } from '@/types';

// The Parivṛtti ways of placing the parts, worked out by hand (signs 0 = Aries … 11 = Pisces). PyJHora's comparison is in
// pyjhoraVargas.test.ts; these say what each rule means, so that a reader can check them against the words of parivritti.ts.
const at = (sign: number, degree: number) => sign * 30 + degree;

// --- cyclic: the parts run on round the zodiac, sign s part p → (s × division + p) mod 12 ---------------------------
// Hora (D2): Aries parts → Aries, Taurus; Taurus parts → Gemini, Cancer; Gemini → Leo, Virgo …
assert.deepEqual([at(0, 5), at(0, 20)].map(l => parivrittiSign(l, 2, 'cyclic')), [0, 1]);
assert.deepEqual([at(1, 5), at(1, 20)].map(l => parivrittiSign(l, 2, 'cyclic')), [2, 3]);
assert.deepEqual([at(2, 5), at(2, 20)].map(l => parivrittiSign(l, 2, 'cyclic')), [4, 5]);
// Drekkana (D3): Aries 0,1,2; Taurus 3,4,5; Cancer 9,10,11; Leo 0,1,2 again (the twelve signs make 36 parts, three rounds).
assert.deepEqual([at(0, 5), at(0, 15), at(0, 25)].map(l => parivrittiSign(l, 3, 'cyclic')), [0, 1, 2]);
assert.deepEqual([at(1, 5), at(1, 15), at(1, 25)].map(l => parivrittiSign(l, 3, 'cyclic')), [3, 4, 5]);
assert.deepEqual([at(3, 5), at(3, 15), at(3, 25)].map(l => parivrittiSign(l, 3, 'cyclic')), [9, 10, 11]);
assert.deepEqual([at(4, 5), at(4, 15), at(4, 25)].map(l => parivrittiSign(l, 3, 'cyclic')), [0, 1, 2]);
// The Dasamsa (D10): ten parts a sign, so Aries 0…9, Taurus 10, 11, 0 …, and the whole round is ten times the zodiac.
assert.equal(parivrittiSign(at(0, 29), 10, 'cyclic'), 9);
assert.equal(parivrittiSign(at(1, 0.5), 10, 'cyclic'), 10);
assert.equal(parivrittiSign(at(1, 29), 10, 'cyclic'), 7, 'Taurus part 9: (10 + 9) mod 12');

// --- even-reverse: as cyclic, the parts of an even sign (Taurus, Cancer …) taken last to first ------------------------
// Hora: Aries (0, 1); Taurus part 1 is first: (2 + 1, 2 + 0) = (3, 2).
assert.deepEqual([at(0, 5), at(0, 20)].map(l => parivrittiSign(l, 2, 'even-reverse')), [0, 1]);
assert.deepEqual([at(1, 5), at(1, 20)].map(l => parivrittiSign(l, 2, 'even-reverse')), [3, 2]);
// Drekkana: Aries 0, 1, 2; Taurus (3 + 2, 3 + 1, 3 + 0) = 5, 4, 3 — the same signs as cyclic, in the other order.
assert.deepEqual([at(1, 5), at(1, 15), at(1, 25)].map(l => parivrittiSign(l, 3, 'even-reverse')), [5, 4, 3]);
assert.deepEqual([at(2, 5), at(2, 15), at(2, 25)].map(l => parivrittiSign(l, 3, 'even-reverse')), [6, 7, 8]);

// --- alternate (Somanātha): odd signs run forward from Aries, even signs backward from Pisces -----------------------------
// Hora: Aries (0, 1); Taurus (11, 10); Gemini (2, 3); Cancer (9, 8); Leo (4, 5); Virgo (7, 6) …
assert.deepEqual([at(0, 5), at(0, 20)].map(l => parivrittiSign(l, 2, 'alternate')), [0, 1]);
assert.deepEqual([at(1, 5), at(1, 20)].map(l => parivrittiSign(l, 2, 'alternate')), [11, 10]);
assert.deepEqual([at(2, 5), at(2, 20)].map(l => parivrittiSign(l, 2, 'alternate')), [2, 3]);
assert.deepEqual([at(3, 5), at(3, 20)].map(l => parivrittiSign(l, 2, 'alternate')), [9, 8]);
assert.deepEqual([at(4, 5), at(4, 20)].map(l => parivrittiSign(l, 2, 'alternate')), [4, 5]);
assert.deepEqual([at(5, 5), at(5, 20)].map(l => parivrittiSign(l, 2, 'alternate')), [7, 6]);
// Drekkana: Taurus (11, 10, 9); Gemini (3, 4, 5).
assert.deepEqual([at(1, 5), at(1, 15), at(1, 25)].map(l => parivrittiSign(l, 3, 'alternate')), [11, 10, 9]);
assert.deepEqual([at(2, 5), at(2, 15), at(2, 25)].map(l => parivrittiSign(l, 3, 'alternate')), [3, 4, 5]);

// --- What holds for every scheme and division -----------------------------------------------------------------------------
for (const scheme of ['cyclic', 'even-reverse', 'alternate'] as const) {
  for (const division of PARIVRITTI_DIVISIONS[scheme]) {
    for (let longitude = 0; longitude < 360; longitude += 0.73) {
      const sign = parivrittiSign(longitude, division, scheme);
      assert.ok(Number.isInteger(sign) && sign >= 0 && sign <= 11, `${scheme} D${division} ${longitude}`);
    }
    // The twelve signs together fill the circle: the parts of all of them are division × 12 places, and each sign of the
    // zodiac gets as many of them as the division has parts.
    const counts = new Array(12).fill(0) as number[];
    for (let sign = 0; sign < 12; sign += 1) {
      for (let part = 0; part < division; part += 1) counts[parivrittiSign(at(sign, (part + 0.5) * (30 / division)), division, scheme)] += 1;
    }
    assert.deepEqual(counts, new Array(12).fill(division), `${scheme} D${division}: every sign is taken the same number of times`);
  }
}

// --- Where the methods apply, and where they do not --------------------------------------------------------------------------
assert.equal(parivrittiScheme('parasara'), null);
assert.equal(parivrittiScheme('parivritti-alternate'), 'alternate');
assert.ok(VARGA_METHODS.every(isVargaMethod) && !isVargaMethod('parivritti') && !isVargaMethod(undefined));
assert.equal(methodAppliesTo('parasara', 10), false);
assert.equal(methodAppliesTo('parivritti-cyclic', 10), true);
assert.equal(methodAppliesTo('parivritti-cyclic', 9), false, 'PyJHora has the Navamsa by the alternate rule only');
assert.equal(methodAppliesTo('parivritti-alternate', 9), true);
for (const division of [1, 24, 30, 60]) for (const method of VARGA_METHODS) assert.equal(methodAppliesTo(method, division), false, `D${division} has no Parivṛtti rule`);

// getVargaSignIndex: the Parāśara rule is the default and what a method with no rule for the division gives.
const sample = at(4, 17.3);
for (const division of [1, 2, 3, 9, 10, 24, 30, 60]) assert.equal(getVargaSignIndex(sample, division), getVargaSignIndex(sample, division, 'parasara'));
assert.equal(getVargaSignIndex(sample, 30, 'parivritti-alternate'), getVargaSignIndex(sample, 30), 'D30: the Parāśara rule stays');
assert.equal(getVargaSignIndex(sample, 9, 'parivritti-cyclic'), getVargaSignIndex(sample, 9), 'D9 by the cyclic rule: the Parāśara rule stays');
assert.equal(getVargaSignIndex(sample, 10, 'parivritti-cyclic'), parivrittiSign(sample, 10, 'cyclic'));
// (Leo 17°18′ happens to be the same sign by both rules, so another longitude is used for the difference.)
// Virgo 17°18′ is the 6th part of an even sign: the Parāśara rule starts from the 9th sign, Taurus (1), and gets (1 + 5) = Libra (6);
// the cyclic rule gets (5 × 10 + 5) mod 12 = Scorpio (7).
assert.equal(getVargaSignIndex(at(5, 17.3), 10), 6);
assert.equal(getVargaSignIndex(at(5, 17.3), 10, 'parivritti-cyclic'), 7);

// --- The charts follow the method, the strengths do not -------------------------------------------------------------------
const chart = {
  ascendant: { sign: 5, degree: 12, longitude: at(4, 12) },
  planets: [{ name: 'Sun', longitude: at(0, 12), sign: 1, degree: 12, house: 8, isRetrograde: false, speed: 1 }, { name: 'Moon', longitude: at(1, 4), sign: 2, degree: 4, house: 9, isRetrograde: false, speed: 13 }],
  specialLagnas: [],
} as unknown as ChartData;
const parasara = buildVargaChart(chart, 10);
const cyclic = buildVargaChart(chart, 10, 'parivritti-cyclic');
assert.equal(parasara.planets[0].sign, getVargaSignIndex(at(0, 12), 10) + 1);
assert.equal(cyclic.planets[0].sign, parivrittiSign(at(0, 12), 10, 'cyclic') + 1);
assert.equal(cyclic.ascendantSign, parivrittiSign(at(4, 12), 10, 'cyclic') + 1, 'the divisional Lagna follows the rule too');
// The degree inside the sign does not depend on the rule.
assert.equal(cyclic.planets[0].degree, parasara.planets[0].degree);
assert.deepEqual(buildVargaChart(chart, 9, 'parivritti-cyclic'), buildVargaChart(chart, 9), 'a division with no such rule is unchanged');
// vargaChartProps reads the method from the display settings.
const propsOf = (vargaMethod: typeof DEFAULT_CHART_DISPLAY.vargaMethod) => vargaChartProps({ chart, division: 10, compact: true, chartDisplaySettings: { ...DEFAULT_CHART_DISPLAY, vargaMethod } }).ascendantSign;
assert.equal(propsOf('parasara'), parasara.ascendantSign);
assert.equal(propsOf('parivritti-cyclic'), cyclic.ascendantSign);
// The matrix and the follow strip take it too.
assert.equal(buildVargaMatrix({ Sun: at(0, 12) }, at(4, 12), [10], 'parivritti-cyclic').Sun.D10.signIndex, parivrittiSign(at(0, 12), 10, 'cyclic'));
assert.equal(followPlanet(chart, 'Sun', [10], 'parivritti-cyclic')[0].sign, cyclic.planets[0].sign);
assert.equal(followPlanet(chart, 'Sun', [10])[0].sign, parasara.planets[0].sign);

// --- The setting: the Parāśara rule to begin with, and only the four there are -------------------------------------------------
assert.equal(DEFAULT_CHART_DISPLAY.vargaMethod, 'parasara');
assert.equal(migrateChartDisplaySettings({}).vargaMethod, 'parasara', 'settings from before the rule was a setting');
assert.equal(migrateChartDisplaySettings({ vargaMethod: 'parivritti-alternate' }).vargaMethod, 'parivritti-alternate');
assert.equal(migrateChartDisplaySettings({ vargaMethod: 'parivritti' }).vargaMethod, 'parasara', 'a rule that is not one falls back');
assert.equal(migrateChartDisplaySettings({ vargaMethod: 3 }).vargaMethod, 'parasara', 'a value of the wrong type is ignored');

console.log('Parivṛtti tests passed');
