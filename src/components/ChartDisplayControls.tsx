'use client';

import type { ReactNode } from 'react';
import type { ChartDisplaySettings } from '@/types';
import type { DegreePrecision } from '@/lib/formatDegree';
import { GRAHA_DASHA_SYSTEMS } from '@/lib/dashaEvents';
import { FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, clampFontScale, fontScaleLabel } from '@/lib/chartFont';
import { useT } from '@/lib/i18n';
import RangeField from './RangeField';

// The controls of the chart display that both the ··· menu of the chart and the
// Settings show. The wiring is here once; each place only chooses how big it is.

const PRECISIONS: { value: DegreePrecision; short: string; long: string }[] = [
  { value: 'off', short: 'off', long: 'Off' },
  { value: 'degree', short: 'd', long: '12°' },
  { value: 'minute', short: 'm', long: "12°34'" },
  { value: 'second', short: 's', long: "12°34'56\"" },
];

/** How exactly the degrees are written beside the grahas. `compact` is the narrow version of the chart menu. */
export function DegreePrecisionPicker({ value = 'off', onChange, compact = false }: { value?: DegreePrecision; onChange: (value: DegreePrecision) => void; compact?: boolean }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`shrink-0 font-mono text-zinc-600 dark:text-zinc-300 ${compact ? 'text-[10px]' : 'text-xs'}`}>{t('degrees')}</span>
      <div className="flex gap-0.5">
        {PRECISIONS.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-sm border font-mono transition-colors ${compact ? 'px-2 py-1.5 text-[10px] sm:px-1 sm:py-0.5 sm:text-[9px]' : 'px-1.5 py-0.5 text-[9px]'} ${
              value === option.value
                ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600 text-white'
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
            }`}
          >
            {t(compact ? option.short : option.long)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Which graha-based daśā system the ᴹ and ᴬ marks on the chart come from. */
export function DashaMarkSelect({ value = 'vimshottari', onChange, note, compact = false }: {
  value?: ChartDisplaySettings['dashaMarkSystem'];
  onChange: (value: NonNullable<ChartDisplaySettings['dashaMarkSystem']>) => void;
  /** A line under the choice: why it may not apply, or what the marks mean. */
  note?: ReactNode;
  compact?: boolean;
}) {
  const t = useT();
  return (
    <label className={`block font-mono ${compact ? 'text-[10px] text-zinc-600 dark:text-zinc-300' : 'mt-3 text-xs text-zinc-500 dark:text-zinc-400'}`}>
      {t('dasha lords from')}
      <select
        value={value}
        onChange={event => onChange(event.target.value as NonNullable<ChartDisplaySettings['dashaMarkSystem']>)}
        className={`mt-1 w-full rounded border ${compact
          ? 'border-zinc-200 bg-white px-1.5 py-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-900'
          : 'border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
      >
        {GRAHA_DASHA_SYSTEMS.map(system => <option key={system.key} value={system.key}>{system.label}</option>)}
      </select>
      {note && <span className="mt-1 block text-[9px] text-zinc-400 dark:text-zinc-600">{note}</span>}
    </label>
  );
}

/** The text size of the charts, as a slider with a reset. */
export function ChartFontScaleField({ label, value, onChange, className }: { label: string; value: number; onChange: (value: number) => void; className?: string }) {
  const t = useT();
  return (
    <RangeField
      className={className}
      label={label}
      value={value}
      min={FONT_SCALE_MIN}
      max={FONT_SCALE_MAX}
      step={FONT_SCALE_STEP}
      format={fontScaleLabel}
      onChange={next => onChange(clampFontScale(next))}
      onReset={() => onChange(1)}
      resetLabel={t('reset')}
      resetDisabled={value === 1}
    />
  );
}
