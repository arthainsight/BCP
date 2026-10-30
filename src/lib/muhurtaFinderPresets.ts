// Ready-made choices for the Muhūrta Finder: what a source on the purpose names as favourable and to be avoided,
// written as the groups and rules of the finder. A group a preset leaves out stays as it is (everything).

import { BENEFICS, MALEFICS, type FinderGraha, type FinderRule } from './muhurtaFinder';

export interface FinderPreset {
  id: string;
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
}

const without = (size: number, first: number, out: number[]) =>
  Array.from({ length: size }, (_, index) => first + index).filter(value => !out.includes(value));

/**
 * Opening a store or starting a business. The nakṣatras are the favourable ones; of the tithis the 4th, 9th and 14th
 * (of both halves) are left out and a tithi that suits the trade is for the user to narrow further; the vāra of Mars
 * (Tuesday) is left out; the Ascendant is not Aquarius; Venus or the Moon is in the Lagna, no malefic is in the 8th and
 * the 12th, and a benefic is in the 2nd, 10th or 11th.
 */
export const FINDER_PRESETS: FinderPreset[] = [
  {
    id: 'business-opening',
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
];
