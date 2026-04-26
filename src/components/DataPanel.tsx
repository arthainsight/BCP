'use client';

import { GeoResult, BcpResult } from '@/types';

interface Props {
  birthDatetime: string;
  onBirthDatetimeChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  targetDate: string;
  onTargetDateChange: (v: string) => void;

  geoResults: GeoResult[];
  showCoords: boolean;
  manualLat: string;
  onManualLatChange: (v: string) => void;
  manualLng: string;
  onManualLngChange: (v: string) => void;
  ianaTimezone: string;
  autoTzOffset: number | null;
  tzOverride: string;
  onTzOverrideChange: (v: string) => void;

  onGeocode: () => void;
  onSelectGeo: (idx: number, results: GeoResult[]) => void;
  onCalculate: () => void;

  useManualBcpMode: boolean;
  onUseManualBcpModeChange: (v: boolean) => void;
  manualBcpAge: string;
  onManualBcpAgeChange: (v: string) => void;
  manualBcpMonth: string;
  onManualBcpMonthChange: (v: string) => void;
  manualBcpResult: BcpResult | null;

  loading: boolean;
  error: string;
  canCalculate: boolean;
}

const INPUT =
  'w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 focus:border-emerald-500 dark:focus:border-green-500';

function fmtOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  return `${sign}${offset % 1 === 0 ? offset.toFixed(0) : offset.toFixed(1)}h UTC`;
}

export default function DataPanel({
  birthDatetime, onBirthDatetimeChange,
  city, onCityChange,
  targetDate, onTargetDateChange,
  geoResults, showCoords,
  manualLat, onManualLatChange,
  manualLng, onManualLngChange,
  ianaTimezone, autoTzOffset, tzOverride, onTzOverrideChange,
  onGeocode, onSelectGeo, onCalculate,
  useManualBcpMode, onUseManualBcpModeChange,
  manualBcpAge, onManualBcpAgeChange,
  manualBcpMonth, onManualBcpMonthChange,
  manualBcpResult,
  loading, error, canCalculate,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; data</div>

      {/* Birth datetime */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
          birth datetime
        </label>
        <input
          type="text"
          value={birthDatetime}
          onChange={(e) => onBirthDatetimeChange(e.target.value)}
          placeholder="15.08.1947 09.15.00"
          className={INPUT}
        />
        <p className="mt-1 text-xs font-mono text-zinc-400 dark:text-zinc-600">dd.mm.yyyy hh.mm.ss</p>
      </div>

      {/* City geocode */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
          city
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onGeocode()}
            placeholder="e.g. New Delhi"
            className={INPUT}
          />
          <button
            onClick={onGeocode}
            disabled={loading || !city.trim()}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-emerald-600 dark:border-cyan-700 text-emerald-700 dark:text-cyan-400 rounded text-xs font-mono hover:bg-emerald-50 dark:hover:bg-zinc-700 disabled:opacity-30 whitespace-nowrap transition-colors"
          >
            {loading ? '...' : 'lookup'}
          </button>
        </div>
      </div>

      {showCoords && (
        <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-700 pt-4">
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">&gt; location</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">lat</label>
              <input type="number" step="any" value={manualLat} onChange={(e) => onManualLatChange(e.target.value)} placeholder="28.6139" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">lng</label>
              <input type="number" step="any" value={manualLng} onChange={(e) => onManualLngChange(e.target.value)} placeholder="77.2090" className={INPUT} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-600 dark:text-red-400 text-xs font-mono bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-2 rounded">
          {error}
        </div>
      )}

      {/* 🔥 FIXED CTA */}
      <button
        onClick={onCalculate}
        disabled={!canCalculate || loading}
        className="w-full py-3 text-base font-mono font-bold bg-emerald-600 dark:bg-green-700 text-white rounded-lg shadow-lg hover:bg-emerald-700 dark:hover:bg-green-600 disabled:opacity-30 transition-colors sticky bottom-24 z-20"
      >
        {loading ? 'calculating...' : '$ run bcp'}
      </button>
    </div>
  );
}
