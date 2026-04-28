import { DashaSettings } from '@/types';

export type DashaKey = keyof DashaSettings['dashas'];
export type DashaStatus = 'implemented' | 'beta' | 'placeholder';
export type DashaRendererKey = 'bcp' | 'vimshottari' | 'vds' | 'chara';

export type DashaRegistryItem = {
  key: DashaKey;
  label: string;
  group: string;
  status: DashaStatus;
  renderer?: DashaRendererKey;
};

export const DASHA_REGISTRY: DashaRegistryItem[] = [
  { key: 'bcp', label: 'Bhrigu Chakra Paddhati', group: 'Core', status: 'implemented', renderer: 'bcp' },
  { key: 'vimshottari', label: 'Vimsottari', group: 'Core', status: 'implemented', renderer: 'vimshottari' },
  { key: 'vds', label: 'Vimsottari Original', group: 'Core', status: 'implemented', renderer: 'vds' },

  { key: 'chara', label: 'Chara Dasha', group: 'Experimental', status: 'beta', renderer: 'chara' },

  { key: 'tara', label: 'Tara Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'yogini', label: 'Yogini Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'ashtottari', label: 'Ashtottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shodashottari', label: 'Shodashottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'dwadashottari', label: 'Dwadashottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'panchottari', label: 'Panchottari Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shatabdika', label: 'Shatabdika Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'chaturashitiSama', label: 'Chaturashiti Sama Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'dwisaptatiSama', label: 'Dwisaptati Sama Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shashtihayani', label: 'Shashtihayani Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'shattrimshaSama', label: 'Shattrimsha Sama Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'charaBeta', label: 'Chara Dasha old beta', group: 'Other systems', status: 'placeholder' },
  { key: 'narayana', label: 'Narayana Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'kaalChakra', label: 'Kaal Chakra Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'kalaChakra', label: 'Kalachakra Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'sudarshanaChakra', label: 'Sudarshana Chakra Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'moola', label: 'Moola Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'naisargika', label: 'Naisargika Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'pinda', label: 'Pinda Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'mandooka', label: 'Mandooka Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'manduka', label: 'Manduka Dasha', group: 'Other systems', status: 'placeholder' },
  { key: 'sthira', label: 'Sthira Dasha', group: 'Other systems', status: 'placeholder' },
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
