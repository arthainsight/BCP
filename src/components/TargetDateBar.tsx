'use client';

import { getNowTimeString, getTodayString, shiftTargetDate, shiftTargetHours, type DateStep } from '@/lib/dateInput';
import { useT } from '@/lib/i18n';

type Props = {
  targetDate: string;
  onTargetDateChange: (value: string) => void;
  /** HH:MM. Without it the bar steps whole dates only. */
  targetTime?: string;
  onTargetTimeChange?: (value: string) => void;
  /** Shown while the transits for the moment are being calculated. */
  transitLoading?: boolean;
};

const DATE_STEPS: [DateStep, string][] = [['year', 'y'], ['month', 'm'], ['day', 'd']];
const BUTTON = 'min-h-8 rounded border border-zinc-200 px-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100';
const FIELD = 'min-h-8 rounded border border-zinc-300 bg-white px-1.5 text-xs font-mono text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200';

/**
 * The target moment. BCP, BNN, Paraya and the dasha lords read its date, and
 * the transits are calculated for the date and time. Step it by an hour, day,
 * month or year, type it, or jump to now.
 */
export default function TargetDateBar({ targetDate, onTargetDateChange, targetTime, onTargetTimeChange, transitLoading = false }: Props) {
  const t = useT();
  const withTime = targetTime !== undefined && onTargetTimeChange !== undefined;

  const stepDate = (step: DateStep, amount: number) => onTargetDateChange(shiftTargetDate(targetDate, step, amount));
  const stepHours = (amount: number) => {
    if (!withTime) return;
    const next = shiftTargetHours(targetDate, targetTime, amount);
    if (next.date !== targetDate) onTargetDateChange(next.date);
    onTargetTimeChange(next.time);
  };
  const goToNow = () => {
    onTargetDateChange(getTodayString());
    if (withTime) onTargetTimeChange(getNowTimeString());
  };

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('Target date')}>
      <span className="mr-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('target')}</span>
      {DATE_STEPS.map(([step, label]) => (
        <button key={`back-${step}`} type="button" className={BUTTON} aria-label={`Back one ${step}`} onClick={() => stepDate(step, -1)}>‹{label}</button>
      ))}
      {withTime && <button type="button" className={BUTTON} aria-label="Back one hour" onClick={() => stepHours(-1)}>‹h</button>}
      <input
        type="date"
        value={targetDate}
        onChange={event => { if (event.target.value) onTargetDateChange(event.target.value); }}
        aria-label={t('Target date')}
        className={FIELD}
      />
      {withTime && (
        <input
          type="time"
          value={targetTime}
          onChange={event => { if (event.target.value) onTargetTimeChange(event.target.value); }}
          aria-label={t('Target time')}
          className={FIELD}
        />
      )}
      {withTime && <button type="button" className={BUTTON} aria-label="Forward one hour" onClick={() => stepHours(1)}>h›</button>}
      {[...DATE_STEPS].reverse().map(([step, label]) => (
        <button key={`forward-${step}`} type="button" className={BUTTON} aria-label={`Forward one ${step}`} onClick={() => stepDate(step, 1)}>{label}›</button>
      ))}
      <button type="button" className={BUTTON} onClick={goToNow}>{t('now')}</button>
      {transitLoading && <span className="text-[10px] font-mono text-zinc-400" aria-live="polite">{t('transits…')}</span>}
    </div>
  );
}
