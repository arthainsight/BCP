'use client';

import { useEffect, useMemo, useState } from 'react';
import { BcpResult, ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import VargaMatrix from '@/pages/VargaMatrix';
import DrishtiPanel from '@/components/DrishtiPanel';
import { getAshtakavargaOverlay } from '@/lib/ashtakavarga';
import type { AvMode } from '@/lib/ashtakavarga';
import { calculateJupiterianRounds } from '@/lib/bnn/jupiterianRounds';
import { calculateMinorProgression } from '@/lib/bnn/jupiterMinorProgression';
import TransitDateControls from './TransitDateControls';
import BCPAgeControls from './BCPAgeControls';
import NadiAmsaPanel from './NadiAmsaPanel';

function parseBirthDt(dt: string): Date | null {
  const m = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6]));
}

function parseTargetDt(td: string): Date | null {
  const p = td.split('-');
  if (p.length !== 3) return null;
  const [y, mo, d] = p.map(Number);
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
  return new Date(y, mo - 1, d, 12, 0, 0);
}

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
  bnnMajorHouseFromParent?: number;
  bnnMinorHouseFromParent?: number;
  bcpEnabled?: boolean;
  useManualBcpMode?: boolean;
  onUseManualBcpModeChange?: (v: boolean) => void;
  manualBcpAge?: string;
  onManualBcpAgeChange?: (v: string) => void;
  manualBcpMonth?: string;
  onManualBcpMonthChange?: (v: string) => void;
}

function isBcpEnabled(): boolean {
  try {
    const raw = localStorage.getItem('dashaSettings');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.dashas?.bcp !== false;
  } catch {
    return true;
  }
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
  bnnMajorHouseFromParent,
  bnnMinorHouseFromParent,
  bcpEnabled,
  useManualBcpMode,
  onUseManualBcpModeChange,
  manualBcpAge,
  onManualBcpAgeChange,
  manualBcpMonth,
  onManualBcpMonthChange,
}: ChartSectionProps) {
  const [chartStyle, setChartStyle] = useState<ChartStyle>(chartDisplaySettings.chartStyle ?? 'north');
  const [showBcpHighlights, setShowBcpHighlights] = useState<boolean>(isBcpEnabled());
  const [view, setView] = useState<'chart' | 'varga' | 'nadi' | 'drishti'>('chart');

  const bnnHouses = useMemo(() => {
    // Use parent-provided houses when available (keeps age override in sync with chart highlights)
    if (bnnMajorHouseFromParent !== undefined || bnnMinorHouseFromParent !== undefined) {
      return { major: bnnMajorHouseFromParent ?? 0, minor: bnnMinorHouseFromParent ?? 0 };
    }
    if (!chart || !birthDatetime || !targetDate) return { major: 0, minor: 0 };
    const birth = parseBirthDt(birthDatetime);
    const target = parseTargetDt(targetDate);
    if (!birth || !target) return { major: 0, minor: 0 };
    const ageYears = Math.max(0, (target.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const natalJupiter = chart.planets.find(p => p.name === 'Jupiter');
    if (!natalJupiter) return { major: 0, minor: 0 };
    const natalJupiterSignIndex = natalJupiter.sign - 1;
    const natalJupiterDegree = natalJupiter.degree;
    const planets = chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 }));
    const roundsResult = calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree, ageYears });
    const minorResult = calculateMinorProgression({ natalJupiterSignIndex, ageYears, planets });
    const asc = chart.ascendant.sign;
    return {
      major: roundsResult.currentRound ? ((roundsResult.currentRound.activeSignIndex + 1 - asc + 12) % 12) + 1 : 0,
      minor: ((minorResult.minorSignIndex + 1 - asc + 12) % 12) + 1,
    };
  }, [chart, birthDatetime, targetDate, bnnMajorHouseFromParent, bnnMinorHouseFromParent]);

  useEffect(() => {
    setChartStyle(chartDisplaySettings.chartStyle ?? 'north');
  }, [chartDisplaySettings.chartStyle]);

  useEffect(() => {
    const handleChartStyleChange = (event: Event) => {
      const customEvent = event as CustomEvent<ChartStyle>;
      if (customEvent.detail === 'north' || customEvent.detail === 'south') {
        setChartStyle(customEvent.detail);
        setView('chart');
      }
    };

    const handleBcpToggle = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setShowBcpHighlights(customEvent.detail);
        return;
      }
      setShowBcpHighlights(isBcpEnabled());
    };

    const handleShowVarga = () => setView('varga');

    window.addEventListener('bcp:chart-style-change', handleChartStyleChange);
    window.addEventListener('bcp:dasha-bcp-toggle', handleBcpToggle);
    window.addEventListener('bcp:show-varga-matrix', handleShowVarga);

    return () => {
      window.removeEventListener('bcp:chart-style-change', handleChartStyleChange);
      window.removeEventListener('bcp:dasha-bcp-toggle', handleBcpToggle);
      window.removeEventListener('bcp:show-varga-matrix', handleShowVarga);
    };
  }, []);

  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs text-center px-4">
        Enter birth data in the Data tab, then click Calculate to see the chart.
      </div>
    );
  }

  const yearHouse = showBcpHighlights ? bcp.activeYearHouse : 0;
  const monthHouse = showBcpHighlights ? bcp.activeMonthHouse : 0;
  const avMode: AvMode = chartDisplaySettings.avMode ?? 'off';
  const ashtakavargaOverlay = avMode !== 'off' ? getAshtakavargaOverlay(chart, avMode) : [];
  const avOverlayLabel = avMode === 'sav' ? 'SAV' : avMode !== 'off' ? `${avMode} BAV` : undefined;
  const bnnMajorHouse = chartDisplaySettings.showBnnMajorHighlight ? bnnHouses.major : 0;
  const bnnMinorHouse = chartDisplaySettings.showBnnMinorHighlight ? bnnHouses.minor : 0;

  const tabClass = (id: 'chart' | 'varga' | 'nadi' | 'drishti') =>
    `shrink-0 px-2.5 py-1.5 text-[10px] font-mono rounded-md ${view === id ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`;

  return (
    <div className="space-y-3 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
        {showBcpHighlights && view === 'chart' ? (
          <div className="flex gap-3 text-[11px] sm:text-xs font-mono px-1 min-w-0 whitespace-nowrap overflow-x-auto">
            <span className="text-cyan-600 dark:text-cyan-400">Y: H{bcp.activeYearHouse}</span>
            <span className="text-emerald-700 dark:text-green-400">M: H{bcp.activeMonthHouse}</span>
          </div>
        ) : <div />}

        <div className="w-full sm:w-auto overflow-x-auto">
          <div className="inline-flex min-w-max gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
            <button type="button" onClick={() => setView('chart')} className={tabClass('chart')}>Chart</button>
            <button type="button" onClick={() => setView('varga')} className={tabClass('varga')}>Varga</button>
            <button type="button" onClick={() => setView('nadi')} className={tabClass('nadi')}>Nāḍī</button>
            <button type="button" onClick={() => setView('drishti')} className={tabClass('drishti')}>Dṛṣṭi</button>
          </div>
        </div>
      </div>

      {view === 'varga' ? (
        <div className="min-w-0 overflow-x-auto"><VargaMatrix chart={chart} /></div>
      ) : view === 'nadi' ? (
        <div className="min-w-0 overflow-x-auto"><NadiAmsaPanel chart={chart} /></div>
      ) : view === 'drishti' ? (
        <div className="min-w-0 overflow-x-auto"><DrishtiPanel chart={chart} showGrahaDrishti={chartDisplaySettings.showGrahaDrishti ?? true} showRashiDrishti={chartDisplaySettings.showRashiDrishti ?? true} /></div>
      ) : chartStyle === 'south' ? (
        <SouthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          planets={chart.planets}
          specialLagnas={chart.specialLagnas ?? []}
          transitPlanets={transitPlanets}
          ashtakavargaOverlay={ashtakavargaOverlay}
          avOverlayLabel={avOverlayLabel}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={chartDisplaySettings.showTransitPlanets}
          degreePrecision={chartDisplaySettings.degreePrecision ?? 'off'}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
          karakaByPlanet={karakaByPlanet}
          nakshatraAdjust={nakshatraAdjust}
          bnnMajorHouse={bnnMajorHouse}
          bnnMinorHouse={bnnMinorHouse}
        />
      ) : (
        <NorthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          planets={chart.planets}
          specialLagnas={chart.specialLagnas ?? []}
          transitPlanets={transitPlanets}
          ashtakavargaOverlay={ashtakavargaOverlay}
          avOverlayLabel={avOverlayLabel}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={chartDisplaySettings.showTransitPlanets}
          degreePrecision={chartDisplaySettings.degreePrecision ?? 'off'}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
          showBcpHighlights={showBcpHighlights}
          karakaByPlanet={karakaByPlanet}
          nakshatraAdjust={nakshatraAdjust}
          bnnMajorHouse={bnnMajorHouse}
          bnnMinorHouse={bnnMinorHouse}
        />
      )}

      {view === 'chart' && transitDatetime !== undefined && onTransitDatetimeChange && onCalculateTransit && (
        <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <TransitDateControls
            transitDatetime={transitDatetime}
            onTransitDatetimeChange={onTransitDatetimeChange}
            onCalculateTransit={onCalculateTransit}
            transitLoading={transitLoading}
          />
          {bcpEnabled && manualBcpAge !== undefined && onManualBcpAgeChange && manualBcpMonth !== undefined && onManualBcpMonthChange && (
            <BCPAgeControls
              useManualBcpMode={useManualBcpMode ?? false}
              onUseManualBcpModeChange={onUseManualBcpModeChange ?? (() => {})}
              manualBcpAge={manualBcpAge}
              onManualBcpAgeChange={onManualBcpAgeChange}
              manualBcpMonth={manualBcpMonth}
              onManualBcpMonthChange={onManualBcpMonthChange}
              activeYearHouse={bcp?.activeYearHouse}
              activeMonthHouse={bcp?.activeMonthHouse}
            />
          )}
        </div>
      )}
    </div>
  );
}
