import { navamshaSign } from './birthConditions';
import { NATURAL_ENEMIES, OWN_SIGNS } from './dignity';
import {
  has, maleficsIn, beneficsIn, beneficsSeeingSign, maleficsSeeing, beneficsSeeing, withMalefics,
  SEVEN, cannot, find, grahasInHouse, hemmedBy, houseOf, houseOfSign, inEnemySign, isBenefic, isMalefic, isStrong, lordHouse, lordOfHouse, lordOfSign, mixed, moonWaxing, ordinalEn,
  sees, signName, signOf, signOfHouse, together, where, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Illness and ariṣṭa: Bṛhat Parāśara Horā Śāstra chapter 17 (the 6th house, "ṣaṣṭhabhāva-phala", 28 verses), chapter 9 (ariṣṭa: the dangers of birth to the child, the mother and the father, 45 verses) and chapter 10 (the cancelling of
 * ariṣṭa, 9 verses). The statements about death and disease are shown as the text has them: they are a reading of the text, not a prediction. The text gives the first twenty-four years to the ariṣṭa of birth (9.2).
 * Readings: "malefic" and "benefic" as in the other topics; "between two malefics" (pāpamadhya) is a malefic in the sign before and one in the sign after; "strong" is a Ṣaḍbala of 1 or more. Where a verse names a time of life, it is the text's.
 * Not judged: what needs the hour of birth (9.13's twilight, horā and gaṇḍānta, 9.7's eclipse, 9.14), Māndi (17.16), the east and west halves (9.15), a drekkāṇa (9.22), the houses of the father and other kārakas (17.3–5, 17.12),
 * the "house of destruction" of 17.17 (the 8th or the 12th is not settled by the verse), the sentences of 17.18, 17.21b–22 and 17.11b that run across verses, and the verses on the milk (9.27), the navāṁśa of Mars (9.40) and the closing 9.43.
 */
const rule = (chapter: number, id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'illness', chapter, verses, name, effect, evaluate });

const lord = (context: TopicContext, house: number) => lordOfHouse(context, house);
const MALEFIC = (context: TopicContext) => (name: string) => isMalefic(context, name);
const BENEFIC = (context: TopicContext) => (name: string) => isBenefic(context, name);
/** The house number (from the lagna) of the `count`th sign from a graha's. */
const houseFromGraha = (context: TopicContext, name: string, count: number): number | null => { const sign = signOf(context, name); return sign === null ? null : houseOfSign(context, ((sign - 1 + count - 1) % 12) + 1); };
/** The limbs of the Kālapuruṣa by sign (BPHS 4.9–12). */
const BODY = ['the head', 'the face', 'the chest and arms', 'the heart', 'the belly', 'the waist', 'the lower belly', 'the private parts', 'the thighs', 'the knees', 'the calves', 'the feet'];

/** A rule that asks only for grahas in houses: each `[graha, houses]` must hold. `extra` can add a condition. */
const placed = (chapter: number, id: string, verses: number[], name: string, effect: string, list: [string, number[]][], extra?: (context: TopicContext) => { ok: boolean; line: string }) =>
  rule(chapter, id, verses, name, effect, context => {
    const rows = list.map(([graha, houses]) => ({ graha, ok: has(houseOf(context, graha), houses), where: where(context, graha) }));
    const more = extra ? extra(context) : { ok: true, line: '' };
    return { met: rows.every(row => row.ok) && more.ok, lines: [`${rows.map(row => `${row.where}${row.ok ? '' : ' (no)'}`).join('; ')}${more.line ? `; ${more.line}` : ''}`] };
  });

export const ILLNESS_RULES: TopicYogaRule[] = [
  // ── chapter 17: the 6th house ──
  rule(17, 'wound-6th-lord', [2], 'The 6th lord in its own sign, in the lagna or in the 8th', 'Wounds in the body, in the part that the sign of the 6th shows.', context => {
    const l6 = lord(context, 6); const sign = signOf(context, l6); const house = houseOf(context, l6);
    if (sign === null || house === null) return cannot('The 6th lord is missing');
    const own = OWN_SIGNS[l6]?.includes(sign) === true;
    return { met: own || has(house, [1, 8]), lines: [`The 6th lord ${l6} is in the ${ordinalEn(house)}, in ${signName(sign)}${own ? ' (its own)' : ''}; the 6th is ${signName(signOfHouse(context, 6))}: ${BODY[signOfHouse(context, 6) - 1]}`] };
  }),
  rule(17, 'face-lagna-lord', [6], 'The lagna lord in a sign of Mars or Mercury and seen by Mercury', 'Disease of the face. (Read as one condition; the verse also says "wherever it stands" for the aspect of Mercury.)', context => {
    const l1 = lord(context, 1); const sign = signOf(context, l1);
    if (sign === null) return cannot('The lagna lord is missing');
    const inSign = ['Mars', 'Mercury'].includes(lordOfSign(sign));
    const seen = sees(context, 'Mercury', l1);
    return { met: inSign && seen, lines: [`The lagna lord ${l1} is in ${signName(sign)}, a sign of ${lordOfSign(sign)}; Mercury ${seen ? 'aspects' : 'does not aspect'} it`] };
  }),
  rule(17, 'leprosy-lagna-lord', [7], 'The lagna lord, Mars or Mercury, with the Moon, Rāhu and Saturn', 'Leprosy (kuṣṭha). (The verse has "the two lords of the lagna, Mars and Mercury" and is read as the lagna lord being one of them.)', context => {
    const l1 = lord(context, 1);
    const isOne = ['Mars', 'Mercury'].includes(l1);
    const with_ = ['Moon', 'Rahu', 'Saturn'].filter(name => together(context, l1, name));
    return { met: isOne && with_.length === 3, lines: [`The lagna lord is ${l1}; with ${mixed(with_)}`] };
  }),
  rule(17, 'leprosy-moon-lagna', [8, 9], 'The Moon in the lagna without the lagna lord, with Rāhu, Saturn or Mars', 'With Rāhu white leprosy (śveta-kuṣṭha), with Saturn black (kṛṣṇa-kuṣṭha), with Mars red (rakta-kuṣṭha).', context => {
    if (houseOf(context, 'Moon') !== 1) return { met: false, lines: [`${where(context, 'Moon')}`] };
    const l1 = lord(context, 1);
    if (l1 !== 'Moon' && houseOf(context, l1) === 1) return { met: false, lines: [`The lagna lord ${l1} is in the lagna with the Moon`] };
    const kinds: [string, string][] = [['Rahu', 'white leprosy'], ['Saturn', 'black leprosy'], ['Mars', 'red leprosy']];
    const found = kinds.filter(([name]) => together(context, 'Moon', name));
    return { met: found.length > 0, lines: [found.length ? `The Moon is in the lagna with ${found.map(([name, kind]) => `${name}: ${kind}`).join('; ')}` : 'The Moon is in the lagna with none of Rāhu, Saturn and Mars'] };
  }),
  rule(17, 'boils-6-8-sun', [9, 10, 11], 'The lords of the 6th and 8th with the Sun in the lagna', 'Fever boils (jvara-gaṇḍa); with Mars glandular swellings or weapon wounds, with Mercury bile, with Jupiter no disease, with Venus disease from women, with the Moon wind.', context => {
    const six = lord(context, 6); const eight = lord(context, 8);
    const there = [six, eight, 'Sun'].every(name => houseOf(context, name) === 1);
    const kinds: [string, string][] = [['Mars', 'glandular swellings or weapon wounds'], ['Mercury', 'bile'], ['Jupiter', 'no disease'], ['Venus', 'disease from women'], ['Moon', 'wind']];
    const found = kinds.filter(([name]) => ![six, eight].includes(name as never) && houseOf(context, name) === 1);
    return { met: there, lines: [`${where(context, six)}; ${where(context, eight)}; ${where(context, 'Sun')}${there && found.length ? `; also in the lagna: ${found.map(([name, kind]) => `${name}: ${kind}`).join('; ')}` : ''}`] };
  }),
  rule(17, 'gandam-6th-malefic', [13], 'A malefic in the 6th and the 6th lord with a malefic', 'A critical period (gaṇḍa).', context => {
    const in6 = maleficsIn(context, 6); const l6 = lord(context, 6);
    const with_ = withMalefics(context, l6);
    return { met: in6.length > 0 && with_.length > 0, lines: [`Malefics in the 6th: ${mixed(in6)}; the 6th lord ${l6} is with ${mixed(with_)}`] };
  }),
  rule(17, 'saturn-rahu', [14], 'Saturn with Rāhu', 'Always joined with disease.', context => ({ met: together(context, 'Saturn', 'Rahu'), lines: [`Saturn in ${signName(signOf(context, 'Saturn') ?? 1)}, Rāhu in ${signName(signOf(context, 'Rahu') ?? 1)}`] })),
  rule(17, 'fever-mars-6th', [14, 15], 'Mars in the 6th and the 6th lord with the 8th lord', 'Fever in the 6th or 12th year.', context => {
    const l6 = lord(context, 6); const l8 = lord(context, 8);
    return { met: houseOf(context, 'Mars') === 6 && (l6 === l8 || together(context, l6, l8)), lines: [`${where(context, 'Mars')}; the 6th lord ${l6} and the 8th lord ${l8} ${together(context, l6, l8) ? 'are together' : 'are apart'}`] };
  }),
  rule(17, 'leprosy-jupiter-6th', [15, 16], 'Jupiter in the 6th with the Moon', 'Leprosy in the 19th or 22nd year.', context => ({ met: houseOf(context, 'Jupiter') === 6 && together(context, 'Jupiter', 'Moon'), lines: [`${where(context, 'Jupiter')}; ${where(context, 'Moon')}`] })),
  rule(17, 'red-leprosy-55', [19], 'The lagna lord in the lagna and Saturn with an enemy', 'Red leprosy in the 55th year.', context => {
    const l1 = lord(context, 1);
    const enemies = (NATURAL_ENEMIES.Saturn ?? []).filter(name => together(context, 'Saturn', name));
    return { met: houseOf(context, l1) === 1 && enemies.length > 0, lines: [`${where(context, l1)}; Saturn is with ${mixed(enemies)}`] };
  }),
  rule(17, 'rheumatism-59', [20], 'The 8th lord in the 6th and the 12th lord in the lagna', 'Rheumatic disease (vāta) in the 59th year.', context => ({ met: lordHouse(context, 8) === 6 && lordHouse(context, 12) === 1, lines: [`${where(context, lord(context, 8))}; ${where(context, lord(context, 12))}`] })),
  rule(17, 'animals-moon-6th-lord', [21], 'The Moon with the 6th lord', 'Fear from animals in the 8th year.', context => {
    const l6 = lord(context, 6);
    return { met: l6 !== 'Moon' && together(context, 'Moon', l6), lines: [`The 6th lord is ${l6}; ${where(context, 'Moon')}`] };
  }),
  rule(17, 'water-sun-6-8', [23], 'The Sun in the 6th or 8th and the Moon in the 12th from it', 'Danger from water in the 5th or 9th year.', context => {
    const sun = houseOf(context, 'Sun'); const moon = houseFromGraha(context, 'Sun', 12);
    return { met: has(sun, [6, 8]) && moon !== null && houseOf(context, 'Moon') === moon, lines: [`${where(context, 'Sun')}; ${where(context, 'Moon')}`] };
  }),
  rule(17, 'boils-saturn-8', [24], 'Saturn in the 8th, or Mars in the 12th from the 8th (the 7th)', 'Boils and the like in the 10th or 30th year. (The verse is read as "or".)', context => {
    const found = [houseOf(context, 'Saturn') === 8 ? 'Saturn in the 8th' : '', houseOf(context, 'Mars') === 7 ? 'Mars in the 7th' : ''].filter(Boolean);
    return { met: found.length > 0, lines: [found.length ? found.join('; ') : `${where(context, 'Saturn')}; ${where(context, 'Mars')}`] };
  }),
  rule(17, 'glands-8th-lord-rahu', [25], 'The 8th lord with Rāhu, in its own navāṁśa, in the 4th, 8th or 12th', 'Glandular swellings and diabetes in the 18th or 22nd year.', context => {
    const l8 = lord(context, 8); const body = find(context, l8);
    if (!body) return cannot('The 8th lord is missing');
    const ownNav = OWN_SIGNS[l8]?.includes(navamshaSign(body.longitude)) === true;
    return { met: together(context, l8, 'Rahu') && ownNav && has(houseOf(context, l8), [4, 8, 12]), lines: [`${where(context, l8)}; with Rāhu: ${together(context, l8, 'Rahu') ? 'yes' : 'no'}; in its own navāṁśa: ${ownNav ? 'yes' : 'no'}`] };
  }),
  rule(17, 'enemies-11-6', [26], 'The 11th lord in the 6th and the 6th lord in the 11th', 'Loss of wealth through enemies in the 31st year.', context => ({ met: lordHouse(context, 11) === 6 && lordHouse(context, 6) === 11, lines: [`${where(context, lord(context, 11))}; ${where(context, lord(context, 6))}`] })),
  rule(17, 'son-enemy', [27], 'The 5th lord in the 6th, the 6th lord with Jupiter, the 12th lord in the lagna', 'His son becomes an enemy.', context => {
    const l6 = lord(context, 6);
    return { met: lordHouse(context, 5) === 6 && l6 !== 'Jupiter' && together(context, l6, 'Jupiter') && lordHouse(context, 12) === 1, lines: [`${where(context, lord(context, 5))}; the 6th lord ${l6} is ${together(context, l6, 'Jupiter') ? 'with' : 'not with'} Jupiter; ${where(context, lord(context, 12))}`] };
  }),
  rule(17, 'dog-lagna-lord-6th', [28], 'The lagna lord in the 6th and the 6th lord in the 6th', 'Fear from a dog in the 10th or 19th year.', context => ({ met: lordHouse(context, 1) === 6 && lordHouse(context, 6) === 6, lines: [`${where(context, lord(context, 1))}; ${where(context, lord(context, 6))}`] })),

  // ── chapter 9: ariṣṭa ──
  rule(9, 'moon-dusthana', [3], 'The Moon in the 6th, 8th or 12th, aspected by malefics or by benefics', 'Seen by malefics, death at once; seen by benefics, death in the eighth year.', context => {
    const house = houseOf(context, 'Moon');
    const mal = maleficsSeeing(context, 'Moon'); const ben = beneficsSeeing(context, 'Moon');
    return { met: has(house, [6, 8, 12]) && (mal.length > 0 || ben.length > 0), lines: [`${where(context, 'Moon')}; aspected by malefics: ${mixed(mal)}; by benefics: ${mixed(ben)}`] };
  }),
  rule(9, 'retrograde-benefics', [4], 'Retrograde benefics seen by malefics, the lagna without a benefic', 'Death of the newborn within a month.', context => {
    const retro = ['Mercury', 'Jupiter', 'Venus'].filter(name => find(context, name)?.isRetrograde === true && maleficsSeeing(context, name).length > 0);
    return { met: retro.length > 0 && beneficsIn(context, 1).length === 0, lines: [`Retrograde benefics seen by malefics: ${mixed(retro)}; benefics in the lagna: ${mixed(beneficsIn(context, 1))}`] };
  }),
  placed(9, 'mother-brother-5th', [5], 'The Sun, Saturn, the Moon and Mars in the 5th', 'The mother and the brother soon die.', [['Sun', [5]], ['Saturn', [5]], ['Moon', [5]], ['Mars', [5]]]),
  rule(9, 'mars-lagna', [6], 'Mars in the lagna, seen or joined by malefics and not seen by benefics; or in the 8th with Saturn or the Sun', 'Death.', context => {
    const lagna = houseOf(context, 'Mars') === 1 && (maleficsSeeing(context, 'Mars').length > 0 || withMalefics(context, 'Mars').length > 0) && beneficsSeeing(context, 'Mars').length === 0;
    const eighth = houseOf(context, 'Mars') === 8 && (together(context, 'Mars', 'Saturn') || together(context, 'Mars', 'Sun'));
    return { met: lagna || eighth, lines: [`${where(context, 'Mars')}; malefics joining or aspecting: ${mixed([...withMalefics(context, 'Mars'), ...maleficsSeeing(context, 'Mars')])}; benefics aspecting: ${mixed(beneficsSeeing(context, 'Mars'))}`] };
  }),
  placed(9, 'with-mother', [8], 'Saturn in the 10th, the Moon in the 6th, Mars in the 7th', 'He dies with his mother.', [['Saturn', [10]], ['Moon', [6]], ['Mars', [7]]]),
  placed(9, 'yama-house', [9], 'Saturn in the lagna, the Moon in the 8th, Jupiter in the 3rd', 'He goes to the house of Yama.', [['Saturn', [1]], ['Moon', [8]], ['Jupiter', [3]]]),
  placed(9, 'one-month', [10], 'The Sun in the 9th, Saturn in the 7th, Jupiter and Venus in the 11th', 'He lives a month.', [['Sun', [9]], ['Saturn', [7]], ['Jupiter', [11]], ['Venus', [11]]]),
  rule(9, 'twelfth-house', [11], 'The Sun, Venus, the Moon or Rāhu in the 12th', 'They especially destroy, or break by their aspect. (All grahas in the 12th are unwanted.)', context => {
    const in12 = grahasInHouse(context, 12);
    const found = in12.filter(name => ['Sun', 'Venus', 'Moon', 'Rahu'].includes(name));
    return { met: found.length > 0, lines: [`In the 12th: ${mixed(in12)}`] };
  }),
  rule(9, 'moon-malefic-9-7-1', [12], 'The Moon with a malefic in the 9th, 7th or lagna, joined or seen by benefics', 'Death of the child. (As the verse has it.)', context => {
    const house = houseOf(context, 'Moon');
    const mal = withMalefics(context, 'Moon');
    const ben = [...context.planets.map(planet => planet.name).filter(name => isBenefic(context, name) && together(context, 'Moon', name) && name !== 'Moon'), ...beneficsSeeing(context, 'Moon')];
    return { met: has(house, [9, 7, 1]) && mal.length > 0 && ben.length > 0, lines: [`${where(context, 'Moon')}; with malefics: ${mixed(mal)}; benefics joining or aspecting: ${mixed([...new Set(ben)])}`] };
  }),
  rule(9, 'moon-malefics-kendras', [13], 'The Moon and malefics in kendras', 'Destruction. (The births in twilight, in the Moon\'s horā and at a gaṇḍānta, which the verse names first, are not tested.)', context => {
    const kendra = [1, 4, 7, 10];
    const mal = kendra.flatMap(house => maleficsIn(context, house));
    return { met: has(houseOf(context, 'Moon'), kendra) && mal.length > 0, lines: [`${where(context, 'Moon')}; malefics in kendras: ${mixed(mal)}`] };
  }),
  rule(9, 'malefics-2-6-8-12', [16], 'Malefics in the 2nd, 6th, 8th and 12th, the lagna between malefics', 'Certainly death.', context => {
    const rows = [2, 6, 8, 12].map(house => ({ house, found: maleficsIn(context, house) }));
    return { met: rows.every(row => row.found.length > 0), lines: [rows.map(row => `${ordinalEn(row.house)}: ${mixed(row.found)}`).join('; ')] };
  }),
  rule(9, 'malefics-lagna-7-moon', [17], 'Malefics in the lagna and the 7th, the Moon with malefics, not seen by benefics', 'Quick death.', context => {
    const m1 = maleficsIn(context, 1); const m7 = maleficsIn(context, 7); const with_ = withMalefics(context, 'Moon');
    const ben = beneficsSeeing(context, 'Moon');
    return { met: m1.length > 0 && m7.length > 0 && with_.length > 0 && ben.length === 0, lines: [`Malefics in the lagna: ${mixed(m1)}; in the 7th: ${mixed(m7)}; the Moon is with ${mixed(with_)}; benefics aspecting the Moon: ${mixed(ben)}`] };
  }),
  rule(9, 'waning-moon-lagna', [18], 'A waning Moon in the lagna, malefics in the kendras and the 8th', 'Death, without doubt. (Read: a malefic in a kendra other than the lagna, and a malefic in the 8th.)', context => {
    const waning = !moonWaxing(context);
    const kendra = [4, 7, 10].flatMap(house => maleficsIn(context, house)); const m8 = maleficsIn(context, 8);
    return { met: waning && houseOf(context, 'Moon') === 1 && kendra.length > 0 && m8.length > 0, lines: [`The Moon is ${waning ? 'waning' : 'waxing'}, ${where(context, 'Moon')}; malefics in the kendras: ${mixed(kendra)}; in the 8th: ${mixed(m8)}`] };
  }),
  rule(9, 'moon-hemmed', [19, 20], 'The Moon between two malefics in the lagna, 7th, 8th or 12th', 'The infant soon dies; with a malefic in the 7th or 8th as well (and the Moon in the lagna), it dies with its mother.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const hemmed = hemmedBy(context, moon.sign, MALEFIC(context), 'Moon');
    const house = houseOf(context, 'Moon');
    const mother = hemmed && house === 1 && (maleficsIn(context, 7).length > 0 || maleficsIn(context, 8).length > 0);
    return { met: hemmed && has(house, [1, 7, 8, 12]), lines: [`${where(context, 'Moon')}; between two malefics: ${hemmed ? 'yes' : 'no'}${mother ? '; with a malefic in the 7th or 8th: with the mother' : ''}`] };
  }),
  placed(9, 'saturn-12-sun-9-mars-8', [21], 'Saturn in the 12th, the Sun in the 9th, Mars in the 8th, not seen by benefics', 'Death.', [['Saturn', [12]], ['Sun', [9]], ['Mars', [8]]],
    context => { const ben = ['Saturn', 'Sun', 'Mars'].flatMap(name => beneficsSeeing(context, name)); return { ok: ben.length === 0, line: `benefics aspecting them: ${mixed([...new Set(ben)])}` }; }),
  rule(9, 'all-apoklima-weak', [23], 'All the grahas in the 3rd, 6th, 9th and 12th and without strength', 'A life of six months or two.', context => {
    const rows = SEVEN.map(name => ({ name, house: houseOf(context, name), strong: isStrong(context, name) }));
    if (rows.some(row => row.house === null || row.strong === null)) return cannot('A graha is missing or its strength is not known');
    return { met: rows.every(row => has(row.house, [3, 6, 9, 12]) && row.strong === false), lines: [rows.map(row => `${row.name} ${ordinalEn(row.house!)}${row.strong ? ' strong' : ''}`).join(', ')] };
  }),
  rule(9, 'moon-three-malefics', [24], 'The Moon seen by three malefics', 'Loss of the mother; seen by benefics, good is to be told.', context => {
    const mal = maleficsSeeing(context, 'Moon'); const ben = beneficsSeeing(context, 'Moon');
    return { met: mal.length >= 3, lines: [`Aspected by malefics: ${mixed(mal)}; by benefics: ${mixed(ben)}`] };
  }),
  placed(9, 'mother-after-father', [25], 'Rāhu, Mercury, Venus, Saturn and the Sun in the 2nd', 'The mother dies after the father.', [['Rahu', [2]], ['Mercury', [2]], ['Venus', [2]], ['Saturn', [2]], ['Sun', [2]]]),
  rule(9, 'matricide', [26], 'The Moon with a malefic, in the 7th or 8th from a malefic, seen by strong malefics', 'He becomes his mother\'s killer. (As the verse has it.)', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const from = context.planets.filter(planet => isMalefic(context, planet.name) && [7, 8].includes(((moon.sign - planet.sign + 12) % 12) + 1)).map(planet => planet.name);
    const strong = maleficsSeeing(context, 'Moon').filter(name => isStrong(context, name) === true);
    return { met: withMalefics(context, 'Moon').length > 0 && from.length > 0 && strong.length > 0, lines: [`The Moon is with ${mixed(withMalefics(context, 'Moon'))}; in the 7th or 8th from ${mixed(from)}; strong malefics aspecting: ${mixed(strong)}`] };
  }),
  rule(9, 'mother-4th-from-moon', [28], 'A malefic in the 4th from the Moon in an enemy sign, no benefic in a kendra', 'The mother is killed.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const fourth = ((moon.sign - 1 + 3) % 12) + 1;
    const found = context.planets.filter(planet => planet.sign === fourth && isMalefic(context, planet.name) && inEnemySign(planet.name, planet.sign)).map(planet => planet.name);
    const kendraBen = [1, 4, 7, 10].flatMap(house => beneficsIn(context, house));
    return { met: found.length > 0 && kendraBen.length === 0, lines: [`In the 4th from the Moon (${signName(fourth)}): malefics in an enemy sign: ${mixed(found)}; benefics in kendras: ${mixed(kendraBen)}`] };
  }),
  rule(9, 'danger-12-6-4-10', [29], 'Malefics in the 12th and 6th, or in the 4th or 10th', 'Danger to the mother (12th and 6th) or to the father (4th or 10th).', context => {
    const mother = maleficsIn(context, 12).length > 0 && maleficsIn(context, 6).length > 0;
    const father = maleficsIn(context, 4).length > 0 || maleficsIn(context, 10).length > 0;
    return { met: mother || father, lines: [`Malefics in the 12th: ${mixed(maleficsIn(context, 12))}, 6th: ${mixed(maleficsIn(context, 6))}; 4th: ${mixed(maleficsIn(context, 4))}, 10th: ${mixed(maleficsIn(context, 10))}${mother ? '; danger to the mother' : ''}${father ? '; danger to the father' : ''}`] };
  }),
  rule(9, 'family-destroyed', [30], 'Malefics in the lagna, 12th and 7th and a benefic in the 2nd', 'The family is destroyed.', context => {
    const found = [maleficsIn(context, 1), maleficsIn(context, 12), maleficsIn(context, 7), beneficsIn(context, 2)];
    return { met: found.every(list => list.length > 0), lines: [`Lagna: ${mixed(found[0])}; 12th: ${mixed(found[1])}; 7th: ${mixed(found[2])}; benefics in the 2nd: ${mixed(found[3])}`] };
  }),
  rule(9, 'mother-not-live', [31], 'Jupiter and Saturn in the lagna, Rāhu in the 2nd, a graha in the 3rd', 'His mother does not live.', context => {
    const in3 = grahasInHouse(context, 3);
    return { met: houseOf(context, 'Jupiter') === 1 && houseOf(context, 'Saturn') === 1 && houseOf(context, 'Rahu') === 2 && in3.length > 0, lines: [`${where(context, 'Jupiter')}; ${where(context, 'Saturn')}; ${where(context, 'Rahu')}; in the 3rd: ${mixed(in3)}`] };
  }),
  rule(9, 'mother-leaves', [32], 'Malefics without benefics in the trines from a weak Moon', 'The mother leaves the child within six months.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const weak = !moonWaxing(context) || isStrong(context, 'Moon') === false;
    const signs = [5, 9].map(count => ((moon.sign - 1 + count - 1) % 12) + 1);
    const mal = context.planets.filter(planet => signs.includes(planet.sign) && isMalefic(context, planet.name)).map(planet => planet.name);
    const ben = context.planets.filter(planet => signs.includes(planet.sign) && isBenefic(context, planet.name)).map(planet => planet.name);
    return { met: weak && mal.length > 0 && ben.length === 0, lines: [`The Moon is ${weak ? 'weak (waning or low in strength)' : 'not weak'}; in its trines: malefics ${mixed(mal)}, benefics ${mixed(ben)}`] };
  }),
  rule(9, 'two-mothers', [33], 'Saturn and Mars in one navāṁśa, or both in kendras from the Moon', 'One born of two mothers does not live.', context => {
    const saturn = find(context, 'Saturn'); const mars = find(context, 'Mars'); const moon = find(context, 'Moon');
    if (!saturn || !mars || !moon) return cannot('Saturn, Mars or the Moon is missing');
    const sameNav = navamshaSign(saturn.longitude) === navamshaSign(mars.longitude);
    const kendraOf = (sign: number) => [1, 4, 7, 10].includes(((sign - moon.sign + 12) % 12) + 1);
    const both = kendraOf(saturn.sign) && kendraOf(mars.sign);
    return { met: sameNav || both, lines: [`Saturn and Mars ${sameNav ? 'are' : 'are not'} in one navāṁśa; both in kendras from the Moon: ${both ? 'yes' : 'no'}`] };
  }),
  placed(9, 'father-not-survive', [34], 'Saturn in the lagna, Mars in the 7th, the Moon in the 6th', 'His father does not survive.', [['Saturn', [1]], ['Mars', [7]], ['Moon', [6]]]),
  placed(9, 'father-at-marriage', [35], 'Jupiter in the lagna, Saturn, the Sun, Mars and Mercury in the 2nd', 'The father dies at the child\'s marriage.', [['Jupiter', [1]], ['Saturn', [2]], ['Sun', [2]], ['Mars', [2]], ['Mercury', [2]]]),
  rule(9, 'sun-afflicted', [36], 'The Sun with a malefic, between two malefics, or a malefic in the 7th from it', 'The father dies.', context => {
    const sun = find(context, 'Sun');
    if (!sun) return cannot('The Sun is missing');
    const with_ = withMalefics(context, 'Sun'); const hemmed = hemmedBy(context, sun.sign, MALEFIC(context), 'Sun');
    const seventh = context.planets.filter(planet => planet.sign === ((sun.sign + 5) % 12) + 1 && isMalefic(context, planet.name)).map(planet => planet.name);
    return { met: with_.length > 0 || hemmed || seventh.length > 0, lines: [`The Sun is with ${mixed(with_)}; between two malefics: ${hemmed ? 'yes' : 'no'}; malefics in the 7th from it: ${mixed(seventh)}`] };
  }),
  placed(9, 'father-hardship', [37], 'The Sun in the 7th, Mars in the 10th, Rāhu in the 12th', 'The father lives in hardship.', [['Sun', [7]], ['Mars', [10]], ['Rahu', [12]]]),
  rule(9, 'mars-10th-enemy', [38], 'Mars in the 10th in an enemy sign', 'The father dies soon.', context => {
    const mars = find(context, 'Mars');
    if (!mars) return cannot('Mars is missing');
    return { met: houseOf(context, 'Mars') === 10 && inEnemySign('Mars', mars.sign), lines: [`${where(context, 'Mars')}, in ${signName(mars.sign)}`] };
  }),
  placed(9, 'father-not-live', [39], 'The Moon in the 6th, Saturn in the lagna, Mars in the 7th', 'His father does not survive.', [['Moon', [6]], ['Saturn', [1]], ['Mars', [7]]]),
  rule(9, 'parents-4-10-12', [41], 'Malefics in the 4th, 10th and 12th', 'Having lost both parents he wanders from land to land.', context => {
    const found = [4, 10, 12].map(house => maleficsIn(context, house));
    return { met: found.every(list => list.length > 0), lines: [`4th: ${mixed(found[0])}; 10th: ${mixed(found[1])}; 12th: ${mixed(found[2])}`] };
  }),
  rule(9, 'rahu-jupiter-23', [42], 'Rāhu and Jupiter together in the 6th, the lagna or the 4th', 'In the 23rd year the son does not see his father.', context => {
    const house = houseOf(context, 'Rahu');
    return { met: has(house, [6, 1, 4]) && houseOf(context, 'Jupiter') === house, lines: [`${where(context, 'Rahu')}; ${where(context, 'Jupiter')}`] };
  }),
  rule(9, 'father-sun-6-8-4', [44], 'Malefics without benefics in the 6th, 8th or 4th from the Sun', 'Danger to the father. (The same from the Moon: suffering of the mother, 9.45.)', context => {
    const sun = find(context, 'Sun'); const moon = find(context, 'Moon');
    if (!sun || !moon) return cannot('The Sun or the Moon is missing');
    const from = (sign: number) => [6, 8, 4].flatMap(count => context.planets.filter(planet => planet.sign === ((sign - 1 + count - 1) % 12) + 1));
    const check = (sign: number) => { const set = from(sign); return { mal: set.filter(planet => isMalefic(context, planet.name)).map(planet => planet.name), ben: set.filter(planet => isBenefic(context, planet.name)).map(planet => planet.name) }; };
    const s = check(sun.sign); const m = check(moon.sign);
    const father = s.mal.length > 0 && s.ben.length === 0; const mother = m.mal.length > 0 && m.ben.length === 0;
    return { met: father || mother, lines: [`From the Sun: malefics ${mixed(s.mal)}, benefics ${mixed(s.ben)}${father ? ' (danger to the father)' : ''}; from the Moon: malefics ${mixed(m.mal)}, benefics ${mixed(m.ben)}${mother ? ' (suffering of the mother)' : ''}`] };
  }),

  // ── chapter 10: the cancelling of ariṣṭa ──
  rule(10, 'benefic-kendra', [2], 'Mercury, Jupiter or Venus in a kendra', 'It destroys all ariṣṭa as the sun the darkness.', context => {
    const found = ['Mercury', 'Jupiter', 'Venus'].filter(name => has(houseOf(context, name), [1, 4, 7, 10]));
    return { met: found.length > 0, lines: [found.length ? `In a kendra: ${found.join(', ')}` : 'None of the three is in a kendra'] };
  }),
  rule(10, 'jupiter-lagna', [3], 'A strong Jupiter in the lagna', 'It destroys the whole mass of ariṣṭa.', context => {
    const strong = isStrong(context, 'Jupiter');
    if (strong === null) return cannot('The strength of Jupiter is not known');
    return { met: houseOf(context, 'Jupiter') === 1 && strong, lines: [`${where(context, 'Jupiter')}, ${strong ? 'strong' : 'not strong'}`] };
  }),
  rule(10, 'lagna-lord-kendra', [4], 'A strong lagna lord in a kendra', 'It destroys all ariṣṭa.', context => {
    const l1 = lord(context, 1); const strong = isStrong(context, l1);
    if (strong === null) return cannot(`The strength of the lagna lord ${l1} is not known`);
    return { met: has(houseOf(context, l1), [1, 4, 7, 10]) && strong, lines: [`${where(context, l1)}, ${strong ? 'strong' : 'not strong'}`] };
  }),
  rule(10, 'night-bright-half', [5], 'A night birth in the bright half or a day birth in the dark half, the lagna seen by benefics', 'The ariṣṭa is destroyed. (Night is read as the Sun in the 1st to 6th, below the horizon.)', context => {
    const sun = houseOf(context, 'Sun');
    if (sun === null) return cannot('The Sun is missing');
    const night = sun <= 6; const bright = moonWaxing(context);
    const ben = beneficsSeeingSign(context, context.ascendantSign);
    return { met: ((night && bright) || (!night && !bright)) && ben.length > 0, lines: [`${night ? 'Night' : 'Day'} birth (the Sun in the ${ordinalEn(sun)}), ${bright ? 'bright' : 'dark'} half; benefics aspecting the lagna: ${mixed(ben)}`] };
  }),
  rule(10, 'libra-sun-12', [6], 'A Libra lagna with the Sun in the 12th', 'A life of a hundred years.', context => ({ met: context.ascendantSign === 7 && houseOf(context, 'Sun') === 12, lines: [`The lagna is ${signName(context.ascendantSign)}; ${where(context, 'Sun')}`] })),
  rule(10, 'jupiter-mars', [7], 'Jupiter and Mars together, or Mars seen by Jupiter', 'The ariṣṭa is destroyed and good comes to the mother.', context => {
    const together_ = together(context, 'Jupiter', 'Mars'); const seen = sees(context, 'Jupiter', 'Mars');
    return { met: together_ || seen, lines: [together_ ? 'Jupiter and Mars are together' : seen ? 'Jupiter aspects Mars' : 'Jupiter and Mars are neither together nor in aspect'] };
  }),
  rule(10, 'malefics-between-benefics', [8, 9], 'Malefics between benefics, and benefics in the kendras and trikoṇas', 'The ariṣṭa is destroyed; malefics in the 4th and 10th between benefics bring the father happiness.', context => {
    const hemmed = context.planets.filter(planet => isMalefic(context, planet.name) && hemmedBy(context, planet.sign, BENEFIC(context), planet.name)).map(planet => planet.name);
    const strong = [1, 4, 7, 10, 5, 9].flatMap(house => beneficsIn(context, house));
    const fatherHouse = hemmed.filter(name => has(houseOf(context, name), [4, 10]));
    return { met: hemmed.length > 0 && strong.length > 0, lines: [`Malefics between two benefics: ${mixed(hemmed)}; benefics in kendras and trikoṇas: ${mixed(strong)}${fatherHouse.length ? `; in the 4th or 10th: ${fatherHouse.join(', ')}` : ''}`] };
  }),
];
