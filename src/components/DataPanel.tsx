'use client';

import { useState } from 'react';
import { GeoResult } from '@/types';
import { useT } from '@/lib/i18n';

interface Props {
  birthDatetime: string;
  onBirthDatetimeChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
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

  /**
   * The phone layout: the place is one line (coordinates and time zone, found from the city) with
   * an edit button, instead of the coordinate fields and the time zone box.
   */
  compact?: boolean;
  /** Folds the form away once there is a chart to look at; the button is left out when this is not given. */
  onCollapse?: () => void;
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
  geoResults, showCoords,
  manualLat, onManualLatChange,
  manualLng, onManualLngChange,
  ianaTimezone, autoTzOffset, tzOverride, onTzOverrideChange,
  onGeocode, onSelectGeo, onCalculate,
  loading, error, canCalculate,
  compact = false, onCollapse,
}: Props) {
  const t = useT();
  const [editLocation, setEditLocation] = useState(false);
  const lat = Number(manualLat);
  const lng = Number(manualLng);
  const coordinates = manualLat !== '' && manualLng !== '' && Number.isFinite(lat) && Number.isFinite(lng)
    ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    : `${manualLat}, ${manualLng}`;
  return (
    <div className="space-y-5">
      {(!compact || onCollapse) && (
        <div className="flex items-center justify-between gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-500">
          {compact ? <span /> : <span>{t('> data')}</span>}
          {onCollapse && (
            <button type="button" onClick={onCollapse} className="rounded border border-zinc-200 px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100">
              {t('▲ hide')}
            </button>
          )}
        </div>
      )}

      {/* Birth datetime */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
          {t('birth datetime')}
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
          {t('city')}
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
            {loading ? '...' : t('lookup')}
          </button>
        </div>
      </div>

      {/* Multiple geo results */}
      {geoResults.length > 1 && (
        <div>
          <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
            {t('select location')}
          </label>
          <select
            className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500"
            onChange={(e) => onSelectGeo(parseInt(e.target.value), geoResults)}
            defaultValue=""
          >
            <option value="" disabled>{t('-- select --')}</option>
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
          {compact ? (
            <div className="flex items-start justify-between gap-3" data-location-summary>
              <div className="min-w-0 space-y-0.5 text-xs font-mono text-zinc-600 dark:text-zinc-300">
                <div>{coordinates}</div>
                <div className="break-words">
                  {tzOverride !== '' ? (
                    <span className="text-amber-600 dark:text-amber-400">{t('UTC offset set by hand')}: {tzOverride}h</span>
                  ) : ianaTimezone ? (
                    <>
                      {ianaTimezone}
                      {autoTzOffset !== null && <span className="ml-2 text-emerald-600 dark:text-green-400">{fmtOffset(autoTzOffset)}</span>}
                      {!birthDatetime && <span className="ml-2 text-amber-500 dark:text-amber-400">{t('— enter birth time to resolve DST')}</span>}
                    </>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">{t('geocode a city to auto-detect timezone')}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditLocation(open => !open)}
                aria-expanded={editLocation}
                className="shrink-0 rounded border border-zinc-200 px-2 py-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {editLocation ? t('Close') : t('edit')}
              </button>
            </div>
          ) : (
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{t('> location')}</div>
          )}

          {(!compact || editLocation) && (
            <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">{t('lat')}</label>
                <input type="number" step="any" value={manualLat} onChange={(e) => onManualLatChange(e.target.value)} placeholder="28.6139" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">{t('lng')}</label>
                <input type="number" step="any" value={manualLng} onChange={(e) => onManualLngChange(e.target.value)} placeholder="77.2090" className={INPUT} />
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800/60 rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{t('timezone')}</span>
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
                    <span className="ml-2 text-amber-500 dark:text-amber-400">{t('— enter birth time to resolve DST')}</span>
                  )}
                </div>
              ) : (
                <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  {t('geocode a city to auto-detect timezone')}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-1">
                  {t('override UTC offset (leave blank for auto)')}
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
            </>
          )}
        </div>
      )}

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
        className="w-full py-3 text-base font-mono font-bold bg-emerald-600 dark:bg-green-700 text-white rounded-lg shadow-lg hover:bg-emerald-700 dark:hover:bg-green-600 disabled:opacity-30 transition-colors"
      >
        {loading ? t('Calculating...') : t('Calculate Chart')}
      </button>

    </div>
  );
}
