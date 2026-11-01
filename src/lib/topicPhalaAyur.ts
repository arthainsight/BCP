import { navamshaSign } from './birthConditions';
import { NATURAL_ENEMIES, NATURAL_FRIENDS } from './dignity';
import { DUSTHANA, at, hemmed, weak, yes, type Cond } from './topicChildren';
import {
  SEVEN, drekkanaSign, find, grahasInHouse, houseOf, isBenefic, isMalefic, isStrong, lordOfSign, maleficsSeeing, moonWaxing, signName, signOf, signOfHouse, seesSign,
  type RuleOutcome, type SevenGraha, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Chapter 13 of the Phaladīpikā of Mantreśvara (ariṣṭa-cintā, 25 verses): the span of life. Judged: the birth in Mūla and Āśleṣā, the yogas of quick death, the time of death by the lords (years, months, days), the long, middle and short life by the signs of the three pairs,
 * by the houses, by friendship and by strength, and the yogas that guard the life. Readings: "weak" is a Ṣaḍbala under 1; "strong" a Ṣaḍbala of 1 or more; "malefic" and "benefic" as in the other topics; the three pairs, or the three friendships, are taken together by the
 * majority (two of the three) because the verse does not say how they are combined; in 12 the last clause ("unless benefics are in a kendra or join or see it") is read as no benefic in a kendra and none seeing the lagna.
 * Not judged: 13.1-7 (the definitions and the stages of life), 13.9 (the junction of signs and the gaṇḍānta, which need the minutes), 13.10-11 (the fatal degrees of the Moon, where the two lists of the commentary differ), 13.18-20 (Saturn\'s rounds and the transits), 13.25 (the daśās).
 */
const rule = (id: string, verses: number[], name: string, effect: string, rows: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p13-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 13, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = rows(c);
    const met = list.some(([, v]) => v === false) ? false : list.some(([, v]) => v === null) ? null : true;
    return { met, lines: [list.map(([label, v]) => `${label}: ${yes(v)}`).join('; ')] };
  },
});
const L = (c: TopicContext, house: number) => lordOfSign(signOfHouse(c, house));
const lordOfMoonSign = (c: TopicContext) => { const sign = signOf(c, 'Moon'); return sign === null ? null : lordOfSign(sign); };
const KIND: Record<number, 'C' | 'S' | 'D'> = { 1: 'C', 2: 'S', 3: 'D', 4: 'C', 5: 'S', 6: 'D', 7: 'C', 8: 'S', 9: 'D', 10: 'C', 11: 'S', 12: 'D' };
type Span = 'long' | 'middle' | 'short';
const pairSpan = (a: number, b: number): Span => {
  const key = [KIND[a], KIND[b]].sort().join('');
  return ({ CC: 'long', CS: 'middle', CD: 'short', DS: 'long', SS: 'short', DD: 'middle' } as Record<string, Span>)[key];
};
const dvadashamshaSign = (longitude: number) => { const sign = Math.floor(longitude / 30) + 1; const part = Math.floor((longitude % 30) / 2.5); return ((sign - 1 + part) % 12) + 1; };
const houseKind = (house: number | null) => house === null ? null : [1, 4, 7, 10].includes(house) ? 'kendra' : [2, 5, 8, 11].includes(house) ? 'panaphara' : 'apoklima';
const ratioOf = (c: TopicContext, name: string): number | null => c.ratio[name as SevenGraha] ?? null;
const relation = (a: string, b: string): number => a === b ? 1 : (NATURAL_FRIENDS[a]?.includes(b) ? 1 : 0) + (NATURAL_FRIENDS[b]?.includes(a) ? 1 : 0) - (NATURAL_ENEMIES[a]?.includes(b) ? 1 : 0) - (NATURAL_ENEMIES[b]?.includes(a) ? 1 : 0);
const benefic = (c: TopicContext, house: number) => grahasInHouse(c, house).some(name => isBenefic(c, name));
const malefic = (c: TopicContext, house: number) => grahasInHouse(c, house).some(name => isMalefic(c, name));
const pairs = (c: TopicContext): { label: string; span: Span | null }[] => {
  const moon = find(c, 'Moon'); const l1 = find(c, L(c, 1)); const mLord = lordOfMoonSign(c); const lm = mLord ? find(c, mLord) : undefined; const l8 = find(c, L(c, 8));
  const hasLagna = c.ascendantLongitude !== undefined;
  return [
    { label: 'the decanates of the lagna and the Moon', span: hasLagna && moon ? pairSpan(drekkanaSign(c.ascendantSign, (c.ascendantLongitude ?? 0) % 30), drekkanaSign(moon.sign, moon.degree)) : null },
    { label: 'the navāṁśas of the lagna lord and the Moon-sign lord', span: l1 && lm ? pairSpan(navamshaSign(l1.longitude), navamshaSign(lm.longitude)) : null },
    { label: 'the dvādaśāṁśas of the lagna lord and the 8th lord', span: l1 && l8 ? pairSpan(dvadashamshaSign(l1.longitude), dvadashamshaSign(l8.longitude)) : null },
  ];
};
const majority = (items: { label: string; span: Span | null }[], wanted: Span): RuleOutcome => {
  const count = items.filter(item => item.span === wanted).length; const unknown = items.filter(item => item.span === null).length;
  return { met: count >= 2 ? true : count + unknown >= 2 ? null : false, lines: [items.map(item => `${item.label}: ${item.span ?? 'not known'}`).join('; ')] };
};

export const PHALA_AYUR_RULES: TopicYogaRule[] = [
  {
    id: 'p13-mula-ashlesha', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [8], name: 'Birth in Mūla or Āśleṣā with the lagna unconnected with benefics',
    effect: 'Mūla: the 1st quarter destroys the father, the 2nd the mother, the 3rd the whole family, the 4th gives wealth; Āśleṣā: the reverse (the 1st wealth, the 2nd the family, the 3rd the mother, the 4th the father).',
    evaluate: (c: TopicContext): RuleOutcome => {
      const moon = find(c, 'Moon');
      if (!moon) return { met: null, lines: ['The Moon is missing'] };
      const width = 360 / 27; const index = Math.floor(moon.longitude / width); const quarter = Math.floor((moon.longitude % width) / (width / 4)) + 1;
      const unconnected = !benefic(c, 1) && !SEVEN.some(name => isBenefic(c, name) && seesSign(c, name, c.ascendantSign));
      const result = index === 18 ? ['the father', 'the mother', 'the whole family', 'wealth and prosperity'][quarter - 1] : index === 8 ? ['wealth and prosperity', 'the family', 'the mother', 'the father'][quarter - 1] : null;
      return { met: result !== null && unconnected, lines: [`The Moon is in ${index === 18 ? 'Mūla' : index === 8 ? 'Āśleṣā' : 'another nakṣatra'}, quarter ${quarter}${result ? ` (${index === 18 ? (quarter === 4 ? 'wealth' : `destroys ${result}`) : (quarter === 1 ? 'wealth' : `destroys ${result}`)})` : ''}; no benefic joins or sees the lagna: ${yes(unconnected)}`] };
    },
  },
  {
    id: 'p13-quick-death', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [12], name: 'The yogas of quick death (seven), with no benefic in a kendra',
    effect: 'The child dies soon. (Malefics in the 8th and a kendra; in the lagna and 8th, or the lagna and 7th; the lagna or the Moon between malefics; the weak Moon in the 12th, 8th or 6th; the waning Moon with malefics in the lagna, 7th, 9th or 5th; malefics in the 8th and 7th.)',
    evaluate: (c: TopicContext): RuleOutcome => {
      const moon = find(c, 'Moon'); const moonHouse = houseOf(c, 'Moon');
      const yogas: [string, boolean][] = [
        ['malefics in the 8th and in a kendra', malefic(c, 8) && [1, 4, 7, 10].some(house => malefic(c, house))],
        ['malefics in the lagna and the 8th', malefic(c, 1) && malefic(c, 8)],
        ['malefics in the lagna and the 7th', malefic(c, 1) && malefic(c, 7)],
        ['the lagna between malefics', hemmed(c, c.ascendantSign)],
        ['the Moon between malefics', moon !== undefined && hemmed(c, moon.sign)],
        ['the weak Moon in the 12th, 8th or 6th', weak(c, 'Moon') === true && moonHouse !== null && DUSTHANA.includes(moonHouse)],
        ['the waning Moon with a malefic in the lagna, 7th, 9th or 5th', !moonWaxing(c) && moonHouse !== null && [1, 7, 9, 5].includes(moonHouse) && grahasInHouse(c, moonHouse).some(name => name !== 'Moon' && isMalefic(c, name))],
        ['malefics in the 8th and the 7th', malefic(c, 8) && malefic(c, 7)],
      ];
      const found = yogas.filter(([, ok]) => ok).map(([label]) => label);
      const saved = [1, 4, 7, 10].some(house => benefic(c, house)) || SEVEN.some(name => isBenefic(c, name) && seesSign(c, name, c.ascendantSign));
      return { met: found.length > 0 && !saved, lines: [`yogas: ${found.join('; ') || 'none'}; a benefic in a kendra or seeing the lagna: ${yes(saved)}`] };
    },
  },
  {
    id: 'p13-time-of-death', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [13], name: 'The lords of the lagna, the Moon, their decanates and navāṁśas weak and in evil houses, with malefics in the 5th and 8th',
    effect: 'The time of the death: as many years as the number of the sign of the weak lord of the lagna or the Moon sign in an evil house; as many months by the lord of the decanate; as many days by the lord of the navāṁśa.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const moon = find(c, 'Moon');
      if (!moon) return { met: null, lines: ['The Moon is missing'] };
      const signNumber = (name: string) => signOf(c, name);
      const weakBad = (name: string) => weak(c, name) === true && at(c, name, DUSTHANA);
      const lagnaDeg = c.ascendantLongitude === undefined ? null : c.ascendantLongitude % 30;
      const years = [L(c, 1), lordOfMoonSign(c) ?? ''].filter(name => name && weakBad(name)).map(name => `${name}: ${signNumber(name)} years`);
      const decan = [lagnaDeg === null ? null : lordOfSign(drekkanaSign(c.ascendantSign, lagnaDeg)), lordOfSign(drekkanaSign(moon.sign, moon.degree))].filter((name): name is SevenGraha => name !== null && weakBad(name)).map(name => `${name}: ${signNumber(name)} months`);
      const nav = [c.ascendantLongitude === undefined ? null : lordOfSign(navamshaSign(c.ascendantLongitude)), lordOfSign(navamshaSign(moon.longitude))].filter((name): name is SevenGraha => name !== null && weakBad(name)).map(name => `${name}: ${signNumber(name)} days`);
      const found = [...years, ...decan, ...nav];
      const fiveEight = malefic(c, 5) && malefic(c, 8);
      return { met: found.length > 0 && fiveEight, lines: [`${found.join('; ') || 'no weak lord in an evil house'}; malefics in the 5th and the 8th: ${yes(fiveEight)}`] };
    },
  },
  { id: 'p13-span-long', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [14], name: 'Long life by the signs of the three pairs (movable and movable, fixed and dual)', effect: 'Long life. (Two of the three pairs give it.)', evaluate: (c: TopicContext) => majority(pairs(c), 'long') },
  { id: 'p13-span-middle', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [14], name: 'Middle life by the signs of the three pairs (movable and fixed, dual and dual)', effect: 'Middle life. (Two of the three pairs give it.)', evaluate: (c: TopicContext) => majority(pairs(c), 'middle') },
  { id: 'p13-span-short', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [14], name: 'Short life by the signs of the three pairs (movable and dual, fixed and fixed)', effect: 'Short life. (Two of the three pairs give it.)', evaluate: (c: TopicContext) => majority(pairs(c), 'short') },
  {
    id: 'p13-houses-span', topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [15], name: 'The lagna lord with a benefic, or the 8th lord with a malefic, in the same kind of house',
    effect: 'The lagna lord and a benefic in kendras: long life; in the succeeding houses: middle; in the cadent houses: short. The 8th lord and a malefic give it reversed.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const l1 = L(c, 1); const l8 = L(c, 8);
      const kindOfBoth = (lord: string, test: (name: string) => boolean) => {
        const kind = houseKind(houseOf(c, lord));
        return kind !== null && c.planets.some(p => p.name !== lord && test(p.name) && houseKind(houseOf(c, p.name)) === kind) ? kind : null;
      };
      const good = kindOfBoth(l1, name => isBenefic(c, name)); const bad = kindOfBoth(l8, name => isMalefic(c, name));
      const spanGood = good === 'kendra' ? 'long' : good === 'panaphara' ? 'middle' : good === 'apoklima' ? 'short' : null;
      const spanBad = bad === 'kendra' ? 'short' : bad === 'panaphara' ? 'middle' : bad === 'apoklima' ? 'long' : null;
      return { met: spanGood !== null || spanBad !== null, lines: [`the lagna lord ${l1} with a benefic: ${good ?? 'not in the same kind of house'}${spanGood ? ` (${spanGood} life)` : ''}; the 8th lord ${l8} with a malefic: ${bad ?? 'not in the same kind of house'}${spanBad ? ` (${spanBad} life)` : ''}`] };
    },
  },
  ...(['long', 'middle', 'short'] as const).map((span): TopicYogaRule => ({
    id: `p13-friend-${span}`, topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [15], name: `${span === 'long' ? 'Friendship' : span === 'short' ? 'Enmity' : 'Neutrality'} of the three pairs of lords`,
    effect: `${span === 'long' ? 'Long' : span === 'middle' ? 'Middle' : 'Short'} life. (The Moon-sign lord and the lord of its 8th, the lagna lord and the 8th lord, the Sun and the lagna lord: friends give long life, equals middle, enemies short; two of the three. Natural friendship only.)`,
    evaluate: (c: TopicContext): RuleOutcome => {
      const moonLord = lordOfMoonSign(c); const moon = find(c, 'Moon');
      if (!moonLord || !moon) return { met: null, lines: ['The Moon is missing'] };
      const list: [string, [string, string]][] = [['the Moon-sign lord and the lord of its 8th', [moonLord, lordOfSign(((moon.sign + 6) % 12) + 1)]], ['the lagna lord and the 8th lord', [L(c, 1), L(c, 8)]], ['the Sun and the lagna lord', ['Sun', L(c, 1)]]];
      const kinds = list.map(([label, [a, b]]) => { const r = relation(a, b); return { label: `${label} (${a}, ${b})`, kind: (r > 0 ? 'long' : r < 0 ? 'short' : 'middle') as Span }; });
      return { met: kinds.filter(k => k.kind === span).length >= 2, lines: [kinds.map(k => `${k.label}: ${k.kind}`).join('; ')] };
    },
  })),
  ...(['lagna', 'moon'] as const).flatMap((which): TopicYogaRule[] => (['long', 'short'] as const).map((span): TopicYogaRule => ({
    id: `p13-strength-${which}-${span}`, topic: 'phalaHouses', text: 'phala', chapter: 13, verses: [16], name: `${which === 'lagna' ? 'The lagna lord and the lord of the lagna navāṁśa' : 'The Moon-sign lord and the lord of the Moon navāṁśa'} ${span === 'long' ? 'stronger' : 'weaker'} than the lords of their 8ths`,
    effect: `${span === 'long' ? 'Long' : 'Short'} life.`,
    evaluate: (c: TopicContext): RuleOutcome => {
      const moon = find(c, 'Moon');
      const base = which === 'lagna' ? (c.ascendantLongitude === undefined ? null : { sign: c.ascendantSign, nav: navamshaSign(c.ascendantLongitude) }) : moon ? { sign: moon.sign, nav: navamshaSign(moon.longitude) } : null;
      if (!base) return { met: null, lines: ['The longitude of the lagna is not known'] };
      const eighth = (sign: number) => lordOfSign(((sign + 6) % 12) + 1);
      const rows = [[lordOfSign(base.sign), eighth(base.sign)], [lordOfSign(base.nav), eighth(base.nav)]].map(([a, b]) => ({ a, b, ra: ratioOf(c, a), rb: ratioOf(c, b) }));
      if (rows.some(row => row.ra === null || row.rb === null)) return { met: null, lines: ['A strength is not known'] };
      const ok = rows.every(row => span === 'long' ? (row.ra ?? 0) > (row.rb ?? 0) : (row.ra ?? 0) < (row.rb ?? 0));
      return { met: ok, lines: [rows.map(row => `${row.a} ${(row.ra ?? 0).toFixed(2)} against ${row.b} ${(row.rb ?? 0).toFixed(2)}`).join('; ')] };
    },
  }))),
  rule('eighth-lord-strong', [17], 'The 8th lord stronger than the lagna lord, in a kendra, with malefics in the 8th and 12th', 'Short or middle life; the full span only through trouble and effort.', c => {
    const a = ratioOf(c, L(c, 8)); const b = ratioOf(c, L(c, 1));
    return [['the 8th lord stronger than the lagna lord', a === null || b === null ? null : a > b], ['in a kendra', at(c, L(c, 8), [1, 4, 7, 10])], ['malefics in the 8th and 12th', malefic(c, 8) && malefic(c, 12)]];
  }),
  rule('lagna-lord-guards', [21], 'The lagna lord very strong, unseen by malefics, in a kendra and seen by benefics', 'Long life with many good qualities and royal fortune.', c => {
    const l1 = L(c, 1);
    return [['the lagna lord strong', isStrong(c, l1)], ['unseen by malefics', maleficsSeeing(c, l1).length === 0], ['in a kendra', at(c, l1, [1, 4, 7, 10])], ['seen by benefics', SEVEN.some(name => name !== l1 && isBenefic(c, name) && seesSign(c, name, signOf(c, l1) ?? 0))]];
  }),
  rule('jupiter-lagna', [22], 'Jupiter very strong in the lagna', 'He quiets many evils hard to cross.', c => [['Jupiter in the lagna', at(c, 'Jupiter', [1])], ['strong', isStrong(c, 'Jupiter')]]),
  rule('moon-navamsha', [23], 'The waxing Moon in the navāṁśa of the Sun, the Moon or Jupiter, in a kendra, trine or the 11th', 'It takes away all faults.', c => {
    const moon = find(c, 'Moon');
    if (!moon) return [['the Moon is missing', null]];
    return [['the Moon waxing', moonWaxing(c)], [`in a navāṁśa of Cancer, Leo, Sagittarius or Pisces (${signName(navamshaSign(moon.longitude))})`, [4, 5, 9, 12].includes(navamshaSign(moon.longitude))], ['in a kendra, trine or the 11th', at(c, 'Moon', [1, 4, 7, 10, 5, 9, 11])]];
  }),
  rule('hundred-years', [24], 'No malefics in the kendras, trines and the 8th, the lagna lord and Jupiter in kendras', 'He enjoys many pleasures, free from disease, and lives a hundred years.', c => [
    ['no malefic in the 1st, 4th, 7th, 10th, 5th, 9th and 8th', [1, 4, 7, 10, 5, 9, 8].every(house => !malefic(c, house))], ['the lagna lord in a kendra', at(c, L(c, 1), [1, 4, 7, 10])], ['Jupiter in a kendra', at(c, 'Jupiter', [1, 4, 7, 10])],
  ]),
];
