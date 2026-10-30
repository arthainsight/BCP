// The Mahādoṣas of a muhūrta, as the Muhūrta Finder keeps clear of them. A list of 21 great faults is given in the
// teaching of muhūrta: those that can be worked out from the sky alone, with the definition the text gives, are here;
// the others are listed with the reason they are not (a table that is not in the text, or a thing that is not a
// reading of the sky). Nothing is filled in from memory: where the sources of the tables disagree, the doṣa waits.
//
// This file is the part that needs no ephemeris: whether a moment, given the longitudes of the grahas, has a doṣa.
// What happens in a span of time (a Saṅkrānti, an eclipse, a Vyatipāta, the Rāhu Kāla of a day) is found in
// mahadoshaEvents.ts and muhurtaFinderRun.ts.

import { MALEFICS, houseFrom, karanaOf, nakshatraOf, signOf, tithiOf, yogaOf, type FinderGraha } from './muhurtaFinder';
import { NAKSHATRA_SIZE } from './nakshatras';
import { SIGN_LORDS } from './signs';
import { getVargaSignIndex } from './varga';

/** The doṣas that are worked out. */
export const DOSHA_IDS = [
  'panchanga', 'udayasta', 'sankranti', 'bhriguShatka', 'ashtamaKuja', 'gandanta', 'kartari', 'chandraShadashtaka',
  'sangraha', 'ashtamaLagna', 'varaDosha', 'eclipse', 'kunavamsa', 'vyatipata', 'vaidhriti',
] as const;
export type DoshaId = (typeof DOSHA_IDS)[number];
export const isDoshaId = (value: string): value is DoshaId => (DOSHA_IDS as readonly string[]).includes(value);

export interface DoshaInfo {
  /** The place in the list of 21. */
  number: number;
  name: string;
  /** What is avoided, in one line. */
  what: string;
  /** What of the doṣa as the text gives it is not applied, when some of it is not. */
  notApplied?: string;
}

export const DOSHAS: Record<DoshaId, DoshaInfo> = {
  panchanga: {
    number: 1, name: 'Pañcāṅga Doṣa',
    what: 'Sunday and Tuesday, the Riktā tithis (4th, 9th, 14th), Amāvasyā, Viṣṭi and the fixed karaṇas, the nine inauspicious yogas, and the Yamaghaṇṭa yoga (a weekday with its nakṣatra).',
    notApplied: 'Mṛtyu yoga and the Māsa Śūnya tithis (no table in the text), and "nakṣatras other than those recommended for the activity" (choose the nakṣatras in the group of their own).',
  },
  udayasta: {
    number: 2, name: 'Udayāsta Śuddhi',
    what: 'No malefic (Sun, Mars, Saturn, Rāhu, Ketu) in the 1st or the 7th house, and the lords of the 1st and the 7th not in the 6th, 8th or 12th.',
    notApplied: 'The malefic aspects and the kāraka house.',
  },
  sankranti: {
    number: 3, name: 'Saṅkrānti',
    what: 'The time around the Sun entering a sign (the Sun at 0° of a sign).',
    notApplied: 'The other grahas at 0° (marriage) and the kāraka planet.',
  },
  bhriguShatka: { number: 5, name: 'Bhṛgu ṣaṭka', what: 'Venus in the 6th house from the Ascendant.' },
  ashtamaKuja: { number: 6, name: 'Aṣṭama Kuja', what: 'Mars in the 8th house from the Ascendant.' },
  gandanta: {
    number: 7, name: 'Gaṇḍānta',
    what: 'The Lagna within half a ghaṭī (12 minutes) of the end of Cancer, Scorpio or Pisces, or of the start of Leo, Sagittarius or Aries; the last 2 ghaṭīs of the 5th, 10th and 15th tithi and the first 2 of the 1st, 6th and 11th; the last 2 ghaṭīs of Āśleṣā, Jyeṣṭhā and Revatī and the first 2 of Maghā, Mūla and Aśvinī.',
  },
  kartari: {
    number: 8, name: 'Kartarī doṣa',
    what: 'Malefics in both the 2nd and the 12th from the Ascendant, or from the Moon.',
    notApplied: 'The kāraka house.',
  },
  chandraShadashtaka: { number: 9, name: 'Ṣaḍaṣṭariṣpha Candra doṣa', what: 'The Moon in the 6th, 8th or 12th house from the Ascendant.' },
  sangraha: { number: 10, name: 'Saṅgraha', what: 'The Moon in the same sign as another graha (Sun to Saturn, Rāhu, Ketu).' },
  ashtamaLagna: {
    number: 11, name: 'Aṣṭama Lagna',
    what: 'The Lagna in the sign that is the 8th from the Ascendant of the birth chart, or the 8th from its Moon.',
  },
  varaDosha: {
    number: 14, name: 'Vāra Doṣa',
    what: 'Rāhu Kāla and Yamaghaṇṭa (Yamagaṇḍa) of the day.',
    notApplied: 'Kulika, Kāla Velā and Ardhayāma (the tables are not in the text).',
  },
  eclipse: {
    number: 16, name: 'Grahaṇa',
    what: 'Seven days before and after a solar eclipse and three days before and after a lunar one; the nakṣatra of an eclipse for six months after it.',
    notApplied: 'The nakṣatra in which a portent (utpāta) occurs.',
  },
  kunavamsa: {
    number: 19, name: 'Kunavāṁśa Doṣa',
    what: 'The Lagna in the navāṁśa of a malefic (a sign of Mars, the Sun or Saturn), or a malefic in the navāṁśa of the Lagna.',
  },
  vyatipata: {
    number: 20, name: 'Vyatipāta',
    what: 'The Sun and the Moon at the same distance from the equator on the same side: the day before, the day of and the day after.',
  },
  vaidhriti: {
    number: 21, name: 'Vaidhṛti',
    what: 'The Sun and the Moon at the same distance from the equator on opposite sides: the day before, the day of and the day after.',
  },
};

/** The doṣas of the list that are not worked out, and why. */
export const DOSHAS_NOT_WORKED_OUT: { number: number; name: string; reason: string }[] = [
  { number: 4, name: 'Pāpaṣaḍvarga', reason: '"Strong and predominant" malefics are not defined in the text.' },
  { number: 12, name: 'Viṣa Ghaṭī', reason: 'The tables of the weekdays, tithis and nakṣatras are not in the text.' },
  { number: 13, name: 'Dūrmuhūrta', reason: 'The sources disagree on which muhūrtas of the day, and the text gives none.' },
  { number: 15, name: 'Daśa Doṣas (Vedha, Lattā, Pāta, Ekārgalā, Daśa Yoga, Yuti, Jāmitra, Upagraha, Bāṇa, Vajra)', reason: 'Their definitions and tables are not in the text.' },
  { number: 17, name: 'Krūraviddha Nakṣatra', reason: 'The Pañcaśalākhā and Saptaśalākhā cakras are not in the text.' },
  { number: 18, name: 'Krūra Saṁyuta Doṣa', reason: 'Storms and earthquakes are not a reading of the sky.' },
];

/** The weekday (0 Sunday) and the nakṣatra that make a Yamaghaṇṭa yoga. */
export const YAMAGHANTA_NAKSHATRA = [9, 15, 5, 18, 2, 3, 12]; // Maghā, Viśākhā, Ārdrā, Mūla, Kṛttikā, Rohiṇī, Hasta
/** The nine inauspicious yogas: Viṣkambha, Atigaṇḍa, Śūla, Gaṇḍa, Vyāghāta, Vajra, Vyatīpāta, Parigha, Vaidhṛti. */
export const INAUSPICIOUS_YOGAS = [0, 5, 8, 9, 12, 14, 16, 18, 26];
/** The Riktā tithis, the 4th, 9th and 14th of each half, and Amāvasyā. */
export const RIKTA_TITHIS = [4, 9, 14, 19, 24, 29, 30];
/** Viṣṭi (an index of KARANA_NAMES) and the fixed karaṇas: Śakuni, Catuṣpada, Nāga, Kiṃstughna. */
export const AVOIDED_KARANAS = [6, 7, 8, 9, 10];

/** What the doṣas need of a moment, so that the ephemeris is asked for no more. */
export interface DoshaNeeds {
  /** The Sun and the Moon (the panchāṅga). */
  luminaries: boolean;
  /** The Ascendant. */
  asc: boolean;
  /** The Ascendant a little before and after (the Lagna gaṇḍānta). */
  ascAround: boolean;
  grahas: FinderGraha[];
}

const NEEDS: Record<DoshaId, DoshaNeeds> = {
  panchanga: { luminaries: true, asc: false, ascAround: false, grahas: [] },
  udayasta: { luminaries: true, asc: true, ascAround: false, grahas: ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'] },
  sankranti: { luminaries: false, asc: false, ascAround: false, grahas: [] },
  bhriguShatka: { luminaries: false, asc: true, ascAround: false, grahas: ['Venus'] },
  ashtamaKuja: { luminaries: false, asc: true, ascAround: false, grahas: ['Mars'] },
  gandanta: { luminaries: true, asc: false, ascAround: true, grahas: [] },
  kartari: { luminaries: true, asc: true, ascAround: false, grahas: ['Mars', 'Saturn', 'Rahu'] },
  chandraShadashtaka: { luminaries: true, asc: true, ascAround: false, grahas: [] },
  sangraha: { luminaries: true, asc: false, ascAround: false, grahas: ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'] },
  ashtamaLagna: { luminaries: false, asc: true, ascAround: false, grahas: [] },
  varaDosha: { luminaries: false, asc: false, ascAround: false, grahas: [] },
  eclipse: { luminaries: false, asc: false, ascAround: false, grahas: [] },
  kunavamsa: { luminaries: true, asc: true, ascAround: false, grahas: ['Mars', 'Saturn', 'Rahu'] },
  vyatipata: { luminaries: false, asc: false, ascAround: false, grahas: [] },
  vaidhriti: { luminaries: false, asc: false, ascAround: false, grahas: [] },
};
export const doshaNeeds = (id: DoshaId): DoshaNeeds => NEEDS[id];

/** Whether the doṣa depends on the Ascendant, which changes sign in an hour or two. */
export const doshaUsesAscendant = (id: DoshaId) => NEEDS[id].asc || NEEDS[id].ascAround;

/** The sky of a moment, as far as the doṣas asked for need it. Longitudes are sidereal; Ketu is always opposite Rāhu. */
export interface DoshaSky {
  /** The weekday, 0 Sunday. */
  vara: number;
  sun: number;
  moon: number;
  asc: number;
  /** The Ascendant 12 minutes before and after. */
  ascBefore?: number;
  ascAfter?: number;
  /** The sidereal longitudes of Mars, Mercury, Jupiter, Venus, Saturn and Rāhu. */
  others: Partial<Record<FinderGraha, number>>;
}

/** The sign (0 to 11) and the longitude of a graha in a sky. */
function longitudeIn(sky: DoshaSky, graha: FinderGraha): number {
  if (graha === 'Sun') return sky.sun;
  if (graha === 'Moon') return sky.moon;
  if (graha === 'Asc') return sky.asc;
  if (graha === 'Ketu') return (sky.others.Rahu! + 180) % 360;
  return sky.others[graha]!;
}

/** The natal signs (0 to 11) the doṣas of the birth chart need. */
export interface DoshaNatal {
  ascSign: number;
  moonSign: number;
}

const GANDANTA_FRACTION = 1 / 30; // 2 ghaṭīs of the 60 of a tithi or a nakṣatra
const NAKSHATRA_NANDA_END = [8, 17, 26];
const NAKSHATRA_NANDA_START = [9, 18, 0];
/** The signs at which the Lagna is in gaṇḍānta, as the sign before the junction: Cancer, Scorpio, Pisces. */
const JUNCTION_BEFORE = [3, 7, 11];

function tithiGandanta(sky: DoshaSky): boolean {
  const elongation = (((sky.moon - sky.sun) % 360) + 360) % 360;
  const within = elongation % 12;
  const tithi = ((tithiOf(sky.sun, sky.moon) - 1) % 15) + 1;
  if ([5, 10, 15].includes(tithi)) return within >= 12 * (1 - GANDANTA_FRACTION);
  if ([1, 6, 11].includes(tithi)) return within < 12 * GANDANTA_FRACTION;
  return false;
}

function nakshatraGandanta(sky: DoshaSky): boolean {
  const index = nakshatraOf(sky.moon);
  const within = (((sky.moon % 360) + 360) % 360) - index * NAKSHATRA_SIZE;
  if (NAKSHATRA_NANDA_END.includes(index)) return within >= NAKSHATRA_SIZE * (1 - GANDANTA_FRACTION);
  if (NAKSHATRA_NANDA_START.includes(index)) return within < NAKSHATRA_SIZE * GANDANTA_FRACTION;
  return false;
}

function lagnaGandanta(sky: DoshaSky): boolean {
  if (sky.ascBefore === undefined || sky.ascAfter === undefined) return false;
  const before = signOf(sky.ascBefore);
  const after = signOf(sky.ascAfter);
  return before !== after && JUNCTION_BEFORE.includes(before) && after === (before + 1) % 12;
}

/** The malefics (Sun, Mars, Saturn, Rāhu, Ketu) in a sign, not counting `except`. */
const maleficsIn = (sky: DoshaSky, sign: number, except?: FinderGraha) =>
  MALEFICS.filter(graha => graha !== except && signOf(longitudeIn(sky, graha)) === sign);

export type PanchangaReason = 'vara' | 'tithi' | 'karana' | 'yoga' | 'yamaghanta';

/** Which of the faults of the Pañcāṅga Doṣa a sky has. */
export function panchangaReasons(sky: DoshaSky): PanchangaReason[] {
  const reasons: PanchangaReason[] = [];
  if (sky.vara === 0 || sky.vara === 2) reasons.push('vara');
  if (RIKTA_TITHIS.includes(tithiOf(sky.sun, sky.moon))) reasons.push('tithi');
  if (AVOIDED_KARANAS.includes(karanaOf(sky.sun, sky.moon))) reasons.push('karana');
  if (INAUSPICIOUS_YOGAS.includes(yogaOf(sky.sun, sky.moon))) reasons.push('yoga');
  if (YAMAGHANTA_NAKSHATRA[sky.vara] === nakshatraOf(sky.moon)) reasons.push('yamaghanta');
  return reasons;
}

const HAS: Record<DoshaId, (sky: DoshaSky, natal?: DoshaNatal) => boolean> = {
  panchanga: sky => panchangaReasons(sky).length > 0,
  udayasta: sky => {
    const ascSign = signOf(sky.asc);
    for (const house of [1, 7]) {
      if (MALEFICS.some(graha => houseFrom(ascSign, longitudeIn(sky, graha)) === house)) return true;
      const lord = SIGN_LORDS[(ascSign + house - 1) % 12];
      if ([6, 8, 12].includes(houseFrom(ascSign, longitudeIn(sky, lord)))) return true;
    }
    return false;
  },
  sankranti: () => false,
  bhriguShatka: sky => houseFrom(signOf(sky.asc), longitudeIn(sky, 'Venus')) === 6,
  ashtamaKuja: sky => houseFrom(signOf(sky.asc), longitudeIn(sky, 'Mars')) === 8,
  gandanta: sky => tithiGandanta(sky) || nakshatraGandanta(sky) || lagnaGandanta(sky),
  kartari: sky => {
    const around = (pivot: number) => maleficsIn(sky, (pivot + 1) % 12).length > 0 && maleficsIn(sky, (pivot + 11) % 12).length > 0;
    return around(signOf(sky.asc)) || around(signOf(sky.moon));
  },
  chandraShadashtaka: sky => [6, 8, 12].includes(houseFrom(signOf(sky.asc), sky.moon)),
  sangraha: sky => {
    const moonSign = signOf(sky.moon);
    return (['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as FinderGraha[]).some(graha => signOf(longitudeIn(sky, graha)) === moonSign);
  },
  ashtamaLagna: (sky, natal) => {
    if (!natal) return false;
    const sign = signOf(sky.asc);
    return sign === (natal.ascSign + 7) % 12 || sign === (natal.moonSign + 7) % 12;
  },
  varaDosha: () => false,
  eclipse: () => false,
  kunavamsa: sky => {
    const ascNavamsa = getVargaSignIndex(sky.asc, 9);
    if ((['Sun', 'Mars', 'Saturn'] as string[]).includes(SIGN_LORDS[ascNavamsa])) return true;
    return MALEFICS.some(graha => getVargaSignIndex(longitudeIn(sky, graha), 9) === ascNavamsa);
  },
  vyatipata: () => false,
  vaidhriti: () => false,
};

/** Whether a sky has the doṣa. The doṣas of a span of time (Saṅkrānti, eclipses, Vyatipāta, Vaidhṛti, the Vāra Doṣa) are never in a sky. */
export const hasDosha = (id: DoshaId, sky: DoshaSky, natal?: DoshaNatal): boolean => HAS[id](sky, natal);

/** The doṣas that are a span of time around an event, not a state of the sky. */
export const EVENT_DOSHAS: DoshaId[] = ['sankranti', 'varaDosha', 'eclipse', 'vyatipata', 'vaidhriti'];
