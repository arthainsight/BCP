import { combustionOf } from './combustion';
import { DEBILITATION } from './dignity';
import { navamshaSign } from './birthConditions';
import {
  SEVEN, beneficsIn, cannot, debilitated, find, grahasInHouse, has, hemmedBy, houseOf, houseOfSign, inEnemySign, isBenefic, isMalefic, isStrong, lordHouse, lordOfHouse, lordOfSign,
  maleficsIn, maleficsSeeing, mixed, moonWaxing, ordinalEn, signName, signOf, signOfHouse, sees, seesSign, together, where, withMalefics, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * The house chapters of the Phaladīpikā of Mantreśvara, read as rules in the topic yogas (the verses are in `phalaVerses.ts`): chapter 10 (the 7th house) in this version. The marriage chapter of the BPHS (18) is in `topicMarriage.ts`; the two overlap and differ.
 * Readings: "malefic" and "benefic" as in the other topics; "from the Moon" counts from the Moon's sign; "strong" is a Ṣaḍbala of 1 or more; the text speaks of a man's chart and says where it is otherwise for a woman (10.7, 10.8).
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
];
