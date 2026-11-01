import { combustionOf } from './combustion';
import { navamshaSign } from './birthConditions';
import { DEBILITATION, EXALTATION, NATURAL_ENEMIES, OWN_SIGNS } from './dignity';
import { hemmed, yes, type Cond } from './topicChildren';
import {
  SEVEN, find, grahasInHouse, houseOf, isBenefic, isMalefic, isStrong, lordOfSign, ordinalEn, sees, seesSign, signOf, signOfHouse, together,
  type RuleOutcome, type SevenGraha, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Chapter 16 of the Phaladīpikā of Mantreśvara (the twelve houses together, bhāva-samudāya, 35 verses): what the lord and the occupants of each house say about the body, wealth, brothers, mother, home, mind, enemies, wife, life, father, work, gain and loss.
 * Readings: "malefic" and "benefic" as in the other topics; "strong" is a Ṣaḍbala of 1 or more, and "stronger than" compares the two Ṣaḍbala values; "well placed" (suṣṭhāna) is a kendra or a trine; "evil house" is the 6th, 8th or 12th; "joined" is in one sign;
 * "touched by a benefic" is a benefic in the sign or seeing it; the day birth of 16.23 is the Sun in the 7th to the 12th house; in 16.5 "joined to the Sun" is read as the 2nd lord with the Sun in one sign; in 16.15 the special division (vaiśeṣikāṁśa) is not tried.
 * Not judged: 16.1 (the body and the complexion by the navāṁśa lord and the parts of Kālapuruṣa), 16.12 (the method for the father, brothers and sons), 16.31-35 (the times of the results, which need the transits and the daśās).
 */
const rule = (id: string, verses: number[], name: string, effect: string, rows: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p16-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 16, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = rows(c);
    const met = list.some(([, v]) => v === false) ? false : list.some(([, v]) => v === null) ? null : true;
    return { met, lines: [list.map(([label, v]) => `${label}: ${yes(v)}`).join('; ')] };
  },
});
const either = (id: string, verses: number[], name: string, effect: string, parts: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p16-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 16, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = parts(c);
    const met = list.some(([, v]) => v === true) ? true : list.some(([, v]) => v === null) ? null : false;
    return { met, lines: list.map(([label, v]) => `${label}: ${yes(v)}`) };
  },
});
const L = (c: TopicContext, house: number) => lordOfSign(signOfHouse(c, house));
const at = (c: TopicContext, name: string, houses: number[]) => { const h = houseOf(c, name); return h !== null && houses.includes(h); };
const GOOD = [1, 4, 7, 10, 5, 9]; const EVIL = [6, 8, 12]; const KENDRA = [1, 4, 7, 10];
const ratio = (c: TopicContext, name: string): number | null => c.ratio[name as SevenGraha] ?? null;
const stronger = (c: TopicContext, a: string, b: string): boolean | null => { const x = ratio(c, a); const y = ratio(c, b); return x === null || y === null ? null : x > y; };
const combust = (c: TopicContext, name: string) => { const body = find(c, name); const sun = find(c, 'Sun'); return Boolean(body && sun && name !== 'Sun' && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null); };
const withBenefic = (c: TopicContext, name: string) => c.planets.some(p => p.name !== name && isBenefic(c, p.name) && together(c, name, p.name));
const withMalefic = (c: TopicContext, name: string) => c.planets.some(p => p.name !== name && isMalefic(c, p.name) && together(c, name, p.name));
const touchedBy = (c: TopicContext, name: string, test: (other: string) => boolean) => c.planets.some(p => p.name !== name && test(p.name) && (together(c, name, p.name) || ((SEVEN as readonly string[]).includes(p.name) && sees(c, p.name, name))));
const houseTouchedBy = (c: TopicContext, house: number, test: (other: string) => boolean) => grahasInHouse(c, house).some(test) || SEVEN.some(name => test(name) && seesSign(c, name, signOfHouse(c, house)));
const badSign = (c: TopicContext, name: string) => { const sign = signOf(c, name); return sign !== null && (DEBILITATION[name] === sign || NATURAL_ENEMIES[name]?.includes(lordOfSign(sign)) === true || (['Sun', 'Mars', 'Saturn'].includes(lordOfSign(sign)) && lordOfSign(sign) !== name)); };
const ownOrExalted = (c: TopicContext, name: string) => { const sign = signOf(c, name); return sign !== null && (EXALTATION[name] === sign || OWN_SIGNS[name]?.includes(sign) === true); };
const odd = (sign: number | null) => sign !== null && sign % 2 === 1;
const nav = (c: TopicContext, name: string) => { const p = find(c, name); return p ? navamshaSign(p.longitude) : null; };

export const PHALA_SAMUDAYA_RULES: TopicYogaRule[] = [
  rule('lagna-lord-fortune', [2], 'The lagna lord in a kendra or trine, not combust, in its exaltation or own sign; the 8th lord with benefics away from the kendras; a benefic in the lagna', 'Long-lived, rich, praised by kings, handsome, strong, fearless, righteous, with a good family.', c => [
    ['the lagna lord in a kendra or trine', at(c, L(c, 1), GOOD)], ['not combust', !combust(c, L(c, 1))], ['in its exaltation or own sign', ownOrExalted(c, L(c, 1))],
    ['the 8th lord with a benefic, outside the kendras', withBenefic(c, L(c, 8)) && !at(c, L(c, 8), KENDRA)], ['a benefic in the lagna', grahasInHouse(c, 1).some(n => isBenefic(c, n))],
  ]),
  {
    id: 'p16-lagna-lord-place', topic: 'phalaHouses', text: 'phala', chapter: 16, verses: [3], name: 'The lagna lord with benefics or a strong graha, exalted, in its own sign, or in a movable, fixed or dual sign',
    effect: 'With benefics: a home in a good village; with a strong graha: famous, with a king\'s protection; exalted: a king; in its own sign: he stays in his birthplace; movable: he roams; fixed: he stays; dual: both.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const name = L(c, 1); const sign = signOf(c, name);
      if (sign === null) return { met: null, lines: ['The lagna lord is missing'] };
      const strongMate = c.planets.some(p => p.name !== name && together(c, name, p.name) && isStrong(c, p.name) === true);
      const lines = [withBenefic(c, name) ? 'with benefics: a good village' : '', strongMate ? 'with a strong graha: famous, a king\'s protection' : '', EXALTATION[name] === sign ? 'exalted: a king' : '', OWN_SIGNS[name]?.includes(sign) ? 'in its own sign: stays in his birthplace' : '',
        [1, 4, 7, 10].includes(sign) ? 'in a movable sign: he roams' : [2, 5, 8, 11].includes(sign) ? 'in a fixed sign: he stays' : 'in a dual sign: both'].filter(Boolean);
      return { met: true, lines: [`the lagna lord ${name}: ${lines.join('; ')}`] };
    },
  },
  rule('lagna-lord-good', [4], 'The lagna lord not combust and in a kendra or trine', 'Famous, happy and growing.', c => [['the lagna lord not combust', !combust(c, L(c, 1))], ['in a kendra or trine', at(c, L(c, 1), GOOD)]]),
  either('lagna-lord-bad', [4], 'The lagna lord in an evil house, or in a malefic\'s, enemy\'s or fallen sign', 'Unhappy, living in a low place.', c => [['in the 6th, 8th or 12th', at(c, L(c, 1), EVIL)], ['in a sign of a malefic, an enemy or its fall', badSign(c, L(c, 1))]]),
  rule('2nd-lord-lagna', [5], 'The 2nd lord in the lagna with benefics', 'A family of fortune, the best qualities, wealth, a pleasant face and foresight.', c => [['the 2nd lord in the lagna', at(c, L(c, 2), [1])], ['with a benefic', withBenefic(c, L(c, 2))]]),
  rule('lagna-lord-2nd', [5], 'The lagna lord strong in the 2nd', 'Wealth.', c => [['the lagna lord in the 2nd', at(c, L(c, 1), [2])], ['strong', isStrong(c, L(c, 1))]]),
  either('2nd-lord-sun-saturn', [5], 'The 2nd lord with the Sun, or with Saturn', 'The Sun: learning and wealth that serve the world; Saturn: fond of petty and little learning.', c => [
    ['the 2nd lord with the Sun', L(c, 2) !== 'Sun' && together(c, L(c, 2), 'Sun')], ['the 2nd lord with Saturn', L(c, 2) !== 'Saturn' && together(c, L(c, 2), 'Saturn')],
  ]),
  {
    id: 'p16-2nd-lord-company', topic: 'phalaHouses', text: 'phala', chapter: 16, verses: [6], name: 'The 2nd lord with Jupiter, Mercury, Venus, the Moon, Mars, Rāhu or Ketu; the nodes or malefics in the 2nd',
    effect: 'Jupiter: skilled in the Veda and the law; Mercury: in the science of wealth; Venus: in amorous speech; the Moon: some skill in the arts; Mars: cruel and a slanderer; Rāhu: a stammerer; Ketu: halting speech; malefics in the 2nd: a fool without wealth.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const lord = L(c, 2); const with_ = (n: string) => n !== lord && together(c, lord, n);
      const found = [with_('Jupiter') ? 'Jupiter: the Veda and the law' : '', with_('Mercury') ? 'Mercury: the science of wealth' : '', with_('Venus') ? 'Venus: amorous speech' : '', with_('Moon') ? 'the Moon: the arts' : '', with_('Mars') ? 'Mars: cruel, a slanderer' : '',
        with_('Rahu') || at(c, 'Rahu', [2]) ? 'Rāhu: a stammerer' : '', with_('Ketu') || at(c, 'Ketu', [2]) ? 'Ketu: halting speech' : '', grahasInHouse(c, 2).some(n => isMalefic(c, n)) ? 'malefics in the 2nd: a fool without wealth' : ''].filter(Boolean);
      return { met: found.length > 0, lines: [found.join('; ') || `the 2nd lord ${lord} is with none of these`] };
    },
  },
  rule('3rd-exchange', [7], 'The lords of the lagna and the 3rd, strong, in each other\'s signs', 'Steadfast, brave, kind to his brothers and able in daring deeds.', c => {
    const a = L(c, 1); const b = L(c, 3);
    return [['the lords in each other\'s signs', a !== b && signOf(c, a) === signOfHouse(c, 3) && signOf(c, b) === signOfHouse(c, 1)], ['both strong', isStrong(c, a) === null || isStrong(c, b) === null ? null : isStrong(c, a) === true && isStrong(c, b) === true]];
  }),
  rule('brothers-grow', [8], 'The 3rd lord and Mars strong, with benefics and in good houses', 'His brothers grow in number.', c => [
    ['the 3rd lord strong', isStrong(c, L(c, 3))], ['with a benefic', withBenefic(c, L(c, 3))], ['Mars strong', isStrong(c, 'Mars')], ['with a benefic', withBenefic(c, 'Mars')], ['Mars in a good house', at(c, 'Mars', GOOD)],
  ]),
  rule('brothers-lost', [8], 'The 3rd lord and Mars weak, in evil houses and with malefics', 'His brothers are lost.', c => [
    ['the 3rd lord weak', isStrong(c, L(c, 3)) === null ? null : isStrong(c, L(c, 3)) === false], ['in an evil house', at(c, L(c, 3), EVIL)], ['with a malefic', withMalefic(c, L(c, 3))],
    ['Mars weak', isStrong(c, 'Mars') === null ? null : isStrong(c, 'Mars') === false], ['in an evil house', at(c, 'Mars', EVIL)],
  ]),
  rule('brothers-male', [9], 'The 3rd lord and Mars in odd signs, seen by Jupiter, the Sun and Mars, the 3rd odd', 'The brothers are men.', c => [
    ['the 3rd lord in an odd sign', odd(signOf(c, L(c, 3)))], ['Mars in an odd sign', odd(signOf(c, 'Mars'))], ['the 3rd an odd sign', odd(signOfHouse(c, 3))],
    ['seen by Jupiter, the Sun or Mars', ['Jupiter', 'Sun', 'Mars'].some(n => n !== L(c, 3) && sees(c, n, L(c, 3)))],
  ]),
  rule('mother-lost', [10], 'The 4th lord and the Moon in evil houses, unaided by benefics, between malefics or with malefics', 'The mother\'s death.', c => [
    ['the 4th lord and the Moon in the 6th, 8th or 12th', at(c, L(c, 4), EVIL) && at(c, 'Moon', EVIL)], ['neither joined nor seen by a benefic', !touchedBy(c, L(c, 4), n => isBenefic(c, n)) && !touchedBy(c, 'Moon', n => isBenefic(c, n))],
    ['with or between malefics', withMalefic(c, L(c, 4)) || withMalefic(c, 'Moon') || hemmed(c, signOf(c, 'Moon') ?? 0) || hemmed(c, signOf(c, L(c, 4)) ?? 0)],
  ]),
  rule('mother-happy', [10], 'The 4th lord and the Moon strong, with benefics, benefics in the 4th', 'The mother is happy.', c => [
    ['the 4th lord and the Moon strong', isStrong(c, L(c, 4)) === null || isStrong(c, 'Moon') === null ? null : isStrong(c, L(c, 4)) === true && isStrong(c, 'Moon') === true], ['joined or seen by benefics', touchedBy(c, L(c, 4), n => isBenefic(c, n)) && touchedBy(c, 'Moon', n => isBenefic(c, n))],
    ['a benefic in the 4th', grahasInHouse(c, 4).some(n => isBenefic(c, n))],
  ]),
  rule('last-rites', [11], 'The lagna lord in the 4th or the 4th lord in the lagna, joined or seen by the Moon', 'He does his mother\'s last rites.', c => [
    ['the lagna lord in the 4th or the 4th lord in the lagna', at(c, L(c, 1), [4]) || at(c, L(c, 4), [1])], ['joined or seen by the Moon', [L(c, 1), L(c, 4)].some(n => n !== 'Moon' && (together(c, n, 'Moon') || sees(c, 'Moon', n)))],
  ]),
  rule('no-last-rites', [11], 'The lagna lord and the 4th lord in each other\'s enemy or fallen sign, or in the 6th and 8th, unconnected', 'He is no help to his mother at her death.', c => {
    const a = L(c, 1); const b = L(c, 4); const sa = signOf(c, a); const sb = signOf(c, b);
    const hostile = sa !== null && sb !== null && (NATURAL_ENEMIES[a]?.includes(lordOfSign(sb)) === true || DEBILITATION[a] === sb) && (NATURAL_ENEMIES[b]?.includes(lordOfSign(sa)) === true || DEBILITATION[b] === sa);
    const sixEight = (at(c, a, [6]) && at(c, b, [8])) || (at(c, a, [8]) && at(c, b, [6]));
    return [['in each other\'s enemy or fallen sign, or in the 6th and 8th', hostile || sixEight], ['not connected', a !== b && !together(c, a, b) && !sees(c, a, b) && !sees(c, b, a)]];
  }),
  rule('4th-venus', [13], 'The 4th lord in the lagna and Venus in the 4th, or both in kendras or trines', 'A palanquin, lordship over men, gold, jewels, ornaments, silk, beds, cattle, elephants and horses.', c => {
    const exchange = at(c, L(c, 4), [1]) && at(c, 'Venus', [4]);
    return [['the 4th lord in the lagna and Venus in the 4th, or both in a kendra or trine', exchange || (at(c, L(c, 4), GOOD) && at(c, 'Venus', GOOD))]];
  }),
  either('4th-ruin', [14], 'The 4th lord in an evil house with Mars and the Sun, or with Rāhu and Saturn, or with an enemy', 'The birthplace burns; it decays; cattle, land and vehicles are taken by others.', c => {
    const lord = L(c, 4); const evil = at(c, lord, EVIL);
    return [
      ['the 4th lord in an evil house with Mars and the Sun, or the 4th with them: the birthplace burns', (evil && together(c, lord, 'Mars') && together(c, lord, 'Sun')) || (at(c, 'Mars', [4]) && at(c, 'Sun', [4]))],
      ['the 4th lord in an evil house with Rāhu and Saturn: the house decays', evil && together(c, lord, 'Rahu') && together(c, lord, 'Saturn')],
      ['the 4th lord in an evil house with an enemy: cattle, land and vehicles taken', evil && c.planets.some(p => p.name !== lord && NATURAL_ENEMIES[lord]?.includes(p.name) && together(c, lord, p.name))],
    ];
  }),
  rule('5th-mercury', [15], 'The 5th a sign of Mercury and Mercury in it (or its lord in the navāṁśa of Mercury)', 'Intelligent and sincere.', c => [
    ['the 5th is Gemini or Virgo', [3, 6].includes(signOfHouse(c, 5))], ['Mercury in the 5th, or the 5th lord in a navāṁśa of Mercury', at(c, 'Mercury', [5]) || [3, 6].includes(nav(c, L(c, 5)) ?? 0)],
  ]),
  either('enemy-trouble', [16], 'Five yogas of trouble from enemies', 'The trouble from enemies is quick, great and not to be turned.', c => {
    const l6 = L(c, 6); const l1 = L(c, 1);
    return [
      ['malefics in the 6th', grahasInHouse(c, 6).some(n => isMalefic(c, n))], ['the lagna lord joined or seen by a strong 6th lord', l1 !== l6 && isStrong(c, l6) === true && (together(c, l1, l6) || sees(c, l6, l1))], ['the lagna lord in the 6th', at(c, l1, [6])],
      ['the 6th lord in a kendra, joined or seen by malefics', at(c, l6, KENDRA) && touchedBy(c, l6, n => isMalefic(c, n))], ['the 6th lord joined or seen by malefics', touchedBy(c, l6, n => isMalefic(c, n))],
    ];
  }),
  rule('health', [17], 'The lagna lord stronger than the 6th lord, in a benefic navāṁśa, seen by benefics; the 4th lord strong in a kendra or trine', 'Healthy, fortunate and strong of body.', c => {
    const n1 = nav(c, L(c, 1));
    return [['the lagna lord stronger than the 6th lord', stronger(c, L(c, 1), L(c, 6))], ['in a navāṁśa of a benefic', n1 !== null && isBenefic(c, lordOfSign(n1))], ['seen by a benefic', touchedBy(c, L(c, 1), n => isBenefic(c, n) && !together(c, L(c, 1), n))], ['the 4th lord strong in a kendra or trine', isStrong(c, L(c, 4)) === null ? null : isStrong(c, L(c, 4)) === true && at(c, L(c, 4), GOOD)]];
  }),
  rule('enemies-destroyed', [18], 'The 6th lord in an evil house, fallen, combust or with an enemy, the lagna lord stronger, the Sun in the 9th', 'The enemies are destroyed.', c => {
    const l6 = L(c, 6);
    return [['the 6th lord in an evil house', at(c, l6, EVIL)], ['fallen, combust or with an enemy', badSign(c, l6) || combust(c, l6) || c.planets.some(p => p.name !== l6 && NATURAL_ENEMIES[l6]?.includes(p.name) && together(c, l6, p.name))], ['the lagna lord stronger than the 6th lord', stronger(c, L(c, 1), l6)], ['the Sun in the 9th', at(c, 'Sun', [9])]];
  }),
  {
    id: 'p16-enemy-houses', topic: 'phalaHouses', text: 'phala', chapter: 16, verses: [19], name: 'The houses whose lord is with the 6th lord, in which the 6th lord stands, or whose lord stands in the 6th',
    effect: 'Those houses become enemies (are lost).',
    evaluate: (c: TopicContext): RuleOutcome => {
      const l6 = L(c, 6); const withHouses = Array.from({ length: 12 }, (_, i) => i + 1).filter(h => h !== 6 && L(c, h) !== l6 && together(c, L(c, h), l6));
      const stands = houseOf(c, l6); const inSix = Array.from({ length: 12 }, (_, i) => i + 1).filter(h => h !== 6 && houseOf(c, L(c, h)) === 6);
      const names = (hs: number[]) => hs.map(h => `the ${ordinalEn(h)}`).join(', ') || 'none';
      return { met: withHouses.length > 0 || (stands !== null && stands !== 6) || inSix.length > 0, lines: [`the lords with the 6th lord ${l6}: ${names(withHouses)}; the house where it stands: ${stands === null ? 'unknown' : `the ${ordinalEn(stands)}`}; houses whose lord stands in the 6th: ${names(inSix)}`] };
    },
  },
  rule('wife-virtuous', [20], 'A benefic joined to or seeing the 7th, and the 7th lord strong', 'A wife who is good, with a husband and sons, rich in every virtue.', c => [['a benefic in the 7th or seeing it', houseTouchedBy(c, 7, n => isBenefic(c, n))], ['the 7th lord strong', isStrong(c, L(c, 7))]]),
  rule('long-life-8th', [21], 'The 8th lord weaker than the lagna lord and outside the kendras', 'No illness, no obstacle, no suffering, a long life.', c => [['the 8th lord weaker than the lagna lord', stronger(c, L(c, 1), L(c, 8))], ['not in a kendra', !at(c, L(c, 8), KENDRA)]]),
  either('father-dies', [22], 'The 9th with Mars or the Sun and its lord in an evil house, or the 9th lord between malefics', 'The father\'s death.', c => [
    ['Mars or the Sun in the 9th and the 9th lord in the 6th, 8th or 12th', (at(c, 'Mars', [9]) || at(c, 'Sun', [9])) && at(c, L(c, 9), EVIL)], ['the 9th lord between malefics', hemmed(c, signOf(c, L(c, 9)) ?? 0)],
  ]),
  rule('father-lives', [23], 'The Sun by day (or Saturn by night) well placed and seen by benefics, the 9th lord strong', 'The father lives long.', c => {
    const day = at(c, 'Sun', [7, 8, 9, 10, 11, 12]); const name = day ? 'Sun' : 'Saturn';
    return [[`${name} (${day ? 'day' : 'night'} birth) in a good house`, at(c, name, GOOD)], ['seen by a benefic', touchedBy(c, name, n => isBenefic(c, n) && !together(c, name, n))], ['the 9th lord strong', isStrong(c, L(c, 9))]];
  }),
  rule('left-by-parents', [24], 'Saturn and Mars with the Moon and the Sun in the trines (5th and 9th), unseen by Jupiter', 'He is left by his mother and father (seen by Jupiter, he is happy and long-lived).', c => [
    ['the Moon and the Sun in the 5th and 9th', at(c, 'Sun', [5, 9]) && at(c, 'Moon', [5, 9])], ['Saturn and Mars joined or seeing them', ['Saturn', 'Mars'].every(n => ['Sun', 'Moon'].some(m => together(c, n, m) || sees(c, n, m)))], ['Jupiter does not see them', !['Sun', 'Moon'].some(m => sees(c, 'Jupiter', m))],
  ]),
  rule('lives-on-another-father', [25], 'Saturn the lord of the 9th in a movable sign unseen by benefics, the Sun in an evil house', 'He lives on another\'s father.', c => [
    ['the 9th lord is Saturn', L(c, 9) === 'Saturn'], ['in a movable sign', [1, 4, 7, 10].includes(signOf(c, 'Saturn') ?? 0)], ['not seen by benefics', !touchedBy(c, 'Saturn', n => isBenefic(c, n))], ['the Sun in the 6th, 8th or 12th', at(c, 'Sun', EVIL)],
  ]),
  rule('adopted', [26], 'The 9th or its lord joined or seen by Saturn in a movable sign, the 12th lord strong', 'He is surely given in adoption.', c => {
    const joinedOrSeen = (name: string) => name !== 'Saturn' && (together(c, name, 'Saturn') || sees(c, 'Saturn', name)); const ninth = signOfHouse(c, 9);
    return [['Saturn in a movable sign', [1, 4, 7, 10].includes(signOf(c, 'Saturn') ?? 0)], ['the 9th lord, or the 9th, joined or seen by Saturn', joinedOrSeen(L(c, 9)) || at(c, 'Saturn', [9]) || seesSign(c, 'Saturn', ninth)], ['the 12th lord strong', isStrong(c, L(c, 12))]];
  }),
  rule('10th-fame', [27], 'A benefic in the 10th, its lord strong in a kendra or trine in its own sign or exaltation, or the lagna lord in the 10th', 'Great fame, a righteous life, a king\'s fortune and long life.', c => [
    ['a benefic in the 10th', grahasInHouse(c, 10).some(n => isBenefic(c, n))], ['the 10th lord strong, in a kendra or trine, in its own sign or exaltation, or the lagna lord in the 10th', (isStrong(c, L(c, 10)) === true && at(c, L(c, 10), GOOD) && ownOrExalted(c, L(c, 10))) || at(c, L(c, 1), [10])],
  ]),
  {
    id: 'p16-10th-occupants', topic: 'phalaHouses', text: 'phala', chapter: 16, verses: [28], name: 'The Sun or Mars, benefics, or Saturn, Rāhu or Ketu in the 10th',
    effect: 'The Sun or Mars: energetic and loved; the 10th lord well placed: great deeds by his own prowess; benefics: worthy work praised by the good; Rāhu, Saturn or Ketu: an evil-doer.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const here = grahasInHouse(c, 10);
      const found = [here.includes('Sun') || here.includes('Mars') ? 'the Sun or Mars: energetic and loved' : '', here.some(n => isBenefic(c, n)) ? 'benefics: worthy work' : '', ['Saturn', 'Rahu', 'Ketu'].some(n => here.includes(n)) ? 'Saturn, Rāhu or Ketu: an evil-doer' : '', at(c, L(c, 10), [5, 9]) ? 'the 10th lord in the 5th or 9th: great deeds by his own prowess' : ''].filter(Boolean);
      return { met: found.length > 0, lines: [found.join('; ') || 'none of these in the 10th'] };
    },
  },
  {
    id: 'p16-gain-loss', topic: 'phalaHouses', text: 'phala', chapter: 16, verses: [29, 30], name: 'The 11th lord with a house\'s lord or in it: gain; the lord of a house in the 12th or the 12th lord in it: loss',
    effect: 'Gain of the things of the houses the 11th lord is joined to or stands in, and of those whose lord is in the 11th; loss of the things of the houses whose lord stands in the 12th or in which the 12th lord stands.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const all = Array.from({ length: 12 }, (_, i) => i + 1); const l11 = L(c, 11); const l12 = L(c, 12);
      const names = (hs: number[]) => hs.map(h => `the ${ordinalEn(h)}`).join(', ') || 'none';
      const gain = all.filter(h => h !== 11 && (together(c, L(c, h), l11) && L(c, h) !== l11 || houseOf(c, l11) === h || houseOf(c, L(c, h)) === 11));
      const loss = all.filter(h => h !== 12 && (houseOf(c, L(c, h)) === 12 || houseOf(c, l12) === h));
      return { met: gain.length + loss.length > 0, lines: [`gain: ${names([...new Set(gain)])}; loss: ${names([...new Set(loss)])}`] };
    },
  },
];
