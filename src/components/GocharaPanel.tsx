'use client';

import { useMemo } from 'react';
import type { ChartData, PlanetData } from '@/types';
import { buildGochara, type BavStrength } from '@/lib/gochara';
import type { AshtakavargaPlanet } from '@/lib/ashtakavarga';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  chart: ChartData;
  /** The transiting grahas at the target moment. */
  transitPlanets?: PlanetData[];
};

const SIGNS = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const BAV_PLANETS: AshtakavargaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const STRENGTH_CLASS: Record<BavStrength, string> = {
  strong: 'text-emerald-600 dark:text-emerald-400',
  average: 'text-zinc-700 dark:text-zinc-200',
  weak: 'text-rose-600 dark:text-rose-400',
};

/**
 * Gochara with the Aṣṭakavarga: where each transiting graha stands from the
 * natal Lagna and Moon, whether that is a favourable house from the Moon, and
 * the bindus its own Bhinnāṣṭakavarga and the Sarvāṣṭakavarga give the sign. The
 * grid below shows every graha's bindus in all twelve signs, with the signs the
 * transits are in marked.
 */
export default function GocharaPanel({ chart, transitPlanets = [] }: Props) {
  const t = useT();
  const { code, name: grahaName } = useGrahaNames();
  const gochara = useMemo(() => buildGochara(chart, transitPlanets), [chart, transitPlanets]);

  if (!gochara || gochara.rows.length === 0) {
    return <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{t('Calculate a chart and set a target date to see the Gochara.')}</p>;
  }

  const transitSign = Object.fromEntries(gochara.rows.map(row => [row.planet, row.sign]));
  const savMarks = (sign: number) => gochara.rows.filter(row => row.sign === sign).map(row => code(row.planet)).join(' ');
  const cell = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 tabular-nums';

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Gochara and Ashtakavarga')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The transiting grahas at the target moment against the natal chart: the house from the Lagna and from the Moon, whether the house from the Moon is a favourable one for the graha, and the bindus that the own Bhinnashtakavarga of the graha and the Sarvashtakavarga give the sign. 5 or more bindus are strong, 4 average, 3 or fewer weak; the average Sarva is 28.')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-mono text-xs" data-gochara="transits">
          <thead>
            <tr className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <th className={`${cell} text-left`}>{t('Graha')}</th>
              <th className={cell}>{t('Sign')}</th>
              <th className={cell}>{t('House from Lagna')}</th>
              <th className={cell}>{t('House from Moon')}</th>
              <th className={cell}>{t('From Moon')}</th>
              <th className={cell}>{t('Own bindus')}</th>
              <th className={cell}>{t('Sarva')}</th>
            </tr>
          </thead>
          <tbody>
            {gochara.rows.map(row => (
              <tr key={row.planet} data-graha={row.planet} className="text-zinc-700 dark:text-zinc-200">
                <th scope="row" className={`${cell} text-left font-semibold`}>{grahaName(row.planet)}</th>
                <td className={cell}>{SIGN_NAMES[row.sign - 1]}</td>
                <td className={cell}>{row.houseFromLagna}</td>
                <td className={cell}>{row.houseFromMoon}</td>
                <td className={`${cell} ${row.favourable === null ? 'text-zinc-400' : row.favourable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {row.favourable === null ? '—' : row.favourable ? `✓ ${t('favourable')}` : `✗ ${t('unfavourable')}`}
                </td>
                <td className={`${cell} font-bold ${row.strength ? STRENGTH_CLASS[row.strength] : 'text-zinc-400'}`}>
                  {row.bindus === null ? '—' : `${row.bindus} · ${t(row.strength!)}`}
                </td>
                <td className={`${cell} ${row.sav >= 28 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{row.sav}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto">
        <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Bindus by sign')}</div>
        <table className="w-full min-w-[680px] border-collapse text-center font-mono text-xs" data-gochara="grid">
          <thead>
            <tr className="text-zinc-500 dark:text-zinc-400">
              <th className={`${cell} text-left`}>{t('Graha')}</th>
              {SIGNS.map(sign => <th key={sign} className={`${cell} font-semibold`}>{sign}</th>)}
            </tr>
          </thead>
          <tbody>
            {BAV_PLANETS.map(planet => (
              <tr key={planet}>
                <th scope="row" className={`${cell} text-left font-semibold`} title={grahaName(planet)}>{code(planet)}</th>
                {gochara.bavBySign[planet].map((bindus, index) => {
                  const here = transitSign[planet] === index + 1;
                  return (
                    <td
                      key={index}
                      data-here={here || undefined}
                      className={`${cell} font-semibold ${STRENGTH_CLASS[bindus >= 5 ? 'strong' : bindus === 4 ? 'average' : 'weak']} ${here ? 'bg-cyan-50 ring-2 ring-inset ring-cyan-400 dark:bg-cyan-900/30 dark:ring-cyan-600' : ''}`}
                    >
                      {bindus}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row" className={`${cell} text-left font-bold`}>SAV</th>
              {gochara.savBySign.map((bindus, index) => (
                <td key={index} className={`${cell} font-bold ${bindus >= 28 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{bindus}</td>
              ))}
            </tr>
            <tr>
              <th scope="row" className={`${cell} text-left`}>{t('transit')}</th>
              {SIGNS.map((_, index) => <td key={index} className={`${cell} text-[10px] text-cyan-700 dark:text-cyan-300`}>{savMarks(index + 1)}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
