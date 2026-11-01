'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { upagrahaPoints } from '@/lib/chartPoints';
import { UPAGRAHA_CLOSE, upagrahaReadings } from '@/lib/upagrahaResults';
import { SIGN_NAMES } from '@/lib/signs';
import { fill, useLanguage, useT } from '@/lib/i18n';
import { ordinal } from '@/lib/ordinal';
import { useChartPoints } from '@/hooks/useChartPoints';

/**
 * The results of Dhūma, Pāta, Paridhi, Cāpa, Ketu, Gulika and Prāṇapada in the houses (BPHS 25.2–85), each with the verse as the text has it. The points are the ones of the Special sphutas view; Gulika is taken at the
 * moment of Saturn's part chosen in the settings.
 */
export default function UpagrahaResultsPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const language = useLanguage();
  const { gulikaAt, maandiAt } = useChartPoints();
  const readings = useMemo(() => {
    const points: { pointKey: string; longitude: number }[] = upagrahaPoints(chart, gulikaAt, maandiAt).map(point => ({ pointKey: point.key, longitude: point.longitude }));
    const prana = chart.specialSphutas?.find(item => item.key === 'PP');
    if (prana) points.push({ pointKey: 'PP', longitude: prana.longitude });
    return upagrahaReadings(points, chart.ascendant.sign);
  }, [chart, gulikaAt, maandiAt]);

  return (
    <div className="min-w-0 space-y-3" data-upagraha="panel">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Upagrahas in the houses (BPHS 25)')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The results of the seven non-luminous bodies, Dhūma, Pāta, Paridhi, Cāpa, Ketu, Gulika and Prāṇapada, in the house they stand in from the Lagna: the verse of the text with a short summary. The text says the results are to be told by the position, the aspects on the body and its strength; that is not worked out here. Māndi has no verses.')}
        </p>
      </div>
      {readings.length === 0 && <p className="text-xs font-mono text-zinc-400">{t('The points are not calculated for this chart.')}</p>}
      <div className="space-y-2">
        {readings.map(reading => (
          <div key={reading.body} className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700" data-upagraha-body={reading.body} data-upagraha-house={reading.house}>
            <div className="font-semibold text-zinc-700 dark:text-zinc-200">
              {fill(t('{body} in the {house} house ({sign})'), { body: reading.name, house: ordinal(reading.house, language), sign: SIGN_NAMES[reading.sign - 1] })}
            </div>
            <p className="mt-1 text-zinc-700 dark:text-zinc-200">{reading.verse.gloss}</p>
            <details className="mt-1 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700">
              <summary className="cursor-pointer text-[10px] text-zinc-500 dark:text-zinc-400">{t('the verse')} · BPHS 25.{reading.verse.verse}</summary>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <div lang="sa">{reading.verse.sanskrit[0]}</div>
                <div lang="sa">{reading.verse.sanskrit[1]}</div>
                <div className="italic text-zinc-500 dark:text-zinc-400">{reading.verse.iast[0]}</div>
                <div className="italic text-zinc-500 dark:text-zinc-400">{reading.verse.iast[1]}</div>
              </div>
            </details>
          </div>
        ))}
      </div>
      <details className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700">
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('The close of the chapter (25.86–87)')}</summary>
        <div className="mt-2 space-y-2">
          {UPAGRAHA_CLOSE.map(verse => (
            <div key={verse.verse}>
              <div className="text-zinc-700 dark:text-zinc-200">25.{verse.verse}: {verse.gloss}</div>
              <div lang="sa" className="text-[11px]">{verse.sanskrit[0]} {verse.sanskrit[1]}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
