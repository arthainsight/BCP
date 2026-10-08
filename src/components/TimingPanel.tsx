'use client';

import { useState } from 'react';
import type { BcpResult, CalculationSettings, ChartData, ChartDisplaySettings, DashaSettings, PlanetData } from '@/types';
import DashaWorkspace from './DashaWorkspace';
import TransitHitsPanel from './TransitHitsPanel';
import SignChangesPanel from './SignChangesPanel';
import ParayaHitsPanel from './ParayaHitsPanel';
import TimingSummary from './TimingSummary';
import TithiPravesaPanel from './TithiPravesaPanel';
import VarshaphalaPanel from './VarshaphalaPanel';
import type { AnnualPlace } from './annualShared';
import { useT } from '@/lib/i18n';
import type { TransitLocation } from '@/hooks/useEventTransits';

type View = 'dasha' | 'summary' | 'transits' | 'signs' | 'tithi' | 'varsha';

const VIEWS: { key: View; label: string }[] = [
  { key: 'dasha', label: 'Dasha' },
  { key: 'summary', label: 'Summary' },
  { key: 'transits', label: 'Transit Hits' },
  { key: 'signs', label: 'Sign changes' },
  { key: 'tithi', label: 'Tithi Praveśa' },
  { key: 'varsha', label: 'Varṣaphala' },
];

interface Props {
  bcp: BcpResult;
  chart: ChartData;
  birthDatetime: string;
  targetDate?: string;
  dashaSettings: DashaSettings;
  transitPlanets: PlanetData[];
  transitDatetime: string;
  onSetTransitDatetime: (value: string) => void;
  onOpenDateInChart: (date: string) => void;
  calculationSettings?: CalculationSettings;
  chartDisplaySettings: ChartDisplaySettings;
  nakshatraAdjust?: number;
  ianaTimezone?: string;
  /** Natal place and time zone, for the transits of an event's day. */
  transitLocation?: TransitLocation;
  /** The timing panel takes the whole width of a wide screen, with the chart hidden. */
  wide?: boolean;
  onToggleWide?: () => void;
}

/**
 * The TIMING workspace: everything about when things happen. All dasha systems
 * (DashaWorkspace), transit hits, and the annual charts (Tithi Praveśa and
 * Varṣaphala).
 */
export default function TimingPanel({
  bcp,
  chart,
  birthDatetime,
  targetDate,
  dashaSettings,
  transitPlanets,
  transitDatetime,
  onSetTransitDatetime,
  onOpenDateInChart,
  calculationSettings,
  chartDisplaySettings,
  nakshatraAdjust = 0,
  ianaTimezone,
  transitLocation,
  wide = false,
  onToggleWide,
}: Props) {
  const t = useT();
  const chartStyle = chartDisplaySettings.chartStyle ?? 'north';
  const [view, setView] = useState<View>('dasha');
  const [annualPlace, setAnnualPlace] = useState<AnnualPlace>(null);

  const tabClass = (id: View) =>
    `shrink-0 px-2.5 py-1.5 text-[10px] font-mono rounded-md ${view === id ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center gap-1 min-w-0 overflow-x-auto">
        <div className="inline-flex min-w-max gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
          {VIEWS.map((item) => (
            <button key={item.key} type="button" onClick={() => setView(item.key)} className={tabClass(item.key)}>
              {item.key === 'dasha' || item.key === 'signs' || item.key === 'summary' ? t(item.label) : item.label}
            </button>
          ))}
        </div>
        {onToggleWide && (
          <button
            type="button"
            onClick={onToggleWide}
            aria-pressed={wide}
            title={t('Use the whole width, hiding the chart')}
            className="ml-auto hidden shrink-0 rounded-md border border-zinc-200 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 lg:inline-flex dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {wide ? t('⤡ narrow') : t('⤢ wide')}
          </button>
        )}
      </div>

      {view === 'dasha' && (
        <DashaWorkspace
          chart={chart}
          chartDisplaySettings={chartDisplaySettings}
          transitLocation={transitLocation}
          calculationSettings={calculationSettings}
          targetDate={targetDate}
          bcp={bcp}
          planets={chart.planets}
          ascendant={chart.ascendant}
          birthDatetime={birthDatetime}
          dashaSettings={dashaSettings}
          transitPlanets={transitPlanets}
          transitDatetime={transitDatetime}
          onSetTransitDatetime={onSetTransitDatetime}
          onOpenDateInChart={onOpenDateInChart}
        />
      )}

      {view === 'summary' && (
        <TimingSummary
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate ?? ''}
          dashaSettings={dashaSettings}
          calculationSettings={calculationSettings}
        />
      )}

      {view === 'transits' && (
        <div className="space-y-5">
          <TransitHitsPanel
            chart={chart}
            targetDate={targetDate ?? ''}
            calculationSettings={calculationSettings}
            onSetTransit={onSetTransitDatetime}
          />
          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <ParayaHitsPanel
              chart={chart}
              birthDatetime={birthDatetime}
              targetDate={targetDate ?? ''}
              calculationSettings={calculationSettings}
              onSetTarget={onSetTransitDatetime}
            />
          </div>
        </div>
      )}

      {view === 'signs' && (
        <SignChangesPanel
          chart={chart}
          targetDate={targetDate ?? ''}
          calculationSettings={calculationSettings}
          onSetTransit={onSetTransitDatetime}
        />
      )}

      {view === 'tithi' && (
        <TithiPravesaPanel
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
          chartStyle={chartStyle}
          chartDisplaySettings={chartDisplaySettings}
          nakshatraAdjust={nakshatraAdjust}
          place={annualPlace}
          onPlaceChange={setAnnualPlace}
        />
      )}

      {view === 'varsha' && (
        <VarshaphalaPanel
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
          chartStyle={chartStyle}
          chartDisplaySettings={chartDisplaySettings}
          nakshatraAdjust={nakshatraAdjust}
          place={annualPlace}
          onPlaceChange={setAnnualPlace}
        />
      )}
    </div>
  );
}
