'use client';

import { useEffect, useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings } from '@/types';
import { useChartDivisions } from '@/hooks/useChartDivisions';
import { useEventTransits, type TransitLocation } from '@/hooks/useEventTransits';
import ChartDivisionBar from './ChartDivisionBar';
import ChartDivisionsView from './ChartDivisionsView';
import { useT } from '@/lib/i18n';

type Props = {
  /** Event date, YYYY-MM-DD. */
  date: string;
  chart?: ChartData;
  chartDisplaySettings?: ChartDisplaySettings;
  location?: TransitLocation;
  calculationSettings?: CalculationSettings;
  /** The pointer is over the event. */
  hovered: boolean;
};

const HOVER_DELAY_MS = 350;

/**
 * The transits of an event's day on the natal charts. They show while the
 * pointer rests on the event, or stay open with the Transits button, in the
 * divisional charts chosen for the main chart (D1, D9, D10 …).
 */
export default function EventTransits({ date, chart, chartDisplaySettings, location, calculationSettings, hovered }: Props) {
  const t = useT();
  const [divisions, setDivisions] = useChartDivisions();
  const [pinned, setPinned] = useState(false);
  const [rested, setRested] = useState(false);

  // A pointer sweeping across the list should not open every event it passes.
  useEffect(() => {
    if (!hovered) { queueMicrotask(() => setRested(false)); return; }
    const timer = window.setTimeout(() => setRested(true), HOVER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hovered]);

  const shown = pinned || rested;
  const { planets, loading, error } = useEventTransits(shown ? date : null, location, calculationSettings, chart?.ascendant.sign ?? 1);
  const [year, month, day] = date.split('-');

  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-pressed={pinned}
        onClick={() => setPinned(value => !value)}
        className={`min-h-9 rounded border px-2.5 py-1.5 text-[10px] font-mono ${pinned
          ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950/20 dark:text-violet-300'
          : 'border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'}`}
      >
        {t('Transits on the charts')}
      </button>
      {shown && (
        <div className="space-y-2 rounded border border-violet-200 bg-violet-50/40 p-2 dark:border-violet-900 dark:bg-violet-950/10" aria-label={t('event transits')} role="region">
          <div className="text-[10px] font-mono text-violet-700 dark:text-violet-300">
            {t('Transits on')} {day}.{month}.{year} 12:00 {t('(rose) with the natal grahas')}
          </div>
          {!location && <p className="text-[10px] font-mono text-zinc-400">{t('Calculate a chart first to see its transits.')}</p>}
          {loading && <p className="text-[10px] font-mono text-zinc-400">{t('Calculating…')}</p>}
          {error && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load transits:')} {error}</p>}
          <ChartDivisionBar selected={divisions} onChange={setDivisions} />
          {chart && chartDisplaySettings && planets && (
            <ChartDivisionsView
              chart={chart}
              divisions={divisions}
              chartStyle={chartDisplaySettings.chartStyle ?? 'north'}
              chartDisplaySettings={chartDisplaySettings}
              transitPlanets={planets}
              onFocus={(division) => setDivisions([division])}
            />
          )}
        </div>
      )}
    </div>
  );
}
