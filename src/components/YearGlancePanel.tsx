'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
// Types only: the calculations run in the routes, which load the ephemeris.
import type { PraveshaMethod } from '@/lib/pravesha';
import type { VedicDay } from '@/lib/lunisolar';
import { glanceAxis, glanceFraction, localMs, startOffsetsDays, type GlanceSpan } from '@/lib/yearGlance';
import { formatDegree } from '@/lib/formatDegree';
import { SIGN_ABBR } from '@/lib/signs';
import {
  AnnualPlaceControl,
  YearStepper,
  buildAnnualParams,
  fmtLocal,
  fmtOffset,
  toggleClass,
  useAnnualFetch,
  type AnnualPlace,
  type LocalParts,
} from './annualShared';
import { useLanguage, useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate?: string;
  ianaTimezone?: string;
  calculationSettings?: CalculationSettings;
  place: AnnualPlace;
  onPlaceChange: (place: AnnualPlace) => void;
};

/** What the four routes have in common, as far as this view reads them. */
type AnnualAnswer = {
  year: number;
  local: LocalParts;
  tzOffset: number;
  next: { local: LocalParts; tzOffset: number };
  chart: ChartData;
  /** The lord of the year: the vāra lord (Tithi, Nakṣatra and Yoga Praveśa) or the year lord of Varṣaphala. */
  lord: string;
  vedicDay?: VedicDay;
};

type SystemId = 'tithi' | 'nakshatra' | 'yoga' | 'varsha';

const SYSTEMS: { id: SystemId; label: string; bar: string; text: string }[] = [
  { id: 'tithi', label: 'Tithi Praveśa', bar: 'fill-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  { id: 'nakshatra', label: 'Nakṣatra Praveśa', bar: 'fill-emerald-500', text: 'text-emerald-700 dark:text-green-400' },
  { id: 'yoga', label: 'Yoga Praveśa', bar: 'fill-amber-500', text: 'text-amber-700 dark:text-amber-400' },
  { id: 'varsha', label: 'Varṣaphala', bar: 'fill-sky-500', text: 'text-sky-700 dark:text-sky-300' },
];

// The raw answers of the four routes, reduced to what the view shows.
type TithiAnswer = { tithiPravesa: { year: number }; local: LocalParts; tzOffset: number; next: { local: LocalParts; tzOffset: number }; vedicDay: VedicDay; chart: ChartData };
type PraveshaAnswer = { pravesha: { year: number }; local: LocalParts; tzOffset: number; next: { local: LocalParts; tzOffset: number }; vedicDay: VedicDay; chart: ChartData };
type VarshaAnswer = { year: number; local: LocalParts; tzOffset: number; next: { local: LocalParts; tzOffset: number }; yearLord: string; chart: ChartData };

const fromTithi = (a: TithiAnswer): AnnualAnswer => ({ year: a.tithiPravesa.year, local: a.local, tzOffset: a.tzOffset, next: a.next, chart: a.chart, lord: a.vedicDay.varaLord, vedicDay: a.vedicDay });
const fromPravesha = (a: PraveshaAnswer): AnnualAnswer => ({ year: a.pravesha.year, local: a.local, tzOffset: a.tzOffset, next: a.next, chart: a.chart, lord: a.vedicDay.varaLord, vedicDay: a.vedicDay });
const fromVarsha = (a: VarshaAnswer): AnnualAnswer => ({ year: a.year, local: a.local, tzOffset: a.tzOffset, next: a.next, chart: a.chart, lord: a.yearLord });

const WIDTH = 900;
const LEFT = 150;
const RIGHT = 20;
const TOP = 34;
const ROW = 44;

/**
 * The four annual charts of a year side by side — Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa and Varṣaphala —
 * as a table of their moments, lagnas and lords of the year, and as bars on one time axis, where the weeks between
 * their starts can be seen at once.
 */
export default function YearGlancePanel({ chart, birthDatetime, targetDate, ianaTimezone, calculationSettings, place, onPlaceChange }: Props) {
  const t = useT();
  const language = useLanguage();
  // null year means "the year in force at the target date", for each of the four.
  const [year, setYear] = useState<number | null>(null);
  const [method, setMethod] = useState<PraveshaMethod>('lunar-month');

  const base = { chart, birthDatetime, ianaTimezone, calculationSettings, place, year, targetDate };
  const tithiQuery = buildAnnualParams({ ...base, extra: { method: 'lunar-month' } });
  const nakshatraQuery = buildAnnualParams({ ...base, extra: { kind: 'nakshatra', method } });
  const yogaQuery = buildAnnualParams({ ...base, extra: { kind: 'yoga', method } });
  const varshaQuery = buildAnnualParams(base);
  const tithi = useAnnualFetch<TithiAnswer>('/api/tithi-pravesha', tithiQuery);
  const nakshatra = useAnnualFetch<PraveshaAnswer>('/api/pravesha', nakshatraQuery);
  const yoga = useAnnualFetch<PraveshaAnswer>('/api/pravesha', yogaQuery);
  const varsha = useAnnualFetch<VarshaAnswer>('/api/varshaphala', varshaQuery);

  const answers = useMemo(() => ({
    tithi: tithi.data ? fromTithi(tithi.data) : null,
    nakshatra: nakshatra.data ? fromPravesha(nakshatra.data) : null,
    yoga: yoga.data ? fromPravesha(yoga.data) : null,
    varsha: varsha.data ? fromVarsha(varsha.data) : null,
  }), [tithi.data, nakshatra.data, yoga.data, varsha.data]);
  const status: Record<SystemId, { loading: boolean; error?: string }> = {
    tithi: { loading: tithi.loading, error: tithi.error },
    nakshatra: { loading: nakshatra.loading, error: nakshatra.error },
    yoga: { loading: yoga.loading, error: yoga.error },
    varsha: { loading: varsha.loading, error: varsha.error },
  };

  const spans: GlanceSpan[] = SYSTEMS.flatMap(({ id }) => {
    const answer = answers[id];
    return answer ? [{ id, startMs: localMs(answer.local), endMs: localMs(answer.next.local) }] : [];
  });
  const axis = glanceAxis(spans);
  const offsets = startOffsetsDays(spans);
  const loading = Object.values(status).some(item => item.loading);

  if (!tithiQuery) {
    return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{t('Birth date and place are needed for the annual charts.')}</div>;
  }

  const shownYear = answers.tithi?.year ?? answers.varsha?.year;
  const targetMs = (() => {
    const match = (targetDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : null;
  })();
  const month = new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' });
  const height = TOP + SYSTEMS.length * ROW + 26;
  const bottom = height - 20;
  const x = (ms: number) => LEFT + glanceFraction(axis!, ms) * (WIDTH - LEFT - RIGHT);
  const shortDate = (p: LocalParts) => `${String(p.day).padStart(2, '0')}.${String(p.month).padStart(2, '0')}.`;

  return (
    <div className="space-y-3 min-w-0" data-year-glance>
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{t('Year at a glance')}</div>
        <div className="mt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The four annual charts side by side: Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa and Varṣaphala. Each begins at a moment of its own, a few weeks apart.')}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <YearStepper shownYear={shownYear} year={year} onChange={setYear} />
        <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50" role="group" aria-label={t('Nakṣatra and Yoga Praveśa')}>
          <button type="button" className={toggleClass(method === 'lunar-month')} aria-pressed={method === 'lunar-month'} onClick={() => setMethod('lunar-month')}>{t('Same month')}</button>
          <button type="button" className={toggleClass(method === 'before-birthday')} aria-pressed={method === 'before-birthday'} onClick={() => setMethod('before-birthday')}>{t('Before birthday')}</button>
        </div>
        {loading && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('calculating…')}</span>}
      </div>

      <AnnualPlaceControl place={place} onChange={onPlaceChange} />

      {axis && (
        <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={t('Year at a glance')} data-year-timeline className="h-auto w-full font-mono">
          {axis.months.map(tick => (
            <g key={tick.ms}>
              <line x1={x(tick.ms)} x2={x(tick.ms)} y1={TOP - 6} y2={bottom} className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth={1} />
              <text x={x(tick.ms) + 3} y={TOP - 12} fontSize={10} className="fill-zinc-400 dark:fill-zinc-500">
                {tick.month === 1 ? `${month.format(tick.ms)} ’${String(tick.year).slice(2)}` : month.format(tick.ms)}
              </text>
            </g>
          ))}
          {SYSTEMS.map(({ id, label, bar }, index) => {
            const answer = answers[id];
            const top = TOP + index * ROW;
            return (
              <g key={id} data-year-bar={id}>
                <text x={LEFT - 8} y={top + 21} textAnchor="end" fontSize={13} fontWeight={600} className="fill-zinc-700 dark:fill-zinc-300">{label}</text>
                {answer ? (
                  <>
                    <rect x={x(localMs(answer.local))} y={top + 4} width={Math.max(2, x(localMs(answer.next.local)) - x(localMs(answer.local)))} height={26} rx={4} className={`${bar} opacity-80`} />
                    <text x={x(localMs(answer.local)) + 6} y={top + 22} fontSize={13} fontWeight={600} className="fill-white">{shortDate(answer.local)}</text>
                    <text x={x(localMs(answer.next.local)) - 6} y={top + 22} fontSize={13} fontWeight={600} textAnchor="end" className="fill-white">{shortDate(answer.next.local)}</text>
                  </>
                ) : (
                  <text x={LEFT + 6} y={top + 22} fontSize={12} className="fill-zinc-400 dark:fill-zinc-500">{status[id].error ? t('failed') : t('calculating…')}</text>
                )}
              </g>
            );
          })}
          {targetMs !== null && targetMs > axis.startMs && targetMs < axis.endMs && (
            <g data-year-target>
              <line x1={x(targetMs)} x2={x(targetMs)} y1={TOP - 4} y2={bottom} strokeWidth={2} strokeDasharray="6 4" className="stroke-rose-500" />
              <text x={x(targetMs)} y={height - 6} textAnchor="middle" fontSize={11} className="fill-rose-500">{t('target date')}</text>
            </g>
          )}
        </svg>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px] font-mono" data-year-table>
          <thead>
            <tr className="bg-zinc-100 text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600">
              <th className="p-2 font-normal">{t('annual chart')}</th>
              <th className="p-2 font-normal">{t('begins')}</th>
              <th className="p-2 font-normal">{t('ends')}</th>
              <th className="p-2 font-normal">{t('lord of the year')}</th>
              <th className="p-2 font-normal">lagna</th>
              <th className="p-2 font-normal">{t('days from the first')}</th>
            </tr>
          </thead>
          <tbody>
            {SYSTEMS.map(({ id, label, text }) => {
              const answer = answers[id];
              return (
                <tr key={id} data-year-row={id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className={`whitespace-nowrap p-2 font-bold ${text}`}>{label}</td>
                  {answer ? (
                    <>
                      <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{fmtLocal(answer.local)} <span className="text-zinc-400 dark:text-zinc-500">({fmtOffset(answer.tzOffset)})</span></td>
                      <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{fmtLocal(answer.next.local)}</td>
                      <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{answer.lord}{answer.vedicDay ? <span className="text-zinc-400 dark:text-zinc-500"> · {t(answer.vedicDay.vara)}</span> : null}</td>
                      <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{SIGN_ABBR[answer.chart.ascendant.sign - 1]} {formatDegree(answer.chart.ascendant.degree, 'minute')}</td>
                      <td className="whitespace-nowrap p-2 tabular-nums text-zinc-500 dark:text-zinc-400">{offsets[id] === 0 ? '—' : `+${offsets[id]}`}</td>
                    </>
                  ) : (
                    <td colSpan={5} className="p-2 text-zinc-400 dark:text-zinc-600">{status[id].error ?? t('calculating…')}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('The lord of the year is the vāra lord at the moment for the three Praveśas and the Tājika year lord for Varṣaphala. Open one of the tabs for the chart, the planets and the daśā of the year.')}
      </p>
    </div>
  );
}
