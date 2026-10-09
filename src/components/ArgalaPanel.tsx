'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { argalaOnGrahas, argalaOnHouses, ARGALA_HOUSES, type ArgalaCell } from '@/lib/argala';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ordinal = (n: number) => `${n}${n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

const STATUS_CLASS = {
  effective: 'font-bold text-emerald-700 dark:text-green-400',
  obstructed: 'text-zinc-400 line-through decoration-rose-400 dark:text-zinc-500',
  none: 'text-zinc-300 dark:text-zinc-700',
} as const;

/**
 * Argala and Virodhargala (Jaimini): for each house from the Lagna, or for each
 * graha, the grahas in the 2nd, 4th and 11th (and the 5th, secondary) from it
 * that intervene, and the grahas in the 12th, 10th, 3rd and 9th that oppose
 * them. An argala stands when its grahas outnumber the opposing ones.
 */
export default function ArgalaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const { code, name: grahaName } = useGrahaNames();
  const [view, setView] = useState<'houses' | 'grahas'>('houses');

  const rows = useMemo(() => {
    const grahas = chart.planets.filter(planet => GRAHAS.includes(planet.name)).map(planet => ({ name: planet.name, sign: planet.sign }));
    return view === 'houses' ? argalaOnHouses(chart.ascendant.sign, grahas) : argalaOnGrahas(grahas);
  }, [chart, view]);

  const pill = (on: boolean) =>
    `rounded-md px-2.5 py-1 text-[10px] font-mono ${on ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`;
  const cellBorder = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5';

  const cell = (item: ArgalaCell) => (
    <td key={item.house} data-argala={item.status} className={`${cellBorder} align-top`}>
      {item.planets.length === 0 ? (
        <span className={STATUS_CLASS.none}>·</span>
      ) : (
        <>
          <div className={STATUS_CLASS[item.status]} title={item.status === 'effective' ? t('argala stands') : t('obstructed')}>
            {item.planets.map(code).join(' ')}
          </div>
          {item.virodhaPlanets.length > 0 && (
            <div className="text-[10px] text-rose-500 dark:text-rose-400" title={t('virodhargala')}>⊣ {item.virodhaPlanets.map(code).join(' ')}</div>
          )}
        </>
      )}
    </td>
  );

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Argala and Virodhargala')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The grahas in the 2nd, 4th and 11th (and the 5th, secondary) from a house or graha intervene by argala; the grahas in the 12th, 10th, 3rd and 9th oppose them by virodhargala. Bold green: the argala stands, because its grahas outnumber the opposing ones. Struck out: it is obstructed, the opposing grahas (marked ⊣) being as many or more.')}
        </p>
      </div>

      <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50" role="group" aria-label="argala view">
        <button type="button" onClick={() => setView('houses')} className={pill(view === 'houses')}>{t('Houses')}</button>
        <button type="button" onClick={() => setView('grahas')} className={pill(view === 'grahas')}>{t('Grahas')}</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-center font-mono text-xs" data-argala-view={view}>
          <thead>
            <tr className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <th className={`${cellBorder} text-left`}>{view === 'houses' ? t('House') : t('Graha')}</th>
              {ARGALA_HOUSES.map(item => (
                <th key={item.house} className={cellBorder}>
                  {ordinal(item.house)} <span className="text-rose-400">⊣ {ordinal(item.virodha)}</span>
                  {item.kind === 'secondary' && <div className="text-[9px] font-normal">{t('secondary')}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} data-argala-row={row.label} className="text-zinc-700 dark:text-zinc-200">
                <th scope="row" className={`${cellBorder} text-left font-semibold`}>
                  {view === 'houses' ? `H${row.label}` : grahaName(row.label)}
                  <span className="ml-1.5 text-[10px] font-normal text-zinc-400 dark:text-zinc-500">{SIGN_NAMES[row.sign - 1]}</span>
                </th>
                {row.cells.map(cell)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
