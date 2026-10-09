'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { buildChalit, type ChalitSystem } from '@/lib/bhavaChalit';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import NorthIndianChart from './NorthIndianChart';

const SIGNS = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/** A longitude as "Cn 10°05′". */
function point(longitude: number): string {
  const inSign = longitude % 30;
  const degrees = Math.floor(inSign);
  const minutes = Math.floor((inSign - degrees) * 60);
  return `${SIGNS[Math.floor(longitude / 30)]} ${degrees}°${String(minutes).padStart(2, '0')}′`;
}

/**
 * The Bhāva Chalit chart: the grahas placed by the bhāva they stand in, with
 * the bhāvas listed (middle point and the sandhis that border them) and the
 * grahas that change house against the rāśi chart picked out.
 */
export default function BhavaChalitPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const { code, name: grahaName } = useGrahaNames();
  const [system, setSystem] = useState<ChalitSystem>('sripati');

  const chalit = useMemo(() => buildChalit(chart, system), [chart, system]);

  const chartPlanets = useMemo(() => {
    if (!chalit) return [];
    return chart.planets.map(planet => ({ ...planet, house: chalit.planets.find(item => item.name === planet.name)?.bhavaHouse ?? planet.house }));
  }, [chart.planets, chalit]);

  const moved = chalit?.planets.filter(item => GRAHAS.includes(item.name) && item.moved) ?? [];
  const cell = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5';

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Bhava Chalit')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The grahas placed by the bhava they stand in. Each bhava runs from the sandhi halfway to the middle of the one before to the sandhi halfway to the middle of the next. The signs drawn are those of the rasi houses.')}
        </p>
      </div>

      <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        {t('bhava system')}
        <select
          value={system}
          onChange={event => setSystem(event.target.value as ChalitSystem)}
          className="mt-1 block w-full max-w-xs rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
        >
          <option value="sripati">{t('Sripati (Porphyry cusps)')}</option>
          <option value="equal">{t('Equal (the Lagna in the middle of the 1st)')}</option>
        </select>
      </label>

      {!chalit ? (
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{t('This chart has no Midheaven; calculate it again.')}</p>
      ) : (
        <>
          <div className="mx-auto w-full max-w-[420px]" data-chalit="chart">
            <NorthIndianChart
              activeYearHouse={0}
              activeMonthHouse={0}
              ascendantSign={chart.ascendant.sign}
              ascendantDegree={chart.ascendant.degree}
              planets={chartPlanets}
              showSigns
              showBcpHighlights={false}
              degreePrecision="degree"
              colorByDignity
            />
          </div>

          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300" data-chalit="moved">
            {moved.length === 0
              ? t('No graha changes house against the rasi chart.')
              : moved.map(item => `${grahaName(item.name)}: ${t('rasi house')} ${item.rasiHouse} → ${t('bhava')} ${item.bhavaHouse}`).join(' · ')}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-center font-mono text-xs" data-chalit="table">
              <thead>
                <tr className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <th className={cell}>{t('Bhava')}</th>
                  <th className={cell}>{t('Rasi sign')}</th>
                  <th className={cell}>{t('Madhya')}</th>
                  <th className={cell}>{t('Sandhi from')}</th>
                  <th className={cell}>{t('to')}</th>
                  <th className={`${cell} text-left`}>{t('Grahas')}</th>
                </tr>
              </thead>
              <tbody>
                {chalit.bhavas.map(bhava => (
                  <tr key={bhava.house} data-bhava={bhava.house} className="text-zinc-700 dark:text-zinc-200">
                    <th scope="row" className={`${cell} font-semibold`}>{bhava.house}</th>
                    <td className={cell}>{SIGNS[(chart.ascendant.sign + bhava.house - 2) % 12]}</td>
                    <td className={cell}>{point(bhava.madhya)}</td>
                    <td className={cell}>{point(bhava.start)}</td>
                    <td className={cell}>{point(bhava.end)}</td>
                    <td className={`${cell} text-left`}>
                      {chalit.planets
                        .filter(item => GRAHAS.includes(item.name) && item.bhavaHouse === bhava.house)
                        .map(item => (
                          <span key={item.name} className={`mr-2 ${item.moved ? 'font-bold text-violet-600 dark:text-violet-400' : ''}`} title={item.moved ? `${t('rasi house')} ${item.rasiHouse}` : undefined}>
                            {code(item.name)}{item.moved ? '*' : ''}
                          </span>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('* The graha stands in another house than at the rasi.')}</p>
        </>
      )}
    </div>
  );
}
