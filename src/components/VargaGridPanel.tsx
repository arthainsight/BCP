'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChartData, ChartDisplaySettings } from '@/types';
import { VARGA_DIVISIONS, VARGA_NAMES, VARGA_SIGNIFICATIONS, buildVargaChart } from '@/lib/vargaChart';
import { vargaChartProps } from '@/lib/vargaChartProps';
import {
  DEFAULT_VARGA_GRID,
  VARGA_GRID_MAX,
  VARGA_GRID_MIN,
  VARGA_GRID_PRESETS,
  VARGA_GRID_PRESET_ORDER,
  readVargaGridSelection,
  toggleCustomDivision,
  vargaGridDivisions,
  type VargaGridSelection,
} from '@/lib/vargaGrid';
import { followPlanet } from '@/lib/vargaFollow';
import type { DashaLordMarks } from './chartLayers';
import ChartExportButtons from './ChartExportButtons';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import { useT } from '@/lib/i18n';

const STORAGE_KEY = 'vargaGrid';
const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

type Props = {
  chart: ChartData;
  chartStyle: 'north' | 'south';
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  dashaLords?: DashaLordMarks | null;
};

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

const PILL = 'shrink-0 rounded-md px-2 py-1.5 text-[10px] font-mono';
const PILL_ON = 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400';
const PILL_OFF = 'text-zinc-500 dark:text-zinc-400';

export default function VargaGridPanel({ chart, chartStyle, chartDisplaySettings, karakaByPlanet = {}, nakshatraAdjust = 0, dashaLords = null }: Props) {
  const t = useT();
  const [selection, setSelection] = useState<VargaGridSelection>(DEFAULT_VARGA_GRID);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // localStorage is only readable after mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSelection(readVargaGridSelection(JSON.parse(raw)));
    } catch {}
  }, []);

  const save = (next: VargaGridSelection) => {
    setSelection(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const divisions = vargaGridDivisions(selection);
  const toggleHighlight = (name: string) => setHighlight(current => (current === name ? null : name));

  const chartProps = (division: number, compact: boolean) =>
    vargaChartProps({
      chart, division, compact, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords,
      highlight, onPlanetClick: toggleHighlight,
    });

  const renderChart = (division: number, compact: boolean) =>
    chartStyle === 'south'
      ? <SouthIndianChart {...chartProps(division, compact)} />
      : <NorthIndianChart {...chartProps(division, compact)} />;

  return (
    <div className="min-w-0 space-y-3">
      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('Divisional charts side by side. Tap a planet to follow it through every chart; tap a chart’s title to see it full size with your display settings.')}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-max gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
          {VARGA_GRID_PRESET_ORDER.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => save({ ...selection, preset })}
              className={`${PILL} ${selection.preset === preset ? PILL_ON : PILL_OFF}`}
            >
              {preset === 'custom' ? t('Custom') : VARGA_GRID_PRESETS[preset].label}
            </button>
          ))}
        </div>
      </div>

      {selection.preset === 'custom' && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {VARGA_DIVISIONS.map(division => {
              const on = selection.custom.includes(division);
              const locked = on ? selection.custom.length <= VARGA_GRID_MIN : selection.custom.length >= VARGA_GRID_MAX;
              return (
                <button
                  key={division}
                  type="button"
                  aria-pressed={on}
                  disabled={locked}
                  onClick={() => save({ ...selection, custom: toggleCustomDivision(selection.custom, division) })}
                  title={`${VARGA_NAMES[division]} — ${VARGA_SIGNIFICATIONS[division]}`}
                  className={`rounded border px-1.5 py-1 text-[10px] font-mono disabled:opacity-40 ${on
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-green-600 dark:bg-green-950/30 dark:text-green-400'
                    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`}
                >
                  D{division}
                </button>
              );
            })}
          </div>
          <div className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('Choose')} {VARGA_GRID_MIN}–{VARGA_GRID_MAX} {t('charts')} ({selection.custom.length} {t('selected')}).
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mr-1">{t('follow')}</span>
        {PLANET_ORDER.map(name => (
          <button
            key={name}
            type="button"
            aria-pressed={highlight === name}
            onClick={() => toggleHighlight(name)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold ${highlight === name
              ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-zinc-950'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}
          >
            {PLANET_CODES[name]}
          </button>
        ))}
      </div>

      {highlight && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {followPlanet(chart, highlight, divisions).map(place => (
              <span
                key={place.division}
                title={[
                  `${highlight} in ${SIGN_ABBR[place.sign - 1]} in D${place.division}`,
                  place.dignity && t(place.dignity === 'own' ? 'own sign' : place.dignity),
                  place.sameAsRasi && 'same sign as in D1',
                ].filter(Boolean).join(' · ')}
                className={`rounded border px-1.5 py-0.5 text-[10px] font-mono ${place.sameAsRasi ? 'font-bold underline' : ''} ${
                  place.dignity === 'exalted' ? 'border-emerald-400 text-emerald-700 dark:border-green-700 dark:text-green-400'
                  : place.dignity === 'own' ? 'border-sky-400 text-sky-700 dark:border-sky-700 dark:text-sky-300'
                  : place.dignity === 'debilitated' ? 'border-rose-400 text-rose-700 dark:border-rose-800 dark:text-rose-400'
                  : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`}
              >
                D{place.division} {SIGN_ABBR[place.sign - 1]}{place.dignity === 'exalted' ? ' ↑' : place.dignity === 'debilitated' ? ' ↓' : place.dignity === 'own' ? ' ◆' : ''}
              </span>
            ))}
          </div>
          <div className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('↑ exalted · ◆ own sign · ↓ debilitated ·')} <span className="font-bold underline">{t('underlined')}</span> {t('= same sign as D1')}
          </div>
        </div>
      )}

      {expanded !== null && (
        <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">D{expanded} {VARGA_NAMES[expanded]}</div>
              <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                {VARGA_SIGNIFICATIONS[expanded]}. Houses are counted from the D{expanded} ascendant
                ({SIGN_ABBR[buildVargaChart(chart, expanded).ascendantSign - 1]}).
                {expanded !== 1 && ' Degrees show the position within the divisional sign.'}
              </div>
            </div>
            <button type="button" onClick={() => setExpanded(null)} className="shrink-0 rounded border border-zinc-200 px-2 py-1 text-[10px] font-mono text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              {t('Close')}
            </button>
          </div>
          <div ref={expandedRef} className="space-y-2">
            <ChartExportButtons targetRef={expandedRef} fileName={`chart-d${expanded}`} />
            {renderChart(expanded, false)}
          </div>
        </div>
      )}

      <div className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('Planet colours:')} <span className="font-bold text-green-700 dark:text-green-400">{t('exalted')}</span> · <span className="font-bold text-sky-700 dark:text-sky-300">{t('own sign')}</span> · <span className="font-bold text-rose-700 dark:text-rose-400">{t('debilitated')}</span>
      </div>

      <div className="@container">
        <div className={`grid gap-2 ${chartStyle === 'south'
          // South Indian cells are a quarter of the chart wide, so small South
          // charts need a full phone width to stay readable.
          ? 'grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5'
          : 'grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 @7xl:grid-cols-6'}`}>
          {divisions.map(division => (
            <div
              key={division}
              className={`min-w-0 rounded-lg border p-1.5 ${expanded === division
                ? 'border-emerald-500 dark:border-green-600'
                : 'border-zinc-200 dark:border-zinc-700'}`}
            >
              <button
                type="button"
                onClick={() => setExpanded(current => (current === division ? null : division))}
                title={VARGA_SIGNIFICATIONS[division]}
                className="mb-1 flex w-full min-w-0 items-baseline gap-1 text-left font-mono"
              >
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">D{division}</span>
                <span className="truncate text-[9px] text-zinc-400 dark:text-zinc-500">{VARGA_NAMES[division]}</span>
              </button>
              {renderChart(division, true)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
