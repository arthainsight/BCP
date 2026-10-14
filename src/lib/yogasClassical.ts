import type { PlanetData } from '@/types';
import type { YogaResult } from './yogas';
import { DEBILITATION, EXALTATION, NATURAL_ENEMIES, OWN_SIGNS } from './dignity';
import { signLord, signName } from './signs';
import { normalizeDegrees } from './angles';
import { KENDRAS, dynamicBeneficStatus, houseFrom, ordinal, signFrom } from './yogaCommon';

// Yogas of the classical texts that the main list lacks. The first group is the 32 Nabhasa yogas of Brihat Parashara
// Hora Shastra chapter 35, which look at where the seven grahas (the Sun to Saturn; the nodes are not counted) stand
// as a whole. The second group is single yogas of BPHS chapters 36 and 39 and of the later tradition (Raman,
// Phaladeepika, JHora): Gajakesari, Lakshmi, Maha Raja, Dharma-Karmadhipati, the three Parivartanas, the three
// Viparita Rajas, Neecha Bhanga, Khadga, Kusuma and Matsya. Where the sources differ the rule here is one of them
// and the rule text says which.

const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
const NINE = [...SEVEN, 'Rahu', 'Ketu'] as const;
const DUSTHANAS = [6, 8, 12];
const TRIKONAS = [1, 5, 9];

type Seed = Pick<YogaResult, 'id' | 'name' | 'category' | 'referencePlanet' | 'rule'>;

function result(seed: Seed, active: boolean, planetsInvolved: string[], resultText: string): YogaResult {
  return { ...seed, status: active ? 'active' : 'inactive', planetsInvolved: active ? [...new Set(planetsInvolved)] : [], resultText };
}

const sn = (sign: number) => signName(sign) ?? `sign ${sign}`;
const sameSet = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((value, index) => value === b[index]);
/** The houses start, start + 1 … counted `length` long, round the chart, in ascending order. */
const run = (start: number, length: number) => Array.from({ length }, (_, index) => ((start - 1 + index) % 12) + 1).sort((a, b) => a - b);

// ── Nabhasa yogas (BPHS 35) ──────────────────────────────────────────────────────────────────────────────────────

const NABHASA: Pick<Seed, 'category' | 'referencePlanet'> = { category: 'nabhasa', referencePlanet: 'Seven planets' };

/** The Akriti yogas that name the houses the seven planets occupy: every house of the set holds a planet and no other does. */
const AKRITI: { id: string; name: string; houses: number[][]; rule: string }[] = [
  { id: 'gada', name: 'Gada', houses: [[1, 4], [4, 7], [7, 10], [1, 10]], rule: 'All seven planets in two successive Kendras (1 and 4, 4 and 7, 7 and 10, or 10 and 1), both occupied' },
  { id: 'sakata', name: 'Sakata (Nabhasa)', houses: [[1, 7]], rule: 'All seven planets in the 1st and 7th houses, both occupied' },
  { id: 'vihaga', name: 'Vihaga', houses: [[4, 10]], rule: 'All seven planets in the 4th and 10th houses, both occupied' },
  { id: 'shringataka', name: 'Shringataka', houses: [[1, 5, 9]], rule: 'All seven planets in the 1st, 5th and 9th houses, all three occupied' },
  { id: 'hala', name: 'Hala', houses: [[2, 6, 10], [3, 7, 11], [4, 8, 12]], rule: 'All seven planets in the 2nd, 6th and 10th, or the 3rd, 7th and 11th, or the 4th, 8th and 12th houses, all three occupied' },
  { id: 'kamala', name: 'Kamala', houses: [[1, 4, 7, 10]], rule: 'All seven planets in the four Kendras, all four occupied' },
  { id: 'vapi', name: 'Vapi', houses: [[2, 5, 8, 11], [3, 6, 9, 12]], rule: 'All seven planets in the four Panapharas (2, 5, 8, 11) or the four Apoklimas (3, 6, 9, 12), all four occupied' },
  { id: 'yupa', name: 'Yupa', houses: [run(1, 4)], rule: 'All seven planets in the four houses from the 1st, all occupied' },
  { id: 'shara', name: 'Shara', houses: [run(4, 4)], rule: 'All seven planets in the four houses from the 4th, all occupied' },
  { id: 'shakti', name: 'Shakti', houses: [run(7, 4)], rule: 'All seven planets in the four houses from the 7th, all occupied' },
  { id: 'danda', name: 'Danda', houses: [run(10, 4)], rule: 'All seven planets in the four houses from the 10th, all occupied' },
  { id: 'nauka', name: 'Nauka', houses: [run(1, 7)], rule: 'The seven planets in the seven houses from the 1st, one in each' },
  { id: 'koota', name: 'Koota', houses: [run(4, 7)], rule: 'The seven planets in the seven houses from the 4th, one in each' },
  { id: 'chatra', name: 'Chatra', houses: [run(7, 7)], rule: 'The seven planets in the seven houses from the 7th, one in each' },
  { id: 'chapa', name: 'Chapa', houses: [run(10, 7)], rule: 'The seven planets in the seven houses from the 10th, one in each' },
  { id: 'ardha-chandra', name: 'Ardha Chandra', houses: [2, 3, 5, 6, 8, 9, 11, 12].map(start => run(start, 7)), rule: 'The seven planets in seven successive houses counted from a house that is not a Kendra, one in each (Saravali, quoted in BPHS 35.14)' },
  { id: 'chakra', name: 'Chakra', houses: [[1, 3, 5, 7, 9, 11]], rule: 'The seven planets in the six alternate houses from the 1st (1, 3, 5, 7, 9, 11), all six occupied' },
  { id: 'samudra', name: 'Samudra', houses: [[2, 4, 6, 8, 10, 12]], rule: 'The seven planets in the six alternate houses from the 2nd (2, 4, 6, 8, 10, 12), all six occupied' },
];

const SANKHYA: { id: string; name: string; signs: number }[] = [
  { id: 'gola', name: 'Gola', signs: 1 },
  { id: 'yuga', name: 'Yuga', signs: 2 },
  { id: 'shoola', name: 'Shoola', signs: 3 },
  { id: 'kedara', name: 'Kedara', signs: 4 },
  { id: 'pasha', name: 'Pasha', signs: 5 },
  { id: 'dama', name: 'Dama', signs: 6 },
  { id: 'veena', name: 'Veena (Vallaki)', signs: 7 },
];

const SIGN_KINDS: { id: string; name: string; label: string; signs: number[] }[] = [
  { id: 'rajju', name: 'Rajju', label: 'movable', signs: [1, 4, 7, 10] },
  { id: 'musala', name: 'Musala', label: 'fixed', signs: [2, 5, 8, 11] },
  { id: 'nala', name: 'Nala', label: 'dual', signs: [3, 6, 9, 12] },
];

const listOr = (items: readonly (string | number)[]) => (items.length ? items.join(', ') : 'none');

function nabhasaYogas(planets: PlanetData[], ascendantSign: number): YogaResult[] {
  const seven = SEVEN.map(name => planets.find(planet => planet.name === name));
  if (seven.some(planet => !planet)) return [];
  const grahas = seven as PlanetData[];
  const houseOf = (planet: PlanetData) => houseFrom(ascendantSign, planet.sign);
  const names = grahas.map(planet => planet.name);
  const occupied = [...new Set(grahas.map(houseOf))].sort((a, b) => a - b);
  const occupiedText = `Planets in houses ${occupied.join(', ')}`;
  const status = (planet: PlanetData) => dynamicBeneficStatus(planet.name, planets);
  const make = (seed: Omit<Seed, 'category' | 'referencePlanet'>, active: boolean, text: string, involved: string[] = names) =>
    result({ ...NABHASA, ...seed }, active, involved, text);

  // Dala: a Kendra counts for the benefics (Maala) when a benefic stands in it and no malefic, and the other way round for Sarpa;
  // three of the four are needed.
  const dala: YogaResult[] = [];
  for (const [id, name, label, wanted] of [['maala', 'Maala', 'Benefics', true], ['sarpa', 'Sarpa', 'Malefics', false]] as const) {
    const houses = KENDRAS.filter(kendra => {
      const here = grahas.filter(planet => houseOf(planet) === kendra);
      return here.some(planet => status(planet) === wanted) && !here.some(planet => status(planet) === !wanted);
    });
    dala.push(make(
      { id: `nabhasa-${id}`, name, rule: `At least three of the four Kendras hold a ${wanted ? 'benefic and no malefic' : 'malefic and no benefic'} among the seven planets` },
      houses.length >= 3,
      `${label} in kendra houses ${listOr(houses)}`,
      grahas.filter(planet => status(planet) === wanted && houses.includes(houseOf(planet))).map(planet => planet.name),
    ));
  }

  // Akriti: the houses occupied. Vajra and Yava look at the benefics and malefics in the four Kendras.
  const akriti = (yoga: typeof AKRITI[number]) => make({ id: `nabhasa-${yoga.id}`, name: yoga.name, rule: yoga.rule }, yoga.houses.some(set => sameSet(set, occupied)), occupiedText);
  const holds = (houses: number[], wanted: boolean) => houses.every(house => grahas.some(planet => houseOf(planet) === house && status(planet) === wanted));
  const beneficHouses = [...new Set(grahas.filter(planet => status(planet) === true).map(houseOf))].sort((a, b) => a - b);
  const maleficHouses = [...new Set(grahas.filter(planet => status(planet) === false).map(houseOf))].sort((a, b) => a - b);
  const VAJRA_YAVA: [string, string, number[], number[], string][] = [
    ['vajra', 'Vajra', [1, 7], [4, 10], 'Benefics in the 1st and 7th houses and malefics in the 4th and 10th, each of the four holding one'],
    ['yava', 'Yava', [4, 10], [1, 7], 'Benefics in the 4th and 10th houses and malefics in the 1st and 7th, each of the four holding one'],
  ];
  const vajraYava = VAJRA_YAVA.map(([id, name, benefic, malefic, rule]) => make(
    { id: `nabhasa-${id}`, name, rule },
    holds(benefic, true) && holds(malefic, false),
    `Benefics in houses ${listOr(beneficHouses)}; Malefics in houses ${listOr(maleficHouses)}`,
  ));
  const akritiResults = [...AKRITI.slice(0, 5).map(akriti), ...vajraYava, ...AKRITI.slice(5).map(akriti)];

  // A Dala or Akriti yoga stops the Ashraya yogas (Saravali) and the Sankhya yogas (BPHS 35.17).
  const blocked = [...dala, ...akritiResults].some(yoga => yoga.status === 'active');

  // Ashraya: all seven in signs of one kind.
  const kinds = new Set(grahas.map(planet => SIGN_KINDS.find(kind => kind.signs.includes(planet.sign))!.id));
  const ashraya = SIGN_KINDS.map(kind => {
    const holdsKind = kinds.size === 1 && kinds.has(kind.id);
    return make(
      { id: `nabhasa-${kind.id}`, name: kind.name, rule: `All seven planets in ${kind.label} signs; not counted when a Dala or Akriti yoga holds` },
      holdsKind && !blocked,
      `${kinds.size === 1 ? `Planets in ${SIGN_KINDS.find(item => kinds.has(item.id))!.label} signs` : 'Planets in mixed signs'}${holdsKind && blocked ? '; Not counted: a Dala or Akriti yoga holds' : ''}`,
    );
  });

  // Sankhya: the number of signs the seven planets stand in. BPHS: none is operable when another Nabhasa yoga is
  // derivable. The Ashraya yogas are not taken as that, for planets in one sign are always in signs of one kind, and
  // Gola (one sign) could never arise.
  const signCount = new Set(grahas.map(planet => planet.sign)).size;
  const sankhya = SANKHYA.map(yoga => make(
    { id: `nabhasa-${yoga.id}`, name: yoga.name, rule: `All seven planets in ${yoga.signs} sign${yoga.signs === 1 ? '' : 's'}; not counted when a Dala or Akriti yoga holds` },
    signCount === yoga.signs && !blocked,
    `Planets in ${signCount} sign${signCount === 1 ? '' : 's'}${signCount === yoga.signs && blocked ? '; Not counted: a Dala or Akriti yoga holds' : ''}`,
  ));

  return [...ashraya, ...dala, ...akritiResults, ...sankhya];
}

// ── Single yogas ─────────────────────────────────────────────────────────────────────────────────────────────────

const GRAHA_EXTRA_ASPECTS: Record<string, number[]> = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };

/** Whether a graha casts its aspect (Parāśara: the 7th from itself, and the special ones of Mars, Jupiter and Saturn) on a sign. */
function aspectsSign(planet: PlanetData, sign: number): boolean {
  return [7, ...(GRAHA_EXTRA_ASPECTS[planet.name] ?? [])].some(offset => signFrom(planet.sign, offset) === sign);
}

function singleYogas(planets: PlanetData[], ascendantSign: number): YogaResult[] {
  const at = (name: string) => planets.find(planet => planet.name === name);
  const houseOf = (planet: PlanetData) => houseFrom(ascendantSign, planet.sign);
  const lordOfHouse = (house: number) => signLord(signFrom(ascendantSign, house));
  const status = (planet: PlanetData) => dynamicBeneficStatus(planet.name, planets);
  const out: YogaResult[] = [];
  const lordText = (label: string, lord: string) => {
    const planet = at(lord);
    return planet ? `${label} ${lord} in ${sn(planet.sign)}, house ${houseOf(planet)}` : `${label} ${lord} not in the chart`;
  };
  const house = (n: number) => `${ordinal(n)} lord`;

  // Gajakesari (BPHS 36.3-4, as JHora has it): Jupiter in a Kendra from the Moon, joined or aspected by a benefic,
  // and not debilitated, combust or in an enemy's sign.
  {
    const seed: Seed = { id: 'gajakesari', name: 'Gajakesari', category: 'general', referencePlanet: 'Jupiter, Moon', rule: 'Jupiter in a Kendra from the Moon, joined or aspected by a benefic, and not debilitated, combust (within 11° of the Sun) or in the sign of an enemy (Mercury, Venus); BPHS 36.3-4 also admits a Kendra from the Lagna, which the mainstream reading (Raman, JHora) and this rule leave out' };
    const jupiter = at('Jupiter');
    const moon = at('Moon');
    if (jupiter && moon) {
      const position = houseFrom(moon.sign, jupiter.sign);
      const helpers = planets.filter(planet => planet.name !== 'Jupiter' && ['Moon', 'Mercury', 'Venus'].includes(planet.name) && status(planet) === true && (planet.sign === jupiter.sign || aspectsSign(planet, jupiter.sign)));
      const sun = at('Sun');
      const separation = sun ? Math.min(normalizeDegrees(jupiter.longitude - sun.longitude), 360 - normalizeDegrees(jupiter.longitude - sun.longitude)) : 180;
      const enemy = NATURAL_ENEMIES.Jupiter.includes(signLord(jupiter.sign));
      const failure = !KENDRAS.includes(position) ? ' (not a Kendra)'
        : helpers.length === 0 ? ' — no benefic joins or aspects it'
        : DEBILITATION.Jupiter === jupiter.sign ? ' — Jupiter is debilitated'
        : separation < 11 ? ` — Jupiter is combust (${separation.toFixed(1)}° from Sun)`
        : enemy ? ` — Jupiter is in an enemy sign (${sn(jupiter.sign)})`
        : '';
      const text = `Jupiter in ${ordinal(position)} from Moon${failure}`;
      out.push(result(seed, failure === '', ['Jupiter', 'Moon', ...helpers.map(planet => planet.name)],
        failure === '' ? [text, ...helpers.map(planet => planet.sign === jupiter.sign ? `${planet.name} with Jupiter` : `${planet.name} aspects Jupiter`)].join('; ') : text));
    }
  }

  // Lakshmi (BPHS 36.27-28): the 9th lord in a Kendra in its own or exaltation sign, and a strong Lagna lord (here, as in
  // JHora: in its own or exaltation sign, or in a Kendra or Trikona, the strength the chart can show without Shadbala).
  {
    const seed: Seed = { id: 'lakshmi', name: 'Lakshmi', category: 'dhana', referencePlanet: '9th and Lagna lords', rule: '9th lord in a Kendra in its own or exaltation sign, and the Lagna lord strong (counted as: in its own or exaltation sign, or in a Kendra or Trikona, as JHora does)' };
    const ninth = lordOfHouse(9);
    const lagnaLord = lordOfHouse(1);
    const ninthPlanet = at(ninth);
    const lagnaPlanet = at(lagnaLord);
    if (ninthPlanet && lagnaPlanet) {
      const dignified = (planet: PlanetData) => EXALTATION[planet.name] === planet.sign || OWN_SIGNS[planet.name]?.includes(planet.sign);
      const failures = [
        ...(KENDRAS.includes(houseOf(ninthPlanet)) ? [] : ['9th lord is not in a Kendra']),
        ...(dignified(ninthPlanet) ? [] : ['9th lord is not in its own or exaltation sign']),
        ...(dignified(lagnaPlanet) || [...KENDRAS, ...TRIKONAS].includes(houseOf(lagnaPlanet)) ? [] : ['Lagna lord is not strong (own or exaltation sign, Kendra or Trikona)']),
      ];
      out.push(result(seed, failures.length === 0, [ninth, lagnaLord], [lordText(house(9), ninth), lordText('Lagna lord', lagnaLord), ...failures].join('; ')));
    }
  }

  // Exchanges of signs between the lords of two houses.
  const exchanges: { houses: [number, number]; planets: [string, string] }[] = [];
  for (let first = 1; first <= 12; first++) {
    for (let second = first + 1; second <= 12; second++) {
      const lordA = signLord(first);
      const lordB = signLord(second);
      const a = at(lordA);
      const b = at(lordB);
      if (lordA !== lordB && a && b && a.sign === second && b.sign === first) {
        exchanges.push({ houses: [houseFrom(ascendantSign, first), houseFrom(ascendantSign, second)], planets: [lordA, lordB] });
      }
    }
  }
  const exchangeBetween = (h1: number, h2: number) => exchanges.some(({ houses }) => (houses[0] === h1 && houses[1] === h2) || (houses[0] === h2 && houses[1] === h1));

  // Maha Raja (BPHS 39.6-7): the Lagna lord and the 5th lord exchange signs.
  {
    const seed: Seed = { id: 'maha-raja', name: 'Maha Raja', category: 'raja', referencePlanet: 'Lagna and 5th lords', rule: 'The Lagna lord and the 5th lord exchange signs (the first of the two ways BPHS 39.6-7 gives; the other, by the Atma Karaka and the 5th karaka, is not checked). The exchange is read between the signs of the two houses' };
    const found = exchanges.find(({ houses }) => houses.includes(1) && houses.includes(5));
    out.push(result(seed, Boolean(found), found ? found.planets : [], [lordText('Lagna lord', lordOfHouse(1)), lordText(house(5), lordOfHouse(5)), found ? 'Exchange of signs' : 'No exchange of signs'].join('; ')));
  }

  // Dharma-Karmadhipati: the 9th and 10th lords joined, exchanging signs or aspecting each other.
  {
    const seed: Seed = { id: 'dharma-karmadhipati', name: 'Dharma-Karmadhipati', category: 'raja', referencePlanet: '9th and 10th lords', rule: 'The lords of the 9th and 10th houses conjunct, in exchange of signs, or in mutual aspect (the same planet ruling both counts)' };
    const ninth = lordOfHouse(9);
    const tenth = lordOfHouse(10);
    const a = at(ninth);
    const b = at(tenth);
    if (a && b) {
      const relation = ninth === tenth ? 'Same planet rules both'
        : a.sign === b.sign ? 'Conjunct'
        : exchangeBetween(9, 10) ? 'Exchange of signs'
        : aspectsSign(a, b.sign) && aspectsSign(b, a.sign) ? 'Mutual aspect'
        : '';
      out.push(result(seed, relation !== '', [ninth, tenth], [lordText(house(9), ninth), lordText(house(10), tenth), relation || 'No conjunction, exchange or mutual aspect'].join('; ')));
    }
  }

  // Parivartana: Dainya when a lord of a dusthana (6, 8, 12) takes part, else Khala when the 3rd lord does, else Maha.
  for (const [id, name, kind] of [['maha-parivartana', 'Maha Parivartana', 'maha'], ['khala-parivartana', 'Khala Parivartana', 'khala'], ['dainya-parivartana', 'Dainya Parivartana', 'dainya']] as const) {
    const rules = {
      maha: 'An exchange of signs between the lords of two of the houses 1, 2, 4, 5, 7, 9, 10, 11',
      khala: 'An exchange of signs in which the 3rd lord takes part and no lord of the 6th, 8th or 12th does',
      dainya: 'An exchange of signs in which the lord of the 6th, 8th or 12th takes part',
    };
    const found = exchanges.filter(({ houses }) => (houses.some(item => DUSTHANAS.includes(item)) ? 'dainya' : houses.includes(3) ? 'khala' : 'maha') === kind);
    out.push(result(
      { id, name, category: 'general', referencePlanet: 'Exchanging lords', rule: rules[kind] },
      found.length > 0,
      found.flatMap(({ planets: pair }) => pair),
      found.length > 0 ? found.map(({ planets: pair, houses }) => `${pair[0]} ⇄ ${pair[1]} (houses ${houses[0]} and ${houses[1]})`).join('; ') : 'No exchange of signs of this kind',
    ));
  }

  // Viparita Raja: the lord of the 6th, 8th or 12th house in the 6th, 8th or 12th.
  for (const [id, name, from] of [['harsha', 'Harsha', 6], ['sarala', 'Sarala', 8], ['vimala', 'Vimala', 12]] as const) {
    const lord = lordOfHouse(from);
    const planet = at(lord);
    if (!planet) continue;
    out.push(result(
      { id, name: `${name} (Viparita Raja)`, category: 'raja', referencePlanet: `${ordinal(from)} lord`, rule: `The lord of the ${ordinal(from)} house in the 6th, 8th or 12th house (its own house is JHora\'s reading, the other two dusthanas are Raman\'s; both are taken)` },
      DUSTHANAS.includes(houseOf(planet)), [lord], `${ordinal(from)} lord ${lord} in house ${houseOf(planet)}`,
    ));
  }

  // Neecha Bhanga: the cancellation of a debilitation. The conditions of JHora (without its Navamsa one) and the lord of
  // the sign of exaltation in a Kendra (B. V. Raman). A planet is never "in a Kendra from the Moon" when it is the Moon.
  {
    const seed: Seed = { id: 'neecha-bhanga', name: 'Neecha Bhanga', category: 'raja', referencePlanet: 'Debilitated planet', rule: 'A planet in its debilitation sign whose debilitation is cancelled: the sign\'s lord is exalted, in a Kendra from the Lagna or the Moon, or aspects it; or the lord of the sign where it would be exalted is in a Kendra from the Lagna or the Moon; or a planet exalted in that sign joins it or stands in a Kendra from the Lagna or the Moon (the Navamsa condition of JHora is not checked)' };
    const moon = at('Moon');
    const kendraFromLagna = (planet: PlanetData) => KENDRAS.includes(houseFrom(ascendantSign, planet.sign));
    const kendraFromMoon = (planet: PlanetData) => Boolean(moon) && planet.name !== 'Moon' && KENDRAS.includes(houseFrom(moon!.sign, planet.sign));
    const texts: string[] = [];
    const involved: string[] = [];
    let any = false;
    for (const name of SEVEN) {
      const planet = at(name);
      if (!planet || DEBILITATION[name] !== planet.sign) continue;
      const causes: string[] = [];
      const people: string[] = [];
      const lord = at(signLord(planet.sign));
      if (lord && lord.name !== name) {
        if (EXALTATION[lord.name] === lord.sign) { causes.push(`Lord ${lord.name} is exalted`); people.push(lord.name); }
        if (kendraFromLagna(lord)) { causes.push(`Lord ${lord.name} in a Kendra from the Lagna`); people.push(lord.name); }
        if (kendraFromMoon(lord)) { causes.push(`Lord ${lord.name} in a Kendra from the Moon`); people.push(lord.name); }
        if (aspectsSign(lord, planet.sign)) { causes.push(`Lord ${lord.name} aspects ${name}`); people.push(lord.name); }
      }
      const exaltationLord = at(signLord(EXALTATION[name]));
      if (exaltationLord && exaltationLord.name !== name) {
        if (kendraFromLagna(exaltationLord)) { causes.push(`Exaltation lord ${exaltationLord.name} in a Kendra from the Lagna`); people.push(exaltationLord.name); }
        if (kendraFromMoon(exaltationLord)) { causes.push(`Exaltation lord ${exaltationLord.name} in a Kendra from the Moon`); people.push(exaltationLord.name); }
      }
      for (const other of planets.filter(item => item.name !== name && (SEVEN as readonly string[]).includes(item.name) && EXALTATION[item.name] === planet.sign)) {
        if (other.sign === planet.sign) { causes.push(`${other.name} exalted in the same sign`); people.push(other.name); }
        if (kendraFromLagna(other)) { causes.push(`${other.name} (exalted here) in a Kendra from the Lagna`); people.push(other.name); }
        if (kendraFromMoon(other)) { causes.push(`${other.name} (exalted here) in a Kendra from the Moon`); people.push(other.name); }
      }
      texts.push(`${name} debilitated in ${sn(planet.sign)}`, ...(causes.length ? causes : ['No cancellation']));
      if (causes.length) { any = true; involved.push(name, ...people); }
    }
    out.push(result(seed, any, involved, texts.length ? texts.join('; ') : 'No planet is debilitated'));
  }

  // Khadga (BPHS 36.25-26): the 2nd and 9th lords exchange signs and the Lagna lord is in a Kendra or Trikona.
  {
    const seed: Seed = { id: 'khadga', name: 'Khadga', category: 'general', referencePlanet: '2nd and 9th lords', rule: 'The lords of the 2nd and 9th houses exchange signs and the Lagna lord is in a Kendra or a Trikona' };
    const lagnaLord = at(lordOfHouse(1));
    if (lagnaLord) {
      const exchange = exchangeBetween(2, 9);
      const placed = [...KENDRAS, ...TRIKONAS].includes(houseOf(lagnaLord));
      out.push(result(seed, exchange && placed, [lordOfHouse(2), lordOfHouse(9), lagnaLord.name],
        [exchange ? 'Exchange of signs' : 'No exchange of signs', lordText('Lagna lord', lagnaLord.name), ...(placed ? [] : ['Lagna lord is not in a Kendra or Trikona'])].join('; ')));
    }
  }

  // Kusuma (BPHS 36.29-30): a fixed Lagna, Venus in a Kendra, the Moon with a benefic in a Trikona and Saturn in the 10th.
  {
    const seed: Seed = { id: 'kusuma', name: 'Kusuma', category: 'general', referencePlanet: 'Venus, Moon, Saturn', rule: 'A fixed sign rising, Venus in a Kendra, the Moon in a Trikona with a benefic, and Saturn in the 10th house' };
    const venus = at('Venus');
    const moon = at('Moon');
    const saturn = at('Saturn');
    if (venus && moon && saturn) {
      const companions = planets.filter(planet => planet.name !== 'Moon' && planet.sign === moon.sign && status(planet) === true);
      const failures = [
        ...([2, 5, 8, 11].includes(ascendantSign) ? [] : ['Lagna is not a fixed sign']),
        ...(KENDRAS.includes(houseOf(venus)) ? [] : ['Venus is not in a Kendra']),
        ...(TRIKONAS.includes(houseOf(moon)) && companions.length > 0 ? [] : ['Moon is not in a Trikona with a benefic']),
        ...(houseOf(saturn) === 10 ? [] : ['Saturn is not in the 10th house']),
      ];
      out.push(result(seed, failures.length === 0, ['Venus', 'Moon', 'Saturn', ...companions.map(planet => planet.name)],
        failures.length === 0 ? 'Fixed Lagna, Venus in a Kendra, Moon with a benefic in a Trikona, Saturn in the 10th' : failures.join('; ')));
    }
  }

  // Matsya (BPHS 36.21-22): benefics in the 9th and 1st, a mixed company in the 5th, malefics in the 4th and 8th.
  {
    const seed: Seed = { id: 'matsya', name: 'Matsya', category: 'general', referencePlanet: 'Houses 1, 4, 5, 8, 9', rule: 'Benefics in the 1st and 9th houses, benefics and malefics together in the 5th, and malefics in the 4th and 8th (other planets may share these houses; JHora\'s default asks the 1st and 9th for benefics only and the 4th and 8th for malefics only)' };
    const inHouse = (n: number) => planets.filter(planet => (NINE as readonly string[]).includes(planet.name) && houseOf(planet) === n);
    const benefics = (n: number) => inHouse(n).filter(planet => status(planet) === true);
    const malefics = (n: number) => inHouse(n).filter(planet => status(planet) === false);
    const failures = [
      ...(benefics(1).length ? [] : ['No benefic in the 1st house']),
      ...(benefics(9).length ? [] : ['No benefic in the 9th house']),
      ...(benefics(5).length && malefics(5).length ? [] : ['No benefic and malefic together in the 5th house']),
      ...(malefics(4).length ? [] : ['No malefic in the 4th house']),
      ...(malefics(8).length ? [] : ['No malefic in the 8th house']),
    ];
    out.push(result(seed, failures.length === 0, [...benefics(1), ...benefics(9), ...inHouse(5), ...malefics(4), ...malefics(8)].map(planet => planet.name),
      failures.length === 0 ? 'Benefics in houses 1 and 9, benefic and malefic in the 5th, malefics in houses 4 and 8' : failures.join('; ')));
  }

  return out;
}

/** The yogas of this file for a chart, the Nabhasa yogas first. */
export function calculateClassicalYogas(planets: PlanetData[], ascendantSign: number): YogaResult[] {
  return [...nabhasaYogas(planets, ascendantSign), ...singleYogas(planets, ascendantSign)];
}
