'use client';

import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { targetKindOf, type Feature, type FeatureFamily, type FeatureSource } from '@/lib/research/features';
import type { WindowChoice } from '@/lib/research/eventStudy';

// What the parts of the Research view share.

/** What each family of features is called. */
export const FAMILY_LABELS: Record<FeatureFamily, string> = {
  house: 'in house',
  aspectHouse: 'aspects house',
  aspectNatal: 'aspects natal',
  exact: 'exact on natal',
  mdGraha: 'MD lord',
  mdRules: 'MD rules house',
  mdPlaced: 'MD placed in house',
  adGraha: 'AD lord',
  adRules: 'AD rules house',
  adPlaced: 'AD placed in house',
  fromMoon: 'house from the Moon',
  favourable: 'favourable from the Moon',
  bindu: 'own bindus in the sign',
  sav: 'Sarvāṣṭakavarga of the sign',
  rule: 'Saturn rules from the Moon',
};

/** What each source of features is called. */
export const SOURCE_LABELS: Record<FeatureSource, string> = {
  paraya: 'progressions',
  transit: 'transits',
  dasha: 'daśā',
  gochara: 'gochara (traditional)',
};

/** The windows around an event, in days either side (0 is the day itself), or 'auto': the one that the accuracy of each event's date gives. */
export const WINDOWS: readonly WindowChoice[] = [0, 30, 90, 180, 'auto'];

export const chip = (on: boolean) =>
  `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

export const percent = (value: number, of: number) => (of > 0 ? `${Math.round((100 * value) / of)} %` : '—');

/** A feature in words: the graha, what it does and where. */
export function FeatureLabel({ feature }: { feature: Pick<Feature, 'source' | 'family' | 'body' | 'target'> }) {
  const t = useT();
  const { code } = useGrahaNames();
  const graha = <span className="font-bold text-violet-600 dark:text-violet-400">{code(feature.body)}</span>;
  if (feature.source === 'dasha') {
    const level = feature.family.startsWith('md') ? 'MD' : 'AD';
    if (feature.family.endsWith('Graha')) return <>{`${level} ${t('lord')} `}{graha}</>;
    return <>{`${level} `}{graha}{` ${feature.family.endsWith('Rules') ? t('rules house') : t('placed in house')} `}<span className="font-bold">{feature.target}</span></>;
  }
  if (feature.source === 'gochara') {
    if (feature.family === 'fromMoon') return <>{graha}{` ${t('in house')} `}<span className="font-bold">{feature.target}</span>{` ${t('from the Moon')}`}</>;
    if (feature.family === 'favourable') return <>{graha}{` ${t(feature.target === 'favourable' ? 'in a favourable house from the Moon' : 'in an unfavourable house from the Moon')}`}</>;
    if (feature.family === 'bindu') return <>{graha}{` ${t('own bindus in its sign')} `}<span className="font-bold">{t(feature.target)}</span></>;
    if (feature.family === 'sav') return <>{graha}{` ${t('in a sign with a Sarvāṣṭakavarga')} `}<span className="font-bold">{t(feature.target)}</span></>;
    return <span className="font-bold">{t(feature.target === 'sadeSati' ? 'Sade Sati' : feature.target === 'kantaka' ? 'Saturn 4th from the Moon (kantaka)' : 'Saturn 8th from the Moon (ashtama)')}</span>;
  }
  return (
    <>
      {graha}
      {feature.source === 'transit' && <span className="text-zinc-400 dark:text-zinc-500">{` (${t('transit')})`}</span>}
      {` ${t(FAMILY_LABELS[feature.family])} `}
      <span className="font-bold">{targetKindOf(feature.family) === 'house' ? feature.target : code(feature.target)}</span>
    </>
  );
}
