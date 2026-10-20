'use client';

import { useMemo } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseEventDate } from '@/lib/dashaEventStore';
import { EXACT_ORB, progressedRelationsOf, progressionsAt } from '@/lib/bnn/eventProgressions';
import type { ParayaBody } from '@/lib/bnn/nadiParaya';
import { SIGN_NAMES } from '@/lib/signs';
import { formatDegree } from '@/lib/formatDegree';
import { fill, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  /** The day of the event, YYYY-MM-DD. */
  date: string;
  chart?: ChartData;
  birthDatetime: string;
  calculationSettings?: CalculationSettings;
  /** The progressing grahas to show: those chosen for the chart. */
  bodies: readonly ParayaBody[];
};

const CAPTION = 'text-[10px] font-mono uppercase tracking-widest text-zinc-400';

/**
 * The progressions (Paraya) of an event's day: where each progressing graha stood, in which house, and which natal points it aspected by sign
 * (1 is the point's own sign, 5, 7 and 9 the signs counted from it), the ones within a degree of the natal degree marked. Worked out from the age.
 */
export default function EventProgressions({ date, chart, birthDatetime, calculationSettings, bodies }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const saturn = calculationSettings?.parayaSaturn ?? 'alternating';
  const rahu = calculationSettings?.parayaRahu ?? 'alternating';
  const retro = calculationSettings?.parayaRetro ?? 'previous';
  const rows = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    const day = parseEventDate(date);
    if (!chart || !birth || !day) return null;
    return progressionsAt({ chart, birthTime: birth.getTime(), time: day.getTime(), options: { saturn, rahu, retro }, bodies });
  }, [chart, birthDatetime, date, saturn, rahu, retro, bodies]);
  const relationships = useMemo(() => rows ? progressedRelationsOf(rows) : [], [rows]);

  if (!chart) return null;
  return (
    <section aria-label={t('event progressions')} className="space-y-1" data-event-progressions={date}>
      <div className={CAPTION}>{t('Progressions (Paraya)')}</div>
      {rows === null && <p className="text-xs italic text-zinc-400">{t('Date is before birth')}</p>}
      {rows !== null && rows.length === 0 && <p className="text-xs italic text-zinc-400">{t('Unavailable')}</p>}
      {rows !== null && rows.length > 0 && (
        <>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map(row => (
              <li key={row.body} className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 text-[11px] font-mono" data-event-progression={row.body}>
                <span className="w-6 shrink-0 font-bold text-violet-600 dark:text-violet-400" title={row.body}>{code(row.body)}</span>
                <span className="whitespace-nowrap text-zinc-700 dark:text-zinc-200">{SIGN_NAMES[row.signIndex]} {formatDegree(row.degree, 'minute')}</span>
                <span className="whitespace-nowrap text-zinc-400 dark:text-zinc-500">H{row.house}</span>
                <span className="min-w-0 text-zinc-600 dark:text-zinc-300">
                  {row.aspects.length === 0 ? <span className="text-zinc-300 dark:text-zinc-600">—</span> : row.aspects.map((aspect, i) => (
                    <span
                      key={aspect.natal}
                      data-aspect={`${aspect.natal}|${aspect.relation}`}
                      title={fill(t('{degrees}° from the natal degree'), { degrees: aspect.orb.toFixed(1) })}
                      className={aspect.exact ? 'font-bold text-emerald-700 dark:text-green-400' : ''}
                    >
                      {i > 0 && ' · '}{code(aspect.natal)} {aspect.relation}{aspect.exact && ' ●'}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1" data-progressed-graha-relationships>
            <div className={CAPTION}>{t('Progressed graha relationships')}</div>
            {relationships.length === 0 ? (
              <p className="text-[10px] italic text-zinc-400">{t('No 1, 5, 7 or 9 relationships between progressing grahas.')}</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {relationships.map((relationship, index) => (
                  <li key={`${relationship.from}|${relationship.relation}|${relationship.to}`} data-progressed-relation={`${relationship.from}|${relationship.relation}|${relationship.to}`} className={`flex flex-wrap items-baseline gap-x-2 py-1 text-[11px] font-mono ${relationship.exact ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                    <span>{code(relationship.from)}</span>
                    <span>{relationship.relation} →</span>
                    <span>{code(relationship.to)}</span>
                    <span className="text-[9px] text-zinc-400">({relationship.orb.toFixed(1)}°)</span>
                    {relationship.exact && <span aria-label={t('Exact degree proximity')}>●</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[9px] font-mono text-zinc-400">{t('Relationship is counted from the first progressing graha by sign. ● = within 1° by degree.')}</p>
          </div>
          <p className="text-[9px] font-mono text-zinc-400">{fill(t('The natal points each aspects by sign (1 = its own sign, 5, 7, 9 = counted from it). ● = within {orb}° of the natal degree.'), { orb: String(EXACT_ORB) })}</p>
        </>
      )}
    </section>
  );
}
