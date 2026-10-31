import { DashaSettings } from '@/types';
import { NAKSHATRA_SYSTEMS, type NakshatraSystemKey } from './nakshatraSystems';

export type DashaKey = keyof DashaSettings['dashas'];
export type DashaStatus = 'implemented' | 'beta';
export type DashaRendererKey = 'vimshottari' | 'vimshottariVariant' | 'vds' | 'chara' | 'kalachakra' | 'yogini' | 'ashtottari' | 'naisargika' | 'narayana' | 'moola' | 'sthira' | 'paindi' | 'amshi' | 'yogardha' | 'drig' | 'trikona' | 'shula' | 'mandooka' | NakshatraSystemKey;

/**
 * How the Dasas tab sorts the daśās: those that run by the Moon's nakṣatra (Vimśottarī and its kin, Yoginī, Aṣṭottarī), those
 * that run by signs (Chara, Kālachakra, Nārāyaṇa, Mūla, Sthira) and the others, which no system is yet.
 */
export type DashaFamily = 'nakshatra' | 'rasi' | 'other';
export const DASHA_FAMILIES: { key: DashaFamily; label: string }[] = [
  { key: 'nakshatra', label: 'Nakshatra daśās' },
  { key: 'rasi', label: 'Rāśi daśās' },
  { key: 'other', label: 'Other daśās' },
];

export type DashaRegistryItem = {
  key: DashaKey;
  label: string;
  group: string;
  status: DashaStatus;
  family: DashaFamily;
  renderer?: DashaRendererKey;
  kind?: 'nakshatra' | 'rasi' | 'graha';
  conditional?: boolean;
};

export const DASHA_REGISTRY: DashaRegistryItem[] = [
  { key: 'vimshottari', label: 'Vimsottari', group: 'Core', status: 'implemented', family: 'nakshatra', renderer: 'vimshottari', kind: 'nakshatra' },
  { key: 'vimshottariVariant', label: 'Vimsottari Utpanna / Kshema / Adhana', group: 'Core', status: 'implemented', family: 'nakshatra', renderer: 'vimshottariVariant', kind: 'nakshatra', conditional: true },
  { key: 'vds', label: 'Vimsottari Original (U K Jha)', group: 'Core', status: 'implemented', family: 'nakshatra', renderer: 'vds', kind: 'nakshatra' },

  { key: 'chara', label: 'Chara Daśā', group: 'Core', status: 'implemented', family: 'rasi', renderer: 'chara' },
  { key: 'yogini', label: 'Yoginī Daśā', group: 'Core', status: 'implemented', family: 'nakshatra', renderer: 'yogini' },
  { key: 'ashtottari', label: 'Aṣṭottarī Daśā', group: 'Core', status: 'implemented', family: 'nakshatra', renderer: 'ashtottari', kind: 'nakshatra', conditional: true },
  // The eight conditional nakṣatra daśās of BPHS 46.24–43, each with the condition the text gives it (nakshatraSystems.ts).
  ...NAKSHATRA_SYSTEMS.map((system): DashaRegistryItem => ({ key: system.key, label: `${system.name} Daśā`, group: 'Core', status: 'implemented', family: 'nakshatra', renderer: system.key, kind: 'nakshatra', conditional: true })),
  { key: 'kalaChakra', label: 'Kālachakra Daśā', group: 'Core', status: 'implemented', family: 'rasi', renderer: 'kalachakra' },
  { key: 'naisargika', label: 'Naisargika Daśā', group: 'Core', status: 'implemented', family: 'other', renderer: 'naisargika', kind: 'graha' },
  // The daśās of the length of life (BPHS 46.201–202); off to begin with.
  { key: 'paindi', label: 'Paiṇḍī Daśā', group: 'Core', status: 'beta', family: 'other', renderer: 'paindi', kind: 'graha' },
  { key: 'amshi', label: 'Aṃśī Daśā', group: 'Core', status: 'beta', family: 'other', renderer: 'amshi', kind: 'graha' },
  { key: 'narayana', label: 'Nārāyaṇa Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'narayana', kind: 'rasi' },
  { key: 'moola', label: 'Mūla Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'moola', kind: 'rasi' },
  { key: 'sthira', label: 'Sthira Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'sthira', kind: 'rasi' },
  // The other rāśi daśās of the Jaimini Sūtras (adhyāya 2) and BPHS 46; off to begin with.
  { key: 'yogardha', label: 'Yogārdha Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'yogardha', kind: 'rasi' },
  { key: 'drig', label: 'Dṛg Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'drig', kind: 'rasi' },
  { key: 'trikona', label: 'Trikoṇa Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'trikona', kind: 'rasi' },
  { key: 'shula', label: 'Śūla Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'shula', kind: 'rasi' },
  { key: 'mandooka', label: 'Maṇḍūka Daśā', group: 'Core', status: 'beta', family: 'rasi', renderer: 'mandooka', kind: 'rasi' },
];
// v2.15: dropped the 22 "Other systems" placeholder rows (Tara, Brahma, Drig,
// Shodashottari, …). They had no renderer, rendered nowhere (SettingsPanel
// filters group === 'Core'), and each one cost a dead key in DashaSettings.
// When a new system is actually implemented, add its row here with a renderer
// and its key to DashaSettings in the same commit.

export const RENDERABLE_DASHAS = DASHA_REGISTRY.filter((item) => Boolean(item.renderer));
