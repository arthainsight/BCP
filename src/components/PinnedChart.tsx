'use client';

import { useEffect, useState } from 'react';
import type { ChartData, ChartDisplaySettings } from '@/types';
import { useChartDivisions } from '@/hooks/useChartDivisions';
import ChartDivisionBar from './ChartDivisionBar';
import ChartDivisionsView from './ChartDivisionsView';
import type { DashaLordMarks } from './chartLayers';
import { useT } from '@/lib/i18n';

const OPEN_KEY = 'pinnedChartOpen';

type Props = {
  chart: ChartData;
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  dashaLords?: DashaLordMarks | null;
};

/**
 * A chart that stays at the top of the screen while the daśās below are
 * scrolled, for phones where the chart and the timing are separate views. It
 * shows the same divisional charts as the main chart and can be folded away.
 */
export default function PinnedChart({ chart, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords }: Props) {
  const t = useT();
  const [divisions, setDivisions] = useChartDivisions();
  const [open, setOpen] = useState(true);
  // The app's own top bar is sticky too; the chart pins just below it.
  const [top, setTop] = useState(0);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(OPEN_KEY) === 'false') setOpen(false);
    } catch {}
  }, []);

  useEffect(() => {
    const measure = () => {
      const header = [...document.querySelectorAll('header')].find(element => element.getClientRects().length > 0);
      setTop(header ? Math.round(header.getBoundingClientRect().height) : 0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const toggle = () => {
    setOpen(value => {
      try { localStorage.setItem(OPEN_KEY, String(!value)); } catch {}
      return !value;
    });
  };

  const several = divisions.length > 1;

  return (
    <section
      aria-label={t('pinned chart')}
      style={{ top }}
      className="sticky z-30 rounded-lg border border-zinc-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <ChartDivisionBar selected={divisions} onChange={setDivisions} />
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? t('hide chart') : t('show chart')}
          className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          {open ? '▲' : '▼'}
        </button>
      </div>
      {open && (
        // One chart is kept to about a third of the screen height; several scroll inside their own box.
        <div className={`mt-2 ${several ? 'max-h-[30vh] overflow-y-auto' : 'mx-auto'}`} style={several ? undefined : { maxWidth: 'min(100%, 27vh)' }}>
          <ChartDivisionsView
            chart={chart}
            divisions={divisions}
            chartStyle={chartDisplaySettings.chartStyle ?? 'north'}
            chartDisplaySettings={chartDisplaySettings}
            karakaByPlanet={karakaByPlanet}
            nakshatraAdjust={nakshatraAdjust}
            dashaLords={dashaLords}
            onFocus={(division) => setDivisions([division])}
          />
        </div>
      )}
    </section>
  );
}
