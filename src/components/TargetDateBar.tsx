'use client';

import { getTodayString, shiftTargetDate, type DateStep } from '@/lib/dateInput';
import { useT } from '@/lib/i18n';

type Props = {
  targetDate: string;
  onTargetDateChange: (value: string) => void;
};

const STEPS: [DateStep, string][] = [['year', 'y'], ['month', 'm'], ['day', 'd']];
const BUTTON = 'min-h-8 rounded border border-zinc-200 px-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100';

/**
 * The target date that BCP, BNN, Paraya, the dasha lords and the annual charts
 * are read for. Step it by a day, month or year, type a date, or go back to today.
 */
export default function TargetDateBar({ targetDate, onTargetDateChange }: Props) {
  const t = useT();
  const today = getTodayString();
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('Target date')}>
      <span className="mr-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('target')}</span>
      {STEPS.map(([step, label]) => (
        <button key={`back-${step}`} type="button" className={BUTTON} aria-label={`Back one ${step}`} onClick={() => onTargetDateChange(shiftTargetDate(targetDate, step, -1))}>
          ‹{label}
        </button>
      ))}
      <input
        type="date"
        value={targetDate}
        onChange={event => { if (event.target.value) onTargetDateChange(event.target.value); }}
        aria-label={t('Target date')}
        className="min-h-8 rounded border border-zinc-300 bg-white px-1.5 text-xs font-mono text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
      />
      {[...STEPS].reverse().map(([step, label]) => (
        <button key={`forward-${step}`} type="button" className={BUTTON} aria-label={`Forward one ${step}`} onClick={() => onTargetDateChange(shiftTargetDate(targetDate, step, 1))}>
          {label}›
        </button>
      ))}
      <button type="button" className={`${BUTTON} ${targetDate === today ? 'opacity-40' : ''}`} disabled={targetDate === today} onClick={() => onTargetDateChange(today)}>
        {t('today')}
      </button>
    </div>
  );
}
