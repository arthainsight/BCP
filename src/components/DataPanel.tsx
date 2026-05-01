'use client';

import { GeoResult } from '@/types';

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

  loading: boolean;
  error: string;
  canCalculate: boolean;
}

const INPUT =
  'w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 focus:border-emerald-500 dark:focus:border-green-500';

const TIME_NAV_BTN =
  'px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors';

function fmtOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  return `${sign}${offset % 1 === 0 ? offset.toFixed(0) : offset.toFixed(1)}h UTC`;
}

function toDateInputValue(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

function parseTargetDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
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
  loading, error, canCalculate,
}: Props) {
  const shiftTargetDate = (unit: 'month' | 'year', amount: number) => {
    const current = parseTargetDate(targetDate) ?? new Date();
    if (unit === 'month') current.setMonth(current.getMonth() + amount);
    if (unit === 'year') current.setFullYear(current.getFullYear() + amount);
    onTargetDateChange(toDateInputValue(current));
  };

  const resetTargetDate = () => onTargetDateChange(toDateInputValue(new Date()));

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

      {/* Multiple geo results */}
      {geoResults.length > 1 && (
        <div>
          <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
            select location
          </label>
          <select
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500"
            onChange={(e) => onSelectGeo(parseInt(e.target.value), geoResults)}
            defaultValue=""
          >
            <option value="" disabled>-- select --</option>
            {geoResults.map((r, i) => (
              <option key={i} value={i}>
                {r.name}, {r.country} ({r.latitude.toFixed(2)}, {r.longitude.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location + timezone */}
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

          <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">timezone</span>
              {autoTzOffset !== null && tzOverride === '' && (
                <span className="text-xs font-mono text-emerald-600 dark:text-green-500">auto</span>
              )}
            </div>

            {ianaTimezone ? (
              <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                {ianaTimezone}
                {autoTzOffset !== null && (
                  <span className="ml-2 text-emerald-600 dark:text-green-400">{fmtOffset(autoTzOffset)}</span>
                )}
                {!birthDatetime && (
                  <span className="ml-2 text-amber-500 dark:text-amber-400">— enter birth time to resolve DST</span>
                )}
              </div>
            ) : (
              <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                geocode a city to auto-detect timezone
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-1">
                override UTC offset (leave blank for auto)
              </label>
              <input
                type="number"
                step="any"
                value={tzOverride}
                onChange={(e) => onTzOverrideChange(e.target.value)}
                placeholder={autoTzOffset !== null ? String(autoTzOffset) : '5.5'}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Target date / time navigation */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
          target date (time navigation)
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => onTargetDateChange(e.target.value)}
          className={INPUT}
        />
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          <button type="button" onClick={() => shiftTargetDate('year', -1)} className={TIME_NAV_BTN}>-1y</button>
          <button type="button" onClick={() => shiftTargetDate('month', -1)} className={TIME_NAV_BTN}>-1m</button>
          <button type="button" onClick={resetTargetDate} className={TIME_NAV_BTN}>today</button>
          <button type="button" onClick={() => shiftTargetDate('month', 1)} className={TIME_NAV_BTN}>+1m</button>
          <button type="button" onClick={() => shiftTargetDate('year', 1)} className={TIME_NAV_BTN}>+1y</button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-xs font-mono bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-2 rounded">
          {error}
        </div>
      )}

      {/* Calculate */}
      <button
        onClick={onCalculate}
        disabled={!canCalculate || loading}
        className="w-full py-3 text-base font-mono font-bold bg-emerald-600 dark:bg-green-700 text-white rounded-lg shadow-lg hover:bg-emerald-700 dark:hover:bg-green-600 disabled:opacity-30 transition-colors md:sticky md:bottom-auto sticky bottom-24 z-20"
      >
        {loading ? 'calculating...' : '$ run bcp'}
      </button>

    </div>
  );
}
