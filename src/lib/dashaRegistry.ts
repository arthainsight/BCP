import { DashaSettings } from '@/types';

export type DashaKey = keyof DashaSettings['dashas'];
export type DashaStatus = 'implemented' | 'beta' | 'placeholder';
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

  { key: 'tara', label: 'Tara Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shodashottari', label: 'Shodashottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'dwadashottari', label: 'Dwadashottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'panchottari', label: 'Panchottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shatabdika', label: 'Shatabdika Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'chaturashitiSama', label: 'Chaturashiti Sama Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'dwisaptatiSama', label: 'Dwisaptati Sama Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shashtihayani', label: 'Shashtihayani Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shattrimshaSama', label: 'Shattrimsha Sama Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'charaBeta', label: 'Chara Dasha old beta', group: 'Other systems', status: 'placeholder' },
  { key: 'sudarshanaChakra', label: 'Sudarshana Chakra Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'naisargika', label: 'Naisargika Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'pinda', label: 'Pinda Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'mandooka', label: 'Mandooka Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'manduka', label: 'Manduka Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'brahma', label: 'Brahma Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'drig', label: 'Drig Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'trikona', label: 'Trikona Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'kendradi', label: 'Kendradi Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'karaka', label: 'Karaka Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'lagnaKendradiRashi', label: 'Lagna Kendradi Rashi Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'atmakarakaKendradiRashi', label: 'Atmakaraka Kendradi Rashi Dasha', group: 'Other systems', status: 'placeholder' },
];

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
