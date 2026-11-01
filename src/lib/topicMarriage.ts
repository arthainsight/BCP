import { navamshaSign } from './birthConditions';
import { EXALTATION } from './dignity';
import {
  aspectors, aspectsSign, cannot, conjunctWith, debilitated, find, fromGraha, grahasInHouse, houseOf, houseOfSign, inEnemySign, isBenefic, isMalefic, isStrong, lordHouse,
  lordOfHouse, lordOfSign, ordinalEn, ownOrExalted, signName, signOf, together, type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Marriage: Bṛhat Parāśara Horā Śāstra chapter 18, the 7th house ("jāyābhāva-phala"), 42 verses. The text speaks of a man and his wife; read for a woman's chart, the 7th house is the husband's and chapters 80 and 83 are the
 * ones for her. Where the text names a kind of sign it is read so: the signs of a benefic are those of Jupiter, Venus, Mercury and the Moon; "mandabha" the signs of Saturn; a eunuch sign (3.19: Mercury and Saturn are
 * the eunuchs) one of Mercury or Saturn. The ages are those of the text, in years of age.
 */
const rule = (id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'marriage', chapter: 18, verses, name, effect, evaluate });

const house7 = (context: TopicContext) => lordOfHouse(context, 7);
const BENEFIC_SIGN_LORDS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
const at = (context: TopicContext, name: string) => { const house = houseOf(context, name); return house === null ? 'missing' : `the ${ordinalEn(house)}`; };
/** Whether `name` stands in the `count`th sign from `from`. */
const nthFrom = (context: TopicContext, name: string, from: string, count: number) => { const target = fromGraha(context, from, count); return target !== null && signOf(context, name) === target; };
const kendra = (house: number | null) => house !== null && [1, 4, 7, 10].includes(house);

export const MARRIAGE_RULES: TopicYogaRule[] = [
  rule('own-or-exalted', [1], 'The 7th lord in its own or exaltation sign', 'Complete happiness from the wife.', context => {
    const lord = house7(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 7th lord is missing');
    return { met: ownOrExalted(lord, sign), lines: [`The 7th lord ${lord} is in ${signName(sign)}`] };
  }),
  rule('lord-dusthana', [2], 'The 7th lord in the 12th, 6th or 8th, not in own or exaltation sign', 'The wife is sickly.', context => {
    const lord = house7(context); const house = houseOf(context, lord); const sign = signOf(context, lord);
    if (house === null || sign === null) return cannot('The 7th lord is missing');
    return { met: [6, 8, 12].includes(house) && !ownOrExalted(lord, sign), lines: [`The 7th lord ${lord} is in the ${ordinalEn(house)} house, in ${signName(sign)}`] };
  }),
  rule('venus-in-7th', [3], 'Venus in the 7th', 'The man becomes very lustful.', context => {
    const house = houseOf(context, 'Venus');
    return { met: house === 7, lines: [`Venus is in ${house === null ? 'no house' : `the ${ordinalEn(house)}`}`] };
  }),
  rule('venus-with-malefic', [3], 'Venus conjoined with a malefic', 'The death of the wife. (The verse does not name the graha; it is read as Venus, the significator.)', context => {
    const found = conjunctWith(context, 'Venus', name => isMalefic(context, name));
    return { met: found.length > 0, lines: [found.length ? `Venus is with ${found.join(', ')}` : 'Venus is with no malefic'] };
  }),
  rule('lord-benefic-or-strong', [4], 'The 7th lord with or aspected by benefics, or strong', 'Wealthy, respected, with happiness and good fortune.', context => {
    const lord = house7(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 7th lord is missing');
    const with_ = conjunctWith(context, lord, name => isBenefic(context, name)); const seen = aspectors(context, sign, lord).filter(name => isBenefic(context, name)); const strong = isStrong(context, lord);
    const lines = [`The 7th lord ${lord}: with ${with_.join(', ') || 'no benefic'}; aspected by ${seen.join(', ') || 'no benefic'}; ${strong === null ? 'strength not known' : strong ? 'strong' : 'weak'}`];
    if (with_.length || seen.length || strong) return { met: true, lines };
    return { met: strong === null ? null : false, lines };
  }),
  rule('lord-weak', [5], 'The 7th lord debilitated, in an enemy sign, in the 7th, or weak', 'The wife is sickly and the man has many wives.', context => {
    const lord = house7(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 7th lord is missing');
    const why = [debilitated(lord, sign) && 'debilitated', inEnemySign(lord, sign) && 'in an enemy sign', houseOfSign(context, sign) === 7 && 'in the 7th house'].filter(Boolean) as string[];
    const strong = isStrong(context, lord);
    if (strong === false) why.push('weak');
    if (why.length) return { met: true, lines: [`The 7th lord ${lord} is ${why.join(', ')}`] };
    return { met: strong === null ? null : false, lines: [`The 7th lord ${lord} is none of these`] };
  }),
  rule('lord-saturn-venus-sign', [6], 'The 7th lord in a sign of Saturn or Venus and aspected by benefics', 'Many wives (the more if it is exalted).', context => {
    const lord = house7(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 7th lord is missing');
    const owner = lordOfSign(sign); const seen = aspectors(context, sign, lord).filter(name => isBenefic(context, name));
    return { met: (owner === 'Saturn' || owner === 'Venus') && seen.length > 0, lines: [`The 7th lord ${lord} is in a sign of ${owner}; aspected by ${seen.join(', ') || 'no benefic'}${EXALTATION[lord] === sign ? '; exalted' : ''}`] };
  }),
  rule('grahas-in-7th', [7, 8, 9], 'A graha in the 7th', 'The kind of wife: the Sun a barren woman, the Moon one of like standing, Mars a menstruating or a well-breasted one, Mercury a courtesan, a low-born or a merchant\'s woman, Jupiter a brahmin wife, Saturn, Rāhu and Ketu a low-born or menstruating woman, Saturn also disease and weakness.', context => {
    const names = grahasInHouse(context, 7);
    const KIND: Record<string, string> = {
      Sun: 'association with a barren woman', Moon: 'a wife of like standing', Mars: 'a menstruating woman, a well-breasted wife', Mercury: 'a courtesan, a low-born or a merchant\'s woman',
      Jupiter: 'a brahmin wife, association with a pregnant woman', Venus: 'very lustful', Saturn: 'a low-born or menstruating woman, a wife with disease and weakness', Rahu: 'a low-born or menstruating woman', Ketu: 'a low-born or menstruating woman',
    };
    return { met: names.length > 0, lines: names.length ? names.map(name => `${name} in the 7th: ${KIND[name] ?? 'no verse'}`) : ['No graha in the 7th'] };
  }),
  rule('saturn-mars-7th', [11], 'Saturn and Mars in the 7th, the 7th lord with both', 'Ruled by the wife, a cause of discord in the family.', context => {
    const lord = house7(context);
    const ok = houseOf(context, 'Saturn') === 7 && houseOf(context, 'Mars') === 7 && together(context, lord, 'Saturn') && together(context, lord, 'Mars');
    return { met: ok, lines: [`Saturn is in ${at(context, 'Saturn')}, Mars in ${at(context, 'Mars')}; the 7th lord is ${lord}`] };
  }),
  rule('venus-mars', [12, 13], 'Venus in a navāṁśa or sign of Mars', 'The wife is a prostitute or an adulteress; with the conjunction or aspect of Mars a further practice is named (13).', context => {
    const venus = find(context, 'Venus'); const mars = find(context, 'Mars');
    if (!venus || !mars) return cannot('Venus or Mars is missing');
    const inMars = lordOfSign(venus.sign) === 'Mars' || lordOfSign(navamshaSign(venus.longitude)) === 'Mars';
    const link = venus.sign === mars.sign || aspectsSign('Mars', mars.sign, venus.sign);
    return { met: inMars, lines: [`Venus is in ${signName(venus.sign)}, navāṁśa of ${lordOfSign(navamshaSign(venus.longitude))}${inMars && link ? '; with or aspected by Mars (13)' : ''}`] };
  }),
  rule('venus-saturn', [13, 14], 'Venus in a navāṁśa or sign of Saturn', 'With the conjunction or aspect of Saturn, a practice is named (14).', context => {
    const venus = find(context, 'Venus'); const saturn = find(context, 'Saturn');
    if (!venus || !saturn) return cannot('Venus or Saturn is missing');
    const inSaturn = lordOfSign(venus.sign) === 'Saturn' || lordOfSign(navamshaSign(venus.longitude)) === 'Saturn';
    const link = venus.sign === saturn.sign || aspectsSign('Saturn', saturn.sign, venus.sign);
    return { met: inSaturn && link, lines: [`Venus is in ${signName(venus.sign)}, navāṁśa of ${lordOfSign(navamshaSign(venus.longitude))}; ${link ? 'with or aspected by Saturn' : 'not with or aspected by Saturn'}`] };
  }),
  rule('lagna-lord-in-7th', [15], 'The lagna lord strong and in the 7th', 'The wife has good qualities and the line of sons and grandsons grows.', context => {
    const lord = lordOfHouse(context, 1); const strong = isStrong(context, lord); const house = houseOf(context, lord);
    if (house === null) return cannot('The lagna lord is missing');
    if (strong === null) return cannot(`The strength of ${lord} is not known`);
    return { met: strong && house === 7, lines: [`The lagna lord ${lord} is ${strong ? 'strong' : 'weak'} and in the ${ordinalEn(house)}`] };
  }),
  rule('house-or-lord-with-malefic', [16], 'The 7th, or its lord, with a malefic', 'Loss of the wife, above all when weak.', context => {
    const lord = house7(context);
    const inSeventh = grahasInHouse(context, 7).filter(name => isMalefic(context, name));
    const withLord = conjunctWith(context, lord, name => isMalefic(context, name));
    const strong = isStrong(context, lord);
    return { met: inSeventh.length > 0 || withLord.length > 0, lines: [`Malefics in the 7th: ${inSeventh.join(', ') || 'none'}; with the 7th lord ${lord}: ${withLord.join(', ') || 'none'}${strong === false ? '; the lord is weak' : ''}`] };
  }),
  rule('lord-weak-dusthana', [17], 'A weak 7th lord in the 6th, 8th or 12th, or in its debilitation', 'Loss of the wife.', context => {
    const lord = house7(context); const house = houseOf(context, lord); const sign = signOf(context, lord); const strong = isStrong(context, lord);
    if (house === null || sign === null) return cannot('The 7th lord is missing');
    if (strong === null) return cannot(`The strength of ${lord} is not known`);
    return { met: (strong === false && [6, 8, 12].includes(house)) || debilitated(lord, sign), lines: [`The 7th lord ${lord} is ${strong ? 'strong' : 'weak'}, in the ${ordinalEn(house)}, in ${signName(sign)}`] };
  }),
  rule('moon-7th-lord-12th', [18], 'The Moon in the 7th, the 7th lord in the 12th, Venus weak', 'No happiness in marriage.', context => {
    const strong = isStrong(context, 'Venus');
    if (strong === null) return cannot('The strength of Venus is not known');
    return { met: houseOf(context, 'Moon') === 7 && lordHouse(context, 7) === 12 && !strong, lines: [`The Moon is in ${at(context, 'Moon')}, the 7th lord in ${lordHouse(context, 7) === null ? 'no house' : `the ${ordinalEn(lordHouse(context, 7)!)}`}, Venus is ${strong ? 'strong' : 'weak'}`] };
  }),
  rule('two-wives', [19], 'The 7th lord debilitated, in a malefic\'s sign or with a malefic, the 7th in a eunuch sign', 'Two wives. (A eunuch sign is one of Mercury or Saturn, 3.19; the navāṁśa half of the verse is not judged.)', context => {
    const lord = house7(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 7th lord is missing');
    const owner = lordOfSign(sign);
    const first = debilitated(lord, sign) || ['Sun', 'Mars', 'Saturn'].includes(owner) || conjunctWith(context, lord, name => isMalefic(context, name)).length > 0;
    const seventhOwner = lordOfSign(((context.ascendantSign - 1 + 6) % 12) + 1);
    return { met: first && (seventhOwner === 'Mercury' || seventhOwner === 'Saturn'), lines: [`The 7th lord ${lord} is in ${signName(sign)}; the 7th sign is of ${seventhOwner}`] };
  }),
  rule('three-wives', [20], 'Mars in the 7th, Venus and Saturn in the 11th, the lagna lord in the 8th', 'Three wives.', context => ({
    met: houseOf(context, 'Mars') === 7 && houseOf(context, 'Venus') === 11 && houseOf(context, 'Saturn') === 11 && lordHouse(context, 1) === 8,
    lines: [`Mars is in ${at(context, 'Mars')}, Venus in ${at(context, 'Venus')}, Saturn in ${at(context, 'Saturn')}; the lagna lord in ${lordHouse(context, 1) === null ? 'no house' : `the ${ordinalEn(lordHouse(context, 1)!)}`}`],
  })),
  rule('venus-exalted-dual', [21], 'Venus exalted in a dual sign (Pisces), its lord and the 7th lord strong', 'Many wives.', context => {
    const jupiter = isStrong(context, 'Jupiter'); const lord = isStrong(context, house7(context));
    if (jupiter === null || lord === null) return cannot('A strength is not known');
    return { met: signOf(context, 'Venus') === 12 && jupiter && lord, lines: [`Venus is in ${signOf(context, 'Venus') === null ? 'no sign' : signName(signOf(context, 'Venus')!)}; Jupiter is ${jupiter ? 'strong' : 'weak'}, the 7th lord ${lord ? 'strong' : 'weak'}`] };
  }),
  // The year of marriage.
  rule('age-5-9', [22], 'The 7th lord in a sign of a benefic, Venus in own or exaltation sign', 'Marriage mostly in the 5th or 9th year.', context => {
    const lord = house7(context); const sign = signOf(context, lord); const venus = signOf(context, 'Venus');
    if (sign === null || venus === null) return cannot('A graha is missing');
    return { met: BENEFIC_SIGN_LORDS.includes(lordOfSign(sign)) && ownOrExalted('Venus', venus), lines: [`The 7th lord is in a sign of ${lordOfSign(sign)}; Venus is in ${signName(venus)}`] };
  }),
  rule('age-7-11', [23], 'The Sun in the 7th, the 7th lord with Venus', 'Marriage mostly in the 7th or 11th year.', context => ({
    met: houseOf(context, 'Sun') === 7 && (house7(context) === 'Venus' || together(context, house7(context), 'Venus')), lines: [`The Sun is in ${at(context, 'Sun')}; the 7th lord ${house7(context)} ${together(context, house7(context), 'Venus') || house7(context) === 'Venus' ? 'is' : 'is not'} with Venus`],
  })),
  rule('age-10-16', [24], 'Venus in the 2nd, the 7th lord in the 11th', 'Marriage mostly in the 10th or 16th year.', context => ({
    met: houseOf(context, 'Venus') === 2 && lordHouse(context, 7) === 11, lines: [`Venus is in ${at(context, 'Venus')}; the 7th lord is in house ${lordHouse(context, 7) ?? '—'}`],
  })),
  rule('age-11', [25], 'Venus in a kendra, the lagna lord in a sign of Saturn', 'Marriage in the 11th year.', context => {
    const sign = signOf(context, lordOfHouse(context, 1));
    return { met: kendra(houseOf(context, 'Venus')) && sign !== null && lordOfSign(sign) === 'Saturn', lines: [`Venus is in ${at(context, 'Venus')}; the lagna lord is in a sign of ${sign === null ? '—' : lordOfSign(sign)}`] };
  }),
  rule('age-12-19', [26], 'Venus in a kendra, Saturn in the 7th from Venus', 'Marriage mostly in the 12th or 19th year.', context => ({
    met: kendra(houseOf(context, 'Venus')) && nthFrom(context, 'Saturn', 'Venus', 7), lines: [`Venus is in ${at(context, 'Venus')}; Saturn is ${nthFrom(context, 'Saturn', 'Venus', 7) ? '' : 'not '}in the 7th from Venus`],
  })),
  rule('age-18', [27], 'Venus in the 7th from the Moon, Saturn in the 7th from Venus', 'Marriage in the 18th year.', context => ({
    met: nthFrom(context, 'Venus', 'Moon', 7) && nthFrom(context, 'Saturn', 'Venus', 7), lines: [`Venus is ${nthFrom(context, 'Venus', 'Moon', 7) ? '' : 'not '}in the 7th from the Moon; Saturn is ${nthFrom(context, 'Saturn', 'Venus', 7) ? '' : 'not '}in the 7th from Venus`],
  })),
  rule('age-15', [28], 'The 2nd lord in the 11th, the lagna lord in the 10th', 'Marriage in the 15th year.', context => ({
    met: lordHouse(context, 2) === 11 && lordHouse(context, 1) === 10, lines: [`The 2nd lord is in house ${lordHouse(context, 2) ?? '—'}, the lagna lord in house ${lordHouse(context, 1) ?? '—'}`],
  })),
  rule('age-13', [29], 'The 2nd lord in the 11th, the 11th lord in the 2nd', 'Marriage in the 13th year.', context => ({
    met: lordHouse(context, 2) === 11 && lordHouse(context, 11) === 2, lines: [`The 2nd lord is in house ${lordHouse(context, 2) ?? '—'}, the 11th lord in house ${lordHouse(context, 11) ?? '—'}`],
  })),
  rule('age-22-27', [30], 'Venus in the 2nd, the 2nd lord with Mars', 'Marriage in the 22nd or 27th year.', context => {
    const lord = lordOfHouse(context, 2);
    return { met: houseOf(context, 'Venus') === 2 && (lord === 'Mars' || together(context, lord, 'Mars')), lines: [`Venus is in ${at(context, 'Venus')}; the 2nd lord ${lord} is ${lord === 'Mars' || together(context, lord, 'Mars') ? '' : 'not '}with Mars`] };
  }),
  rule('loss-18-33', [35], 'The 7th lord debilitated, Venus with the lord of the 8th or 6th', 'Loss of the wife in the 18th or 33rd year.', context => {
    const lord = house7(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 7th lord is missing');
    const l6 = lordOfHouse(context, 6); const l8 = lordOfHouse(context, 8);
    const with68 = [l6, l8].some(name => name === 'Venus' || together(context, 'Venus', name));
    return { met: debilitated(lord, sign) && with68, lines: [`The 7th lord ${lord} is ${debilitated(lord, sign) ? '' : 'not '}debilitated; Venus is ${with68 ? '' : 'not '}with the lord of the 6th (${l6}) or the 8th (${l8})`] };
  }),
  rule('loss-19', [36], 'The 7th lord in the 8th, the 12th lord in the 7th', 'Loss of the wife in the 19th year.', context => ({
    met: lordHouse(context, 7) === 8 && lordHouse(context, 12) === 7, lines: [`The 7th lord is in house ${lordHouse(context, 7) ?? '—'}, the 12th lord in house ${lordHouse(context, 12) ?? '—'}`],
  })),
  rule('bride-snake', [37], 'Rāhu in the 2nd, the 7th with Mars', 'The bride dies of a snake bite on the third day after the wedding.', context => ({
    met: houseOf(context, 'Rahu') === 2 && houseOf(context, 'Mars') === 7, lines: [`Rāhu is in ${at(context, 'Rahu')}, Mars in ${at(context, 'Mars')}`],
  })),
  rule('loss-12-19', [38], 'Venus in the 8th, the 8th lord in a sign of Saturn', 'Loss of the wife in the 12th or 19th year.', context => {
    const sign = signOf(context, lordOfHouse(context, 8));
    return { met: houseOf(context, 'Venus') === 8 && sign !== null && lordOfSign(sign) === 'Saturn', lines: [`Venus is in ${at(context, 'Venus')}; the 8th lord is in a sign of ${sign === null ? '—' : lordOfSign(sign)}`] };
  }),
  rule('loss-13', [39], 'The lagna lord debilitated, the 2nd lord in the 8th', 'The wife dies in the 13th year.', context => {
    const lord = lordOfHouse(context, 1); const sign = signOf(context, lord);
    return { met: sign !== null && debilitated(lord, sign) && lordHouse(context, 2) === 8, lines: [`The lagna lord ${lord} is ${sign !== null && debilitated(lord, sign) ? '' : 'not '}debilitated; the 2nd lord is in house ${lordHouse(context, 2) ?? '—'}`] };
  }),
  rule('three-marriages', [40, 41], 'The Moon in the 7th from Venus, Mercury in the 7th from the Moon, the 8th lord in the 5th', 'Three marriages: in the 10th, the 22nd and the 33rd year.', context => ({
    met: nthFrom(context, 'Moon', 'Venus', 7) && nthFrom(context, 'Mercury', 'Moon', 7) && lordHouse(context, 8) === 5,
    lines: [`The Moon is ${nthFrom(context, 'Moon', 'Venus', 7) ? '' : 'not '}in the 7th from Venus; Mercury is ${nthFrom(context, 'Mercury', 'Moon', 7) ? '' : 'not '}in the 7th from the Moon; the 8th lord is in house ${lordHouse(context, 8) ?? '—'}`],
  })),
  rule('wife-not-living', [42], 'Mars in the 6th, Rāhu in the 7th, Saturn in the 8th', 'His wife does not live.', context => ({
    met: houseOf(context, 'Mars') === 6 && houseOf(context, 'Rahu') === 7 && houseOf(context, 'Saturn') === 8, lines: [`Mars is in ${at(context, 'Mars')}, Rāhu in ${at(context, 'Rahu')}, Saturn in ${at(context, 'Saturn')}`],
  })),
];
