'use client';

import { useState, useCallback, useRef } from 'react';
import { GeoResult, BcpResult, ChartData, PlanetData } from '@/types';
import { calculateBcp, parseDateTime } from '@/lib/bcp';
import NorthIndianChart from '@/components/NorthIndianChart';
import BcpSummary from '@/components/BcpSummary';
import HouseAnalysisDisplay from '@/components/HouseAnalysisDisplay';

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

// Part 2: manual BCP computation (pure function, outside component)
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

const SIGN_NAMES: Record<number, string> = {
  1: "Aries", 2: "Taurus", 3: "Gemini", 4: "Cancer",
  5: "Leo", 6: "Virgo", 7: "Libra", 8: "Scorpio",
  9: "Sagittarius", 10: "Capricorn", 11: "Aquarius", 12: "Pisces",
};

interface BirthProfile {
  name: string;
  birthDatetime: string;
  city: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
}

export default function Home() {
  const [birthDatetime, setBirthDatetime] = useState("");
  const [city, setCity] = useState("");
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<GeoResult | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualTzOffset, setManualTzOffset] = useState("");
  const [showCoords, setShowCoords] = useState(false);
  const [bcpResult, setBcpResult] = useState<BcpResult | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Part 1: transit state
  const [transitDatetime, setTransitDatetime] = useState("");
  const [transitPlanets, setTransitPlanets] = useState<PlanetData[]>([]);
  const [transitLoading, setTransitLoading] = useState(false);

  // Part 2: manual BCP mode state
  const [useManualBcpMode, setUseManualBcpMode] = useState(false);
  const [manualBcpAge, setManualBcpAge] = useState("");
  const [manualBcpMonth, setManualBcpMonth] = useState("");

  type SectionKey = 'birthData' | 'chart' | 'planetPositions' | 'houseAnalysis' | 'bcpSummary' | 'manualBcp';
  const [visibleSections, setVisibleSections] = useState<Record<SectionKey, boolean>>({
    birthData: true,
    chart: true,
    planetPositions: true,
    houseAnalysis: true,
    bcpSummary: true,
    manualBcp: false,
  });
  const toggleSection = useCallback((key: SectionKey) => {
    setVisibleSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  type ChartOptionKey = 'showHouseNumbers' | 'showSigns' | 'showNatalPlanets' | 'showTransitPlanets';
  const [chartOptions, setChartOptions] = useState<Record<ChartOptionKey, boolean>>({
    showHouseNumbers: true,
    showSigns: true,
    showNatalPlanets: true,
    showTransitPlanets: false,
  });
  const toggleChartOption = useCallback((key: ChartOptionKey) => {
    setChartOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleGeocode = useCallback(async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError("");
    setGeoResults([]);
    setSelectedGeo(null);

    try {
      const res = await fetch("/api/geocode?city=" + encodeURIComponent(city));
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.results && data.results.length > 0) {
        setGeoResults(data.results);
        if (data.results.length === 1) {
          const geo: GeoResult = data.results[0];
          setSelectedGeo(geo);
          setManualLat(String(geo.latitude));
          setManualLng(String(geo.longitude));
          setShowCoords(true);
        }
      } else {
        setError("City not found. Please try a different name.");
      }
    } catch {
      setError("Failed to look up city. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  const handleSelectGeoFromDropdown = useCallback((idx: number, results: GeoResult[]) => {
    const geo = results[idx];
    setSelectedGeo(geo);
    setManualLat(String(geo.latitude));
    setManualLng(String(geo.longitude));
    setShowCoords(true);
  }, []);

  const performCalculation = useCallback(async (
    dt: string,
    lat: number,
    lng: number,
    tzOffset: number,
    tDate: string
  ) => {
    setError("");

    const birthDate = parseDateTime(dt);
    if (!birthDate) {
      setError("Invalid birth datetime format. Use dd.mm.yyyy hh.mm.ss");
      return;
    }

    const targetParts = tDate.split("-");
    if (targetParts.length !== 3) {
      setError("Invalid target date.");
      return;
    }
    const target = new Date(
      parseInt(targetParts[0]),
      parseInt(targetParts[1]) - 1,
      parseInt(targetParts[2]),
      12, 0, 0
    );

    const result = calculateBcp(birthDate, target);
    setBcpResult(result);

    setLoading(true);
    try {
      const pattern = /^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/;
      const match = dt.trim().match(pattern);
      if (!match) {
        setError("Invalid birth datetime format.");
        setLoading(false);
        return;
      }

      const [, dd, mm, yyyy, hh, min, ss] = match;

      const params = new URLSearchParams({
        year: yyyy, month: mm, day: dd,
        hour: hh, minute: min, second: ss,
        lat: String(lat), lng: String(lng),
        tz: String(tzOffset),
      });

      const res = await fetch("/api/chart?" + params.toString());
      const data = await res.json();

      if (data.error) {
        setError("Chart calculation error: " + data.error);
      } else {
        setChartData(data);
        setTransitPlanets([]); // clear stale transit when natal changes
      }
    } catch (e) {
      setError("Failed to calculate chart. " + String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCalculate = useCallback(async () => {
    if (!birthDatetime.trim()) {
      setError("Please enter birth date and time.");
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const tzOffset = parseFloat(manualTzOffset);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid latitude and longitude.");
      return;
    }
    if (isNaN(tzOffset)) {
      setError(
        "Please enter a valid timezone offset (e.g. 5.5 for India, 2 for Finland winter, 3 for Finland summer)."
      );
      return;
    }

    await performCalculation(birthDatetime, lat, lng, tzOffset, targetDate);
  }, [birthDatetime, manualLat, manualLng, manualTzOffset, targetDate, performCalculation]);

  // Part 1: transit calculation — fetches sidereal planets for transit datetime,
  // then remaps each planet's house relative to the natal ascendant sign.
  const handleCalculateTransit = useCallback(async () => {
    if (!transitDatetime.trim() || !chartData) return;

    const pattern = /^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/;
    const match = transitDatetime.trim().match(pattern);
    if (!match) {
      setError("Invalid transit datetime format. Use dd.mm.yyyy hh.mm.ss");
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const tzOffset = parseFloat(manualTzOffset);
    if (isNaN(lat) || isNaN(lng) || isNaN(tzOffset)) {
      setError("Natal location data is required for transit calculation.");
      return;
    }

    const [, dd, mm, yyyy, hh, min, ss] = match;
    setTransitLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        year: yyyy, month: mm, day: dd,
        hour: hh, minute: min, second: ss,
        lat: String(lat), lng: String(lng),
        tz: String(tzOffset),
      });

      const res = await fetch("/api/chart?" + params.toString());
      const data = await res.json();

      if (data.error) {
        setError("Transit calculation error: " + data.error);
        return;
      }

      // Remap transit houses relative to natal ascendant (not transit ascendant)
      const natalAsc = chartData.ascendant.sign;
      const remapped: PlanetData[] = (data.planets as PlanetData[]).map(p => ({
        ...p,
        house: ((p.sign - natalAsc + 12) % 12) + 1,
      }));
      setTransitPlanets(remapped);
    } catch (e) {
      setError("Failed to calculate transit. " + String(e));
    } finally {
      setTransitLoading(false);
    }
  }, [transitDatetime, chartData, manualLat, manualLng, manualTzOffset]);

  const handleSaveProfile = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const tzOffset = parseFloat(manualTzOffset);
    const profileName = selectedGeo ? selectedGeo.name : city || "Unknown";

    const profile: BirthProfile = {
      name: profileName,
      birthDatetime,
      city: selectedGeo ? `${selectedGeo.name}, ${selectedGeo.country}` : city,
      latitude: isNaN(lat) ? 0 : lat,
      longitude: isNaN(lng) ? 0 : lng,
      timezoneOffset: isNaN(tzOffset) ? 0 : tzOffset,
    };

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = profileName.replace(/\s+/g, "_") + "_birth_profile.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [birthDatetime, city, selectedGeo, manualLat, manualLng, manualTzOffset]);

  const handleLoadProfile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const text = await file.text();
      const profile: BirthProfile = JSON.parse(text);

      setBirthDatetime(profile.birthDatetime);
      setCity(profile.city);
      setManualLat(String(profile.latitude));
      setManualLng(String(profile.longitude));
      setManualTzOffset(String(profile.timezoneOffset));
      setShowCoords(true);
      setGeoResults([]);
      setSelectedGeo(null);

      await performCalculation(
        profile.birthDatetime,
        profile.latitude,
        profile.longitude,
        profile.timezoneOffset,
        targetDate
      );
    } catch {
      setError("Failed to load profile. Make sure it is a valid JSON profile file.");
    }
  }, [targetDate, performCalculation]);

  // Part 2: derive manual BCP result
  const manualBcpAgeNum = parseInt(manualBcpAge);
  const manualBcpMonthNum = parseInt(manualBcpMonth);
  const manualBcpResult: BcpResult | null =
    useManualBcpMode &&
    !isNaN(manualBcpAgeNum) &&
    manualBcpAgeNum >= 0 &&
    !isNaN(manualBcpMonthNum) &&
    manualBcpMonthNum >= 1 &&
    manualBcpMonthNum <= 12
      ? computeManualBcp(manualBcpAgeNum, manualBcpMonthNum)
      : null;

  const effectiveBcpResult = useManualBcpMode ? manualBcpResult : bcpResult;

  const planetsForChart = chartData ? chartData.planets : [];

  const canCalculate =
    !!birthDatetime &&
    showCoords &&
    !!manualLat &&
    !!manualLng &&
    manualTzOffset !== "";

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center font-mono text-green-400 tracking-tight">
          bhrigu_chakra_paddhati.exe
        </h1>
        <p className="text-xs text-zinc-500 text-center font-mono">
          // jyotish BCP calculator — lahiri ayanamsa, whole-sign houses
        </p>

        {/* Profile Save / Load */}
        <div className="bg-zinc-900 border border-zinc-700 rounded p-3 flex flex-wrap gap-3 items-center">
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest">&gt; profile</span>
          <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 rounded text-xs font-mono cursor-pointer">
            load
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleLoadProfile}
            />
          </label>
          <button
            onClick={handleSaveProfile}
            disabled={!birthDatetime || !manualLat || !manualLng || manualTzOffset === ""}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600 rounded text-xs font-mono disabled:opacity-30"
          >
            save
          </button>
        </div>

        {/* Section visibility toggles */}
        <div className="bg-zinc-900 border border-zinc-700 rounded p-3">
          <div className="text-xs text-zinc-500 font-mono mb-2">&gt; sections</div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'birthData',      label: 'birth.data' },
                { key: 'manualBcp',      label: 'bcp.manual' },
                { key: 'chart',          label: 'chart.render' },
                { key: 'planetPositions',label: 'planets' },
                { key: 'houseAnalysis',  label: 'house.analysis' },
                { key: 'bcpSummary',     label: 'bcp.engine' },
              ] as { key: SectionKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSection(key)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
                  visibleSections[key]
                    ? 'bg-green-900/60 text-green-400 border-green-700'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        {visibleSections.birthData && (
        <div className="bg-zinc-900 border border-zinc-700 rounded p-5 space-y-4">
          <div className="text-xs text-zinc-500 font-mono">&gt; birth.data</div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">
              birth datetime (dd.mm.yyyy hh.mm.ss)
            </label>
            <input
              type="text"
              value={birthDatetime}
              onChange={(e) => setBirthDatetime(e.target.value)}
              placeholder="15.08.1947 09.15.00"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">city</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleGeocode}
                disabled={loading || !city.trim()}
                className="px-4 py-2 bg-zinc-800 border border-cyan-700 text-cyan-400 rounded text-xs font-mono hover:bg-zinc-700 disabled:opacity-30 whitespace-nowrap"
              >
                {loading ? "..." : "geocode"}
              </button>
            </div>
          </div>

          {geoResults.length > 1 && (
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">
                select location
              </label>
              <select
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:ring-1 focus:ring-green-500"
                onChange={(e) => handleSelectGeoFromDropdown(parseInt(e.target.value), geoResults)}
                defaultValue=""
              >
                <option value="" disabled>
                  -- select --
                </option>
                {geoResults.map((r, i) => (
                  <option key={i} value={i}>
                    {r.name}, {r.country} ({r.latitude}, {r.longitude})
                  </option>
                ))}
              </select>
            </div>
          )}

          {showCoords && (
            <div className="space-y-3 border-t border-zinc-700 pt-4">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">&gt; location.override</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">lat</label>
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="28.6139"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">lng</label>
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="77.2090"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">
                  tz offset (hours from UTC)
                </label>
                <input
                  type="number"
                  step="any"
                  value={manualTzOffset}
                  onChange={(e) => setManualTzOffset(e.target.value)}
                  placeholder="5.5 = India, 2 = FIN winter, 3 = FIN summer, -5 = US Eastern"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                <p className="mt-1 text-xs text-amber-500 font-mono">
                  // offset must account for DST on the birth date
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">target date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs font-mono bg-red-950/50 border border-red-800 p-2 rounded">{error}</div>
          )}

          <button
            onClick={handleCalculate}
            disabled={!canCalculate || loading}
            className="w-full py-2 bg-zinc-800 border border-green-700 text-green-400 rounded text-sm font-mono font-semibold hover:bg-green-900/40 disabled:opacity-30"
          >
            {loading ? "calculating..." : "$ run bcp"}
          </button>
        </div>
        )}

        {/* Part 2: Manual BCP Age Mode */}
        {visibleSections.manualBcp && (
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs text-zinc-400 uppercase tracking-widest">&gt; bcp.manual</h3>
              <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useManualBcpMode}
                  onChange={(e) => setUseManualBcpMode(e.target.checked)}
                  className="w-4 h-4 accent-green-500"
                />
                override auto-bcp
              </label>
            </div>

            {useManualBcpMode && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">
                      completed age
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualBcpAge}
                      onChange={(e) => setManualBcpAge(e.target.value)}
                      placeholder="41"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase tracking-wide">
                      month (1–12)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={manualBcpMonth}
                      onChange={(e) => setManualBcpMonth(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                {manualBcpResult && (
                  <div className="bg-zinc-800 border border-amber-700/60 rounded p-2 text-xs font-mono text-amber-400 space-y-0.5">
                    <div>year: {manualBcpResult.runningYear} · cycle: {manualBcpResult.bcpCycle}</div>
                    <div>
                      year_house: <strong>H{manualBcpResult.activeYearHouse}</strong>
                      {' · '}
                      month_house: <strong>H{manualBcpResult.activeMonthHouse}</strong>
                    </div>
                  </div>
                )}

                {useManualBcpMode && (!manualBcpResult) && manualBcpAge && manualBcpMonth && (
                  <p className="text-xs text-red-400 font-mono">
                    // error: month must be 1–12
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Chart — independently toggled */}
        {effectiveBcpResult && chartData && visibleSections.chart && (
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4 space-y-3">
            <div className="text-xs text-zinc-500 font-mono">&gt; chart.render</div>
            {/* Chart display toggles */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'showHouseNumbers', label: 'h#' },
                  { key: 'showSigns',        label: 'signs' },
                  { key: 'showNatalPlanets', label: 'natal' },
                  { key: 'showTransitPlanets', label: 'transit' },
                ] as { key: ChartOptionKey; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleChartOption(key)}
                  className={`px-2 py-0.5 rounded text-xs font-mono border ${
                    chartOptions[key]
                      ? 'bg-green-900/60 text-green-400 border-green-700'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Part 1: transit datetime input — shown when Transit toggle is on */}
            {chartOptions.showTransitPlanets && (
              <div className="flex gap-2 items-center border-t border-zinc-700 pt-2">
                <input
                  type="text"
                  value={transitDatetime}
                  onChange={(e) => setTransitDatetime(e.target.value)}
                  placeholder="transit: dd.mm.yyyy hh.mm.ss"
                  className="flex-1 px-2 py-1.5 bg-zinc-800 border border-zinc-600 rounded text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <button
                  onClick={handleCalculateTransit}
                  disabled={transitLoading || !transitDatetime.trim()}
                  className="px-3 py-1.5 bg-zinc-800 border border-cyan-700 text-cyan-400 rounded text-xs font-mono hover:bg-zinc-700 disabled:opacity-30 whitespace-nowrap"
                >
                  {transitLoading ? "..." : "$ transit"}
                </button>
              </div>
            )}

            <NorthIndianChart
              activeYearHouse={effectiveBcpResult.activeYearHouse}
              activeMonthHouse={effectiveBcpResult.activeMonthHouse}
              ascendantSign={chartData.ascendant.sign}
              planets={planetsForChart}
              transitPlanets={transitPlanets}
              showHouseNumbers={chartOptions.showHouseNumbers}
              showSigns={chartOptions.showSigns}
              showNatalPlanets={chartOptions.showNatalPlanets}
              showTransitPlanets={chartOptions.showTransitPlanets}
            />
          </div>
        )}

        {effectiveBcpResult && chartData && visibleSections.planetPositions && (
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4">
            <h3 className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-3">&gt; planet.positions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-zinc-800">
                    <th className="text-left p-2 border border-zinc-700 text-zinc-400">planet</th>
                    <th className="text-left p-2 border border-zinc-700 text-zinc-400">sign</th>
                    <th className="text-left p-2 border border-zinc-700 text-zinc-400">degree</th>
                    <th className="text-left p-2 border border-zinc-700 text-zinc-400">house</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.planets.map((p) => (
                    <tr key={p.name} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                      <td className="p-2 border border-zinc-800 text-zinc-200 font-medium">{p.name}</td>
                      <td className="p-2 border border-zinc-800 text-zinc-400">
                        {SIGN_NAMES[p.sign]} ({p.sign})
                      </td>
                      <td className="p-2 border border-zinc-800 text-zinc-400">{p.degree.toFixed(2)}&deg;</td>
                      <td className="p-2 border border-zinc-800 text-zinc-400">H{p.house}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs font-mono text-zinc-500">
              asc: {SIGN_NAMES[chartData.ascendant.sign]} ({chartData.ascendant.sign}){" "}
              {chartData.ascendant.degree.toFixed(2)}&deg;
            </div>
          </div>
        )}

        {effectiveBcpResult && chartData && visibleSections.houseAnalysis && (
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4">
            <HouseAnalysisDisplay
              yearHouse={effectiveBcpResult.activeYearHouse}
              monthHouse={effectiveBcpResult.activeMonthHouse}
              planets={chartData.planets.map((p) => ({
                name: p.name,
                sign: p.sign,
                degree: p.degree,
                house: p.house,
              }))}
              ascSign={chartData.ascendant.sign}
            />
          </div>
        )}

        {effectiveBcpResult && chartData && visibleSections.bcpSummary && (
          <div className="bg-zinc-900 border border-zinc-700 rounded p-4">
            <BcpSummary
              bcp={effectiveBcpResult}
              planets={chartData.planets}
              ascSign={chartData.ascendant.sign}
            />
          </div>
        )}
      </div>
    </div>
  );
}
