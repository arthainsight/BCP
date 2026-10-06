'use client';

import { useEffect, useRef, useState } from 'react';
import { BcpResult, CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import VargaMatrix from '@/pages/VargaMatrix';
import VargaGridPanel from './VargaGridPanel';
import DrishtiPanel from '@/components/DrishtiPanel';
import AshtakavargaPanel from '@/components/AshtakavargaPanel';
import TransitDateControls from './TransitDateControls';
import ChartExportButtons from './ChartExportButtons';
import TargetDateBar from './TargetDateBar';
import TransitHitsPanel from './TransitHitsPanel';
import { buildLayerControls, type DashaLordMarks } from './chartLayers';
import { ChartFillContext } from './chartFill';
import NadiAmsaPanel from './NadiAmsaPanel';
import TithiPravesaPanel from './TithiPravesaPanel';
import VarshaphalaPanel from './VarshaphalaPanel';
import type { AnnualPlace } from './annualShared';
import type { NadiParayaHouseActivation } from '@/lib/bnn/nadiParaya';
import { useT } from '@/lib/i18n';

export interface ChartSectionProps {
  bcp: BcpResult | null;
  chart: ChartData | null;
  transitPlanets: PlanetData[];
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet: Record<string, string>;
  transitDatetime: string;
  onTransitDatetimeChange: (v: string) => void;
  onCalculateTransit: () => void;
  transitLoading: boolean;
  nakshatraAdjust?: number;
  birthDatetime?: string;
  targetDate?: string;
  onTargetDateChange?: (value: string) => void;
  /** BNN houses from calculateBnnHouses; 0 hides the highlight. */
  bnnMajorHouseFromParent?: number;
  bnnMinorHouseFromParent?: number;
  nadiParayaHousesFromParent?: NadiParayaHouseActivation[];
  /** Vimshottari lords running at the target date. */
  dashaLordsFromParent?: DashaLordMarks | null;
  calculationSettings?: CalculationSettings;
  ianaTimezone?: string;
  onToggleChartDisplay?: (key: keyof ChartDisplaySettings) => void;
}

export default function ChartSection({
  bcp,
  chart,
  transitPlanets,
  chartDisplaySettings,
  karakaByPlanet,
  transitDatetime,
  onTransitDatetimeChange,
  onCalculateTransit,
  transitLoading = false,
  nakshatraAdjust = 0,
  birthDatetime,
  targetDate,
  onTargetDateChange,
  bnnMajorHouseFromParent = 0,
  bnnMinorHouseFromParent = 0,
  nadiParayaHousesFromParent = [],
  dashaLordsFromParent = null,
  calculationSettings,
  ianaTimezone,
  onToggleChartDisplay,
}: ChartSectionProps) {
  const t = useT();
  const [chartStyle, setChartStyle] = useState<ChartStyle>(chartDisplaySettings.chartStyle ?? 'north');
  const [view, setView] = useState<'chart' | 'varga' | 'nadi' | 'ashtakavarga' | 'drishti' | 'tithi' | 'varsha'>('chart');
  const [vargaView, setVargaView] = useState<'chart' | 'table'>('chart');
  // Residence for the annual charts, shared by Tithi Praveśa and Varṣaphala.
  const [annualPlace, setAnnualPlace] = useState<AnnualPlace>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Full screen is an overlay over the whole app, plus the browser's own full
  // screen where it is available (not on iPhone). Esc, the close button or
  // leaving browser full screen all close it.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setFullscreen(false); };
    const onFullscreenChange = () => { if (!document.fullscreenElement) setFullscreen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.body.style.overflow = previousOverflow;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [fullscreen]);

  const enterFullscreen = () => {
    setFullscreen(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const bnnHouses = { major: bnnMajorHouseFromParent, minor: bnnMinorHouseFromParent };

  // Follow the setting when it changes, while still allowing the local toggle
  // and the bcp:set-chart-style event to override it in between. Adjusting
  // state during render is React's documented alternative to mirroring a prop
  // into state from an effect, and it avoids the extra render pass.
  const [lastStyleSetting, setLastStyleSetting] = useState(chartDisplaySettings.chartStyle);
  if (chartDisplaySettings.chartStyle !== lastStyleSetting) {
    setLastStyleSetting(chartDisplaySettings.chartStyle);
    setChartStyle(chartDisplaySettings.chartStyle ?? 'north');
  }

  useEffect(() => {
    const handleChartStyleChange = (event: Event) => {
      const customEvent = event as CustomEvent<ChartStyle>;
      if (customEvent.detail === 'north' || customEvent.detail === 'south') {
        setChartStyle(customEvent.detail);
        setView('chart');
      }
    };

    // "Open Varga Matrix" in the Dasha event list.
    const handleShowVargaMatrix = () => {
      setView('varga');
      setVargaView('table');
    };

    window.addEventListener('bcp:chart-style-change', handleChartStyleChange);
    window.addEventListener('bcp:show-varga-matrix', handleShowVargaMatrix);

    return () => {
      window.removeEventListener('bcp:chart-style-change', handleChartStyleChange);
      window.removeEventListener('bcp:show-varga-matrix', handleShowVargaMatrix);
    };
  }, []);

  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs text-center px-4">
        {t('Enter birth data in the Data tab, then click Calculate to see the chart.')}
      </div>
    );
  }

  const showBcp = chartDisplaySettings.showBcpHighlight === true;
  const dashaLords = chartDisplaySettings.showDashaLords !== false ? dashaLordsFromParent : null;
  const yearHouse = showBcp ? bcp.activeYearHouse : 0;
  const monthHouse = showBcp ? bcp.activeMonthHouse : 0;
  const bnnMajorHouse = chartDisplaySettings.showBnnMajorHighlight ? bnnHouses.major : 0;
  const bnnMinorHouse = chartDisplaySettings.showBnnMinorHighlight ? bnnHouses.minor : 0;
  const showTransit = chartDisplaySettings.showTransitOverlay !== false && transitPlanets.length > 0;
  const parayaHouses = chartDisplaySettings.showNadiParaya !== false ? nadiParayaHousesFromParent : [];
  const layerControls = buildLayerControls(chartDisplaySettings, {
    bcp: true,
    dasha: dashaLordsFromParent !== null,
    transit: transitPlanets.length > 0,
    bnnMajor: bnnHouses.major > 0,
    bnnMinor: bnnHouses.minor > 0,
    paraya: nadiParayaHousesFromParent.length > 0,
  }, onToggleChartDisplay);

  const tabClass = (id: 'chart' | 'varga' | 'nadi' | 'ashtakavarga' | 'drishti' | 'tithi' | 'varsha') =>
    `shrink-0 px-2.5 py-1.5 text-[10px] font-mono rounded-md ${view === id ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`;

  return (
    <ChartFillContext.Provider value={fullscreen}>
    <div
      className={fullscreen
        ? 'fixed inset-0 z-[60] space-y-3 overflow-y-auto overflow-x-hidden bg-white p-3 sm:p-6 dark:bg-zinc-950'
        : 'space-y-3 min-w-0 overflow-x-hidden'}
      role={fullscreen ? 'dialog' : undefined}
      aria-modal={fullscreen || undefined}
      aria-label={fullscreen ? 'Charts in full screen' : undefined}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="inline-flex min-w-max gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
            <button type="button" onClick={() => setView('chart')} className={tabClass('chart')}>{t('Chart')}</button>
            <button type="button" onClick={() => setView('varga')} className={tabClass('varga')}>Varga</button>
            <button type="button" onClick={() => setView('nadi')} className={tabClass('nadi')}>Nāḍī</button>
            <button type="button" onClick={() => setView('ashtakavarga')} className={tabClass('ashtakavarga')}>Aṣṭakavarga</button>
            <button type="button" onClick={() => setView('drishti')} className={tabClass('drishti')}>Dṛṣṭi</button>
            <button type="button" onClick={() => setView('tithi')} className={tabClass('tithi')}>Tithi Praveśa</button>
            <button type="button" onClick={() => setView('varsha')} className={tabClass('varsha')}>Varṣaphala</button>
          </div>
        </div>
        <button
          type="button"
          onClick={fullscreen ? () => setFullscreen(false) : enterFullscreen}
          title={fullscreen ? t('Close full screen (Esc)') : t('Full screen')}
          aria-label={fullscreen ? t('Close full screen') : t('Full screen')}
          className="shrink-0 rounded-md border border-zinc-200 px-2 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {fullscreen ? t('✕ close') : t('⤢ full')}
        </button>
      </div>

      {targetDate && onTargetDateChange && (
        <TargetDateBar targetDate={targetDate} onTargetDateChange={onTargetDateChange} />
      )}

      {view === 'varga' ? (
        <div className="min-w-0 space-y-4">
          <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
            <button
              type="button"
              onClick={() => setVargaView('chart')}
              className={`rounded-md px-2.5 py-1 text-[10px] font-mono ${vargaView === 'chart' ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              {t('Charts')}
            </button>
            <button
              type="button"
              onClick={() => setVargaView('table')}
              className={`rounded-md px-2.5 py-1 text-[10px] font-mono ${vargaView === 'table' ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              {t('Matrix & Bala')}
            </button>
          </div>
          {vargaView === 'chart' ? (
            <VargaGridPanel
              chart={chart}
              dashaLords={dashaLords}
              chartStyle={chartStyle}
              chartDisplaySettings={chartDisplaySettings}
              karakaByPlanet={karakaByPlanet}
              nakshatraAdjust={nakshatraAdjust}
            />
          ) : (
            <div className="overflow-x-auto"><VargaMatrix chart={chart} /></div>
          )}
        </div>
      ) : view === 'nadi' ? (
        <div className="min-w-0 overflow-x-auto"><NadiAmsaPanel chart={chart} /></div>
      ) : view === 'ashtakavarga' ? (
        <div className="min-w-0 overflow-x-auto"><AshtakavargaPanel chart={chart} /></div>
      ) : view === 'drishti' ? (
        <div className="min-w-0 overflow-x-auto"><DrishtiPanel chart={chart} showGrahaDrishti={chartDisplaySettings.showGrahaDrishti ?? true} showRashiDrishti={chartDisplaySettings.showRashiDrishti ?? true} /></div>
      ) : view === 'tithi' ? (
        <TithiPravesaPanel
          chart={chart}
          birthDatetime={birthDatetime ?? ''}
          targetDate={targetDate}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
          chartStyle={chartStyle}
          chartDisplaySettings={chartDisplaySettings}
          nakshatraAdjust={nakshatraAdjust}
          place={annualPlace}
          onPlaceChange={setAnnualPlace}
        />
      ) : view === 'varsha' ? (
        <VarshaphalaPanel
          chart={chart}
          birthDatetime={birthDatetime ?? ''}
          targetDate={targetDate}
          ianaTimezone={ianaTimezone}
          calculationSettings={calculationSettings}
          chartStyle={chartStyle}
          chartDisplaySettings={chartDisplaySettings}
          nakshatraAdjust={nakshatraAdjust}
          place={annualPlace}
          onPlaceChange={setAnnualPlace}
        />
      ) : (
        <div ref={chartRef} className="space-y-2">
        <ChartExportButtons targetRef={chartRef} fileName="chart-d1" />
        {chartStyle === 'south' ? (
        <SouthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          ascendantDegree={chart.ascendant.degree}
          planets={chart.planets}
          specialLagnas={chart.specialLagnas ?? []}
          transitPlanets={transitPlanets}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={showTransit}
          degreePrecision={chartDisplaySettings.degreePrecision ?? 'off'}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
          karakaByPlanet={karakaByPlanet}
          nakshatraAdjust={nakshatraAdjust}
          bnnMajorHouse={bnnMajorHouse}
          bnnMinorHouse={bnnMinorHouse}
          nadiParayaHouses={parayaHouses}
          layerControls={layerControls}
          dashaLords={dashaLords}
        />
        ) : (
        <NorthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          ascendantDegree={chart.ascendant.degree}
          planets={chart.planets}
          specialLagnas={chart.specialLagnas ?? []}
          transitPlanets={transitPlanets}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={showTransit}
          degreePrecision={chartDisplaySettings.degreePrecision ?? 'off'}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
          showBcpHighlights={showBcp}
          karakaByPlanet={karakaByPlanet}
          nakshatraAdjust={nakshatraAdjust}
          bnnMajorHouse={bnnMajorHouse}
          bnnMinorHouse={bnnMinorHouse}
          nadiParayaHouses={parayaHouses}
          layerControls={layerControls}
          dashaLords={dashaLords}
        />
        )}
        </div>
      )}

      {view === 'chart' && transitDatetime !== undefined && onTransitDatetimeChange && onCalculateTransit && (
        <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <TransitDateControls
            transitDatetime={transitDatetime}
            onTransitDatetimeChange={onTransitDatetimeChange}
            onCalculateTransit={onCalculateTransit}
            transitLoading={transitLoading}
          />
          {targetDate && (
            <TransitHitsPanel
              chart={chart}
              targetDate={targetDate}
              calculationSettings={calculationSettings}
              onSetTransit={onTransitDatetimeChange}
            />
          )}
        </div>
      )}
    </div>
    </ChartFillContext.Provider>
  );
}
