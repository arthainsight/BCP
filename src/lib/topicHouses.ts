import { combustionOf } from './combustion';
import {
  SEVEN, beneficsIn, beneficsSeeing, beneficsSeeingSign, cannot, drekkanaSign, find, grahasInHouse, has, houseOf, isBenefic, isMalefic, isStrong, joinedOrSeen, lordHouse, lordOfHouse, lordOfSign,
  maleficsIn, maleficsSeeing, mixed, ordinalEn, ownOrExalted, debilitated, inEnemySign, signName, signOf, signOfHouse, sees, seesSign, together, where, withMalefics, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';
import { navamshaSign } from './birthConditions';
import { EXALTATION, NATURAL_FRIENDS, OWN_SIGNS } from './dignity';

/**
 * The twelve houses, "bhāva-phala": Bṛhat Parāśara Horā Śāstra chapters 12 (the lagna), 13 (the 2nd), 14 (the 3rd), 15 (the 4th), 16 (the 5th), 20 (the 9th), 21 (the 10th), 22 (the 11th) and 23 (the 12th). The 6th, 7th and 8th are in the illness, marriage and longevity topics (17, 18, 19).
 * "Strong" is a Ṣaḍbala of 1 or more; a "kendra" is the 1st, 4th, 7th, 10th and a "trikoṇa" the 5th and 9th (the lagna counts as both); the kāraka of the siblings is Mars and of the children Jupiter.
 * Where a sentence of the text runs over to the next verse (the number of sons, 16.24–31, the vehicles, 15.10–14) it is read as one rule with the verses it uses. Readings are named in the rule.
 * The years of the father's death (20.13–25) are given as the text has them: the conditions end one verse and the years open the next. Not judged there: 20.23b–24a (whether Saturn is in the 8th and 7th, or in either, is not clear), 20.20's "lagna lord with the 8th" is read as with the 8th lord.
 * Not judged: the aṃśa conditions of 23.3–6, the navāṁśa of 21.16, Māndi (16.9, 16.23), the Pārāvata and other divisions (13.11), the "lord of the eyes" (13.12), the twins of 12.9, 13.4 (which asks for the 11th and 2nd in kendras and trikoṇas, which they cannot be), the lists of 15.10,
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
const BENEFIC_SIGN = (sign: number) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(lordOfSign(sign));
const lagnaBenefics = (context: TopicContext) => beneficsSeeingSign(context, context.ascendantSign);

const FIRST_FIVE: TopicYogaRule[] = [
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

/** The text gives the years of the father's death in a pattern: the conditions close one verse and the years open the next. `verses` are those two. */
const fatherRule = (id: string, verses: number[], name: string, years: string, test: (context: TopicContext) => { ok: boolean; line: string }): TopicYogaRule =>
  rule(20, id, verses, name, `The father dies in ${years}. (The conditions end one verse and the years open the next.)`, context => { const r = test(context); return { met: r.ok, lines: [r.line] }; });

const LAST_FOUR: TopicYogaRule[] = [
  // ── chapter 20: the 9th house ──
  rule(20, 'ninth-lord-strong', [1], 'The 9th lord strong in the 9th', 'One of great fortune.', context => {
    const l9 = lord(context, 9); const strong = isStrong(context, l9);
    if (strong === null) return cannot(`The strength of the 9th lord ${l9} is not known`);
    return { met: strong && houseOf(context, l9) === 9, lines: [`${where(context, l9)}, ${strong ? 'strong' : 'not strong'}`] };
  }),
  rule(20, 'jupiter-9th', [2], 'Jupiter in the 9th, its lord in a kendra and the lagna lord strong', 'Much fortune. (Read: "its lord" is the lord of the 9th.)', context => {
    const l1 = lord(context, 1); const strong = isStrong(context, l1);
    if (strong === null) return cannot(`The strength of the lagna lord ${l1} is not known`);
    return { met: houseOf(context, 'Jupiter') === 9 && has(lordHouse(context, 9), KENDRA) && strong, lines: [`${where(context, 'Jupiter')}; ${where(context, lord(context, 9))}; the lagna lord ${l1} ${strong ? 'strong' : 'not strong'}`] };
  }),
  rule(20, 'father-fortunate', [3], 'The 9th lord strong, Venus in the 9th, Jupiter in a kendra', 'The father is fortunate. (Read: "with Venus" as Venus in the 9th.)', context => {
    const l9 = lord(context, 9); const strong = isStrong(context, l9);
    if (strong === null) return cannot(`The strength of the 9th lord ${l9} is not known`);
    return { met: strong && houseOf(context, 'Venus') === 9 && has(houseOf(context, 'Jupiter'), KENDRA), lines: [`The 9th lord ${l9} ${strong ? 'strong' : 'not strong'}; ${where(context, 'Venus')}; ${where(context, 'Jupiter')}`] };
  }),
  rule(20, 'father-poor', [4], 'The 9th lord in the 10th, or Mars in the 4th, or the 9th lord debilitated', 'The father is poor. (The 2nd from the 9th is the 10th.)', context => {
    const l9 = lord(context, 9); const sign = signOf(context, l9);
    if (sign === null) return cannot('The 9th lord is missing');
    const found = [lordHouse(context, 9) === 10 ? 'the 9th lord in the 10th' : '', houseOf(context, 'Mars') === 4 ? 'Mars in the 4th' : '', debilitated(l9, sign) ? 'the 9th lord debilitated' : ''].filter(Boolean);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : `${where(context, l9)}; ${where(context, 'Mars')}`] };
  }),
  rule(20, 'father-long-lived', [5], 'The 9th lord exalted with Jupiter and Venus in a kendra', 'The father is long-lived. (Read: "highest exaltation" as the exaltation sign; "the 9th aṃśa with Jupiter" as the 9th lord with Jupiter.)', context => {
    const l9 = lord(context, 9);
    return { met: exalted(context, l9) && l9 !== 'Jupiter' && together(context, l9, 'Jupiter') && has(houseOf(context, 'Venus'), KENDRA), lines: [`${where(context, l9)}${exalted(context, l9) ? ', exalted' : ''}; with Jupiter: ${together(context, l9, 'Jupiter') ? 'yes' : 'no'}; ${where(context, 'Venus')}`] };
  }),
  rule(20, 'father-king', [6], 'The 9th lord in a kendra and seen by Jupiter', 'The father has vehicles and is a king or like one.', context => {
    const l9 = lord(context, 9);
    return { met: has(houseOf(context, l9), KENDRA) && sees(context, 'Jupiter', l9), lines: [`${where(context, l9)}; Jupiter ${sees(context, 'Jupiter', l9) ? 'aspects' : 'does not aspect'} it`] };
  }),
  rule(20, 'father-wealthy', [7], 'The 9th lord in the 10th and the 10th lord in the 9th, seen by benefics', 'The father is wealthy and famous. (Read: one of the two is seen by a benefic.)', context => {
    const a = lord(context, 9); const b = lord(context, 10);
    const ben = [...beneficsSeeing(context, a), ...beneficsSeeing(context, b)];
    return { met: lordHouse(context, 9) === 10 && lordHouse(context, 10) === 9 && ben.length > 0, lines: [`${where(context, a)}; ${where(context, b)}; benefics aspecting: ${mixed([...new Set(ben)])}`] };
  }),
  rule(20, 'sun-exalted-ninth-lord-11', [8], 'The Sun exalted and the 9th lord in the 11th', 'Devoted to dharma, dear to the king, devoted to his father.', context => ({
    met: exalted(context, 'Sun') && lordHouse(context, 9) === 11, lines: [`Sun ${exalted(context, 'Sun') ? 'exalted' : 'not exalted'}; ${where(context, lord(context, 9))}`],
  })),
  rule(20, 'sun-trikona-ninth-7', [9], 'The Sun in a trikoṇa, the 9th lord in the 7th with or seen by Jupiter', 'Devotion to the father.', context => {
    const l9 = lord(context, 9);
    return { met: has(houseOf(context, 'Sun'), [1, 5, 9]) && lordHouse(context, 9) === 7 && joinedOrSeen(context, l9, 'Jupiter'), lines: [`${where(context, 'Sun')}; ${where(context, l9)}; Jupiter joins or aspects it: ${joinedOrSeen(context, l9, 'Jupiter') ? 'yes' : 'no'}`] };
  }),
  rule(20, 'exchange-9-2', [10], 'The 9th lord in the 2nd and the 2nd lord in the 9th', 'Fortune after the age of thirty-two, vehicles and fame.', context => ({
    met: lordHouse(context, 9) === 2 && lordHouse(context, 2) === 9, lines: [`${where(context, lord(context, 9))}; ${where(context, lord(context, 2))}`],
  })),
  rule(20, 'father-enemy', [11], 'The lagna lord in the 9th with the 6th lord', 'Mutual enmity; the father is despised.', context => {
    const l1 = lord(context, 1); const l6 = lord(context, 6);
    return { met: lordHouse(context, 1) === 9 && l1 !== l6 && together(context, l1, l6), lines: [`${where(context, l1)}; the 6th lord ${l6} with it: ${together(context, l1, l6) ? 'yes' : 'no'}`] };
  }),
  rule(20, 'begging', [12], 'The 3rd lord weak with the 10th lord, the 9th lord debilitated and combust', 'He lives by begging for food. ("Weak" is a Ṣaḍbala under 1.)', context => {
    const l3 = lord(context, 3); const l10 = lord(context, 10); const l9 = lord(context, 9); const sign = signOf(context, l9);
    const weak = weakOrNot(context, l3);
    if (weak === null || sign === null) return cannot('A strength is not known');
    return { met: weak && l3 !== l10 && together(context, l3, l10) && debilitated(l9, sign) && combust(context, l9), lines: [`The 3rd lord ${l3} ${weak ? 'weak' : 'not weak'}, with the 10th lord ${l10}: ${together(context, l3, l10) ? 'yes' : 'no'}; the 9th lord ${l9} in ${signName(sign)}${combust(context, l9) ? ', combust' : ''}`] };
  }),
  fatherRule('father-before-birth', [13, 14], 'The Sun in the 6th, 8th or 12th, the 8th lord with the 9th lord, the 12th lord in the lagna, the 6th lord in the 5th', 'the womb, before the native\'s birth', context => ({
    ok: has(houseOf(context, 'Sun'), TRIKA) && lord(context, 8) !== lord(context, 9) && together(context, lord(context, 8), lord(context, 9)) && lordHouse(context, 12) === 1 && lordHouse(context, 6) === 5,
    line: `${where(context, 'Sun')}; ${where(context, lord(context, 8))}, ${where(context, lord(context, 9))}; ${where(context, lord(context, 12))}; ${where(context, lord(context, 6))}`,
  })),
  fatherRule('father-year-1', [14, 15], 'The Sun in the 8th and the 8th lord in the 9th', 'the first year', context => ({ ok: houseOf(context, 'Sun') === 8 && lordHouse(context, 8) === 9, line: `${where(context, 'Sun')}; ${where(context, lord(context, 8))}` })),
  fatherRule('father-year-3-16', [15, 16], 'The 12th lord in the 9th and the 9th lord in a debilitated sign', 'the 3rd or 16th year', context => {
    const l9 = lord(context, 9); const sign = signOf(context, l9);
    return { ok: lordHouse(context, 12) === 9 && sign !== null && debilitated(l9, sign), line: `${where(context, lord(context, 12))}; ${where(context, l9)}` };
  }),
  fatherRule('father-year-2-12', [16, 17], 'The lagna lord in the 8th and the 8th lord with the Sun', 'the 2nd or 12th year', context => {
    const l8 = lord(context, 8);
    return { ok: lordHouse(context, 1) === 8 && l8 !== 'Sun' && together(context, l8, 'Sun'), line: `${where(context, lord(context, 1))}; the 8th lord ${l8} with the Sun: ${together(context, l8, 'Sun') ? 'yes' : 'no'}` };
  }),
  fatherRule('father-year-16-18', [17, 18], 'Rāhu in the 8th from the 9th and the Sun in the 9th from the 9th', 'the 16th or 18th year', context => ({ ok: houseOf(context, 'Rahu') === 4 && houseOf(context, 'Sun') === 5, line: `${where(context, 'Rahu')}; ${where(context, 'Sun')}` })),
  fatherRule('father-year-7-19', [18, 19], 'The Sun with Rāhu and Saturn in the 9th from the Moon', 'the 7th or 19th year', context => {
    const moon = find(context, 'Moon'); const saturn = find(context, 'Saturn');
    const ninth = moon ? ((moon.sign - 1 + 8) % 12) + 1 : null;
    return { ok: together(context, 'Sun', 'Rahu') && saturn !== undefined && saturn.sign === ninth, line: `The Sun with Rāhu: ${together(context, 'Sun', 'Rahu') ? 'yes' : 'no'}; ${where(context, 'Saturn')}; the Moon in ${signName(moon?.sign ?? 1)}` };
  }),
  fatherRule('father-year-44', [19, 20], 'The 9th lord in the 12th and the 12th lord in the 9th', 'the 44th year', context => ({ ok: lordHouse(context, 9) === 12 && lordHouse(context, 12) === 9, line: `${where(context, lord(context, 9))}; ${where(context, lord(context, 12))}` })),
  fatherRule('father-year-35-41', [20, 21], 'The Moon in a navāṁśa of the Sun and the lagna lord with the 8th lord', 'the 35th or 41st year', context => {
    const moon = find(context, 'Moon'); const l1 = lord(context, 1); const l8 = lord(context, 8);
    return { ok: moon !== undefined && lordOfSign(navamshaSign(moon.longitude)) === 'Sun' && l1 !== l8 && together(context, l1, l8), line: `The Moon's navāṁśa: ${moon ? signName(navamshaSign(moon.longitude)) : 'unknown'}; the lagna lord ${l1} with the 8th lord ${l8}: ${together(context, l1, l8) ? 'yes' : 'no'}` };
  }),
  fatherRule('father-year-50', [21, 22], 'The Sun as 9th lord with Saturn and Mars', 'the 50th year', context => ({ ok: lord(context, 9) === 'Sun' && together(context, 'Sun', 'Saturn') && together(context, 'Sun', 'Mars'), line: `The 9th lord is ${lord(context, 9)}; the Sun with Saturn: ${together(context, 'Sun', 'Saturn') ? 'yes' : 'no'}, with Mars: ${together(context, 'Sun', 'Mars') ? 'yes' : 'no'}` })),
  fatherRule('father-year-6-25', [22, 23], 'The Sun in the 7th from the 9th (the 3rd) and Rāhu in the 7th from the 3rd (the 9th)', 'the 6th or 25th year', context => ({ ok: houseOf(context, 'Sun') === 3 && houseOf(context, 'Rahu') === 9, line: `${where(context, 'Sun')}; ${where(context, 'Rahu')}` })),
  fatherRule('father-year-26-33', [24, 25], 'The 9th lord in a debilitated sign and the lord of that sign in the 9th', 'the 26th or 33rd year', context => {
    const l9 = lord(context, 9); const sign = signOf(context, l9);
    return { ok: sign !== null && debilitated(l9, sign) && houseOf(context, lordOfSign(sign)) === 9, line: `${where(context, l9)}${sign !== null && debilitated(l9, sign) ? `, debilitated in ${signName(sign)} (lord ${lordOfSign(sign)})` : ''}` };
  }),
  rule(20, 'venus-exalted-ninth-lord', [26], 'Venus exalted with the 9th lord and Saturn in the 3rd', 'Great fortune. ("Highest exaltation" is read as the exaltation sign.)', context => {
    const l9 = lord(context, 9);
    return { met: exalted(context, 'Venus') && l9 !== 'Venus' && together(context, 'Venus', l9) && houseOf(context, 'Saturn') === 3, lines: [`Venus ${exalted(context, 'Venus') ? 'exalted' : 'not exalted'}, with the 9th lord ${l9}: ${together(context, 'Venus', l9) ? 'yes' : 'no'}; ${where(context, 'Saturn')}`] };
  }),
  rule(20, 'jupiter-ninth', [27], 'Jupiter in the 9th and the 9th lord in a kendra', 'Abundant fortune after twenty years.', context => ({ met: houseOf(context, 'Jupiter') === 9 && has(lordHouse(context, 9), KENDRA), lines: [`${where(context, 'Jupiter')}; ${where(context, lord(context, 9))}`] })),
  rule(20, 'mercury-ninth', [28], 'Mercury exalted and the 9th lord in the 9th', 'Great fortune from the age of thirty-six.', context => ({ met: exalted(context, 'Mercury') && lordHouse(context, 9) === 9, lines: [`Mercury ${exalted(context, 'Mercury') ? 'exalted' : 'not exalted'}; ${where(context, lord(context, 9))}`] })),
  rule(20, 'exchange-1-9-jupiter-7', [29], 'The lagna lord in the 9th, the 9th lord in the lagna and Jupiter in the 7th', 'Wealth and vehicles.', context => ({
    met: lordHouse(context, 1) === 9 && lordHouse(context, 9) === 1 && houseOf(context, 'Jupiter') === 7, lines: [`${where(context, lord(context, 1))}; ${where(context, lord(context, 9))}; ${where(context, 'Jupiter')}`],
  })),
  rule(20, 'without-fortune', [30], 'Rāhu in the 9th and the 9th lord in the 8th, or the 9th lord debilitated', 'Without fortune.', context => {
    const l9 = lord(context, 9); const sign = signOf(context, l9);
    if (sign === null) return cannot('The 9th lord is missing');
    const found = [houseOf(context, 'Rahu') === 9 && lordHouse(context, 9) === 8 ? 'Rāhu in the 9th and the 9th lord in the 8th' : '', debilitated(l9, sign) ? 'the 9th lord debilitated' : ''].filter(Boolean);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : `${where(context, 'Rahu')}; ${where(context, l9)}`] };
  }),
  rule(20, 'beggar-saturn-moon', [31], 'Saturn with the Moon in the 9th and the lagna lord debilitated', 'A beggar.', context => {
    const l1 = lord(context, 1); const sign = signOf(context, l1);
    return { met: houseOf(context, 'Saturn') === 9 && together(context, 'Saturn', 'Moon') && sign !== null && debilitated(l1, sign), lines: [`${where(context, 'Saturn')}; ${where(context, 'Moon')}; the lagna lord ${l1} in ${signName(sign ?? 1)}`] };
  }),
  // ── chapter 21: the 10th house ──
  rule(21, 'tenth-lord-strong-dignified', [2], 'The 10th lord strong and exalted, in its own navāṁśa or its own sign', 'Happiness from the father, fame, good deeds.', context => {
    const l10 = lord(context, 10); const strong = isStrong(context, l10); const body = find(context, l10);
    if (strong === null || !body) return cannot(`The strength of the 10th lord ${l10} is not known`);
    const ownNav = OWN_SIGNS[l10]?.includes(navamshaSign(body.longitude)) === true;
    return { met: strong && (dignified(context, l10) || ownNav), lines: [`The 10th lord ${l10} ${strong ? 'strong' : 'not strong'}, in ${signName(body.sign)}${ownNav ? ' (own navāṁśa)' : ''}`] };
  }),
  rule(21, 'tenth-lord-weak', [3], 'The 10th lord weak', 'A fault in the work. ("Weak" is a Ṣaḍbala under 1.)', context => {
    const l10 = lord(context, 10); const weak = weakOrNot(context, l10);
    if (weak === null) return cannot(`The strength of the 10th lord ${l10} is not known`);
    return { met: weak, lines: [`The 10th lord ${l10} is ${weak ? 'weak' : 'not weak'}`] };
  }),
  rule(21, 'rahu-kendra-yajna', [3], 'Rāhu in a kendra or trikoṇa', 'He performs great sacrifices like the Jyotiṣṭoma.', context => ({ met: has(houseOf(context, 'Rahu'), KENDRA_TRIKONA), lines: [where(context, 'Rahu')] })),
  rule(21, 'tenth-lord-benefics', [4], 'The 10th lord with benefics in a good house', 'Always gain at the court and in trade. (A good house is read as a kendra or trikoṇa.)', context => {
    const l10 = lord(context, 10);
    const ben = beneficsIn(context, houseOf(context, l10) ?? 0).filter(name => name !== l10);
    return { met: ben.length > 0 && has(houseOf(context, l10), KENDRA_TRIKONA), lines: [`${where(context, l10)}; with benefics: ${mixed(ben)}`] };
  }),
  rule(21, 'malefics-10-11', [5], 'Malefics in the 10th and in the 11th', 'Evil deeds, a slanderer of his own people.', context => ({ met: maleficsIn(context, 10).length > 0 && maleficsIn(context, 11).length > 0, lines: [`10th: ${mixed(maleficsIn(context, 10))}; 11th: ${mixed(maleficsIn(context, 11))}`] })),
  rule(21, 'tenth-lord-12-rahu', [6], 'The 10th lord in the 12th with Rāhu', 'Hateful to people, a great fool, wrongdoing.', context => ({ met: lordHouse(context, 10) === 12 && together(context, lord(context, 10), 'Rahu'), lines: [`${where(context, lord(context, 10))}; with Rāhu: ${together(context, lord(context, 10), 'Rahu') ? 'yes' : 'no'}`] })),
  rule(21, 'tenth-lord-7-saturn-mars', [7], 'The 10th lord in the 7th with Saturn and Mars, the 7th lord with malefics', 'Given to lust and the belly.', context => {
    const l10 = lord(context, 10); const l7 = lord(context, 7);
    return { met: lordHouse(context, 10) === 7 && l10 !== 'Saturn' && l10 !== 'Mars' && together(context, l10, 'Saturn') && together(context, l10, 'Mars') && withMalefics(context, l7).length > 0, lines: [`${where(context, l10)}; with Saturn: ${together(context, l10, 'Saturn') ? 'yes' : 'no'}, Mars: ${together(context, l10, 'Mars') ? 'yes' : 'no'}; the 7th lord ${l7} with ${mixed(withMalefics(context, l7))}`] };
  }),
  rule(21, 'tenth-lord-exalted-jupiter', [8], 'The 10th lord exalted with Jupiter and the 9th lord in the 10th', 'Honour, prosperity and great influence.', context => {
    const l10 = lord(context, 10);
    return { met: exalted(context, l10) && l10 !== 'Jupiter' && together(context, l10, 'Jupiter') && lordHouse(context, 9) === 10, lines: [`${where(context, l10)}${exalted(context, l10) ? ', exalted' : ''}; with Jupiter: ${together(context, l10, 'Jupiter') ? 'yes' : 'no'}; ${where(context, lord(context, 9))}`] };
  }),
  rule(21, 'eleventh-lord-in-10th', [9], 'The 11th lord in the 10th and the 10th lord in the lagna, or both in kendras', 'A happy life.', context => {
    const first = lordHouse(context, 11) === 10 && lordHouse(context, 10) === 1;
    const second = has(lordHouse(context, 11), KENDRA) && has(lordHouse(context, 10), KENDRA);
    return { met: first || second, lines: [`${where(context, lord(context, 11))}; ${where(context, lord(context, 10))}`] };
  }),
  rule(21, 'tenth-lord-pisces', [10], 'The 10th lord strong with Jupiter in Pisces', 'Clothes, ornaments and comforts.', context => {
    const l10 = lord(context, 10); const strong = isStrong(context, l10);
    if (strong === null) return cannot(`The strength of the 10th lord ${l10} is not known`);
    return { met: strong && l10 !== 'Jupiter' && together(context, l10, 'Jupiter') && signOf(context, 'Jupiter') === 12, lines: [`The 10th lord ${l10} ${strong ? 'strong' : 'not strong'}; ${where(context, 'Jupiter')} in ${signName(signOf(context, 'Jupiter') ?? 1)}; together: ${together(context, l10, 'Jupiter') ? 'yes' : 'no'}`] };
  }),
  rule(21, 'sun-11-nodes', [11], 'The Sun in the 11th with Rāhu, Mars and Saturn', 'He destroys his actions.', context => ({ met: houseOf(context, 'Sun') === 11 && ['Rahu', 'Mars', 'Saturn'].every(name => together(context, 'Sun', name)), lines: [`${where(context, 'Sun')}; with Rāhu, Mars and Saturn: ${['Rahu', 'Mars', 'Saturn'].map(name => (together(context, 'Sun', name) ? 'yes' : 'no')).join(', ')}`] })),
  rule(21, 'jupiter-pisces-venus', [12], 'Jupiter in Pisces with Venus, the lagna lord strong, the Moon exalted', 'Perfect knowledge and wealth.', context => {
    const l1 = lord(context, 1); const strong = isStrong(context, l1);
    if (strong === null) return cannot(`The strength of the lagna lord ${l1} is not known`);
    return { met: signOf(context, 'Jupiter') === 12 && together(context, 'Jupiter', 'Venus') && strong && exalted(context, 'Moon'), lines: [`Jupiter in ${signName(signOf(context, 'Jupiter') ?? 1)}, with Venus: ${together(context, 'Jupiter', 'Venus') ? 'yes' : 'no'}; the lagna lord ${l1} ${strong ? 'strong' : 'not strong'}; the Moon ${exalted(context, 'Moon') ? 'exalted' : 'not exalted'}`] };
  }),
  rule(21, 'jewels', [13], 'A kendra lord in the 11th, the 11th lord in the lagna, Venus in the 10th', 'He has jewels.', context => {
    const kendraLord = [4, 7, 10].map(house => lord(context, house)).filter(name => houseOf(context, name) === 11);
    return { met: kendraLord.length > 0 && lordHouse(context, 11) === 1 && houseOf(context, 'Venus') === 10, lines: [`Kendra lords in the 11th: ${mixed(kendraLord)}; ${where(context, lord(context, 11))}; ${where(context, 'Venus')}`] };
  }),
  rule(21, 'tenth-lord-exalted-kendra', [14], 'The 10th lord exalted in a kendra or trikoṇa, joined or seen by Jupiter', 'He is engaged in great works.', context => {
    const l10 = lord(context, 10);
    return { met: exalted(context, l10) && has(houseOf(context, l10), KENDRA_TRIKONA) && l10 !== 'Jupiter' && joinedOrSeen(context, l10, 'Jupiter'), lines: [`${where(context, l10)}${exalted(context, l10) ? ', exalted' : ''}; Jupiter joins or aspects it: ${joinedOrSeen(context, l10, 'Jupiter') ? 'yes' : 'no'}`] };
  }),
  rule(21, 'tenth-lord-lagna', [15], 'The 10th lord in the lagna with the lagna lord, the Moon in a kendra or trikoṇa', 'Devoted to good works.', context => ({
    met: lordHouse(context, 10) === 1 && lordHouse(context, 1) === 1 && has(houseOf(context, 'Moon'), KENDRA_TRIKONA), lines: [`${where(context, lord(context, 10))}; ${where(context, lord(context, 1))}; ${where(context, 'Moon')}`],
  })),
  rule(21, 'tenth-lord-12-eighth', [17], 'The 10th lord in the 12th and the 8th lord in the 10th with a malefic', 'Devoted to evil deeds.', context => {
    const l8 = lord(context, 8);
    return { met: lordHouse(context, 10) === 12 && lordHouse(context, 8) === 10 && withMalefics(context, l8).length > 0, lines: [`${where(context, lord(context, 10))}; ${where(context, l8)}, with ${mixed(withMalefics(context, l8))}`] };
  }),
  rule(21, 'tenth-debilitated', [18], 'The 10th lord debilitated, a malefic in the 10th and another in the 7th', 'A fault in the work.', context => {
    const l10 = lord(context, 10); const sign = signOf(context, l10);
    return { met: sign !== null && debilitated(l10, sign) && maleficsIn(context, 10).length > 0 && maleficsIn(context, 7).length > 0, lines: [`The 10th lord ${l10} in ${signName(sign ?? 1)}; malefics in the 10th: ${mixed(maleficsIn(context, 10))}, 7th: ${mixed(maleficsIn(context, 7))}`] };
  }),
  rule(21, 'moon-10th-fame', [19], 'The Moon in the 10th, the 10th lord in a trikoṇa from it and the lagna lord in a kendra', 'Good fame. (The trikoṇas from the 10th are the 2nd and 6th.)', context => ({
    met: houseOf(context, 'Moon') === 10 && has(lordHouse(context, 10), [2, 6]) && has(lordHouse(context, 1), KENDRA), lines: [`${where(context, 'Moon')}; ${where(context, lord(context, 10))}; ${where(context, lord(context, 1))}`],
  })),
  rule(21, 'eleventh-in-10th-fame', [20], 'The 11th lord in the 10th and the 10th lord strong, seen by Jupiter', 'Good fame.', context => {
    const l10 = lord(context, 10); const strong = isStrong(context, l10);
    if (strong === null) return cannot(`The strength of the 10th lord ${l10} is not known`);
    return { met: lordHouse(context, 11) === 10 && strong && sees(context, 'Jupiter', l10), lines: [`${where(context, lord(context, 11))}; the 10th lord ${l10} ${strong ? 'strong' : 'not strong'}, Jupiter ${sees(context, 'Jupiter', l10) ? 'aspects' : 'does not aspect'} it`] };
  }),
  rule(21, 'tenth-lord-9th-moon-5th', [21], 'The 10th lord in the 9th, the lagna lord in the 10th and the Moon in the 5th', 'A renowned man.', context => ({
    met: lordHouse(context, 10) === 9 && lordHouse(context, 1) === 10 && houseOf(context, 'Moon') === 5, lines: [`${where(context, lord(context, 10))}; ${where(context, lord(context, 1))}; ${where(context, 'Moon')}`],
  })),
  // ── chapter 22: the 11th house ──
  rule(22, 'eleventh-lord-placed', [2], 'The 11th lord in the 11th, a kendra or a trikoṇa, or exalted', 'Much gain. (The alternative of the Sun\'s aṃśa is not tested.)', context => {
    const l11 = lord(context, 11);
    return { met: has(houseOf(context, l11), [11, ...KENDRA_TRIKONA]) || exalted(context, l11), lines: [`${where(context, l11)}${exalted(context, l11) ? ', exalted' : ''}`] };
  }),
  rule(22, 'eleventh-lord-2nd-jupiter', [3], 'The 11th lord in the 2nd, the 2nd lord in a kendra and Jupiter in the 2nd', 'Great gain.', context => ({
    met: lordHouse(context, 11) === 2 && has(lordHouse(context, 2), KENDRA) && houseOf(context, 'Jupiter') === 2, lines: [`${where(context, lord(context, 11))}; ${where(context, lord(context, 2))}; ${where(context, 'Jupiter')}`],
  })),
  rule(22, 'eleventh-lord-3rd', [4], 'The 11th lord in the 3rd with benefics', 'In the 36th year two thousand niṣkas.', context => {
    const l11 = lord(context, 11); const ben = beneficsIn(context, 3).filter(name => name !== l11);
    return { met: lordHouse(context, 11) === 3 && ben.length > 0, lines: [`${where(context, l11)}; with benefics: ${mixed(ben)}`] };
  }),
  rule(22, 'eleventh-lord-kendra-benefics', [5], 'The 11th lord in a kendra or trikoṇa with benefics', 'In the 40th year five hundred niṣkas.', context => {
    const l11 = lord(context, 11); const house = houseOf(context, l11);
    const ben = beneficsIn(context, house ?? 0).filter(name => name !== l11);
    return { met: has(house, KENDRA_TRIKONA) && ben.length > 0, lines: [`${where(context, l11)}; with benefics: ${mixed(ben)}`] };
  }),
  rule(22, 'jupiter-11-moon-2-venus-9', [6], 'Jupiter in the 11th, the Moon in the 2nd and Venus in the 9th', 'The owner of six thousand.', context => ({
    met: houseOf(context, 'Jupiter') === 11 && houseOf(context, 'Moon') === 2 && houseOf(context, 'Venus') === 9, lines: [`${where(context, 'Jupiter')}; ${where(context, 'Moon')}; ${where(context, 'Venus')}`],
  })),
  rule(22, 'jupiter-9-mercury-moon', [7], 'Jupiter in the 11th from the 11th (the 9th) with Mercury and the Moon', 'Lord of wealth and grain, with jewels. (Read literally: "lābhāt lābhage" is the 11th from the 11th house, the 9th.)', context => ({
    met: houseOf(context, 'Jupiter') === 9 && together(context, 'Jupiter', 'Mercury') && together(context, 'Jupiter', 'Moon'), lines: [`${where(context, 'Jupiter')}; with Mercury: ${together(context, 'Jupiter', 'Mercury') ? 'yes' : 'no'}, the Moon: ${together(context, 'Jupiter', 'Moon') ? 'yes' : 'no'}`],
  })),
  rule(22, 'exchange-11-1', [8], 'The 11th lord in the lagna and the lagna lord in the 11th', 'A thousand niṣkas in the 33rd year.', context => ({ met: lordHouse(context, 11) === 1 && lordHouse(context, 1) === 11, lines: [`${where(context, lord(context, 11))}; ${where(context, lord(context, 1))}`] })),
  rule(22, 'exchange-2-11', [9], 'The 2nd lord in the 11th and the 11th lord in the 2nd', 'Great fortune after marriage.', context => ({ met: lordHouse(context, 2) === 11 && lordHouse(context, 11) === 2, lines: [`${where(context, lord(context, 2))}; ${where(context, lord(context, 11))}`] })),
  rule(22, 'exchange-3-11', [10], 'The 3rd lord in the 11th and the 11th lord in the 3rd', 'Wealth from brothers and fine ornaments.', context => ({ met: lordHouse(context, 3) === 11 && lordHouse(context, 11) === 3, lines: [`${where(context, lord(context, 3))}; ${where(context, lord(context, 11))}`] })),
  rule(22, 'no-gain', [11], 'The 11th lord debilitated, in the 7th or in a trika house, with malefics', 'No gain however he tries.', context => {
    const l11 = lord(context, 11); const sign = signOf(context, l11);
    if (sign === null) return cannot('The 11th lord is missing');
    const place = debilitated(l11, sign) || has(houseOf(context, l11), [7, ...TRIKA]);
    return { met: place && withMalefics(context, l11).length > 0, lines: [`${where(context, l11)}${debilitated(l11, sign) ? ', debilitated' : ''}; with malefics: ${mixed(withMalefics(context, l11))}`] };
  }),
  // ── chapter 23: the 12th house ──
  rule(23, 'twelfth-benefic', [1, 2], 'The 12th lord with benefics, in its own sign or exaltation, or the 12th with benefics', 'Spending on good works. (Read as alternatives.)', context => {
    const l12 = lord(context, 12);
    const found = [beneficsIn(context, houseOf(context, l12) ?? 0).some(name => name !== l12) ? 'the 12th lord with benefics' : '', dignified(context, l12) ? 'the 12th lord in its own sign or exaltation' : '', beneficsIn(context, 12).length > 0 ? 'benefics in the 12th' : ''].filter(Boolean);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : where(context, l12)] };
  }),
  rule(23, 'moon-twelfth-lord', [2, 3], 'The Moon as lord of the 12th in the 5th, 9th or 11th', 'Fine houses and beds, divine scents, a splendid beloved, clothes and ornaments, immense wealth.', context => ({
    met: lord(context, 12) === 'Moon' && has(houseOf(context, 'Moon'), [5, 9, 11]), lines: [`The 12th lord is ${lord(context, 12)}; ${where(context, 'Moon')}`],
  })),
  rule(23, 'visible-half', [8], 'Grahas in the visible half (the 7th to 12th) and in the invisible half (the 1st to 6th)', 'The first give their results openly, the second indirectly.', context => {
    const seen = SEVEN.filter(name => has(houseOf(context, name), [7, 8, 9, 10, 11, 12])); const hidden = SEVEN.filter(name => has(houseOf(context, name), [1, 2, 3, 4, 5, 6]));
    return { met: true, lines: [`Visible half: ${mixed(seen)}; invisible half: ${mixed(hidden)}`] };
  }),
  rule(23, 'rahu-12-hell', [9], 'Rāhu in the 12th with Mars, Saturn and the Sun, the 12th lord with the Sun', 'A fall into hell (naraka).', context => {
    const l12 = lord(context, 12);
    return { met: houseOf(context, 'Rahu') === 12 && ['Mars', 'Saturn', 'Sun'].every(name => together(context, 'Rahu', name)) && (l12 === 'Sun' || together(context, l12, 'Sun')), lines: [`${where(context, 'Rahu')}; with Mars, Saturn, the Sun: ${['Mars', 'Saturn', 'Sun'].map(name => (together(context, 'Rahu', name) ? 'yes' : 'no')).join(', ')}; the 12th lord ${l12}${l12 === 'Sun' || together(context, l12, 'Sun') ? ' with the Sun' : ' not with the Sun'}`] };
  }),
  rule(23, 'mercury-12-moksha', [10], 'Mercury in the 12th, the 12th lord exalted, with and seen by benefics', 'Liberation (mokṣa), without doubt.', context => {
    const l12 = lord(context, 12);
    const with_ = beneficsIn(context, houseOf(context, l12) ?? 0).filter(name => name !== l12); const seen = beneficsSeeing(context, l12);
    return { met: houseOf(context, 'Mercury') === 12 && exalted(context, l12) && with_.length > 0 && seen.length > 0, lines: [`${where(context, 'Mercury')}; the 12th lord ${l12}${exalted(context, l12) ? ' exalted' : ' not exalted'}; with benefics: ${mixed(with_)}; seen by ${mixed(seen)}`] };
  }),
  rule(23, 'wanderer', [11], 'The 12th lord with malefics, malefics in the 12th, the 12th aspected by a malefic', 'He goes from land to land.', context => {
    const l12 = lord(context, 12);
    const seers = SEVEN.filter(name => isMalefic(context, name) && seesSign(context, name, signOfHouse(context, 12)));
    return { met: withMalefics(context, l12).length > 0 && maleficsIn(context, 12).length > 0 && seers.length > 0, lines: [`The 12th lord ${l12} with ${mixed(withMalefics(context, l12))}; malefics in the 12th: ${mixed(maleficsIn(context, 12))}; aspecting it: ${mixed(seers)}`] };
  }),
  rule(23, 'journey', [12], 'The 12th lord in a benefic sign, the 12th with benefics and seen by a benefic', 'A journey from his own country.', context => {
    const l12 = lord(context, 12); const sign = signOf(context, l12);
    if (sign === null) return cannot('The 12th lord is missing');
    const seers = SEVEN.filter(name => isBenefic(context, name) && seesSign(context, name, signOfHouse(context, 12)));
    return { met: BENEFIC_SIGN(sign) && beneficsIn(context, 12).length > 0 && seers.length > 0, lines: [`The 12th lord in ${signName(sign)}; benefics in the 12th: ${mixed(beneficsIn(context, 12))}; aspecting it: ${mixed(seers)}`] };
  }),
  rule(23, 'sinful-wealth', [13], 'The 12th with Saturn, Mars and other malefics, not seen by benefics', 'Wealth from sinful sources.', context => {
    const seers = SEVEN.filter(name => isBenefic(context, name) && seesSign(context, name, signOfHouse(context, 12)));
    return { met: houseOf(context, 'Saturn') === 12 && houseOf(context, 'Mars') === 12 && seers.length === 0, lines: [`${where(context, 'Saturn')}; ${where(context, 'Mars')}; benefics aspecting the 12th: ${mixed(seers)}`] };
  }),
  rule(23, 'exchange-1-12-venus', [14], 'The lagna lord in the 12th, the 12th lord in the lagna with Venus', 'Wealth spent for dharma.', context => {
    const l12 = lord(context, 12);
    return { met: lordHouse(context, 1) === 12 && lordHouse(context, 12) === 1 && houseOf(context, 'Venus') === 1, lines: [`${where(context, lord(context, 1))}; ${where(context, l12)}; ${where(context, 'Venus')}`] };
  }),
];

export const HOUSES_RULES: TopicYogaRule[] = [...FIRST_FIVE, ...LAST_FOUR];
