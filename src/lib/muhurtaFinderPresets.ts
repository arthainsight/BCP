// Ready-made choices for the Muhūrta Finder: what a source on the purpose names as favourable and to be avoided,
// written as the groups and rules of the finder. A group a preset leaves out stays as it is (everything).
//
// The source is Ernst Wilhelm, Classical Muhurta, chapter 22 "Specific Muhurta Guidelines". A preset ticks what the book
// calls favourable (or "best"), leaves out what it says to avoid, and lists what it calls middling in `middling` without
// ticking it (a user who wants the wider choice ticks it). What the finder has no group for is named in `notApplied`.

import type { DoshaId } from './mahadosha';
import { BENEFICS, MALEFICS, RULE_GRAHAS, type FinderGraha, type FinderRule } from './muhurtaFinder';
import type { D1Key } from './muhurtaD1';

export interface FinderPreset {
  id: string;
  /** The kind of purpose, for the headings of the list. */
  category: string;
  /** The name of the purpose. */
  label: string;
  /** What it chooses, in words. */
  note: string;
  vara?: number[];
  tithi?: number[];
  nakshatra?: number[];
  yoga?: number[];
  karana?: number[];
  signs?: Partial<Record<FinderGraha, number[]>>;
  rules?: FinderRule[];
  /** The houses from the Moon at birth that suit (Chandrabala). */
  chandra?: number[];
  /** The tārās (1 to 9) that suit (Tarabala). */
  tara?: number[];
  /** The Mahādoṣas the source names for the purpose, to keep clear of. */
  avoid?: DoshaId[];
  /** The wishes about the Rāśi chart that the source names, a point each. */
  d1?: D1Key[];
  /** What the source calls middling and the preset does not tick: nakṣatras (0 to 26), tithis (1 to 30), signs of the Ascendant (0 to 11). */
  middling?: { nakshatra?: number[]; tithi?: number[]; asc?: number[] };
  /** What the source gives for the purpose that the finder does not use (keys of NOT_APPLIED). */
  notApplied?: NotApplied[];
  /** Marriage, a journey, entering a house: the book calls three Sarvārtha Siddhi yogas unfavourable for them (the month strip leaves them out). */
  sarvarthaExceptions?: boolean;
}

/** The things the source names that the finder has no group for, in a line each. */
export const NOT_APPLIED = {
  masa: 'the lunar month (Masa) with the sign of the Sun',
  ayana: 'the Ayana (Uttarāyaṇa or Dakṣiṇāyana) and the end of an Ayana or a Ṛtu',
  door: 'the direction the door faces',
  direction: 'the direction of the journey',
  pada: 'the pādas of the nakṣatras',
  dagdha: 'the Dagdha tithi of the Sun’s sign',
  timeOfDay: 'the part of the day or night',
  natal: 'the natal chart (the 8th from the Lagna and the Moon, the Janma Rāśi, the Ghāta nakṣatra)',
  lords: 'the Lagna lord and the lord of the Navāṁśa Lagna',
  gochara: 'the Gochara of the Sun, Jupiter and Venus from the Moon at birth',
  navamsa: 'the Navāṁśa and Drikkāṇa signs of the Lagna beyond the wish',
  combinations: 'the Combinations (Yogas formed by the grahas)',
  varaYogas: 'the Vāra–nakṣatra yogas and the grahas in nakṣatras on their own vāra',
  retrograde: 'the vāra of a retrograde graha',
  moonJoined: 'the Moon alone, or joined to one graha',
  sula: 'the Śūla of the tithis and vāras for the direction',
  venusFront: 'Venus in the front of the traveller',
  mukha: 'the Rāśis facing the Sun (Ūrdhva, Adho and Tiryag Mukha)',
  buildingKind: 'the kind of building (kitchen, granary, city and so on)',
  pregnancy: 'the wife being pregnant',
  eclipseNakshatra: 'the nakṣatra of a malefic that has passed or is next to come',
} as const;
export type NotApplied = keyof typeof NOT_APPLIED;

const without = (size: number, first: number, out: number[]) =>
  Array.from({ length: size }, (_, index) => first + index).filter(value => !out.includes(value));

/** The same days of both halves: tithi `n` of the bright half is `n`, of the dark half `15 + n`. */
const bothHalves = (days: number[]) => [...days, ...days.map(day => day + 15)];

const FIXED_SIGNS = [1, 4, 7, 10];
const NINE: FinderGraha[] = [...RULE_GRAHAS];

export const FINDER_PRESET_CATEGORIES = ['Business', 'Marriage', 'House and land', 'Travel'] as const;

export const FINDER_PRESETS: FinderPreset[] = [
  /**
   * Opening a store or starting a business. The nakṣatras are the favourable ones; of the tithis the 4th, 9th and 14th
   * (of both halves) are left out and a tithi that suits the trade is for the user to narrow further; the vāra of Mars
   * (Tuesday) is left out; the Ascendant is not Aquarius; Venus or the Moon is in the Lagna, no malefic is in the 8th and
   * the 12th, and a benefic is in the 2nd, 10th or 11th.
   */
  {
    id: 'business-opening',
    category: 'Business',
    label: 'Store or business opening',
    note: 'Nakṣatras Aśvinī, Rohiṇī, Mṛgaśīrṣa, Puṣya, Uttara Phalgunī, Hasta, Citrā, Anurādhā, Uttara Āṣāḍhā, Uttara Bhādrapadā and Revatī. Not the 4th, 9th or 14th tithi (of either half), not Tuesday, not Aquarius rising. Venus or the Moon in the Lagna, no malefic (Sun, Mars, Saturn, Rāhu, Ketu) in the 8th or the 12th, and a benefic (Moon, Mercury, Jupiter, Venus) in the 2nd, 10th or 11th. Narrow the tithi further for the trade, and remove a rule below to loosen the search.',
    nakshatra: [0, 3, 4, 7, 11, 12, 13, 16, 20, 25, 26],
    tithi: without(30, 1, [4, 9, 14, 19, 24, 29]),
    vara: without(7, 0, [2]),
    signs: { Asc: without(12, 0, [10]) },
    rules: [
      { kind: 'any', grahas: ['Venus', 'Moon'], houses: [1] },
      { kind: 'none', grahas: [...MALEFICS], houses: [8, 12] },
      { kind: 'any', grahas: [...BENEFICS], houses: [2, 10, 11] },
    ],
  },
  /**
   * The wedding. Nakṣatras Rohiṇī, Mṛgaśīrṣa, Maghā, Uttara Phalgunī, Hasta, Svātī, Anurādhā, Mūla, Uttara Āṣāḍhā, Uttara
   * Bhādrapadā and Revatī; the tithis 2, 3, 5, 7, 10, 11 and 13, the dark half only to the 8th (the later tithis of the dark
   * half harm the life of the couple), the Riktā tithis out; not Viṣṭi; not the vāras of the Sun, Mars and Saturn; the
   * Lagna Gemini, Virgo or Libra. The Bhāvas: neither the Moon nor a malefic in the Lagna, Saturn not in the 12th, Mars not
   * in the 8th or 10th, Venus not in the 6th, the Moon not in the 6th or 8th, no benefic in the 8th. The eleven Mahādoṣas the
   * book names first for the wedding. Jāmitra, Lattā, Upagraha, Pāta and the blind, deaf and lame Lagna are named too, but with
   * the rest they leave no time in a year (tried from November 2026 in Helsinki), so they are not set. Tarabala and Chandrabala
   * are the wishes of the start.
   */
  {
    id: 'marriage-wedding',
    category: 'Marriage',
    label: 'Wedding',
    note: 'Nakṣatras Rohiṇī, Mṛgaśīrṣa, Maghā, Uttara Phalgunī, Hasta, Svātī, Anurādhā, Mūla, Uttara Āṣāḍhā, Uttara Bhādrapadā and Revatī. Tithis 2, 3, 5, 7, 10, 11 and 13, in the dark half only up to the 8th. Not Viṣṭi, not the vāras of the Sun, Mars and Saturn. Gemini, Virgo or Libra rising. Neither the Moon nor a malefic in the Lagna, Saturn not in the 12th, Mars not in the 8th or 10th, Venus not in the 6th, the Moon not in the 6th or 8th, no benefic in the 8th. The eleven Mahādoṣas the book names first for the wedding are set to be avoided; Jāmitra, Lattā, Upagraha, Pāta and the blind, deaf and lame Lagna are named too, but together with the rest they leave no time in a year, so tick them one at a time. The Navāṁśa Lagna of a benefic is a wish. The Tarabala and Chandrabala (the natal Moon) are the wishes of the start; the book asks for the Moon to suit both of the couple.',
    nakshatra: [3, 4, 9, 11, 12, 14, 16, 18, 20, 25, 26],
    tithi: [2, 3, 5, 7, 10, 11, 13, 17, 18, 20, 22],
    karana: without(11, 0, [6]),
    vara: [1, 3, 4, 5],
    signs: { Asc: [2, 5, 6] },
    rules: [
      { kind: 'none', grahas: ['Moon', ...MALEFICS], houses: [1] },
      { kind: 'none', grahas: ['Saturn'], houses: [12] },
      { kind: 'none', grahas: ['Mars'], houses: [8, 10] },
      { kind: 'none', grahas: ['Venus'], houses: [6] },
      { kind: 'none', grahas: ['Moon'], houses: [6, 8] },
      { kind: 'none', grahas: ['Mercury', 'Jupiter', 'Venus'], houses: [8] },
    ],
    avoid: ['udayasta', 'sankranti', 'ekargala', 'bhriguShatka', 'ashtamaKuja', 'gandanta', 'kartari', 'sangraha', 'ashtamaLagna', 'vyatipata', 'vaidhriti'],
    d1: ['navamsaLagnaBenefic'],
    middling: { tithi: [1, 6, 8, 12, 15, 16, 21, 23], asc: [1, 3, 4, 8, 10] },
    notApplied: ['masa', 'ayana', 'pada', 'dagdha', 'natal', 'lords', 'gochara', 'navamsa', 'combinations', 'varaYogas', 'moonJoined', 'eclipseNakshatra'],
    sarvarthaExceptions: true,
  },
  /**
   * Laying the foundation of a house or building (the beginning of construction). Nakṣatras Rohiṇī, Mṛgaśīrṣa, Puṣya,
   * Uttara Phalgunī, Citrā, Svātī, Anurādhā, Mūla, Uttara Āṣāḍhā, Śravaṇa, Uttara Bhādrapadā and Revatī; the tithis 2, 6, 10
   * and the odd ones but the 9th (Amāvasyā left out); the vāras of the Moon, Mercury, Jupiter, Venus and Saturn; a fixed
   * Lagna. A benefic in the Lagna, the 2nd or the 9th; no graha in the 8th; no malefic in the 12th.
   */
  {
    id: 'construction-start',
    category: 'House and land',
    label: 'Laying the foundation (beginning construction)',
    note: 'Nakṣatras Rohiṇī, Mṛgaśīrṣa, Puṣya, Uttara Phalgunī, Citrā, Svātī, Anurādhā, Mūla, Uttara Āṣāḍhā, Śravaṇa, Uttara Bhādrapadā and Revatī. Tithis 2, 6, 10 and the odd ones but the 9th (Amāvasyā is left out). The vāras of the Moon, Mercury, Jupiter, Venus and Saturn. A fixed Rāśi rising (Taurus, Leo, Scorpio, Aquarius). A benefic in the Lagna, the 2nd or the 9th, no graha in the 8th and no malefic in the 12th. Jupiter and Venus are kept clear of afflictions (Udayāsta).',
    nakshatra: [3, 4, 7, 11, 13, 14, 16, 18, 20, 21, 25, 26],
    tithi: [...bothHalves([1, 2, 3, 5, 6, 7, 10, 11, 13, 15]).filter(tithi => tithi !== 30)],
    vara: [1, 3, 4, 5, 6],
    signs: { Asc: FIXED_SIGNS },
    rules: [
      { kind: 'any', grahas: [...BENEFICS], houses: [1, 2, 9] },
      { kind: 'none', grahas: NINE, houses: [8] },
      { kind: 'none', grahas: [...MALEFICS], houses: [12] },
    ],
    avoid: ['udayasta'],
    middling: { nakshatra: [0, 6, 12, 22, 23], asc: [2, 5, 8, 11] },
    notApplied: ['masa', 'door', 'buildingKind', 'mukha', 'gochara', 'varaYogas', 'pregnancy', 'natal'],
  },
  /**
   * Entering a new house (Gṛhapraveśa). The nakṣatras of both lists (Kālaprakāśikā and Muhūrta Cintāmaṇi) are best:
   * Rohiṇī, Mṛgaśīrṣa, Uttara Phalgunī, Anurādhā, Uttara Āṣāḍhā, Uttara Bhādrapadā and Revatī; the others the two
   * sources add are middling. Tithis 2, 3, 5, 7, 10 of both halves, 11 and 13 of the bright half and the 1st of the dark half.
   */
  {
    id: 'house-entering',
    category: 'House and land',
    label: 'Entering a new house (Gṛhapraveśa)',
    note: 'Nakṣatras Rohiṇī, Mṛgaśīrṣa, Uttara Phalgunī, Anurādhā, Uttara Āṣāḍhā, Uttara Bhādrapadā and Revatī (the others of the two classical lists are middling). Tithis 2, 3, 5, 7 and 10 of both halves, the 11th and 13th of the bright half, the 1st of the dark half. The vāras of the Moon, Mercury, Jupiter and Venus. A fixed Rāśi rising. No graha in the 8th; Jupiter and Venus kept clear of afflictions; the Navāṁśa Lagna of a benefic is a wish.',
    nakshatra: [3, 4, 11, 16, 20, 25, 26],
    tithi: [2, 3, 5, 7, 10, 11, 13, 16, 17, 18, 20, 22, 25],
    vara: [1, 3, 4, 5],
    signs: { Asc: FIXED_SIGNS },
    rules: [{ kind: 'none', grahas: NINE, houses: [8] }],
    avoid: ['udayasta'],
    d1: ['navamsaLagnaBenefic'],
    middling: { nakshatra: [6, 7, 12, 13, 21, 23], asc: [2, 5, 8, 11] },
    notApplied: ['ayana', 'masa', 'door', 'natal', 'navamsa', 'mukha', 'varaYogas'],
    sarvarthaExceptions: true,
  },
  /**
   * Purchasing real estate. Nakṣatras Aśvinī, Rohiṇī, Mṛgaśīrṣa, Punarvasu, Puṣya, Uttara Phalgunī, Hasta, Svātī, Anurādhā,
   * Uttara Āṣāḍhā, Śravaṇa, Dhaniṣṭhā, Śatabhiṣā and Uttara Bhādrapadā; not the Riktā tithis 4, 9, 14; not Viṣṭi; the vāras of
   * the Moon, Mars, Mercury and Saturn; a fixed Lagna; no graha in the 8th.
   */
  {
    id: 'real-estate-purchase',
    category: 'House and land',
    label: 'Purchasing real estate',
    note: 'Nakṣatras Aśvinī, Rohiṇī, Mṛgaśīrṣa, Punarvasu, Puṣya, Uttara Phalgunī, Hasta, Svātī, Anurādhā, Uttara Āṣāḍhā, Śravaṇa, Dhaniṣṭhā, Śatabhiṣā and Uttara Bhādrapadā. Not the 4th, 9th or 14th tithi, not Viṣṭi. The vāras of the Moon, Mars, Mercury and Saturn. A fixed Rāśi rising (the dual ones are middling). No graha in the 8th.',
    nakshatra: [0, 3, 4, 6, 7, 11, 12, 14, 16, 20, 21, 22, 23, 25],
    tithi: without(30, 1, [4, 9, 14, 19, 24, 29]),
    karana: without(11, 0, [6]),
    vara: [1, 2, 3, 6],
    signs: { Asc: FIXED_SIGNS },
    rules: [{ kind: 'none', grahas: NINE, houses: [8] }],
    middling: { asc: [2, 5, 8, 11] },
    notApplied: ['lords', 'combinations'],
  },
  /**
   * Commencing a journey, the factors that do not depend on the direction or the traveller's chart. Nakṣatras Aśvinī,
   * Mṛgaśīrṣa, Puṣya, Hasta, Anurādhā, Śravaṇa, Dhaniṣṭhā and Revatī (the most favourable); the tithis 2, 3, 5, 7, 10, 11 and
   * 13; the vāras of Mercury, Jupiter and Venus; the Lagna Taurus, Leo, Libra or Sagittarius. The Moon not in the 1st, 4th, 6th,
   * 8th or 12th, Saturn not in the 10th, Venus not in the 7th, Jupiter not in the 3rd, 7th or 8th, no graha in the 12th, and
   * Mercury, Jupiter or Venus in an angle or a trine.
   */
  {
    id: 'journey-start',
    category: 'Travel',
    label: 'Commencing a journey',
    note: 'Nakṣatras Aśvinī, Mṛgaśīrṣa, Puṣya, Hasta, Anurādhā, Śravaṇa, Dhaniṣṭhā and Revatī. Tithis 2, 3, 5, 7, 10, 11 and 13 of either half. The vāras of Mercury, Jupiter and Venus. Taurus, Leo, Libra or Sagittarius rising. The Moon not in the 1st, 4th, 6th, 8th or 12th, Saturn not in the 10th, Venus not in the 7th, Jupiter not in the 3rd, 7th or 8th, no graha in the 12th, and Mercury, Jupiter or Venus in an angle or a trine. Jupiter and Venus are kept clear of afflictions; the Tarabala must suit. The chart of the traveller and the direction matter much in the book, and are not used.',
    nakshatra: [0, 4, 7, 12, 16, 21, 22, 26],
    tithi: bothHalves([2, 3, 5, 7, 10, 11, 13]),
    vara: [3, 4, 5],
    signs: { Asc: [1, 4, 6, 8] },
    rules: [
      { kind: 'none', grahas: ['Moon'], houses: [1, 4, 6, 8, 12] },
      { kind: 'none', grahas: ['Saturn'], houses: [10] },
      { kind: 'none', grahas: ['Venus'], houses: [7] },
      { kind: 'none', grahas: ['Jupiter'], houses: [3, 7, 8] },
      { kind: 'none', grahas: NINE, houses: [12] },
      { kind: 'any', grahas: ['Mercury', 'Jupiter', 'Venus'], houses: [1, 4, 5, 7, 9, 10] },
    ],
    avoid: ['udayasta'],
    middling: { nakshatra: [3, 6, 11, 13, 18, 20, 23], tithi: [16], asc: [0, 3, 5, 7, 9] },
    notApplied: ['direction', 'sula', 'venusFront', 'timeOfDay', 'pada', 'natal', 'retrograde', 'ayana', 'navamsa', 'lords'],
    sarvarthaExceptions: true,
  },
];
