'use client';

import { useMemo, useState } from 'react';
import type { ChartData, PlanetData } from '@/types';
import { DIRECTIONS, placeByDirection, type Direction, type DirectionMode, type DirectionPlacement } from '@/lib/directions';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  transitPlanets?: PlanetData[];
};

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'Asc',
};
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGNS_OF: Record<Direction, string> = {
  East: 'Ar · Le · Sg', South: 'Ta · Vi · Cp', West: 'Ge · Li · Aq', North: 'Cn · Sc · Pi',
};
const HOUSES_OF: Record<Direction, string> = {
  East: '1 · 5 · 9', South: '2 · 6 · 10', West: '3 · 7 · 11', North: '4 · 8 · 12',
};
const DIG_BALA_OF: Record<Direction, string> = {
  East: 'Ju Me', South: 'Su Ma', West: 'Sa', North: 'Mo Ve',
};
const SYMBOL: Record<Direction, string> = { North: 'N', East: 'E', South: 'S', West: 'W' };

/**
 * The directional chart: a large cross with the north on top, the east on the
 * right, the south below and the west on the left, and the grahas standing in
 * each direction, by their sign or by their house from the ascendant. A ★ marks
 * a graha standing in the direction where it has Dig Bala.
 */
export default function DirectionChartPanel({ chart, transitPlanets = [] }: Props) {
  const t = useT();
  const [mode, setMode] = useState<DirectionMode>('sign');
  const [showTransit, setShowTransit] = useState(false);

  const placed = useMemo(() => {
    const natal = [
      { name: 'Asc', sign: chart.ascendant.sign },
      ...chart.planets.filter(planet => GRAHAS.includes(planet.name)).map(planet => ({ name: planet.name, sign: planet.sign })),
    ];
    const transit = showTransit
      ? transitPlanets.filter(planet => GRAHAS.includes(planet.name)).map(planet => ({ name: planet.name, sign: planet.sign }))
      : [];
    return placeByDirection(chart.ascendant.sign, natal, transit, mode);
  }, [chart, transitPlanets, showTransit, mode]);

  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  const arm = (direction: Direction, placement: string) => (
    <section
      aria-label={t(direction)}
      className={`min-w-0 rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-900 ${placement}`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">{SYMBOL[direction]} <span className="hidden text-[10px] font-normal text-zinc-400 sm:inline dark:text-zinc-500">{t(direction)}</span></span>
        <span className="text-right text-[9px] font-mono text-zinc-400 dark:text-zinc-500">{mode === 'sign' ? SIGNS_OF[direction] : `H ${HOUSES_OF[direction]}`}</span>
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1">
        {placed[direction].map((item: DirectionPlacement) => (
          <li
            key={`${item.name}-${item.transit ? 't' : 'n'}`}
            title={`${item.name} · ${SIGN_ABBR[item.sign - 1]} · H${item.house}${item.digBala ? ' · Dig Bala' : ''}`}
            className={`rounded border px-1.5 py-0.5 text-[11px] font-mono ${item.transit
              ? 'border-rose-300 text-rose-500 dark:border-rose-800'
              : 'border-zinc-200 font-bold text-zinc-800 dark:border-zinc-700 dark:text-zinc-100'}`}
          >
            {CODES[item.name]}{item.transit ? '↗' : ''}
            <span className="font-normal text-zinc-400 dark:text-zinc-500"> {SIGN_ABBR[item.sign - 1]}{mode === 'house' ? ` H${item.house}` : ''}</span>
            {item.digBala && <span className="text-amber-500"> ★</span>}
          </li>
        ))}
        {placed[direction].length === 0 && <li className="text-[10px] font-mono text-zinc-300 dark:text-zinc-600">–</li>}
      </ul>
      <div className="mt-1.5 text-[9px] font-mono text-zinc-400 dark:text-zinc-500">★ {DIG_BALA_OF[direction]}</div>
    </section>
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Direction chart')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The grahas in the four directions. By sign: fire signs east, earth south, air west, water north. By house: 1st east, 4th north, 7th west, 10th south. ★ is a graha in the direction where it has Dig Bala.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button type="button" aria-pressed={mode === 'sign'} onClick={() => setMode('sign')} className={chip(mode === 'sign')}>{t('by sign')}</button>
        <button type="button" aria-pressed={mode === 'house'} onClick={() => setMode('house')} className={chip(mode === 'house')}>{t('by house')}</button>
        <span className="mx-1 self-stretch border-l border-zinc-200 dark:border-zinc-700" />
        <button type="button" aria-pressed={showTransit} disabled={transitPlanets.length === 0} onClick={() => setShowTransit(v => !v)} className={`${chip(showTransit)} disabled:opacity-40`}>
          {t('Transit')}
        </button>
      </div>

      {/* The cross: arms on a 3 × 3 grid, the corners left empty. */}
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_1fr_1fr] gap-2" role="group" aria-label={t('Direction chart')}>
        {arm('North', 'col-start-2 row-start-1')}
        {arm('West', 'col-start-1 row-start-2')}
        <div className="col-start-2 row-start-2 flex min-w-0 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 p-2 text-center dark:border-zinc-600">
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{t('Ascendant')}</span>
          <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-200">{SIGN_ABBR[chart.ascendant.sign - 1]}</span>
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">{mode === 'sign' ? t(DIRECTIONS.find(d => placed[d].some(p => p.name === 'Asc' && !p.transit)) ?? 'East') : t('East')}</span>
        </div>
        {arm('East', 'col-start-3 row-start-2')}
        {arm('South', 'col-start-2 row-start-3')}
      </div>
    </div>
  );
}
