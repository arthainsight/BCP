import type { CharaOptions, PlanetData, RasiDashaOptions } from '@/types';
import { calculateCleanCharaMD, calculateCleanCharaSubDashas, type CleanCharaEntry } from './charaClean';
import { calculateKalachakra, calculateKalachakraAntardashas, type KalachakraEntry } from './kalachakra';
import { calculateVds } from './vds';
import { calculateSubDashas, calculateVimshottari, type MahadashaEntry } from './vimshottari';
import { calculateVimshottariVariant, moonHouse, VARIANT_LABELS, variantNotApplicable, type VimshottariVariantChoice } from './vimshottariVariants';
import { calculateYogini, calculateYoginiSubDashas } from './yogini';
import { calculateNaisargika, calculateNaisargikaSubDashas } from './naisargika';
import { calculateAshtottari, calculateAshtottariSubDashas, evaluateAshtottariEligibility } from './ashtottari';
import type { NakshatraDashaEntry } from './nakshatraDasha';
import { calculateRasiDasha, calculateRasiSubDashas, type RasiDashaEntry, type RasiDashaSystem } from './rasiDashas';

export interface DashaEventLevel { level: string; value: string; }
export interface DashaEventSnapshot {
  key: 'vimshottari' | 'vimshottariVariant' | 'vds' | 'chara' | 'yogini' | 'ashtottari' | 'kalaChakra' | 'naisargika' | 'narayana' | 'moola' | 'sthira';
  label: string;
  levels: DashaEventLevel[];
  mdRange?: { startDate: Date; endDate: Date };
  note?: string;
}

/** The daśā systems an event is read in, in the order they are shown. Each is also the name of its switch in `DashaSettings.dashas`. */
export const DASHA_SNAPSHOT_KEYS: readonly DashaEventSnapshot['key'][] = ['vimshottari', 'vimshottariVariant', 'vds', 'chara', 'yogini', 'ashtottari', 'kalaChakra', 'naisargika', 'narayana', 'moola', 'sthira'];
interface SnapshotInput {
  eventDate: Date;
  birthDate: Date;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  charaOptions: CharaOptions;
  rasiOptions: RasiDashaOptions;
  /** Which of Utpanna, Kṣema and Ādhāna the variant Vimśottarī starts from; auto when missing. */
  variantChoice?: VimshottariVariantChoice;
}

function activeEntry<T extends { startDate: Date; endDate: Date }>(entries: T[], date: Date): T | null {
  return entries.find((entry) => date >= entry.startDate && date < entry.endDate) ?? null;
}
function activeRange<T extends { startDate: Date; endDate: Date }>(entries: T[], date: Date) {
  const md = activeEntry(entries, date);
  return md ? { startDate: md.startDate, endDate: md.endDate } : undefined;
}
function vimshottariLevels(entries: MahadashaEntry[], date: Date): DashaEventLevel[] {
  const md = activeEntry(entries, date);
  if (!md) return [];
  const ad = activeEntry(calculateSubDashas(md), date);
  const pd = ad ? activeEntry(calculateSubDashas(ad), date) : null;
  return [{ level: 'MD', value: md.lord }, ...(ad ? [{ level: 'AD', value: ad.lord }] : []), ...(pd ? [{ level: 'PD', value: pd.lord }] : [])];
}
function charaLevels(entries: CleanCharaEntry[], date: Date, options: CharaOptions): DashaEventLevel[] {
  const md = activeEntry(entries, date);
  if (!md) return [];
  const ad = activeEntry(calculateCleanCharaSubDashas(md, options), date);
  const pd = ad ? activeEntry(calculateCleanCharaSubDashas(ad, options), date) : null;
  return [{ level: 'MD', value: md.abbr }, ...(ad ? [{ level: 'AD', value: ad.abbr }] : []), ...(pd ? [{ level: 'PD', value: pd.abbr }] : [])];
}
function nakshatraDashaLevels(entries: NakshatraDashaEntry[], date: Date, children: (parent: NakshatraDashaEntry) => NakshatraDashaEntry[]): DashaEventLevel[] {
  const md = activeEntry(entries, date);
  if (!md) return [];
  const ad = activeEntry(children(md), date);
  const pd = ad ? activeEntry(children(ad), date) : null;
  const value = (entry: NakshatraDashaEntry) => entry.name === entry.lord ? entry.lord : `${entry.name} (${entry.lord})`;
  return [{ level: 'MD', value: value(md) }, ...(ad ? [{ level: 'AD', value: value(ad) }] : []), ...(pd ? [{ level: 'PD', value: value(pd) }] : [])];
}
function kalachakraLevels(entries: KalachakraEntry[], cycle: number[], date: Date): DashaEventLevel[] {
  const md = activeEntry(entries, date);
  if (!md) return [];
  const ad = activeEntry(calculateKalachakraAntardashas(md, cycle), date);
  return [{ level: 'MD', value: md.signName }, ...(ad ? [{ level: 'AD', value: ad.signName }] : [])];
}
function rasiLevels(entries: RasiDashaEntry[], date: Date, planets: PlanetData[], system: RasiDashaSystem): DashaEventLevel[] {
  const md = activeEntry(entries, date);
  if (!md) return [];
  const ad = activeEntry(calculateRasiSubDashas(md, planets, system), date);
  const pd = ad ? activeEntry(calculateRasiSubDashas(ad, planets, system), date) : null;
  return [{ level: 'MD', value: md.abbr }, ...(ad ? [{ level: 'AD', value: ad.abbr }] : []), ...(pd ? [{ level: 'PD', value: pd.abbr }] : [])];
}

/** The name each dasha system goes by in the event list and its cards. */
export const DASHA_SYSTEM_LABELS = {
  vimshottari: 'Vimsottari',
  vimshottariVariant: 'Vimsottari Utpanna / Kshema / Adhana',
  vds: 'Vimsottari Original (U K Jha)',
  chara: 'Chara Dasha',
  yogini: 'Yogini Dasha',
  ashtottari: 'Ashtottari Dasha',
  kalaChakra: 'Kalachakra Dasha',
  naisargika: 'Naisargika Dasha',
  narayana: 'Narayana Dasha',
  moola: 'Mula Dasha',
  sthira: 'Sthira Dasha',
} as const;

export function calculateDashaEventSnapshots(input: SnapshotInput): DashaEventSnapshot[] {
  const { eventDate, birthDate, planets, ascendant, charaOptions, rasiOptions, variantChoice = 'auto' } = input;
  if (eventDate < birthDate) return [
    { key: 'vimshottari', label: DASHA_SYSTEM_LABELS.vimshottari, levels: [], note: 'Date is before birth' },
    { key: 'vimshottariVariant', label: DASHA_SYSTEM_LABELS.vimshottariVariant, levels: [], note: 'Date is before birth' },
    { key: 'vds', label: DASHA_SYSTEM_LABELS.vds, levels: [], note: 'Date is before birth' },
    { key: 'chara', label: DASHA_SYSTEM_LABELS.chara, levels: [], note: 'Date is before birth' },
    { key: 'yogini', label: DASHA_SYSTEM_LABELS.yogini, levels: [], note: 'Date is before birth' },
    { key: 'ashtottari', label: DASHA_SYSTEM_LABELS.ashtottari, levels: [], note: 'Date is before birth' },
    { key: 'kalaChakra', label: DASHA_SYSTEM_LABELS.kalaChakra, levels: [], note: 'Date is before birth' },
    { key: 'naisargika', label: DASHA_SYSTEM_LABELS.naisargika, levels: [], note: 'Date is before birth' },
    { key: 'narayana', label: DASHA_SYSTEM_LABELS.narayana, levels: [], note: 'Date is before birth' },
    { key: 'moola', label: DASHA_SYSTEM_LABELS.moola, levels: [], note: 'Date is before birth' },
    { key: 'sthira', label: DASHA_SYSTEM_LABELS.sthira, levels: [], note: 'Date is before birth' },
  ];

  const moon = planets.find((planet) => planet.name === 'Moon');
  const sun = planets.find((planet) => planet.name === 'Sun');
  const snapshots: DashaEventSnapshot[] = [];

  const vimshottari = moon ? calculateVimshottari(moon.longitude, birthDate).entries : null;
  snapshots.push(vimshottari ? {
    key: 'vimshottari', label: DASHA_SYSTEM_LABELS.vimshottari, levels: vimshottariLevels(vimshottari, eventDate), mdRange: activeRange(vimshottari, eventDate),
  } : { key: 'vimshottari', label: DASHA_SYSTEM_LABELS.vimshottari, levels: [], note: 'Moon unavailable' });

  if (moon) {
    const variant = calculateVimshottariVariant(moon.longitude, birthDate, variantChoice, ascendant.sign);
    snapshots.push(variant
      ? { key: 'vimshottariVariant', label: `Vimsottari ${VARIANT_LABELS[variant.variant]}`, levels: vimshottariLevels(variant.entries, eventDate), mdRange: activeRange(variant.entries, eventDate) }
      : { key: 'vimshottariVariant', label: DASHA_SYSTEM_LABELS.vimshottariVariant, levels: [], note: variantNotApplicable(moonHouse(moon.longitude, ascendant.sign)) });
  } else snapshots.push({ key: 'vimshottariVariant', label: DASHA_SYSTEM_LABELS.vimshottariVariant, levels: [], note: 'Moon unavailable' });

  const planetLongitudes = Object.fromEntries(planets.map((planet) => [planet.name, planet.longitude]));
  const vds = moon && sun ? calculateVds({ moonLongitude: moon.longitude, sunLongitude: sun.longitude, lagnaLongitude: ascendant.longitude, lagnaSign: ascendant.sign, lagnaDegree: ascendant.degree, birthDate, planetLongitudes }) : null;
  snapshots.push({ key: 'vds', label: DASHA_SYSTEM_LABELS.vds, levels: vds ? vimshottariLevels(vds.entries, eventDate) : [], mdRange: vds ? activeRange(vds.entries, eventDate) : undefined, note: vds ? undefined : 'Calculation unavailable' });

  const chara = calculateCleanCharaMD(planets, ascendant.sign, birthDate, charaOptions);
  snapshots.push({ key: 'chara', label: DASHA_SYSTEM_LABELS.chara, levels: chara ? charaLevels(chara.entries, eventDate, charaOptions) : [], mdRange: chara ? activeRange(chara.entries, eventDate) : undefined, note: chara ? undefined : 'Calculation unavailable' });

  if (moon) {
    const yogini = calculateYogini(moon.longitude, birthDate);
    snapshots.push({ key: 'yogini', label: DASHA_SYSTEM_LABELS.yogini, levels: nakshatraDashaLevels(yogini.entries, eventDate, calculateYoginiSubDashas), mdRange: activeRange(yogini.entries, eventDate) });
    const eligibility = evaluateAshtottariEligibility(planets, ascendant.sign);
    const ashtottari = calculateAshtottari(moon.longitude, birthDate);
    snapshots.push(eligibility.eligible
      ? { key: 'ashtottari', label: DASHA_SYSTEM_LABELS.ashtottari, levels: nakshatraDashaLevels(ashtottari.entries, eventDate, calculateAshtottariSubDashas), mdRange: activeRange(ashtottari.entries, eventDate) }
      : { key: 'ashtottari', label: DASHA_SYSTEM_LABELS.ashtottari, levels: [], note: `Conditional: not applicable (${eligibility.relativeHouse ?? '?'}H Rahu from Lagna lord)` });
  } else {
    snapshots.push({ key: 'yogini', label: DASHA_SYSTEM_LABELS.yogini, levels: [], note: 'Moon unavailable' });
    snapshots.push({ key: 'ashtottari', label: DASHA_SYSTEM_LABELS.ashtottari, levels: [], note: 'Moon unavailable' });
  }

  if (moon) {
    const kalachakra = calculateKalachakra(moon.longitude, birthDate);
    snapshots.push({ key: 'kalaChakra', label: DASHA_SYSTEM_LABELS.kalaChakra, levels: kalachakraLevels(kalachakra.entries, kalachakra.cycle, eventDate), mdRange: activeRange(kalachakra.entries, eventDate) });
  } else snapshots.push({ key: 'kalaChakra', label: DASHA_SYSTEM_LABELS.kalaChakra, levels: [], note: 'Moon unavailable' });

  const naisargika = calculateNaisargika(birthDate).entries;
  snapshots.push({ key: 'naisargika', label: DASHA_SYSTEM_LABELS.naisargika, levels: nakshatraDashaLevels(naisargika, eventDate, parent => calculateNaisargikaSubDashas(parent, planets, ascendant.sign)), mdRange: activeRange(naisargika, eventDate) });

  for (const [system, key, label] of [
    ['narayana', 'narayana', 'Nārāyaṇa Dasha'],
    ['moola', 'moola', 'Mūla Dasha'],
    ['sthira', 'sthira', 'Sthira Dasha'],
  ] as const) {
    const result = calculateRasiDasha(system, planets, ascendant.sign, birthDate, rasiOptions);
    snapshots.push({ key, label, levels: rasiLevels(result.entries, eventDate, planets, system), mdRange: activeRange(result.entries, eventDate) });
  }

  return snapshots.map((snapshot) => snapshot.levels.length || snapshot.note ? snapshot : { ...snapshot, note: 'Date is outside the calculated cycle' });
}

/** Dasha systems whose periods belong to grahas, so their lords can be marked on a chart. */
export type GrahaDashaSystem = 'vimshottari' | 'vimshottariVariant' | 'vds' | 'yogini' | 'ashtottari' | 'naisargika';

export const GRAHA_DASHA_SYSTEMS: { key: GrahaDashaSystem; label: string; short: string }[] = [
  { key: 'vimshottari', label: 'Vimśottarī', short: 'Vimś' },
  { key: 'vimshottariVariant', label: 'Vimśottarī Utpanna / Kṣema / Ādhāna', short: 'Utp/Ksh/Adh' },
  { key: 'vds', label: 'Vimśottarī Original (U K Jha)', short: 'VDS' },
  { key: 'yogini', label: 'Yoginī', short: 'Yog' },
  { key: 'ashtottari', label: 'Aṣṭottarī', short: 'Aṣṭ' },
  { key: 'naisargika', label: 'Naisargika', short: 'Nais' },
];

/** A mahādaśā or antardaśā of a graha-based system: its lord and the time it runs. */
export interface DashaLordEntry { startDate: Date; endDate: Date; lord: string }

/** The mahādaśās of a graha-based system and how to get the antardaśās of one of them. */
export interface GrahaDashaTable {
  entries: DashaLordEntry[];
  children: (md: DashaLordEntry) => DashaLordEntry[];
}

function lordTable<T extends DashaLordEntry>(entries: T[], children: (md: T) => T[]): GrahaDashaTable {
  return { entries, children: md => children(md as T) };
}

/**
 * The mahādaśās and antardaśās of one graha-based system, or null when the system does not apply (Aṣṭottarī's condition) or the planets lack
 * what it starts from.
 */
export function grahaDashaTable(
  system: GrahaDashaSystem,
  input: Omit<SnapshotInput, 'eventDate' | 'charaOptions' | 'rasiOptions'>,
): GrahaDashaTable | null {
  const { birthDate, planets, ascendant, variantChoice = 'auto' } = input;
  const moon = planets.find(p => p.name === 'Moon');
  const sun = planets.find(p => p.name === 'Sun');
  if (!moon) return null;

  switch (system) {
    case 'vimshottari':
      return lordTable(calculateVimshottari(moon.longitude, birthDate).entries, calculateSubDashas);
    case 'vimshottariVariant': {
      const variant = calculateVimshottariVariant(moon.longitude, birthDate, variantChoice, ascendant.sign);
      return variant ? lordTable(variant.entries, calculateSubDashas) : null;
    }
    case 'vds': {
      if (!sun) return null;
      const planetLongitudes = Object.fromEntries(planets.map(p => [p.name, p.longitude]));
      const vds = calculateVds({ moonLongitude: moon.longitude, sunLongitude: sun.longitude, lagnaLongitude: ascendant.longitude, lagnaSign: ascendant.sign, lagnaDegree: ascendant.degree, birthDate, planetLongitudes });
      return vds ? lordTable(vds.entries, calculateSubDashas) : null;
    }
    case 'yogini':
      return lordTable(calculateYogini(moon.longitude, birthDate).entries, calculateYoginiSubDashas);
    case 'naisargika':
      return lordTable(calculateNaisargika(birthDate).entries, md => calculateNaisargikaSubDashas(md, planets, ascendant.sign));
    case 'ashtottari':
      if (!evaluateAshtottariEligibility(planets, ascendant.sign).eligible) return null;
      return lordTable(calculateAshtottari(moon.longitude, birthDate).entries, calculateAshtottariSubDashas);
  }
}

/**
 * Lords of the mahadasha and antardasha running at a date in one graha-based
 * system, or null when the system does not apply (Aṣṭottarī's condition) or
 * the date falls outside it.
 */
export function runningGrahaDashaLords(
  system: GrahaDashaSystem,
  input: Omit<SnapshotInput, 'charaOptions' | 'rasiOptions'>,
): { md: string; ad: string } | null {
  const { eventDate, birthDate } = input;
  if (eventDate < birthDate) return null;
  const table = grahaDashaTable(system, input);
  if (!table) return null;
  const md = activeEntry(table.entries, eventDate);
  const ad = md ? activeEntry(table.children(md), eventDate) : null;
  return md && ad ? { md: md.lord, ad: ad.lord } : null;
}
