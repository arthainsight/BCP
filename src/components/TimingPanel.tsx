'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, DashaSettings, PlanetData } from '@/types';
import DashaWorkspace from './DashaWorkspace';
import TransitHitsPanel from './TransitHitsPanel';
import GrahaHitFinder from './GrahaHitFinder';
import SignChangesPanel from './SignChangesPanel';
import ParayaProgressionPanel from './ParayaProgressionPanel';
import ParayaAspectsPanel from './ParayaAspectsPanel';
import TimingSummary from './TimingSummary';
import TithiPravesaPanel from './TithiPravesaPanel';
import PraveshaPanel from './PraveshaPanel';
import YearGlancePanel from './YearGlancePanel';
import VarshaphalaPanel from './VarshaphalaPanel';
import SudarshanaPanel from './SudarshanaPanel';
import MuhurtaPanel from './MuhurtaPanel';
import DailyPanchangPanel from './DailyPanchangPanel';
import type { AnnualPlace } from './annualShared';
import FullWidthToggle from './FullWidthToggle';
import { useT } from '@/lib/i18n';
import type { TransitLocation } from '@/hooks/useEventTransits';

type View = 'daily' | 'dasha' | 'summary' | 'transits' | 'hitFinder' | 'paraya' | 'parayaAspects' | 'signs' | 'muhurta' | 'tithi' | 'nakshatra' | 'yoga' | 'varsha' | 'year' | 'sudarshana';

const VIEW_GROUPS: { label: string; views: { key: View; label: string }[] }[] = [
  { label: 'Daily reading', views: [{ key: 'daily', label: 'Daily Panchang' }] },
  { label: 'Periods & overview', views: [
    { key: 'dasha', label: 'Dasha' }, { key: 'summary', label: 'Summary' },
  ] },
  { label: 'Transits & progressions', views: [
    { key: 'transits', label: 'Transit Hits' }, { key: 'hitFinder', label: 'Graha Hit Finder' },
    { key: 'paraya', label: 'Paraya' }, { key: 'parayaAspects', label: 'Paraya aspects' }, { key: 'signs', label: 'Sign changes' },
  ] },
  { label: 'Annual & electional', views: [
    { key: 'muhurta', label: 'Muhurta' }, { key: 'tithi', label: 'Tithi Praveśa' },
    { key: 'nakshatra', label: 'Nakṣatra Praveśa' }, { key: 'yoga', label: 'Yoga Praveśa' },
    { key: 'varsha', label: 'Varṣaphala' }, { key: 'year', label: 'Year at a glance' }, { key: 'sudarshana', label: 'Sudarśana' },
  ] },
];

interface Props {
  chart: ChartData;
  birthDatetime: string;
  targetDate?: string;
  dashaSettings: DashaSettings;
  /** Saves the daśā settings: the Dasas tab chooses which systems are active. */
  onUpdateDashaSettings?: (update: Partial<DashaSettings>) => void;
  transitPlanets: PlanetData[];
  transitDatetime: string;
  onSetTransitDatetime: (value: string) => void;
  onOpenDateInChart: (date: string) => void;
  /** Shows the Matrix of the Varga view in ANALYSIS. */
  onOpenVargaMatrix?: () => void;
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
  chart,
  birthDatetime,
  targetDate,
  dashaSettings,
  onUpdateDashaSettings,
  transitPlanets,
  transitDatetime,
  onSetTransitDatetime,
  onOpenDateInChart,
  onOpenVargaMatrix,
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
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          {VIEW_GROUPS.map((group) => (
            <div key={group.label} data-tool-group={group.label} className="flex min-w-0 items-center gap-2">
              <span className="w-32 shrink-0 text-[9px] font-mono uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{t(group.label)}</span>
              <div className="min-w-0 flex-1 overflow-x-auto">
                <div className="inline-flex min-w-max gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
                  {group.views.map((item) => (
                    <button key={item.key} type="button" onClick={() => setView(item.key)} className={tabClass(item.key)}>
                      {item.key === 'dasha' || item.key === 'signs' || item.key === 'summary' || item.key === 'muhurta' || item.key === 'year' ? t(item.label) : item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        {onToggleWide && <FullWidthToggle wide={wide} onToggle={onToggleWide} />}
      </div>

      {view === 'daily' && (
        <DailyPanchangPanel
          chart={chart}
          targetDate={targetDate ?? ''}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
          nakshatraAdjust={nakshatraAdjust}
        />
      )}

      {view === 'dasha' && (
        <DashaWorkspace
          chart={chart}
          chartDisplaySettings={chartDisplaySettings}
          transitLocation={transitLocation}
          calculationSettings={calculationSettings}
          targetDate={targetDate}
          planets={chart.planets}
          ascendant={chart.ascendant}
          birthDatetime={birthDatetime}
          dashaSettings={dashaSettings}
          onUpdateDashaSettings={onUpdateDashaSettings}
          transitPlanets={transitPlanets}
          transitDatetime={transitDatetime}
          onSetTransitDatetime={onSetTransitDatetime}
          onOpenDateInChart={onOpenDateInChart}
          onOpenVargaMatrix={onOpenVargaMatrix}
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
        <TransitHitsPanel
          chart={chart}
          targetDate={targetDate ?? ''}
          calculationSettings={calculationSettings}
          onSetTransit={onSetTransitDatetime}
        />
      )}

      {view === 'hitFinder' && (
        <GrahaHitFinder
          chart={chart}
          birthDatetime={birthDatetime}
          calculationSettings={calculationSettings}
          onSetTarget={onSetTransitDatetime}
        />
      )}

      {view === 'paraya' && (
        <ParayaProgressionPanel
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate ?? ''}
          calculationSettings={calculationSettings}
          onSetTarget={onSetTransitDatetime}
        />
      )}

      {view === 'parayaAspects' && (
        <ParayaAspectsPanel
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate ?? ''}
          calculationSettings={calculationSettings}
          variantChoice={dashaSettings.variantChoice}
          onSetTarget={onSetTransitDatetime}
        />
      )}

      {view === 'signs' && (
        <SignChangesPanel
          chart={chart}
          targetDate={targetDate ?? ''}
          calculationSettings={calculationSettings}
          onSetTransit={onSetTransitDatetime}
        />
      )}

      {view === 'muhurta' && (
        <MuhurtaPanel chart={chart} targetDate={targetDate ?? ''} ianaTimezone={ianaTimezone} />
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

      {(view === 'nakshatra' || view === 'yoga') && (
        <PraveshaPanel
          kind={view}
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

      {view === 'year' && (
        <YearGlancePanel
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
          place={annualPlace}
          onPlaceChange={setAnnualPlace}
        />
      )}

      {view === 'sudarshana' && (
        <SudarshanaPanel
          chart={chart}
          birthDatetime={birthDatetime}
          targetDate={targetDate}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
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
