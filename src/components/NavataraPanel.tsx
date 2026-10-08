'use client';

import { useMemo, useState } from 'react';
import type { ChartData, PlanetData } from '@/types';
import { TARAS, buildNavatara, type TaraQuality } from '@/lib/navatara';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  transitPlanets?: PlanetData[];
  nakshatraAdjust?: number;
};

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'Asc',
};

const QUALITY_STYLE: Record<TaraQuality, string> = {
  good: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20',
  mixed: 'border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20',
  bad: 'border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20',
};
const QUALITY_LABEL: Record<TaraQuality, string> = { good: 'favourable', mixed: 'mixed', bad: 'unfavourable' };

/**
 * The Nava-Tara chakra: the 27 nakṣatras in nine Taras counted from the Janma
 * nakṣatra (the Moon's, or the ascendant's), with the natal grahas and, when
 * switched on, the transiting grahas standing in them.
 */
export default function NavataraPanel({ chart, transitPlanets = [], nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const [from, setFrom] = useState<'Moon' | 'Asc'>('Moon');
  const [showTransit, setShowTransit] = useState(false);

  const moon = chart.planets.find(planet => planet.name === 'Moon');
  const referenceLongitude = from === 'Moon' ? moon?.longitude ?? 0 : chart.ascendant.longitude;

  const { reference, groups } = useMemo(() => {
    const natal = [
      ...chart.planets.filter(planet => GRAHAS.includes(planet.name)).map(planet => ({ name: planet.name, longitude: planet.longitude })),
      { name: 'Asc', longitude: chart.ascendant.longitude },
    ];
    const transit = showTransit
      ? transitPlanets.filter(planet => GRAHAS.includes(planet.name)).map(planet => ({ name: planet.name, longitude: planet.longitude }))
      : [];
    return buildNavatara(referenceLongitude, natal, transit, nakshatraAdjust);
  }, [chart, transitPlanets, showTransit, referenceLongitude, nakshatraAdjust]);

  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Nava-Tara chakra')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The 27 nakshatras in nine Taras, counted from the Janma nakshatra: the 1st, 10th and 19th are Janma tara, the 2nd, 11th and 20th Sampat, and so on.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('count from')}</span>
        <button type="button" aria-pressed={from === 'Moon'} onClick={() => setFrom('Moon')} className={chip(from === 'Moon')}>{t('Moon')}</button>
        <button type="button" aria-pressed={from === 'Asc'} onClick={() => setFrom('Asc')} className={chip(from === 'Asc')}>{t('Ascendant')}</button>
        <span className="mx-1 self-stretch border-l border-zinc-200 dark:border-zinc-700" />
        <button type="button" aria-pressed={showTransit} disabled={transitPlanets.length === 0} onClick={() => setShowTransit(v => !v)} className={`${chip(showTransit)} disabled:opacity-40`}>
          {t('Transit')}
        </button>
      </div>

      <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
        {t('Janma nakshatra')}: <span className="font-bold">{groups[0].nakshatras[0].name}</span>
        <span className="text-zinc-400 dark:text-zinc-500"> ({from === 'Moon' ? t('Moon') : t('Ascendant')})</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3" data-reference={reference}>
        {groups.map(group => (
          <section key={group.tara.number} aria-label={group.tara.name} className={`min-w-0 rounded-lg border p-2 ${QUALITY_STYLE[group.tara.quality]}`}>
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-200">{group.tara.number}. {group.tara.name}</span>
              <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">{t(group.tara.meaning)} · {t(QUALITY_LABEL[group.tara.quality])}</span>
            </div>
            <ul className="space-y-0.5">
              {group.nakshatras.map(nak => (
                <li key={nak.index} className="flex flex-wrap items-baseline gap-x-2 text-[11px] font-mono text-zinc-700 dark:text-zinc-200">
                  <span className="w-5 shrink-0 text-right text-[9px] text-zinc-400 dark:text-zinc-500">{nak.count}</span>
                  <span className="min-w-0 break-words">{nak.name}</span>
                  <span className="flex flex-wrap gap-x-1">
                    {nak.natal.map(name => <span key={`n-${name}`} className="font-bold text-zinc-900 dark:text-zinc-50">{CODES[name]}</span>)}
                    {nak.transit.map(name => <span key={`t-${name}`} className="font-bold text-rose-500">{CODES[name]}↗</span>)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {TARAS.length} Taras · <span className="font-bold text-zinc-600 dark:text-zinc-300">Su</span> {t('natal')} · <span className="font-bold text-rose-500">Su↗</span> {t('transit')}
      </div>
    </div>
  );
}
