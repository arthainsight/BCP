'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { HOUSE_MATTERS, DIPTAMSHA, readPrashna, type PrashnaBody, type TajikaGraha } from '@/lib/tajikaPrashna';
import { SIGN_NAMES } from '@/lib/signs';
import { fill, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Praśna after the Tājika Nīlakaṇṭhī: the chart is the chart of the moment and place of the question (calculate it for that moment); the lord of the Lagna stands for the one who asks, the lord of the house of the matter
 * for the matter, and the Tājika yogas between them (Ithasāla, Īśarāpha, Nakta, Kambūla) tell whether it comes about.
 */
export default function PrashnaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const { name: grahaName } = useGrahaNames();
  const [house, setHouse] = useState(7);
  const reading = useMemo(() => {
    const bodies: PrashnaBody[] = chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree, speed: planet.speed }));
    return readPrashna(chart.ascendant.sign, bodies, house);
  }, [chart, house]);
  const bodyOf = (name: string) => chart.planets.find(planet => planet.name === name);
  const cell = 'border border-zinc-200 dark:border-zinc-700 px-2 py-1.5';
  const aspect = (name: string) => t(name);

  return (
    <div className="min-w-0 space-y-3" data-prashna="panel">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Praśna — the Tājika yogas of a question')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('After the Tājika Nīlakaṇṭhī (Saṃjñātantra, the sixteen yogas, and the Praśnatantra). Calculate the chart for the moment and the place of the question. The lord of the Lagna stands for the one who asks, the lord of the house of the matter for the matter; whether they come together is the question. Built: Ithasāla, Īśarāpha, Nakta and Kambūla. Not built: the Yamayā and Maṇaū (their conditions cannot be read in the print with certainty) and the other eleven yogas. The Praśna Mārga is not used (its print is too poor to read).')}
        </p>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
        {t('The matter of the house')}
        <select value={house} onChange={event => setHouse(Number(event.target.value))} className="rounded border border-zinc-300 bg-white px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-900" aria-label={t('house of the question')}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map(number => <option key={number} value={number}>{number} · {t(HOUSE_MATTERS[number])}</option>)}
        </select>
      </label>
      {!reading && <p className="text-xs font-mono text-zinc-400">{t('The seven grahas are needed for the reading.')}</p>}
      {reading && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left font-mono text-[11px]" data-prashna="lords">
              <thead>
                <tr className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <th className={cell}>{t('Stands for')}</th><th className={cell}>{t('Graha')}</th><th className={cell}>{t('Sign')}</th><th className={cell}>{t('Degrees')}</th><th className={cell}>{t('Dīptāṁśa')}</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-200">
                {[{ role: 'the one who asks (lord of the Lagna)', name: reading.lagnesha }, { role: 'the matter (lord of the house)', name: reading.karyesha }].map(row => {
                  const planet = bodyOf(row.name);
                  return (
                    <tr key={row.role}>
                      <td className={cell}>{t(row.role)}</td>
                      <td className={`${cell} font-semibold`}>{grahaName(row.name)}</td>
                      <td className={cell}>{planet ? SIGN_NAMES[planet.sign - 1] : '—'}</td>
                      <td className={`${cell} tabular-nums`}>{planet ? round(planet.degree) : '—'}</td>
                      <td className={`${cell} tabular-nums`}>{DIPTAMSHA[row.name as TajikaGraha]}°</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="space-y-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-200" data-prashna="verdict">
            {reading.sameLord && <p>{t('The matter is the first house: the lord of the Lagna stands for the one who asks and for the matter both, so there is no pair to read.')}</p>}
            {reading.pair?.kind === 'ithasala' && (
              <p className="text-emerald-700 dark:text-emerald-400">
                {fill(t('Ithasāla: {fast} is behind {slow} by {gap}° within its dīptāṁśa of {orb}°, and their signs aspect each other ({aspect}): the matter is brought about, in about {days} days by the rule of the text (12 for each degree).'), { fast: grahaName(reading.pair.fast), slow: grahaName(reading.pair.slow), gap: round(Math.max(0, reading.pair.gap)), orb: reading.pair.orb, aspect: aspect(reading.pair.aspect), days: reading.days ?? 0 })}
              </p>
            )}
            {reading.pair?.kind === 'isarapha' && (
              <p className="text-rose-600 dark:text-rose-400">
                {fill(t('Īśarāpha: {fast} has passed {slow} by {gap}°: what was to be done turns away.'), { fast: grahaName(reading.pair.fast), slow: grahaName(reading.pair.slow), gap: round(-reading.pair.gap) })}
              </p>
            )}
            {reading.nakta.map(item => (
              <p key={item.carrier} className="text-amber-700 dark:text-amber-400">
                {fill(t('Nakta: {carrier} is swifter than both, {from}° ahead of {behind} and {to}° behind {ahead}, and aspects both: it takes the light of {behind} and gives it to {ahead}, so the matter comes through another.'), { carrier: grahaName(item.carrier), from: round(item.fromBehind), to: round(item.toAhead), behind: grahaName(item.behind), ahead: grahaName(item.ahead) })}
              </p>
            ))}
            {reading.kambula && (
              <p className="text-emerald-700 dark:text-emerald-400">
                {fill(t('Kambūla: the Moon is in Ithasāla with {with}, and the matter comes about; the Moon is of the {grade} grade.'), {
                  with: [reading.kambula.withLagnesha ? grahaName(reading.lagnesha) : '', reading.kambula.withKaryesha ? grahaName(reading.karyesha) : ''].filter(Boolean).join(` ${t('and')} `),
                  grade: t(reading.kambula.grade),
                })}
              </p>
            )}
            {!reading.sameLord && !reading.pair && reading.nakta.length === 0 && (
              <p>{t('No Ithasāla, Īśarāpha or Nakta between the two lords. The text then looks at the other yogas, which are not built.')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
