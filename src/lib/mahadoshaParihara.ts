// The pariharas (neutralisations) and the regions of the Mahādoṣas, as the Muhūrtacintāmaṇi (Rāma Daivajña, 1600) gives
// them in the chapter on marriage (vivāha prakaraṇa) and in the first chapter. A fault is not always a fault: the text
// lists what destroys each, and where it is to be kept clear of at all. docs/mahadosha-vs-muhurta-chintamani.md says
// which verse each rule is from and what is left out.
//
// Nothing here is a reading of the sky on its own: it is what `hasDosha` of mahadosha.ts asks, once it has found a fault,
// whether the sky takes it away.

import { combustionOf } from './combustion';
import { EXALTATION, DEBILITATION, NATURAL_ENEMIES, NATURAL_FRIENDS, OWN_SIGNS } from './dignity';
import { houseFrom, signOf, tithiOf, type FinderGraha } from './muhurtaFinder';
import { SIGN_LORDS } from './signs';
import { getVargaSignIndex } from './varga';
import type { DoshaSky } from './mahadosha';

/**
 * How much of the neutralisations of the text is applied.
 * `off`: none, every fault counts. `named`: the exception the text gives with that fault (the strong Sun and Moon against
 * the Ekārgalā family, v. 68; the weak malefics against Kartarī, Bhṛgu ṣaṭka, Aṣṭama Kuja and the Moon in the 6th, 8th and
 * 12th, v. 88; the friendly lords against the Aṣṭama Lagna, v. 46; and so on). `broad`: also the two verses that name a
 * list of faults and what destroys them all (v. 89 and 90). `all`: also the verse that says that Mercury, Venus or Jupiter in
 * an angle or a trine, or the lord of the Lagna in the 11th, burns the whole mass of faults (v. 91).
 */
export const PARIHARA_MODES = ['off', 'named', 'broad', 'all'] as const;
export type PariharaMode = (typeof PARIHARA_MODES)[number];
export const isPariharaMode = (value: string): value is PariharaMode => (PARIHARA_MODES as readonly string[]).includes(value);
export const PARIHARA_RANK: Record<PariharaMode, number> = { off: 0, named: 1, broad: 2, all: 3 };

/**
 * The countries the text names for a fault (v. 50, 51, 66, 69). The place of the muhūrta is given as the list of those it is
 * in; with no list every fault counts everywhere, and with a list a regional fault counts only in its own country.
 */
export const REGION_IDS = ['madhyadesha', 'kuruBahlika', 'vangaMagadha', 'saurashtraShalva', 'yamuna', 'gangaGodavari', 'kalingaGaudaGurjara'] as const;
export type RegionId = (typeof REGION_IDS)[number];
export const isRegionId = (value: string): value is RegionId => (REGION_IDS as readonly string[]).includes(value);

/** The names of the regions, and the faults of the text that each concerns. */
export const REGION_NAMES: Record<RegionId, { name: string; what: string }> = {
  madhyadesha: { name: 'Madhyadeśa (the middle country)', what: 'the Dagdha tithi (v. 66)' },
  kuruBahlika: { name: 'Kuru and Bāhlīka (the north-west)', what: 'the Upagraha nakṣatra (v. 69)' },
  vangaMagadha: { name: 'Vaṅga, Kaliṅga and Magadha (the east)', what: 'the Pāta (v. 69)' },
  saurashtraShalva: { name: 'Saurāṣṭra and Śālva (the west)', what: 'the Lattā (v. 69)' },
  yamuna: { name: 'the country of the Yamunā', what: 'the Yāmitra (v. 69)' },
  gangaGodavari: { name: 'between the Gaṅgā and the Godāvarī', what: 'Jupiter in the whole of Leo (v. 50)' },
  kalingaGaudaGurjara: { name: 'Kaliṅga, Gauḍa and Gurjara', what: 'Jupiter in the whole of Leo (v. 51)' },
};

/** The region a fault is bound to, when the text binds it to one (v. 66 and 69). */
export const REGION_OF_DOSHA: Partial<Record<string, RegionId>> = {
  dagdha: 'madhyadesha', upagraha: 'kuruBahlika', pata: 'vangaMagadha', latta: 'saurashtraShalva', jamitra: 'yamuna',
};

/** Whether a fault bound to a region counts at the place: always when the place is not given. */
export const regionAllows = (doshaId: string, regions: readonly RegionId[] | undefined): boolean => {
  const region = REGION_OF_DOSHA[doshaId];
  return region === undefined || regions === undefined || regions.includes(region);
};

const KENDRA = [1, 4, 7, 10];
const KONA = [5, 9];
const UPACHAYA = [3, 6, 10, 11];

const longitudeOf = (sky: DoshaSky, graha: FinderGraha): number => {
  if (graha === 'Sun') return sky.sun;
  if (graha === 'Moon') return sky.moon;
  if (graha === 'Asc') return sky.asc;
  if (graha === 'Ketu') return (sky.others.Rahu! + 180) % 360;
  return sky.others[graha]!;
};

export type SignRelation = 'exalted' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated';

/** What the sign (0 Aries to 11 Pisces) is to a graha: its exaltation, its own, the sign of a friend or an enemy, its fall. The nodes have none of them. */
export function signRelation(graha: string, sign: number): SignRelation {
  if (EXALTATION[graha] === undefined) return 'neutral';
  if (EXALTATION[graha] === sign + 1) return 'exalted';
  if (DEBILITATION[graha] === sign + 1) return 'debilitated';
  if (OWN_SIGNS[graha]?.includes(sign + 1)) return 'own';
  const lord = SIGN_LORDS[sign];
  if (NATURAL_FRIENDS[graha]?.includes(lord)) return 'friend';
  if (NATURAL_ENEMIES[graha]?.includes(lord)) return 'enemy';
  return 'neutral';
}

const isCombust = (sky: DoshaSky, graha: FinderGraha): boolean =>
  graha !== 'Sun' && combustionOf(graha, longitudeOf(sky, graha), sky.sun, sky.retro?.[graha] ?? false) !== null;

/**
 * "Strong" (balavān), which the verses use without saying what it is: here a graha in its own sign, in its exaltation or in the
 * sign of a friend, neither combust, and the Moon in the bright half. Shadbala is not worked out for a moment of the search.
 */
export function isStrong(sky: DoshaSky, graha: FinderGraha): boolean {
  const relation = signRelation(graha, signOf(longitudeOf(sky, graha)));
  if (relation !== 'own' && relation !== 'exalted' && relation !== 'friend') return false;
  if (isCombust(sky, graha)) return false;
  return graha !== 'Moon' || tithiOf(sky.sun, sky.moon) <= 15;
}

/** Whether a malefic is weak in the sense of v. 88: in the sign of an enemy, in its fall or combust (the nodes are never). */
export function isWeakMalefic(sky: DoshaSky, graha: FinderGraha): boolean {
  if (graha === 'Rahu' || graha === 'Ketu') return false;
  const relation = signRelation(graha, signOf(longitudeOf(sky, graha)));
  return relation === 'enemy' || relation === 'debilitated' || isCombust(sky, graha);
}

/** Whether the Moon is in the same sign in the Rāśi and the Navāṁśa (Vargottama). */
const isVargottama = (longitude: number) => signOf(longitude) === getVargaSignIndex(longitude, 9);

/** What the sky takes away, as far as the mode goes. Each flag is the condition of a verse. */
export interface Relief {
  mode: Exclude<PariharaMode, 'off'>;
  /** v. 68: the Sun and the Moon strong destroy Ekārgalā, Upagraha, Pāta, Lattā, Yāmitrī, Kartarī and Udayāsta. */
  sunMoonStrong: boolean;
  /** v. 89 and 90: Mercury, Venus or Jupiter strong in an angle or a trine, or Jupiter there, the Sun in the 11th, the Moon in an upachaya or Vargottama. */
  faultsOfLagna: boolean;
  /** v. 90: the Moon in the 11th destroys Dūrmuhūrta (and the Navāṁśa of a malefic). */
  moonEleventh: boolean;
  /** The text on the Gaṇḍānta (the Moon strong takes the tithi's away, Jupiter strong the Lagna's). */
  moonStrong: boolean;
  jupiterStrong: boolean;
  /** The text on the Viṣa Ghaṭī: the Moon in an angle or a trine, but not in the Lagna. */
  moonInAngleOrTrine: boolean;
  /** v. 91: Mercury, Venus or Jupiter in an angle (not the 7th) or a trine, or the lord of the Lagna or of its Navāṁśa in the 11th or an angle. */
  general: boolean;
  /** v. 49 and 51: the Sun in Aries frees Jupiter in Leo. */
  sunInAries: boolean;
}

/** The pariharas the sky has at the mode; undefined at `off`. */
export function reliefOf(sky: DoshaSky, mode: PariharaMode | undefined): Relief | undefined {
  if (!mode || mode === 'off') return undefined;
  const rank = PARIHARA_RANK[mode];
  const house = (graha: FinderGraha) => houseFrom(signOf(sky.asc), longitudeOf(sky, graha));
  const placed = (graha: FinderGraha, houses: number[]) => houses.includes(house(graha));
  const moonHouse = house('Moon');
  const relief: Relief = {
    mode,
    sunMoonStrong: isStrong(sky, 'Sun') && isStrong(sky, 'Moon'),
    faultsOfLagna: false,
    moonEleventh: rank >= PARIHARA_RANK.broad && moonHouse === 11,
    moonStrong: isStrong(sky, 'Moon'),
    jupiterStrong: isStrong(sky, 'Jupiter'),
    moonInAngleOrTrine: moonHouse !== 1 && [...KENDRA, ...KONA].includes(moonHouse),
    general: false,
    sunInAries: signOf(sky.sun) === 0,
  };
  if (rank >= PARIHARA_RANK.broad) {
    relief.faultsOfLagna =
      (['Mercury', 'Venus', 'Jupiter'] as FinderGraha[]).some(graha => isStrong(sky, graha) && placed(graha, [...KENDRA, ...KONA]))
      || placed('Jupiter', [...KENDRA, ...KONA])
      || house('Sun') === 11
      || UPACHAYA.includes(moonHouse)
      || isVargottama(sky.moon);
  }
  if (rank >= PARIHARA_RANK.all) {
    const lordsPlace = (sign: number) => {
      const lord = SIGN_LORDS[sign] as FinderGraha;
      return [11, ...KENDRA].includes(house(lord));
    };
    relief.general =
      (['Mercury', 'Venus', 'Jupiter'] as FinderGraha[]).some(graha => placed(graha, [1, 4, 10, ...KONA]))
      || lordsPlace(signOf(sky.asc))
      || lordsPlace(getVargaSignIndex(sky.asc, 9));
  }
  return relief;
}

/** The faults v. 68 says the strong Sun and Moon destroy. */
export const SUN_MOON_DESTROYS = ['ekargala', 'upagraha', 'pata', 'latta', 'jamitra', 'kartari', 'udayasta'] as const;

/** The faults v. 91 does not reach: the afflictions of Jupiter and Venus themselves. */
export const GENERAL_EXEMPT = ['jupiterVenus'] as const;

/**
 * Jupiter in Leo (v. 49 to 51): the whole sign is forbidden in the land between the Gaṅgā and the Godāvarī and in Kaliṅga, Gauḍa
 * and Gurjara; elsewhere only the first five pādas, Maghā and the first of Pūrva Phalgunī (the first 16°40′ of Leo).
 */
export function leoJupiterApplies(jupiter: number, regions: readonly RegionId[] | undefined): boolean {
  if (signOf(jupiter) !== 4) return false;
  if (regions === undefined || regions.includes('gangaGodavari') || regions.includes('kalingaGaudaGurjara')) return true;
  return (((jupiter % 360) + 360) % 360) % 30 < 50 / 3;
}

/** The Dagdha tithi (1 to 15 in its half) of each sign of the Sun, Aries first (v. 66). */
export const DAGDHA_TITHI_OF_SUN_SIGN = [6, 4, 8, 6, 10, 8, 12, 10, 2, 12, 4, 2];
