import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getVargaSignIndex, PARIVRITTI_DIVISIONS, type VargaMethod } from './varga';
import { VARGA_DIVISIONS } from './vargaChart';

// The divisional charts checked against another program: 150 charts at random moments between 1900 and 2040, ten bodies
// (the Lagna, the grahas, Rahu and Ketu) in every division the app draws, 28,500 signs in all, the sign each body takes in
// PyJHora 4.8.7 (fixtures/pyjhoraVargas.json, made by scripts/pyjhora_vargas.py). D2 is the traditional Parāśara hora (Leo and
// Cancer only); D6, D8 and D11 are the rules of the Parāśara tradition as PyJHora has them (not among the sixteen vargas of BPHS 6).
// The three Parivṛtti ways of placing the parts (cyclic, even-reverse, alternate) are checked in the divisions PyJHora has them for.
// The signs are ten hexadecimal digits, one for each body: 0 = Aries … b = Pisces.
const BODIES = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
type Fixture = {
  charts: { longitudes: Record<string, number>; signs: Record<string, string>; parivritti: Record<string, Record<string, string>> }[];
};
const { charts } = JSON.parse(readFileSync(new URL('./fixtures/pyjhoraVargas.json', import.meta.url), 'utf8')) as Fixture;
assert.equal(charts.length, 150);
const signOf = (digits: string, body: (typeof BODIES)[number]) => parseInt(digits[BODIES.indexOf(body)], 16);

const checked = new Set<number>();
let signs = 0;
const wrong: string[] = [];
for (const chart of charts) {
  for (const [factor, expected] of Object.entries(chart.signs)) {
    const division = Number(factor);
    checked.add(division);
    for (const body of BODIES) {
      signs += 1;
      const ours = getVargaSignIndex(chart.longitudes[body], division);
      const theirs = signOf(expected, body);
      if (ours !== theirs && wrong.length < 10) wrong.push(`D${division} ${body} at ${chart.longitudes[body].toFixed(5)}°: ${ours} against ${theirs}`);
    }
  }
}
assert.deepEqual(wrong, [], 'the signs of the divisional charts agree with PyJHora');
assert.equal(signs, 150 * 19 * 10);
// Every division the app draws is in the comparison (D1 is the sign itself).
for (const division of VARGA_DIVISIONS) if (division !== 1) assert.ok(checked.has(division), `D${division} is compared`);
for (const division of [6, 8, 11]) assert.ok(checked.has(division), `D${division} is compared`);

// The Parivṛtti schemes, division by division, in the divisions PyJHora has them for (and only those: the app has none elsewhere).
const wrongParivritti: string[] = [];
let parivrittiSigns = 0;
const coverage: Record<string, number[]> = {};
for (const chart of charts) {
  for (const [scheme, divisions] of Object.entries(chart.parivritti)) {
    for (const [factor, expected] of Object.entries(divisions)) {
      const division = Number(factor);
      const compared = (coverage[scheme] ??= []);
      if (!compared.includes(division)) compared.push(division);
      for (const body of BODIES) {
        parivrittiSigns += 1;
        const ours = getVargaSignIndex(chart.longitudes[body], division, `parivritti-${scheme}` as VargaMethod);
        const theirs = signOf(expected, body);
        if (ours !== theirs && wrongParivritti.length < 10) wrongParivritti.push(`${scheme} D${division} ${body} at ${chart.longitudes[body].toFixed(5)}°: ${ours} against ${theirs}`);
      }
    }
  }
}
assert.deepEqual(wrongParivritti, [], 'the Parivṛtti signs agree with PyJHora');
for (const scheme of ['cyclic', 'even-reverse', 'alternate'] as const) {
  assert.deepEqual([...coverage[scheme]].sort((a, b) => a - b), [...PARIVRITTI_DIVISIONS[scheme]], `${scheme}: the divisions compared are those the app gives the scheme for`);
}

console.log(`PyJHora varga tests passed: ${signs} signs in ${checked.size} divisions and ${parivrittiSigns} Parivṛtti signs agree.`);
