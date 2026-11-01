import { tajikaAspect, signLord, type TajikaAspect } from './varshaphala';
import { EXALTATION, OWN_SIGNS } from './dignity';

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
 * Not built: Gairikambūla, Khallāsara, Radda, Duphāli-kuttha, Duttotthadavīra, Tambīra, Kuttha and Duruppha (the other eight of the sixteen yogas), the sixteen kinds of the Kambūla, and the results of the verses that depend on the nature of the grahas.
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
  return { house, lagnesha, karyesha, sameLord, pair, days, nakta, kambula, yamaya, manau, placement: ikkavalaOrInduvara(ascendantSign, seven) };
}
