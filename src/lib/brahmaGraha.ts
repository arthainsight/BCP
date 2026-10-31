import { calculateCharaKarakas, type CharaKarakaCount, type CharaKarakaRankMode } from './karakas';
import { NINE, signLord, strongerGraha, strongerSign, toJaiminiChart, type Graha } from './jaiminiStrength';
import { SIGN_NAMES } from './signs';

/**
 * The Brahma graha by the text: Jaimini Sūtras 2.1.49–54 (with the commentary of Sītārāma Jhā) and BPHS 46.170–173, which say the same.
 *
 * 2.1.49 / BPHS 46.171: of the lords of the 6th, 8th and 12th (from the stronger of the Lagna and the 7th) the one that stands in an odd sign and
 *   "behind" (pṛṣṭha) the stronger of the two is Brahma. The commentary gives "behind": for the Lagna the arc from the 7th point to the Lagna
 *   point (the part of the zodiac from the 7th house round to the 12th), for the 7th the arc from the Lagna point to the 7th point.
 * 2.1.53 / 46.172: also the lord of the 8th from the Ātmakāraka and a graha in the 8th from it.
 * 2.1.50 / 46.172: if the one found is Saturn, Rāhu or Ketu, the graha in the 6th sign from it, or the lord of that sign, is Brahma instead.
 * 2.1.51–52 / 46.173: of several, the one with more degrees in its sign; with Rāhu, the reverse (its degrees are counted from the end of the
 *   sign); equal degrees: the stronger (2.1.54).
 *
 * What the text leaves open and what is taken: "the strong" among the lords of 6/8/12 is not defined, so every lord that stands in an odd sign
 * and behind the stronger of the Lagna and the 7th is a candidate and the degrees choose; the marks of 2.1.49 and 2.1.53 are alternatives, all
 * the graha that meet either are candidates.
 */
export interface BrahmaPlanet { name: string; sign: number; degree: number; longitude: number }

export interface BrahmaResult {
  graha: Graha | null;
  /** 1-based sign of the Brahma graha. */
  sign: number | null;
  /** How it was found, line by line (English), for the audit of the daśā. */
  steps: string[];
}

/** The Ātmakāraka: the graha with the most degrees in its sign (Rāhu's counted from the end of the sign). */
export function atmakarakaOf(planets: BrahmaPlanet[], karaka: { rankMode?: CharaKarakaRankMode; count?: CharaKarakaCount } = {}): Graha | undefined {
  const karakas = calculateCharaKarakas(
    planets.filter(planet => NINE.includes(planet.name as Graha)).map(planet => ({ ...planet, house: 0 })),
    karaka.rankMode ?? 'degree',
    karaka.count ?? 8,
  );
  return karakas.find(item => item.karaka === 'AK')?.planet as Graha | undefined;
}

const norm360 = (value: number) => ((value % 360) + 360) % 360;
const norm12 = (value: number) => ((value % 12) + 12) % 12;
/** Aries, Gemini… (0-based even index) are the odd signs. */
const isOddSign = (sign: number) => sign % 2 === 0;

export function brahmaByText(
  planets: BrahmaPlanet[],
  ascendantSign: number,
  ascendantLongitude: number,
  karaka: { rankMode?: CharaKarakaRankMode; count?: CharaKarakaCount } = {},
): BrahmaResult {
  const chart = toJaiminiChart(planets, ascendantSign);
  const steps: string[] = [];
  const name = (sign: number) => SIGN_NAMES[norm12(sign)];
  const signOf = (graha: Graha) => chart.positions[graha].sign;
  const seventh = norm12(chart.asc + 6);

  const base = strongerSign(chart, chart.asc, seventh);
  const baseIsLagna = base === chart.asc;
  steps.push(`Stronger of Lagna and 7th: ${name(base)} (${baseIsLagna ? 'the Lagna' : 'the 7th'}); "behind" it is the arc ${baseIsLagna ? 'from the 7th point to the Lagna point' : 'from the Lagna point to the 7th point'}`);
  const behind = (graha: Graha) => {
    const planet = planets.find(item => item.name === graha);
    if (!planet) return false;
    const distance = norm360(planet.longitude - ascendantLongitude);
    return baseIsLagna ? distance >= 180 : distance < 180;
  };

  const candidates: Graha[] = [];
  const add = (graha: Graha, why: string) => {
    steps.push(`${graha}: ${why}`);
    if (!candidates.includes(graha)) candidates.push(graha);
  };

  for (const house of [6, 8, 12]) {
    const lord = signLord(chart, base + house - 1);
    const odd = isOddSign(signOf(lord));
    const back = behind(lord);
    steps.push(`Lord of the ${house}th from ${name(base)}: ${lord} in ${name(signOf(lord))} (${odd ? 'odd' : 'even'} sign, ${back ? 'behind' : 'not behind'})`);
    if (odd && back) add(lord, `lord of the ${house}th, in an odd sign and behind (2.1.49)`);
  }

  const atmakaraka = atmakarakaOf(planets, karaka);
  if (atmakaraka) {
    const eighth = norm12(signOf(atmakaraka) + 7);
    const eighthLord = signLord(chart, eighth);
    steps.push(`Ātmakāraka ${atmakaraka} in ${name(signOf(atmakaraka))}; its 8th is ${name(eighth)}`);
    add(eighthLord, `lord of the 8th from the Ātmakāraka (2.1.53)`);
    for (const graha of NINE) if (signOf(graha) === eighth) add(graha, 'in the 8th from the Ātmakāraka (2.1.53)');
  }

  // 2.1.50: Saturn, Rāhu or Ketu give way to the graha in the 6th from them, or the lord of that sign.
  const resolved: Graha[] = [];
  for (const graha of candidates) {
    if (graha === 'Saturn' || graha === 'Rahu' || graha === 'Ketu') {
      const sixth = norm12(signOf(graha) + 5);
      const occupants = NINE.filter(other => signOf(other) === sixth);
      const replacements = [...occupants, signLord(chart, sixth)];
      steps.push(`${graha} gives way to the 6th from it (${name(sixth)}): ${[...new Set(replacements)].join(', ')} (2.1.50)`);
      for (const other of replacements) if (!resolved.includes(other)) resolved.push(other);
    } else if (!resolved.includes(graha)) resolved.push(graha);
  }

  if (resolved.length === 0) {
    steps.push('No graha meets the marks of the text');
    return { graha: null, sign: null, steps };
  }
  // 2.1.51–52: the most degrees; Rāhu's are counted from the end of the sign; equal: the stronger (2.1.54).
  const effective = (graha: Graha) => graha === 'Rahu' ? 30 - chart.positions[graha].degree : chart.positions[graha].degree;
  let best = resolved[0];
  for (const graha of resolved.slice(1)) {
    const a = effective(graha);
    const b = effective(best);
    if (a > b || (a === b && strongerGraha(chart, graha, best) === graha)) best = graha;
  }
  if (resolved.length > 1) steps.push(`Of ${resolved.join(', ')} the one with the most degrees: ${best} (2.1.51–52)`);
  steps.push(`Brahma: ${best} in ${name(signOf(best))}`);
  return { graha: best, sign: signOf(best) + 1, steps };
}
