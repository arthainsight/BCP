import { combustionOf } from './combustion';
import { SIGN_LORDS } from './signs';
import { navamshaSign } from './birthConditions';
import { BPHS79_VERSES, type TopicVerse } from './bphs79Data';
export type { TopicVerse };

/**
 * Yogas by topic, from the classics in their own words. A rule carries the verses it comes from and decides from the chart whether it is met (true), not met (false) or cannot be judged (null).
 * First topic: spirituality, the Pravrajyā yoga of BPHS chapter 79. "Strong" (bali) is the Ṣaḍbala of the graha at or over the strength it needs (the ratio of the Ṣaḍbala panel is 1 or more); the text does not
 * define it, and this is the app's own measure.
 */
export type TopicKey = 'spirituality';
export const TOPICS: { key: TopicKey; label: string; source: string }[] = [
  { key: 'spirituality', label: 'Renunciation and spirituality', source: 'BPHS 79 (Pravrajyā-yoga)' },
];

export type SevenGraha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export const SEVEN: readonly SevenGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export interface TopicPlanet { name: string; sign: number; degree: number; longitude: number; isRetrograde?: boolean }
export interface TopicContext {
  planets: TopicPlanet[];
  ascendantSign: number;
  /** Ṣaḍbala against what each graha needs; 1 or more is strong. A graha missing from it cannot be judged. */
  ratio: Partial<Record<SevenGraha, number>>;
}

export interface RuleOutcome { met: boolean | null; lines: string[] }

export interface TopicYogaRule {
  id: string;
  topic: TopicKey;
  name: string;
  /** The verses of the chapter the rule is from. */
  verses: number[];
  /** What the text says follows. */
  effect: string;
  evaluate: (context: TopicContext) => RuleOutcome;
}

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────────────────
/** The aspect of the grahas on a sign (whole signs): the 7th for all, and for Mars the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th. Rāhu and Ketu are left out. */
const ASPECTS: Record<string, number[]> = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
const aspectsSign = (graha: string, from: number, target: number) => (ASPECTS[graha] ?? [7]).includes(((target - from + 12) % 12) + 1);
const find = (context: TopicContext, name: string) => context.planets.find(planet => planet.name === name);
const isStrong = (context: TopicContext, name: string): boolean | null => {
  const value = context.ratio[name as SevenGraha];
  return value === undefined ? null : value >= 1;
};
const aspectors = (context: TopicContext, target: number, exclude: string) =>
  SEVEN.filter(name => name !== exclude).filter(name => { const body = find(context, name); return body ? aspectsSign(name, body.sign, target) : false; });
const drekkanaSign = (sign: number, degree: number) => ((sign - 1 + Math.min(2, Math.floor(degree / 10)) * 4) % 12) + 1;
const lordOf = (sign: number) => SIGN_LORDS[sign - 1];

/** The types of renunciation by the strongest graha, in the order of the grahas (79.2–3). */
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
const signName = (sign: number) => ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][sign - 1];

export const SPIRITUALITY_RULES: TopicYogaRule[] = [
  {
    id: 'pravrajya-four-strong', topic: 'spirituality', name: 'Four or more strong grahas in one sign', verses: [2, 3, 12, 13],
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
    id: 'pravrajya-combust-strong', topic: 'spirituality', name: 'Four or more strong grahas in one sign, combust by the Sun', verses: [4],
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
    id: 'pravrajya-combust-weak', topic: 'spirituality', name: 'Four or more grahas in one sign, combust and weak, with the Sun strong', verses: [5],
    effect: 'A renunciation born of the Sun.',
    evaluate(context) {
      const sun = find(context, 'Sun');
      const sunStrong = isStrong(context, 'Sun');
      if (!sun || sunStrong === null) return { met: null, lines: ['The strength of the Sun is not known'] };
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
    id: 'pravrajya-moon-lord-saturn', topic: 'spirituality', name: 'The lord of the birth sign seeing Saturn, seen by none but Saturn', verses: [6, 7],
    effect: 'Renunciation by the strength of the lord and of Saturn; if the lord is weak and seen by Saturn alone, a renunciation of Saturn only.',
    evaluate(context) {
      const moon = find(context, 'Moon');
      const saturn = find(context, 'Saturn');
      if (!moon || !saturn) return { met: null, lines: ['The Moon or Saturn is missing'] };
      const lord = lordOf(moon.sign);
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
    id: 'pravrajya-moon-saturn', topic: 'spirituality', name: 'The Moon in the drekkāṇa of Saturn and a navāṁśa of Saturn or Mars, seen by Saturn', verses: [8],
    effect: 'A renunciation of Saturn.',
    evaluate(context) {
      const moon = find(context, 'Moon');
      const saturn = find(context, 'Saturn');
      if (!moon || !saturn) return { met: null, lines: ['The Moon or Saturn is missing'] };
      const drekkana = lordOf(drekkanaSign(moon.sign, moon.degree));
      const navamsa = lordOf(navamshaSign(moon.longitude));
      const seen = aspectsSign('Saturn', saturn.sign, moon.sign);
      const lines = [`The drekkāṇa of the Moon is of ${drekkana}, its navāṁśa of ${navamsa}; Saturn ${seen ? 'sees' : 'does not see'} it`];
      return { met: drekkana === 'Saturn' && (navamsa === 'Saturn' || navamsa === 'Mars') && seen, lines };
    },
  },
  {
    id: 'pravrajya-tirthakrit', topic: 'spirituality', name: 'The Moon, Jupiter and the Lagna seen by Saturn, Jupiter in the 9th', verses: [14],
    effect: 'In this royal combination he becomes a tīrthakṛt (an ascetic), no doubt.',
    evaluate(context) {
      const moon = find(context, 'Moon');
      const jupiter = find(context, 'Jupiter');
      const saturn = find(context, 'Saturn');
      if (!moon || !jupiter || !saturn) return { met: null, lines: ['A graha is missing'] };
      const sees = (sign: number) => aspectsSign('Saturn', saturn.sign, sign);
      const jupiterHouse = ((jupiter.sign - context.ascendantSign + 12) % 12) + 1;
      const lines = [`Saturn ${sees(moon.sign) ? 'sees' : 'does not see'} the Moon, ${sees(jupiter.sign) ? 'sees' : 'does not see'} Jupiter and ${sees(context.ascendantSign) ? 'sees' : 'does not see'} the Lagna; Jupiter is in the ${jupiterHouse}th house`];
      return { met: sees(moon.sign) && sees(jupiter.sign) && sees(context.ascendantSign) && jupiterHouse === 9, lines };
    },
  },
  {
    id: 'pravrajya-initiated-king', topic: 'spirituality', name: 'Saturn in the 9th, free of any aspect', verses: [15],
    effect: 'In this royal combination he becomes a king who is initiated (dīkṣita).',
    evaluate(context) {
      const saturn = find(context, 'Saturn');
      if (!saturn) return { met: null, lines: ['Saturn is missing'] };
      const house = ((saturn.sign - context.ascendantSign + 12) % 12) + 1;
      const seenBy = aspectors(context, saturn.sign, 'Saturn');
      return { met: house === 9 && seenBy.length === 0, lines: [`Saturn is in the ${house}th house, seen by ${seenBy.length ? seenBy.join(', ') : 'no graha'}`] };
    },
  },
];

export const TOPIC_RULES: TopicYogaRule[] = [...SPIRITUALITY_RULES];

export interface TopicYogaResult { rule: TopicYogaRule; outcome: RuleOutcome; verses: TopicVerse[] }

const VERSES: Record<TopicKey, TopicVerse[]> = { spirituality: BPHS79_VERSES };

/** Every rule of a topic against a chart, with the verses it comes from. */
export function evaluateTopic(topic: TopicKey, context: TopicContext): TopicYogaResult[] {
  return TOPIC_RULES.filter(rule => rule.topic === topic).map(rule => ({
    rule,
    outcome: rule.evaluate(context),
    verses: VERSES[topic].filter(verse => rule.verses.includes(verse.verse)),
  }));
}

/** Verses of a topic that no rule judges (they need the war of the grahas or the daśā). */
export function notEvaluatedVerses(topic: TopicKey): TopicVerse[] {
  const used = new Set(TOPIC_RULES.filter(rule => rule.topic === topic).flatMap(rule => rule.verses));
  return VERSES[topic].filter(verse => !used.has(verse.verse));
}
