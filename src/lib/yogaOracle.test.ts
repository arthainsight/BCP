import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { calculateYogas } from './yogas';
import { getRashiAspectSigns } from './drishti';

// ---------------------------------------------------------------------------
// The yoga engine against its own stated rules. Every yoga here is worked out a second time, straight from the
// rule the engine prints for it (the `rule` text) and from tables written out again in this file, and the two are
// compared on thousands of random charts. A slip in a sign table, a house count or a condition shows up as a
// disagreement on some chart, which a handful of hand-made examples would miss. What this does not check is
// whether a rule is the one a tradition teaches; the list at the end names the rules that are only as good as
// their source.
// ---------------------------------------------------------------------------

// A small seeded random generator, so a failure can be repeated.
let seed = 20261014;
const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const randomInt = (n: number) => Math.floor(random() * n);

const NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
const SIGN_LORD = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const EXALT: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7 };
const DEBIL: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1 };
const PANCHA: [string, string, number[], number][] = [
  ['ruchaka', 'Mars', [1, 8], 10], ['bhadra', 'Mercury', [3, 6], 6], ['hamsa', 'Jupiter', [9, 12], 4],
  ['malavya', 'Venus', [2, 7], 12], ['shasha', 'Saturn', [10, 11], 7],
];
const ELIGIBLE = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];

const relSign = (reference: number, n: number) => ((reference - 1 + n - 1) % 12) + 1;

// The rāśi aspect of Jaimini, from the rule itself: a movable sign aspects the fixed signs except the one next to
// it, a fixed sign the movable signs except the one before it, a dual sign the other dual signs.
const kind = (sign: number) => (sign % 3 === 1 ? 'movable' : sign % 3 === 2 ? 'fixed' : 'dual');
function aspected(sign: number): number[] {
  const all = Array.from({ length: 12 }, (_, i) => i + 1);
  if (kind(sign) === 'movable') return all.filter(s => kind(s) === 'fixed' && s !== sign % 12 + 1);
  if (kind(sign) === 'fixed') return all.filter(s => kind(s) === 'movable' && s !== sign - 1);
  return all.filter(s => kind(s) === 'dual' && s !== sign);
}
for (let sign = 1; sign <= 12; sign++) {
  assert.deepEqual([...getRashiAspectSigns(sign)].sort((a, b) => a - b), aspected(sign), `the rāśi aspect of sign ${sign}`);
}

function randomChart() {
  const ascendant = randomInt(12) + 1;
  const planets: PlanetData[] = NAMES.map(name => {
    const sign = randomInt(12) + 1;
    const degree = random() * 30;
    return { name, sign, degree, longitude: (sign - 1) * 30 + degree, house: ((sign - ascendant + 12) % 12) + 1 };
  });
  return { ascendant, planets };
}

type Chart = ReturnType<typeof randomChart>;

// Benefic or not, as the Moon's phase and Mercury's company make it.
function benefic(name: string, planets: PlanetData[]): boolean | null {
  const at = (n: string) => planets.find(p => p.name === n)!;
  if (name === 'Jupiter' || name === 'Venus') return true;
  if (name === 'Mercury') return !planets.some(p => ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'].includes(p.name) && p.sign === at('Mercury').sign);
  if (name === 'Moon') {
    const elongation = (((at('Moon').longitude - at('Sun').longitude) % 360) + 360) % 360;
    if (elongation >= 120 && elongation <= 240) return true;
    if (elongation <= 60 || elongation >= 300) return false;
    return null;
  }
  return false;
}

function expected({ ascendant, planets }: Chart): Record<string, boolean> {
  const at = (name: string) => planets.find(p => p.name === name)!;
  const inSign = (sign: number, names: string[]) => planets.filter(p => names.includes(p.name) && p.sign === sign);
  const sun = at('Sun'); const moon = at('Moon'); const jupiter = at('Jupiter');
  const result: Record<string, boolean> = {};

  const sun12 = inSign(relSign(sun.sign, 12), ELIGIBLE).length > 0;
  const sun2 = inSign(relSign(sun.sign, 2), ELIGIBLE).length > 0;
  result.vosi = sun12; result.vesi = sun2; result.ubhayachari = sun12 && sun2;
  const moon12 = inSign(relSign(moon.sign, 12), ELIGIBLE).length > 0;
  const moon2 = inSign(relSign(moon.sign, 2), ELIGIBLE).length > 0;
  result.anapha = moon12; result.sunapha = moon2; result.durudhara = moon12 && moon2; result.kemadruma = !moon12 && !moon2;

  result.mukuta = KENDRA.includes(jupiter.house) && TRIKONA.includes(moon.house);

  const lordOfHouse = (house: number) => SIGN_LORD[relSign(ascendant, house) - 1];
  let raja = false;
  for (const kl of new Set(KENDRA.map(lordOfHouse))) for (const tl of new Set(TRIKONA.map(lordOfHouse))) {
    if (kl !== tl && at(kl).sign === at(tl).sign) raja = true;
  }
  result.raja = raja;

  const fromJupiter = ((moon.sign - jupiter.sign + 12) % 12) + 1;
  result.sakata = fromJupiter === 6 || fromJupiter === 8;

  const l2 = lordOfHouse(2); const l11 = lordOfHouse(11);
  result.dhana = l2 === l11 ? true : at(l2).sign === at(l11).sign;

  result.chandra = KENDRA.includes(moon.house);

  const beneficsIn = (sign: number) => inSign(sign, ['Jupiter', 'Venus', 'Mercury']).length > 0;
  result.adhi = [6, 7, 8].every(n => beneficsIn(relSign(moon.sign, n)));

  const tracked = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const exalted = tracked.filter(n => at(n).sign === EXALT[n]).length;
  const debilitated = tracked.filter(n => at(n).sign === DEBIL[n]).length;
  result.uttama = exalted >= 3; result.adhama = debilitated >= 3; result.sama = exalted >= 1 && debilitated >= 1 && exalted === debilitated;

  for (const [id, name, own, exalt] of PANCHA) {
    const p = at(name);
    result[id] = (own.includes(p.sign) || p.sign === exalt) && KENDRA.includes(p.house);
  }

  const candidates = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
  result['amala-lagna'] = candidates.some(n => at(n).house === 10 && benefic(n, planets) === true);
  const tenthFromMoon = relSign(moon.sign, 10);
  result['amala-moon'] = candidates.some(n => n !== 'Moon' && at(n).sign === tenthFromMoon && benefic(n, planets) === true);

  result['budha-aditya'] = sun.sign === at('Mercury').sign;
  result['chandra-mangala'] = moon.sign === at('Mars').sign || aspected(moon.sign).includes(at('Mars').sign);

  const lagnaAspect = aspected(ascendant);
  result.susubha = candidates.some(n => benefic(n, planets) === true && (at(n).sign === ascendant || lagnaAspect.includes(at(n).sign)));

  result.amara = false; result.dhvaja = false; result.muni = false;
  return result;
}

const disagreements: string[] = [];
const seen = new Map<string, { active: number; inactive: number }>();
const CHARTS = 6000;
for (let index = 0; index < CHARTS; index++) {
  const chart = randomChart();
  const want = expected(chart);
  const got = calculateYogas(chart.planets, chart.ascendant);
  assert.equal(got.length, Object.keys(want).length, 'the engine returns every yoga once');
  for (const yoga of got) {
    assert.ok(yoga.id in want, `${yoga.id} is known to the check`);
    const count = seen.get(yoga.id) ?? { active: 0, inactive: 0 };
    count[yoga.status === 'active' ? 'active' : 'inactive']++;
    seen.set(yoga.id, count);
    if ((yoga.status === 'active') !== want[yoga.id] && disagreements.length < 10) {
      disagreements.push(`${yoga.id}: engine ${yoga.status}, rule says ${want[yoga.id] ? 'active' : 'inactive'} — ascendant ${chart.ascendant}, ${chart.planets.map(p => `${p.name}${p.sign}`).join(' ')}`);
    }
  }
}
assert.deepEqual(disagreements, [], `the engine and its stated rules disagree:\n${disagreements.join('\n')}`);

// The comparison means something only if both outcomes were met: every yoga that can fire fired on some chart
// and stayed quiet on others (the three whose definition is pending never fire).
for (const [id, { active, inactive }] of seen) {
  if (['amara', 'dhvaja', 'muni'].includes(id)) { assert.equal(active, 0, `${id} stays inactive until its definition is settled`); continue; }
  assert.ok(active > 0, `${id} fired on some chart (${CHARTS} tried)`);
  assert.ok(inactive > 0, `${id} stayed quiet on some chart`);
}

console.log('yoga oracle tests passed');
