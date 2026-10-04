// Jaimini strength rules used by the rāśi daśās: the stronger of two signs,
// the stronger of Scorpio's and Aquarius's two lords, sign ownership with
// those co-lords, the Nārāyaṇa period length, and Brahma.
//
// The rules follow P.V.R. Narasimha Rao's "Vedic Astrology: An Integrated
// Approach" as implemented in PyJHora (horoscope/chart/house.py, v4.8.7),
// which reproduces the book's worked examples. PyJHora is followed exactly,
// including three behaviours that look accidental, so that results can be
// checked against it chart for chart; each is marked "PyJHora:" below.
//
// Only the nine grahas take part. Uranus, Neptune and Pluto are ignored.
// Signs are 0-based here (0 = Aries).

export const NINE = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export type Graha = typeof NINE[number];

export interface JaiminiChart {
  /** 0-based ascendant sign. */
  asc: number;
  /** 0-based sign and degree within the sign, for each of the nine grahas. */
  positions: Record<Graha, { sign: number; degree: number }>;
}

/** Build a JaiminiChart from 1-based app planet data. Outer planets are dropped. */
export function toJaiminiChart(planets: { name: string; sign: number; degree: number }[], ascSignOneBased: number): JaiminiChart {
  const positions = {} as JaiminiChart['positions'];
  for (const name of NINE) {
    const p = planets.find((planet) => planet.name === name);
    positions[name] = { sign: p ? (p.sign - 1 + 12) % 12 : 0, degree: p?.degree ?? 0 };
  }
  return { asc: (ascSignOneBased - 1 + 12) % 12, positions };
}

const norm = (n: number) => ((n % 12) + 12) % 12;
const isOdd = (sign: number) => sign % 2 === 0; // Aries, Gemini, … are odd signs
const MOVABLE = [0, 3, 6, 9];
const FIXED = [1, 4, 7, 10];
const modalityRank = (sign: number) => (MOVABLE.includes(sign) ? 1 : FIXED.includes(sign) ? 2 : 3);
export const EVEN_FOOTED = [3, 4, 5, 9, 10, 11];

/** Simple sign lords; Scorpio and Aquarius give Mars and Saturn here. */
export const SIGN_LORD: Graha[] = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

// Dignity of each graha in each sign: 5 own, 4 exalted, 3 friend, 2 neutral,
// 1 enemy, 0 debilitated. PyJHora's const.house_strengths_of_planets.
const EXALTED = 4, FRIEND = 3;
const DIGNITY: Record<Graha, number[]> = {
  Sun: [4, 1, 2, 2, 5, 2, 0, 3, 3, 1, 1, 3],
  Moon: [2, 4, 3, 5, 3, 3, 2, 0, 2, 2, 2, 2],
  Mars: [5, 2, 1, 0, 3, 1, 2, 5, 3, 4, 2, 3],
  Mercury: [2, 3, 5, 1, 3, 5, 3, 2, 2, 2, 2, 0],
  Jupiter: [3, 1, 1, 4, 3, 3, 1, 3, 5, 0, 2, 5],
  Venus: [2, 5, 3, 1, 1, 0, 5, 2, 3, 3, 3, 4],
  Saturn: [0, 3, 3, 1, 1, 3, 4, 1, 2, 5, 5, 2],
  Rahu: [1, 4, 4, 1, 1, 3, 3, 0, 0, 3, 1, 3],
  Ketu: [1, 0, 0, 1, 1, 3, 3, 4, 4, 3, 1, 3],
};
export function dignity(graha: Graha, sign: number): number {
  return DIGNITY[graha][sign];
}

/** Signs a sign casts rāśi dṛṣṭi on: movable ↔ fixed except the adjacent one, dual ↔ the other duals. */
function rasiAspects(sign: number): number[] {
  const all = Array.from({ length: 12 }, (_, i) => i);
  const adjacent = (a: number, b: number) => norm(a - b) === 1 || norm(b - a) === 1;
  if (modalityRank(sign) === 1) return all.filter((t) => modalityRank(t) === 2 && !adjacent(sign, t));
  if (modalityRank(sign) === 2) return all.filter((t) => modalityRank(t) === 1 && !adjacent(sign, t));
  return all.filter((t) => modalityRank(t) === 3 && t !== sign);
}

/** Grahas whose sign casts rāśi dṛṣṭi on `sign`. */
function grahasAspecting(chart: JaiminiChart, sign: number): Graha[] {
  return NINE.filter((g) => rasiAspects(chart.positions[g].sign).includes(sign));
}

const signOf = (chart: JaiminiChart, g: Graha) => chart.positions[g].sign;

/**
 * Jupiter, Mercury and the given lord conjoining or aspecting a sign: the
 * second strength rule for both signs and co-lords.
 *
 * PyJHora: the conjunction test compares the lord's planet number with the
 * sign number rather than the lord's sign, so for the lord it is effectively
 * "lord's index equals sign index". Kept for parity.
 */
function jupiterMercuryLordScore(chart: JaiminiChart, sign: number, lord: Graha): number {
  const lordIndex = NINE.indexOf(lord);
  let score = [signOf(chart, 'Mercury'), signOf(chart, 'Jupiter'), lordIndex].filter((s) => s === sign).length;
  const aspecting = grahasAspecting(chart, sign);
  score += (['Mercury', 'Jupiter', lord] as Graha[]).filter((g) => aspecting.includes(g)).length;
  return score;
}

const CO_LORD_SIGN: Partial<Record<Graha, number>> = { Rahu: 10, Ketu: 7 };

/** Rules 1–4 for two grahas; null when they tie through all four. */
function strongerGrahaByRules(chart: JaiminiChart, a: Graha, b: Graha): Graha | null {
  if (a === b) return a;
  const ha = signOf(chart, a);
  const hb = signOf(chart, b);
  const node = CO_LORD_SIGN[a] ?? CO_LORD_SIGN[b];
  // A co-lord sitting in the sign it rules yields to the one that is elsewhere.
  if (node !== undefined) {
    if (ha === node && hb !== node) return b;
    if (hb === node && ha !== node) return a;
  }
  // Rule 1: more grahas with it. PyJHora: the ascendant counts as company here.
  const company = (h: number) => NINE.filter((g) => signOf(chart, g) === h).length + (chart.asc === h ? 1 : 0) - 1;
  if (company(ha) !== company(hb)) return company(ha) > company(hb) ? a : b;
  // Rule 2: Jupiter, Mercury and the dispositor joining or aspecting it.
  const sa = jupiterMercuryLordScore(chart, ha, SIGN_LORD[ha]);
  const sb = jupiterMercuryLordScore(chart, hb, SIGN_LORD[hb]);
  if (sa !== sb) return sa > sb ? a : b;
  // Rule 3: exaltation. PyJHora: only the first graha can win this rule.
  if (dignity(a, ha) === EXALTED && dignity(a, ha) > dignity(b, hb)) return a;
  // Rule 4: dual over fixed over movable, by the sign occupied.
  if (modalityRank(ha) !== modalityRank(hb)) return modalityRank(ha) > modalityRank(hb) ? a : b;
  return null;
}

/**
 * The stronger of two grahas. During a daśā, a tie is broken by the longer
 * Nārāyaṇa period of the signs they occupy; otherwise, and after that, by the
 * higher degree within the sign.
 */
export function strongerGraha(chart: JaiminiChart, a: Graha, b: Graha, duringDasha = false): Graha {
  const byRules = strongerGrahaByRules(chart, a, b);
  if (byRules) return byRules;
  if (duringDasha) {
    const da = narayanaYears(chart, signOf(chart, a));
    const db = narayanaYears(chart, signOf(chart, b));
    if (da !== db) return da > db ? a : b;
  }
  return chart.positions[a].degree > chart.positions[b].degree ? a : b;
}

/** Lord of a sign, taking the stronger co-lord for Scorpio (Mars/Ketu) and Aquarius (Saturn/Rahu). */
export function signLord(chart: JaiminiChart, sign: number, duringDasha = false): Graha {
  const s = norm(sign);
  if (s === 7) return strongerGraha(chart, 'Mars', 'Ketu', duringDasha);
  if (s === 10) return strongerGraha(chart, 'Saturn', 'Rahu', duringDasha);
  return SIGN_LORD[s];
}

/**
 * The stronger of two signs: (1) more grahas, (2) more of Jupiter, Mercury and
 * the sign lord joining or aspecting it, (3) an exalted graha in it, (4) its
 * lord in a sign of the other parity, (5) dual over fixed over movable,
 * (6) its lord further advanced in its own sign.
 */
export function strongerSign(chart: JaiminiChart, r1: number, r2: number): number {
  const count = (r: number) => NINE.filter((g) => signOf(chart, g) === r).length;
  if (count(r1) !== count(r2)) return count(r1) > count(r2) ? r1 : r2;

  const s1 = jupiterMercuryLordScore(chart, r1, SIGN_LORD[r1]);
  const s2 = jupiterMercuryLordScore(chart, r2, SIGN_LORD[r2]);
  if (s1 !== s2) return s1 > s2 ? r1 : r2;

  const exalted = (r: number) => NINE.some((g) => signOf(chart, g) === r && dignity(g, r) === EXALTED);
  if (exalted(r1) && !exalted(r2)) return r1;
  if (exalted(r2) && !exalted(r1)) return r2;

  const otherParity = (r: number) => isOdd(r) !== isOdd(signOf(chart, SIGN_LORD[r]));
  if (otherParity(r1) && !otherParity(r2)) return r1;
  if (otherParity(r2) && !otherParity(r1)) return r2;

  if (modalityRank(r1) !== modalityRank(r2)) return modalityRank(r1) > modalityRank(r2) ? r1 : r2;

  const l1 = signLord(chart, r1);
  const l2 = signLord(chart, r2);
  return chart.positions[l1].degree > chart.positions[l2].degree ? r1 : r2;
}

/**
 * Nārāyaṇa period of a sign in years: count from the sign to its lord (in
 * reverse for even-footed signs), less one; 12 when the lord is in the sign;
 * one more if the lord is exalted, one less if debilitated. Can be 0.
 */
export function narayanaYears(chart: JaiminiChart, sign: number): number {
  const s = norm(sign);
  const lord = signLord(chart, s);
  const lordSign = signOf(chart, lord);
  let years = (EVEN_FOOTED.includes(s) ? norm(s - lordSign) : norm(lordSign - s));
  if (years <= 0) years = 12;
  const d = dignity(lord, lordSign);
  if (d === EXALTED) years += 1;
  else if (d === 0) years -= 1;
  return years;
}

/**
 * Brahma: among the lords of the 6th, 8th and 12th from the stronger of
 * lagna and 7th (nodes excluded), score one point each for a friendly or
 * better sign, an odd sign, and a place in the first seven signs from that
 * stronger sign; the stronger of the two best-scoring lords is Brahma.
 */
export function brahma(chart: JaiminiChart): Graha {
  const sp = strongerSign(chart, chart.asc, norm(chart.asc + 6));
  const lords = [5, 7, 11]
    .map((h) => signLord(chart, sp + h))
    .filter((g) => g !== 'Rahu' && g !== 'Ketu')
    .filter((g, i, all) => all.indexOf(g) === i);
  const score = (g: Graha) => {
    const h = signOf(chart, g);
    return (dignity(g, h) >= FRIEND ? 1 : 0) + (isOdd(h) ? 1 : 0) + (norm(h - sp) <= 6 ? 1 : 0);
  };
  // A stable sort keeps the 6th–8th–12th order among equal scores.
  const best = [...lords].sort((x, y) => score(y) - score(x)).slice(0, 2);
  if (best.length === 1) return best[0];
  return strongerGraha(chart, best[0], best[1]);
}
