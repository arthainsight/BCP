'use client';

import { useState } from 'react';
import type { BcpResult, CalculationSettings, ChartData, ChartDisplaySettings, DashaSettings, PlanetData } from '@/types';
import DashaWorkspace from './DashaWorkspace';
import TransitHitsPanel from './TransitHitsPanel';
import TithiPravesaPanel from './TithiPravesaPanel';
import VarshaphalaPanel from './VarshaphalaPanel';
import type { AnnualPlace } from './annualShared';
import { useT } from '@/lib/i18n';

type View = 'dasha' | 'transits' | 'tithi' | 'varsha';

const VIEWS: { key: View; label: string }[] = [
  { key: 'dasha', label: 'Dasha' },
  { key: 'transits', label: 'transit.hits' },
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
              {item.key === 'dasha' ? t(item.label) : item.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'dasha' && (
        <DashaWorkspace
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

      {view === 'transits' && (
        <TransitHitsPanel
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
