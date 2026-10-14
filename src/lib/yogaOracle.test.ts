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

function randomChart(kind = 0) {
  const ascendant = randomInt(12) + 1;
  const signOfHouse = (house: number) => ((ascendant - 1 + house - 1) % 12) + 1;
  let signs: number[];
  if (kind % 4 === 1) {
    // The planets crowded into a few signs.
    const pool = Array.from({ length: 2 + randomInt(5) }, () => randomInt(12) + 1);
    signs = NAMES.map(() => pool[randomInt(pool.length)]);
  } else if (kind % 4 === 2) {
    // The seven planets spread over the houses a Nabhasa pattern names, each of them occupied.
    const masks = AKRITI_MASKS[randomInt(AKRITI_MASKS.length)][1];
    const bits = masks[randomInt(masks.length)];
    const houses = Array.from({ length: 12 }, (_, index) => index + 1).filter(house => bits & (1 << (house - 1)));
    const order = [...NAMES.keys()].sort(() => random() - 0.5).slice(0, 7);
    signs = NAMES.map((_, index) => {
      const place = order.indexOf(index);
      return signOfHouse(place >= 0 && place < houses.length ? houses[place] : houses[randomInt(houses.length)]);
    });
    // The nodes go anywhere.
    signs[7] = randomInt(12) + 1; signs[8] = randomInt(12) + 1;
  } else if (kind % 4 === 3) {
    // The planets in the houses the Matsya yoga names and a few more.
    const pool = [1, 4, 5, 8, 9, ...Array.from({ length: randomInt(3) }, () => randomInt(12) + 1)];
    signs = NAMES.map(() => signOfHouse(pool[randomInt(pool.length)]));
  } else {
    signs = NAMES.map(() => randomInt(12) + 1);
  }
  const planets: PlanetData[] = NAMES.map((name, index) => {
    const sign = signs[index];
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


// ---------------------------------------------------------------------------
// The yogas of yogasClassical.ts, worked out a second time from the rules as the texts state them: the Nabhasa yogas
// (BPHS 35) by the houses the seven planets occupy (a mask of twelve bits), the others (BPHS 36 and 39, Raman,
// JHora) planet by planet.
// ---------------------------------------------------------------------------
const mask = (houses: number[]) => houses.reduce((bits, house) => bits | (1 << (house - 1)), 0);
const consecutive = (start: number, length: number) => mask(Array.from({ length }, (_, offset) => ((start - 1 + offset) % 12) + 1));
const ASPECT_OFFSETS: Record<string, number[]> = { Mars: [7, 4, 8], Jupiter: [7, 5, 9], Saturn: [7, 3, 10] };
/** Whether a graha, by the aspects of Parāśara, looks at a sign. */
const looksAt = (graha: PlanetData, sign: number) => (ASPECT_OFFSETS[graha.name] ?? [7]).some(offset => ((graha.sign - 1 + offset - 1) % 12) + 1 === sign);

const AKRITI_MASKS: [string, number[]][] = [
  ['gada', [mask([1, 4]), mask([4, 7]), mask([7, 10]), mask([10, 1])]],
  ['sakata', [mask([1, 7])]],
  ['vihaga', [mask([4, 10])]],
  ['shringataka', [mask([1, 5, 9])]],
  ['hala', [mask([2, 6, 10]), mask([3, 7, 11]), mask([4, 8, 12])]],
  ['kamala', [mask([1, 4, 7, 10])]],
  ['vapi', [mask([2, 5, 8, 11]), mask([3, 6, 9, 12])]],
  ['yupa', [consecutive(1, 4)]], ['shara', [consecutive(4, 4)]], ['shakti', [consecutive(7, 4)]], ['danda', [consecutive(10, 4)]],
  ['nauka', [consecutive(1, 7)]], ['koota', [consecutive(4, 7)]], ['chatra', [consecutive(7, 7)]], ['chapa', [consecutive(10, 7)]],
  ['ardha-chandra', [2, 3, 5, 6, 8, 9, 11, 12].map(start => consecutive(start, 7))],
  ['chakra', [mask([1, 3, 5, 7, 9, 11])]],
  ['samudra', [mask([2, 4, 6, 8, 10, 12])]],
];
const SANKHYA_NAMES = ['gola', 'yuga', 'shoola', 'kedara', 'pasha', 'dama', 'veena'];

function classicalExpected({ ascendant, planets }: Chart): Record<string, boolean> {
  const at = (name: string) => planets.find(p => p.name === name)!;
  const grahas = NAMES.slice(0, 7).map(at);
  const out: Record<string, boolean> = {};
  const isBenefic = (p: PlanetData) => benefic(p.name, planets) === true;
  const isMalefic = (p: PlanetData) => benefic(p.name, planets) === false;
  const occupied = mask(grahas.map(p => p.house));

  // Nabhasa
  const sign3 = (p: PlanetData) => (p.sign - 1) % 3;
  // Dala: a Kendra counts for the benefics when a benefic stands in it and no malefic, and the other way round.
  const kendrasWith = (wanted: boolean) => KENDRA.filter(kendra => {
    const here = grahas.filter(p => p.house === kendra);
    return here.some(p => benefic(p.name, planets) === wanted) && !here.some(p => benefic(p.name, planets) === !wanted);
  }).length;
  out['nabhasa-maala'] = kendrasWith(true) >= 3;
  out['nabhasa-sarpa'] = kendrasWith(false) >= 3;
  for (const [id, masks] of AKRITI_MASKS) out[`nabhasa-${id}`] = masks.includes(occupied);
  // Vajra and Yava: a benefic (or malefic) in each of the named houses, the others anywhere.
  const holdsIn = (houses: number[], wantBenefic: boolean) => houses.every(house => grahas.some(p => p.house === house && (wantBenefic ? isBenefic(p) : isMalefic(p))));
  out['nabhasa-vajra'] = holdsIn([1, 7], true) && holdsIn([4, 10], false);
  out['nabhasa-yava'] = holdsIn([4, 10], true) && holdsIn([1, 7], false);
  // A Dala or Akriti yoga stops the Ashraya yogas (Saravali) and the Sankhya yogas (BPHS 35.17).
  const blocked = Object.keys(out).some(id => out[id]);
  out['nabhasa-rajju'] = grahas.every(p => sign3(p) === 0) && !blocked;
  out['nabhasa-musala'] = grahas.every(p => sign3(p) === 1) && !blocked;
  out['nabhasa-nala'] = grahas.every(p => sign3(p) === 2) && !blocked;
  const signCount = new Set(grahas.map(p => p.sign)).size;
  SANKHYA_NAMES.forEach((name, index) => { out[`nabhasa-${name}`] = signCount === index + 1 && !blocked; });

  // Gajakesari
  const jupiter = at('Jupiter'); const moon = at('Moon'); const sun = at('Sun');
  const fromMoon = ((jupiter.sign - moon.sign + 12) % 12) + 1;
  const gap = (((jupiter.longitude - sun.longitude) % 360) + 360) % 360;
  const helped = ['Moon', 'Mercury', 'Venus'].map(at).some(p => isBenefic(p) && (p.sign === jupiter.sign || looksAt(p, jupiter.sign)));
  out.gajakesari = KENDRA.includes(fromMoon) && helped && jupiter.sign !== DEBIL.Jupiter && Math.min(gap, 360 - gap) >= 11
    && !['Mercury', 'Venus'].includes(SIGN_LORD[jupiter.sign - 1]);

  // Lords of houses
  const lordOf = (house: number) => at(SIGN_LORD[relSign(ascendant, house) - 1]);
  const ownSigns = (name: string) => SIGN_LORD.flatMap((lord, index) => (lord === name ? [index + 1] : []));
  const dignified = (p: PlanetData) => EXALT[p.name] === p.sign || ownSigns(p.name).includes(p.sign);
  out.lakshmi = KENDRA.includes(lordOf(9).house) && dignified(lordOf(9)) && (dignified(lordOf(1)) || [...KENDRA, ...TRIKONA].includes(lordOf(1).house));

  // Exchanges of signs, by the houses the two planets stand in.
  const exchanges: [number, number][] = [];
  for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) {
    if (SIGN_LORD[grahas[i].sign - 1] === grahas[j].name && SIGN_LORD[grahas[j].sign - 1] === grahas[i].name) exchanges.push([grahas[i].house, grahas[j].house]);
  }
  const between = (a: number, b: number) => exchanges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  out['maha-raja'] = between(1, 5);
  const kindOfExchange = ([x, y]: [number, number]) => ([x, y].some(h => [6, 8, 12].includes(h)) ? 'dainya' : [x, y].includes(3) ? 'khala' : 'maha');
  for (const kind of ['maha', 'khala', 'dainya']) out[`${kind}-parivartana`] = exchanges.some(exchange => kindOfExchange(exchange) === kind);

  const ninth = lordOf(9); const tenth = lordOf(10);
  out['dharma-karmadhipati'] = ninth.name === tenth.name || ninth.sign === tenth.sign || between(9, 10) || (looksAt(ninth, tenth.sign) && looksAt(tenth, ninth.sign));

  for (const [id, house] of [['harsha', 6], ['sarala', 8], ['vimala', 12]] as const) out[id] = [6, 8, 12].includes(lordOf(house).house);

  // Neecha Bhanga. Nobody is "in a Kendra from the Moon" who is the Moon.
  let cancelled = false;
  const kendraFrom = (p: PlanetData, reference: number) => KENDRA.includes(((p.sign - reference + 12) % 12) + 1);
  const kendraOfEither = (p: PlanetData) => kendraFrom(p, ascendant) || (p.name !== 'Moon' && kendraFrom(p, moon.sign));
  for (const p of grahas) {
    if (DEBIL[p.name] !== p.sign) continue;
    const owner = at(SIGN_LORD[p.sign - 1]);
    if (owner.name !== p.name && (EXALT[owner.name] === owner.sign || kendraOfEither(owner) || looksAt(owner, p.sign))) cancelled = true;
    const exaltationLord = at(SIGN_LORD[EXALT[p.name] - 1]);
    if (exaltationLord.name !== p.name && kendraOfEither(exaltationLord)) cancelled = true;
    for (const q of grahas) {
      if (q.name !== p.name && EXALT[q.name] === p.sign && (q.sign === p.sign || kendraOfEither(q))) cancelled = true;
    }
  }
  out['neecha-bhanga'] = cancelled;

  // Khadga, Kusuma, Matsya
  out.khadga = between(2, 9) && [...KENDRA, ...TRIKONA].includes(lordOf(1).house);
  const venus = at('Venus'); const saturn = at('Saturn');
  out.kusuma = [2, 5, 8, 11].includes(ascendant) && KENDRA.includes(venus.house) && TRIKONA.includes(moon.house)
    && planets.some(p => p.name !== 'Moon' && p.sign === moon.sign && isBenefic(p)) && saturn.house === 10;
  const nine = planets.filter(p => NAMES.includes(p.name as never));
  const inHouse = (house: number) => nine.filter(p => p.house === house);
  out.matsya = inHouse(1).some(isBenefic) && inHouse(9).some(isBenefic) && inHouse(5).some(isBenefic) && inHouse(5).some(isMalefic)
    && inHouse(4).some(isMalefic) && inHouse(8).some(isMalefic);
  return out;
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

  Object.assign(result, classicalExpected({ ascendant, planets }));

  result.amara = false; result.dhvaja = false; result.muni = false;
  return result;
}

const disagreements: string[] = [];
const seen = new Map<string, { active: number; inactive: number }>();
const CHARTS = 30000;
for (let index = 0; index < CHARTS; index++) {
  const chart = randomChart(index);
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
