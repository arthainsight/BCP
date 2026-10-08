'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import type { DashaSettings, PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { calculateDashaEventSnapshots } from '@/lib/dashaEvents';
import { DAY_MS, YEAR_MS, dashaSnapshotOptions, enabledSnapshots } from '@/lib/dashaView';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  targetDate?: string;
};

const SPAN_YEARS = 100;
const pad = (value: number) => String(value).padStart(2, '0');
const formatDate = (date: Date) => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

/**
 * Drag through time: a slider from birth to a hundred years on, and the
 * running daśās of every enabled system at the date it points to.
 */
export default function DashaSlider({ planets, ascendant, birthDatetime, dashaSettings, targetDate }: Props) {
  const t = useT();
  const { translate } = useGrahaNames();
  const birth = parseDateTime(birthDatetime);
  const maxDays = Math.round((SPAN_YEARS * YEAR_MS) / DAY_MS);
  const [days, setDays] = useState(() => {
    const target = (targetDate && parseTargetDateString(targetDate)) || new Date();
    return birth ? Math.min(maxDays, Math.max(0, Math.round((target.getTime() - birth.getTime()) / DAY_MS))) : 0;
  });
  // The slider follows the finger at once; the daśās catch up when they can.
  const shownDays = useDeferredValue(days);

  const date = useMemo(() => (birth ? new Date(birth.getTime() + shownDays * DAY_MS) : null), [birth, shownDays]);
  const snapshots = useMemo(() => {
    if (!birth || !date) return [];
    const { charaOptions, rasiOptions, variantChoice, enabled } = dashaSnapshotOptions(dashaSettings);
    return enabledSnapshots(calculateDashaEventSnapshots({ eventDate: date, birthDate: birth, planets, ascendant, charaOptions, rasiOptions, variantChoice }), enabled);
  }, [birth, date, dashaSettings, planets, ascendant]);

  const step = (delta: number) => setDays(current => Math.min(maxDays, Math.max(0, current + delta)));
  const button = 'min-h-9 rounded border border-zinc-300 px-2.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:text-zinc-300';

  return (
    <section aria-label={t('dasha slider')} className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
      <div>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t('Dasha slider')}</h3>
        <p className="text-[10px] text-zinc-500">{t('Drag through time: the running MD – AD – PD of every system on the date the slider points to.')}</p>
      </div>
      <div className="flex items-baseline justify-between gap-2 font-mono">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{date ? formatDate(date) : '–'}</span>
        <span className="text-[11px] text-zinc-500">{t('age')} {(days / (YEAR_MS / DAY_MS)).toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={maxDays}
        step={1}
        value={days}
        onChange={event => setDays(Number(event.target.value))}
        aria-label={t('dasha slider')}
        className="h-8 w-full accent-emerald-600"
      />
      <div className="flex flex-wrap gap-1">
        <button type="button" className={button} onClick={() => step(-365)}>−1 {t('yr')}</button>
        <button type="button" className={button} onClick={() => step(-30)}>−1 {t('mo')}</button>
        <button type="button" className={button} onClick={() => step(-1)}>−1 {t('d')}</button>
        <button type="button" className={button} onClick={() => step(1)}>+1 {t('d')}</button>
        <button type="button" className={button} onClick={() => step(30)}>+1 {t('mo')}</button>
        <button type="button" className={button} onClick={() => step(365)}>+1 {t('yr')}</button>
        <button
          type="button"
          className={`${button} border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300`}
          onClick={() => birth && setDays(Math.min(maxDays, Math.max(0, Math.round((Date.now() - birth.getTime()) / DAY_MS))))}
        >
          {t('today')}
        </button>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {snapshots.map(snapshot => (
          <li key={snapshot.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 text-[11px] font-mono">
            <span className="w-36 shrink-0 font-semibold text-zinc-700 dark:text-zinc-200">{snapshot.label}</span>
            <span className="min-w-0 break-words text-zinc-600 dark:text-zinc-300">
              {snapshot.levels.length > 0
                ? snapshot.levels.map(level => <span key={level.level} className="mr-2"><span className="text-zinc-400">{level.level}</span> <span className="font-semibold">{translate(level.value)}</span></span>)
                : <span className="italic text-zinc-400">{snapshot.note ?? t('Outside calculated cycle')}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
