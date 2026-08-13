import { DashaSettings } from '@/types';

export type DashaKey = keyof DashaSettings['dashas'];
export type DashaStatus = 'implemented' | 'beta';
export type DashaRendererKey = 'vimshottari' | 'vds' | 'chara' | 'kalachakra' | 'yogini' | 'ashtottari' | 'narayana' | 'moola' | 'sthira';

export type DashaRegistryItem = {
  key: DashaKey;
  label: string;
  group: string;
  status: DashaStatus;
  renderer?: DashaRendererKey;
  kind?: 'nakshatra' | 'rasi' | 'graha';
  conditional?: boolean;
};

export const DASHA_REGISTRY: DashaRegistryItem[] = [
  { key: 'vimshottari', label: 'Vimsottari', group: 'Core', status: 'implemented', renderer: 'vimshottari', kind: 'nakshatra' },
  { key: 'vds', label: 'Vimsottari Original', group: 'Core', status: 'implemented', renderer: 'vds', kind: 'nakshatra' },

  { key: 'chara', label: 'Chara Daśā', group: 'Core', status: 'implemented', renderer: 'chara' },
  { key: 'yogini', label: 'Yoginī Daśā', group: 'Core', status: 'implemented', renderer: 'yogini' },
  { key: 'ashtottari', label: 'Aṣṭottarī Daśā', group: 'Core', status: 'implemented', renderer: 'ashtottari', kind: 'nakshatra', conditional: true },
  { key: 'kalaChakra', label: 'Kālachakra Daśā', group: 'Core', status: 'implemented', renderer: 'kalachakra' },
  { key: 'narayana', label: 'Nārāyaṇa Daśā', group: 'Core', status: 'beta', renderer: 'narayana', kind: 'rasi' },
  { key: 'moola', label: 'Mūla Daśā', group: 'Core', status: 'beta', renderer: 'moola', kind: 'rasi' },
  { key: 'sthira', label: 'Sthira Daśā', group: 'Core', status: 'beta', renderer: 'sthira', kind: 'rasi' },
];
// v2.15: dropped the 22 "Other systems" placeholder rows (Tara, Brahma, Drig,
// Shodashottari, …). They had no renderer, rendered nowhere (SettingsPanel
// filters group === 'Core'), and each one cost a dead key in DashaSettings.
// When a new system is actually implemented, add its row here with a renderer
// and its key to DashaSettings in the same commit.

export const DASHA_GROUPS = DASHA_REGISTRY.reduce<{ title: string; items: DashaRegistryItem[] }[]>((groups, item) => {
  const group = groups.find((g) => g.title === item.group);
  if (group) {
    group.items.push(item);
  } else {
    groups.push({ title: item.group, items: [item] });
  }
  return groups;
}, []);

export const RENDERABLE_DASHAS = DASHA_REGISTRY.filter((item) => Boolean(item.renderer));
export const RENDERABLE_DASHA_KEYS = RENDERABLE_DASHAS.map((item) => item.key);
