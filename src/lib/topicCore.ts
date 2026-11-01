import { EXALTATION, NATURAL_ENEMIES, OWN_SIGNS, DEBILITATION } from './dignity';
import { SIGN_LORDS } from './signs';
import type { TopicVerse } from './topicVerses';

/**
 * What the topic yogas (topicYogas.ts) share: the shape of a rule and the small questions of a chart that the rules ask. A rule carries the chapter and verses it is read from and decides from the chart whether
 * it is met (true), not met (false) or cannot be judged (null). "Strong" (bali) is the Ṣaḍbala of the graha at or over the strength it needs (the ratio of the Ṣaḍbala panel is 1 or more); the text does not define it.
 */
export type TopicKey = 'spirituality' | 'marriage' | 'longevity' | 'wealth' | 'illness' | 'houses' | 'phalaHouses' | 'woman';
/** The classic a topic is read from: the Bṛhat Parāśara Horā Śāstra (the default) or the Phaladīpikā. */
export type TopicText = 'bphs' | 'phala';

export type SevenGraha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export const SEVEN: readonly SevenGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export interface TopicPlanet { name: string; sign: number; degree: number; longitude: number; isRetrograde?: boolean }
export interface TopicContext {
  planets: TopicPlanet[];
  ascendantSign: number;
  /** The sidereal longitude of the lagna, when known; the rules that need its navāṁśa cannot be judged without it. */
  ascendantLongitude?: number;
  /** Ṣaḍbala against what each graha needs; 1 or more is strong. A graha missing from it cannot be judged. */
  ratio: Partial<Record<SevenGraha, number>>;
}

export interface RuleOutcome { met: boolean | null; lines: string[] }

export interface TopicYogaRule {
  id: string;
  topic: TopicKey;
  /** The chapter of the classic and the verses of it that the rule comes from. */
  chapter: number;
  /** The classic; the BPHS when not given. */
  text?: 'phala';
  verses: number[];
  name: string;
  /** What the text says follows. */
  effect: string;
  evaluate: (context: TopicContext) => RuleOutcome;
}

export type { TopicVerse };

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
export const signName = (sign: number) => SIGN_NAMES[sign - 1];
export const ordinalEn = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

// ── the chart ──────────────────────────────────────────────────────────────────────────────────────────────────
export const find = (context: TopicContext, name: string) => context.planets.find(planet => planet.name === name);
export const signOf = (context: TopicContext, name: string) => find(context, name)?.sign ?? null;
/** The house (from the Lagna) of a sign, 1–12. */
export const houseOfSign = (context: TopicContext, sign: number) => ((sign - context.ascendantSign + 12) % 12) + 1;
export const houseOf = (context: TopicContext, name: string): number | null => { const sign = signOf(context, name); return sign === null ? null : houseOfSign(context, sign); };
/** The sign of house `house` from the Lagna. */
export const signOfHouse = (context: TopicContext, house: number) => ((context.ascendantSign - 1 + house - 1) % 12) + 1;
export const lordOfSign = (sign: number) => SIGN_LORDS[sign - 1] as SevenGraha;
export const lordOfHouse = (context: TopicContext, house: number) => lordOfSign(signOfHouse(context, house));
export const lordHouse = (context: TopicContext, house: number) => houseOf(context, lordOfHouse(context, house));
export const grahasInHouse = (context: TopicContext, house: number) => context.planets.filter(planet => houseOfSign(context, planet.sign) === house).map(planet => planet.name);
/** Whether two grahas are in one sign. */
export const together = (context: TopicContext, a: string, b: string) => { const x = signOf(context, a); return x !== null && x === signOf(context, b); };
/** The sign `count` signs on from a graha's (count 7 = the 7th from it). */
export const fromGraha = (context: TopicContext, name: string, count: number) => { const sign = signOf(context, name); return sign === null ? null : ((sign - 1 + count - 1) % 12) + 1; };

// ── strength and nature ────────────────────────────────────────────────────────────────────────────────────────
export const isStrong = (context: TopicContext, name: string): boolean | null => {
  const value = context.ratio[name as SevenGraha];
  return value === undefined ? null : value >= 1;
};
/** Whether the Moon is waxing (the benefic Moon) at the chart's moment. */
export const moonWaxing = (context: TopicContext): boolean => {
  const sun = find(context, 'Sun');
  const moon = find(context, 'Moon');
  return sun && moon ? ((moon.longitude - sun.longitude + 360) % 360) < 180 : true;
};
export const MALEFICS: readonly string[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
/** The natural malefics (the Moon is one when waning). */
export const isMalefic = (context: TopicContext, name: string) => MALEFICS.includes(name) || (name === 'Moon' && !moonWaxing(context));
export const isBenefic = (context: TopicContext, name: string) => ['Jupiter', 'Venus', 'Mercury'].includes(name) || (name === 'Moon' && moonWaxing(context));
export const ownOrExalted = (name: string, sign: number) => OWN_SIGNS[name]?.includes(sign) === true || EXALTATION[name] === sign;
export const debilitated = (name: string, sign: number) => DEBILITATION[name] === sign;
export const inEnemySign = (name: string, sign: number) => NATURAL_ENEMIES[name]?.includes(lordOfSign(sign)) === true;

// ── aspects (whole signs): the 7th for all; Mars the 4th and 8th, Jupiter the 5th and 9th, Saturn the 3rd and 10th; Rāhu and Ketu do not aspect here ──
const ASPECTS: Record<string, number[]> = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
export const aspectsSign = (graha: string, from: number, target: number) => (ASPECTS[graha] ?? [7]).includes(((target - from + 12) % 12) + 1);
/** The grahas (of the seven) that aspect a sign, except `exclude`. */
export const aspectors = (context: TopicContext, target: number, exclude = ''): SevenGraha[] =>
  SEVEN.filter(name => name !== exclude).filter(name => { const body = find(context, name); return body ? aspectsSign(name, body.sign, target) : false; });
export const conjunctWith = (context: TopicContext, name: string, group: (n: string) => boolean): string[] =>
  context.planets.filter(planet => planet.name !== name && group(planet.name) && together(context, name, planet.name)).map(planet => planet.name);

export const drekkanaSign = (sign: number, degree: number) => ((sign - 1 + Math.min(2, Math.floor(degree / 10)) * 4) % 12) + 1;

/** A rule whose graha is missing from the chart, or whose strength is not known, cannot be judged. */
export const cannot = (why: string): RuleOutcome => ({ met: null, lines: [why] });

// ── relations between two grahas, shared by the rule files ─────────────────────────────────────────────────────
/** Whether `from` (one of the seven) aspects the sign of `to`. */
export const sees = (context: TopicContext, from: string, to: string) => {
  const a = find(context, from); const b = find(context, to);
  return Boolean(a && b && (SEVEN as readonly string[]).includes(from) && from !== to && aspectsSign(from, a.sign, b.sign));
};
/** Whether `from` (one of the seven) aspects a sign. */
export const seesSign = (context: TopicContext, from: string, sign: number) => {
  const a = find(context, from);
  return Boolean(a && (SEVEN as readonly string[]).includes(from) && aspectsSign(from, a.sign, sign));
};
/** Whether `by` is in one sign with `target` or aspects it. */
export const joinedOrSeen = (context: TopicContext, target: string, by: string) => by !== target && (together(context, target, by) || sees(context, by, target));
export const mixed = (items: string[]) => (items.length ? items.join(', ') : 'none');
/** "Mars in the 5th" for the lines of evidence. */
export const where = (context: TopicContext, name: string) => { const house = houseOf(context, name); return house === null ? `${name} (missing)` : `${name} in the ${ordinalEn(house)}`; };
/** Whether the signs before and after `sign` both hold a graha of the group (hemmed between them, pāpamadhya). */
export const hemmedBy = (context: TopicContext, sign: number, group: (name: string) => boolean, exclude = '') => {
  const near = (target: number) => context.planets.some(planet => planet.sign === target && planet.name !== exclude && group(planet.name));
  return near(((sign + 10) % 12) + 1) && near((sign % 12) + 1);
};

// ── small questions about houses and nature, shared by the rule files ──
export const has = (house: number | null, list: number[]) => house !== null && list.includes(house);
export const maleficsIn = (context: TopicContext, house: number) => grahasInHouse(context, house).filter(name => isMalefic(context, name));
export const beneficsIn = (context: TopicContext, house: number) => grahasInHouse(context, house).filter(name => isBenefic(context, name));
export const beneficsSeeingSign = (context: TopicContext, sign: number) => SEVEN.filter(name => isBenefic(context, name) && seesSign(context, name, sign));
export const maleficsSeeing = (context: TopicContext, name: string) => SEVEN.filter(other => isMalefic(context, other) && sees(context, other, name));
export const beneficsSeeing = (context: TopicContext, name: string) => SEVEN.filter(other => isBenefic(context, other) && sees(context, other, name));
export const withMalefics = (context: TopicContext, name: string) => context.planets.map(planet => planet.name).filter(other => other !== name && isMalefic(context, other) && together(context, name, other));
