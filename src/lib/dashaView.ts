import type { CharaOptions, DashaSettings, RasiDashaOptions } from '@/types';
import type { VimshottariVariantChoice } from '@/lib/vimshottariVariants';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import type { DashaEventSnapshot } from '@/lib/dashaEvents';

/** The options the dasha snapshot calculation needs, with the defaults filled in. */
export function dashaSnapshotOptions(dashaSettings: DashaSettings): {
  charaOptions: CharaOptions;
  rasiOptions: RasiDashaOptions;
  variantChoice: VimshottariVariantChoice;
  enabled: DashaSettings['dashas'];
} {
  return {
    charaOptions: dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions,
    rasiOptions: { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions },
    variantChoice: dashaSettings.variantChoice ?? DEFAULT_DASHA_SETTINGS.variantChoice,
    enabled: { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas },
  };
}

/** The snapshots of the systems that are switched on in Settings → Dasha. */
export function enabledSnapshots(snapshots: DashaEventSnapshot[], enabled: DashaSettings['dashas']): DashaEventSnapshot[] {
  return snapshots.filter(snapshot => enabled[snapshot.key as keyof DashaSettings['dashas']]);
}

/** The value of one level (MD, AD or PD) of a snapshot, or '' when there is none. */
export function levelValue(snapshot: DashaEventSnapshot | undefined, level: string): string {
  return snapshot?.levels.find(item => item.level === level)?.value ?? '';
}

export const DAY_MS = 24 * 60 * 60 * 1000;
export const YEAR_MS = 365.25 * DAY_MS;

/** The change flags of a column of snapshots: whether the MD and AD differ from the row before. */
export function periodChanges(snapshots: (DashaEventSnapshot | undefined)[]): { md: boolean; ad: boolean }[] {
  return snapshots.map((snapshot, index) => {
    if (index === 0) return { md: false, ad: false };
    const before = snapshots[index - 1];
    return {
      md: levelValue(snapshot, 'MD') !== levelValue(before, 'MD'),
      ad: levelValue(snapshot, 'AD') !== levelValue(before, 'AD'),
    };
  });
}

const pad = (value: number) => String(value).padStart(2, '0');

/** A flag when the running mahādaśā ends within a year of the date: "MD changes 03.2027". */
export function mdChangeFlag(snapshot: DashaEventSnapshot | undefined, from: Date, label: string): string | undefined {
  const end = snapshot?.mdRange?.endDate;
  if (!end) return undefined;
  const days = (end.getTime() - from.getTime()) / DAY_MS;
  return days >= 0 && days <= 365 ? `${label} ${pad(end.getMonth() + 1)}.${end.getFullYear()}` : undefined;
}
