'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GeoResult, BcpResult, ChartData, PlanetData, ChartDisplaySettings, CalculationSettings, DashaSettings, DEFAULT_CHART_DISPLAY, DEFAULT_CALCULATION_SETTINGS, DEFAULT_DASHA_SETTINGS } from '@/types';
import { calculateBcp, parseDateTime } from '@/lib/bcp';
import { calculateCharaKarakas, CharaKaraka } from '@/lib/karakas';
import { getUtcOffsetHours, parseBirthDatetimeForTz } from '@/lib/timezone';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import BottomNav, { TabId } from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';
import DataPanel from '@/components/DataPanel';
import SettingsPanel from '@/components/SettingsPanel';
import GrahasPanel from '@/components/GrahasPanel';
import DashaPanel from '@/components/DashaPanel';
import ChartSection from '@/components/ChartSection';
import { buildReportMarkdown } from '@/lib/exportReport';
import FileActions, { ChartSnapshot } from '@/components/FileActions';

function getTodayString(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function computeManualBcp(completedAge: number, month: number): BcpResult {
  const runningYear = completedAge + 1;
  const activeYearHouse = ((runningYear - 1) % 12) + 1;
  const activeMonthHouse = ((activeYearHouse + month - 2) % 12) + 1;
  return {
    completedAge,
    runningYear,
    activeYearHouse,
    bcpCycle: Math.floor((runningYear - 1) / 12) + 1,
    monthInRunningYear: month,
    activeMonthHouse,
  };
}

const DESKTOP_TABS = ['data', 'grahas', 'dasha', 'settings'] as const;
type DesktopTab = (typeof DESKTOP_TABS)[number];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
      {message}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
      {children}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('data');
  const [desktopTab, setDesktopTab] = useState<DesktopTab>('data');

  // Birth data
  const [birthDatetime, setBirthDatetime] = useState('');
  const [city, setCity] = useState('');
  const [targetDate, setTargetDate] = useState(getTodayString());

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
  const [transitDatetime, setTransitDatetime] = useState('');
  const [transitPlanets, setTransitPlanets] = useState<PlanetData[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [transitLoading, setTransitLoading] = useState(false);
  const [error, setError] = useState('');

  // Chart display settings
  const [chartDisplaySettings, setChartDisplaySettings] = useState<ChartDisplaySettings>(DEFAULT_CHART_DISPLAY);
  const [calculationSettings, setCalculationSettings] = useState<CalculationSettings>(DEFAULT_CALCULATION_SETTINGS);
  const [dashaSettings, setDashaSettings] = useState<DashaSettings>(DEFAULT_DASHA_SETTINGS);

  // Manual BCP
  const [useManualBcpMode, setUseManualBcpMode] = useState(false);
  const [manualBcpAge, setManualBcpAge] = useState('');
  const [manualBcpMonth, setManualBcpMonth] = useState('');

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

  const manualBcpAgeNum = parseInt(manualBcpAge);
  const manualBcpMonthNum = parseInt(manualBcpMonth);
  const manualBcpResult: BcpResult | null =
    useManualBcpMode &&
    !isNaN(manualBcpAgeNum) && manualBcpAgeNum >= 0 &&
    !isNaN(manualBcpMonthNum) && manualBcpMonthNum >= 1 && manualBcpMonthNum <= 12
      ? computeManualBcp(manualBcpAgeNum, manualBcpMonthNum)
      : null;

  const effectiveBcpResult = useManualBcpMode ? manualBcpResult : bcpResult;

  const canCalculate =
    !!birthDatetime && showCoords && !!manualLat && !!manualLng && effectiveTzOffset !== null;

  const charaKarakas: CharaKaraka[] = useMemo(
    () => (chartData ? calculateCharaKarakas(chartData.planets) : []),
    [chartData]
  );

  const karakaByPlanet = useMemo(() => {
    const map: Record<string, string> = {};
    charaKarakas.forEach((k) => { map[k.planet] = k.karaka; });
    return map;
  }, [charaKarakas]);

  // Restore persisted display/calculation/dasha settings on mount
  useEffect(() => {
    try {
      const ds = localStorage.getItem('chartDisplaySettings');
      if (ds) setChartDisplaySettings({ ...DEFAULT_CHART_DISPLAY, ...JSON.parse(ds) });
      const cs = localStorage.getItem('calculationSettings');
      if (cs) setCalculationSettings({ ...DEFAULT_CALCULATION_SETTINGS, ...JSON.parse(cs) });
      const dash = localStorage.getItem('dashaSettings');
      if (dash) setDashaSettings({ ...DEFAULT_DASHA_SETTINGS, ...JSON.parse(dash) });
    } catch {}
  }, []);


  // --- Handlers ---

  const toggleChartDisplay = useCallback((key: keyof ChartDisplaySettings) => {
    setChartDisplaySettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('chartDisplaySettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateCalculationSettings = useCallback((update: Partial<CalculationSettings>) => {
    setCalculationSettings((prev) => {
      const next = { ...prev, ...update };
      try { localStorage.setItem('calculationSettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateDashaSettings = useCallback((update: Partial<DashaSettings>) => {
    setDashaSettings((prev) => {
      const next = { ...prev, ...update };
      try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

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
    setTransitDatetime('');
    setTransitPlanets([]);
    setError('');
    setUseManualBcpMode(false);
    setManualBcpAge('');
    setManualBcpMonth('');
    setTargetDate(getTodayString());
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
    async (dt: string, lat: number, lng: number, tzOffset: number, tDate: string) => {
      setError('');
      const birthDate = parseDateTime(dt);
      if (!birthDate) {
        setError('Invalid birth datetime format. Use dd.mm.yyyy hh.mm.ss');
        return;
      }

      const targetParts = tDate.split('-');
      if (targetParts.length !== 3) { setError('Invalid target date.'); return; }

      const target = new Date(
        parseInt(targetParts[0]), parseInt(targetParts[1]) - 1, parseInt(targetParts[2]), 12, 0, 0
      );
      setBcpResult(calculateBcp(birthDate, target));
      setLoading(true);

      try {
        const match = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
        if (!match) { setError('Invalid birth datetime format.'); return; }

        const [, dd, mm, yyyy, hh, min, ss] = match;
        const params = new URLSearchParams({
          year: yyyy, month: mm, day: dd, hour: hh, minute: min, second: ss,
          lat: String(lat), lng: String(lng), tz: String(tzOffset),
        });

        const res = await fetch('/api/chart?' + params.toString());
        const data = await res.json();

        if (data.error) {
          setError('Chart calculation error: ' + data.error);
        } else {
          setChartData(data);
          setTransitPlanets([]);
          setActiveTab('chart');
          setDesktopTab('grahas');
        }
      } catch (e) {
        setError('Failed to calculate chart. ' + String(e));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleCalculate = useCallback(async () => {
    if (!birthDatetime.trim()) { setError('Please enter birth date and time.'); return; }
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) { setError('Please enter valid latitude and longitude.'); return; }
    if (effectiveTzOffset === null) {
      setError('Timezone could not be determined. Enter a city or set a manual UTC offset.');
      return;
    }
    await performCalculation(birthDatetime, lat, lng, effectiveTzOffset, targetDate);
  }, [birthDatetime, manualLat, manualLng, effectiveTzOffset, targetDate, performCalculation]);

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
  }, [transitDatetime, chartData, manualLat, manualLng, effectiveTzOffset]);

  const handleExportReport = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const markdown = buildReportMarkdown({
      birthDatetime,
      city: selectedGeo ? `${selectedGeo.name}, ${selectedGeo.country}` : city,
      ianaTimezone,
      effectiveTzOffset,
      latitude: isNaN(lat) ? 0 : lat,
      longitude: isNaN(lng) ? 0 : lng,
      chart: chartData,
      charaKarakas,
      bcp: effectiveBcpResult,
      calculationSettings,
    });
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bhrigu-code-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [birthDatetime, city, selectedGeo, ianaTimezone, effectiveTzOffset, manualLat, manualLng, chartData, charaKarakas, effectiveBcpResult, calculationSettings]);

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
      setShowCoords(snap.showCoords);
      setGeoResults([]);
      setSelectedGeo(null);
      setBcpResult(null);
      setChartData(null);
      setTransitPlanets([]);
      setError('');

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

  // Snapshot of current session for FileActions persistence
  const chartSnapshot: ChartSnapshot = {
    birthDatetime,
    city: selectedGeo ? `${selectedGeo.name}, ${selectedGeo.country}` : city,
    manualLat,
    manualLng,
    ianaTimezone,
    tzOverride,
    targetDate,
    showCoords,
  };

  const hasChart = !!chartData;
  const hasSnapshotData = !!birthDatetime && !!manualLat && !!manualLng;
  const displayChartName = activeChartName ?? (hasSnapshotData ? 'Untitled' : 'None');

  // Shared props objects
  const chartSectionProps = {
    bcp: effectiveBcpResult,
    chart: chartData,
    transitPlanets,
    chartDisplaySettings,
    karakaByPlanet,
    transitDatetime,
    onTransitDatetimeChange: setTransitDatetime,
    onCalculateTransit: handleCalculateTransit,
    transitLoading,
  };

  const dataProps = {
    birthDatetime, onBirthDatetimeChange: setBirthDatetime,
    city, onCityChange: setCity,
    targetDate, onTargetDateChange: setTargetDate,
    geoResults, showCoords,
    manualLat, onManualLatChange: setManualLat,
    manualLng, onManualLngChange: setManualLng,
    ianaTimezone, autoTzOffset, tzOverride, onTzOverrideChange: setTzOverride,
    onGeocode: handleGeocode,
    onSelectGeo: handleSelectGeo,
    onCalculate: handleCalculate,
    useManualBcpMode, onUseManualBcpModeChange: setUseManualBcpMode,
    manualBcpAge, onManualBcpAgeChange: setManualBcpAge,
    manualBcpMonth, onManualBcpMonthChange: setManualBcpMonth,
    manualBcpResult,
    loading, error, canCalculate,
  };

  const settingsProps = {
    chartDisplaySettings,
    onToggleChartDisplay: toggleChartDisplay,
    calculationSettings,
    onUpdateCalculationSettings: updateCalculationSettings,
    dashaSettings,
    onUpdateDashaSettings: updateDashaSettings,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-emerald-700 dark:text-green-400 tracking-tight">
            {APP_NAME}
          </span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
            <span className="text-zinc-300 dark:text-zinc-600">chart:</span>{' '}
            <span className={activeChartName ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600 italic'}>
              {displayChartName}
            </span>
          </span>
          <FileActions
            snapshot={chartSnapshot}
            hasChart={hasChart}
            onNew={handleNewChart}
            onLoad={handleLoadChartSnapshot}
            onExport={handleExportCharts}
            onImport={handleImportCharts}
            onActiveNameChange={setActiveChartName}
          />
          <ThemeToggle />
        </div>
      </header>

      {/* ── DESKTOP: 2-column grid ────────────────────────────────────── */}
      <div className="hidden md:grid md:grid-cols-2 gap-4 p-4 max-w-6xl mx-auto">
        {/* Left: Chart (always visible) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
          <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-3">&gt; chart.render</div>
          <ChartSection {...chartSectionProps} />
        </div>

        {/* Right: tabbed panels */}
        <div className="space-y-3">
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
            {DESKTOP_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setDesktopTab(tab)}
                className={`flex-1 py-1.5 text-xs font-mono rounded-md transition-colors ${
                  desktopTab === tab
                    ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            {desktopTab === 'data' && (
              <DataPanel {...dataProps} />
            )}
            {desktopTab === 'grahas' && (
              chartData
                ? <GrahasPanel chart={chartData} karakaByPlanet={karakaByPlanet} />
                : <EmptyState message="Calculate a chart to see graha positions" />
            )}
            {desktopTab === 'dasha' && (
              effectiveBcpResult && chartData
                ? <DashaPanel bcp={effectiveBcpResult} planets={chartData.planets} ascSign={chartData.ascendant.sign} birthDatetime={birthDatetime} dashaSettings={dashaSettings} />
                : <EmptyState message="Calculate a chart to see BCP dasha analysis" />
            )}
            {desktopTab === 'settings' && (
              <SettingsPanel {...settingsProps} />
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE: single panel + bottom nav ────────────────────────── */}
      <div className="md:hidden pb-20 p-4">
        {activeTab === 'chart' && (
          <Panel>
            <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-3">&gt; chart.render</div>
            <ChartSection {...chartSectionProps} />
          </Panel>
        )}

        {activeTab === 'data' && (
          <Panel>
            <DataPanel {...dataProps} />
          </Panel>
        )}

        {activeTab === 'grahas' && (
          <Panel>
            {chartData
              ? <GrahasPanel chart={chartData} karakaByPlanet={karakaByPlanet} />
              : <EmptyState message="Calculate a chart in Data to see graha positions" />
            }
          </Panel>
        )}

        {activeTab === 'dasha' && (
          <Panel>
            {effectiveBcpResult && chartData
              ? <DashaPanel bcp={effectiveBcpResult} planets={chartData.planets} ascSign={chartData.ascendant.sign} birthDatetime={birthDatetime} dashaSettings={dashaSettings} />
              : <EmptyState message="Calculate a chart in Data to see BCP dasha analysis" />
            }
          </Panel>
        )}

        {activeTab === 'settings' && (
          <Panel>
            <SettingsPanel {...settingsProps} />
          </Panel>
        )}
      </div>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Footer (desktop only) */}
      <footer className="hidden md:block text-center text-xs font-mono text-zinc-400 dark:text-zinc-700 py-6">
        {APP_NAME} {APP_VERSION} — lahiri ayanamsa · whole-sign houses · chara karakas
      </footer>
    </div>
  );
}
