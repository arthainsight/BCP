import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getVargaSignIndex } from './varga';
import { VARGA_DIVISIONS } from './vargaChart';

// The divisional charts checked against another program: 150 charts at random moments between 1900 and 2040, ten bodies
// (the Lagna, the grahas, Rahu and Ketu) in every division the app draws, 28,500 signs in all, the sign each body takes in
// PyJHora 4.8.7 (fixtures/pyjhoraVargas.json, made by scripts/pyjhora_vargas.py). D2 is the traditional Parāśara hora (Leo and
// Cancer only); D6, D8 and D11 are the rules of the Parāśara tradition as PyJHora has them (not among the sixteen vargas of BPHS 6).
type Fixture = { charts: { longitudes: Record<string, number>; signs: Record<string, Record<string, number>> }[] };
const { charts } = JSON.parse(readFileSync(new URL('./fixtures/pyjhoraVargas.json', import.meta.url), 'utf8')) as Fixture;
assert.equal(charts.length, 150);

const checked = new Set<number>();
let signs = 0;
const wrong: string[] = [];
for (const chart of charts) {
  for (const [factor, expected] of Object.entries(chart.signs)) {
    const division = Number(factor);
    checked.add(division);
    for (const [body, sign] of Object.entries(expected)) {
      signs += 1;
      const ours = getVargaSignIndex(chart.longitudes[body], division);
      if (ours !== sign && wrong.length < 10) wrong.push(`D${division} ${body} at ${chart.longitudes[body].toFixed(5)}°: ${ours} against ${sign}`);
    }
  }
}
assert.deepEqual(wrong, [], 'the signs of the divisional charts agree with PyJHora');
assert.equal(signs, 150 * 19 * 10);
// Every division the app draws is in the comparison (D1 is the sign itself).
for (const division of VARGA_DIVISIONS) if (division !== 1) assert.ok(checked.has(division), `D${division} is compared`);
for (const division of [6, 8, 11]) assert.ok(checked.has(division), `D${division} is compared`);

console.log(`PyJHora varga tests passed: ${signs} signs in ${checked.size} divisions agree.`);
