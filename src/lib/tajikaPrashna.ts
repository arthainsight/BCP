import { tajikaAspect, signLord, haddaLord, type TajikaAspect } from './varshaphala';
import { DEBILITATION, EXALTATION, NATURAL_ENEMIES, OWN_SIGNS } from './dignity';
import { combustionOf } from './combustion';
import { navamshaSign } from './birthConditions';
import { drekkanaSign } from './topicCore';

/**
 * The Tājika yogas of a question, after the Tājika Nīlakaṇṭhī (Saṃjñātantra, "ṣoḍaśayogādhyāya", and the Praśnatantra that uses them), with the commentary of Mahīdhara. A question is read in the chart of its
 * moment and place: the lord of the Lagna stands for the one who asks, the lord of the house of the matter for the matter (the houses of 49–56). Whether the two come together is the question:
 *
 * * **Ithasāla** (4–9): the two have a Tājika aspect between their signs, the swifter behind the slower in the degrees of its sign and within its dīptāṁśa: the matter is brought about;
 * * **Īśarāpha** (10): the swifter has gone beyond the slower by a degree: what was to be done turns away;
 * * **Nakta** (11–13): the two have no aspect; a third graha swifter than both, with degrees between theirs and an aspect to both within its own dīptāṁśa, takes the light of the one behind and gives it to the one in front: the matter comes by another's hand;
 * * **Kambūla** (21–): the Ithasāla of the two and the Ithasāla of the Moon with one of them or both: it comes about, and better as the Moon is stronger.
 *
 * * **Yamayā** (28–30, v3.89): the two have no aspect; a graha slower than both aspects both within its own dīptāṁśa and takes the light of the swifter and gives it to the slower: the matter comes through a third;
 * * **Maṇaū** (31–35, v3.89): the two have the Ithasāla, and Mars or Saturn, in the same sign as the swifter or in its 4th or 7th and within the dīptāṁśa of the swifter, takes its light: the matter is destroyed;
 * * **Ikkavāla** and **Indūvāra** (17): all the seven grahas in the kendras and paṇapharas, or all in the āpoklimas of the chart.
 *
 * The Yamayā, Maṇaū, Ikkavāla and Indūvāra are read in the Naval Kishore edition with the Hindi commentary of Pt. Shaktichar Shukla (`in.ernet.dli.2015.329420`), where they are legible; the edition used for the earlier yogas has them broken.
 * * **Gairikambūla** (57–60), **Khallāsara** (61), **Radda** (62–63), **Duphāli-kuttha** (64), **Duttotthadavīra** (65), **Tambīra** (66) (v3.99): the other yogas of the sixteen that read the chart as it stands, and the marks of a strong graha (**Kuttha**, 67–70) and of a weak one (**Duruppha**, 71–75), which the others use.
 * Readings: the "pada" (place of authority) of a graha is its own sign, its exaltation, its own hadda, drekkāṇa or navāṁśa; the Moon is "void" (śūnyamārga) with none of those and not in its fall; "weak" is combust (by the orbs of the app), in its fall, in an enemy's sign or retrograde; the last degree is the 30th (29° and over).
 * Not built: the sixteen kinds of the Kambūla, the Maṇaū of the second kind (2.34), and the results of the verses that depend on the nature of the grahas.
 */
export type TajikaGraha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export const TAJIKA_GRAHAS: readonly TajikaGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/** The dīptāṁśa of each graha (the commentary of 2.13): the orb within which its aspect and its yogas give their result. Some count 12 for all. */
export const DIPTAMSHA: Record<TajikaGraha, number> = { Sun: 15, Moon: 12, Mars: 8, Mercury: 7, Jupiter: 9, Venus: 7, Saturn: 9 };

/** The mean daily motions, for a graha whose speed is not known. */
const MEAN_SPEED: Record<TajikaGraha, number> = { Sun: 0.99, Moon: 13.2, Mars: 0.52, Mercury: 1.4, Jupiter: 0.08, Venus: 1.2, Saturn: 0.03 };

export interface PrashnaBody { name: string; sign: number; degree: number; speed?: number }

const speedOf = (body: PrashnaBody) => Math.abs(body.speed ?? MEAN_SPEED[body.name as TajikaGraha] ?? 0);

/** The matter of each house (the commentary of 49–56, in short). */
export const HOUSE_MATTERS: Record<number, string> = {
  1: 'the body, its looks and age, strength, joy and sorrow, character',
  2: 'gold, silver, jewels, metals, wealth and friends',
  3: 'brothers and sisters, servants, journeys, courage, enterprise',
  4: 'the mother, happiness, friends, kin, vehicles, land, the home',
  5: 'children, counsel, learning, the womb',
  6: 'sickness, enemies, four-footed animals, wounds',
  7: 'the wife, trade, things lost, forgetting',
  8: 'death, stored wealth, debts, a fortress, mental distress',
  9: 'faith, the father, journeys, good deeds, fortune',
  10: 'the kingdom, work, honour, the father\'s line',
  11: 'gain of every kind: grain, gold, friends, cattle, the king\'s wealth',
  12: 'expense, imprisonment, the eyes and ears, base deeds',
};

export type YogaKind = 'ithasala' | 'isarapha';
export interface PairYoga {
  kind: YogaKind;
  fast: string;
  slow: string;
  aspect: Exclude<TajikaAspect, null>;
  /** Degrees by which the slower is ahead of the swifter (negative when the swifter is past it). */
  gap: number;
  /** The dīptāṁśa of the swifter. */
  orb: number;
}

/** The Ithasāla or Īśarāpha of two grahas, or null when there is none. */
export function pairYoga(a: PrashnaBody, b: PrashnaBody): PairYoga | null {
  const aspect = tajikaAspect(a.sign, b.sign);
  if (!aspect) return null;
  const [fast, slow] = speedOf(a) >= speedOf(b) ? [a, b] : [b, a];
  const orb = DIPTAMSHA[fast.name as TajikaGraha];
  const gap = slow.degree - fast.degree;
  // Behind the slower and within the dīptāṁśa of the swifter, or only just past it (under a degree): Ithasāla.
  if (gap > -1 && gap <= orb) return { kind: 'ithasala', fast: fast.name, slow: slow.name, aspect, gap, orb };
  // A degree or more past it, within the dīptāṁśa: Īśarāpha.
  if (gap <= -1 && -gap <= orb) return { kind: 'isarapha', fast: fast.name, slow: slow.name, aspect, gap, orb };
  return null;
}

export interface NaktaYoga { carrier: string; behind: string; ahead: string; fromBehind: number; toAhead: number }

/** The Nakta of two grahas that have no aspect: a graha swifter than both, between them in degrees, with an aspect to both within its own dīptāṁśa. */
export function naktaYogas(a: PrashnaBody, b: PrashnaBody, others: PrashnaBody[]): NaktaYoga[] {
  if (tajikaAspect(a.sign, b.sign)) return [];
  const [behind, ahead] = a.degree <= b.degree ? [a, b] : [b, a];
  return others
    .filter(other => other.name !== a.name && other.name !== b.name && speedOf(other) > speedOf(a) && speedOf(other) > speedOf(b))
    .filter(other => tajikaAspect(other.sign, behind.sign) && tajikaAspect(other.sign, ahead.sign))
    .filter(other => other.degree > behind.degree && other.degree < ahead.degree)
    .filter(other => other.degree - behind.degree <= DIPTAMSHA[other.name as TajikaGraha] && ahead.degree - other.degree <= DIPTAMSHA[other.name as TajikaGraha])
    .map(other => ({ carrier: other.name, behind: behind.name, ahead: ahead.name, fromBehind: other.degree - behind.degree, toAhead: ahead.degree - other.degree }));
}

export type MoonGrade = 'uttama' | 'madhyama' | 'adhama' | 'sama';

/**
 * The grade of the Moon in the Kambūla (the commentary of 22): the best in its own or its exaltation sign (Cancer, Taurus), the middle one in a sign of its friends' (the text names the
 * hadda, drekkāṇa and navāṁśa of its own; the Moon has no hadda, so those are not taken), the lowest in its debilitation (Scorpio), and the equal one otherwise.
 */
export function moonGrade(sign: number): MoonGrade {
  if (OWN_SIGNS.Moon.includes(sign) || EXALTATION.Moon === sign) return 'uttama';
  if (sign === 8) return 'adhama';
  return 'sama';
}

export interface YamayaYoga { carrier: string; lightFrom: string; lightTo: string }

/** The Yamayā of two grahas that have no aspect: a graha slower than both, with an aspect to both and both within its own dīptāṁśa; it takes the light of the swifter of the two and gives it to the slower. */
export function yamayaYogas(a: PrashnaBody, b: PrashnaBody, others: PrashnaBody[]): YamayaYoga[] {
  if (tajikaAspect(a.sign, b.sign)) return [];
  const [swift, slow] = speedOf(a) >= speedOf(b) ? [a, b] : [b, a];
  return others
    .filter(other => other.name !== a.name && other.name !== b.name && speedOf(other) < speedOf(a) && speedOf(other) < speedOf(b))
    .filter(other => tajikaAspect(other.sign, a.sign) && tajikaAspect(other.sign, b.sign))
    .filter(other => Math.abs(other.degree - a.degree) <= DIPTAMSHA[other.name as TajikaGraha] && Math.abs(other.degree - b.degree) <= DIPTAMSHA[other.name as TajikaGraha])
    .map(other => ({ carrier: other.name, lightFrom: swift.name, lightTo: slow.name }));
}

export interface ManauYoga { thief: string; of: string; distance: number }

/** The Maṇaū of two grahas in Ithasāla: Mars or Saturn, in the sign of the swifter or in its 4th or 7th and within the swifter's dīptāṁśa, takes the light of the swifter. */
export function manauYogas(others: PrashnaBody[], swift: PrashnaBody): ManauYoga[] {
  return others
    .filter(other => ['Mars', 'Saturn'].includes(other.name) && other.name !== swift.name)
    .filter(other => [1, 4, 7].includes(((swift.sign - other.sign + 12) % 12) + 1))
    .filter(other => Math.abs(other.degree - swift.degree) <= DIPTAMSHA[swift.name as TajikaGraha])
    .map(other => ({ thief: other.name, of: swift.name, distance: Math.abs(other.degree - swift.degree) }));
}

/** Ikkavāla: all seven in the kendras and paṇapharas (the 1st, 4th, 7th, 10th, 2nd, 5th, 8th, 11th); Indūvāra: all seven in the āpoklimas (the 3rd, 6th, 9th, 12th). */
export function ikkavalaOrInduvara(ascendantSign: number, bodies: PrashnaBody[]): 'ikkavala' | 'induvara' | null {
  const houses = bodies.map(body => ((body.sign - ascendantSign + 12) % 12) + 1);
  if (houses.length < 7) return null;
  if (houses.every(house => ![3, 6, 9, 12].includes(house))) return 'ikkavala';
  if (houses.every(house => [3, 6, 9, 12].includes(house))) return 'induvara';
  return null;
}


const longitudeOf = (body: PrashnaBody) => (body.sign - 1) * 30 + body.degree;

/** The places of authority (pada) of a graha: its own sign, its exaltation, its own hadda, drekkāṇa and navāṁśa. */
export function padaOf(body: PrashnaBody): string[] {
  const longitude = longitudeOf(body);
  const places: string[] = [];
  if (OWN_SIGNS[body.name]?.includes(body.sign)) places.push('own sign');
  if (EXALTATION[body.name] === body.sign) places.push('exaltation');
  if (haddaLord(longitude) === body.name) places.push('own hadda');
  if (signLord(drekkanaSign(body.sign, body.degree)) === body.name) places.push('own drekkāṇa');
  if (signLord(navamshaSign(longitude)) === body.name) places.push('own navāṁśa');
  return places;
}

/** Why a graha is weak for the Radda and the Duttotthadavīra: combust, in its fall, in an enemy's sign, retrograde. */
export function weakReasons(body: PrashnaBody, sun: PrashnaBody | undefined): string[] {
  const reasons: string[] = [];
  if (sun && body.name !== 'Sun' && combustionOf(body.name, longitudeOf(body), longitudeOf(sun), (body.speed ?? 1) < 0) !== null) reasons.push('combust');
  if (DEBILITATION[body.name] === body.sign) reasons.push('in its fall');
  if (NATURAL_ENEMIES[body.name]?.includes(signLord(body.sign))) reasons.push('in an enemy\'s sign');
  if ((body.speed ?? 1) < 0) reasons.push('retrograde');
  return reasons;
}

/** The Moon is "void" (śūnyamārga) when it holds no pada and is not in its fall (it has no enemy sign). */
export function moonVoid(moon: PrashnaBody): boolean {
  return padaOf(moon).length === 0 && DEBILITATION.Moon !== moon.sign;
}

const houseFrom = (ascendantSign: number, sign: number) => ((sign - ascendantSign + 12) % 12) + 1;
const ithasalaBehind = (fast: PrashnaBody, slow: PrashnaBody): PairYoga | null => { const yoga = pairYoga(fast, slow); return yoga?.kind === 'ithasala' && yoga.fast === fast.name ? yoga : null; };

export interface GairikambulaYoga { graha: string; distance: number; favourable: boolean }

/**
 * Gairikambūla (57–60): the two lords are in Ithasāla; the Moon is void, makes no Ithasāla with either, stands in the last degree of its sign and goes on into the next; a graha there that holds its own sign or its exaltation, with which the Moon makes the Ithasāla
 * as it enters, gives the result of the Kambūla; with a graha that has no such authority the yoga is not good.
 */
export function gairikambula(moon: PrashnaBody, lords: [PrashnaBody, PrashnaBody], others: PrashnaBody[]): GairikambulaYoga[] {
  if (!moonVoid(moon) || moon.degree < 29) return [];
  if (lords.some(lord => lord.name !== 'Moon' && ithasalaBehind(moon, lord))) return [];
  const next = (moon.sign % 12) + 1;
  return others
    .filter(other => other.name !== 'Moon' && other.sign === next)
    .map(other => ({ graha: other.name, distance: 30 - moon.degree + other.degree, favourable: OWN_SIGNS[other.name]?.includes(other.sign) === true || EXALTATION[other.name] === other.sign }))
    .filter(item => item.distance <= DIPTAMSHA.Moon);
}

/** Khallāsara (61): the two lords are in Ithasāla; the Moon is void, makes no Ithasāla with either lord and is not with either: it destroys the fruit of the Kambūla. */
export function khallasara(moon: PrashnaBody, lords: [PrashnaBody, PrashnaBody]): boolean {
  if (!moonVoid(moon) || lords.some(lord => lord.name === 'Moon')) return false;
  return lords.every(lord => !ithasalaBehind(moon, lord) && lord.sign !== moon.sign);
}

export interface RaddaYoga { weak: string; reasons: string[]; timing: 'good-then-lost' | 'lost-then-good' | null }

/** Radda (62–63): the two lords in Ithasāla and one of them weak: the matter is not accomplished; the weak Kāryeśa in a kendra with the Lagneśa in an āpoklima begins well and ends in ruin, the reverse ends well. */
export function raddaYoga(ascendantSign: number, lagnesha: PrashnaBody, karyesha: PrashnaBody, sun: PrashnaBody | undefined): RaddaYoga[] {
  const houseOf = (body: PrashnaBody) => houseFrom(ascendantSign, body.sign);
  const kendra = (body: PrashnaBody) => [1, 4, 7, 10].includes(houseOf(body)); const apoklima = (body: PrashnaBody) => [3, 6, 9, 12].includes(houseOf(body));
  return [lagnesha, karyesha].map(body => ({ body, reasons: weakReasons(body, sun) })).filter(item => item.reasons.length > 0).map(item => ({
    weak: item.body.name, reasons: item.reasons,
    timing: item.body === karyesha && kendra(karyesha) && apoklima(lagnesha) ? 'good-then-lost' as const : item.body === karyesha && apoklima(karyesha) && kendra(lagnesha) ? 'lost-then-good' as const : null,
  }));
}

export interface DuphaliKuttha { slow: string; fast: string; accomplished: boolean; reasons: string[] }

/** Duphāli-kuttha (64): the slower of the two lords holds a pada and is in Ithasāla with the swifter that holds none: the matter is done, unless the swifter is weak. */
export function duphaliKuttha(a: PrashnaBody, b: PrashnaBody, sun: PrashnaBody | undefined): DuphaliKuttha | null {
  const yoga = pairYoga(a, b);
  if (yoga?.kind !== 'ithasala') return null;
  const [fast, slow] = yoga.fast === a.name ? [a, b] : [b, a];
  if (padaOf(slow).length === 0 || padaOf(fast).length > 0) return null;
  const reasons = weakReasons(fast, sun);
  return { slow: slow.name, fast: fast.name, accomplished: reasons.length === 0, reasons };
}

export interface DuttotthaDavira { kind: 'weak-lords' | 'two-strong'; helpers: string[] }

/** Duttotthadavīra (65): both lords weak and one of them in Ithasāla with a third that holds a pada; or two other grahas that hold a pada, each in Ithasāla with a lord: help comes from another. */
export function duttotthaDavira(a: PrashnaBody, b: PrashnaBody, others: PrashnaBody[], sun: PrashnaBody | undefined): DuttotthaDavira[] {
  const helpers = others.filter(other => other.name !== a.name && other.name !== b.name && padaOf(other).length > 0 && [a, b].some(lord => pairYoga(other, lord)?.kind === 'ithasala'));
  const found: DuttotthaDavira[] = [];
  if (weakReasons(a, sun).length > 0 && weakReasons(b, sun).length > 0 && helpers.length > 0) found.push({ kind: 'weak-lords', helpers: helpers.map(h => h.name) });
  if (helpers.length >= 2) found.push({ kind: 'two-strong', helpers: helpers.map(h => h.name) });
  return found;
}

export interface TambiraYoga { giver: string; receiver: string }

/** Tambīra (66): the two lords are not in Ithasāla; one of them holds a pada and stands in the last degree of its sign, about to enter the next: it gives its light to a graha there. */
export function tambira(lords: [PrashnaBody, PrashnaBody], others: PrashnaBody[]): TambiraYoga[] {
  if (pairYoga(lords[0], lords[1])?.kind === 'ithasala') return [];
  return lords.filter(lord => lord.degree >= 29 && padaOf(lord).length > 0).flatMap(lord =>
    others.filter(other => other.name !== lord.name && other.sign === (lord.sign % 12) + 1).map(other => ({ giver: lord.name, receiver: other.name })));
}

/** The marks of a strong graha (Kuttha, 67–70) that a chart shows: its place, its pada, direct motion, a benefic's company and the freedom from a malefic's aspect, and the strength of its day or night and of its kind. */
export function kutthaMarks(ascendantSign: number, body: PrashnaBody, bodies: PrashnaBody[]): string[] {
  const marks: string[] = [];
  const house = houseFrom(ascendantSign, body.sign);
  if (house === 1) marks.push('in the lagna'); else if ([4, 7, 10].includes(house)) marks.push('in a kendra'); else if ([2, 5, 11].includes(house)) marks.push('in a paṇaphara');
  else if (tajikaAspect(body.sign, ascendantSign)) marks.push('seeing the lagna');
  if (padaOf(body).length > 0) marks.push('holding a pada');
  if ((body.speed ?? 1) >= 0) marks.push('direct');
  const others = bodies.filter(other => other.name !== body.name && (TAJIKA_GRAHAS as readonly string[]).includes(other.name));
  if (others.some(other => ['Jupiter', 'Venus', 'Mercury'].includes(other.name) && other.sign === body.sign)) marks.push('with a benefic');
  if (!others.some(other => ['Sun', 'Mars', 'Saturn'].includes(other.name) && (other.sign === body.sign || [4, 7, 10].includes(houseFrom(other.sign, body.sign))))) marks.push('free of the malefics\' joining and square, opposition aspect');
  const sun = bodies.find(other => other.name === 'Sun');
  const day = sun ? houseFrom(ascendantSign, sun.sign) >= 7 : null;
  if (day !== null && (['Sun', 'Mars', 'Jupiter'].includes(body.name) ? day : ['Moon', 'Mercury', 'Venus', 'Saturn'].includes(body.name) ? !day : false)) marks.push(day ? 'strong by day' : 'strong by night');
  if (['Moon', 'Venus'].includes(body.name) && house >= 4 && house <= 9) marks.push('a woman graha in the 4th to the 9th');
  if (['Sun', 'Mars', 'Jupiter'].includes(body.name) && (house >= 10 || house <= 3)) marks.push('a man graha in the 10th to the 3rd');
  return marks;
}

/** The marks of a weak graha (Duruppha, 71–75) that a chart shows. */
export function durupphaMarks(ascendantSign: number, body: PrashnaBody, bodies: PrashnaBody[]): string[] {
  const marks: string[] = [];
  const house = houseFrom(ascendantSign, body.sign);
  if ([6, 8, 12].includes(house)) marks.push('in the 6th, 8th or 12th');
  marks.push(...weakReasons(body, bodies.find(other => other.name === 'Sun')).filter(reason => reason !== 'combust'));
  const others = bodies.filter(other => other.name !== body.name && (TAJIKA_GRAHAS as readonly string[]).includes(other.name));
  if (others.some(other => ['Sun', 'Mars', 'Saturn'].includes(other.name) && other.sign === body.sign)) marks.push('with a malefic');
  if (others.some(other => ['Sun', 'Mars', 'Saturn'].includes(other.name) && [4, 7, 10].includes(houseFrom(other.sign, body.sign)))) marks.push('square or opposed by a malefic');
  if (!tajikaAspect(body.sign, ascendantSign) && body.sign !== ascendantSign) marks.push('not seeing the lagna');
  if (padaOf(body).length === 0) marks.push('holding no pada');
  const sixth = OWN_SIGNS[body.name]?.map(sign => ((sign + 5) % 12) + 1);
  if (sixth?.includes(body.sign)) marks.push('in the 7th sign from its own');
  if (body.name === 'Moon') {
    const sun = bodies.find(other => other.name === 'Sun');
    if (sun && body.sign === ((sun.sign + 10) % 12) + 1) marks.push('in the 12th from the Sun');
    if ((body.sign === 8 && body.degree < 15) || (body.sign === 7 && body.degree >= 15)) marks.push('in the first half of Scorpio or the second half of Libra');
  }
  return marks;
}

export interface Kambula { withLagnesha: PairYoga | null; withKaryesha: PairYoga | null; grade: MoonGrade }

export interface PrashnaReading {
  house: number;
  lagnesha: string;
  karyesha: string;
  /** Both lords are one graha (the first house, or a lord of both). */
  sameLord: boolean;
  pair: PairYoga | null;
  /** Days the text gives for the Ithasāla to bear fruit: the degrees between the two times twelve. */
  days: number | null;
  nakta: NaktaYoga[];
  kambula: Kambula | null;
  yamaya: YamayaYoga[];
  manau: ManauYoga[];
  /** Ikkavāla or Indūvāra of the chart (17). */
  placement: 'ikkavala' | 'induvara' | null;
  gairikambula: GairikambulaYoga[];
  khallasara: boolean;
  radda: RaddaYoga[];
  duphaliKuttha: DuphaliKuttha | null;
  duttotthaDavira: DuttotthaDavira[];
  tambira: TambiraYoga[];
  /** The marks of strength (Kuttha) and of weakness (Duruppha) of the two lords and the Moon. */
  marks: { name: string; kuttha: string[]; duruppha: string[] }[];
}

/** The reading of a question about `house`, in the chart of its moment. */
export function readPrashna(ascendantSign: number, bodies: PrashnaBody[], house: number): PrashnaReading | null {
  const seven = bodies.filter(body => (TAJIKA_GRAHAS as readonly string[]).includes(body.name));
  if (seven.length < 7) return null;
  const lagnesha = signLord(ascendantSign);
  const karyesha = signLord(((ascendantSign - 1 + house - 1) % 12) + 1);
  const find = (name: string) => seven.find(body => body.name === name)!;
  const sameLord = lagnesha === karyesha;
  const a = find(lagnesha);
  const b = find(karyesha);
  const pair = sameLord ? null : pairYoga(a, b);
  const days = pair?.kind === 'ithasala' ? Math.round(Math.max(0, pair.gap) * 12) : null;
  const nakta = sameLord ? [] : naktaYogas(a, b, seven);
  let kambula: Kambula | null = null;
  // The Moon must be a third graha: when it is one of the two, its Ithasāla with the other is the Ithasāla of the two.
  if (!sameLord && pair?.kind === 'ithasala' && lagnesha !== 'Moon' && karyesha !== 'Moon') {
    const moon = find('Moon');
    const withLagnesha = pairYoga(moon, a);
    const withKaryesha = pairYoga(moon, b);
    const yes = (yoga: PairYoga | null) => (yoga?.kind === 'ithasala' && yoga.fast === 'Moon' ? yoga : null);
    if (yes(withLagnesha) || yes(withKaryesha)) kambula = { withLagnesha: yes(withLagnesha), withKaryesha: yes(withKaryesha), grade: moonGrade(moon.sign) };
  }
  const yamaya = sameLord ? [] : yamayaYogas(a, b, seven);
  let manau: ManauYoga[] = [];
  if (!sameLord && pair?.kind === 'ithasala') {
    const swift = find(pair.fast);
    manau = manauYogas(seven.filter(body => body.name !== a.name && body.name !== b.name), swift);
  }
  const sun = find('Sun');
  const lords: [PrashnaBody, PrashnaBody] = [a, b];
  const moonBody = find('Moon');
  const pairHeld = !sameLord && pair?.kind === 'ithasala';
  const gairikambulaFound = pairHeld && lagnesha !== 'Moon' && karyesha !== 'Moon' ? gairikambula(moonBody, lords, seven) : [];
  const marks = [...new Set([lagnesha, karyesha, 'Moon'])].map(name => ({ name, kuttha: kutthaMarks(ascendantSign, find(name), seven), duruppha: durupphaMarks(ascendantSign, find(name), seven) }));
  return {
    house, lagnesha, karyesha, sameLord, pair, days, nakta, kambula, yamaya, manau, placement: ikkavalaOrInduvara(ascendantSign, seven),
    gairikambula: gairikambulaFound,
    khallasara: pairHeld && gairikambulaFound.length === 0 && khallasara(moonBody, lords),
    radda: pairHeld ? raddaYoga(ascendantSign, a, b, sun) : [],
    duphaliKuttha: sameLord ? null : duphaliKuttha(a, b, sun),
    duttotthaDavira: sameLord ? [] : duttotthaDavira(a, b, seven, sun),
    tambira: sameLord ? [] : tambira(lords, seven),
    marks,
  };
}
