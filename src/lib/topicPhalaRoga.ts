import { navamshaSign } from './birthConditions';
import { EXALTATION, NATURAL_ENEMIES, NATURAL_FRIENDS, DEBILITATION } from './dignity';
import { at, yes, type Cond } from './topicChildren';
import {
  SEVEN, beneficsSeeingSign, find, grahasInHouse, houseOf, isBenefic, isMalefic, joinedOrSeen, lordOfSign, moonWaxing, sees, seesSign, signName, signOf, signOfHouse, together,
  type RuleOutcome, type SevenGraha, type TopicContext, type TopicYogaRule,
} from './topicCore';

/**
 * Chapter 14 of the Phaladīpikā of Mantreśvara (roga-cintā, 29 verses): illness, the cause of death, the way after death and the next birth. Judged: the illness of each graha by the places that point to it (14.1-9), the yogas of the eye, the ear, the belly and the anus (14.10),
 * the grahas in the 6th and 8th (14.11), the cause of death by the grahas in the 8th, the sign of the 8th (14.12-19), the wrath of kings and weapons (14.20), the easy or cruel death (14.21), the way upward or downward and the place after death (14.22-23), and the land of the former and the next birth (14.25).
 * Readings: "malefic" and "benefic" as in the other topics; "strong" is the greater Ṣaḍbala; in 14.1 a graha points to illness when two of the three places agree (in the 6th; in the 8th or 12th; the 6th lord or joined to it); Gulika is not in the chart data.
 * Not judged: 14.24 and 14.26-29 (the caste, the direction and the country of the births, and the birth as a tree, a beast or a bird) — they are told by the names of the signs and grahas in the chapter on names and rest on speculation the app does not take up.
 */
const rule = (id: string, verses: number[], name: string, effect: string, rows: (c: TopicContext) => Cond[]): TopicYogaRule => ({
  id: `p14-${id}`, topic: 'phalaHouses', text: 'phala', chapter: 14, verses, name, effect,
  evaluate: (c: TopicContext): RuleOutcome => {
    const list = rows(c);
    const met = list.some(([, v]) => v === false) ? false : list.some(([, v]) => v === null) ? null : true;
    return { met, lines: [list.map(([label, v]) => `${label}: ${yes(v)}`).join('; ')] };
  },
});
const L = (c: TopicContext, house: number) => lordOfSign(signOfHouse(c, house));
const touched = (c: TopicContext, sign: number, name: string) => c.planets.some(p => p.name === name && p.sign === sign) || seesSign(c, name, sign);

const DISEASE: Record<string, { verse: number; text: string }> = {
  Sun: { verse: 2, text: 'bile, fever and burning, epilepsy, heart disease, pain in the eyes, fear of enemies, skin disease, bones, harm by wood, fire, weapons or poison, trouble for wife and children, fear of beasts, thieves, kings, Yama, serpents and Rudra' },
  Moon: { verse: 3, text: 'sleep and sloth, phlegm, diarrhoea, boils, cold fever, harm from horned beasts or water creatures, weak digestion, loathing of food, women\'s troubles, jaundice, a troubled mind, blood disease, fear of water and of child-seizing grahas' },
  Mars: { verse: 4, text: 'thirst, blood disease, bilious fever, harm by fire, poison or weapons, leprosy, eye disease, tumours, epilepsy, roughness of the body, itch, loss of limbs, trouble from kings, enemies and thieves, quarrels, fear of demons, diseases of the upper body' },
  Mercury: { verse: 5, text: 'delusion, bad speech, diseases of the eyes, throat and nose, fever, disorders of bile, phlegm and wind, poison, skin disease, jaundice, bad dreams, itch, falling in fire, harshness, bondage, weariness' },
  Jupiter: { verse: 6, text: 'tumours, fever of the bowels, grief, fainting and the diseases of phlegm, pain in the ears, delusion, trouble over temples and treasure, a Brahmin\'s curse, wrong done to the learned and to teachers' },
  Venus: { verse: 7, text: 'jaundice, disorders of wind and phlegm, eye disease, urinary disease, trouble of the sexual organs, weakness, consumption, fear of yoginīs and yakṣiṇīs, a break with a dear friend' },
  Saturn: { verse: 8, text: 'disorders of wind and phlegm, lameness, calamity, drowsiness and weariness, delusion, pain in the belly and sides, the loss of servants, harm to wife and sons, loss of limbs, pain in the heart, harm from trees or stones, trouble from goblins' },
  Rahu: { verse: 9, text: 'pain in the heart, leprosy, a clouded mind, poison, pain in the feet, fear of piśācas and serpents, trouble for wife and children' },
  Ketu: { verse: 9, text: 'opposition of Brahmins and warriors, fear of enemies' },
};
const DEATH_BY_GRAHA: Record<string, string> = {
  Sun: 'fire, high fever, bile, weapons', Moon: 'cholera, dropsy, lung disease', Mars: 'accident and blood, fire, magic, weapons', Mercury: 'jaundice and the like, delirium', Jupiter: 'phlegm, without trouble',
  Venus: 'disease from women', Saturn: 'wind, or the three humours together', Rahu: 'leprosy, poisoned food, poison, smallpox', Ketu: 'an evil death: an accident, a quarrel, insects',
};
const DEATH_BY_SIGN = ['bilious fever, heat, the fire of the belly', 'the three humours, burning, weapons', 'cough, breathlessness, heat, colic', 'madness, wind, loathing of food', 'beasts, fever, boils, an enemy', 'women, disease of the sexual parts, a fall',
  'brain fever, the three humours', 'the spleen, jaundice, sprue', 'a tree, water, wood, weapons', 'colic, loathing of food, a clouded mind', 'cough, fever, consumption', 'water, a water disease'];
const PLACE_AFTER: Record<string, string> = { Sun: 'Kailāsa', Moon: 'Kailāsa', Venus: 'heaven', Mars: 'the earth', Mercury: 'Vaikuṇṭha', Saturn: 'the city of Yama', Jupiter: 'the world of Brahmā', Rahu: 'the islands', Ketu: 'hell' };

const strongestOf = (c: TopicContext, names: string[]): string | null => {
  if (names.length === 0) return null;
  const withRatio = names.filter(name => c.ratio[name as SevenGraha] !== undefined).sort((a, b) => (c.ratio[b as SevenGraha] ?? 0) - (c.ratio[a as SevenGraha] ?? 0));
  return withRatio[0] ?? names[0];
};
const sign12 = (c: TopicContext) => signOfHouse(c, 12);
const goodSign = (c: TopicContext, sign: number) => isBenefic(c, lordOfSign(sign)) || c.planets.some(p => p.sign === sign && isBenefic(c, p.name)) || beneficsSeeingSign(c, sign).length > 0;
const badSign = (c: TopicContext, sign: number) => isMalefic(c, lordOfSign(sign)) && !goodSign(c, sign);

export const PHALA_ROGA_RULES: TopicYogaRule[] = [
  ...Object.keys(DISEASE).map((name): TopicYogaRule => ({
    id: `p14-graha-${name.toLowerCase()}`, topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [1, DISEASE[name].verse], name: `${name} points to illness (two of: in the 6th; in the 8th or 12th; the 6th lord or joined to it)`,
    effect: `${name}: ${DISEASE[name].text}.`,
    evaluate: (c: TopicContext): RuleOutcome => {
      const house = houseOf(c, name);
      if (house === null) return { met: null, lines: [`${name} is missing`] };
      const lord6 = L(c, 6);
      const criteria: [string, boolean][] = [['in the 6th', house === 6], ['in the 8th or 12th', house === 8 || house === 12], [`the 6th lord or joined to ${lord6}`, name === lord6 || together(c, name, lord6)]];
      const count = criteria.filter(([, ok]) => ok).length;
      return { met: count >= 2, lines: [`${name} in the ${house}${house === 1 ? 'st' : house === 2 ? 'nd' : house === 3 ? 'rd' : 'th'}: ${criteria.map(([label, ok]) => `${label} ${yes(ok)}`).join('; ')}`] };
    },
  })),
  rule('eye', [10], 'The Sun or the Moon in the 12th or 2nd, joined or seen by Mars and Saturn', 'Disease of the eye.', c => [
    ['the Sun or the Moon in the 12th or 2nd, joined or seen by both Mars and Saturn', ['Sun', 'Moon'].some(name => at(c, name, [12, 2]) && joinedOrSeen(c, name, 'Mars') && joinedOrSeen(c, name, 'Saturn'))],
  ]),
  rule('ear', [10], 'The 3rd, the 11th and Jupiter touched by Mars and Saturn', 'Disease of the ear.', c => {
    const jupiter = signOf(c, 'Jupiter');
    if (jupiter === null) return [['Jupiter is missing', null]];
    const places = [signOfHouse(c, 3), signOfHouse(c, 11), jupiter];
    return [['the 3rd, the 11th and Jupiter each joined or seen by Mars and Saturn', places.every(sign => touched(c, sign, 'Mars') && touched(c, sign, 'Saturn'))]];
  }),
  rule('belly', [10], 'Mars in the 5th with the 6th or 8th lord', 'Disease of the belly.', c => [['Mars in the 5th', at(c, 'Mars', [5])], ['with the lord of the 6th or the 8th', [L(c, 6), L(c, 8)].some(name => name !== 'Mars' && together(c, 'Mars', name))]]),
  rule('anus', [10], 'The 6th and 8th lords in the 7th', 'Disease of the anus.', c => [['the 6th lord in the 7th', at(c, L(c, 6), [7])], ['the 8th lord in the 7th', at(c, L(c, 8), [7])]]),
  rule('genital', [10], 'The 6th and 8th lords and Venus in the 7th', 'Disease of the sexual parts.', c => [['the 6th lord in the 7th', at(c, L(c, 6), [7])], ['the 8th lord in the 7th', at(c, L(c, 8), [7])], ['Venus in the 7th', at(c, 'Venus', [7])]]),
  {
    id: 'p14-6th-8th', topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [11], name: 'A graha in the 6th or 8th',
    effect: 'The Sun, fear of fever; Mars or Ketu, wounds; Venus, disease of the sexual parts; Jupiter, consumption; Saturn, wind disease; Rāhu seen by Mars, boils; Saturn with the Moon, tumours; the waning Moon in a water sign with a malefic, water disease and consumption.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const here = (name: string) => at(c, name, [6, 8]);
      const found: string[] = [];
      if (here('Sun')) found.push('the Sun: fever'); if (here('Mars')) found.push('Mars: wounds'); if (here('Ketu')) found.push('Ketu: wounds'); if (here('Venus')) found.push('Venus: disease of the sexual parts');
      if (here('Jupiter')) found.push('Jupiter: consumption'); if (here('Saturn')) found.push('Saturn: wind disease'); if (here('Rahu') && sees(c, 'Mars', 'Rahu')) found.push('Rāhu seen by Mars: boils');
      if (here('Saturn') && here('Moon') && together(c, 'Saturn', 'Moon')) found.push('Saturn with the Moon: tumours');
      const moon = find(c, 'Moon');
      if (moon && here('Moon') && !moonWaxing(c) && [4, 8, 10, 12].includes(moon.sign) && grahasInHouse(c, houseOf(c, 'Moon') ?? 0).some(name => name !== 'Moon' && isMalefic(c, name))) found.push('the waning Moon in a water sign with a malefic: water disease');
      return { met: found.length > 0, lines: [found.join('; ') || 'No graha of the verse in the 6th or 8th'] };
    },
  },
  {
    id: 'p14-death-cause', topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [12, 13, 14, 15, 16, 17, 18, 19], name: 'The cause of death: the grahas in and seeing the 8th, or the sign of the 8th',
    effect: 'Death by the diseases of the strongest graha in the 8th or seeing it; with none, by the fault of the sign of the 8th (and of the navāṁśa of the 8th lord).',
    evaluate: (c: TopicContext): RuleOutcome => {
      const sign8 = signOfHouse(c, 8);
      const candidates = [...new Set([...grahasInHouse(c, 8), ...SEVEN.filter(name => seesSign(c, name, sign8))])];
      const chosen = strongestOf(c, candidates);
      const lord8 = find(c, L(c, 8));
      const navLine = lord8 ? `; the navāṁśa of the 8th lord ${L(c, 8)} is ${signName(navamshaSign(lord8.longitude))}: ${DEATH_BY_SIGN[navamshaSign(lord8.longitude) - 1]}` : '';
      return { met: true, lines: [`${chosen ? `${chosen} (of ${candidates.join(', ')}): ${DEATH_BY_GRAHA[chosen]}` : 'no graha in or seeing the 8th'}; the 8th sign ${signName(sign8)}: ${DEATH_BY_SIGN[sign8 - 1]}${navLine}`] };
    },
  },
  rule('weapons', [20], 'The 8th a sign of a malefic with a malefic in it', 'Death by weapons, fire, tigers or serpents.', c => [['the 8th a sign of the Sun, Mars or Saturn', ['Sun', 'Mars', 'Saturn'].includes(lordOfSign(signOfHouse(c, 8)))], ['a malefic in the 8th', grahasInHouse(c, 8).some(name => isMalefic(c, name))]]),
  rule('kings-wrath', [20], 'Two malefics in kendras seeing each other', 'Death by the wrath of a king, by weapons, poison or fire.', c => {
    const kendra = SEVEN.filter(name => isMalefic(c, name) && at(c, name, [1, 4, 7, 10]));
    const pair = kendra.find((a, i) => kendra.slice(i + 1).some(b => sees(c, a, b) && sees(c, b, a)));
    return [[`two malefics in kendras in mutual aspect (${kendra.join(', ') || 'none in a kendra'})`, pair !== undefined]];
  }),
  rule('easy-death', [21], 'The 12th sign, the sign of its lord and the lord\'s navāṁśa all benefic or joined to benefics', 'A death without pain.', c => {
    const lord = find(c, L(c, 12));
    if (!lord) return [['the 12th lord is missing', null]];
    return [['the 12th sign', goodSign(c, sign12(c))], ['the sign of the 12th lord', goodSign(c, lord.sign)], ['the navāṁśa of the 12th lord', goodSign(c, navamshaSign(lord.longitude))]];
  }),
  rule('cruel-death', [21], 'The 12th sign, the sign of its lord and the lord\'s navāṁśa all in signs of malefics and not joined to benefics', 'A cruel death.', c => {
    const lord = find(c, L(c, 12));
    if (!lord) return [['the 12th lord is missing', null]];
    return [['the 12th sign', badSign(c, sign12(c))], ['the sign of the 12th lord', badSign(c, lord.sign)], ['the navāṁśa of the 12th lord', badSign(c, navamshaSign(lord.longitude))]];
  }),
  {
    id: 'p14-upward', topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [22], name: 'The 12th lord in its exaltation or a friend\'s sign, or with a benefic', effect: 'The way upward after death (the reverse, the way downward).',
    evaluate: (c: TopicContext): RuleOutcome => {
      const name = L(c, 12); const body = find(c, name);
      if (!body) return { met: null, lines: ['The 12th lord is missing'] };
      const friend = NATURAL_FRIENDS[name]?.includes(lordOfSign(body.sign)) === true; const enemy = NATURAL_ENEMIES[name]?.includes(lordOfSign(body.sign)) === true;
      const up = EXALTATION[name] === body.sign || friend || c.planets.some(p => p.name !== name && p.sign === body.sign && isBenefic(c, p.name));
      const down = DEBILITATION[name] === body.sign || enemy || c.planets.some(p => p.name !== name && p.sign === body.sign && isMalefic(c, p.name));
      return { met: up && !down, lines: [`the 12th lord ${name} in ${signName(body.sign)}: upward ${yes(up)}, downward ${yes(down)}`] };
    },
  },
  {
    id: 'p14-downward', topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [22], name: 'The 12th lord in its fall or an enemy\'s sign, or with a malefic', effect: 'The way downward after death.',
    evaluate: (c: TopicContext): RuleOutcome => {
      const name = L(c, 12); const body = find(c, name);
      if (!body) return { met: null, lines: ['The 12th lord is missing'] };
      const enemy = NATURAL_ENEMIES[name]?.includes(lordOfSign(body.sign)) === true; const friend = NATURAL_FRIENDS[name]?.includes(lordOfSign(body.sign)) === true;
      const down = DEBILITATION[name] === body.sign || enemy || c.planets.some(p => p.name !== name && p.sign === body.sign && isMalefic(c, p.name));
      const up = EXALTATION[name] === body.sign || friend || c.planets.some(p => p.name !== name && p.sign === body.sign && isBenefic(c, p.name));
      return { met: down && !up, lines: [`the 12th lord ${name} in ${signName(body.sign)}: downward ${yes(down)}, upward ${yes(up)}`] };
    },
  },
  {
    id: 'p14-after-death', topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [23], name: 'The place after death by the 12th lord and the grahas in the 12th',
    effect: 'The Sun and the Moon, Kailāsa; Venus, heaven; Mars, the earth; Mercury, Vaikuṇṭha; Saturn, the city of Yama; Jupiter, the world of Brahmā; Rāhu, the islands; Ketu, hell. (The strongest of the 12th lord and the grahas in the 12th.)',
    evaluate: (c: TopicContext): RuleOutcome => {
      const lord = L(c, 12); const candidates = [...new Set([lord, ...grahasInHouse(c, 12)])];
      const chosen = strongestOf(c, candidates) ?? lord;
      return { met: true, lines: [`${chosen} (of ${candidates.join(', ')}): ${PLACE_AFTER[chosen] ?? 'not told'}`] };
    },
  },
  ...([[9, 'former', 'the 9th lord'], [5, 'next', 'the 5th lord']] as const).map(([house, which, label]): TopicYogaRule => ({
    id: `p14-${which}-birth-land`, topic: 'phalaHouses', text: 'phala', chapter: 14, verses: [24, 25], name: `The land of the ${which} birth by ${label} in its exaltation, its fall or an enemy\'s sign`,
    effect: `${which === 'former' ? 'The former' : 'The next'} birth: in its exaltation, the land of the gods; in its fall or an enemy's sign, another island; in its own, a friend's or a neutral sign, only Bhāratavarṣa.`,
    evaluate: (c: TopicContext): RuleOutcome => {
      const name = L(c, house); const body = find(c, name);
      if (!body) return { met: null, lines: [`${label} is missing`] };
      const exalted = EXALTATION[name] === body.sign; const low = DEBILITATION[name] === body.sign || NATURAL_ENEMIES[name]?.includes(lordOfSign(body.sign)) === true;
      return { met: exalted || low, lines: [`${label} ${name} in ${signName(body.sign)}: ${exalted ? 'the land of the gods' : low ? 'another island' : 'Bhāratavarṣa (the common case)'}`] };
    },
  })),
];
