'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { GeoResult, BcpResult, ChartData, PlanetData, ChartDisplaySettings, CalculationSettings, DashaSettings, UiMode, DEFAULT_CHART_DISPLAY, DEFAULT_CALCULATION_SETTINGS, DEFAULT_DASHA_SETTINGS } from '@/types';
import { calculateBcp, parseDateTime } from '@/lib/bcp';
import { calculateJupiterianRounds } from '@/lib/bnn/jupiterianRounds';
import { calculateMinorProgression } from '@/lib/bnn/jupiterMinorProgression';
import { calculateNadiParaya, type NadiParayaHouseActivation } from '@/lib/bnn/nadiParaya';
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
import PanchangPanel from '@/components/PanchangPanel';
import CalculationDebugPanel from '@/components/CalculationDebugPanel';
import { buildReportMarkdown } from '@/lib/exportReport';
import FileActions, { ChartSnapshot } from '@/components/FileActions';
import BcpSummary from '@/components/BcpSummary';
import BcpManualOverride from '@/components/BcpManualOverride';
import BNNEventDetectionPanel from '@/components/BNNEventDetectionPanel';
import WorkspaceView from '@/components/workspace/WorkspaceView';
import PublicChartsPanel from '@/components/PublicChartsPanel';
import { ayanamsaLabel } from '@/lib/ayanamsas';

function ModeSwitcher({ mode, onChange, compact }: { mode: UiMode; onChange: (m: UiMode) => void; compact?: boolean }) {
  const modes: { id: UiMode; short: string; long: string }[] = [
    { id: 'simple',   short: 'S', long: 'simple'   },
    { id: 'research', short: 'R', long: 'research'  },
    { id: 'debug',    short: 'D', long: 'debug'     },
  ];
  return (
    <div className="flex gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
            mode === m.id
              ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {compact ? m.short : m.long}
        </button>
      ))}
    </div>
  );
}

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

function parseTargetDateString(value: string): Date | null {
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
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

type DesktopTab = 'data' | 'grahas' | 'dasha' | 'bnn' | 'public' | 'workspace' | 'settings';

type CalculationOptions = {
  preserveCurrentPanel?: boolean;
};

// Handles both the new { dashas: {...} } format and the old
// { showBcp, showVimshottari, dashaSystem } format from localStorage / saved charts.
function migrateDashaSettings(raw: unknown): DashaSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_DASHA_SETTINGS;
  const obj = raw as Record<string, unknown>;

  if (obj.dashas && typeof obj.dashas === 'object') {
    const d = obj.dashas as Record<string, unknown>;
    return {
      dashas: {
        bcp:         typeof d.bcp === 'boolean'         ? d.bcp         : true,
        vimshottari: typeof d.vimshottari === 'boolean' ? d.vimshottari : true,
        vds:         typeof d.vds === 'boolean'         ? d.vds         : false,
      },
    };
  }

  // Old format: showBcp / showVimshottari / dashaSystem
  return {
    dashas: {
      bcp:         obj.showBcp !== false,
      vimshottari: obj.showVimshottari !== false,
      vds:         obj.dashaSystem === 'vds',
    },
  };
}

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

function CalcSummaryBar({ ayanamsa, ayanamsaOffsetDegrees, nodeMode, ianaTimezone }: {
  ayanamsa: string;
  ayanamsaOffsetDegrees: number;
  nodeMode: string;
  ianaTimezone?: string;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
      <span>{ayanamsaLabel(ayanamsa, true)}{ayanamsa === 'custom-lahiri' ? ` (${ayanamsaOffsetDegrees >= 0 ? '+' : ''}${ayanamsaOffsetDegrees}°)` : ''} ayanamsa</span>
      <span>{nodeMode === 'true' ? 'true node' : 'mean node'}</span>
      {ianaTimezone && <span>{ianaTimezone}</span>}
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
  const [settingsRestored, setSettingsRestored] = useState(false);
  const [uiMode, setUiMode] = useState<UiMode>('simple');
  const previousCalculationKeyRef = useRef('');

  // Manual BCP
  const [useManualBcpMode, setUseManualBcpMode] = useState(false);
  const [manualBcpAge, setManualBcpAge] = useState('');
  const [manualBcpMonth, setManualBcpMonth] = useState('');

  // BNN age override — lifted here so chart highlights + event panel stay in sync
  const [bnnOverrideStr, setBnnOverrideStr] = useState('');

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

  const effectiveBcpResult = useManualBcpMode && manualBcpResult ? manualBcpResult : bcpResult;

  const canCalculate =
    !!birthDatetime && showCoords && !!manualLat && !!manualLng && effectiveTzOffset !== null;

  const charaKarakas: CharaKaraka[] = useMemo(
    () => (chartData ? calculateCharaKarakas(chartData.planets, calculationSettings.charaKarakaRankMode) : []),
    [chartData, calculationSettings.charaKarakaRankMode]
  );

  const karakaByPlanet = useMemo(() => {
    const map: Record<string, string> = {};
    charaKarakas.forEach((k) => { map[k.planet] = k.karaka; });
    return map;
  }, [charaKarakas]);

  // Nakshatra longitude adjustment: converts stored planet longitude to effective nakshatra longitude.
  // Formula: tropicalLon = lon + mainAyanamsa; siderealLon (Lahiri) = tropicalLon - siderealAyanamsa
  const nakshatraAdjust = useMemo(() => {
    const mainAyanamsa = chartData?.debug?.ayanamsa ?? 0;
    const siderealAyanamsa = chartData?.debug?.siderealAyanamsa ?? mainAyanamsa;
    if (calculationSettings.nakshatraMode === 'tropical') return mainAyanamsa;
    return mainAyanamsa - siderealAyanamsa;
  }, [chartData?.debug, calculationSettings.nakshatraMode]);

  // BNN: effective age (override or auto-computed from birth + target dates)
  const bnnAutoAge = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    const target = parseTargetDateString(targetDate);
    if (!birth || !target) return 0;
    return Math.max(0, (target.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, [birthDatetime, targetDate]);

  const effectiveBnnAge = useMemo(() => {
    const trimmed = bnnOverrideStr.trim();
    if (trimmed) {
      const n = parseFloat(trimmed);
      if (!isNaN(n) && n >= 0) return n;
    }
    return bnnAutoAge;
  }, [bnnOverrideStr, bnnAutoAge]);

  const effectiveBnnHouses = useMemo(() => {
    if (!chartData) return { major: 0, minor: 0 };
    const natalJupiter = chartData.planets.find(p => p.name === 'Jupiter');
    if (!natalJupiter) return { major: 0, minor: 0 };
    const natalJupiterSignIndex = natalJupiter.sign - 1;
    const natalJupiterDegree = natalJupiter.degree;
    const planets = chartData.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 }));
    const roundsResult = calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree, ageYears: effectiveBnnAge });
    const minorResult = calculateMinorProgression({ natalJupiterSignIndex, ageYears: effectiveBnnAge, planets });
    const asc = chartData.ascendant.sign;
    return {
      major: roundsResult.currentRound
        ? ((roundsResult.currentRound.activeSignIndex + 1 - asc + 12) % 12) + 1
        : 0,
      minor: ((minorResult.minorSignIndex + 1 - asc + 12) % 12) + 1,
    };
  }, [chartData, effectiveBnnAge]);

  const effectiveNadiParayaHouses = useMemo<NadiParayaHouseActivation[]>(() => {
    if (!chartData) return [];
    const jupiter = chartData.planets.find(p => p.name === 'Jupiter');
    const saturn = chartData.planets.find(p => p.name === 'Saturn');
    const rahu = chartData.planets.find(p => p.name === 'Rahu');
    if (!jupiter || !saturn || !rahu) return [];
    const paraya = calculateNadiParaya({
      ageYears: effectiveBnnAge,
      natalJupiterSignIndex: jupiter.sign - 1,
      natalSaturnSignIndex: saturn.sign - 1,
      natalRahuSignIndex: rahu.sign - 1,
      jupiterRetrograde: Boolean(jupiter.isRetrograde),
      saturnRetrograde: Boolean(saturn.isRetrograde),
    });
    const asc = chartData.ascendant.sign;
    return [paraya.jupiter, paraya.saturn, paraya.rahu, paraya.ketu].map(period => ({
      body: period.body,
      house: ((period.signIndex + 1 - asc + 12) % 12) + 1,
      degree: period.degree,
    }));
  }, [chartData, effectiveBnnAge]);

  useEffect(() => {
    if (useManualBcpMode || !bcpResult) return;
    const birthDate = parseDateTime(birthDatetime);
    const target = parseTargetDateString(targetDate);
    if (!birthDate || !target) return;
    setBcpResult(calculateBcp(birthDate, target));
  }, [targetDate, birthDatetime, useManualBcpMode, bcpResult]);

  // Restore persisted display/calculation/dasha settings on mount
  useEffect(() => {
    try {
      const ds = localStorage.getItem('chartDisplaySettings');
      if (ds) {
        const parsed = JSON.parse(ds);
        const merged = { ...DEFAULT_CHART_DISPLAY, ...parsed };
        if (!parsed.degreePrecision && parsed.showDegrees) merged.degreePrecision = 'degree';
        setChartDisplaySettings(merged);
      }
      const cs = localStorage.getItem('calculationSettings');
      if (cs) setCalculationSettings({ ...DEFAULT_CALCULATION_SETTINGS, ...JSON.parse(cs) });
      const dash = localStorage.getItem('dashaSettings');
      if (dash) setDashaSettings(migrateDashaSettings(JSON.parse(dash)));
      const mode = localStorage.getItem('uiMode') as UiMode | null;
      if (mode === 'simple' || mode === 'research' || mode === 'debug') setUiMode(mode);
    } catch {}
    setSettingsRestored(true);
  }, []);


  // --- Handlers ---

  const toggleChartDisplay = useCallback((key: keyof ChartDisplaySettings) => {
    setChartDisplaySettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('chartDisplaySettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateChartDisplay = useCallback((update: Partial<ChartDisplaySettings>) => {
    setChartDisplaySettings((prev) => {
      const next = { ...prev, ...update };
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

  const updateUiMode = useCallback((mode: UiMode) => {
    setUiMode(mode);
    try { localStorage.setItem('uiMode', mode); } catch {}
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
      targetDate,
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
    targetDate,
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
    nakshatraAdjust,
    birthDatetime,
    targetDate,
    bnnMajorHouseFromParent: effectiveBnnHouses.major,
    bnnMinorHouseFromParent: effectiveBnnHouses.minor,
    nadiParayaHousesFromParent: effectiveNadiParayaHouses,
    bcpEnabled: dashaSettings.dashas.bcp,
    useManualBcpMode,
    onUseManualBcpModeChange: setUseManualBcpMode,
    manualBcpAge,
    onManualBcpAgeChange: setManualBcpAge,
    manualBcpMonth,
    onManualBcpMonthChange: setManualBcpMonth,
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

  const bcpManualProps = {
    useManualBcpMode, onUseManualBcpModeChange: setUseManualBcpMode,
    manualBcpAge, onManualBcpAgeChange: setManualBcpAge,
    manualBcpMonth, onManualBcpMonthChange: setManualBcpMonth,
    manualBcpResult,
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
      {/* Desktop header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 hidden lg:flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-emerald-700 dark:text-green-400 tracking-tight">{APP_NAME}</span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{APP_VERSION}</span>
          {uiMode === 'debug' && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
              DEBUG
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
            <span className="text-zinc-300 dark:text-zinc-600">chart:</span>{' '}
            <span className={activeChartName ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600 italic'}>
              {displayChartName}
            </span>
          </span>
          <ModeSwitcher mode={uiMode} onChange={updateUiMode} />
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

      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
        {/* Row 1: app name + mode switcher + theme icon */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-emerald-700 dark:text-green-400 tracking-tight">{APP_NAME}</span>
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-2">
            <ModeSwitcher mode={uiMode} onChange={updateUiMode} compact />
            <ThemeToggle icon />
          </div>
        </div>
        {/* Row 2: chart title + actions */}
        <div className="pb-2.5 px-4">
          <div className="inline-flex max-w-full min-w-0 items-center gap-1 whitespace-nowrap">
            {displayChartName !== 'None' && (
              <span className="min-w-0 max-w-[calc(100vw-110px)] truncate text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mr-0.5">
                {displayChartName}
              </span>
            )}
            <FileActions
              snapshot={chartSnapshot}
              hasChart={hasChart}
              onNew={handleNewChart}
              onLoad={handleLoadChartSnapshot}
              onExport={handleExportCharts}
              onImport={handleImportCharts}
              onActiveNameChange={setActiveChartName}
              compact
            />
          </div>
        </div>
      </header>

      {/* ── DESKTOP: 2-column grid (or full-width workspace) ────────── */}
      <div className={`hidden lg:grid gap-4 items-start p-4 ${desktopTab === 'workspace' || desktopTab === 'public' ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]'}`}>
        {/* Left: Chart + optional BCP summary + optional Panchang (hidden in workspace mode) */}
        <div className={`space-y-3 ${desktopTab === 'workspace' || desktopTab === 'public' ? 'hidden' : ''}`}>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
            {uiMode !== 'simple' && (
              <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-3">&gt; chart.render</div>
            )}
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
          {uiMode === 'simple' && dashaSettings.dashas.bcp && effectiveBcpResult && chartData && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <BcpSummary
                bcp={effectiveBcpResult}
                planets={chartData.planets}
                ascSign={chartData.ascendant.sign}
              />
            </div>
          )}
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

        {/* Right: tabbed panels */}
        <div className="space-y-3">
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1 overflow-x-auto">
            {(['data', 'grahas', 'dasha', 'bnn', 'public', ...(chartDisplaySettings.showWorkspace ? ['workspace'] : []), 'settings'] as DesktopTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setDesktopTab(tab)}
                className={`flex-1 min-w-max py-1.5 text-xs font-mono rounded-md transition-colors ${
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
              <>
                {chartData
                  ? <GrahasPanel chart={chartData} karakaByPlanet={karakaByPlanet} chartDisplaySettings={chartDisplaySettings} nakshatraAdjust={nakshatraAdjust} birthDatetime={birthDatetime} />
                  : <EmptyState message="Calculate a chart to see graha positions" />
                }
                {uiMode !== 'simple' && chartData?.debug && (
                  <CalculationDebugPanel
                    debug={chartData.debug}
                    ianaTimezone={ianaTimezone}
                    defaultOpen={uiMode === 'debug'}
                  />
                )}
              </>
            )}
            {desktopTab === 'dasha' && (
              effectiveBcpResult && chartData
                ? <div className="space-y-4">
                    {dashaSettings.dashas.bcp && <BcpManualOverride {...bcpManualProps} />}
                    <DashaPanel
                      bcp={effectiveBcpResult}
                      planets={chartData.planets}
                      ascendant={chartData.ascendant}
                      birthDatetime={birthDatetime}
                      dashaSettings={dashaSettings}
                      collapsible={uiMode !== 'simple'}
                    />
                  </div>
                : <EmptyState message="Calculate a chart to see BCP dasha analysis" />
            )}
            {desktopTab === 'bnn' && (
              chartData
                ? <BNNEventDetectionPanel
                    chart={chartData}
                    birthDatetime={birthDatetime}
                    targetDate={targetDate}
                    bnnOverrideStr={bnnOverrideStr}
                    onBnnOverrideStrChange={setBnnOverrideStr}
                    onTargetDateChange={setTargetDate}
                  />
                : <EmptyState message="Calculate a chart to see BNN analysis" />
            )}
            {desktopTab === 'public' && <PublicChartsPanel />}
            {desktopTab === 'workspace' && (
              chartData && bcpResult
                ? <WorkspaceView
                    chart={chartData}
                    bcp={bcpResult}
                    transitPlanets={transitPlanets}
                    transitDatetime={transitDatetime}
                    onTransitDatetimeChange={setTransitDatetime}
                    onCalculateTransit={handleCalculateTransit}
                    transitLoading={transitLoading}
                    birthDatetime={birthDatetime}
                    targetDate={targetDate}
                    onTargetDateChange={setTargetDate}
                    chartDisplaySettings={chartDisplaySettings}
                    karakaByPlanet={karakaByPlanet}
                    nakshatraAdjust={nakshatraAdjust}
                    dashaSettings={dashaSettings}
                    effectiveBnnHouses={effectiveBnnHouses}
                    effectiveNadiParayaHouses={effectiveNadiParayaHouses}
                    bnnOverrideStr={bnnOverrideStr}
                    onBnnOverrideStrChange={setBnnOverrideStr}
                    bcpEnabled={dashaSettings.dashas.bcp}
                    bcpManualProps={bcpManualProps}
                  />
                : <EmptyState message="Calculate a chart to use workspace mode" />
            )}
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
              {uiMode !== 'simple' && (
                <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-3">&gt; chart.render</div>
              )}
              <ChartSection {...chartSectionProps} />
              {chartData && (
                <CalcSummaryBar
                  ayanamsa={calculationSettings.ayanamsa}
                  ayanamsaOffsetDegrees={calculationSettings.ayanamsaOffsetDegrees ?? 0}
                  nodeMode={calculationSettings.nodeMode}
                  ianaTimezone={ianaTimezone || undefined}
                />
              )}
            </Panel>
            {uiMode === 'simple' && dashaSettings.dashas.bcp && effectiveBcpResult && chartData && (
              <Panel>
                <BcpSummary
                  bcp={effectiveBcpResult}
                  planets={chartData.planets}
                  ascSign={chartData.ascendant.sign}
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
              ? <GrahasPanel chart={chartData} karakaByPlanet={karakaByPlanet} chartDisplaySettings={chartDisplaySettings} nakshatraAdjust={nakshatraAdjust} birthDatetime={birthDatetime} />
              : <EmptyState message="Calculate a chart in Data to see graha positions" />
            }
            {uiMode !== 'simple' && chartData?.debug && (
              <CalculationDebugPanel
                debug={chartData.debug}
                ianaTimezone={ianaTimezone}
                defaultOpen={uiMode === 'debug'}
              />
            )}
          </Panel>
        )}

        {activeTab === 'dasha' && (
          <Panel>
            {effectiveBcpResult && chartData
              ? <div className="space-y-4">
                  {dashaSettings.dashas.bcp && <BcpManualOverride {...bcpManualProps} />}
                  <DashaPanel
                    bcp={effectiveBcpResult}
                    planets={chartData.planets}
                    ascendant={chartData.ascendant}
                    birthDatetime={birthDatetime}
                    dashaSettings={dashaSettings}
                    collapsible={uiMode !== 'simple'}
                  />
                </div>
              : <EmptyState message="Calculate a chart in Data to see BCP dasha analysis" />
            }
          </Panel>
        )}

        {activeTab === 'bnn' && (
          <Panel>
            {chartData
              ? <BNNEventDetectionPanel
                  chart={chartData}
                  birthDatetime={birthDatetime}
                  targetDate={targetDate}
                  bnnOverrideStr={bnnOverrideStr}
                  onBnnOverrideStrChange={setBnnOverrideStr}
                  onTargetDateChange={setTargetDate}
                />
              : <EmptyState message="Calculate a chart in Data to see BNN analysis" />
            }
          </Panel>
        )}

        {activeTab === 'public' && (
          <Panel><PublicChartsPanel /></Panel>
        )}

        {activeTab === 'workspace' && (
          <Panel>
            {chartData && bcpResult
              ? <WorkspaceView
                  chart={chartData}
                  bcp={bcpResult}
                  transitPlanets={transitPlanets}
                  transitDatetime={transitDatetime}
                  onTransitDatetimeChange={setTransitDatetime}
                  onCalculateTransit={handleCalculateTransit}
                  transitLoading={transitLoading}
                  birthDatetime={birthDatetime}
                  targetDate={targetDate}
                  onTargetDateChange={setTargetDate}
                  chartDisplaySettings={chartDisplaySettings}
                  karakaByPlanet={karakaByPlanet}
                  nakshatraAdjust={nakshatraAdjust}
                  dashaSettings={dashaSettings}
                  effectiveBnnHouses={effectiveBnnHouses}
                  effectiveNadiParayaHouses={effectiveNadiParayaHouses}
                  bnnOverrideStr={bnnOverrideStr}
                  onBnnOverrideStrChange={setBnnOverrideStr}
                  bcpEnabled={dashaSettings.dashas.bcp}
                  bcpManualProps={bcpManualProps}
                />
              : <EmptyState message="Calculate a chart in Data to use workspace mode" />
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
      <div className="lg:hidden">
        <BottomNav
          activeTab={activeTab}
          onChange={setActiveTab}
          showWorkspace={chartDisplaySettings.showWorkspace}
        />
      </div>

      {/* Footer (desktop only) */}
      <footer className="hidden lg:block text-center text-xs font-mono text-zinc-400 dark:text-zinc-700 py-6">
        {APP_NAME} {APP_VERSION} — selected ayanamsa · whole-sign houses · chara karakas
      </footer>
    </div>
  );
}
