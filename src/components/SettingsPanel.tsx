'use client';

import React from 'react';
import { GeoResult, BcpResult } from '@/types';
import ThemeToggle from './ThemeToggle';

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
  onSaveProfile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onLoadProfile: (e: React.ChangeEvent<HTMLInputElement>) => void;

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
  showThemeToggle?: boolean;
}

const INPUT =
  'w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 focus:border-emerald-500 dark:focus:border-green-500';

function fmtOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  return `${sign}${offset % 1 === 0 ? offset.toFixed(0) : offset.toFixed(1)}h UTC`;
}

export default function SettingsPanel({
  birthDatetime, onBirthDatetimeChange,
  city, onCityChange,
  targetDate, onTargetDateChange,
  geoResults, showCoords,
  manualLat, onManualLatChange,
  manualLng, onManualLngChange,
  ianaTimezone, autoTzOffset, tzOverride, onTzOverrideChange,
  onGeocode, onSelectGeo, onCalculate, onSaveProfile,
  fileInputRef, onLoadProfile,
  useManualBcpMode, onUseManualBcpModeChange,
  manualBcpAge, onManualBcpAgeChange,
  manualBcpMonth, onManualBcpMonthChange,
  manualBcpResult,
  loading, error, canCalculate,
  showThemeToggle,
}: Props) {
  const effectiveTz = tzOverride !== '' ? parseFloat(tzOverride) : autoTzOffset;

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; settings</div>

      {/* Profile load/save */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">profile</span>
        <label className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono cursor-pointer transition-colors">
          load
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={onLoadProfile}
          />
        </label>
        <button
          onClick={onSaveProfile}
          disabled={!birthDatetime || !manualLat || !manualLng || effectiveTz === null}
          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono disabled:opacity-30 transition-colors"
        >
          save
        </button>
      </div>

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

      {/* Multiple results dropdown */}
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

      {/* Location + timezone display */}
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

          {/* Timezone row */}
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

            {/* Manual override */}
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

      {/* Target date */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
          target date (BCP reference)
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => onTargetDateChange(e.target.value)}
          className={INPUT}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 dark:text-red-400 text-xs font-mono bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-2 rounded">
          {error}
        </div>
      )}

      {/* Calculate button */}
      <button
        onClick={onCalculate}
        disabled={!canCalculate || loading}
        className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-emerald-600 dark:border-green-700 text-emerald-700 dark:text-green-400 rounded text-sm font-mono font-semibold hover:bg-emerald-50 dark:hover:bg-green-900/40 disabled:opacity-30 transition-colors"
      >
        {loading ? 'calculating...' : '$ run bcp'}
      </button>

      {/* Manual BCP override */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; bcp.manual</span>
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useManualBcpMode}
              onChange={(e) => onUseManualBcpModeChange(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 dark:accent-green-500"
            />
            override
          </label>
        </div>

        {useManualBcpMode && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">completed age</label>
                <input type="number" min="0" value={manualBcpAge} onChange={(e) => onManualBcpAgeChange(e.target.value)} placeholder="41" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">month (1–12)</label>
                <input type="number" min="1" max="12" value={manualBcpMonth} onChange={(e) => onManualBcpMonthChange(e.target.value)} placeholder="1" className={INPUT} />
              </div>
            </div>

            {manualBcpResult && (
              <div className="bg-amber-50 dark:bg-zinc-800 border border-amber-300 dark:border-amber-700/60 rounded p-2 text-xs font-mono text-amber-700 dark:text-amber-400 space-y-0.5">
                <div>year: {manualBcpResult.runningYear} · cycle: {manualBcpResult.bcpCycle}</div>
                <div>
                  year_house: <strong>H{manualBcpResult.activeYearHouse}</strong>
                  {' · '}
                  month_house: <strong>H{manualBcpResult.activeMonthHouse}</strong>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Theme toggle (mobile only) */}
      {showThemeToggle && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">theme</span>
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}
