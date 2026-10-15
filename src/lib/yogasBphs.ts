import type { PlanetData } from '@/types';
import type { YogaResult } from './yogas';
import { EXALTATION } from './dignity';
import { signLord, signName } from './signs';
import { calcD9 } from './varga/d9';
import { KENDRAS, NOT_STRONG, TRIKONAS_AND_KENDRAS, aspectsSign, dynamicBeneficStatus, houseFrom, inFriendlySign, inOwnOrExaltation, isStrongLord, ordinal, signFrom } from './yogaCommon';

// Yogas of the classical texts that the Nabhasa and single-yoga lists lack: the Lagna yogas, the three Vasumati yogas,
// and the yogas of BPHS 36 that need a lord, a count of benefics or a chain of dispositors. The rules follow the text
// of BPHS (the Santhanam translation) where it speaks; where JHora, Raman or another source reads it differently the rule
// text says so. A "strong" lord (isStrongLord) is one the chart can show to be well placed: not debilitated, and in its own,
// exaltation or friendly sign or in a Kendra or Trikona; BPHS means Shadbala, which these yogas do not compute. When one
// planet holds two of the lordships a rule compares, it counts as together with itself and in a Kendra from itself, as in JHora.

type Seed = Pick<YogaResult, 'id' | 'name' | 'category' | 'referencePlanet' | 'rule'>;

function result(seed: Seed, active: boolean, planetsInvolved: string[], resultText: string): YogaResult {
  return { ...seed, status: active ? 'active' : 'inactive', planetsInvolved: active ? [...new Set(planetsInvolved)] : [], resultText };
}

const sn = (sign: number) => signName(sign) ?? `sign ${sign}`;
const NINE = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const THREE_BENEFICS = ['Jupiter', 'Venus', 'Mercury'];
const UPACHAYAS = [3, 6, 10, 11];
const NONE_HOLDS = 'No form of the yoga holds';

export function calculateBphsYogas(planets: PlanetData[], ascendantSign: number): YogaResult[] {
  const at = (name: string) => planets.find(planet => planet.name === name);
  const houseOf = (planet: PlanetData) => houseFrom(ascendantSign, planet.sign);
  const lordOf = (house: number) => at(signLord(signFrom(ascendantSign, house)));
  const lordName = (house: number) => signLord(signFrom(ascendantSign, house));
  const status = (planet: PlanetData) => dynamicBeneficStatus(planet.name, planets);
  const nine = planets.filter(planet => NINE.includes(planet.name));
  const inHouse = (house: number) => nine.filter(planet => houseOf(planet) === house);
  const benefics = (list: PlanetData[]) => list.filter(planet => status(planet) === true);
  const malefics = (list: PlanetData[]) => list.filter(planet => status(planet) === false);
  const names = (list: PlanetData[]) => list.map(planet => planet.name);
  const label = (house: number) => (house === 1 ? 'Lagna lord' : `${ordinal(house)} lord`);
  const lordText = (house: number) => {
    const lord = lordOf(house);
    return lord ? `${label(house)} ${lord.name} in ${sn(lord.sign)}, house ${houseOf(lord)}` : `${label(house)} ${lordName(house)} not in the chart`;
  };
  const planetText = (planet: PlanetData) => `${planet.name} in ${sn(planet.sign)}, house ${houseOf(planet)}`;
  const mutualKendras = (a: PlanetData, b: PlanetData) => KENDRAS.includes(houseFrom(a.sign, b.sign));
  const out: YogaResult[] = [];
  const moon = at('Moon');

  // ── Lagna yogas (BPHS 36.1-2) ────────────────────────────────────────────────────────────────────────────────────
  // A benefic in the Lagna, or benefics in both the 12th and the 2nd house, is Subha; a malefic in the Lagna, or malefics in
  // both the 12th and the 2nd, is Asubha. Both can hold in one chart (a benefic in the Lagna and malefics on both sides of
  // it). The two-sided case is also given on its own as Subha Kartari and Papa Kartari.
  const flanks = (wanted: boolean) => {
    const pick = wanted ? benefics : malefics;
    const twelfth = pick(inHouse(12));
    const second = pick(inHouse(2));
    return { twelfth, second, held: twelfth.length > 0 && second.length > 0 };
  };
  for (const [id, name, wanted] of [['subha', 'Subha', true], ['asubha', 'Asubha', false]] as const) {
    const word = wanted ? 'benefic' : 'malefic';
    const here = (wanted ? benefics : malefics)(inHouse(1));
    const sides = flanks(wanted);
    out.push(result(
      { id, name, category: 'general', referencePlanet: 'Lagna', rule: `A ${word} in the Lagna, or ${word}s in both the 12th and the 2nd house from it (BPHS 36.1-2). Subha and Asubha can both hold in one chart` },
      here.length > 0 || sides.held, [...names(here), ...(sides.held ? [...names(sides.twelfth), ...names(sides.second)] : [])],
      [...(here.length ? [`${names(here).join(', ')} in Lagna`] : []), ...(sides.held ? [`${word}s in houses 12, 2`] : [])].join('; ') || `No ${word} in the 1st house, none in both the 12th and the 2nd`,
    ));
  }
  for (const [id, name, wanted] of [['subha-kartari', 'Subha Kartari', true], ['papa-kartari', 'Papa Kartari', false]] as const) {
    const sides = flanks(wanted);
    const missing = sides.twelfth.length === 0 ? 12 : sides.second.length === 0 ? 2 : 0;
    out.push(result(
      { id, name, category: 'general', referencePlanet: 'Lagna', rule: `${wanted ? 'Benefics' : 'Malefics'} in both the 12th and the 2nd house from the Lagna (BPHS 36.2)` },
      missing === 0, [...names(sides.twelfth), ...names(sides.second)],
      missing === 0 ? `${wanted ? 'Benefics' : 'Malefics'} in houses 12, 2` : `No ${wanted ? 'benefic' : 'malefic'} in the ${ordinal(missing)} house`,
    ));
  }

  // ── The three Vasumati yogas (BPHS 37.6) ─────────────────────────────────────────────────────────────────────────
  // Jupiter, Venus and Mercury in the Upachayas (3rd, 6th, 10th, 11th) from the Moon: all three, two or one.
  if (moon) {
    const inUpachaya = THREE_BENEFICS.map(at).filter((planet): planet is PlanetData => Boolean(planet) && UPACHAYAS.includes(houseFrom(moon.sign, planet!.sign)));
    for (const [id, name, count] of [['vasumati-all', 'Vasumati (three benefics)', 3], ['vasumati-two', 'Vasumati (two benefics)', 2], ['vasumati-one', 'Vasumati (one benefic)', 1]] as const) {
      out.push(result(
        { id, name, category: 'dhana', referencePlanet: 'Moon', rule: `Exactly ${count} of Jupiter, Venus and Mercury in the 3rd, 6th, 10th or 11th from the Moon, as BPHS 37.6 counts (Raman and JHora also count from the Lagna)` },
        inUpachaya.length === count, names(inUpachaya),
        `${inUpachaya.length} of the 3 benefics in the Upachayas from the Moon${inUpachaya.length ? ` (${names(inUpachaya).join(', ')})` : ''}`,
      ));
    }
  }

  // ── Parvata (BPHS 36.7-8, as JHora has it) ───────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'parvata', name: 'Parvata', category: 'general', referencePlanet: 'Kendras', rule: 'Only benefics in the Kendras, at least one, and the 8th house empty or with benefics only (Raman has the 6th and the 8th)' };
    const inKendras = KENDRAS.flatMap(inHouse);
    const badKendra = inKendras.filter(planet => status(planet) !== true);
    const badEighth = inHouse(8).filter(planet => status(planet) !== true);
    const text = badKendra.length ? `Not a benefic in a Kendra: ${names(badKendra).join(', ')}`
      : inKendras.length === 0 ? 'No planet in the Kendras'
      : badEighth.length ? `Not a benefic in the 8th house: ${names(badEighth).join(', ')}`
      : `Only benefics in the Kendras: ${names(inKendras).join(', ')}`;
    out.push(result(seed, badKendra.length === 0 && inKendras.length > 0 && badEighth.length === 0, names(inKendras), text));
  }

  // ── Kahala (BPHS 36.9-10) ────────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'kahala', name: 'Kahala', category: 'general', referencePlanet: '4th lord, Jupiter', rule: 'The 4th lord and Jupiter in Kendras from each other and the Lagna lord strong; or the 4th lord in its own or exaltation sign with the 10th lord (JHora\'s BVR-15 form reads the 4th and 9th lords for the first form)' };
    const fourth = lordOf(4); const tenth = lordOf(10); const lagna = lordOf(1); const jupiter = at('Jupiter');
    if (fourth && tenth && lagna && jupiter) {
      const first = mutualKendras(fourth, jupiter) && isStrongLord(lagna, ascendantSign);
      const second = inOwnOrExaltation(fourth) && fourth.sign === tenth.sign;
      const facts = [lordText(4), planetText(jupiter), lordText(1)];
      out.push(result(seed, first || second, [fourth.name, jupiter.name, lagna.name, tenth.name],
        first ? [...facts, 'Mutual Kendras'].join('; ') : second ? [lordText(4), lordText(10), 'In its own or exaltation sign, with the 10th lord'].join('; ') : [...facts, NONE_HOLDS].join('; ')));
    }
  }

  // ── Chamara (BPHS 36.11-12) ──────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'chamara', name: 'Chamara', category: 'general', referencePlanet: 'Lagna lord, Jupiter', rule: 'The Lagna lord exalted in a Kendra and aspected by Jupiter; or two benefics together in the Lagna, 7th, 9th or 10th house (JHora leaves out the Lagna)' };
    const lagna = lordOf(1); const jupiter = at('Jupiter');
    if (lagna && jupiter) {
      const first = EXALTATION[lagna.name] === lagna.sign && KENDRAS.includes(houseOf(lagna)) && aspectsSign(jupiter, lagna.sign) && lagna.name !== 'Jupiter';
      const pair = [1, 7, 9, 10].map(house => ({ house, here: benefics(inHouse(house)) })).find(item => item.here.length >= 2);
      out.push(result(seed, first || Boolean(pair), [lagna.name, 'Jupiter', ...(pair ? names(pair.here) : [])],
        first ? [lordText(1), 'Exalted in a Kendra and aspected by Jupiter'].join('; ')
          : pair ? `Two benefics in house ${pair.house}: ${names(pair.here).join(', ')}`
          : [lordText(1), NONE_HOLDS].join('; ')));
    }
  }

  // ── Shankha (BPHS 36.13-14) ──────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'shankha', name: 'Shankha', category: 'general', referencePlanet: 'Lagna, 5th, 6th lords', rule: 'The Lagna lord strong and the 5th and 6th lords in Kendras from each other; or the Lagna lord and the 10th lord together in a movable sign and the 9th lord strong' };
    const lagna = lordOf(1); const fifth = lordOf(5); const sixth = lordOf(6); const ninth = lordOf(9); const tenth = lordOf(10);
    if (lagna && fifth && sixth && ninth && tenth) {
      const first = isStrongLord(lagna, ascendantSign) && mutualKendras(fifth, sixth);
      const second = (lagna.name === tenth.name || lagna.sign === tenth.sign) && [1, 4, 7, 10].includes(lagna.sign) && isStrongLord(ninth, ascendantSign);
      out.push(result(seed, first || second, [lagna.name, fifth.name, sixth.name, ninth.name, tenth.name],
        first ? [lordText(1), lordText(5), lordText(6), 'Mutual Kendras'].join('; ')
          : second ? [lordText(1), lordText(10), lordText(9), 'Lagna lord and 10th lord together in a movable sign'].join('; ')
          : [lordText(1), lordText(5), lordText(6), NONE_HOLDS].join('; ')));
    }
  }

  // ── Bheri (BPHS 36.15-16) ────────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'bheri', name: 'Bheri', category: 'general', referencePlanet: '9th lord', rule: 'The 9th lord strong and the 12th, 1st, 2nd and 7th houses all occupied; or the 9th lord strong and Venus, Jupiter and the Lagna lord each in a Kendra' };
    const ninth = lordOf(9); const lagna = lordOf(1); const venus = at('Venus'); const jupiter = at('Jupiter');
    if (ninth && lagna && venus && jupiter) {
      const strong = isStrongLord(ninth, ascendantSign);
      const first = strong && [12, 1, 2, 7].every(house => inHouse(house).length > 0);
      const second = strong && [venus, jupiter, lagna].every(planet => KENDRAS.includes(houseOf(planet)));
      out.push(result(seed, first || second, [ninth.name, 'Venus', 'Jupiter', lagna.name],
        first ? [lordText(9), 'Houses 12, 1, 2 and 7 are occupied'].join('; ')
          : second ? [lordText(9), 'Venus, Jupiter and the Lagna lord are in Kendras'].join('; ')
          : [lordText(9), strong ? NONE_HOLDS : `9th lord is ${NOT_STRONG}`].join('; ')));
    }
  }

  // ── Srinatha (BPHS 36.18) ────────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'srinatha', name: 'Srinatha', category: 'general', referencePlanet: '7th, 9th, 10th lords', rule: 'The 7th lord in the 10th house, and the 10th lord exalted and with the 9th lord (JHora asks the 7th lord to be exalted too)' };
    const seventh = lordOf(7); const ninth = lordOf(9); const tenth = lordOf(10);
    if (seventh && ninth && tenth) {
      const seventhIn10 = houseOf(seventh) === 10;
      const tenthExalted = EXALTATION[tenth.name] === tenth.sign;
      const together = tenth.sign === ninth.sign;
      out.push(result(seed, seventhIn10 && tenthExalted && together, [seventh.name, ninth.name, tenth.name],
        [lordText(7), lordText(10), lordText(9), ...(seventhIn10 && tenthExalted && together ? ['The 7th lord is in the 10th house, the 10th lord is exalted and with the 9th lord'] : [NONE_HOLDS])].join('; ')));
    }
  }

  // ── Sharada (BPHS 36.19-20) ──────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'sharada', name: 'Sharada', category: 'general', referencePlanet: 'Sun, Mercury, 10th lord', rule: 'The 10th lord in the 5th house, Mercury in a Kendra and the Sun in Leo; or Jupiter or Mercury in a Trikona from the Moon while Mars is in the 11th house' };
    const tenth = lordOf(10); const mercury = at('Mercury'); const sun = at('Sun'); const jupiter = at('Jupiter'); const mars = at('Mars');
    if (tenth && mercury && sun && jupiter && mars && moon) {
      const first = houseOf(tenth) === 5 && KENDRAS.includes(houseOf(mercury)) && sun.sign === 5;
      const second = [jupiter, mercury].some(planet => [1, 5, 9].includes(houseFrom(moon.sign, planet.sign))) && houseOf(mars) === 11;
      out.push(result(seed, first || second, ['Mercury', 'Sun', tenth.name, 'Jupiter', 'Mars'],
        first ? [lordText(10), planetText(mercury), planetText(sun)].join('; ')
          : second ? [planetText(mars), 'Jupiter or Mercury in a Trikona from the Moon'].join('; ')
          : [lordText(10), planetText(mercury), planetText(sun), NONE_HOLDS].join('; ')));
    }
  }

  // ── Kurma (BPHS 36.23-24) ───────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'kurma', name: 'Kurma', category: 'general', referencePlanet: 'Houses 1, 3, 5, 6, 7, 11', rule: 'Benefics in the 5th, 6th and 7th houses, each in its own, exaltation or friendly sign, and malefics in the 1st, 3rd and 11th, each in its own or exaltation sign (BPHS 36.23-24). Extremely rare: it asks a dignified malefic in each of three houses that the Sun, Mars and Saturn seldom hold together; a Mercury joined to a malefic, or a waning Moon, may stand in for one' };
    const good = (house: number, wanted: boolean, friendly: boolean) => (wanted ? benefics : malefics)(inHouse(house)).filter(planet => inOwnOrExaltation(planet) || (friendly && inFriendlySign(planet)));
    const found = [5, 6, 7].map(house => good(house, true, true)).concat([1, 3, 11].map(house => good(house, false, false)));
    const missing = [5, 6, 7, 1, 3, 11].find((_, index) => found[index].length === 0);
    out.push(result(seed, missing === undefined, found.flat().map(planet => planet.name),
      missing === undefined ? 'Dignified benefics in houses 5, 6 and 7 and malefics in houses 1, 3 and 11' : `No ${[5, 6, 7].includes(missing) ? 'benefic' : 'malefic'} in the ${ordinal(missing)} house in the right sign`));
  }

  // ── Kalanidhi (BPHS 36.31-32) ────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'kalanidhi', name: 'Kalanidhi', category: 'general', referencePlanet: 'Jupiter, Mercury, Venus', rule: 'Jupiter in the 2nd or the 5th house, with Mercury and Venus each joining it or aspecting it (BPHS says aspect; JHora adds that Jupiter is in a sign of Mercury or Venus)' };
    const jupiter = at('Jupiter'); const mercury = at('Mercury'); const venus = at('Venus');
    if (jupiter && mercury && venus) {
      const placed = [2, 5].includes(houseOf(jupiter));
      const helps = [mercury, venus].filter(planet => planet.sign === jupiter.sign || aspectsSign(planet, jupiter.sign));
      out.push(result(seed, placed && helps.length === 2, ['Jupiter', 'Mercury', 'Venus'],
        [planetText(jupiter), placed ? (helps.length === 2 ? 'Mercury and Venus join or aspect Jupiter' : 'Mercury and Venus do not both join or aspect Jupiter') : 'Jupiter is not in the 2nd or 5th house'].join('; ')));
    }
  }

  // ── Kalpadruma (BPHS 36.33-34) ───────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'kalpadruma', name: 'Kalpadruma', category: 'general', referencePlanet: 'Lagna lord and its dispositors', rule: 'The Lagna lord, the lord of its sign, the lord of that planet\'s sign and the lord of that planet\'s Navamsa sign, each in a Kendra or Trikona from the Lagna or in exaltation' };
    const first = lordOf(1);
    const second = first ? at(signLord(first.sign)) : undefined;
    const third = second ? at(signLord(second.sign)) : undefined;
    const fourth = third ? at(signLord(calcD9(third.longitude) + 1)) : undefined;
    if (first && second && third && fourth) {
      const chain = [first, second, third, fourth];
      const fine = (planet: PlanetData) => TRIKONAS_AND_KENDRAS.includes(houseOf(planet)) || EXALTATION[planet.name] === planet.sign;
      const failing = chain.find(planet => !fine(planet));
      out.push(result(seed, !failing, names(chain),
        `Chain: ${names(chain).join(' → ')}; ${failing ? `${failing.name} is not in a Kendra, Trikona or exaltation` : 'all in Kendras, Trikonas or exaltation'}`));
    }
  }

  // ── Hari, Hara and Brahma (BPHS 36.35-36) ────────────────────────────────────────────────────────────────────────
  for (const [id, name, from, houses, rule] of [
    ['hari', 'Hari', 2, [2, 12, 8], 'Benefics in the 2nd, 12th and 8th houses counted from the sign of the 2nd lord'],
    ['hara', 'Hara', 7, [4, 9, 8], 'Benefics in the 4th, 9th and 8th houses counted from the sign of the 7th lord'],
    ['brahma', 'Brahma', 1, [4, 10, 11], 'Benefics in the 4th, 10th and 11th houses counted from the sign of the Lagna lord'],
  ] as [string, string, number, number[], string][]) {
    const lord = lordOf(from);
    if (!lord) continue;
    const held = houses.map(house => ({ house, here: benefics(nine.filter(planet => houseFrom(lord.sign, planet.sign) === house)) }));
    const missing = held.find(item => item.here.length === 0);
    out.push(result(
      { id, name, category: 'general', referencePlanet: `${label(from)}`, rule },
      !missing, held.flatMap(item => names(item.here)),
      [lordText(from), missing ? `No benefic in the ${ordinal(missing.house)} from the sign of the ${label(from)}` : `Benefics in houses ${houses.join(', ')} from the sign of the ${label(from)}`].join('; '),
    ));
  }

  // ── Lagnaadhi (BPHS 36.37) ───────────────────────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'lagnaadhi', name: 'Lagnaadhi', category: 'general', referencePlanet: 'Houses 7 and 8', rule: 'Benefics in the 7th and the 8th house from the Lagna, no malefic in either and none aspecting either' };
    const seventh = benefics(inHouse(7)); const eighth = benefics(inHouse(8));
    const harmed = malefics(nine).filter(planet => [7, 8].includes(houseOf(planet)) || [7, 8].some(house => aspectsSign(planet, signFrom(ascendantSign, house))));
    const text = seventh.length === 0 ? 'No benefic in the 7th house' : eighth.length === 0 ? 'No benefic in the 8th house'
      : harmed.length ? `Malefic in or aspecting the 7th or 8th house: ${names(harmed).join(', ')}` : 'Benefics in houses 7, 8 and no malefic joining or aspecting them';
    out.push(result(seed, seventh.length > 0 && eighth.length > 0 && harmed.length === 0, [...names(seventh), ...names(eighth)], text));
  }

  // ── Parijata (strict reading of the dispositor chain) ──────────────────────────────────────────────────────────────────────
  {
    const seed: Seed = { id: 'parijata', name: 'Parijata', category: 'general', referencePlanet: 'Lagna lord\'s dispositors', rule: 'The lord of the sign the Lagna lord is in, and the lord of that planet\'s sign, both in a Kendra or Trikona from the Lagna. The app\'s own strict reading: the descriptions of Parijata in Raman and JHora ask less (the second lord in a Kendra, Trikona, own or exaltation sign, or a Navamsa lord there) and hold in most charts' };
    const lagna = lordOf(1);
    const first = lagna ? at(signLord(lagna.sign)) : undefined;
    const second = first ? at(signLord(first.sign)) : undefined;
    if (lagna && first && second) {
      const fine = (planet: PlanetData) => TRIKONAS_AND_KENDRAS.includes(houseOf(planet));
      const text = `Chain: ${[lagna, first, second].map(planet => planet.name).join(' → ')}; ${fine(first) && fine(second) ? 'the two dispositors are in Kendras or Trikonas' : 'a dispositor is not in a Kendra or Trikona'}`;
      out.push(result(seed, fine(first) && fine(second), [lagna.name, first.name, second.name], text));
    }
  }

  return out;
}
