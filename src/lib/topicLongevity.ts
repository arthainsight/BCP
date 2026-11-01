import {
  aspectors, cannot, conjunctWith, debilitated, find, grahasInHouse, houseOf, isBenefic, isMalefic, isStrong, lordHouse, lordOfHouse, lordOfSign, ordinalEn,
  signName, signOf, signOfHouse, type RuleOutcome, type SevenGraha, type TopicContext, type TopicYogaRule,
} from './topicCore';
import { EXALTATION, NATURAL_FRIENDS } from './dignity';
import { navamshaSign } from './birthConditions';

/**
 * Longevity: Bṛhat Parāśara Horā Śāstra chapter 19 (the 8th house, "āyurbhāva-phala", 15 verses) and chapter 44 (the death-giving, māraka, combinations). The classical statements about the length of life and
 * about death are given as the text has them: they are a reading of the text, not a prediction. The daśā rules of 44 (4–9, 15–17, 19–20) and the Māndi are not judged.
 */
const rule = (chapter: number, id: string, verses: number[], name: string, effect: string, evaluate: (context: TopicContext) => RuleOutcome): TopicYogaRule =>
  ({ id, topic: 'longevity', chapter, verses, name, effect, evaluate });

const eighth = (context: TopicContext) => lordOfHouse(context, 8);
const lagnaLord = (context: TopicContext) => lordOfHouse(context, 1);
const where = (context: TopicContext, name: string) => { const house = houseOf(context, name); return house === null ? 'in no house' : `in the ${ordinalEn(house)}`; };
const KENDRA = [1, 4, 7, 10]; const TRIKONA = [1, 5, 9];
const grahaHouse = (context: TopicContext, house: number) => grahasInHouse(context, house);
const maleficsIn = (context: TopicContext, house: number) => grahaHouse(context, house).filter(name => isMalefic(context, name));
const lordWith = (context: TopicContext, name: string) => conjunctWith(context, name, other => isMalefic(context, other));

export const LONGEVITY_RULES: TopicYogaRule[] = [
  // ── chapter 19 ──
  rule(19, 'l8-kendra', [1], 'The 8th lord in a kendra', 'A long life.', context => {
    const house = lordHouse(context, 8);
    return house === null ? cannot('The 8th lord is missing') : { met: KENDRA.includes(house), lines: [`The 8th lord ${eighth(context)} is in the ${ordinalEn(house)}`] };
  }),
  rule(19, 'l8-in-8-malefics', [2], 'The 8th lord in the 8th with malefics, or the lagna lord there', 'A short life.', context => {
    const house = lordHouse(context, 8); const malefics = lordWith(context, eighth(context));
    const lagna = houseOf(context, lagnaLord(context));
    if (house === null) return cannot('The 8th lord is missing');
    return { met: (house === 8 && malefics.length > 0) || lagna === 8, lines: [`The 8th lord is in the ${ordinalEn(house)}, with ${malefics.join(', ') || 'no malefic'}; the lagna lord is ${where(context, lagnaLord(context))}`] };
  }),
  rule(19, 'dusthana-lords', [4], 'The 6th lord in the 6th or 12th, the 12th lord in the 6th or 12th, or either in the lagna or the 8th', 'A long life.', context => {
    const six = lordHouse(context, 6); const twelve = lordHouse(context, 12);
    if (six === null || twelve === null) return cannot('A lord is missing');
    const met = [6, 12].includes(six) || [6, 12].includes(twelve) || [1, 8].includes(six) || [1, 8].includes(twelve);
    return { met, lines: [`The 6th lord is in the ${ordinalEn(six)}, the 12th lord in the ${ordinalEn(twelve)}`] };
  }),
  rule(19, 'own-or-friend', [5], 'The lagna lord and the 8th lord in own sign, own navāṁśa or a friend\'s sign', 'A long life.', context => {
    const check = (name: string) => {
      const body = find(context, name);
      if (!body) return false;
      const ownSign = lordOfSign(body.sign) === name;
      const ownNavamsa = lordOfSign(navamshaSign(body.longitude)) === name;
      const friend = NATURAL_FRIENDS[name]?.includes(lordOfSign(body.sign)) === true;
      return ownSign || ownNavamsa || friend;
    };
    const a = lagnaLord(context); const b = eighth(context);
    return { met: check(a) && check(b), lines: [`The lagna lord ${a}: ${check(a) ? 'in own sign or navāṁśa or a friend\'s sign' : 'not'}; the 8th lord ${b}: ${check(b) ? 'yes' : 'not'}`] };
  }),
  rule(19, 'four-in-kendra-trikona', [6], 'The lagna lord, the 8th lord, the 10th lord and Saturn in kendras, trikoṇas or the 11th', 'A long life.', context => {
    const names = [lagnaLord(context), eighth(context), lordOfHouse(context, 10), 'Saturn'];
    const houses = names.map(name => houseOf(context, name));
    if (houses.some(house => house === null)) return cannot('A graha is missing');
    const good = [...KENDRA, ...TRIKONA, 11];
    return { met: houses.every(house => good.includes(house as number)), lines: [names.map((name, index) => `${name} in the ${ordinalEn(houses[index] as number)}`).join(', ')] };
  }),
  rule(19, 'l8-kendra-lagna-weak', [8], 'The 8th lord in a kendra, the lagna lord without strength', 'He lives twenty years, thirty-two at the most.', context => {
    const house = lordHouse(context, 8); const strong = isStrong(context, lagnaLord(context));
    if (house === null) return cannot('The 8th lord is missing');
    if (strong === null) return cannot(`The strength of ${lagnaLord(context)} is not known`);
    return { met: KENDRA.includes(house) && !strong, lines: [`The 8th lord is in the ${ordinalEn(house)}; the lagna lord ${lagnaLord(context)} is ${strong ? 'strong' : 'weak'}`] };
  }),
  rule(19, 'short-life', [9], 'The 8th lord debilitated, the 8th with malefics, the lagna lord weak', 'Certainly a short life.', context => {
    const lord = eighth(context); const sign = signOf(context, lord); const strong = isStrong(context, lagnaLord(context));
    if (sign === null) return cannot('The 8th lord is missing');
    if (strong === null) return cannot(`The strength of ${lagnaLord(context)} is not known`);
    const malefics = maleficsIn(context, 8);
    return { met: debilitated(lord, sign) && malefics.length > 0 && !strong, lines: [`The 8th lord ${lord} is ${debilitated(lord, sign) ? '' : 'not '}debilitated; malefics in the 8th: ${malefics.join(', ') || 'none'}; the lagna lord is ${strong ? 'strong' : 'weak'}`] };
  }),
  rule(19, 'death-at-birth', [10], 'The 8th lord with a malefic, the 8th with malefics, the 12th afflicted by malefics', 'Death soon after birth.', context => {
    const withMalefic = lordWith(context, eighth(context)); const in8 = maleficsIn(context, 8); const in12 = maleficsIn(context, 12);
    return { met: withMalefic.length > 0 && in8.length > 0 && in12.length > 0, lines: [`The 8th lord with ${withMalefic.join(', ') || 'no malefic'}; malefics in the 8th: ${in8.join(', ') || 'none'}; in the 12th: ${in12.join(', ') || 'none'}`] };
  }),
  rule(19, 'death-at-once', [11], 'Malefics in kendras and trikoṇas, benefics in the 6th and 8th, the debilitated 8th lord in the lagna', 'Death at once.', context => {
    const lord = eighth(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The 8th lord is missing');
    const good = [...KENDRA, ...TRIKONA];
    const malefics = good.flatMap(house => maleficsIn(context, house));
    const benefics68 = [6, 8].flatMap(house => grahaHouse(context, house).filter(name => isBenefic(context, name)));
    return { met: malefics.length > 0 && benefics68.length > 0 && houseOf(context, lord) === 1 && debilitated(lord, sign), lines: [`Malefics in kendras and trikoṇas: ${malefics.join(', ') || 'none'}; benefics in the 6th and 8th: ${benefics68.join(', ') || 'none'}; the 8th lord ${lord} is ${where(context, lord)}${debilitated(lord, sign) ? ', debilitated' : ''}`] };
  }),
  rule(19, 'very-short', [12], 'The 5th with a malefic, the 8th lord with a malefic, the 8th with malefics', 'A very short life.', context => {
    const in5 = maleficsIn(context, 5); const withMalefic = lordWith(context, eighth(context)); const in8 = maleficsIn(context, 8);
    return { met: in5.length > 0 && withMalefic.length > 0 && in8.length > 0, lines: [`Malefics in the 5th: ${in5.join(', ') || 'none'}; with the 8th lord: ${withMalefic.join(', ') || 'none'}; in the 8th: ${in8.join(', ') || 'none'}`] };
  }),
  rule(19, 'death-at-month-end', [13], 'The 8th lord in the 8th, the Moon with malefics and without a benefic aspect', 'Death at the end of a month.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const withMalefics = conjunctWith(context, 'Moon', name => isMalefic(context, name)); const benefic = aspectors(context, moon.sign, 'Moon').filter(name => isBenefic(context, name));
    return { met: lordHouse(context, 8) === 8 && withMalefics.length > 0 && benefic.length === 0, lines: [`The 8th lord is ${lordHouse(context, 8) === 8 ? '' : 'not '}in the 8th; the Moon is with ${withMalefics.join(', ') || 'no malefic'}, aspected by ${benefic.join(', ') || 'no benefic'}`] };
  }),
  rule(19, 'long-life-exalted', [14], 'The lagna lord exalted, the Moon in the 11th, Jupiter in the 8th', 'A long life, no doubt.', context => {
    const lord = lagnaLord(context); const sign = signOf(context, lord);
    if (sign === null) return cannot('The lagna lord is missing');
    return { met: EXALTATION[lord] === sign && houseOf(context, 'Moon') === 11 && houseOf(context, 'Jupiter') === 8, lines: [`The lagna lord ${lord} is in ${signName(sign)}${EXALTATION[lord] === sign ? ' (exalted)' : ''}; the Moon ${where(context, 'Moon')}; Jupiter ${where(context, 'Jupiter')}`] };
  }),
  rule(19, 'lagna-lord-strong-aspected', [15], 'The lagna lord very strong, aspected by benefics in kendras', 'A long life with wealth and every virtue. ("Very strong" is read as a Ṣaḍbala of 1.2 or more.)', context => {
    const lord = lagnaLord(context); const body = find(context, lord); const ratio = context.ratio[lord as SevenGraha];
    if (!body) return cannot('The lagna lord is missing');
    if (ratio === undefined) return cannot(`The strength of ${lord} is not known`);
    const seers = aspectors(context, body.sign, lord).filter(name => isBenefic(context, name) && KENDRA.includes(houseOf(context, name) ?? 0));
    return { met: ratio >= 1.2 && seers.length > 0, lines: [`The lagna lord ${lord} has a Ṣaḍbala of ${ratio.toFixed(2)}; aspected from kendras by ${seers.join(', ') || 'no benefic'}`] };
  }),
  // ── chapter 44 ──
  rule(44, 'marakas', [2, 3, 4], 'The death-giving (māraka) grahas', 'The lords of the 2nd and 7th, malefics in those houses or with those lords, and the malefic grahas are māraka; the 2nd is stronger than the 7th. In their daśās death may come.', context => {
    const l2 = lordOfHouse(context, 2); const l7 = lordOfHouse(context, 7);
    const set = new Set<string>([l2, l7]);
    for (const house of [2, 7]) for (const name of maleficsIn(context, house)) set.add(name);
    for (const lord of [l2, l7]) for (const name of lordWith(context, lord)) set.add(name);
    const list = [...set];
    return { met: list.length > 0, lines: [`Lord of the 2nd: ${l2}; lord of the 7th: ${l7}; with the malefics in those houses and with those lords: ${list.join(', ')}`] };
  }),
  rule(44, 'chief-maraka', [21], 'The chief death-giver is the strongest of the māraka', 'By its state, death or suffering. (Rāhu and Ketu have no Ṣaḍbala and are left out of the comparison.)', context => {
    const l2 = lordOfHouse(context, 2); const l7 = lordOfHouse(context, 7);
    const set = new Set<string>([l2, l7]);
    for (const house of [2, 7]) for (const name of maleficsIn(context, house)) set.add(name);
    const candidates = [...set].filter(name => context.ratio[name as SevenGraha] !== undefined) as SevenGraha[];
    if (candidates.length === 0) return cannot('No māraka with a known strength');
    const best = candidates.reduce((a, b) => ((context.ratio[b] ?? 0) > (context.ratio[a] ?? 0) ? b : a));
    return { met: true, lines: [`Of ${candidates.join(', ')} the strongest is ${best} (Ṣaḍbala ${(context.ratio[best] ?? 0).toFixed(2)})`] };
  }),
  rule(44, 'moon-2-12', [18], 'The lords of the 2nd and 12th from the Moon\'s sign', 'Māraka if malefic; if benefic they give disease.', context => {
    const moon = find(context, 'Moon');
    if (!moon) return cannot('The Moon is missing');
    const second = lordOfSign((moon.sign % 12) + 1); const twelfth = lordOfSign(((moon.sign + 10) % 12) + 1);
    const kind = (name: string) => (isMalefic(context, name) ? 'malefic: māraka' : isBenefic(context, name) ? 'benefic: disease' : 'neither');
    return { met: true, lines: [`The lord of the 2nd from the Moon is ${second} (${kind(second)}); of the 12th ${twelfth} (${kind(twelfth)})`] };
  }),
  rule(44, 'nodes-marakas', [22, 23, 24], 'Rāhu or Ketu in the lagna, 7th, 8th or 12th', 'A māraka even in its own daśā and antardaśā; with a Capricorn or Scorpio lagna Rāhu gives death; in the 6th, 8th or 12th troublesome unless joined or aspected by a benefic.', context => {
    const lines: string[] = [];
    let met = false;
    for (const node of ['Rahu', 'Ketu']) {
      const house = houseOf(context, node);
      if (house !== null && [1, 7, 8, 12].includes(house)) { met = true; lines.push(`${node} is in the ${ordinalEn(house)}: a māraka`); }
    }
    if (context.ascendantSign === 10 || context.ascendantSign === 8) { met = true; lines.push('The lagna is Capricorn or Scorpio: Rāhu gives death'); }
    if (lines.length === 0) lines.push('Rāhu and Ketu are not in the lagna, 7th, 8th or 12th');
    return { met, lines };
  }),
  rule(44, 'cause-3rd', [25, 26, 27, 29, 30, 31, 33], 'The kind of death by the grahas of the 3rd', 'The Sun: through the king; the Moon: consumption; Mars: wounds, weapons or fire; Saturn with Rāhu: poison, water or fire; Mercury: fever; Jupiter: swelling; Venus: urinary disease; many grahas: many diseases; Jupiter and Venus: in knowledge.', context => {
    const CAUSE: Record<string, string> = { Sun: 'through the king (25)', Moon: 'consumption (26)', Mars: 'wounds, weapons, fire, burns (26)', Mercury: 'fever (29–30)', Jupiter: 'swelling and the like (30)', Venus: 'urinary disease (31)' };
    const sign = signOfHouse(context, 3);
    const inThird = grahaHouse(context, 3); const seers = aspectors(context, sign);
    const all = [...new Set([...inThird, ...seers])];
    const lines = all.filter(name => CAUSE[name]).map(name => `${name} ${inThird.includes(name) ? 'in' : 'aspecting'} the 3rd: ${CAUSE[name]}`);
    if ((inThird.includes('Saturn') || seers.includes('Saturn')) && inThird.includes('Rahu')) lines.push('Saturn and Rāhu with or aspecting the 3rd: poison, water or fire (27)');
    if (all.includes('Jupiter') && all.includes('Venus')) lines.push('Jupiter and Venus with or aspecting the 3rd: death in knowledge (33)');
    if (all.length > 2) lines.push('Many grahas with the 3rd: many diseases (31)');
    return { met: lines.length > 0, lines: lines.length ? lines : ['No graha in the 3rd or aspecting it'] };
  }),
  rule(44, 'place-of-death', [34, 32], 'The place of death by the sign and the grahas of the 3rd', 'A movable sign: in a foreign land; fixed: at home; dual: on the road. With benefics an auspicious place, with malefics a base one, with a mixture an ordinary one.', context => {
    const sign = signOfHouse(context, 3);
    const kind = [1, 4, 7, 10].includes(sign) ? 'movable: in a foreign land' : [2, 5, 8, 11].includes(sign) ? 'fixed: at home' : 'dual: on the road';
    const inThird = grahaHouse(context, 3);
    const benefics = inThird.filter(name => isBenefic(context, name)); const malefics = inThird.filter(name => isMalefic(context, name));
    const place = benefics.length && malefics.length ? 'an ordinary place (mixed)' : benefics.length ? 'an auspicious place' : malefics.length ? 'a base place' : 'no graha in the 3rd';
    return { met: true, lines: [`The 3rd is ${signName(sign)}, ${kind}; ${place}`] };
  }),
  rule(44, 'cause-8th', [35, 36], 'The kind of death by the graha in the 8th', 'The Sun: fire; the Moon: water; Mars: a weapon; Mercury: fever; Jupiter: disease; Venus: hunger; Saturn: thirst.', context => {
    const CAUSE: Record<string, string> = { Sun: 'fire', Moon: 'water', Mars: 'a weapon', Mercury: 'fever', Jupiter: 'disease', Venus: 'hunger', Saturn: 'thirst' };
    const inEighth = grahaHouse(context, 8).filter(name => CAUSE[name]);
    return { met: inEighth.length > 0, lines: inEighth.length ? inEighth.map(name => `${name} in the 8th: ${CAUSE[name]}`) : ['No graha of the seven in the 8th'] };
  }),
];
