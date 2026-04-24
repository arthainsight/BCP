'use client';

import { useState, useCallback } from 'react';
import { GeoResult, BcpResult, ChartData } from '@/types';
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

const SIGN_NAMES: Record<number, string> = {
  1: "Aries", 2: "Taurus", 3: "Gemini", 4: "Cancer",
  5: "Leo", 6: "Virgo", 7: "Libra", 8: "Scorpio",
  9: "Sagittarius", 10: "Capricorn", 11: "Aquarius", 12: "Pisces",
};

// Approximate timezone offsets for common timezone names
function getTimezoneOffset(tz: string): number {
  const tzLower = tz.toLowerCase();
  const offsets: Record<string, number> = {
    "india": 5.5, "kolkata": 5.5, "asia/kolkata": 5.5,
    "us/eastern": -5, "america/new_york": -5, "new_york": -5,
    "us/central": -6, "america/chicago": -6, "chicago": -6,
    "us/mountain": -7, "america/denver": -7, "denver": -7,
    "us/pacific": -8, "america/los_angeles": -8, "los_angeles": -8,
    "europe/london": 0, "london": 0, "europe/berlin": 1, "berlin": 1,
    "europe/paris": 1, "paris": 1, "asia/tokyo": 9, "tokyo": 9,
    "asia/shanghai": 8, "asia/beijing": 8, "beijing": 8, "shanghai": 8,
    "asia/dubai": 4, "dubai": 4, "australia/sydney": 11, "sydney": 11,
    "asia/singapore": 8, "singapore": 8, "asia/hong_kong": 8, "hong_kong": 8,
    "asia/bangkok": 7, "bangkok": 7, "asia/jakarta": 7, "jakarta": 7,
    "asia/karachi": 5, "karachi": 5, "asia/dhaka": 6, "dhaka": 6,
    "asia/kathmandu": 5.75, "kathmandu": 5.75, "asia/kabul": 4.5, "kabul": 4.5,
    "asia/tehran": 3.5, "tehran": 3.5, "asia/baghdad": 3, "baghdad": 3,
    "asia/riyadh": 3, "riyadh": 3, "asia/jerusalem": 2, "jerusalem": 2,
    "europe/moscow": 3, "moscow": 3, "america/sao_paulo": -3, "sao_paulo": -3,
    "africa/cairo": 2, "cairo": 2, "africa/lagos": 1, "lagos": 1,
    "pacific/auckland": 13, "auckland": 13,
  };

  for (const [key, offset] of Object.entries(offsets)) {
    if (tzLower.includes(key)) {
      return offset;
    }
  }
  return 0; // default UTC
}

export default function Home() {
  const [birthDatetime, setBirthDatetime] = useState("");
  const [city, setCity] = useState("");
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<GeoResult | null>(null);
  const [bcpResult, setBcpResult] = useState<BcpResult | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          setSelectedGeo(data.results[0]);
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

  const handleCalculate = useCallback(async () => {
    setError("");

    if (!birthDatetime.trim()) {
      setError("Please enter birth date and time.");
      return;
    }

    const birthDate = parseDateTime(birthDatetime);
    if (!birthDate) {
      setError("Invalid birth datetime format. Use dd.mm.yyyy hh.mm.ss");
      return;
    }

    if (!selectedGeo) {
      setError("Please select a city from the geocoding results.");
      return;
    }

    // Parse target date
    const targetParts = targetDate.split("-");
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

    // Calculate chart
    setLoading(true);
    try {
      // Re-parse raw input to get local time values (not JS Date adjusted)
      const pattern = /^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/;
      const match = birthDatetime.trim().match(pattern);
      if (!match) {
        setError("Invalid birth datetime format.");
        setLoading(false);
        return;
      }

      const [, dd, mm, yyyy, hh, min, ss] = match;
      const tzOffset = getTimezoneOffset(selectedGeo.timezone);

      const params = new URLSearchParams({
        year: yyyy,
        month: mm,
        day: dd,
        hour: hh,
        minute: min,
        second: ss,
        lat: String(selectedGeo.latitude),
        lng: String(selectedGeo.longitude),
        tz: String(tzOffset),
      });

      const res = await fetch("/api/chart?" + params.toString());
      const data = await res.json();

      if (data.error) {
        setError("Chart calculation error: " + data.error);
      } else {
        setChartData(data);
      }
    } catch (e) {
      setError("Failed to calculate chart. " + String(e));
    } finally {
      setLoading(false);
    }
  }, [birthDatetime, selectedGeo, targetDate]);

  // Convert chart data planets to the format needed by components
  const planetsForChart = chartData
    ? chartData.planets.map((p) => ({
        name: p.name,
        house: p.house,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Bhrigu Chakra Paddhati (BCP) Calculator
        </h1>
        <p className="text-sm text-gray-500 text-center">
          Based on the Jyotish system of Shri Bhrigu Muni
        </p>

        {/* Input Form */}
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Birth Date &amp; Time (dd.mm.yyyy hh.mm.ss)
            </label>
            <input
              type="text"
              value={birthDatetime}
              onChange={(e) => setBirthDatetime(e.target.value)}
              placeholder="15.08.1947 09.15.00"
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleGeocode}
                disabled={loading || !city.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "..." : "Look Up"}
              </button>
            </div>
          </div>

          {geoResults.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Location
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm"
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  setSelectedGeo(geoResults[idx]);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  -- Select a city --
                </option>
                {geoResults.map((r, i) => (
                  <option key={i} value={i}>
                    {r.name}, {r.country} ({r.latitude}, {r.longitude})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedGeo && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              Selected: {selectedGeo.name}, {selectedGeo.country} | Lat:{" "}
              {selectedGeo.latitude.toFixed(2)}, Lng:{" "}
              {selectedGeo.longitude.toFixed(2)} | TZ: {selectedGeo.timezone}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Target Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={!birthDatetime || !selectedGeo}
            className="w-full py-2 bg-amber-700 text-white rounded-lg text-sm font-semibold hover:bg-amber-800 disabled:opacity-50"
          >
            Calculate BCP
          </button>
        </div>

        {/* Chart and Summary */}
        {bcpResult && chartData && (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-4">
              <NorthIndianChart
                activeYearHouse={bcpResult.activeYearHouse}
                activeMonthHouse={bcpResult.activeMonthHouse}
                planets={planetsForChart}
              />
            </div>

            {/* Planet Positions Table */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Birth Chart Planet Positions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 border">Planet</th>
                      <th className="text-left p-2 border">Sign</th>
                      <th className="text-left p-2 border">Degree</th>
                      <th className="text-left p-2 border">House</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.planets.map((p) => (
                      <tr key={p.name} className="border-b">
                        <td className="p-2 border font-medium">{p.name}</td>
                        <td className="p-2 border">
                          {SIGN_NAMES[p.sign]} ({p.sign})
                        </td>
                        <td className="p-2 border">{p.degree.toFixed(2)}&deg;</td>
                        <td className="p-2 border">{p.house}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Ascendant: {SIGN_NAMES[chartData.ascendant.sign]} ({chartData.ascendant.sign}){" "}
                {chartData.ascendant.degree.toFixed(2)}&deg;
              </div>
            </div>

            {/* BCP House Analysis */}
            <div className="bg-white border rounded-lg p-4">
              <HouseAnalysisDisplay
                yearHouse={bcpResult.activeYearHouse}
                monthHouse={bcpResult.activeMonthHouse}
                planets={chartData.planets.map((p) => ({
                  name: p.name,
                  sign: p.sign,
                  degree: p.degree,
                  house: p.house,
                }))}
                ascSign={chartData.ascendant.sign}
              />
            </div>

            <div className="bg-white border rounded-lg p-4">
              <BcpSummary bcp={bcpResult} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
