import { combustionOf } from './combustion';
import { DEBILITATION, EXALTATION, MOOLATRIKONA, NATURAL_ENEMIES, NATURAL_FRIENDS, OWN_SIGNS } from './dignity';
import { hemmed } from './topicChildren';
import {
  SEVEN, find, grahasInHouse, houseOf, houseOfSign, isBenefic, isMalefic, isStrong, lordOfSign, ordinalEn, sees, seesSign, signOf, signOfHouse, together,
  type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Chapter 15 of the Phaladīpikā of Mantreśvara (the good and the bad of the houses, 30 verses): the rules by which any house is judged to thrive or to be lost. Each rule here goes through the twelve houses and names those that meet it.
 * Readings: "malefic" and "benefic" as in the other topics; "strong" is a Ṣaḍbala of 1 or more; "touches" is a graha in the house or a graha seeing its sign (the nodes do not aspect); the lords of good houses (śubheśa, 15.1) are the lords of the kendras and trines (1, 4, 5, 7, 9, 10);
 * the places from a house in 15.2 are its own, the 2nd, the kendras (4th, 7th, 10th) and the trines (5th, 9th) from it; the karaka of a house in 15.6 is the one of 15.17 (more than one: the first); in 15.6 the two or three agreeing are two of the four conditions.
 * Not judged: 15.7-8 and 15.12 (they rest on the daśās and the aṣṭakavarga), 15.13-14 (they need the points of the houses), 15.15-17 (the significators are only listed), 15.20-25 and 15.28 (the method of reading from a significator's sign and from the bindus), 15.30 (the five kinds of connection are defined).
 */
const rule = (id: string, verses: number[], name: string, effect: string, evaluate: (c: TopicContext) => RuleOutcome): TopicYogaRule => ({ id: `p15-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 15, verses, name, effect, evaluate });
const L = (c: TopicContext, house: number) => lordOfSign(signOfHouse(c, house));
const rel = (house: number, count: number) => ((house + count - 2) % 12) + 1;
const ALL = Array.from({ length: 12 }, (_, index) => index + 1);
const touches = (c: TopicContext, house: number, test: (name: string) => boolean, skip = ''): string[] => {
  const sign = signOfHouse(c, house);
  return [...new Set([...grahasInHouse(c, house), ...SEVEN.filter(name => seesSign(c, name, sign))])].filter(name => name !== skip && test(name));
};
const lordTouched = (c: TopicContext, name: string, test: (other: string) => boolean) => c.planets.some(p => p.name !== name && test(p.name) && (together(c, name, p.name) || (SEVEN as readonly string[]).includes(p.name) && sees(c, p.name, name)));
const combust = (c: TopicContext, name: string) => { const body = find(c, name); const sun = find(c, 'Sun'); return Boolean(body && sun && name !== 'Sun' && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null); };
const KARAKA: Record<number, string> = { 1: 'Sun', 2: 'Jupiter', 3: 'Mars', 4: 'Mercury', 5: 'Jupiter', 6: 'Mars', 7: 'Venus', 8: 'Saturn', 9: 'Sun', 10: 'Jupiter', 11: 'Jupiter', 12: 'Saturn' };
const list = (houses: string[]) => houses.length ? houses.join('; ') : 'none';
const houseLines = (houses: number[], extra: (house: number) => string = () => '') => houses.map(house => `the ${ordinalEn(house)}${extra(house)}`);
const isBad = (c: TopicContext, name: string) => { const sign = signOf(c, name); if (sign === null || name === 'Rahu' || name === 'Ketu') return false; const aided = touchesPlanet(c, name, other => isBenefic(c, other)); return combust(c, name) || ((DEBILITATION[name] === sign || NATURAL_ENEMIES[name]?.includes(lordOfSign(sign)) === true) && !aided); };
const touchesPlanet = (c: TopicContext, name: string, test: (other: string) => boolean) => c.planets.some(p => p.name !== name && test(p.name) && (together(c, name, p.name) || ((SEVEN as readonly string[]).includes(p.name) && sees(c, p.name, name))));

export const PHALA_BHAVA_RULES: TopicYogaRule[] = [
  rule('flourish', [1], 'A house with a benefic, its lord or the lords of good houses, and no other malefic', 'The house gives all its results.', c => {
    const kendraTrikona = [1, 4, 5, 7, 9, 10].map(h => L(c, h));
    const houses = ALL.filter(h => {
      const lord = L(c, h);
      const malefics = touches(c, h, name => isMalefic(c, name), lord);
      const helpers = touches(c, h, name => isBenefic(c, name) || name === lord || kendraTrikona.includes(name as (typeof kendraTrikona)[number]));
      return malefics.length === 0 && helpers.length > 0;
    });
    return { met: houses.length > 0, lines: [`houses that flourish: ${list(houseLines(houses))}`] };
  }),
  ...(['prosper', 'lost', 'mixed'] as const).map((kind): TopicYogaRule => rule(`places-${kind}`, [2], `A house whose 2nd, kendras and trines hold ${kind === 'prosper' ? 'benefics only, its lord unafflicted' : kind === 'lost' ? 'malefics, or its lord afflicted' : 'both benefics and malefics'}`,
    kind === 'prosper' ? 'The house thrives and its results grow.' : kind === 'lost' ? 'The results of the house are lost.' : 'The house gives a mixed result.', c => {
      const houses = ALL.filter(h => {
        const places = [1, 2, 4, 5, 7, 9, 10].map(k => rel(h, k));
        const ben = places.some(p => grahasInHouse(c, p).some(n => isBenefic(c, n))); const mal = places.some(p => grahasInHouse(c, p).some(n => isMalefic(c, n)));
        const lordHurt = lordTouched(c, L(c, h), n => isMalefic(c, n));
        return kind === 'prosper' ? ben && !mal && !lordHurt : kind === 'lost' ? (mal || lordHurt) && !ben : ben && (mal || lordHurt);
      });
      return { met: houses.length > 0, lines: [`${kind}: ${list(houseLines(houses))}`] };
    })),
  rule('lord-lost', [3], 'The lord of a house in the 8th, combust, or fallen or in an enemy sign without the help of benefics; and a graha so afflicted in a house', 'The house is destroyed.', c => {
    const byLord = ALL.filter(h => { const lord = L(c, h); return houseOf(c, lord) === 8 || isBad(c, lord); });
    const byOccupant = ALL.filter(h => grahasInHouse(c, h).some(n => isBad(c, n)));
    const houses = [...new Set([...byLord, ...byOccupant])].sort((a, b) => a - b);
    return { met: houses.length > 0, lines: [`by the lord: ${list(houseLines(byLord))}; by a graha standing in the house: ${list(houseLines(byOccupant))}`] };
  }),
  rule('malefics-6-8-12', [4], 'Malefics in the 6th, 8th and 12th from a house', 'The house is destroyed (benefics there do not give the full result).', c => {
    const houses = ALL.filter(h => [6, 8, 12].some(k => grahasInHouse(c, rel(h, k)).some(n => isMalefic(c, n))));
    return { met: houses.length > 0, lines: [list(houseLines(houses, h => ` (malefics in ${[6, 8, 12].filter(k => grahasInHouse(c, rel(h, k)).some(n => isMalefic(c, n))).map(k => ordinalEn(k)).join(', ')} from it)`))] };
  }),
  rule('lord-in-dusthana', [5], 'The lord of a house in the 6th, 8th or 12th, or the lord of those houses in it', 'The house is destroyed; seen by benefics it has its common result.', c => {
    const houses = ALL.filter(h => [6, 8, 12].includes(houseOf(c, L(c, h)) ?? 0) || [6, 8, 12].some(d => houseOf(c, L(c, d)) === h));
    return { met: houses.length > 0, lines: [list(houseLines(houses, h => touches(c, h, n => isBenefic(c, n)).length ? ' (seen by benefics: the common result)' : ''))] };
  }),
  rule('two-of-four', [6], 'A house where two of four conditions agree: the lord and the significator weak; between malefics; with malefics or enemies; malefics in the 4th, 8th, 12th or trines from it', 'The house is lost completely.', c => {
    const houses = ALL.filter(h => {
      const lord = L(c, h); const karaka = KARAKA[h];
      const weak = isStrong(c, lord) === false && isStrong(c, karaka) === false;
      const sign = signOf(c, lord);
      const between = hemmed(c, signOfHouse(c, h)) || (sign !== null && hemmed(c, sign));
      const withBad = c.planets.some(p => p.name !== lord && together(c, lord, p.name) && (isMalefic(c, p.name) || NATURAL_ENEMIES[lord]?.includes(p.name) === true));
      const maleficPlaces = [4, 8, 12, 5, 9].some(k => grahasInHouse(c, rel(h, k)).some(n => isMalefic(c, n)));
      return [weak, between, withBad, maleficPlaces].filter(Boolean).length >= 2;
    });
    return { met: houses.length > 0, lines: [list(houseLines(houses))] };
  }),
  rule('lagna-lord-gives', [9, 10, 27], 'The house where the lagna lord stands, and the houses whose lords are with him', 'These houses thrive (and the lagna lord, though a malefic or lord of an evil house, makes the house he stands in thrive); strong, they give happiness, weak, trouble.', c => {
    const lord1 = L(c, 1); const house = houseOf(c, lord1);
    if (house === null) return { met: null, lines: ['The lagna lord is missing'] };
    const withHim = ALL.filter(h => L(c, h) !== lord1 && together(c, lord1, L(c, h)));
    const strong = isStrong(c, lord1);
    return { met: true, lines: [`the lagna lord ${lord1} is in the ${ordinalEn(house)} (${strong === null ? 'strength not known' : strong ? 'strong' : 'weak'}); with the lords of ${list(houseLines(withHim))}`] };
  }),
  rule('two-houses', [11], 'A graha that rules two houses', 'The house of its mūlatrikoṇa sign gets the full result, the other half.', c => {
    const lines = Object.keys(OWN_SIGNS).filter(name => OWN_SIGNS[name].length === 2).map(name => {
      const houses = OWN_SIGNS[name].map(sign => houseOfSign(c, sign)); const main = houseOfSign(c, MOOLATRIKONA[name]);
      const other = houses.find(h => h !== main) ?? main;
      return `${name} rules the ${ordinalEn(houses[0])} and the ${ordinalEn(houses[1])}: the ${ordinalEn(main)} in full, the ${ordinalEn(other)} half`;
    });
    return { met: true, lines };
  }),
  rule('dignity-grows', [18], 'A graha in a house, in its exaltation, its own sign or a friend\'s sign', 'The house grows.', c => {
    const houses = ALL.filter(h => grahasInHouse(c, h).some(n => { const s = signOfHouse(c, h); return SEVEN.includes(n as (typeof SEVEN)[number]) && (EXALTATION[n] === s || OWN_SIGNS[n]?.includes(s) || NATURAL_FRIENDS[n]?.includes(lordOfSign(s))); }));
    return { met: houses.length > 0, lines: [list(houseLines(houses))] };
  }),
  rule('dignity-loses', [18], 'A graha in a house, in its fall or an enemy\'s sign', 'The house is harmed.', c => {
    const houses = ALL.filter(h => grahasInHouse(c, h).some(n => { const s = signOfHouse(c, h); return SEVEN.includes(n as (typeof SEVEN)[number]) && (DEBILITATION[n] === s || NATURAL_ENEMIES[n]?.includes(lordOfSign(s))); }));
    return { met: houses.length > 0, lines: [list(houseLines(houses))] };
  }),
  rule('benefics-malefics', [18, 19], 'Benefics and malefics in the houses (reversed in the 6th, 8th and 12th)', 'Benefics make a house grow and malefics harm it; in the 6th, 8th and 12th malefics make it thrive by removing its faults and benefics dissolve it.', c => {
    const grows: string[] = []; const harms: string[] = [];
    for (const h of ALL) {
      const ben = grahasInHouse(c, h).some(n => isBenefic(c, n)); const mal = grahasInHouse(c, h).some(n => isMalefic(c, n));
      const evil = [6, 8, 12].includes(h);
      if (evil ? mal : ben) grows.push(`the ${ordinalEn(h)}`);
      if (evil ? ben : mal) harms.push(`the ${ordinalEn(h)}`);
    }
    return { met: grows.length + harms.length > 0, lines: [`grow: ${list(grows)}; harmed: ${list(harms)}`] };
  }),
  rule('karaka-harms', [26], 'The Sun in the 9th, the Moon in the 4th, Mars in the 3rd, Jupiter in the 5th, Venus in the 7th or Saturn in the 8th', 'The house is harmed by its own significator standing in it.', c => {
    const pairs: [string, number][] = [['Sun', 9], ['Moon', 4], ['Mars', 3], ['Jupiter', 5], ['Venus', 7], ['Saturn', 8]];
    const found = pairs.filter(([name, house]) => houseOf(c, name) === house).map(([name, house]) => `${name} in the ${ordinalEn(house)}`);
    return { met: found.length > 0, lines: [list(found)] };
  }),
  rule('dusthana-lord-own', [29], 'The lord of an evil house standing in his own sign of another house', 'He gives only the result of the house he stands in, not that of the evil house.', c => {
    const found = SEVEN.filter(name => OWN_SIGNS[name].length === 2 || [6, 8, 12].some(d => L(c, d) === name)).flatMap(name => {
      const evil = [6, 8, 12].filter(d => L(c, d) === name); const sign = signOf(c, name);
      if (evil.length === 0 || sign === null || !OWN_SIGNS[name].includes(sign)) return [];
      const house = houseOfSign(c, sign);
      return evil.includes(house) ? [] : [`${name} (lord of the ${evil.map(ordinalEn).join(' and ')}) in its own sign in the ${ordinalEn(house)}`];
    });
    return { met: found.length > 0, lines: [list(found)] };
  }),
];
