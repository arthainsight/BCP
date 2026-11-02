import { combustionOf } from './combustion';
import { EXALTATION, OWN_SIGNS } from './dignity';
import { yes, type Cond } from './topicChildren';
import {
  SEVEN, find, grahasInHouse, houseOf, isBenefic, isMalefic, lordOfSign, ordinalEn, seesSign, signOf, signOfHouse,
  type RuleOutcome, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * The yogas of the twelve houses in chapter 6 of the Phaladīpikā of Mantreśvara: verse 44 (Cāmara, Dhenu, Śaurya, Jaladhi, Chatra, Astra, Kāma, Āsura, Bhāgya, Khyāti, Pārijāta, Musala) and verse 57 (Ava, Niḥsva, Mṛti, Kuhū, Pāmara, Harṣa, Duṣkṛti, Sarala,
 * Nirbhāgya, Durdoga, Daridra, Vimala), each for the house of its number from the lagna, with the result told in the verses that follow (45-56, 58-69). The names are those of the Phaladīpikā: the Cāmara, Musala, Pārijāta and Chatra of the yoga table (BPHS, the Nabhasa yogas) are other yogas.
 * Readings: a house is "touched" by a graha that is in it or sees its sign (the nodes do not aspect); a "good house" for the lord is a kendra or trine from the lagna; "bright" is not combust (by the orbs of the app); "malefic" and "benefic" as in the other topics.
 * Verse 44 asks of the lord that it be bright and in its own sign or exaltation or in a good house (the Hindi has "or"; the English of Subrahmanya Sastri puts "in a good house" and "bright, in exaltation or own sign" as the two ways); here the lord must be bright and in one of the three.
 * Verse 57 says "the lords in evil houses, or (vā) the houses joined or seen by malefics"; the Hindi has "and". The Sanskrit decides: either holds. A malefic that is the lord of the house counts when it touches the house, as the verse does not exclude it.
 * Not judged: 6.70 (its sense is not settled).
 */
const rule = (id: string, verses: number[], name: string, effect: string, rows: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p6-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 6, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = rows(c);
    const met = list.some(([, v]) => v === false) ? false : list.some(([, v]) => v === null) ? null : true;
    return { met, lines: [list.map(([label, v]) => `${label}: ${yes(v)}`).join('; ')] };
  },
});
const GOOD_NAMES = ['Cāmara', 'Dhenu', 'Śaurya', 'Jaladhi', 'Chatra', 'Astra', 'Kāma', 'Āsura', 'Bhāgya', 'Khyāti', 'Pārijāta', 'Musala'];
const BAD_NAMES = ['Ava', 'Niḥsva', 'Mṛti', 'Kuhū', 'Pāmara', 'Harṣa', 'Duṣkṛti', 'Sarala', 'Nirbhāgya', 'Durdoga', 'Daridra', 'Vimala'];
const GOOD_ID = ['camara', 'dhenu', 'shaurya', 'jaladhi', 'chatra', 'astra', 'kama', 'asura', 'bhagya', 'khyati', 'parijata', 'musala'];
const BAD_ID = ['ava', 'nihsva', 'mriti', 'kuhu', 'pamara', 'harsha', 'dushkriti', 'sarala', 'nirbhagya', 'durdoga', 'daridra', 'vimala'];

const touchers = (c: TopicContext, house: number, test: (name: string) => boolean) => {
  const sign = signOfHouse(c, house);
  return [...new Set([...grahasInHouse(c, house), ...SEVEN.filter(name => seesSign(c, name, sign))])].filter(test);
};
const combust = (c: TopicContext, name: string) => {
  const body = find(c, name); const sun = find(c, 'Sun');
  return Boolean(body && sun && name !== 'Sun' && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null);
};

const GOOD_EFFECT = [
  'Grows every day like the bright Moon, of good conduct, famous, a leader of men, long-lived (6.45).',
  'Rich in food and drink, learned, with a great family and wealth, like a king of kings (6.46).',
  'Brave, praised by famous younger brothers, in the king\'s work, very famous, like Rāma (6.47).',
  'A house rich in cattle and grain, a fine wife, lasting happiness, vehicles, honoured by kings (6.48).',
  'A good home life, fortune, children, fame, a king\'s minister, rich, of keen intellect (6.49).',
  'Overcomes strong enemies, cruel and proud, with the marks of wounds, strong of body (6.50).',
  'Turned from other men\'s wives, a fine wife, sons and kin, greater than his father (6.51).',
  'Spoils others\' work, slanderous, self-seeking, poor, obstinate, an evil-doer (6.52).',
  'Travels in a palanquin, lasting fortune, honoured, on the path of dharma, upholds his family (6.53).',
  'Does deeds all approve, a king of the good, fortunate in sons, friends, wealth and wife (6.54).',
  'Always in good fortune, a lord of the earth, hoarded wealth, a good family, of auspicious life (6.55).',
  'Wealth won with trouble, scorned, unsteady, spends only rightly, reaches heaven at the end (6.56).',
];
const BAD_EFFECT = [
  'Unknown, in misery, short-lived, scorned, among the wicked, ill-conducted, unsteady (6.58).',
  'Without good speech, a fruitless family, bad teeth and eyes, no sons or learning, his wealth taken (6.59).',
  'Overcome by enemies, without brothers, shameless, without strength or wealth, wearied by improper work (6.60).',
  'Without mother, vehicles, friends, comfort or kin, without a settled place, fond of bad women (6.61).',
  'Lives in sorrow, a liar, a cheat, his sons die or he has none, an unbeliever, a glutton (6.62).',
  'Happiness, a strong body, his enemies slain, afraid of sin, dear to leaders, with wealth, fame and sons (6.63; good, as the viparīta yogas are).',
  'Parting from his wife, desire for other men\'s wives, roams the roads, diseases of the hidden parts, scorn of kin (6.64).',
  'Long-lived, firm, fearless, fortunate, his undertakings succeed, conquers his enemies, famous (6.65; good).',
  'Destroys his father\'s land and house, reviles the good and his teachers, without dharma, poor (6.66).',
  'What he does with effort comes to nothing, a wrong-doer to the people, always abroad (6.67).',
  'In debt, fierce, first among the poor, a disease of the ear, another\'s servant (6.68).',
  'Small expense and great growth of wealth, agreeable to all, happy, free, of honoured calling (6.69; good).',
];

export const PHALA_YOGA_HOUSES_RULES: TopicYogaRule[] = [
  ...GOOD_NAMES.map((name, index) => rule(GOOD_ID[index], [44, 45 + index], `${name}: the ${ordinalEn(index + 1)} house joined or seen by a benefic, its lord bright and in its own sign, exaltation or a good house`, GOOD_EFFECT[index], c => {
    const house = index + 1; const lord = lordOfSign(signOfHouse(c, house)); const sign = signOf(c, lord); const at = houseOf(c, lord);
    if (sign === null || at === null) return [['the lord is missing', null]];
    return [
      [`a benefic joined to or seeing the ${ordinalEn(house)}`, touchers(c, house, name2 => isBenefic(c, name2)).length > 0],
      [`the lord ${lord} bright (not combust)`, !combust(c, lord)],
      [`in its own sign or exaltation, or in a kendra or trine (${lord} in the ${ordinalEn(at)})`, OWN_SIGNS[lord]?.includes(sign) === true || EXALTATION[lord] === sign || [1, 4, 5, 7, 9, 10].includes(at)],
    ];
  })),
  ...BAD_NAMES.map((name, index) => ({
    id: `p6-${BAD_ID[index]}`, topic: 'phalaHouses' as const, text: 'phala' as const, chapter: 6, verses: [57, 58 + index],
    name: `${name}: the lord of the ${ordinalEn(index + 1)} in the 6th, 8th or 12th, or the ${ordinalEn(index + 1)} joined or seen by a malefic`, effect: BAD_EFFECT[index],
    evaluate: (c: TopicContext): RuleOutcome => {
      const house = index + 1; const lord = lordOfSign(signOfHouse(c, house)); const at = houseOf(c, lord);
      if (at === null) return { met: null, lines: ['The lord is missing'] };
      const evilLord = [6, 8, 12].includes(at); const malefics = touchers(c, house, name2 => isMalefic(c, name2));
      return { met: evilLord || malefics.length > 0, lines: [`the lord ${lord} in the ${ordinalEn(at)}: ${yes(evilLord)}; malefics joined to or seeing the ${ordinalEn(house)}: ${malefics.join(', ') || 'none'}`] };
    },
  })),
];
