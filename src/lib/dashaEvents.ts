import type { CharaOptions, PlanetData } from '@/types';
import { calculateCleanCharaMD, calculateCleanCharaSubDashas, type CleanCharaEntry } from './charaClean';
import { calculateKalachakra, calculateKalachakraAntardashas, type KalachakraEntry } from './kalachakra';
import { calculateVds } from './vds';
import { calculateSubDashas, calculateVimshottari, type MahadashaEntry } from './vimshottari';
import { calculateYogini, calculateYoginiSubDashas } from './yogini';
import { calculateAshtottari, calculateAshtottariSubDashas, evaluateAshtottariEligibility } from './ashtottari';
import type { NakshatraDashaEntry } from './nakshatraDasha';
import { calculateRasiDasha, calculateRasiSubDashas, type RasiDashaEntry, type RasiDashaSystem } from './rasiDashas';

export interface DashaEventLevel { level: string; value: string; }
export interface DashaEventSnapshot {
  key: 'vimshottari' | 'vds' | 'chara' | 'yogini' | 'ashtottari' | 'kalaChakra' | 'narayana' | 'moola' | 'sthira';
  label: string;
  levels: DashaEventLevel[];
  mdRange?: { startDate: Date; endDate: Date };
  note?: string;
}
interface SnapshotInput {
  eventDate: Date;
  birthDate: Date;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  charaOptions: CharaOptions;
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

export function calculateDashaEventSnapshots(input: SnapshotInput): DashaEventSnapshot[] {
  const { eventDate, birthDate, planets, ascendant, charaOptions } = input;
  if (eventDate < birthDate) return [
    { key: 'vimshottari', label: 'Vimsottari', levels: [], note: 'Date is before birth' },
    { key: 'vds', label: 'Vimsottari Original', levels: [], note: 'Date is before birth' },
    { key: 'chara', label: 'Chara Dasha', levels: [], note: 'Date is before birth' },
    { key: 'yogini', label: 'Yogini Dasha', levels: [], note: 'Date is before birth' },
    { key: 'ashtottari', label: 'Ashtottari Dasha', levels: [], note: 'Date is before birth' },
    { key: 'kalaChakra', label: 'Kalachakra Dasha', levels: [], note: 'Date is before birth' },
    { key: 'narayana', label: 'Narayana Dasha', levels: [], note: 'Date is before birth' },
    { key: 'moola', label: 'Mula Dasha', levels: [], note: 'Date is before birth' },
    { key: 'sthira', label: 'Sthira Dasha', levels: [], note: 'Date is before birth' },
  ];

  const moon = planets.find((planet) => planet.name === 'Moon');
  const sun = planets.find((planet) => planet.name === 'Sun');
  const snapshots: DashaEventSnapshot[] = [];

  const vimshottari = moon ? calculateVimshottari(moon.longitude, birthDate).entries : null;
  snapshots.push(vimshottari ? {
    key: 'vimshottari', label: 'Vimsottari', levels: vimshottariLevels(vimshottari, eventDate), mdRange: activeRange(vimshottari, eventDate),
  } : { key: 'vimshottari', label: 'Vimsottari', levels: [], note: 'Moon unavailable' });

  const planetLongitudes = Object.fromEntries(planets.map((planet) => [planet.name, planet.longitude]));
  const vds = moon && sun ? calculateVds({ moonLongitude: moon.longitude, sunLongitude: sun.longitude, lagnaLongitude: ascendant.longitude, lagnaSign: ascendant.sign, lagnaDegree: ascendant.degree, birthDate, planetLongitudes }) : null;
  snapshots.push({ key: 'vds', label: 'Vimsottari Original', levels: vds ? vimshottariLevels(vds.entries, eventDate) : [], mdRange: vds ? activeRange(vds.entries, eventDate) : undefined, note: vds ? undefined : 'Calculation unavailable' });

  const chara = calculateCleanCharaMD(planets, ascendant.sign, birthDate, charaOptions);
  snapshots.push({ key: 'chara', label: 'Chara Dasha', levels: chara ? charaLevels(chara.entries, eventDate, charaOptions) : [], mdRange: chara ? activeRange(chara.entries, eventDate) : undefined, note: chara ? undefined : 'Calculation unavailable' });

  if (moon) {
    const yogini = calculateYogini(moon.longitude, birthDate);
    snapshots.push({ key: 'yogini', label: 'Yogini Dasha', levels: nakshatraDashaLevels(yogini.entries, eventDate, calculateYoginiSubDashas), mdRange: activeRange(yogini.entries, eventDate) });
    const eligibility = evaluateAshtottariEligibility(planets, ascendant.sign);
    const ashtottari = calculateAshtottari(moon.longitude, birthDate);
    snapshots.push(eligibility.eligible
      ? { key: 'ashtottari', label: 'Ashtottari Dasha', levels: nakshatraDashaLevels(ashtottari.entries, eventDate, calculateAshtottariSubDashas), mdRange: activeRange(ashtottari.entries, eventDate) }
      : { key: 'ashtottari', label: 'Ashtottari Dasha', levels: [], note: `Conditional: not applicable (${eligibility.relativeHouse ?? '?'}H Rahu from Lagna lord)` });
  } else {
    snapshots.push({ key: 'yogini', label: 'Yogini Dasha', levels: [], note: 'Moon unavailable' });
    snapshots.push({ key: 'ashtottari', label: 'Ashtottari Dasha', levels: [], note: 'Moon unavailable' });
  }

  if (moon) {
    const kalachakra = calculateKalachakra(moon.longitude, birthDate);
    snapshots.push({ key: 'kalaChakra', label: 'Kalachakra Dasha', levels: kalachakraLevels(kalachakra.entries, kalachakra.cycle, eventDate), mdRange: activeRange(kalachakra.entries, eventDate) });
  } else snapshots.push({ key: 'kalaChakra', label: 'Kalachakra Dasha', levels: [], note: 'Moon unavailable' });

  for (const [system, key, label] of [
    ['narayana', 'narayana', 'Nārāyaṇa Dasha'],
    ['moola', 'moola', 'Mūla Dasha'],
    ['sthira', 'sthira', 'Sthira Dasha'],
  ] as const) {
    const result = calculateRasiDasha(system, planets, ascendant.sign, birthDate);
    snapshots.push({ key, label, levels: rasiLevels(result.entries, eventDate, planets, system), mdRange: activeRange(result.entries, eventDate) });
  }

  return snapshots.map((snapshot) => snapshot.levels.length || snapshot.note ? snapshot : { ...snapshot, note: 'Date is outside the calculated cycle' });
}
