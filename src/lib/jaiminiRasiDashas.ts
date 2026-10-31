import { narayanaYears, strongerSign, strongerSignByRules, type JaiminiChart } from './jaiminiStrength';

/**
 * The orders and the years of the rāśi daśās of the Jaimini Sūtras (adhyāya 2, with the commentary of Sītārāma Jhā) and BPHS 46.174–190:
 * Kendrādi (the Mūla of the app), Yogārdha, Dṛg, Trikoṇa and Śūla. Signs are 0-based here (0 = Aries).
 */
const norm = (value: number) => ((value % 12) + 12) % 12;
/** Aries, Gemini… (0-based even index) are the odd signs. */
export const isOddSign = (sign: number) => sign % 2 === 0;
const MOVABLE = (sign: number) => sign % 3 === 0;
const FIXED = (sign: number) => sign % 3 === 1;

/** The years of a sign in the Chara daśā of the Sūtras (2.3.26–29): the count to its lord less one, at least a year. */
export const charaYears = (chart: JaiminiChart, sign: number) => Math.max(1, narayanaYears(chart, sign));
/** The years of a sign in the Sthira daśā (2.3.3–4): 7 for movable, 8 for fixed, 9 for dual signs. */
export const sthiraYears = (sign: number) => MOVABLE(sign) ? 7 : FIXED(sign) ? 8 : 9;

/**
 * The stronger of two signs for the orders below: the rules of strength (more grahas, Jupiter and Mercury and the lord, an exalted graha, the
 * lord in the other parity, dual over fixed over movable), then the one with more years ("rāśibalasamānatve bahuvarṣo balī bhavet", quoted in
 * the commentary), then the lord further on in its sign.
 */
export function strongerOf(chart: JaiminiChart, a: number, b: number): number {
  const byRules = strongerSignByRules(chart, a, b);
  if (byRules !== null) return byRules;
  const yearsA = charaYears(chart, a);
  const yearsB = charaYears(chart, b);
  if (yearsA !== yearsB) return yearsA > yearsB ? a : b;
  return strongerSign(chart, a, b);
}

/** The strongest of several signs. */
export function strongestOf(chart: JaiminiChart, signs: number[]): number {
  return signs.reduce((best, sign) => strongerOf(chart, best, sign));
}

/** The signs ranked from the strongest. */
export function rankByStrength(chart: JaiminiChart, signs: number[]): number[] {
  const remaining = [...signs];
  const ranked: number[] = [];
  while (remaining.length) {
    const best = strongestOf(chart, remaining);
    ranked.push(best);
    remaining.splice(remaining.indexOf(best), 1);
  }
  return ranked;
}

/**
 * The Kendrādi rāśi daśā order from a sign (2.4.11–14): the sign itself, then the angles, then the 2nd, 5th, 8th and 11th, then the 3rd, 6th, 9th
 * and 12th, each group by strength. The houses are counted in order from an odd sign and from the 7th of an even one in reverse (the commentary).
 */
export function kendradiOrder(chart: JaiminiChart, start: number): number[] {
  const odd = isOddSign(start);
  const house = (number: number) => norm(odd ? start + number - 1 : start + 6 - (number - 1));
  const group = (numbers: number[]) => rankByStrength(chart, numbers.map(house).filter(sign => sign !== start));
  return [start, ...group([1, 4, 7, 10]), ...group([2, 5, 8, 11]), ...group([3, 6, 9, 12])];
}

/** The Kendrādi daśā begins from the stronger of the Ātmakāraka's sign and its 7th (2.4.13, the commentary). */
export function kendradiStart(chart: JaiminiChart, karakaSign: number): number {
  return strongerOf(chart, karakaSign, norm(karakaSign + 6));
}

/** Yogārdha (2.4.19–20, BPHS 46.174): the stronger of the Lagna and the 7th, then the twelve signs in order; the years half the Chara and the Sthira years. */
export function yogardhaYears(chart: JaiminiChart, sign: number): number {
  return (charaYears(chart, sign) + sthiraYears(sign)) / 2;
}
export function yogardhaOrder(chart: JaiminiChart, start: number): number[] {
  return Array.from({ length: 12 }, (_, index) => norm(start + index));
}

/**
 * The signs a sign gives its glance to, as the Dṛg daśā takes them (2.4.22–23, BPHS 46.187), the nearer ones first: a movable sign counts them
 * backwards and a fixed one forwards, the 3rd, 6th and 9th (the signs of the other kind but the adjacent one); a dual sign the 4th, 7th and 10th
 * (the other duals), forwards from Gemini and Sagittarius and backwards from Virgo and Pisces.
 */
export function drigAspected(sign: number): number[] {
  const direction = MOVABLE(sign) ? -1 : FIXED(sign) ? 1 : isOddSign(sign) ? 1 : -1;
  const counts = sign % 3 === 2 ? [4, 7, 10] : [3, 6, 9];
  return counts.map(count => norm(sign + direction * (count - 1)));
}

/** Dṛg (2.4.21–23, BPHS 46.185–186): the 9th from the Lagna with the signs it glances at, then the 10th with its, then the 11th with its. A sign already placed is not placed twice. */
export function drigOrder(ascendant: number): number[] {
  const order: number[] = [];
  for (const house of [9, 10, 11]) {
    const sign = norm(ascendant + house - 1);
    for (const next of [sign, ...drigAspected(sign)]) if (!order.includes(next)) order.push(next);
  }
  return order;
}

/** Trikoṇa (2.4.24–25, BPHS 46.183–184): from the strongest of the Lagna, the 5th and the 9th, each sign with its 5th and 9th; four such groups in the order of the start. */
export function trikonaOrder(chart: JaiminiChart, ascendant: number): { start: number; order: number[] } {
  const start = strongestOf(chart, [ascendant, norm(ascendant + 4), norm(ascendant + 8)]);
  const direction = isOddSign(start) ? 1 : -1;
  const order: number[] = [];
  for (let group = 0; group < 4; group++) {
    const head = norm(start + direction * group);
    order.push(head, norm(head + direction * 4), norm(head + direction * 8));
  }
  return { start, order };
}

/**
 * The Maṇḍūka ("frog") order (Jaimini Sūtras 2.4.15–16, "sthūlādarśavaiṣamyāśrayo maṇḍūkas trikūṭaḥ", with the verse quoted by the commentary): from the stronger of a sign and
 * its 7th, direct from an odd sign and reverse from an even one, the sign itself and then every third sign (the angles), then the signs after it in the same jumps, so that the
 * 1st, 4th, 7th, 10th, 2nd, 5th, 8th, 11th, 3rd, 6th, 9th and 12th are taken in turn. The commentary's two examples (Taurus in reverse, Sagittarius direct) are in the tests.
 */
export function mandookaOrder(start: number): number[] {
  const direction = isOddSign(start) ? 1 : -1;
  return [0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11].map(step => norm(start + direction * step));
}
/** The sign the Maṇḍūka order of a sign begins from: the stronger of the sign and its 7th. */
export function mandookaStart(chart: JaiminiChart, sign: number): number {
  return strongerOf(chart, sign, norm(sign + 6));
}

/** The house the Śūla daśā is read from, by the person it is read for (2.3.18–25). */
export const SHULA_HOUSES = { self: 8, father: 9, mother: 4, 'younger-brother': 3, 'sister-or-child': 5, 'elder-brother': 11 } as const;

/** Śūla (2.3.18–25, BPHS 46.181–182): from the stronger of that house from the Lagna and from the 7th, direct from an odd sign and reverse from an even one; the years as in the Sthira. */
export function shulaOrder(chart: JaiminiChart, ascendant: number, house: number): { start: number; order: number[] } {
  const start = strongerOf(chart, norm(ascendant + house - 1), norm(ascendant + 6 + house - 1));
  const direction = isOddSign(start) ? 1 : -1;
  return { start, order: Array.from({ length: 12 }, (_, index) => norm(start + direction * index)) };
}
