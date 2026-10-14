'use client';

import { ChartData } from '@/types';
import { buildDrishti, calculateGrahaDrishti, calculateRashiDrishti } from '@/lib/drishti';
import CollapsibleCard from './CollapsibleCard';
import { useGrahaNames } from '@/lib/grahaNames';
import { SIGN_ABBR } from '@/lib/signs';
import { useT } from '@/lib/i18n';

/** The aspects of the chart: graha dṛṣṭi (Parāśari), rāśi dṛṣṭi (Jaimini) and the house summary. */
export default function DrishtiPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const { code } = useGrahaNames();
  const grahaAspects = calculateGrahaDrishti(chart.planets);
  const rashiAspects = calculateRashiDrishti(chart.planets, chart.ascendant.sign);
  const summary = buildDrishti(chart);

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; dṛṣṭi.aspects</div>

      <CollapsibleCard title="Graha Dṛṣṭi (Parashari)" defaultOpen>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Graha</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('From')}</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('Aspects')}</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('Planets there')}</th>
              </tr>
            </thead>
            <tbody>
              {grahaAspects.map((a, i) => (
                <tr key={`${a.planet}-${a.fromHouse}-${a.toHouse}-${i}`} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-1.5 font-bold text-emerald-700 dark:text-green-400">{code(a.planet)}</td>
                  <td className="p-1.5 text-zinc-600 dark:text-zinc-300">H{a.fromHouse}</td>
                  <td className="p-1.5 text-zinc-700 dark:text-zinc-200 font-semibold">H{a.toHouse}</td>
                  <td className="p-1.5 text-cyan-700 dark:text-cyan-300">
                    {a.aspectedPlanets.length ? a.aspectedPlanets.map(code).join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('All planets: 7th · Mars: +4th +8th · Jupiter: +5th +9th · Saturn: +3rd +10th')}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title="Rāśi Dṛṣṭi (Jaimini)" defaultOpen>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('From sign')}</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('Occupants')}</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('Aspects')}</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('Planets there')}</th>
              </tr>
            </thead>
            <tbody>
              {rashiAspects.map((a, i) => (
                <tr key={`${a.fromSign}-${a.toSign}-${i}`} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-1.5 text-violet-700 dark:text-violet-300 font-semibold">{SIGN_ABBR[a.fromSign - 1]}</td>
                  <td className="p-1.5 text-zinc-600 dark:text-zinc-300">
                    {a.fromPlanets.length ? a.fromPlanets.map(code).join(', ') : '—'}
                  </td>
                  <td className="p-1.5 text-violet-700 dark:text-violet-300 font-semibold">{SIGN_ABBR[a.toSign - 1]}</td>
                  <td className="p-1.5 text-cyan-700 dark:text-cyan-300">
                    {a.toPlanets.length ? a.toPlanets.map(code).join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Movable→Fixed · Fixed→Movable (non-adjacent) · Dual→all Dual')}
        </div>
      </CollapsibleCard>

      <CollapsibleCard title={t('Dṛṣṭi house summary')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('House')}</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Graha</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Rāśi</th>
                <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">{t('Total')}</th>
              </tr>
            </thead>
            <tbody>
              {summary.houses.map((row) => (
                <tr key={row.house} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="p-1.5 font-semibold">H{row.house}</td>
                  <td className="p-1.5">{row.graha.length ? row.graha.join(', ') : '—'}</td>
                  <td className="p-1.5">{row.rashi.length ? row.rashi.join(', ') : '—'}</td>
                  <td className="p-1.5 font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>
    </div>
  );
}
