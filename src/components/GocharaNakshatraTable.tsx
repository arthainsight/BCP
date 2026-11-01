'use client';

import { useMemo } from 'react';
import type { ChartData, PlanetData } from '@/types';
import { buildGochara } from '@/lib/gochara';
import { phaladipikaTransit, type Modifier, type TransitBody, type TransitGraha, type VedhaHit } from '@/lib/phaladipikaGochara';
import { TARAS } from '@/lib/navatara';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

const VEDHA_EFFECT: Record<VedhaHit['effect'], string> = {
  death: 'death or the like', 'life-danger': 'danger to life', fear: 'fear and worry', 'wealth-loss': 'loss of wealth', 'work-loss': 'loss in the work', unstated: 'not stated',
};
const MODIFIER_TEXT: Record<Modifier, string> = {
  'aspected-by-opposite': 'result void: aspected by the opposite kind',
  'aspected-by-enemy': 'result void: aspected by its enemy',
  'harmless-in-strength': 'harmless: in its own or exaltation sign',
  'full-in-strength': 'full result: in its own or exaltation sign',
  'spoilt-good': 'good result lost: debilitated, in an enemy sign or combust',
  'worse-bad': 'worse: debilitated, in an enemy sign or combust',
};

/**
 * The transit rules of the Phaladīpikā, chapter 26 (verses 25–47), beside the Gochara: where in the sign the graha gives its result, the count of its nakṣatra from the birth nakṣatra
 * with the limb and result of the verses, the lattā, the vedha on the special nakṣatras of the birth, the places the text calls dangerous, and what cancels a result.
 */
export default function GocharaNakshatraTable({ chart, transitPlanets = [] }: { chart: ChartData; transitPlanets?: PlanetData[] }) {
  const t = useT();
  const { name: grahaName } = useGrahaNames();
  const result = useMemo(() => {
    const natalMoon = chart.planets.find(planet => planet.name === 'Moon');
    const gochara = buildGochara(chart, transitPlanets);
    if (!natalMoon || !gochara) return null;
    const good: Partial<Record<TransitGraha, boolean | null>> = {};
    for (const row of gochara.rows) good[row.planet] = row.favourable;
    const bodies: TransitBody[] = transitPlanets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree, longitude: planet.longitude, isRetrograde: planet.isRetrograde }));
    return phaladipikaTransit(natalMoon.longitude, bodies, good);
  }, [chart, transitPlanets]);
  if (!result || result.rows.length === 0) return null;
  const cell = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 align-top';
  const taraOf = (count: number) => TARAS[(count - 1) % 9];

  return (
    <div className="min-w-0 space-y-2" data-gochara="phaladipika">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Phaladīpikā 26: the transits by the nakṣatras')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The birth nakṣatra is {nakshatra}. Counts are from it, 1–27. Not applied: the days of the saṅkrānti, the eclipse and the planetary war (26.29) and the Sarvatobhadra vedha (26.48).').replace('{nakshatra}', result.birthNakshatra)}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse font-mono text-[11px]" data-gochara="phaladipika-table">
          <thead>
            <tr className="bg-zinc-100 text-left text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <th className={cell}>{t('Graha')}</th>
              <th className={cell}>{t('Gives its result')}</th>
              <th className={cell}>{t('Count · limb')}</th>
              <th className={cell}>{t('Lattā')}</th>
              <th className={cell}>{t('Vedha')}</th>
              <th className={cell}>{t('Notes')}</th>
            </tr>
          </thead>
          <tbody className="text-zinc-700 dark:text-zinc-200">
            {result.rows.map(row => (
              <tr key={row.graha} data-graha={row.graha}>
                <th scope="row" className={`${cell} text-left font-semibold`}>{grahaName(row.graha)}</th>
                <td className={`${cell} ${row.prapta ? (row.prapta.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400') : 'text-zinc-400'}`}>
                  {row.prapta ? `${row.prapta.active ? '✓' : '·'} ${t(row.prapta.portion === 'first' ? 'first 10°' : row.prapta.portion === 'middle' ? 'middle 10°' : row.prapta.portion === 'last' ? 'last 10°' : 'the whole sign')}` : '—'}
                </td>
                <td className={cell}>
                  <span className="font-semibold">{row.count}</span> · {t(taraOf(row.count).name)}{row.special ? ` · ${t(row.special)}` : ''}
                  {row.anga && <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t(row.anga.limb)}: {t(row.anga.result)}</div>}
                </td>
                <td className={`${cell} ${row.latta?.onBirth ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                  {row.latta ? `${row.latta.nakshatra}${row.latta.onBirth ? ` ✗ ${t('on the birth nakṣatra')}${row.lattaOnBirth > 1 ? ` ×${row.lattaOnBirth}` : ''}` : ''}` : '—'}
                  {row.latta?.onBirth && row.latta.result && <div className="text-[10px]">{t(row.latta.result)}</div>}
                </td>
                <td className={`${cell} ${row.vedha.length ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                  {row.vedha.length === 0 ? '—' : row.vedha.map(hit => <div key={hit.special}>{t(hit.special)} ({hit.nakshatra}): {t(VEDHA_EFFECT[hit.effect])}</div>)}
                </td>
                <td className={`${cell} text-[10px]`}>
                  {row.trikaDanger && <div className="text-rose-600 dark:text-rose-400">{t('in the birth sign, the 8th or the 12th: danger to life, standing and wealth (26.33)')}</div>}
                  {row.placeDanger && <div className="text-rose-600 dark:text-rose-400">{t('in the house the text names as the worst for it (26.34)')}</div>}
                  {row.modifiers.map(modifier => <div key={modifier}>{t(MODIFIER_TEXT[modifier])}</div>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
