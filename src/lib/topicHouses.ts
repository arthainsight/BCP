import { combustionOf } from './combustion';
import {
  SEVEN, beneficsIn, beneficsSeeing, beneficsSeeingSign, cannot, drekkanaSign, find, grahasInHouse, has, houseOf, isBenefic, isMalefic, isStrong, joinedOrSeen, lordHouse, lordOfHouse, lordOfSign,
  maleficsIn, maleficsSeeing, mixed, ordinalEn, ownOrExalted, debilitated, inEnemySign, signName, signOf, signOfHouse, seesSign, together, where, withMalefics, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';
import { navamshaSign } from './birthConditions';
import { EXALTATION, NATURAL_FRIENDS, OWN_SIGNS } from './dignity';

/**
 * The twelve houses, "bhāva-phala": Bṛhat Parāśara Horā Śāstra chapters 12 (the lagna), 13 (the 2nd), 14 (the 3rd), 15 (the 4th) and 16 (the 5th). The 6th, 7th and 8th are in the illness, marriage and longevity topics (17, 18, 19).
 * "Strong" is a Ṣaḍbala of 1 or more; a "kendra" is the 1st, 4th, 7th, 10th and a "trikoṇa" the 5th and 9th (the lagna counts as both); the kāraka of the siblings is Mars and of the children Jupiter.
 * Where a sentence of the text runs over to the next verse (the number of sons, 16.24–31, the vehicles, 15.10–14) it is read as one rule with the verses it uses. Readings are named in the rule.
 * Not judged: Māndi (16.9, 16.23), the Pārāvata and other divisions (13.11), the "lord of the eyes" (13.12), the twins of 12.9, 13.4 (which asks for the 11th and 2nd in kendras and trikoṇas, which they cannot be), the lists of 15.10,
 * 16.17 ("not devoid of benefics" does not say which way), and the years of life the text gives for what it does not condition.
 */
const rule = (chapter: number, id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'houses', chapter, verses, name, effect, evaluate });

const lord = (context: TopicContext, house: number) => lordOfHouse(context, house);
const KENDRA = [1, 4, 7, 10]; const KENDRA_TRIKONA = [1, 4, 7, 10, 5, 9]; const TRIKA = [6, 8, 12];
const dignified = (context: TopicContext, name: string) => { const sign = signOf(context, name); return sign !== null && ownOrExalted(name, sign); };
const exalted = (context: TopicContext, name: string) => signOf(context, name) === EXALTATION[name];
const combust = (context: TopicContext, name: string) => {
  const body = find(context, name); const sun = find(context, 'Sun');
  return Boolean(body && sun && name !== 'Sun' && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null);
};
const weakOrNot = (context: TopicContext, name: string): boolean | null => { const strong = isStrong(context, name); return strong === null ? null : !strong; };
const friendOrOwn = (context: TopicContext, name: string) => {
  const sign = signOf(context, name);
  return sign !== null && (ownOrExalted(name, sign) || (NATURAL_FRIENDS[name] ?? []).includes(lordOfSign(sign)));
};
/** The Nth sign counted from a graha's own sign, 1 being that sign. */
const signFrom = (context: TopicContext, name: string, count: number): number | null => { const sign = signOf(context, name); return sign === null ? null : ((sign - 1 + count - 1) % 12) + 1; };
const MOVABLE_SIGNS = (sign: number) => [1, 4, 7, 10].includes(sign);
const lagnaBenefics = (context: TopicContext) => beneficsSeeingSign(context, context.ascendantSign);

export const HOUSES_RULES: TopicYogaRule[] = [
  // ── chapter 12: the lagna ──
  rule(12, 'lagna-lord-trika-malefic', [1], 'The lagna lord with malefics in the 6th, 8th or 12th', 'It takes away bodily happiness.', context => {
    const l1 = lord(context, 1); const with_ = withMalefics(context, l1);
    return { met: has(houseOf(context, l1), TRIKA) && with_.length > 0, lines: [`${where(context, l1)}; with malefics: ${mixed(with_)}`] };
  }),
  rule(12, 'lagna-lord-kendra-trikona', [1], 'The lagna lord in a kendra or trikoṇa', 'It always gives bodily happiness.', context => {
    const l1 = lord(context, 1);
    return { met: has(houseOf(context, l1), KENDRA_TRIKONA), lines: [where(context, l1)] };
  }),
  rule(12, 'lagna-lord-weak', [2], 'The lagna lord combust, debilitated or in an enemy sign', 'It makes disease.', context => {
    const l1 = lord(context, 1); const sign = signOf(context, l1);
    if (sign === null) return cannot('The lagna lord is missing');
    const why = [combust(context, l1) ? 'combust' : '', debilitated(l1, sign) ? 'debilitated' : '', inEnemySign(l1, sign) ? 'in an enemy sign' : ''].filter(Boolean);
    return { met: why.length > 0, lines: [`The lagna lord ${l1} in ${signName(sign)}${why.length ? `: ${why.join(', ')}` : ''}`] };
  }),
  rule(12, 'benefics-kendra-trikona', [2], 'A benefic in a kendra or trikoṇa', 'It removes disease.', context => {
    const found = [...KENDRA_TRIKONA].flatMap(house => beneficsIn(context, house));
    return { met: found.length > 0, lines: [`Benefics in kendras and trikoṇas: ${mixed([...new Set(found)])}`] };
  }),
  rule(12, 'moon-lagna-afflicted', [3], 'The Moon in the lagna, joined or seen by malefics and not seen by benefics', 'No bodily comfort.', context => {
    const mal = [...withMalefics(context, 'Moon'), ...maleficsSeeing(context, 'Moon')]; const ben = beneficsSeeing(context, 'Moon');
    return { met: houseOf(context, 'Moon') === 1 && mal.length > 0 && ben.length === 0, lines: [`${where(context, 'Moon')}; malefics joining or aspecting: ${mixed([...new Set(mal)])}; benefics aspecting: ${mixed(ben)}`] };
  }),
  rule(12, 'benefic-in-lagna', [4], 'A benefic in the lagna', 'A handsome form.', context => ({ met: beneficsIn(context, 1).length > 0, lines: [`Benefics in the lagna: ${mixed(beneficsIn(context, 1))}`] })),
  rule(12, 'malefic-in-lagna', [4], 'A malefic in the lagna', 'Without a good form.', context => ({ met: maleficsIn(context, 1).length > 0, lines: [`Malefics in the lagna: ${mixed(maleficsIn(context, 1))}`] })),
  rule(12, 'lagna-seen-by-benefics', [4], 'The lagna joined or seen by benefics', 'Bodily comfort.', context => {
    const ben = [...beneficsIn(context, 1), ...lagnaBenefics(context)];
    return { met: ben.length > 0, lines: [`Benefics in or aspecting the lagna: ${mixed([...new Set(ben)])}`] };
  }),
  rule(12, 'lagna-lord-benefic-kendra', [5], 'The lagna lord Mercury, Jupiter or Venus in a kendra or trikoṇa', 'Long-lived, wealthy, intelligent, dear to rulers.', context => {
    const l1 = lord(context, 1);
    return { met: ['Mercury', 'Jupiter', 'Venus'].includes(l1) && has(houseOf(context, l1), KENDRA_TRIKONA), lines: [`The lagna lord is ${where(context, l1)}`] };
  }),
  rule(12, 'lagna-lord-movable', [6], 'The lagna lord in a movable sign and seen by benefics', 'Famous, prosperous, a great enjoyer, bodily comfort.', context => {
    const l1 = lord(context, 1); const sign = signOf(context, l1);
    if (sign === null) return cannot('The lagna lord is missing');
    const ben = beneficsSeeing(context, l1);
    return { met: MOVABLE_SIGNS(sign) && ben.length > 0, lines: [`The lagna lord ${l1} is in ${signName(sign)}; benefics aspecting it: ${mixed(ben)}`] };
  }),
  rule(12, 'benefic-with-moon-lagna', [7], 'Mercury, Jupiter or Venus in the lagna with the Moon, or in a kendra from the lagna', 'The marks of a king.', context => {
    const kendra = ['Mercury', 'Jupiter', 'Venus'].filter(name => has(houseOf(context, name), KENDRA));
    const withMoon = ['Mercury', 'Jupiter', 'Venus'].filter(name => houseOf(context, name) === 1 && houseOf(context, 'Moon') === 1);
    return { met: kendra.length > 0 || withMoon.length > 0, lines: [`In a kendra: ${mixed(kendra)}; in the lagna with the Moon: ${mixed(withMoon)}`] };
  }),
  rule(12, 'lagna-aries-taurus-leo', [8], 'Aries, Taurus or Leo as lagna with Saturn or Mars in it', 'The body is like the sign and its aṃśa.', context => {
    const found = ['Saturn', 'Mars'].filter(name => houseOf(context, name) === 1);
    return { met: [1, 2, 5].includes(context.ascendantSign) && found.length > 0, lines: [`The lagna is ${signName(context.ascendantSign)}; in the lagna: ${mixed(found)}`] };
  }),
  rule(12, 'sun-moon-one-amsha', [10], 'The Sun and Moon in one sign and one navāṁśa', 'Nourished by the father and the brother for three months.', context => {
    const sun = find(context, 'Sun'); const moon = find(context, 'Moon');
    if (!sun || !moon) return cannot('The Sun or the Moon is missing');
    const same = sun.sign === moon.sign && navamshaSign(sun.longitude) === navamshaSign(moon.longitude);
    return { met: same, lines: [`The Sun in ${signName(sun.sign)} (navāṁśa ${signName(navamshaSign(sun.longitude))}), the Moon in ${signName(moon.sign)} (navāṁśa ${signName(navamshaSign(moon.longitude))})`] };
  }),
  rule(12, 'drekkana-limbs', [12, 13, 14], 'The limbs of the drekkāṇa of the lagna', 'The first drekkāṇa: head, eyes, ears, nose, cheeks, jaw, mouth. The second: neck, shoulders, arms, sides, heart, chest, navel. The third (the left side): bladder, genitals, anus, testicles, thighs, knees, shanks, feet. (12.15: a malefic in a limb, a wound there.)', context => {
    if (context.ascendantLongitude === undefined) return cannot('The longitude of the lagna is not known');
    const part = Math.min(2, Math.floor((context.ascendantLongitude % 30) / 10));
    const limbs = [['head, eyes, ears, nose, cheeks, jaw, mouth'], ['neck, shoulders, arms, sides, heart, chest, navel'], ['bladder, genitals, anus, testicles, thighs, knees, shanks, feet']][part][0];
    return { met: true, lines: [`The lagna is in the ${ordinalEn(part + 1)} drekkāṇa of ${signName(context.ascendantSign)}: ${limbs}`] };
  }),
  // ── chapter 13: the 2nd house ──
  rule(13, 'second-lord-placed', [1, 2], 'The 2nd lord in the 2nd, or in a kendra or trikoṇa', 'It increases wealth.', context => {
    const house = lordHouse(context, 2);
    return { met: house === 2 || has(house, KENDRA_TRIKONA), lines: [where(context, lord(context, 2))] };
  }),
  rule(13, 'second-lord-trika', [2], 'The 2nd lord in the 6th, 8th or 12th', 'Loss of wealth. (Read: the "wealth-increasing" graha is the 2nd lord.)', context => ({ met: has(lordHouse(context, 2), TRIKA), lines: [where(context, lord(context, 2))] })),
  rule(13, 'benefic-in-2nd', [2], 'A benefic in the 2nd', 'It gives wealth.', context => ({ met: beneficsIn(context, 2).length > 0, lines: [`Benefics in the 2nd: ${mixed(beneficsIn(context, 2))}`] })),
  rule(13, 'malefic-in-2nd', [2], 'A malefic in the 2nd', 'It destroys wealth.', context => ({ met: maleficsIn(context, 2).length > 0, lines: [`Malefics in the 2nd: ${mixed(maleficsIn(context, 2))}`] })),
  rule(13, 'wealthy-2nd-jupiter-mars', [3], 'The 2nd lord in the 2nd, or Jupiter in the 2nd, or the 2nd lord with Mars', 'A wealthy man.', context => {
    const l2 = lord(context, 2);
    const found = [lordHouse(context, 2) === 2 ? 'the 2nd lord in the 2nd' : '', houseOf(context, 'Jupiter') === 2 ? 'Jupiter in the 2nd' : '', l2 !== 'Mars' && together(context, l2, 'Mars') ? 'the 2nd lord with Mars' : ''].filter(Boolean);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : `${where(context, l2)}; ${where(context, 'Jupiter')}`] };
  }),
  rule(13, 'gain-lords-jupiter-venus', [5], 'The 2nd lord in a kendra, the 11th lord in a trikoṇa, joined or seen by Jupiter and Venus', 'Gain of wealth.', context => {
    const l2 = lord(context, 2); const l11 = lord(context, 11);
    const seen = ['Jupiter', 'Venus'].filter(name => [l2, l11].some(lordName => joinedOrSeen(context, lordName, name)));
    return { met: has(lordHouse(context, 2), KENDRA) && has(lordHouse(context, 11), [5, 9]) && seen.length === 2, lines: [`${where(context, l2)}; ${where(context, l11)}; joined or seen by ${mixed(seen)}`] };
  }),
  rule(13, 'poor-2-11-in-6', [6], 'The 2nd and 11th lords in the 6th, or joined or seen by malefics', 'Poor.', context => {
    const l2 = lord(context, 2); const l11 = lord(context, 11);
    const in6 = lordHouse(context, 2) === 6 && lordHouse(context, 11) === 6;
    const bad = [l2, l11].every(name => withMalefics(context, name).length > 0 || maleficsSeeing(context, name).length > 0);
    return { met: in6 || bad, lines: [`${where(context, l2)}; ${where(context, l11)}; both with or seen by malefics: ${bad ? 'yes' : 'no'}`] };
  }),
  rule(13, 'poor-2-11-weak', [7], 'The 2nd and 11th lords debilitated or combust and with malefics', 'Poverty from birth, living on alms.', context => {
    const rows = [lord(context, 2), lord(context, 11)].map(name => { const sign = signOf(context, name); return { name, weak: sign !== null && (debilitated(name, sign) || combust(context, name)), mal: withMalefics(context, name) }; });
    return { met: rows.every(row => row.weak && row.mal.length > 0), lines: [rows.map(row => `${row.name}: ${row.weak ? 'debilitated or combust' : 'not weak'}, with ${mixed(row.mal)}`).join('; ')] };
  }),
  rule(13, 'royal-punishment', [8], 'The 2nd and 11th lords in the 6th, 8th or 12th, Mars in the 11th and Rāhu in the 2nd', 'Loss of wealth through the ruler\'s punishment.', context => ({
    met: has(lordHouse(context, 2), TRIKA) && has(lordHouse(context, 11), TRIKA) && houseOf(context, 'Mars') === 11 && houseOf(context, 'Rahu') === 2,
    lines: [`${where(context, lord(context, 2))}; ${where(context, lord(context, 11))}; ${where(context, 'Mars')}; ${where(context, 'Rahu')}`],
  })),
  rule(13, 'wealth-for-dharma', [9], 'Jupiter in the 11th, Venus in the 2nd, the 2nd and 12th lords with benefics', 'Wealth is spent on righteous works.', context => {
    const l2 = lord(context, 2); const l12 = lord(context, 12);
    const ok = (name: string) => beneficsIn(context, houseOf(context, name) ?? 0).some(other => other !== name);
    return { met: houseOf(context, 'Jupiter') === 11 && houseOf(context, 'Venus') === 2 && ok(l2) && ok(l12), lines: [`${where(context, 'Jupiter')}; ${where(context, 'Venus')}; ${where(context, l2)}; ${where(context, l12)}`] };
  }),
  rule(13, 'second-lord-dignified', [10], 'The 2nd lord in its own sign or exaltation', 'A supporter of people, helpful to others, renowned.', context => {
    const l2 = lord(context, 2);
    return { met: dignified(context, l2), lines: [`The 2nd lord ${l2} is in ${signName(signOf(context, l2) ?? 1)}`] };
  }),
  rule(13, 'second-malefics', [13], 'The 2nd lord with malefics and malefics in the 2nd', 'A slanderer, a liar, with wind disease.', context => {
    const l2 = lord(context, 2); const with_ = withMalefics(context, l2);
    return { met: with_.length > 0 && maleficsIn(context, 2).length > 0, lines: [`The 2nd lord ${l2} is with ${mixed(with_)}; malefics in the 2nd: ${mixed(maleficsIn(context, 2))}`] };
  }),
  // ── chapter 14: the 3rd house ──
  rule(14, 'third-seen-by-benefics', [1], 'The 3rd joined or seen by benefics', 'He has brothers and is valiant.', context => {
    const ben = [...beneficsIn(context, 3), ...beneficsSeeingSign(context, signOfHouse(context, 3))];
    return { met: ben.length > 0, lines: [`Benefics in or aspecting the 3rd: ${mixed([...new Set(ben)])}`] };
  }),
  rule(14, 'third-lord-mars', [2], 'The 3rd lord with Mars and aspecting the 3rd, or Mars in the 3rd', 'Brothers.', context => {
    const l3 = lord(context, 3);
    const a = l3 !== 'Mars' && together(context, l3, 'Mars') && seesSign(context, l3, signOfHouse(context, 3));
    return { met: a || houseOf(context, 'Mars') === 3, lines: [`The 3rd lord ${l3}; ${where(context, 'Mars')}; with Mars and aspecting the 3rd: ${a ? 'yes' : 'no'}`] };
  }),
  rule(14, 'siblings-destroyed', [3], 'The 3rd lord and Mars each with a malefic or in a malefic\'s sign', 'They destroy the brothers at once.', context => {
    const l3 = lord(context, 3);
    const hit = (name: string) => withMalefics(context, name).filter(other => other !== (name === 'Mars' ? l3 : 'Mars')).length > 0 || ['Sun', 'Mars', 'Saturn'].includes(lordOfSign(signOf(context, name) ?? 1)) && lordOfSign(signOf(context, name) ?? 1) !== name;
    return { met: l3 !== 'Mars' && hit(l3) && hit('Mars'), lines: [`The 3rd lord ${l3}: ${hit(l3) ? 'afflicted' : 'not afflicted'}; Mars: ${hit('Mars') ? 'afflicted' : 'not afflicted'}`] };
  }),
  rule(14, 'sister-or-brother', [4], 'A female graha as lord of the 3rd and in the 3rd; or a male sign with a male graha', 'A sister (female grahas: the Moon, Venus); a brother (male grahas: the Sun, Mars, Jupiter).', context => {
    const l3 = lord(context, 3); const female = ['Moon', 'Venus']; const male = ['Sun', 'Mars', 'Jupiter'];
    const sister = female.includes(l3) && grahasInHouse(context, 3).some(name => female.includes(name));
    const brother = signOfHouse(context, 3) % 2 === 1 && grahasInHouse(context, 3).some(name => male.includes(name));
    return { met: sister || brother, lines: [`The 3rd lord ${l3}; in the 3rd: ${mixed(grahasInHouse(context, 3))}${sister ? '; a sister' : ''}${brother ? '; a brother' : ''}`] };
  }),
  rule(14, 'siblings-happy', [6], 'Mars and the 3rd lord in kendras or trikoṇas, or in exaltation, a friend\'s sign or their own sign', 'Happiness of the siblings.', context => {
    const l3 = lord(context, 3);
    const good = (name: string) => has(houseOf(context, name), KENDRA_TRIKONA) || exalted(context, name) || friendOrOwn(context, name);
    return { met: good('Mars') && good(l3), lines: [`${where(context, 'Mars')}; ${where(context, l3)}`] };
  }),
  rule(14, 'sister-first', [7, 8], 'The 3rd with Mercury, its lord with the Moon and Mars with Saturn', 'A sister is born first, then a brother; a third sibling dies.', context => {
    const l3 = lord(context, 3);
    const a = grahasInHouse(context, 3).includes('Mercury') && l3 !== 'Moon' && together(context, l3, 'Moon') && together(context, 'Mars', 'Saturn');
    return { met: a, lines: [`In the 3rd: ${mixed(grahasInHouse(context, 3))}; the 3rd lord ${l3} with the Moon: ${together(context, l3, 'Moon') ? 'yes' : 'no'}; Mars with Saturn: ${together(context, 'Mars', 'Saturn') ? 'yes' : 'no'}`] };
  }),
  rule(14, 'three-then-none', [8, 9], 'Mars with Rāhu and the 3rd lord debilitated', 'First three siblings, then none.', context => {
    const l3 = lord(context, 3); const sign = signOf(context, l3);
    return { met: sign !== null && together(context, 'Mars', 'Rahu') && debilitated(l3, sign), lines: [`Mars with Rāhu: ${together(context, 'Mars', 'Rahu') ? 'yes' : 'no'}; the 3rd lord ${l3} in ${signName(sign ?? 1)}`] };
  }),
  rule(14, 'twelve-siblings', [9, 10, 11], 'The 3rd lord in a kendra, Mars in a trikoṇa, with Jupiter and exalted', 'Twelve siblings: the elder two and the 3rd, 7th, 9th and 12th die; six are long-lived. (Read: the 3rd lord with Jupiter and exalted.)', context => {
    const l3 = lord(context, 3);
    return { met: has(lordHouse(context, 3), KENDRA) && has(houseOf(context, 'Mars'), [5, 9]) && l3 !== 'Jupiter' && together(context, l3, 'Jupiter') && exalted(context, l3), lines: [`${where(context, l3)}, ${exalted(context, l3) ? 'exalted' : 'not exalted'}; ${where(context, 'Mars')}; with Jupiter: ${together(context, l3, 'Jupiter') ? 'yes' : 'no'}`] };
  }),
  rule(14, 'seven-siblings', [12], 'Mars with the 12th lord or with Jupiter, and the Moon in the 3rd', 'Seven siblings.', context => {
    const l12 = lord(context, 12);
    const with_ = [l12, 'Jupiter'].filter(name => name !== 'Mars' && together(context, 'Mars', name));
    return { met: with_.length > 0 && houseOf(context, 'Moon') === 3, lines: [`Mars with ${mixed(with_)}; ${where(context, 'Moon')}`] };
  }),
  rule(14, 'brothers-or-sisters', [13], 'The 3rd with the Moon: brothers if seen only by male grahas, sisters if Venus joins or sees it', 'Brothers (Sun, Mars, Jupiter) or sisters.', context => {
    if (houseOf(context, 'Moon') !== 3) return { met: false, lines: [where(context, 'Moon')] };
    const seen = SEVEN.filter(name => name !== 'Moon' && seesSign(context, name, signOfHouse(context, 3)));
    const venus = houseOf(context, 'Venus') === 3 || seen.includes('Venus');
    const onlyMale = seen.length > 0 && seen.every(name => ['Sun', 'Mars', 'Jupiter'].includes(name));
    return { met: onlyMale || venus, lines: [`The Moon in the 3rd; seen by ${mixed(seen)}${venus ? '; Venus joins or sees: sisters' : onlyMale ? '; seen only by male grahas: brothers' : ''}`] };
  }),
  rule(14, 'elder-younger', [14], 'The Sun, Saturn or Mars in the 3rd', 'The Sun afflicts the elder sibling, Saturn the younger, Mars both. (Read as grahas standing in the 3rd.)', context => {
    const found = ['Sun', 'Saturn', 'Mars'].filter(name => houseOf(context, name) === 3);
    return { met: found.length > 0, lines: [`In the 3rd: ${mixed(found)}`] };
  }),
  // ── chapter 15: the 4th house ──
  rule(15, 'fourth-home-happiness', [2], 'The 4th lord or the lagna lord in the 4th, the 4th seen by benefics', 'Full happiness of the home.', context => {
    const l4 = lord(context, 4); const l1 = lord(context, 1);
    const in4 = houseOf(context, l4) === 4 || houseOf(context, l1) === 4;
    const ben = [...beneficsIn(context, 4), ...beneficsSeeingSign(context, signOfHouse(context, 4))];
    return { met: in4 && ben.length > 0, lines: [`${where(context, l4)}; ${where(context, l1)}; benefics in or aspecting the 4th: ${mixed([...new Set(ben)])}`] };
  }),
  rule(15, 'fourth-lord-dignified', [3], 'The 4th lord in its own sign, own navāṁśa or exaltation', 'Happiness of land, conveyances, houses and music.', context => {
    const l4 = lord(context, 4); const body = find(context, l4);
    if (!body) return cannot('The 4th lord is missing');
    const ownNav = OWN_SIGNS[l4]?.includes(navamshaSign(body.longitude)) === true;
    return { met: dignified(context, l4) || ownNav, lines: [`The 4th lord ${l4} in ${signName(body.sign)}${ownNav ? ', in its own navāṁśa' : ''}`] };
  }),
  rule(15, 'fourth-with-tenth-lord', [4], 'The 4th lord with the 10th lord in a kendra or trikoṇa', 'A dwelling with fine halls and walls.', context => {
    const l4 = lord(context, 4); const l10 = lord(context, 10);
    return { met: l4 !== l10 && together(context, l4, l10) && has(houseOf(context, l4), KENDRA_TRIKONA), lines: [`${where(context, l4)}; ${where(context, l10)}`] };
  }),
  rule(15, 'relatives-respect', [5], 'The 4th lord a benefic, joined or seen by benefics, and Mercury in the lagna', 'Respected by relatives.', context => {
    const l4 = lord(context, 4);
    const ben = [...beneficsSeeing(context, l4), ...beneficsIn(context, houseOf(context, l4) ?? 0).filter(name => name !== l4)];
    return { met: isBenefic(context, l4) && ben.length > 0 && houseOf(context, 'Mercury') === 1, lines: [`The 4th lord ${l4}; benefics with or aspecting it: ${mixed([...new Set(ben)])}; ${where(context, 'Mercury')}`] };
  }),
  rule(15, 'mother-long-life', [6], 'The 4th with benefics, its lord exalted, the Moon strong', 'A long life for the mother.', context => {
    const l4 = lord(context, 4); const strong = isStrong(context, 'Moon');
    if (strong === null) return cannot('The strength of the Moon is not known');
    return { met: beneficsIn(context, 4).length > 0 && exalted(context, l4) && strong, lines: [`Benefics in the 4th: ${mixed(beneficsIn(context, 4))}; the 4th lord ${l4} ${exalted(context, l4) ? 'exalted' : 'not exalted'}; the Moon ${strong ? 'strong' : 'not strong'}`] };
  }),
  rule(15, 'mother-happiness', [7], 'The 4th lord and Venus in kendras and Mercury exalted', 'Full happiness of the mother.', context => ({
    met: has(lordHouse(context, 4), KENDRA) && has(houseOf(context, 'Venus'), KENDRA) && exalted(context, 'Mercury'),
    lines: [`${where(context, lord(context, 4))}; ${where(context, 'Venus')}; Mercury ${exalted(context, 'Mercury') ? 'exalted' : 'not exalted'}`],
  })),
  rule(15, 'cattle', [8], 'Saturn with the Sun in the 4th, the Moon in the 9th, Mars in the 11th', 'Gain of cows, buffaloes and the like.', context => ({
    met: houseOf(context, 'Saturn') === 4 && houseOf(context, 'Sun') === 4 && houseOf(context, 'Moon') === 9 && houseOf(context, 'Mars') === 11,
    lines: [`${where(context, 'Saturn')}; ${where(context, 'Sun')}; ${where(context, 'Moon')}; ${where(context, 'Mars')}`],
  })),
  rule(15, 'muteness', [9], 'The 4th a movable sign with its lord in it, and Mars in the 6th or 12th', 'Muteness.', context => {
    const l4 = lord(context, 4);
    return { met: MOVABLE_SIGNS(signOfHouse(context, 4)) && houseOf(context, l4) === 4 && has(houseOf(context, 'Mars'), [6, 12]), lines: [`The 4th is ${signName(signOfHouse(context, 4))}; ${where(context, l4)}; ${where(context, 'Mars')}`] };
  }),
  rule(15, 'vehicle-12', [13, 14], 'The 11th lord in the 4th, or the 4th lord with the 11th lord', 'A vehicle in the 12th year.', context => {
    const l4 = lord(context, 4); const l11 = lord(context, 11);
    return { met: lordHouse(context, 11) === 4 || (l4 !== l11 && together(context, l4, l11)), lines: [`${where(context, l11)}; ${where(context, l4)}`] };
  }),
  rule(15, 'vehicle-42', [12, 13], 'The 4th lord with the 10th lord in an exalted navāṁśa', 'A vehicle in the 42nd year. (Read: the navāṁśa is the exaltation sign of one of them.)', context => {
    const l4 = lord(context, 4); const l10 = lord(context, 10);
    const body = find(context, l4);
    if (!body) return cannot('The 4th lord is missing');
    const nav = navamshaSign(body.longitude);
    return { met: l4 !== l10 && together(context, l4, l10) && (nav === EXALTATION[l4] || nav === EXALTATION[l10]), lines: [`${where(context, l4)} with the 10th lord ${l10}: ${together(context, l4, l10) ? 'yes' : 'no'}; navāṁśa ${signName(nav)}`] };
  }),
  // ── chapter 16: the 5th house ──
  rule(16, 'children-happiness', [1, 2], 'The lagna lord in the 5th and the 5th lord in the 5th, or the 5th lord in a kendra or trikoṇa', 'Full happiness from children.', context => {
    const house = lordHouse(context, 5);
    const first = lordHouse(context, 1) === 5 && house === 5;
    return { met: first || has(house, KENDRA_TRIKONA), lines: [`${where(context, lord(context, 1))}; ${where(context, lord(context, 5))}`] };
  }),
  rule(16, 'childless-5th-lord-trika', [2], 'The 5th lord in the 6th, 8th or 12th', 'Childlessness.', context => ({ met: has(lordHouse(context, 5), TRIKA), lines: [where(context, lord(context, 5))] })),
  rule(16, 'no-son', [3], 'The 5th lord combust, with malefics or weak', 'No son is born, or a son born dies. (Read: any of the three; "weak" is a Ṣaḍbala under 1.)', context => {
    const l5 = lord(context, 5); const weak = weakOrNot(context, l5);
    const why = [combust(context, l5) ? 'combust' : '', withMalefics(context, l5).length ? `with ${withMalefics(context, l5).join(', ')}` : '', weak ? 'weak' : ''].filter(Boolean);
    return { met: why.length > 0, lines: [`The 5th lord ${l5}: ${why.length ? why.join(', ') : 'none of the three'}${weak === null ? ' (strength not known)' : ''}`] };
  }),
  rule(16, 'first-child-dies', [4], 'The 5th lord in the 6th and the lagna lord with Mars', 'The first child dies and the wife bears only once.', context => {
    const l1 = lord(context, 1);
    return { met: lordHouse(context, 5) === 6 && l1 !== 'Mars' && together(context, l1, 'Mars'), lines: [`${where(context, lord(context, 5))}; the lagna lord ${l1} with Mars: ${together(context, l1, 'Mars') ? 'yes' : 'no'}`] };
  }),
  rule(16, 'one-child-ketu-mercury', [5], 'The 5th lord debilitated in the 6th, 8th or 12th, with Ketu and Mercury in the 5th', 'Only one child (kākabandhyā).', context => {
    const l5 = lord(context, 5); const sign = signOf(context, l5);
    return { met: sign !== null && debilitated(l5, sign) && has(houseOf(context, l5), TRIKA) && houseOf(context, 'Ketu') === 5 && houseOf(context, 'Mercury') === 5, lines: [`${where(context, l5)}; ${where(context, 'Ketu')}; ${where(context, 'Mercury')}`] };
  }),
  rule(16, 'one-child-saturn-mercury', [6], 'The 5th lord debilitated and not aspecting the 5th, with Saturn and Mercury in the 5th', 'Only one child.', context => {
    const l5 = lord(context, 5); const sign = signOf(context, l5);
    return { met: sign !== null && debilitated(l5, sign) && !seesSign(context, l5, signOfHouse(context, 5)) && houseOf(context, 'Saturn') === 5 && houseOf(context, 'Mercury') === 5, lines: [`${where(context, l5)}; ${where(context, 'Saturn')}; ${where(context, 'Mercury')}`] };
  }),
  rule(16, 'son-with-difficulty', [7, 8], 'The 5th lord in the 6th, 8th or 12th, debilitated or in an enemy sign, with the 5th afflicted; or the 9th lord in the lagna with Ketu and Mercury in the 5th', 'A son with difficulty.', context => {
    const l5 = lord(context, 5); const sign = signOf(context, l5);
    if (sign === null) return cannot('The 5th lord is missing');
    const weak = has(houseOf(context, l5), TRIKA) || debilitated(l5, sign) || inEnemySign(l5, sign);
    const afflicted = maleficsIn(context, 5).length > 0;
    const second = lordHouse(context, 9) === 1 && debilitated(l5, sign) && houseOf(context, 'Ketu') === 5 && houseOf(context, 'Mercury') === 5;
    return { met: (weak && afflicted) || second, lines: [`${where(context, l5)}${weak ? ' (weak)' : ''}; malefics in the 5th: ${mixed(maleficsIn(context, 5))}`] };
  }),
  rule(16, 'raised-by-three-mothers', [10], 'The Sun and Moon in one sign and one navāṁśa', 'Brought up by three mothers or by two fathers.', context => {
    const sun = find(context, 'Sun'); const moon = find(context, 'Moon');
    if (!sun || !moon) return cannot('The Sun or the Moon is missing');
    return { met: sun.sign === moon.sign && navamshaSign(sun.longitude) === navamshaSign(moon.longitude), lines: [`The Sun and Moon: ${signName(sun.sign)} and ${signName(moon.sign)}`] };
  }),
  rule(16, 'adopted-son', [11], 'Six grahas in the 5th, its lord in the 12th, the lagna lord and the Moon strong', 'An adopted son.', context => {
    const six = SEVEN.filter(name => houseOf(context, name) === 5);
    const l1 = lord(context, 1); const a = isStrong(context, l1); const b = isStrong(context, 'Moon');
    if (a === null || b === null) return cannot('The strength of the lagna lord or of the Moon is not known');
    return { met: six.length >= 6 && lordHouse(context, 5) === 12 && a && b, lines: [`Grahas in the 5th: ${six.length} (${mixed(six)}); ${where(context, lord(context, 5))}; the lagna lord ${a ? 'strong' : 'not strong'}, the Moon ${b ? 'strong' : 'not strong'}`] };
  }),
  rule(16, 'many-sons', [12], 'The 5th seen by strong Mercury, Jupiter and Venus and its lord strong', 'Many sons.', context => {
    const l5 = lord(context, 5); const l5s = isStrong(context, l5);
    const three = ['Mercury', 'Jupiter', 'Venus'].map(name => ({ name, sees: seesSign(context, name, signOfHouse(context, 5)), strong: isStrong(context, name) }));
    if (l5s === null || three.some(item => item.strong === null)) return cannot('A strength is not known');
    return { met: three.every(item => item.sees && item.strong) && l5s, lines: [`${three.map(item => `${item.name} ${item.sees ? 'aspects' : 'does not aspect'} the 5th${item.strong ? ', strong' : ''}`).join('; ')}; the 5th lord ${l5} ${l5s ? 'strong' : 'not strong'}`] };
  }),
  rule(16, 'daughter', [13], 'The 5th lord with the Moon or in the Moon\'s drekkāṇa', 'A daughter is born.', context => {
    const l5 = lord(context, 5); const a = find(context, l5); const moon = find(context, 'Moon');
    if (!a || !moon) return cannot('The 5th lord or the Moon is missing');
    const with_ = l5 !== 'Moon' && a.sign === moon.sign; const drek = drekkanaSign(a.sign, a.degree) === drekkanaSign(moon.sign, moon.degree);
    return { met: l5 !== 'Moon' && (with_ || drek), lines: [`The 5th lord ${l5}: with the Moon ${with_ ? 'yes' : 'no'}; in the Moon's drekkāṇa ${drek ? 'yes' : 'no'}`] };
  }),
  rule(16, 'child-of-another-saturn', [14], 'The 5th lord in a movable sign, the Moon with Rāhu, Saturn in the 5th', 'A child of another.', context => {
    const l5 = lord(context, 5); const sign = signOf(context, l5);
    return { met: sign !== null && MOVABLE_SIGNS(sign) && together(context, 'Moon', 'Rahu') && houseOf(context, 'Saturn') === 5, lines: [`${where(context, l5)}; the Moon with Rāhu: ${together(context, 'Moon', 'Rahu') ? 'yes' : 'no'}; ${where(context, 'Saturn')}`] };
  }),
  rule(16, 'child-of-another-moon-jupiter', [15], 'The Moon in the 8th, Jupiter in the 8th from the Moon, joined or seen by malefics', 'A child of another.', context => {
    const moon = find(context, 'Moon'); const jup = find(context, 'Jupiter');
    if (!moon || !jup) return cannot('The Moon or Jupiter is missing');
    const eighth = ((jup.sign - moon.sign + 12) % 12) + 1 === 8;
    const bad = [...withMalefics(context, 'Moon'), ...maleficsSeeing(context, 'Moon'), ...withMalefics(context, 'Jupiter'), ...maleficsSeeing(context, 'Jupiter')];
    return { met: houseOf(context, 'Moon') === 8 && eighth && bad.length > 0, lines: [`${where(context, 'Moon')}; Jupiter ${eighth ? 'is' : 'is not'} in the 8th from the Moon; malefics joining or aspecting: ${mixed([...new Set(bad)])}`] };
  }),
  rule(16, 'fortune-of-children', [16], 'The 5th lord exalted or in the 2nd, 3rd, 5th or 9th, joined or seen by Jupiter', 'The fortune of children.', context => {
    const l5 = lord(context, 5);
    const place = exalted(context, l5) || has(houseOf(context, l5), [2, 3, 5, 9]);
    return { met: place && l5 !== 'Jupiter' && joinedOrSeen(context, l5, 'Jupiter'), lines: [`${where(context, l5)}${exalted(context, l5) ? ', exalted' : ''}; Jupiter joins or aspects it: ${joinedOrSeen(context, l5, 'Jupiter') ? 'yes' : 'no'}`] };
  }),
  rule(16, 'child-year-32', [18], 'Jupiter in the 5th and the 5th lord with Venus', 'A child in the 32nd or 33rd year.', context => {
    const l5 = lord(context, 5);
    return { met: houseOf(context, 'Jupiter') === 5 && l5 !== 'Venus' && together(context, l5, 'Venus'), lines: [`${where(context, 'Jupiter')}; the 5th lord ${l5} with Venus: ${together(context, l5, 'Venus') ? 'yes' : 'no'}`] };
  }),
  rule(16, 'child-year-36', [19], 'The 5th lord in a kendra with Jupiter', 'A child in the 36th or 30th year.', context => {
    const l5 = lord(context, 5);
    return { met: has(houseOf(context, l5), KENDRA) && l5 !== 'Jupiter' && together(context, l5, 'Jupiter'), lines: [`${where(context, l5)}; with Jupiter: ${together(context, l5, 'Jupiter') ? 'yes' : 'no'}`] };
  }),
  rule(16, 'son-year-40', [20], 'Jupiter in the 9th from the lagna and Venus in the 9th from Jupiter, or the lagna lord with Venus', 'A son in the 40th year.', context => {
    const l1 = lord(context, 1);
    const a = houseOf(context, 'Jupiter') === 9 && signFrom(context, 'Jupiter', 9) === signOf(context, 'Venus');
    return { met: a || (l1 !== 'Venus' && together(context, l1, 'Venus')), lines: [`${where(context, 'Jupiter')}; ${where(context, 'Venus')}; the lagna lord ${l1} with Venus: ${together(context, l1, 'Venus') ? 'yes' : 'no'}`] };
  }),
  rule(16, 'son-dies-32', [21], 'Rāhu in the 5th, its lord with a malefic, Jupiter debilitated', 'The death of a son in the 32nd year.', context => {
    const l5 = lord(context, 5); const jup = signOf(context, 'Jupiter');
    return { met: houseOf(context, 'Rahu') === 5 && withMalefics(context, l5).length > 0 && jup !== null && debilitated('Jupiter', jup), lines: [`${where(context, 'Rahu')}; the 5th lord ${l5} with ${mixed(withMalefics(context, l5))}; Jupiter in ${signName(jup ?? 1)}`] };
  }),
  rule(16, 'son-loss-malefic-5th', [22], 'A malefic in the 5th from Jupiter and in the 5th from the lagna', 'Loss of a son in the 36th, 33rd or 40th year.', context => {
    const j5 = signFrom(context, 'Jupiter', 5);
    const a = context.planets.filter(planet => planet.sign === j5 && isMalefic(context, planet.name)).map(planet => planet.name);
    const b = maleficsIn(context, 5);
    return { met: a.length > 0 && b.length > 0, lines: [`Malefics in the 5th from Jupiter: ${mixed(a)}; in the 5th from the lagna: ${mixed(b)}`] };
  }),
  rule(16, 'ten-sons', [24, 25], 'Malefics in the 4th and 6th, the 5th lord exalted with the lagna lord, Jupiter with benefics', 'Ten sons. (Read: "highest exaltation" as the exaltation sign; the kāraka is Jupiter.)', context => {
    const l5 = lord(context, 5); const l1 = lord(context, 1);
    const ben = [...SEVEN].filter(name => name !== 'Jupiter' && isBenefic(context, name) && together(context, 'Jupiter', name));
    return { met: maleficsIn(context, 4).length > 0 && maleficsIn(context, 6).length > 0 && exalted(context, l5) && l5 !== l1 && together(context, l5, l1) && ben.length > 0, lines: [`Malefics in the 4th: ${mixed(maleficsIn(context, 4))}, 6th: ${mixed(maleficsIn(context, 6))}; the 5th lord ${l5} ${exalted(context, l5) ? 'exalted' : 'not exalted'}, with the lagna lord: ${together(context, l5, l1) ? 'yes' : 'no'}; Jupiter with ${mixed(ben)}`] };
  }),
  rule(16, 'nine-sons', [25, 26], 'Jupiter exalted, the 2nd lord with Rāhu and the 9th lord in the 9th', 'Nine sons.', context => {
    const l2 = lord(context, 2);
    return { met: exalted(context, 'Jupiter') && together(context, l2, 'Rahu') && lordHouse(context, 9) === 9, lines: [`Jupiter ${exalted(context, 'Jupiter') ? 'exalted' : 'not exalted'}; the 2nd lord ${l2} with Rāhu: ${together(context, l2, 'Rahu') ? 'yes' : 'no'}; ${where(context, lord(context, 9))}`] };
  }),
  rule(16, 'eight-sons', [26, 27], 'Jupiter in the 5th, the 5th lord strong and the 2nd lord in the 10th', 'Eight sons.', context => {
    const l5 = lord(context, 5); const strong = isStrong(context, l5);
    if (strong === null) return cannot('The strength of the 5th lord is not known');
    return { met: houseOf(context, 'Jupiter') === 5 && strong && lordHouse(context, 2) === 10, lines: [`${where(context, 'Jupiter')}; the 5th lord ${l5} ${strong ? 'strong' : 'not strong'}; ${where(context, lord(context, 2))}`] };
  }),
  rule(16, 'seven-sons', [27, 28], 'Saturn in the 9th and the 5th lord in the 5th', 'Seven sons, and twins when there are two conceptions.', context => ({
    met: houseOf(context, 'Saturn') === 9 && lordHouse(context, 5) === 5, lines: [`${where(context, 'Saturn')}; ${where(context, lord(context, 5))}`],
  })),
  rule(16, 'six-sons', [28, 29], 'The 2nd lord in the 5th and the 5th lord in the 5th', 'Six sons, of whom three die.', context => ({
    met: lordHouse(context, 2) === 5 && lordHouse(context, 5) === 5, lines: [`${where(context, lord(context, 2))}; ${where(context, lord(context, 5))}`],
  })),
  rule(16, 'one-son', [29, 30], 'The 5th joined by a malefic', 'One son. (Read from 16.29b–30a; the other half of the sentence, Jupiter and Saturn each in the 5th from the other, cannot be met.)', context => ({
    met: maleficsIn(context, 5).length > 0, lines: [`Malefics in the 5th: ${mixed(maleficsIn(context, 5))}`],
  })),
  rule(16, 'wives-and-son-by-another', [30, 31], 'Saturn in the 5th from Jupiter', 'A son by another wife, and three wives. (Read from 16.30b–31a.)', context => {
    const target = signFrom(context, 'Jupiter', 5);
    return { met: target !== null && signOf(context, 'Saturn') === target, lines: [`Jupiter in ${signName(signOf(context, 'Jupiter') ?? 1)}, Saturn in ${signName(signOf(context, 'Saturn') ?? 1)}`] };
  }),
  rule(16, 'children-die', [32], 'The lagna lord in the 2nd and the 5th lord with Mars', 'Every child born dies, but he himself is long-lived.', context => {
    const l5 = lord(context, 5);
    return { met: lordHouse(context, 1) === 2 && l5 !== 'Mars' && together(context, l5, 'Mars'), lines: [`${where(context, lord(context, 1))}; the 5th lord ${l5} with Mars: ${together(context, l5, 'Mars') ? 'yes' : 'no'}`] };
  }),
];

