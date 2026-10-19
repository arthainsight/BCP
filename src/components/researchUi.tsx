'use client';

import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import type { Feature, FeatureFamily } from '@/lib/research/progressionFeatures';

// What the parts of the Research view share.

/** What each kind of feature is called in a row: "Sa" + "in house" + "4". */
export const FAMILY_LABELS: Record<FeatureFamily, string> = {
  house: 'in house',
  aspectHouse: 'aspects house',
  aspectNatal: 'aspects natal',
  exact: 'exact on natal',
};

/** The windows around an event, in days either side; 0 is the day itself. */
export const WINDOWS = [0, 30, 90, 180] as const;

export const chip = (on: boolean) =>
  `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

export const percent = (value: number, of: number) => (of > 0 ? `${Math.round((100 * value) / of)} %` : '—');

/** A feature in words: the graha, what it does and where. */
export function FeatureLabel({ feature }: { feature: Pick<Feature, 'family' | 'body' | 'target'> }) {
  const t = useT();
  const { code } = useGrahaNames();
  return (
    <>
      <span className="font-bold text-violet-600 dark:text-violet-400">{code(feature.body)}</span>
      {` ${t(FAMILY_LABELS[feature.family])} `}
      <span className="font-bold">{feature.family === 'house' || feature.family === 'aspectHouse' ? feature.target : code(feature.target)}</span>
    </>
  );
}
