import { combustionOf } from './combustion';
import { navamshaSign } from './birthConditions';
import {
  SEVEN, aspectors, aspectsSign, cannot, drekkanaSign, find, houseOfSign, isStrong, lordOfSign, signName,
  type SevenGraha, type TopicContext, type TopicYogaRule,
} from './topicCore';

/** Spirituality: the Pravrajyā yoga, Bṛhat Parāśara Horā Śāstra chapter 79. */
export const PRAVRAJYA_TYPES: Record<SevenGraha, string> = {
  Sun: 'a tapasvī (ascetic)', Moon: 'a Kāpālika', Mars: 'a wearer of red (raktavastrabhṛt)', Mercury: 'an ekadaṇḍī (bearer of one staff)',
  Jupiter: 'a yati', Venus: 'a cakradhara (bearer of the discus)', Saturn: 'a nirgranthika (one without ties)',
};

/** The signs with four or more of the seven grahas in them, the grahas of each. */
function crowds(context: TopicContext): { sign: number; grahas: SevenGraha[] }[] {
  const result: { sign: number; grahas: SevenGraha[] }[] = [];
  for (let sign = 1; sign <= 12; sign++) {
    const grahas = SEVEN.filter(name => find(context, name)?.sign === sign);
    if (grahas.length >= 4) result.push({ sign, grahas });
  }
  return result;
}

export const SPIRITUALITY_RULES: TopicYogaRule[] = [
  {
    id: 'pravrajya-four-strong', topic: 'spirituality', chapter: 79, name: 'Four or more strong grahas in one sign', verses: [2, 3, 12, 13],
    effect: 'Renunciation; its kind by the strongest of them. With many such grahas he attains the renunciation of all, each in its daśā.',
    evaluate(context) {
      const lines: string[] = [];
      let unknown = false;
      let met = false;
      for (const crowd of crowds(context)) {
        const flags = crowd.grahas.map(name => ({ name, strong: isStrong(context, name) }));
        if (flags.some(flag => flag.strong === null)) unknown = true;
        const strong = flags.filter(flag => flag.strong).map(flag => flag.name);
        if (strong.length >= 4) {
          met = true;
          const strongest = strong.reduce((best, name) => ((context.ratio[name] ?? 0) > (context.ratio[best] ?? 0) ? name : best));
          lines.push(`${signName(crowd.sign)}: ${strong.join(', ')} are strong; the strongest is ${strongest}: ${PRAVRAJYA_TYPES[strongest]}`);
        } else lines.push(`${signName(crowd.sign)}: ${crowd.grahas.join(', ')} stand together but only ${strong.length} are strong`);
      }
      if (lines.length === 0) lines.push('No sign holds four or more of the seven grahas');
      return { met: met ? true : unknown ? null : false, lines };
    },
  },
  {
    id: 'pravrajya-combust-strong', topic: 'spirituality', chapter: 79, name: 'Four or more strong grahas in one sign, combust by the Sun', verses: [4],
    effect: 'The people are uninitiated, their devotion turned to the Sun.',
    evaluate(context) {
      const sun = find(context, 'Sun');
      const lines: string[] = [];
      let met = false;
      for (const crowd of crowds(context)) {
        const strong = crowd.grahas.filter(name => isStrong(context, name));
        if (strong.length < 4 || !sun) continue;
        const others = strong.filter(name => name !== 'Sun');
        const combust = others.filter(name => { const body = find(context, name)!; return combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null; });
        if (others.length > 0 && combust.length === others.length) { met = true; lines.push(`${signName(crowd.sign)}: ${others.join(', ')} are strong and combust`); }
      }
      if (!met) lines.push('No such sign (needs the crowd of the first rule, all of it but the Sun combust)');
      return { met, lines };
    },
  },
  {
    id: 'pravrajya-combust-weak', topic: 'spirituality', chapter: 79, name: 'Four or more grahas in one sign, combust and weak, with the Sun strong', verses: [5],
    effect: 'A renunciation born of the Sun.',
    evaluate(context) {
      const sun = find(context, 'Sun');
      const sunStrong = isStrong(context, 'Sun');
      if (!sun || sunStrong === null) return cannot('The strength of the Sun is not known');
      const lines: string[] = [];
      let met = false;
      for (const crowd of crowds(context)) {
        const others = crowd.grahas.filter(name => name !== 'Sun');
        const bad = others.filter(name => { const body = find(context, name)!; return isStrong(context, name) === false && combustionOf(name, body.longitude, sun.longitude, body.isRetrograde === true) !== null; });
        if (bad.length >= 4 && sunStrong) { met = true; lines.push(`${signName(crowd.sign)}: ${bad.join(', ')} are combust and weak, and the Sun is strong`); }
      }
      if (!met) lines.push('No sign holds four combust and weak grahas with a strong Sun');
      return { met, lines };
    },
  },
  {
    id: 'pravrajya-moon-lord-saturn', topic: 'spirituality', chapter: 79, name: 'The lord of the birth sign seeing Saturn, seen by none but Saturn', verses: [6, 7],
    effect: 'Renunciation by the strength of the lord and of Saturn; if the lord is weak and seen by Saturn alone, a renunciation of Saturn only.',
    evaluate(context) {
      const moon = find(context, 'Moon');
      const saturn = find(context, 'Saturn');
      if (!moon || !saturn) return cannot('The Moon or Saturn is missing');
      const lord = lordOfSign(moon.sign);
      const body = find(context, lord);
      if (!body || lord === 'Saturn') return { met: false, lines: [`The lord of the Moon's sign (${signName(moon.sign)}) is ${lord}: it cannot see Saturn`] };
      const seeing = aspectsSign(lord, body.sign, saturn.sign);
      const seenBy = aspectors(context, body.sign, lord);
      const others = seenBy.filter(name => name !== 'Saturn');
      const lines = [`The lord of the Moon's sign is ${lord}; it ${seeing ? 'sees' : 'does not see'} Saturn; seen by ${seenBy.length ? seenBy.join(', ') : 'no graha'}`];
      const strong = isStrong(context, lord);
      const first = seeing && others.length === 0;
      const second = strong === false && seenBy.length === 1 && seenBy[0] === 'Saturn';
      if (second) lines.push(`${lord} is weak and seen by Saturn alone: a renunciation of Saturn only (79.7)`);
      if (first) lines.push(`${lord} sees Saturn and is seen by no other graha (79.6)`);
      return { met: first || second, lines };
    },
  },
  {
    id: 'pravrajya-moon-saturn', topic: 'spirituality', chapter: 79, name: 'The Moon in the drekkāṇa of Saturn and a navāṁśa of Saturn or Mars, seen by Saturn', verses: [8],
    effect: 'A renunciation of Saturn.',
    evaluate(context) {
      const moon = find(context, 'Moon');
      const saturn = find(context, 'Saturn');
      if (!moon || !saturn) return cannot('The Moon or Saturn is missing');
      const drekkana = lordOfSign(drekkanaSign(moon.sign, moon.degree));
      const navamsa = lordOfSign(navamshaSign(moon.longitude));
      const seen = aspectsSign('Saturn', saturn.sign, moon.sign);
      const lines = [`The drekkāṇa of the Moon is of ${drekkana}, its navāṁśa of ${navamsa}; Saturn ${seen ? 'sees' : 'does not see'} it`];
      return { met: drekkana === 'Saturn' && (navamsa === 'Saturn' || navamsa === 'Mars') && seen, lines };
    },
  },
  {
    id: 'pravrajya-tirthakrit', topic: 'spirituality', chapter: 79, name: 'The Moon, Jupiter and the Lagna seen by Saturn, Jupiter in the 9th', verses: [14],
    effect: 'In this royal combination he becomes a tīrthakṛt (an ascetic), no doubt.',
    evaluate(context) {
      const moon = find(context, 'Moon');
      const jupiter = find(context, 'Jupiter');
      const saturn = find(context, 'Saturn');
      if (!moon || !jupiter || !saturn) return cannot('A graha is missing');
      const sees = (sign: number) => aspectsSign('Saturn', saturn.sign, sign);
      const jupiterHouse = houseOfSign(context, jupiter.sign);
      const lines = [`Saturn ${sees(moon.sign) ? 'sees' : 'does not see'} the Moon, ${sees(jupiter.sign) ? 'sees' : 'does not see'} Jupiter and ${sees(context.ascendantSign) ? 'sees' : 'does not see'} the Lagna; Jupiter is in the ${jupiterHouse}th house`];
      return { met: sees(moon.sign) && sees(jupiter.sign) && sees(context.ascendantSign) && jupiterHouse === 9, lines };
    },
  },
  {
    id: 'pravrajya-initiated-king', topic: 'spirituality', chapter: 79, name: 'Saturn in the 9th, free of any aspect', verses: [15],
    effect: 'In this royal combination he becomes a king who is initiated (dīkṣita).',
    evaluate(context) {
      const saturn = find(context, 'Saturn');
      if (!saturn) return cannot('Saturn is missing');
      const house = houseOfSign(context, saturn.sign);
      const seenBy = aspectors(context, saturn.sign, 'Saturn');
      return { met: house === 9 && seenBy.length === 0, lines: [`Saturn is in the ${house}th house, seen by ${seenBy.length ? seenBy.join(', ') : 'no graha'}`] };
    },
  },
];
