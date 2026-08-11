import type { CharaOptions, PlanetData } from '@/types';
import { calculateCleanCharaMD, calculateCleanCharaSubDashas, type CleanCharaEntry } from './charaClean';
import { calculateKalachakra, calculateKalachakraAntardashas, type KalachakraEntry } from './kalachakra';
import { calculateVds } from './vds';
import { calculateSubDashas, calculateVimshottari, type MahadashaEntry } from './vimshottari';

export interface DashaEventLevel { level: string; value: string; }
export interface DashaEventSnapshot {
  key: 'vimshottari' | 'vds' | 'chara' | 'kalaChakra';
  label: string;
  levels: DashaEventLevel[];
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
function kalachakraLevels(entries: KalachakraEntry[], cycle: number[], date: Date): DashaEventLevel[] {
  const md = activeEntry(entries, date);
  if (!md) return [];
  const ad = activeEntry(calculateKalachakraAntardashas(md, cycle), date);
  return [{ level: 'MD', value: md.signName }, ...(ad ? [{ level: 'AD', value: ad.signName }] : [])];
}

export function calculateDashaEventSnapshots(input: SnapshotInput): DashaEventSnapshot[] {
  const { eventDate, birthDate, planets, ascendant, charaOptions } = input;
  if (eventDate < birthDate) return [
    { key: 'vimshottari', label: 'Vimsottari', levels: [], note: 'Date is before birth' },
    { key: 'vds', label: 'Vimsottari Original', levels: [], note: 'Date is before birth' },
    { key: 'chara', label: 'Chara Dasha', levels: [], note: 'Date is before birth' },
    { key: 'kalaChakra', label: 'Kalachakra Dasha', levels: [], note: 'Date is before birth' },
  ];

  const moon = planets.find((planet) => planet.name === 'Moon');
  const sun = planets.find((planet) => planet.name === 'Sun');
  const snapshots: DashaEventSnapshot[] = [];

  snapshots.push(moon ? {
    key: 'vimshottari', label: 'Vimsottari',
    levels: vimshottariLevels(calculateVimshottari(moon.longitude, birthDate).entries, eventDate),
  } : { key: 'vimshottari', label: 'Vimsottari', levels: [], note: 'Moon unavailable' });

  const planetLongitudes = Object.fromEntries(planets.map((planet) => [planet.name, planet.longitude]));
  const vds = moon && sun ? calculateVds({ moonLongitude: moon.longitude, sunLongitude: sun.longitude, lagnaLongitude: ascendant.longitude, lagnaSign: ascendant.sign, lagnaDegree: ascendant.degree, birthDate, planetLongitudes }) : null;
  snapshots.push({ key: 'vds', label: 'Vimsottari Original', levels: vds ? vimshottariLevels(vds.entries, eventDate) : [], note: vds ? undefined : 'Calculation unavailable' });

  const chara = calculateCleanCharaMD(planets, ascendant.sign, birthDate, charaOptions);
  snapshots.push({ key: 'chara', label: 'Chara Dasha', levels: chara ? charaLevels(chara.entries, eventDate, charaOptions) : [], note: chara ? undefined : 'Calculation unavailable' });

  if (moon) {
    const kalachakra = calculateKalachakra(moon.longitude, birthDate);
    snapshots.push({ key: 'kalaChakra', label: 'Kalachakra Dasha', levels: kalachakraLevels(kalachakra.entries, kalachakra.cycle, eventDate) });
  } else snapshots.push({ key: 'kalaChakra', label: 'Kalachakra Dasha', levels: [], note: 'Moon unavailable' });

  return snapshots.map((snapshot) => snapshot.levels.length || snapshot.note ? snapshot : { ...snapshot, note: 'Date is outside the calculated cycle' });
}
