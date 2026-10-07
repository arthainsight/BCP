'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GeoResult, BcpResult, ChartData, PlanetData } from '@/types';
import { calculateBcp, parseDateTime } from '@/lib/bcp';
import { getUtcOffsetHours, parseBirthDatetimeForTz } from '@/lib/timezone';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import PrimaryNav, { type Workspace } from '@/components/PrimaryNav';
import { type TabId } from '@/components/BottomNav';
import DataPanel from '@/components/DataPanel';
import SettingsPanel from '@/components/SettingsPanel';
import AnalysisPanel from '@/components/AnalysisPanel';
import TimingPanel from '@/components/TimingPanel';
import ChartSection from '@/components/ChartSection';
import PanchangPanel from '@/components/PanchangPanel';
import type { ChartSnapshot } from '@/components/FileActions';
import PublicChartsPanel from '@/components/PublicChartsPanel';
import { CalcSummaryBar, EmptyState, Panel } from '@/components/PageParts';
import AppHeader from '@/components/AppHeader';
import { getNowTimeString, getTodayString, parseTargetDateString, targetMomentToTransit, transitToTargetMoment } from '@/lib/dateInput';
import { useStoredSettings } from '@/hooks/useStoredSettings';
import { useChartDerived } from '@/hooks/useChartDerived';
import { LanguageContext, type Language } from '@/lib/i18n';


type DesktopTab = 'data' | 'grahas' | 'dasha' | 'public' | 'settings';

type CalculationOptions = {
  preserveCurrentPanel?: boolean;
};

// Maps the three primary workspaces (plus Settings) onto the existing tab
// machinery. Desktop always shows the chart on the left, so CHART targets the
// birth-data panel on the right; mobile shows a single full-screen panel.
const WORKSPACE_TO_DESKTOP: Record<Workspace, DesktopTab> = {
  chart: 'data',
  timing: 'dasha',
  analysis: 'grahas',
  settings: 'settings',
};
const WORKSPACE_TO_MOBILE: Record<Workspace, TabId> = {
  chart: 'chart',
  timing: 'dasha',
  analysis: 'grahas',
  settings: 'settings',
};
function desktopToWorkspace(tab: DesktopTab): Workspace {
  switch (tab) {
    case 'dasha': return 'timing';
    case 'grahas': return 'analysis';
    case 'settings': return 'settings';
    default: return 'chart'; // 'data' and 'public' land on CHART for now
  }
}



export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('data');
  const [desktopTab, setDesktopTab] = useState<DesktopTab>('data');

  // The primary nav drives both the mobile tab and the desktop right-column tab.
  const selectWorkspace = useCallback((ws: Workspace) => {
    setActiveTab(WORKSPACE_TO_MOBILE[ws]);
    setDesktopTab(WORKSPACE_TO_DESKTOP[ws]);
  }, []);

  // Birth data
  const [birthDatetime, setBirthDatetime] = useState('');
  const [city, setCity] = useState('');
  const [targetDate, setTargetDate] = useState(getTodayString());
  // The target moment: BCP, BNN, Paraya and the dasha lords read its date,
  // and the transits are calculated for the full date and time.
  const [targetTime, setTargetTime] = useState(getNowTimeString());
  const transitDatetime = useMemo(() => targetMomentToTransit(targetDate, targetTime), [targetDate, targetTime]);
  // "Set as transit" and the transit-hit list move the whole target moment.
  const setTargetMoment = useCallback((value: string) => {
    const moment = transitToTargetMoment(value);
    if (!moment) return;
    setTargetDate(moment.date);
    setTargetTime(moment.time);
  }, []);

  // Geo / location
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<GeoResult | null>(null);
  const [showCoords, setShowCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [ianaTimezone, setIanaTimezone] = useState('');
  const [tzOverride, setTzOverride] = useState('');

  // Results
  const [bcpResult, setBcpResult] = useState<BcpResult | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [transitPlanets, setTransitPlanets] = useState<PlanetData[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    chartDisplaySettings, calculationSettings, dashaSettings, settingsRestored,
    toggleChartDisplay, updateChartDisplay, updateCalculationSettings, updateDashaSettings,
  } = useStoredSettings();
  const previousCalculationKeyRef = useRef('');

  // Active saved chart name (null = no saved chart active)
  const [activeChartName, setActiveChartName] = useState<string | null>(null);

  // --- Derived state ---

  const autoTzOffset = useMemo<number | null>(() => {
    if (!ianaTimezone || !birthDatetime) return null;
    const date = parseBirthDatetimeForTz(birthDatetime);
    if (!date) return null;
    return getUtcOffsetHours(ianaTimezone, date);
  }, [ianaTimezone, birthDatetime]);

  const effectiveTzOffset = useMemo<number | null>(() => {
    if (tzOverride !== '') {
      const n = parseFloat(tzOverride);
      return isNaN(n) ? null : n;
    }
    return autoTzOffset;
  }, [tzOverride, autoTzOffset]);


  const canCalculate =
    !!birthDatetime && showCoords && !!manualLat && !!manualLng && effectiveTzOffset !== null;

  const { karakaByPlanet, nakshatraAdjust, effectiveBnnHouses, effectiveNadiParayaHouses, dashaLords } =
    useChartDerived(chartData, birthDatetime, targetDate, calculationSettings, chartDisplaySettings.dashaMarkSystem);


  // Recompute BCP when the target or birth date changes, but only if a chart
  // has already produced a result. The previous version had bcpResult in the
  // dependency array while also setting it to a fresh object, which looped the
  // effect until React aborted with "Maximum update depth exceeded" on every
  // calculated chart. The functional update reads the previous result without
  // depending on it.
  useEffect(() => {
    const birthDate = parseDateTime(birthDatetime);
    const target = parseTargetDateString(targetDate);
    if (!birthDate || !target) return;
    // The functional update reads the previous result without depending on it, so
    // this cannot re-trigger itself. The rule flags the shape, not the behaviour.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBcpResult((previous) => (previous ? calculateBcp(birthDate, target) : previous));
  }, [targetDate, birthDatetime]);



  // --- Handlers ---



  const handleNewChart = useCallback(() => {
    setBirthDatetime('');
    setCity('');
    setGeoResults([]);
    setSelectedGeo(null);
    setShowCoords(false);
    setManualLat('');
    setManualLng('');
    setIanaTimezone('');
    setTzOverride('');
    setBcpResult(null);
    setChartData(null);
    setTransitPlanets([]);
    setError('');
    setTargetDate(getTodayString());
    setTargetTime(getNowTimeString());
    previousCalculationKeyRef.current = '';
    setActiveTab('data');
    setDesktopTab('data');
    setActiveChartName(null);
  }, []);

  const handleGeocode = useCallback(async () => {
    if (!city.trim()) return;
    setLoading(true);
    setError('');
    setGeoResults([]);
    setSelectedGeo(null);
    try {
      const res = await fetch('/api/geocode?city=' + encodeURIComponent(city));
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      if (data.results?.length > 0) {
        setGeoResults(data.results);
        if (data.results.length === 1) {
          const geo: GeoResult = data.results[0];
          setSelectedGeo(geo);
          setManualLat(String(geo.latitude));
          setManualLng(String(geo.longitude));
          setIanaTimezone(geo.timezone ?? '');
          setTzOverride('');
          setShowCoords(true);
        }
      } else {
        setError('City not found. Please try a different name.');
      }
    } catch {
      setError('Failed to look up city. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [city]);

  const handleSelectGeo = useCallback((idx: number, results: GeoResult[]) => {
    const geo = results[idx];
    setSelectedGeo(geo);
    setManualLat(String(geo.latitude));
    setManualLng(String(geo.longitude));
    setIanaTimezone(geo.timezone ?? '');
    setTzOverride('');
    setShowCoords(true);
  }, []);

  const performCalculation = useCallback(
    async (dt: string, lat: number, lng: number, tzOffset: number, tDate: string, options?: CalculationOptions) => {
      setError('');
      const birthDate = parseDateTime(dt);
      if (!birthDate) {
        setError('Invalid birth datetime format. Use dd.mm.yyyy hh.mm.ss');
        return;
      }

      const target = parseTargetDateString(tDate);
      if (!target) { setError('Invalid target date.'); return; }

      setBcpResult(calculateBcp(birthDate, target));
      setLoading(true);

      try {
        const match = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
        if (!match) { setError('Invalid birth datetime format.'); return; }

        const [, dd, mm, yyyy, hh, min, ss] = match;
        const params = new URLSearchParams({
          year: yyyy, month: mm, day: dd, hour: hh, minute: min, second: ss,
          lat: String(lat), lng: String(lng), tz: String(tzOffset),
          ayanamsa: calculationSettings.ayanamsa,
          ayanamsaOffset: String(calculationSettings.ayanamsaOffsetDegrees ?? 0),
          nodeMode: calculationSettings.nodeMode,
        });

        const res = await fetch('/api/chart?' + params.toString());
        const data = await res.json();

        if (data.error) {
          setError('Chart calculation error: ' + data.error);
        } else {
          setChartData(data);
          setTransitPlanets([]);
          if (!options?.preserveCurrentPanel) {
            setActiveTab('chart');
            setDesktopTab('grahas');
          }
        }
      } catch (e) {
        setError('Failed to calculate chart. ' + String(e));
      } finally {
        setLoading(false);
      }
    },
    [calculationSettings.ayanamsa, calculationSettings.ayanamsaOffsetDegrees, calculationSettings.nodeMode]
  );

  const handleCalculate = useCallback(async (options?: CalculationOptions) => {
    if (!birthDatetime.trim()) { setError('Please enter birth date and time.'); return; }
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) { setError('Please enter valid latitude and longitude.'); return; }
    if (effectiveTzOffset === null) {
      setError('Timezone could not be determined. Enter a city or set a manual UTC offset.');
      return;
    }
    await performCalculation(birthDatetime, lat, lng, effectiveTzOffset, targetDate, options);
  }, [birthDatetime, manualLat, manualLng, effectiveTzOffset, targetDate, performCalculation]);

  useEffect(() => {
    if (!settingsRestored || !chartData || !canCalculate) return;

    const calculationKey = [
      birthDatetime,
      manualLat,
      manualLng,
      effectiveTzOffset,
      // The target date is left out: the natal chart does not depend on it,
      // and BCP follows it in its own effect above. Stepping the date must not
      // refetch the chart.
      calculationSettings.ayanamsa,
      calculationSettings.ayanamsaOffsetDegrees,
      calculationSettings.nodeMode,
    ].join('|');

    if (previousCalculationKeyRef.current === calculationKey) return;
    previousCalculationKeyRef.current = calculationKey;

    void handleCalculate({ preserveCurrentPanel: true });
  }, [
    settingsRestored,
    chartData,
    canCalculate,
    birthDatetime,
    manualLat,
    manualLng,
    effectiveTzOffset,
    calculationSettings.ayanamsa,
    calculationSettings.ayanamsaOffsetDegrees,
    calculationSettings.nodeMode,
    handleCalculate,
  ]);

  const handleCalculateTransit = useCallback(async () => {
    if (!transitDatetime.trim() || !chartData) return;
    const match = transitDatetime.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
    if (!match) { setError('Invalid transit datetime format. Use dd.mm.yyyy hh.mm.ss'); return; }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || effectiveTzOffset === null) {
      setError('Natal location data is required for transit calculation.');
      return;
    }

    const [, dd, mm, yyyy, hh, min, ss] = match;
    setTransitLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        year: yyyy, month: mm, day: dd, hour: hh, minute: min, second: ss,
        lat: String(lat), lng: String(lng), tz: String(effectiveTzOffset),
        ayanamsa: calculationSettings.ayanamsa,
        ayanamsaOffset: String(calculationSettings.ayanamsaOffsetDegrees ?? 0),
        nodeMode: calculationSettings.nodeMode,
      });
      const res = await fetch('/api/chart?' + params.toString());
      const data = await res.json();
      if (data.error) { setError('Transit calculation error: ' + data.error); return; }

      const natalAsc = chartData.ascendant.sign;
      setTransitPlanets(
        (data.planets as PlanetData[]).map((p) => ({
          ...p,
          house: ((p.sign - natalAsc + 12) % 12) + 1,
        }))
      );
    } catch (e) {
      setError('Failed to calculate transit. ' + String(e));
    } finally {
      setTransitLoading(false);
    }
  }, [transitDatetime, chartData, manualLat, manualLng, effectiveTzOffset, calculationSettings.ayanamsa, calculationSettings.ayanamsaOffsetDegrees, calculationSettings.nodeMode]);

  useEffect(() => {
    if (!chartData || !transitDatetime.trim()) return;
    const timer = window.setTimeout(() => { void handleCalculateTransit(); }, 350);
    return () => window.clearTimeout(timer);
  }, [chartData, transitDatetime, handleCalculateTransit]);

  const handleExportCharts = useCallback(() => {
    const raw = localStorage.getItem('bcp_saved_charts');
    const charts = raw ? JSON.parse(raw) : [];
    if (!charts.length) {
      alert('No saved charts to export.');
      return;
    }
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), charts }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bcp-charts-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportCharts = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (!Array.isArray(parsed?.charts)) {
            alert('Invalid export file: missing "charts" array.');
            return;
          }
          const raw = localStorage.getItem('bcp_saved_charts');
          const existing: { id: string }[] = raw ? JSON.parse(raw) : [];
          const existingIds = new Set(existing.map((c) => c.id));
          let imported = 0;
          for (const chart of parsed.charts) {
            if (!chart || typeof chart !== 'object') continue;
            if (existingIds.has(chart.id)) {
              chart.id =
                typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            }
            existing.push(chart);
            imported++;
          }
          localStorage.setItem('bcp_saved_charts', JSON.stringify(existing));
          alert(`Imported ${imported} chart${imported !== 1 ? 's' : ''}.`);
        } catch {
          alert('Failed to read file. Make sure it is a valid export file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleLoadChartSnapshot = useCallback(
    async (snap: ChartSnapshot) => {
      setBirthDatetime(snap.birthDatetime);
      setCity(snap.city);
      setManualLat(snap.manualLat);
      setManualLng(snap.manualLng);
      setIanaTimezone(snap.ianaTimezone);
      setTzOverride(snap.tzOverride);
      setTargetDate(snap.targetDate);
      setTargetTime(snap.targetTime ?? '12:00');
      setShowCoords(snap.showCoords);
      setGeoResults([]);
      setSelectedGeo(null);
      setBcpResult(null);
      setChartData(null);
      setTransitPlanets([]);
      setError('');
      previousCalculationKeyRef.current = '';

      const lat = parseFloat(snap.manualLat);
      const lng = parseFloat(snap.manualLng);
      if (isNaN(lat) || isNaN(lng)) return;

      let tzOffset: number | null = null;
      if (snap.tzOverride !== '') {
        const n = parseFloat(snap.tzOverride);
        if (!isNaN(n)) tzOffset = n;
      } else if (snap.ianaTimezone) {
        const d = parseBirthDatetimeForTz(snap.birthDatetime);
        if (d) tzOffset = getUtcOffsetHours(snap.ianaTimezone, d);
      }
      if (tzOffset === null) return;

      await performCalculation(snap.birthDatetime, lat, lng, tzOffset, snap.targetDate);
    },
    [performCalculation]
  );

  // "Open in chart" in the Dasha event list: read every target-date layer and
  // the transits for the event's day.
  const openDateInChart = useCallback((date: string) => {
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) return;
    setTargetDate(date);
    setTargetTime('12:00');
    setActiveTab('chart');
  }, []);

  // Snapshot of current session for FileActions persistence
  const chartSnapshot: ChartSnapshot = {
    birthDatetime,
    city: selectedGeo ? `${selectedGeo.name}, ${selectedGeo.country}` : city,
    manualLat,
    manualLng,
    ianaTimezone,
    tzOverride,
    targetDate,
    targetTime,
    showCoords,
  };

  const hasChart = !!chartData;
  const hasSnapshotData = !!birthDatetime && !!manualLat && !!manualLng;
  const displayChartName = activeChartName ?? (hasSnapshotData ? 'Untitled' : 'None');

  // Shared props objects
  const chartSectionProps = {
    bcp: bcpResult,
    chart: chartData,
    transitPlanets,
    chartDisplaySettings,
    karakaByPlanet,
    onTransitDatetimeChange: setTargetMoment,
    transitLoading,
    nakshatraAdjust,
    birthDatetime,
    targetDate,
    onTargetDateChange: setTargetDate,
    targetTime,
    onTargetTimeChange: setTargetTime,
    bnnMajorHouseFromParent: effectiveBnnHouses.major,
    bnnMinorHouseFromParent: effectiveBnnHouses.minor,
    nadiParayaHousesFromParent: effectiveNadiParayaHouses,
    dashaLordsFromParent: dashaLords,
    calculationSettings,
    ianaTimezone: ianaTimezone || undefined,
    onToggleChartDisplay: toggleChartDisplay,
    onUpdateChartDisplay: updateChartDisplay,
  };

  const dataProps = {
    birthDatetime, onBirthDatetimeChange: setBirthDatetime,
    city, onCityChange: setCity,
    geoResults, showCoords,
    manualLat, onManualLatChange: setManualLat,
    manualLng, onManualLngChange: setManualLng,
    ianaTimezone, autoTzOffset, tzOverride, onTzOverrideChange: setTzOverride,
    onGeocode: handleGeocode,
    onSelectGeo: handleSelectGeo,
    onCalculate: handleCalculate,
    loading, error, canCalculate,
  };


  const settingsProps = {
    chartDisplaySettings,
    onToggleChartDisplay: toggleChartDisplay,
    onUpdateChartDisplay: updateChartDisplay,
    calculationSettings,
    onUpdateCalculationSettings: updateCalculationSettings,
    dashaSettings,
    onUpdateDashaSettings: updateDashaSettings,
  };

  const language: Language = chartDisplaySettings.language === 'fi' ? 'fi' : 'en';

  // Keep the document language in step with the interface for screen readers.
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return (
    <LanguageContext.Provider value={language}>
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      <AppHeader
        activeChartName={activeChartName}
        displayChartName={displayChartName}
        fileActions={{
          snapshot: chartSnapshot,
          hasChart,
          onNew: handleNewChart,
          onLoad: handleLoadChartSnapshot,
          onExport: handleExportCharts,
          onImport: handleImportCharts,
          onActiveNameChange: setActiveChartName,
        }}
      />

      {/* Primary navigation: CHART / TIMING / ANALYSIS + Settings gear (desktop). */}
      <PrimaryNav active={desktopToWorkspace(desktopTab)} onChange={selectWorkspace} variant="top" />

      {/* ── DESKTOP: 2-column grid (full width for Public) ────────── */}
      <div className={`hidden lg:grid gap-4 items-start p-4 ${desktopTab === 'public' ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]'}`}>
        {/* Left: Chart + optional BCP summary + optional Panchang (hidden on Public) */}
        <div className={`space-y-3 ${desktopTab === 'public' ? 'hidden' : ''}`}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            <ChartSection {...chartSectionProps} />
            {chartData && (
              <CalcSummaryBar
                ayanamsa={calculationSettings.ayanamsa}
                ayanamsaOffsetDegrees={calculationSettings.ayanamsaOffsetDegrees ?? 0}
                nodeMode={calculationSettings.nodeMode}
                ianaTimezone={ianaTimezone || undefined}
              />
            )}
          </div>
          {chartDisplaySettings.showPanchang && chartData && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <PanchangPanel
                chart={chartData}
                birthDatetime={birthDatetime}
                utcOffsetHours={effectiveTzOffset ?? 0}
                ayanamsaName={calculationSettings.ayanamsa}
                nakshatraAdjust={nakshatraAdjust}
              />
            </div>
          )}
        </div>

        {/* Right: panel for the active workspace */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            {desktopTab === 'data' && (
              <DataPanel {...dataProps} />
            )}
            {desktopTab === 'grahas' && (
              chartData
                ? <AnalysisPanel chart={chartData} karakaByPlanet={karakaByPlanet} chartDisplaySettings={chartDisplaySettings} nakshatraAdjust={nakshatraAdjust} birthDatetime={birthDatetime} dashaLords={dashaLords} />
                : <EmptyState message="Calculate a chart to see graha positions" />
            )}
            {desktopTab === 'dasha' && (
              bcpResult && chartData
                ? <TimingPanel bcp={bcpResult} chart={chartData} birthDatetime={birthDatetime} targetDate={targetDate} dashaSettings={dashaSettings} transitPlanets={transitPlanets} transitDatetime={transitDatetime} onSetTransitDatetime={setTargetMoment} onOpenDateInChart={openDateInChart} calculationSettings={calculationSettings} chartDisplaySettings={chartDisplaySettings} nakshatraAdjust={nakshatraAdjust} ianaTimezone={ianaTimezone || undefined} />
                : <EmptyState message="Calculate a chart to see Dasha analysis" />
            )}
            {desktopTab === 'public' && <PublicChartsPanel />}
            {desktopTab === 'settings' && (
              <SettingsPanel {...settingsProps} />
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE: single panel + bottom nav ────────────────────────── */}
      <div className="lg:hidden pb-20">
        {activeTab === 'chart' && (
          <div className="space-y-3">
            <Panel>
              <DataPanel {...dataProps} />
            </Panel>
            {chartData && (
              <Panel>
                <ChartSection {...chartSectionProps} />
                <CalcSummaryBar
                  ayanamsa={calculationSettings.ayanamsa}
                  ayanamsaOffsetDegrees={calculationSettings.ayanamsaOffsetDegrees ?? 0}
                  nodeMode={calculationSettings.nodeMode}
                  ianaTimezone={ianaTimezone || undefined}
                />
              </Panel>
            )}
            {chartDisplaySettings.showPanchang && chartData && (
              <Panel>
                <PanchangPanel
                  chart={chartData}
                  birthDatetime={birthDatetime}
                  utcOffsetHours={effectiveTzOffset ?? 0}
                  ayanamsaName={calculationSettings.ayanamsa}
                  nakshatraAdjust={nakshatraAdjust}
                />
              </Panel>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <Panel>
            <DataPanel {...dataProps} />
          </Panel>
        )}

        {activeTab === 'grahas' && (
          <Panel>
            {chartData
              ? <AnalysisPanel chart={chartData} karakaByPlanet={karakaByPlanet} chartDisplaySettings={chartDisplaySettings} nakshatraAdjust={nakshatraAdjust} birthDatetime={birthDatetime} dashaLords={dashaLords} />
              : <EmptyState message="Calculate a chart in Data to see graha positions" />
            }
          </Panel>
        )}

        {activeTab === 'dasha' && (
          <Panel>
            {bcpResult && chartData
              ? <TimingPanel bcp={bcpResult} chart={chartData} birthDatetime={birthDatetime} targetDate={targetDate} dashaSettings={dashaSettings} transitPlanets={transitPlanets} transitDatetime={transitDatetime} onSetTransitDatetime={setTargetMoment} onOpenDateInChart={openDateInChart} calculationSettings={calculationSettings} chartDisplaySettings={chartDisplaySettings} nakshatraAdjust={nakshatraAdjust} ianaTimezone={ianaTimezone || undefined} />
              : <EmptyState message="Calculate a chart in Data to see Dasha analysis" />
            }
          </Panel>
        )}

        {activeTab === 'public' && (
          <Panel><PublicChartsPanel /></Panel>
        )}

        {activeTab === 'settings' && (
          <Panel>
            <SettingsPanel {...settingsProps} />
          </Panel>
        )}
      </div>

      {/* Footer (desktop only) */}
      <footer className="hidden lg:block text-center text-xs font-mono text-zinc-400 dark:text-zinc-700 py-6">
        {APP_NAME} {APP_VERSION} — selected ayanamsa · whole-sign houses · chara karakas
      </footer>
    </div>
    </LanguageContext.Provider>
  );
}
