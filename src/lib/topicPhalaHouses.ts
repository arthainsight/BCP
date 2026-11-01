import { combustionOf } from './combustion';
import { DEBILITATION } from './dignity';
import { navamshaSign } from './birthConditions';
import {
  SEVEN, beneficsIn, beneficsSeeing, cannot, debilitated, find, grahasInHouse, has, hemmedBy, houseOf, houseOfSign, inEnemySign, isBenefic, isMalefic, isStrong, lordHouse, lordOfHouse, lordOfSign,
  maleficsIn, maleficsSeeing, mixed, moonWaxing, ordinalEn, signName, signOf, signOfHouse, sees, seesSign, together, where, withMalefics, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * The house chapters of the Phaladīpikā of Mantreśvara, read as rules in the topic yogas (the verses are in `phalaVerses.ts`): chapter 10 (the 7th house) in this version. The marriage chapter of the BPHS (18) is in `topicMarriage.ts`; the two overlap and differ.
 * Readings: "malefic" and "benefic" as in the other topics; "from the Moon" counts from the Moon's sign; "strong" is a Ṣaḍbala of 1 or more; the text speaks of a man's chart and says where it is otherwise for a woman (10.7, 10.8).
 * Chapter 11 is the woman's chart ("strījātaka"); its rules are read for a woman's chart, which the app does not ask for: they stand as rules for a chart read as a woman's.
 * Not judged in chapter 10: the birth sign of the wife and the times of the marriage (10.11, 10.13, 10.14), which rest on the daśā and the transits, and the grahas "in the 7th from Venus and the Moon" of 10.5 beyond the reading named in the rule.
 */
const rule = (chapter: number, id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'phalaHouses', text: 'phala', chapter, verses, name, effect, evaluate });

const lord = (context: TopicContext, house: number) => lordOfHouse(context, house);
const KENDRA = [1, 4, 7, 10]; const TRIKONA = [1, 5, 9];
const combust = (context: TopicContext, name: string) => {
  const body = find(context, name); const sun = find(context, 'Sun');
  return Boolean(body && sun && name !== 'Sun' && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null);
};
/** The house `count` from a graha's sign (1 = its own sign), as a house number from the lagna. */
const houseFrom = (context: TopicContext, name: string, count: number): number | null => { const sign = signOf(context, name); return sign === null ? null : houseOfSign(context, ((sign - 1 + count - 1) % 12) + 1); };
const nearby = (context: TopicContext, sign: number, group: (name: string) => boolean) => context.planets.filter(planet => planet.sign === sign && group(planet.name)).map(planet => planet.name);
const seenOrJoined = (context: TopicContext, house: number, kind: 'benefic' | 'malefic') => {
  const sign = signOfHouse(context, house);
  const in_ = grahasInHouse(context, house).filter(name => (kind === 'benefic' ? isBenefic(context, name) : isMalefic(context, name)));
  const seers = SEVEN.filter(name => (kind === 'benefic' ? isBenefic(context, name) : isMalefic(context, name)) && seesSign(context, name, sign));
  return [...new Set([...in_, ...seers])];
};
/** The direction of a sign: Aries, Leo, Sagittarius east; Taurus, Virgo, Capricorn south; Gemini, Libra, Aquarius west; Cancer, Scorpio, Pisces north. */
const directionOf = (sign: number) => ['east', 'south', 'west', 'north'][(sign - 1) % 4];

/** The trimshāṁśa lord of a longitude: in an odd sign Mars (5°), Saturn (5°), Jupiter (8°), Mercury (7°), Venus (5°); in an even sign the reverse, Venus (5°), Mercury (7°), Jupiter (8°), Saturn (5°), Mars (5°). */
export function trimshamshaLord(sign: number, degree: number): 'Mars' | 'Saturn' | 'Jupiter' | 'Mercury' | 'Venus' {
  const odd = ['Mars', 'Saturn', 'Jupiter', 'Mercury', 'Venus'] as const; const even = ['Venus', 'Mercury', 'Jupiter', 'Saturn', 'Mars'] as const;
  const edges = sign % 2 === 1 ? [5, 10, 18, 25, 30] : [5, 12, 20, 25, 30];
  const index = edges.findIndex(edge => degree < edge);
  return (sign % 2 === 1 ? odd : even)[index === -1 ? 4 : index];
}
type Lord5 = 'Mars' | 'Saturn' | 'Jupiter' | 'Mercury' | 'Venus';
/** 11.6-7: the woman by the sign of the Moon (and of the lagna, 11.8) and the trimshāṁśa it is in. */
export const WOMAN_BY_TRIMSHAMSHA: Record<string, Record<Lord5, string>> = {
  'Aries or Scorpio': { Mars: 'wicked', Saturn: 'a servant and unchaste', Jupiter: 'virtuous and rich', Mercury: 'crafty and faulty', Venus: 'of loose conduct' },
  'Taurus or Libra': { Mars: 'of loose conduct', Saturn: 'fond of other men', Jupiter: 'highly honoured', Mercury: 'learned', Venus: 'famous' },
  'Gemini or Virgo': { Mars: 'crafty', Saturn: 'like a eunuch', Jupiter: 'virtuous', Mercury: 'of many qualities', Venus: 'fond of pleasure' },
  'Cancer': { Mars: 'wilful', Saturn: 'a killer of her husband', Jupiter: 'of great qualities', Mercury: 'skilled in crafts', Venus: 'virtuous' },
  'Sagittarius or Pisces': { Mars: 'of good qualities', Saturn: 'cold in love', Jupiter: 'very virtuous', Mercury: 'a famous artist', Venus: 'very devout' },
  'Capricorn or Aquarius': { Mars: 'a servant', Saturn: 'fond of other men', Jupiter: 'her husband depends on her', Mercury: 'unchaste', Venus: 'childless' },
  'Leo': { Mars: 'wicked', Saturn: 'base-minded', Jupiter: 'a queen', Mercury: 'acting like a man', Venus: 'fond of other men' },
};
const trimshamshaRow = (sign: number) => (sign === 4 ? 'Cancer' : sign === 5 ? 'Leo' : [1, 8].includes(sign) ? 'Aries or Scorpio' : [2, 7].includes(sign) ? 'Taurus or Libra' : [3, 6].includes(sign) ? 'Gemini or Virgo' : [9, 12].includes(sign) ? 'Sagittarius or Pisces' : 'Capricorn or Aquarius');
/** The nakṣatra of a longitude, 1 (Aśvinī) to 27 (Revatī). */
const nakshatraOf = (longitude: number) => Math.floor(((longitude % 360) + 360) % 360 / (360 / 27)) + 1;
/** The five houses of a woman's chart (11.1) and what each shows. */
const WOMAN_HOUSES: [number, string, string][] = [[8, 'p11-8th', 'the luck of the marriage (māṅgalya)'], [9, 'p11-9th', 'children'], [1, 'p11-lagna', 'the body and its charm'], [7, 'p11-7th', 'the husband and good fortune'], [4, 'p11-4th', 'chastity']];

export const PHALA_HOUSES_RULES: TopicYogaRule[] = [
  rule(10, 'p10-5th-7th-benefic', [1], 'The 5th and the 7th joined or seen by benefics', 'Good for both houses; otherwise not. (The verse names the lords too and the same from the Moon; here by benefics, from the lagna.)', context => {
    const five = seenOrJoined(context, 5, 'benefic'); const seven = seenOrJoined(context, 7, 'benefic');
    return { met: five.length > 0 && seven.length > 0, lines: [`The 5th: ${mixed(five)}; the 7th: ${mixed(seven)}`] };
  }),
  rule(10, 'p10-venus-afflicted', [1], 'Malefics in the 12th, 4th or 8th from Venus, Venus between malefics, or Venus joined or seen by malefics', 'The death of the wife.', context => {
    const venus = find(context, 'Venus');
    if (!venus) return cannot('Venus is missing');
    const found: string[] = [];
    for (const count of [12, 4, 8]) { const near = nearby(context, ((venus.sign - 1 + count - 1) % 12) + 1, name => isMalefic(context, name)); if (near.length) found.push(`${near.join(', ')} in the ${ordinalEn(count)} from Venus`); }
    if (hemmedBy(context, venus.sign, name => isMalefic(context, name), 'Venus')) found.push('Venus between malefics');
    const with_ = [...withMalefics(context, 'Venus'), ...maleficsSeeing(context, 'Venus')];
    if (with_.length) found.push(`Venus joined or seen by ${[...new Set(with_)].join(', ')}`);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : 'Venus is not so placed'] };
  }),
  rule(10, 'p10-7lord-5th', [2], 'The 7th lord in the 5th', 'The wife is lost, and he is childless.', context => ({ met: lordHouse(context, 7) === 5, lines: [where(context, lord(context, 7))] })),
  rule(10, 'p10-5th-or-8th-lord-in-7th', [2], 'The 5th lord or the 8th lord in the 7th', 'The death of the wife.', context => {
    const found = [lord(context, 5), lord(context, 8)].filter((name, index, all) => houseOf(context, name) === 7 && all.indexOf(name) === index);
    return { met: found.length > 0, lines: [found.length ? `${found.join(', ')} in the 7th` : `${where(context, lord(context, 5))}; ${where(context, lord(context, 8))}`] };
  }),
  rule(10, 'p10-waning-moon-5th', [2], 'A waning Moon in the 5th and malefics in the 12th, 7th and lagna', 'Without wife and sons.', context => {
    const waning = !moonWaxing(context);
    const m = [12, 7, 1].map(house => maleficsIn(context, house));
    return { met: waning && houseOf(context, 'Moon') === 5 && m.every(list => list.length > 0), lines: [`The Moon is ${waning ? 'waning' : 'waxing'}, ${where(context, 'Moon')}; malefics in the 12th: ${mixed(m[0])}, 7th: ${mixed(m[1])}, lagna: ${mixed(m[2])}`] };
  }),
  rule(10, 'p10-sun-rahu-7th', [2], 'The Sun and Rāhu in the 7th', 'Loss of wealth through women.', context => ({ met: houseOf(context, 'Sun') === 7 && houseOf(context, 'Rahu') === 7, lines: [`${where(context, 'Sun')}; ${where(context, 'Rahu')}`] })),
  rule(10, 'p10-7th-sign-placements', [3], 'Venus in Scorpio, Mercury in Taurus, Jupiter in its fall, or Saturn or Mars in Pisces, in the 7th', 'The wife dies.', context => {
    const found: string[] = [];
    if (houseOf(context, 'Venus') === 7 && signOf(context, 'Venus') === 8) found.push('Venus in Scorpio');
    if (houseOf(context, 'Mercury') === 7 && signOf(context, 'Mercury') === 2) found.push('Mercury in Taurus');
    if (houseOf(context, 'Jupiter') === 7 && signOf(context, 'Jupiter') === DEBILITATION.Jupiter) found.push('Jupiter in Capricorn');
    for (const name of ['Saturn', 'Mars']) if (houseOf(context, name) === 7 && signOf(context, name) === 12) found.push(`${name} in Pisces`);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : 'None of these in the 7th'] };
  }),
  rule(10, 'p10-mars-saturn-cancer', [3], 'Mars and Saturn together in Cancer in the 7th', 'The wife is virtuous and fair.', context => ({
    met: houseOf(context, 'Mars') === 7 && houseOf(context, 'Saturn') === 7 && signOf(context, 'Mars') === 4, lines: [`${where(context, 'Mars')}; ${where(context, 'Saturn')}`],
  })),
  rule(10, 'p10-7th-afflicted', [4, 15], 'The 7th or its lord joined or seen by malefics, between malefics, in its fall or an enemy sign, or combust', 'Loss of the wife.', context => {
    const l7 = lord(context, 7); const sign = signOf(context, l7);
    if (sign === null) return cannot('The 7th lord is missing');
    const found: string[] = [];
    const house7 = seenOrJoined(context, 7, 'malefic'); if (house7.length) found.push(`the 7th joined or seen by ${house7.join(', ')}`);
    const lordMal = [...withMalefics(context, l7), ...maleficsSeeing(context, l7)]; if (lordMal.length) found.push(`the 7th lord ${l7} joined or seen by ${[...new Set(lordMal)].join(', ')}`);
    if (hemmedBy(context, sign, name => isMalefic(context, name), l7)) found.push('the 7th lord between malefics');
    if (debilitated(l7, sign) || inEnemySign(l7, sign)) found.push('the 7th lord in its fall or an enemy sign');
    if (combust(context, l7)) found.push('the 7th lord combust');
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : `The 7th lord ${l7} and the 7th are not so placed`] };
  }),
  rule(10, 'p10-venus-with-malefics', [4], 'Venus with malefics in the 7th, 5th or 9th', 'A sickly wife.', context => {
    const with_ = withMalefics(context, 'Venus');
    return { met: has(houseOf(context, 'Venus'), [7, 5, 9]) && with_.length > 0, lines: [`${where(context, 'Venus')}; with ${mixed(with_)}`] };
  }),
  rule(10, 'p10-venus-varga', [4], 'Venus in a sign of Mars or Saturn and seen by them', 'Fond of other men\'s wives.', context => {
    const sign = signOf(context, 'Venus');
    if (sign === null) return cannot('Venus is missing');
    const seers = ['Mars', 'Saturn'].filter(name => sees(context, name, 'Venus'));
    return { met: ['Mars', 'Saturn'].includes(lordOfSign(sign)) && seers.length > 0, lines: [`Venus in ${signName(sign)}, a sign of ${lordOfSign(sign)}; seen by ${mixed(seers)}`] };
  }),
  rule(10, 'p10-mars-saturn-7th-from', [5], 'Mars and Saturn in the 7th from Venus, or from the Moon', 'Without a wife or sons. (Read: both in the 7th from Venus, or both in the 7th from the Moon.)', context => {
    const v = houseFrom(context, 'Venus', 7); const m = houseFrom(context, 'Moon', 7);
    const both = (house: number | null) => house !== null && houseOf(context, 'Mars') === house && houseOf(context, 'Saturn') === house;
    return { met: both(v) || both(m), lines: [`${where(context, 'Mars')}; ${where(context, 'Saturn')}; the 7th from Venus is the ${v === null ? '?' : ordinalEn(v)}, from the Moon the ${m === null ? '?' : ordinalEn(m)}`] };
  }),
  rule(10, 'p10-two-wives', [5], 'A neuter graha in the 7th and two grahas in the 11th, or the 7th lord with Venus in a dual sign or its navāṁśa', 'Two wives; as many wives as the grahas joined to the 7th lord or Venus.', context => {
    const neuter = ['Mercury', 'Saturn'].filter(name => houseOf(context, name) === 7);
    const eleven = grahasInHouse(context, 11).filter(name => (SEVEN as readonly string[]).includes(name));
    const l7 = lord(context, 7); const body = find(context, l7);
    const dual = (sign: number) => [3, 6, 9, 12].includes(sign);
    const second = l7 !== 'Venus' && body !== undefined && together(context, l7, 'Venus') && (dual(body.sign) || dual(navamshaSign(body.longitude)));
    return { met: (neuter.length > 0 && eleven.length >= 2) || second, lines: [`Neuter grahas in the 7th: ${mixed(neuter)}; grahas in the 11th: ${mixed(eleven)}; the 7th lord with Venus in a dual sign or navāṁśa: ${second ? 'yes' : 'no'}`] };
  }),
  rule(10, 'p10-7lord-strong-benefic', [6], 'The 7th lord a strong benefic', 'A virtuous wife with good sons.', context => {
    const l7 = lord(context, 7); const strong = isStrong(context, l7);
    if (strong === null) return cannot(`The strength of the 7th lord ${l7} is not known`);
    return { met: isBenefic(context, l7) && strong, lines: [`The 7th lord ${l7}: ${isBenefic(context, l7) ? 'benefic' : 'malefic'}, ${strong ? 'strong' : 'not strong'}`] };
  }),
  rule(10, 'p10-malefic-7lord-own-7th', [6], 'A malefic 7th lord in its own sign in the 7th', 'The wife is virtuous.', context => {
    const l7 = lord(context, 7); const sign = signOf(context, l7);
    return { met: isMalefic(context, l7) && houseOf(context, l7) === 7 && sign !== null && lordOfSign(sign) === l7, lines: [where(context, l7)] };
  }),
  rule(10, 'p10-benefics-in-7th', [6], 'Benefics in the 7th that are not lords of the 6th, 8th or 12th', 'They give happiness.', context => {
    const trikaLords = new Set([6, 8, 12].map(house => lord(context, house)));
    const found = beneficsIn(context, 7).filter(name => !trikaLords.has(name as never));
    return { met: found.length > 0, lines: [`Benefics in the 7th: ${mixed(found)}`] };
  }),
  rule(10, 'p10-2-7-malefics', [7], 'The 2nd and the 7th joined or seen by malefics', 'The death of the wife (of the husband, for the 7th and 8th in a woman\'s chart).', context => {
    const two = seenOrJoined(context, 2, 'malefic'); const seven = seenOrJoined(context, 7, 'malefic'); const eight = seenOrJoined(context, 8, 'malefic');
    return { met: (two.length > 0 && seven.length > 0), lines: [`The 2nd: ${mixed(two)}; the 7th: ${mixed(seven)}; the 8th (for a woman\'s chart): ${mixed(eight)}`] };
  }),
  rule(10, 'p10-moon-saturn-7th', [8], 'The Moon with Saturn in the 7th', 'A woman marries again; a man is without wife and sons.', context => ({ met: houseOf(context, 'Moon') === 7 && houseOf(context, 'Saturn') === 7, lines: [`${where(context, 'Moon')}; ${where(context, 'Saturn')}`] })),
  rule(10, 'p10-weak-malefics-2-7-8', [8], 'Malefics in the 7th, 8th or 2nd in their fall or an enemy sign', 'The death of the wife (of the husband, in a woman\'s chart).', context => {
    const found = context.planets.filter(planet => isMalefic(context, planet.name) && has(houseOfSign(context, planet.sign), [7, 8, 2]) && (debilitated(planet.name, planet.sign) || inEnemySign(planet.name, planet.sign))).map(planet => where(context, planet.name));
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : 'No such malefic'] };
  }),
  rule(10, 'p10-even-signs', [9], 'The 7th an even sign, the 7th lord and Venus in even signs, the 5th and 7th lords strong and not combust', 'A good wife and sons.', context => {
    const l5 = lord(context, 5); const l7 = lord(context, 7);
    const s5 = isStrong(context, l5); const s7 = isStrong(context, l7);
    if (s5 === null || s7 === null) return cannot('A strength is not known');
    const even = (sign: number | null) => sign !== null && sign % 2 === 0;
    return { met: even(signOfHouse(context, 7)) && even(signOf(context, l7)) && even(signOf(context, 'Venus')) && s5 && s7 && !combust(context, l5) && !combust(context, l7), lines: [`The 7th is ${signName(signOfHouse(context, 7))}; the 7th lord ${l7} in ${signName(signOf(context, l7) ?? 1)}; Venus in ${signName(signOf(context, 'Venus') ?? 1)}; the 5th lord ${l5} ${s5 ? 'strong' : 'not strong'}, the 7th lord ${s7 ? 'strong' : 'not strong'}`] };
  }),
  rule(10, 'p10-lords-2-7-12-jupiter', [10], 'The lords of the 2nd, 7th and 12th in a kendra or trikoṇa and seen by Jupiter', 'A happy wife with sons.', context => {
    const lords = [...new Set([2, 7, 12].map(house => lord(context, house)))];
    const placed = lords.every(name => has(houseOf(context, name), [...KENDRA, ...TRIKONA]));
    const seen = lords.every(name => name === 'Jupiter' || sees(context, 'Jupiter', name));
    return { met: placed && seen, lines: [`${lords.map(name => where(context, name)).join('; ')}; all seen by Jupiter: ${seen ? 'yes' : 'no'}`] };
  }),
  rule(10, 'p10-benefics-from-7lord', [10], 'Benefics in the 2nd, 12th and 7th from the 7th lord', 'A happy wife with sons.', context => {
    const l7 = lord(context, 7); const body = find(context, l7);
    if (!body) return cannot('The 7th lord is missing');
    const rows = [2, 12, 7].map(count => nearby(context, ((body.sign - 1 + count - 1) % 12) + 1, name => isBenefic(context, name)));
    return { met: rows.every(list => list.length > 0), lines: [`Benefics in the 2nd from the 7th lord: ${mixed(rows[0])}, 12th: ${mixed(rows[1])}, 7th: ${mixed(rows[2])}`] };
  }),
  rule(10, 'p10-direction', [12], 'The direction of the wife\'s home', 'The direction of the sign of the grahas in the 7th, the 7th lord and Venus (east: Aries, Leo, Sagittarius; south: Taurus, Virgo, Capricorn; west: Gemini, Libra, Aquarius; north: Cancer, Scorpio, Pisces).', context => {
    const signs = [...grahasInHouse(context, 7).map(name => signOf(context, name)), signOf(context, lord(context, 7)), signOf(context, 'Venus')].filter((sign): sign is number => sign !== null);
    const name = (sign: number) => `${signName(sign)} (${directionOf(sign)})`;
    return { met: true, lines: [[...new Set(signs)].map(name).join(', ')] };
  }),
  // ── chapter 11: the woman's chart ──
  ...WOMAN_HOUSES.flatMap(([house, id, matter]) => [
    rule(11, `${id}-good`, [1], `Benefics in the ${ordinalEn(house)}, and no malefic but its lord (a woman's chart)`, `Good for ${matter}.`, context => {
      const ben = beneficsIn(context, house); const lordName = lord(context, house);
      const mal = maleficsIn(context, house).filter(name => name !== lordName);
      return { met: ben.length > 0 && mal.length === 0, lines: [`The ${ordinalEn(house)}: benefics ${mixed(ben)}; malefics other than its lord ${mixed(mal)}`] };
    }),
    rule(11, `${id}-bad`, [1], `A malefic in the ${ordinalEn(house)} that is not its lord (a woman's chart)`, `Ill for ${matter}.`, context => {
      const lordName = lord(context, house); const mal = maleficsIn(context, house).filter(name => name !== lordName);
      return { met: mal.length > 0, lines: [`The ${ordinalEn(house)}: malefics other than its lord ${mixed(mal)}`] };
    }),
  ]),
  rule(11, 'p11-even-signs', [2], 'The lagna and the Moon sign both even and seen by benefics (a woman\'s chart)', 'Good sons, a fine husband, ornaments, wealth and excellent character.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const ben = [...new Set([...beneficsSeeing(context, 'Moon'), ...SEVEN.filter(name => isBenefic(context, name) && seesSign(context, name, context.ascendantSign))])];
    return { met: context.ascendantSign % 2 === 0 && moon.sign % 2 === 0 && ben.length > 0, lines: [`The lagna is ${signName(context.ascendantSign)}, the Moon sign ${signName(moon.sign)}; benefics seeing the Moon or the lagna: ${mixed(ben)}`] };
  }),
  rule(11, 'p11-odd-signs', [2], 'The lagna and the Moon sign both odd and joined or seen by malefics (a woman\'s chart)', 'Of a masculine nature, crooked, wilful, fierce to her husband, poor.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const mal = [...new Set([...maleficsSeeing(context, 'Moon'), ...withMalefics(context, 'Moon'), ...SEVEN.filter(name => isMalefic(context, name) && seesSign(context, name, context.ascendantSign)), ...maleficsIn(context, 1)])];
    return { met: context.ascendantSign % 2 === 1 && moon.sign % 2 === 1 && mal.length > 0, lines: [`The lagna is ${signName(context.ascendantSign)}, the Moon sign ${signName(moon.sign)}; malefics joining or seeing: ${mixed(mal)}`] };
  }),
  rule(11, 'p11-7th-sign-navamsha', [3], 'The 7th a benefic\'s sign and navāṁśa, or a malefic\'s (a woman\'s chart)', 'Benefic: the husband is bright, famous, learned and rich. Malefic: ugly, dull, a cheat, poor, and they part.', context => {
    const sign = signOfHouse(context, 7);
    const asc = context.ascendantLongitude;
    if (asc === undefined) return cannot('The longitude of the lagna is not known');
    // The navāṁśa of the 7th house: the sign the navāṁśa of the 7th cusp falls in (the lagna degree, 180° on).
    const nav = navamshaSign((asc + 180) % 360);
    const kind = (s: number) => (isBenefic(context, lordOfSign(s)) ? 'benefic' : isMalefic(context, lordOfSign(s)) ? 'malefic' : 'neither');
    const a = kind(sign); const b = kind(nav);
    return { met: a === 'benefic' && b === 'benefic' ? true : a === 'malefic' && b === 'malefic' ? true : false, lines: [`The 7th is ${signName(sign)} (${a}), its navāṁśa ${signName(nav)} (${b}): ${a === 'benefic' && b === 'benefic' ? 'benefic, the husband is bright' : a === 'malefic' && b === 'malefic' ? 'malefic, the husband is poor' : 'mixed'}`] };
  }),
  rule(11, 'p11-mars-7th', [3], 'Mars in the 7th (a woman\'s chart)', 'A widow.', context => ({ met: houseOf(context, 'Mars') === 7, lines: [where(context, 'Mars')] })),
  rule(11, 'p11-7th-mixed', [3], 'Benefics and malefics both in the 7th (a woman\'s chart)', 'She marries again.', context => ({ met: beneficsIn(context, 7).length > 0 && maleficsIn(context, 7).length > 0, lines: [`Benefics in the 7th: ${mixed(beneficsIn(context, 7))}; malefics: ${mixed(maleficsIn(context, 7))}`] })),
  rule(11, 'p11-8th-malefics', [3], 'Malefics in the 8th (a woman\'s chart)', 'The death of the husband.', context => ({ met: maleficsIn(context, 8).length > 0, lines: [`Malefics in the 8th: ${mixed(maleficsIn(context, 8))}`] })),
  rule(11, 'p11-2nd-benefics', [3], 'Benefics in the 2nd (a woman\'s chart)', 'Her own death comes first, before her husband\'s.', context => ({ met: beneficsIn(context, 2).length > 0, lines: [`Benefics in the 2nd: ${mixed(beneficsIn(context, 2))}`] })),
  rule(11, 'p11-moon-5th-few-children', [4], 'The Moon in the 5th in Scorpio, Virgo, Taurus or Leo (a woman\'s chart)', 'Few children.', context => {
    const sign = signOf(context, 'Moon');
    return { met: houseOf(context, 'Moon') === 5 && sign !== null && [8, 6, 2, 5].includes(sign), lines: [`${where(context, 'Moon')} in ${signName(sign ?? 1)}`] };
  }),
  rule(11, 'p11-4th-malefics', [4], 'Malefics in the 4th (a woman\'s chart)', 'Unchaste.', context => ({ met: maleficsIn(context, 4).length > 0, lines: [`Malefics in the 4th: ${mixed(maleficsIn(context, 4))}`] })),
  rule(11, 'p11-lagna-moon-venus-mars-saturn', [4], 'The lagna, the Moon and Venus in a sign of Mars or Saturn (a woman\'s chart)', 'Of loose conduct.', context => {
    const moon = signOf(context, 'Moon'); const venus = signOf(context, 'Venus');
    if (moon === null || venus === null) return cannot('The Moon or Venus is missing');
    const bad = (sign: number) => ['Mars', 'Saturn'].includes(lordOfSign(sign));
    return { met: bad(context.ascendantSign) && bad(moon) && bad(venus), lines: [`The lagna ${signName(context.ascendantSign)}, the Moon ${signName(moon)}, Venus ${signName(venus)}`] };
  }),
  rule(11, 'p11-5th-9th-benefics', [5], 'Benefics in the 5th and 9th, malefics weak (a woman\'s chart)', 'Children, happiness and virtue; weak malefics there: barren, or her children die.', context => {
    const ben = [...beneficsIn(context, 5), ...beneficsIn(context, 9)];
    return { met: beneficsIn(context, 5).length > 0 && beneficsIn(context, 9).length > 0, lines: [`Benefics in the 5th and 9th: ${mixed(ben)}`] };
  }),
  ...(['Moon', 'lagna'] as const).map(point => rule(11, `p11-trimshamsha-${point}`, [6, 7, 8], `The trimshāṁśa of the ${point === 'Moon' ? 'Moon' : 'lagna'} (a woman\'s chart)`, 'The woman by the sign and the trimshāṁśa lord: e.g. in a sign of Mars with Jupiter\'s trimshāṁśa virtuous and rich, with Saturn\'s a servant and unchaste.', context => {
    const sign = point === 'Moon' ? signOf(context, 'Moon') : context.ascendantSign;
    const degree = point === 'Moon' ? find(context, 'Moon')?.degree : context.ascendantLongitude === undefined ? undefined : context.ascendantLongitude % 30;
    if (sign === null || degree === undefined) return cannot(point === 'Moon' ? 'The Moon is missing' : 'The longitude of the lagna is not known');
    const lordName = trimshamshaLord(sign, degree);
    return { met: true, lines: [`${point === 'Moon' ? 'The Moon' : 'The lagna'} is at ${degree.toFixed(1)}° of ${signName(sign)}, in the trimshāṁśa of ${lordName}: ${WOMAN_BY_TRIMSHAMSHA[trimshamshaRow(sign)][lordName]}`] };
  })),
  rule(11, 'p11-nakshatra-kin', [9], 'Born in Jyeṣṭhā, Āśleṣā, Mūla or Viśākhā (a woman\'s chart)', 'She kills, after the marriage, the husband\'s elder brother (Jyeṣṭhā), his mother (Āśleṣā), his father (Mūla) or his younger brother (Viśākhā).', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const nak = nakshatraOf(moon.longitude); const who: Record<number, string> = { 18: 'the husband\'s elder brother (Jyeṣṭhā)', 9: 'his mother (Āśleṣā)', 19: 'his father (Mūla)', 16: 'his younger brother (Viśākhā)' };
    return { met: nak in who, lines: [`The Moon is in nakṣatra ${nak}${nak in who ? `: ${who[nak]}` : ''}`] };
  }),
  rule(11, 'p11-nakshatra-barren', [9], 'Born in Citrā, Ārdrā, Āśleṣā, Śatabhiṣā, Jyeṣṭhā, Mūla, Kṛttikā or Puṣya (a woman\'s chart)', 'Barren, a widow, her children die, abandoned, poor.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const nak = nakshatraOf(moon.longitude);
    return { met: [14, 6, 9, 24, 18, 19, 3, 8].includes(nak), lines: [`The Moon is in nakṣatra ${nak}`] };
  }),
  rule(11, 'p11-four-lords', [10], 'The lords of the Moon sign, the lagna, the 7th and the 9th joined or seen by benefics, well placed and not combust (a woman\'s chart)', 'Honoured among her kin, fair and fortunate, dear to her husband, with good sons, virtuous; her happy married life lasts as long as the 8th is rich in benefics.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const lords = [...new Set([lordOfSign(moon.sign), lord(context, 1), lord(context, 7), lord(context, 9)])];
    const rows = lords.map(name => ({ name, ben: [...beneficsIn(context, houseOf(context, name) ?? 0).filter(other => other !== name), ...beneficsSeeing(context, name)], good: !has(houseOf(context, name), [6, 8, 12]), burnt: combust(context, name) }));
    return { met: rows.every(row => row.ben.length > 0 && row.good && !row.burnt), lines: [rows.map(row => `${row.name}: ${row.ben.length ? 'with or seen by benefics' : 'no benefic'}${row.good ? '' : ', in a trika house'}${row.burnt ? ', combust' : ''}`).join('; ')] };
  }),
];
