// The Mahādoṣas of a muhūrta, as the Muhūrta Finder keeps clear of them. A list of 21 great faults is given in the
// teaching of muhūrta (Rishi Nārada, as Ernst Wilhelm's "Classical Muhurta" has it in chapter 17, with the weekday–nakṣatra
// yogas of his article "Muhurta Yogas"): those that can be worked out from the sky, with the definition the text gives,
// are here; the others are listed with the reason they are not (a table that is not in the text, or a thing that is not a
// reading of the sky). Nothing is filled in from memory: docs/mahadosha-sources.md says where each table comes from.
//
// This file is the part that needs no ephemeris: whether a moment, given the longitudes of the grahas, has a doṣa.
// What happens in a span of time (a Saṅkrānti, an eclipse, a Vyatipāta, the Vara Vishanadi, the Rāhu Kāla of a day) is
// found in mahadoshaEvents.ts and muhurtaFinderRun.ts.

import { MALEFICS, houseFrom, karanaOf, nakshatraOf, signOf, tithiOf, yogaOf, type FinderGraha } from './muhurtaFinder';
import { NAKSHATRA_LORDS, NAKSHATRA_SIZE } from './nakshatras';
import { SIGN_LORDS } from './signs';
import { getVargaSignIndex } from './varga';

/** The doṣas that are worked out. */
export const DOSHA_IDS = [
  'panchanga', 'udayasta', 'sankranti', 'papashadvarga', 'bhriguShatka', 'ashtamaKuja', 'gandanta', 'kartari', 'chandraShadashtaka',
  'sangraha', 'ashtamaLagna', 'vishaGhati', 'durmuhurta', 'varaDosha',
  'ekargala', 'dashaYoga', 'jamitra', 'latta', 'upagraha', 'pata',
  'eclipse', 'kunavamsa', 'vyatipata', 'vaidhriti',
  'shunyaRasi', 'blindDeafLame', 'mrityubhaga',
] as const;
export type DoshaId = (typeof DOSHA_IDS)[number];
export const isDoshaId = (value: string): value is DoshaId => (DOSHA_IDS as readonly string[]).includes(value);

export interface DoshaInfo {
  /** The place in the list of 21 (the ten Daśa Doṣas all have the 15th); 0 for a blemish the book names outside the list. */
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
    what: 'Sunday and Tuesday, the Riktā tithis (4th, 9th, 14th), Amāvasyā, the Śūnya tithis of the month, Viṣṭi and the fixed karaṇas, the nine inauspicious yogas, and the Mṛtyu and Yamaghaṇṭa yogas (a weekday with its nakṣatra).',
    notApplied: '"Nakṣatras other than those recommended for the activity" (choose the nakṣatras in the group of their own), the exception of the Sun or Moon in the 11th, and the other two Mṛtyu yogas of the sources.',
  },
  udayasta: {
    number: 2, name: 'Udayāsta Śuddhi',
    what: 'No malefic (Sun, Mars, Saturn, Rāhu, Ketu) in the 1st or the 7th house, and the lords of the 1st and the 7th not in the 6th, 8th or 12th.',
    notApplied: 'The malefic aspects, the kāraka house and the exceptions.',
  },
  sankranti: {
    number: 3, name: 'Saṅkrānti',
    what: 'The time around the Sun entering a sign (the Sun at 0° of a sign), in the zodiac of the chart: 3° before and after the Sun enters Cancer and Capricorn, 16′ before and after the other signs.',
    notApplied: 'The other grahas at 0° (marriage) and the kāraka planet.',
  },
  papashadvarga: {
    number: 4, name: 'Pāpaṣaḍvarga',
    what: 'The Lagna in more signs of malefics than of benefics in the six vargas (Rāśi, Horā, Drekkāṇa, Navāṁśa, Dvādaśāṁśa, Triṁśāṁśa), or, when equal, the Navāṁśa Lagna in the sign of a malefic. The malefics are the Sun, Mars and Saturn, and the Moon in the dark half.',
    notApplied: 'The exception of Jupiter or Venus in the Lagna or aspecting it.',
  },
  bhriguShatka: { number: 5, name: 'Bhṛgu ṣaṭka', what: 'Venus in the 6th house from the Ascendant.' },
  ashtamaKuja: { number: 6, name: 'Aṣṭama Kuja', what: 'Mars in the 8th house from the Ascendant.' },
  gandanta: {
    number: 7, name: 'Gaṇḍānta',
    what: 'The Lagna in the last 3° of Cancer, Scorpio or Pisces or the first 3° of Leo, Sagittarius or Aries; the last 24′ of the 5th, 10th and 15th tithi and the first 24′ of the 1st, 6th and 11th (of either half); the Moon in the last pada of Āśleṣā, Jyeṣṭhā or Revatī or the first pada of Aśvinī, Maghā or Mūla.',
    notApplied: 'The exception of the Moon in a friendly sign aspected by benefics. The Moon\'s part can be 4 or 2 ghaṭīs (53′20″ or 26′40″) instead of a pada, as the text allows.',
  },
  kartari: {
    number: 8, name: 'Kartarī doṣa',
    what: 'Malefics in both the 2nd and the 12th from the Ascendant, from the 7th house or from the Moon.',
    notApplied: 'The kāraka house.',
  },
  chandraShadashtaka: { number: 9, name: 'Ṣaḍaṣṭariṣpha Candra doṣa', what: 'The Moon in the 6th, 8th or 12th house from the Ascendant.' },
  sangraha: { number: 10, name: 'Saṅgraha', what: 'The Moon in the same sign as another graha (Sun to Saturn, Rāhu, Ketu).' },
  ashtamaLagna: {
    number: 11, name: 'Aṣṭama Lagna',
    what: 'The Lagna in the sign that is the 8th from the Ascendant of the birth chart, or the 8th from its Moon.',
    notApplied: 'The spouse\'s chart and the exception of friendly lords.',
  },
  vishaGhati: {
    number: 12, name: 'Viṣa Ghaṭī (Viṣanāḍī)',
    what: 'The 4 nāḍīs of poison of the tithi (its table, by the Sun–Moon distance), of the nakṣatra (its table, by the Moon\'s longitude; Rohiṇī, Mṛgaśīrṣa, Ārdrā, Svāti, Anurādhā, Uttara Āṣāḍhā and Śravaṇa have none) and of the weekday (4 nāḍīs from the nāḍī of its table after sunrise).',
    notApplied: 'The Viṣanāḍī of the Lagna (by its navāṁśa and the weekday) and the exceptions.',
  },
  durmuhurta: {
    number: 13, name: 'Dūrmuhūrta',
    what: 'The unfavourable tithyaṁśas (thirtieths of a tithi, 24′ of the Sun–Moon distance): the 1st, 2nd, 4th, 10th, 11th, 12th, 15th, 16th, 17th, 21st and 22nd, and for each weekday the Sun\'s 14th; the Moon\'s 12th and 9th; Mars\'s 4th and 11th; Mercury\'s 8th; Jupiter\'s 6th and 12th; Venus\'s 4th and 9th; Saturn\'s 1st and 2nd.',
    notApplied: 'The exceptions of Jupiter in an angle and the Moon in the 11th.',
  },
  varaDosha: {
    number: 14, name: 'Vāra Doṣa',
    what: 'Rāhu Kāla, Yamaghaṇṭa (Yamagaṇḍa) and Ardhayāma of the day.',
    notApplied: 'Kulika and Kāla Velā (the tables are not in the text).',
  },
  ekargala: {
    number: 15, name: 'Ekārgalā (Daśa Doṣa)',
    what: 'One of the nine inauspicious yogas running, with the Sun and the Moon in the nakṣatras that are the same distance on either side of the nakṣatra of the yoga (Viṣkambha: Puṣya).',
    notApplied: 'That it is only by day, and the exceptions.',
  },
  dashaYoga: {
    number: 15, name: 'Daśa Yoga (Daśa Doṣa)',
    what: 'The numbers of the nakṣatras of the Sun and the Moon added and divided by 27 leave 0, 1, 4, 6, 10, 11, 15, 18, 19 or 20.',
  },
  jamitra: {
    number: 15, name: 'Jāmitra (Daśa Doṣa)',
    what: 'A graha in the 7th from the Lagna or from the Moon (Mercury in the 7th from the Moon is not), in the rāśi and in the navāṁśa.',
  },
  latta: {
    number: 15, name: 'Lattā (Daśa Doṣa)',
    what: 'The Moon in the nakṣatra a graha "kicks": the 12th from the Sun, the 3rd from Mars, the 6th from Jupiter, the 8th from Saturn (counted on), the 7th before Mercury, the 5th before Venus and the 9th before Rāhu.',
    notApplied: 'That the Moon is only significantly kicked in the same pada.',
  },
  upagraha: {
    number: 15, name: 'Upagraha (Daśa Doṣa)',
    what: 'The Moon in the 5th, 7th, 8th, 10th, 14th, 15th, 18th, 19th, 21st, 22nd, 23rd, 24th or 25th nakṣatra from that of the Sun.',
    notApplied: 'That it is only significant in the same pada.',
  },
  pata: {
    number: 15, name: 'Pāta (Daśa Doṣa)',
    what: 'The Moon in a nakṣatra, counted from Aśvinī, whose number is the count from the Sun\'s nakṣatra to Āśleṣā, Maghā, Citrā, Anurādhā, Śravaṇa or Revatī.',
    notApplied: 'That it is only significant in the same pada.',
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
    what: 'The Sun and the Moon at the same distance from the equator on the same side: the day before, the day of and the day after (or the short time around the moment the book gives).',
  },
  vaidhriti: {
    number: 21, name: 'Vaidhṛti',
    what: 'The Sun and the Moon at the same distance from the equator on opposite sides: the day before, the day of and the day after (or the short time around the moment the book gives).',
  },
  // The blemishes the book names besides the 21 (number 0).
  shunyaRasi: {
  number: 0, name: 'Śūnya Rāśi',
  what: 'The Lagna or the Navāṁśa Lagna in a Śūnya (empty) sign of the tithi, by the book\'s table (the 1st tithi: Libra and Capricorn, and so on for the 14; none for the 15th), or the Moon in the Śūnya sign of the lunar month (Chaitra: Aquarius, … Phālguna: Leo).',
  notApplied: 'The exceptions and the purposes for which an empty sign suits (overcoming a difficulty). The Muhūrta Cintāmaṇi\'s variants for the 9th and 13th tithi.',
},
  blindDeafLame: {
  number: 0, name: 'Blind, deaf and lame Rāśis',
  what: 'The Lagna in a blind sign (Aries, Taurus, Leo by day; Gemini, Cancer, Virgo by night), a deaf sign (Libra, Scorpio by day; Capricorn, Sagittarius by night) or a lame sign (Aquarius by day, Pisces by night).',
  notApplied: 'The exceptions (benefics in the angles, Jupiter aspecting the Lagna or its lord, and the like). Day is from sunrise to sunset of the place.',
},
  mrityubhaga: {
  number: 0, name: 'Mṛtyubhāga (fatal degrees)',
  what: 'The Lagna, the Moon, the Lagna lord, the lord of the Moon\'s nakṣatra or the lord of the yoga within one degree of its fatal degree in the sign (the book\'s table of the degrees of each planet, Rāhu, Ketu and the Lagna in the twelve signs).',
  notApplied: 'A planet joined or aspected by a planet in a fatal degree, and the other planets of the chart.',
},
};

/** The doṣas of the list that are not worked out, and why. */
export const DOSHAS_NOT_WORKED_OUT: { number: number; name: string; reason: string }[] = [
  { number: 15, name: 'Daśa Doṣas: Vedha, Yuti, Bāṇa, Vajra', reason: 'Vedha, Yuti and Vajra have no definition in the sources read, and Bāṇa depends on the purpose (Rāja, Agni, Cora, Roga or Mṛtyu for each).' },
  { number: 17, name: 'Krūraviddha Nakṣatra', reason: 'The Pañcaśalākhā and Saptaśalākhā cakras are not in the sources read (the book has the portents of planetary war, comets and the like, which are not a reading of the chart).' },
  { number: 18, name: 'Krūra Saṁyuta Doṣa', reason: 'Storms and earthquakes are not a reading of the sky.' },
];

/** The weekday (0 Sunday) and the nakṣatra that make a Yamaghaṇṭa yoga. */
export const YAMAGHANTA_NAKSHATRA = [9, 15, 5, 18, 2, 3, 12]; // Maghā, Viśākhā, Ārdrā, Mūla, Kṛttikā, Rohiṇī, Hasta
/** The first Mṛtyu yoga of the sources: Sun–Anurādhā, Moon–Uttara Āṣāḍhā, Mars–Śatabhiṣā, Mercury–Aśvinī, Jupiter–Mṛgaśīrṣa, Venus–Āśleṣā, Saturn–Hasta. */
export const MRITYU_NAKSHATRA = [16, 20, 23, 0, 4, 8, 12];
/** The nine inauspicious yogas: Viṣkambha, Atigaṇḍa, Śūla, Gaṇḍa, Vyāghāta, Vajra, Vyatīpāta, Parigha, Vaidhṛti. */
export const INAUSPICIOUS_YOGAS = [0, 5, 8, 9, 12, 14, 16, 18, 26];
/** The Riktā tithis, the 4th, 9th and 14th of each half, and Amāvasyā. */
export const RIKTA_TITHIS = [4, 9, 14, 19, 24, 29, 30];
/** Viṣṭi (an index of KARANA_NAMES) and the fixed karaṇas: Śakuni, Catuṣpada, Nāga, Kiṃstughna. */
export const AVOIDED_KARANAS = [6, 7, 8, 9, 10];

/**
 * The Śūnya tithis of the lunar months, Chaitra to Phālguna, by the two sources: Kālaprakāśikā by the month alone, and Muhūrta
 * Cintāmaṇi by the month and the half (the tithi counted 1 to 15 in each half). The text follows both.
 */
export const SHUNYA_TITHIS_MONTH = [[8, 11], [12], [13], [6], [15], [7], [9], [5], [2, 9], [1], [4, 10], [14]];
export const SHUNYA_TITHIS_BRIGHT = [[8, 9], [12], [13], [7], [2, 3], [1, 2], [10, 11], [14], [7, 8], [4, 5], [6], [3]];
export const SHUNYA_TITHIS_DARK = [[8, 9], [12], [14], [6], [2, 3], [1, 2], [10, 11], [5], [7, 8], [4, 5], [5], [4]];

/** The nādi at which the Viṣanāḍī (4 nāḍīs) of each of the 15 tithis begins, in the 60 nāḍīs of a tithi (0.2° of Sun–Moon distance each). */
export const TITHI_VISHANADI_START = [24, 12, 55, 5, 54, 5, 34, 10, 21, 7, 29, 6, 13, 21, 35];
/** The nāḍī at which the Viṣanāḍī of each of the 27 nakṣatras begins, in its 60 nāḍīs (13°20′/60 each); Mūla has two. Rohiṇī, Mṛgaśīrṣa, Ārdrā, Svāti, Anurādhā, Uttara Āṣāḍhā and Śravaṇa have none of significance. */
export const NAKSHATRA_VISHANADI_START: (number[] | null)[] = [
  [50], [24], [30], null, null, null, [30], [20], [32], [30], [20], [18], [21], [20], null, [14], null, [14], [20, 56], [24], null, null, [10], [18], [16], [24], [30],
];
/** The nāḍī after sunrise at which the Viṣanāḍī of each weekday begins (the weekday from sunrise to the next, in 60 nāḍīs). */
export const VARA_VISHANADI_START = [30, 42, 41, 31, 2, 22, 20];
export const VISHANADI_NADIS = 4;

/** The unfavourable tithyaṁśas (1 to 30), and those of each weekday (0 Sunday) in addition. */
export const TITHYAMSA_UNFAVOURABLE = [1, 2, 4, 10, 11, 12, 15, 16, 17, 21, 22];
export const TITHYAMSA_BY_VARA = [[14], [12, 9], [4, 11], [8], [6, 12], [4, 9], [1, 2]];
/** The nakṣatras of the Daśa Yoga's remainders, of the Upagraha's positions and of the Pāta's targets. */
const DASHA_YOGA_REMAINDERS = [0, 1, 4, 6, 10, 11, 15, 18, 19, 20];
const UPAGRAHA_POSITIONS = [5, 7, 8, 10, 14, 15, 18, 19, 21, 22, 23, 24, 25];
const PATA_TARGETS = [8, 9, 13, 16, 21, 26]; // Āśleṣā, Maghā, Citrā, Anurādhā, Śravaṇa, Revatī
/** How far on (+) or back (−) from the nakṣatra of a graha the nakṣatra it kicks (Lattā) is. */
const LATTA_KICK: Partial<Record<FinderGraha, number>> = { Sun: 11, Mars: 2, Jupiter: 5, Saturn: 7, Mercury: -6, Venus: -4, Rahu: -8 };

/** The Śūnya (empty) signs of each tithi, 1 to 14 (0 Aries … 11 Pisces); the 15th has none. The book's table, the same for both halves. */
export const SHUNYA_RASIS_OF_TITHI: number[][] = [
  [6, 9], [8, 11], [4, 9], [1, 10], [2, 5], [0, 4], [8, 3], [2, 5], [4, 7], [4, 7], [8, 11], [6, 9], [4, 1], [2, 5, 8, 11],
];
/** The sign the Moon should not be in during each lunar month, Chaitra to Phālguna. */
export const SHUNYA_RASI_OF_MASA = [10, 11, 1, 2, 0, 5, 7, 6, 8, 3, 9, 4];
/** The blind, deaf and lame signs by day and by night. */
export const BLIND_DEAF_LAME = {
  day: { blind: [0, 1, 4], deaf: [6, 7], lame: [10] },
  night: { blind: [2, 3, 5], deaf: [9, 8], lame: [11] },
};
/** The fatal degree (Mṛtyubhāga) of each in the twelve signs, Aries first. */
export const FATAL_DEGREES: Record<string, number[]> = {
  Sun: [20, 9, 12, 6, 8, 24, 16, 17, 22, 2, 3, 23],
  Moon: [26, 12, 13, 25, 24, 11, 26, 14, 13, 25, 5, 12],
  Mars: [19, 28, 25, 23, 29, 28, 14, 21, 2, 15, 11, 6],
  Mercury: [15, 14, 13, 12, 8, 18, 20, 10, 21, 22, 7, 5],
  Jupiter: [19, 29, 12, 27, 6, 4, 13, 10, 17, 11, 15, 28],
  Venus: [28, 15, 11, 17, 10, 13, 4, 6, 27, 12, 29, 19],
  Saturn: [10, 4, 7, 9, 12, 16, 3, 18, 28, 14, 13, 15],
  Rahu: [14, 13, 12, 11, 24, 23, 22, 21, 10, 20, 18, 8],
  Ketu: [8, 18, 20, 10, 21, 22, 23, 24, 11, 12, 13, 14],
  Lagna: [8, 9, 22, 22, 25, 14, 4, 23, 18, 20, 21, 10],
};

/** What the doṣas need of a moment, so that the ephemeris is asked for no more. */
export interface DoshaNeeds {
  /** The Sun and the Moon (the panchāṅga). */
  luminaries: boolean;
  /** The Ascendant. */
  asc: boolean;
  grahas: FinderGraha[];
}

const ALL_OTHERS: FinderGraha[] = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'];
const NEEDS: Record<DoshaId, DoshaNeeds> = {
  panchanga: { luminaries: true, asc: false, grahas: [] },
  udayasta: { luminaries: true, asc: true, grahas: ALL_OTHERS },
  sankranti: { luminaries: false, asc: false, grahas: [] },
  papashadvarga: { luminaries: true, asc: true, grahas: [] },
  bhriguShatka: { luminaries: false, asc: true, grahas: ['Venus'] },
  ashtamaKuja: { luminaries: false, asc: true, grahas: ['Mars'] },
  gandanta: { luminaries: true, asc: true, grahas: [] },
  kartari: { luminaries: true, asc: true, grahas: ['Mars', 'Saturn', 'Rahu'] },
  chandraShadashtaka: { luminaries: true, asc: true, grahas: [] },
  sangraha: { luminaries: true, asc: false, grahas: ALL_OTHERS },
  ashtamaLagna: { luminaries: false, asc: true, grahas: [] },
  vishaGhati: { luminaries: true, asc: false, grahas: [] },
  durmuhurta: { luminaries: true, asc: false, grahas: [] },
  varaDosha: { luminaries: false, asc: false, grahas: [] },
  ekargala: { luminaries: true, asc: false, grahas: [] },
  dashaYoga: { luminaries: true, asc: false, grahas: [] },
  jamitra: { luminaries: true, asc: true, grahas: ALL_OTHERS },
  latta: { luminaries: true, asc: false, grahas: ALL_OTHERS },
  upagraha: { luminaries: true, asc: false, grahas: [] },
  pata: { luminaries: true, asc: false, grahas: [] },
  eclipse: { luminaries: false, asc: false, grahas: [] },
  kunavamsa: { luminaries: true, asc: true, grahas: ['Mars', 'Saturn', 'Rahu'] },
  vyatipata: { luminaries: false, asc: false, grahas: [] },
  vaidhriti: { luminaries: false, asc: false, grahas: [] },
  shunyaRasi: { luminaries: true, asc: true, grahas: [] },
  blindDeafLame: { luminaries: false, asc: true, grahas: [] },
  mrityubhaga: { luminaries: true, asc: true, grahas: [...ALL_OTHERS] },
};
export const doshaNeeds = (id: DoshaId): DoshaNeeds => NEEDS[id];

/** Whether the doṣa depends on the Ascendant, which changes sign in an hour or two. */
export const doshaUsesAscendant = (id: DoshaId) => NEEDS[id].asc;

/** The sky of a moment, as far as the doṣas asked for need it. Longitudes are sidereal; Ketu is always opposite Rāhu. */
export interface DoshaSky {
  /** The weekday, 0 Sunday. */
  vara: number;
  sun: number;
  moon: number;
  asc: number;
  /** The sidereal longitudes of Mars, Mercury, Jupiter, Venus, Saturn and Rāhu. */
  others: Partial<Record<FinderGraha, number>>;
  /** The lunar month (0 Chaitra to 11 Phālguna), for the Śūnya tithis, when it is known. */
  masa?: number;
  /** Whether the Sun is above the horizon (sunrise to sunset of the place), for the blind and deaf signs. */
  day?: boolean;
}

/** What the choices of the user change in the doṣas of a sky. */
export interface DoshaOptions {
  /** The part of the nakṣatra that is Gaṇḍānta: the pada (3°20′, the text), 4 ghaṭīs (53′20″) or 2 ghaṭīs (26′40″). */
  gandantaNakshatra?: 'pada' | 'four' | 'two';
}

/** The longitude of a graha in a sky. */
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

/** The part of a tithi or a nakṣatra that two ghaṭīs of the sixty are. */
const GANDANTA_TITHI_FRACTION = 1 / 30;
const GANDANTA_NAKSHATRA_FRACTION = { pada: 1 / 4, four: 1 / 15, two: 1 / 30 } as const;
const NAKSHATRA_NANDA_END = [8, 17, 26];
const NAKSHATRA_NANDA_START = [9, 18, 0];
/** The signs in whose last 3° the Lagna is in gaṇḍānta: Cancer, Scorpio, Pisces; and those in whose first 3°: Leo, Sagittarius, Aries. */
const LAGNA_GANDANTA_END = [3, 7, 11];
const LAGNA_GANDANTA_START = [4, 8, 0];
const LAGNA_GANDANTA_DEGREES = 3;

const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;
const elongationOf = (sky: DoshaSky) => normalize(sky.moon - sky.sun);

function tithiGandanta(sky: DoshaSky): boolean {
  const within = elongationOf(sky) % 12;
  const tithi = ((tithiOf(sky.sun, sky.moon) - 1) % 15) + 1;
  if ([5, 10, 15].includes(tithi)) return within >= 12 * (1 - GANDANTA_TITHI_FRACTION);
  if ([1, 6, 11].includes(tithi)) return within < 12 * GANDANTA_TITHI_FRACTION;
  return false;
}

function nakshatraGandanta(sky: DoshaSky, part: keyof typeof GANDANTA_NAKSHATRA_FRACTION): boolean {
  const index = nakshatraOf(sky.moon);
  const within = normalize(sky.moon) - index * NAKSHATRA_SIZE;
  const fraction = GANDANTA_NAKSHATRA_FRACTION[part];
  if (NAKSHATRA_NANDA_END.includes(index)) return within >= NAKSHATRA_SIZE * (1 - fraction);
  if (NAKSHATRA_NANDA_START.includes(index)) return within < NAKSHATRA_SIZE * fraction;
  return false;
}

function lagnaGandanta(sky: DoshaSky): boolean {
  const sign = signOf(sky.asc);
  const degree = normalize(sky.asc) % 30;
  if (LAGNA_GANDANTA_END.includes(sign)) return degree >= 30 - LAGNA_GANDANTA_DEGREES;
  if (LAGNA_GANDANTA_START.includes(sign)) return degree < LAGNA_GANDANTA_DEGREES;
  return false;
}

/** The malefics (Sun, Mars, Saturn, Rāhu, Ketu) in a sign. */
const maleficsIn = (sky: DoshaSky, sign: number) => MALEFICS.filter(graha => signOf(longitudeIn(sky, graha)) === sign);

const NINE: FinderGraha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export type PanchangaReason = 'vara' | 'tithi' | 'shunya' | 'karana' | 'yoga' | 'yamaghanta' | 'mrityu';

/** Which of the faults of the Pañcāṅga Doṣa a sky has. */
export function panchangaReasons(sky: DoshaSky): PanchangaReason[] {
  const reasons: PanchangaReason[] = [];
  const tithi = tithiOf(sky.sun, sky.moon);
  if (sky.vara === 0 || sky.vara === 2) reasons.push('vara');
  if (RIKTA_TITHIS.includes(tithi)) reasons.push('tithi');
  if (sky.masa !== undefined) {
    const inHalf = ((tithi - 1) % 15) + 1;
    const bright = tithi <= 15 ? SHUNYA_TITHIS_BRIGHT : SHUNYA_TITHIS_DARK;
    if (SHUNYA_TITHIS_MONTH[sky.masa].includes(inHalf) || bright[sky.masa].includes(inHalf)) reasons.push('shunya');
  }
  if (AVOIDED_KARANAS.includes(karanaOf(sky.sun, sky.moon))) reasons.push('karana');
  if (INAUSPICIOUS_YOGAS.includes(yogaOf(sky.sun, sky.moon))) reasons.push('yoga');
  if (YAMAGHANTA_NAKSHATRA[sky.vara] === nakshatraOf(sky.moon)) reasons.push('yamaghanta');
  if (MRITYU_NAKSHATRA[sky.vara] === nakshatraOf(sky.moon)) reasons.push('mrityu');
  return reasons;
}

/** The Viṣanāḍī of the tithi and of the nakṣatra a sky is in (the weekday's is a stretch of the day, found with the sunrise). */
export function vishanadiOfSky(sky: DoshaSky): { tithi: boolean; nakshatra: boolean } {
  const withinTithi = elongationOf(sky) % 12;
  const tithiStart = TITHI_VISHANADI_START[tithiOf(sky.sun, sky.moon) <= 15 ? tithiOf(sky.sun, sky.moon) - 1 : tithiOf(sky.sun, sky.moon) - 16] * (12 / 60);
  const index = nakshatraOf(sky.moon);
  const withinNakshatra = normalize(sky.moon) - index * NAKSHATRA_SIZE;
  const starts = NAKSHATRA_VISHANADI_START[index];
  return {
    tithi: withinTithi >= tithiStart && withinTithi < tithiStart + VISHANADI_NADIS * (12 / 60),
    nakshatra: !!starts && starts.some(start => withinNakshatra >= start * (NAKSHATRA_SIZE / 60) && withinNakshatra < (start + VISHANADI_NADIS) * (NAKSHATRA_SIZE / 60)),
  };
}

/** The tithyaṁśa, 1 to 30: the thirtieth part of the tithi (24′ of the Sun–Moon distance) the sky is in. */
export const tithyamsaOf = (sky: DoshaSky) => Math.floor((elongationOf(sky) % 12) / (12 / 30)) + 1;

/** The signs of the Lagna in the six vargas: Rāśi, Horā, Drekkāṇa, Navāṁśa, Dvādaśāṁśa and Triṁśāṁśa. */
const SHADVARGA = [1, 2, 3, 9, 12, 30];

/** Whether a sign belongs to a malefic: the Sun, Mars, Saturn, and the Moon in the dark half. */
const isMaleficSign = (sign: number, moonWaxing: boolean) => {
  const lord = SIGN_LORDS[sign];
  return lord === 'Sun' || lord === 'Mars' || lord === 'Saturn' || (lord === 'Moon' && !moonWaxing);
};

function papashadvarga(sky: DoshaSky): boolean {
  const waxing = tithiOf(sky.sun, sky.moon) <= 15;
  const signs = SHADVARGA.map(division => (division === 1 ? signOf(sky.asc) : getVargaSignIndex(sky.asc, division)));
  const malefic = signs.filter(sign => isMaleficSign(sign, waxing)).length;
  const benefic = signs.length - malefic;
  if (malefic !== benefic) return malefic > benefic;
  return isMaleficSign(getVargaSignIndex(sky.asc, 9), waxing);
}

/** The nakṣatra a graha kicks (Lattā), or undefined for a graha that kicks none. */
const kickedBy = (sky: DoshaSky, graha: FinderGraha): number | undefined => {
  const offset = LATTA_KICK[graha];
  return offset === undefined ? undefined : (((nakshatraOf(longitudeIn(sky, graha)) + offset) % 27) + 27) % 27;
};

/** Jāmitra in the rāśi: a graha in the 7th sign from the Lagna or from the Moon (the Moon itself and Mercury, which makes the wife dear, are left out from the Moon). */
export function jamitraRasi(sky: DoshaSky): boolean {
  const occupies = (sign: number, skip: FinderGraha[]) => NINE.some(graha => !skip.includes(graha) && signOf(longitudeIn(sky, graha)) === sign);
  return occupies((signOf(sky.asc) + 6) % 12, []) || occupies((signOf(sky.moon) + 6) % 12, ['Moon', 'Mercury']);
}

/** Jāmitra in the navāṁśa: a graha in the 7th navāṁśa from the navāṁśa Lagna or from the navāṁśa of the Moon. */
export function jamitraNavamsa(sky: DoshaSky): boolean {
  const occupies = (sign: number, skip: FinderGraha[]) => NINE.some(graha => !skip.includes(graha) && getVargaSignIndex(longitudeIn(sky, graha), 9) === sign);
  return occupies((getVargaSignIndex(sky.asc, 9) + 6) % 12, []) || occupies((getVargaSignIndex(sky.moon, 9) + 6) % 12, ['Moon', 'Mercury']);
}

const HAS: Record<DoshaId, (sky: DoshaSky, natal?: DoshaNatal, options?: DoshaOptions) => boolean> = {
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
  papashadvarga: sky => papashadvarga(sky),
  bhriguShatka: sky => houseFrom(signOf(sky.asc), longitudeIn(sky, 'Venus')) === 6,
  ashtamaKuja: sky => houseFrom(signOf(sky.asc), longitudeIn(sky, 'Mars')) === 8,
  gandanta: (sky, _natal, options) => tithiGandanta(sky) || nakshatraGandanta(sky, options?.gandantaNakshatra ?? 'pada') || lagnaGandanta(sky),
  kartari: sky => {
    const around = (pivot: number) => maleficsIn(sky, (pivot + 1) % 12).length > 0 && maleficsIn(sky, (pivot + 11) % 12).length > 0;
    const ascSign = signOf(sky.asc);
    return around(ascSign) || around((ascSign + 6) % 12) || around(signOf(sky.moon));
  },
  chandraShadashtaka: sky => [6, 8, 12].includes(houseFrom(signOf(sky.asc), sky.moon)),
  sangraha: sky => {
    const moonSign = signOf(sky.moon);
    return NINE.filter(graha => graha !== 'Moon').some(graha => signOf(longitudeIn(sky, graha)) === moonSign);
  },
  ashtamaLagna: (sky, natal) => {
    if (!natal) return false;
    const sign = signOf(sky.asc);
    return sign === (natal.ascSign + 7) % 12 || sign === (natal.moonSign + 7) % 12;
  },
  vishaGhati: sky => {
    const found = vishanadiOfSky(sky);
    return found.tithi || found.nakshatra;
  },
  durmuhurta: sky => {
    const part = tithyamsaOf(sky);
    return TITHYAMSA_UNFAVOURABLE.includes(part) || TITHYAMSA_BY_VARA[sky.vara].includes(part);
  },
  varaDosha: () => false,
  ekargala: sky => {
    const yoga = yogaOf(sky.sun, sky.moon);
    if (!INAUSPICIOUS_YOGAS.includes(yoga)) return false;
    // The nakṣatra of the yoga (Viṣkambha: Puṣya, 7 on), and the Sun and the Moon at the same distance on either side of it.
    const centre = (yoga + 7) % 27;
    return (nakshatraOf(sky.sun) + nakshatraOf(sky.moon)) % 27 === (2 * centre) % 27;
  },
  dashaYoga: sky => DASHA_YOGA_REMAINDERS.includes((nakshatraOf(sky.sun) + 1 + nakshatraOf(sky.moon) + 1) % 27),
  jamitra: sky => jamitraRasi(sky) || jamitraNavamsa(sky),
  latta: sky => {
    const moon = nakshatraOf(sky.moon);
    return (Object.keys(LATTA_KICK) as FinderGraha[]).some(graha => kickedBy(sky, graha) === moon);
  },
  upagraha: sky => UPAGRAHA_POSITIONS.includes(((nakshatraOf(sky.moon) - nakshatraOf(sky.sun) + 27) % 27) + 1),
  pata: sky => PATA_TARGETS.some(target => nakshatraOf(sky.moon) === (target - nakshatraOf(sky.sun) + 27) % 27),
  eclipse: () => false,
  kunavamsa: sky => {
    const ascNavamsa = getVargaSignIndex(sky.asc, 9);
    if ((['Sun', 'Mars', 'Saturn'] as string[]).includes(SIGN_LORDS[ascNavamsa])) return true;
    return MALEFICS.some(graha => getVargaSignIndex(longitudeIn(sky, graha), 9) === ascNavamsa);
  },
  vyatipata: () => false,
  vaidhriti: () => false,
  shunyaRasi: sky => {
    const tithi = ((tithiOf(sky.sun, sky.moon) - 1) % 15) + 1;
    const empty = tithi === 15 ? [] : SHUNYA_RASIS_OF_TITHI[tithi - 1];
    if (empty.includes(signOf(sky.asc)) || empty.includes(getVargaSignIndex(sky.asc, 9))) return true;
    return sky.masa !== undefined && signOf(sky.moon) === SHUNYA_RASI_OF_MASA[sky.masa];
  },
  blindDeafLame: sky => {
    if (sky.day === undefined) return false;
    const sign = signOf(sky.asc);
    const set = sky.day ? BLIND_DEAF_LAME.day : BLIND_DEAF_LAME.night;
    return set.blind.includes(sign) || set.deaf.includes(sign) || set.lame.includes(sign);
  },
  mrityubhaga: sky => {
    const fatal = (table: string, longitude: number) => {
      const sign = signOf(longitude);
      return Math.abs((((longitude % 360) + 360) % 360) % 30 - FATAL_DEGREES[table][sign]) <= 1;
    };
    const check = (graha: string) => fatal(graha, longitudeIn(sky, graha as FinderGraha));
    const nakshatraLord = NAKSHATRA_LORDS[nakshatraOf(sky.moon) % 9];
    const yogaLord = NAKSHATRA_LORDS[(yogaOf(sky.sun, sky.moon) + 7) % 27 % 9];
    return fatal('Lagna', sky.asc) || check('Moon') || check(SIGN_LORDS[signOf(sky.asc)]) || check(nakshatraLord) || check(yogaLord);
  },
};

/** Whether a sky has the doṣa. The doṣas of a span of time (Saṅkrānti, eclipses, Vyatipāta, Vaidhṛti, the Vāra Doṣa) are never in a sky. */
export const hasDosha = (id: DoshaId, sky: DoshaSky, natal?: DoshaNatal, options?: DoshaOptions): boolean => HAS[id](sky, natal, options);

/** The doṣas that are only a span of time around an event, not a state of the sky. */
export const EVENT_DOSHAS: DoshaId[] = ['sankranti', 'varaDosha', 'eclipse', 'vyatipata', 'vaidhriti'];
