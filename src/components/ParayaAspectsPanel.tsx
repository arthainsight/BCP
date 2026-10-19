'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { parayaPeriodsOf, parayaTimelineOf } from '@/lib/bnn/bnnHouses';
import { ALL_PARAYA_BODIES, PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody, type ParayaPeriod } from '@/lib/bnn/nadiParaya';
import { aspectPeriodsOf, aspectsAt, convergencesOf, groupBySign, overlapping, type AspectPeriod, type Convergence } from '@/lib/bnn/parayaAspects';
import { PROGRESSION_NATAL, formatHitDay } from '@/lib/bnn/parayaProgression';
import { PROGRESSION_RELATIONS, type HitRelation } from '@/lib/transitHits';
import { SIGN_ABBR } from '@/lib/signs';
import { ordinal } from '@/lib/ordinal';
import { useLanguage, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { pad2 } from '@/lib/dateFormat';
import { JULIAN_YEAR_MS } from '@/lib/time';
import { BODY_CELL, Heading, NAME_CELL, ROW, ScrollTable, VALUE_CELL } from './balaShared';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate: string;
  calculationSettings?: CalculationSettings;
  /** Moves the target moment (DD.MM.YYYY HH.MM.SS). */
  onSetTarget?: (value: string) => void;
};

const RANGES = [
  { label: '1 yr', years: 1 },
  { label: '3 yr', years: 3 },
  { label: '10 yr', years: 10 },
  { label: '30 yr', years: 30 },
];
const MINIMUMS = [2, 3, 4];
const FIRST_ROWS = 40;

/**
 * The Paraya aspects: which progressing grahas aspect a natal point by sign, not by degree — the graha stands in the same sign as the point or in its 5th,
 * 7th or 9th — at the target moment, when several of them do at once, and, by search, when a graha aspects a point at all.
 */
export default function ParayaAspectsPanel({ chart, birthDatetime, targetDate, calculationSettings, onSetTarget }: Props) {
  const t = useT();
  const language = useLanguage();
  const { code } = useGrahaNames();
  const [years, setYears] = useState(10);
  const [bodies, setBodies] = useState<readonly ParayaBody[]>(PARAYA_BODIES);
  const [relations, setRelations] = useState<readonly HitRelation[]>(PROGRESSION_RELATIONS);
  const [minimum, setMinimum] = useState(2);
  const [mode, setMode] = useState<'several' | 'search'>('several');
  const [searchBody, setSearchBody] = useState<ParayaBody | ''>('');
  const [searchNatal, setSearchNatal] = useState('');
  const [showAll, setShowAll] = useState(false);

  const saturn = calculationSettings?.parayaSaturn ?? 'alternating';
  const rahu = calculationSettings?.parayaRahu ?? 'alternating';
  const retro = calculationSettings?.parayaRetro ?? 'previous';

  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const from = useMemo(() => parseTargetDateString(targetDate), [targetDate]);
  const nowAge = birth && from ? Math.max(0, (from.getTime() - birth.getTime()) / JULIAN_YEAR_MS) : 0;
  const toAge = nowAge + years;
  const timeOf = (age: number) => (birth ? birth.getTime() + Math.max(0, age) * JULIAN_YEAR_MS : 0);

  // The natal points with the sign each is in.
  const natal = useMemo(() => PROGRESSION_NATAL.flatMap(name => {
    const sign = name === 'Asc' ? chart.ascendant.sign : chart.planets.find(planet => planet.name === name)?.sign;
    return sign ? [{ name, signIndex: sign - 1 }] : [];
  }), [chart]);

  /** The place of a natal point in the usual order (the grahas Sun to Ketu, then the ascendant), which the rows keep. */
  const order = (name: string) => (PROGRESSION_NATAL as readonly string[]).indexOf(name);

  // The stays of every progressing graha up to the end of the range, and from them the aspect periods of each natal point.
  const options = useMemo(() => ({ saturn, rahu, retro }), [saturn, rahu, retro]);
  const stays = useMemo(() => {
    const result = {} as Record<ParayaBody, ParayaPeriod[]>;
    if (!birth) return result;
    for (const body of ALL_PARAYA_BODIES) result[body] = parayaTimelineOf(chart, body, toAge + 1, options);
    return result;
  }, [chart, birth, toAge, options]);
  const periodsByNatal = useMemo(() => {
    const byNatal = new Map<string, AspectPeriod[]>();
    for (const point of natal) {
      byNatal.set(point.name, bodies.flatMap(body => aspectPeriodsOf(stays[body] ?? [], point, relations)));
    }
    return byNatal;
  }, [natal, bodies, stays, relations]);

  // At the target moment.
  const nowRows = useMemo(() => {
    if (!birth || !from) return [];
    const current = parayaPeriodsOf(chart, nowAge, options, true).filter(period => bodies.includes(period.body));
    return natal.map(point => ({ ...point, aspects: aspectsAt(current, point.signIndex, relations) }));
  }, [chart, birth, from, nowAge, options, bodies, natal, relations]);

  // When several aspect the same point.
  const together = useMemo(() => {
    const found: Convergence[] = [];
    for (const point of natal) found.push(...overlapping(convergencesOf(periodsByNatal.get(point.name) ?? [], minimum), nowAge, toAge));
    return found.sort((a, b) => a.startAge - b.startAge || order(a.natal) - order(b.natal));
  }, [natal, periodsByNatal, minimum, nowAge, toAge]);

  // The search: a graha and a natal point, or any.
  const found = useMemo(() => {
    const list: AspectPeriod[] = [];
    for (const point of natal) {
      if (searchNatal && point.name !== searchNatal) continue;
      list.push(...overlapping(periodsByNatal.get(point.name) ?? [], nowAge, toAge).filter(period => !searchBody || period.body === searchBody));
    }
    return list.sort((a, b) => a.startAge - b.startAge || order(a.natal) - order(b.natal) || ALL_PARAYA_BODIES.indexOf(a.body) - ALL_PARAYA_BODIES.indexOf(b.body));
  }, [natal, periodsByNatal, searchBody, searchNatal, nowAge, toAge]);

  // Natal points in one sign are aspected by the same grahas at the same times: one row for them.
  const togetherRows = useMemo(
    () => groupBySign(together, name => natal.find(point => point.name === name)?.signIndex ?? 0, item => item.aspects.map(a => `${a.body}${a.relation}`).sort().join(',')),
    [together, natal],
  );
  const foundRows = useMemo(
    () => groupBySign(found, name => natal.find(point => point.name === name)?.signIndex ?? 0, item => `${item.body}|${item.relation}`),
    [found, natal],
  );
  const natalCodes = (names: string[]) => names.map(name => code(name)).join(' ');
  const relationText = (relation: HitRelation) => (relation === 1 ? t('over natal') : `${ordinal(relation, language)} ${t('from natal')}`);
  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;
  const toggleBody = (body: ParayaBody) => {
    setBodies(current => (current.includes(body) ? current.filter(item => item !== body) : ALL_PARAYA_BODIES.filter(item => item === body || current.includes(item))));
    setShowAll(false);
  };
  const toggleRelation = (relation: HitRelation) => {
    setRelations(current => (current.includes(relation) ? current.filter(item => item !== relation) : PROGRESSION_RELATIONS.filter(item => item === relation || current.includes(item))));
    setShowAll(false);
  };
  const setTarget = (time: number) => {
    const d = new Date(Math.max(time, birth?.getTime() ?? time));
    onSetTarget?.(`${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}.${pad2(d.getMinutes())}.00`);
  };
  const dates = (startAge: number, endAge: number) => `${formatHitDay(timeOf(startAge))} → ${formatHitDay(timeOf(endAge))}`;
  const running = (startAge: number, endAge: number) => startAge <= nowAge && nowAge < endAge;
  const aspectsText = (aspects: { body: ParayaBody; relation: HitRelation }[]) => aspects.map(item => `${code(item.body)} ${item.relation}`).join(' · ');

  const rowsOf = <T,>(list: T[]) => (showAll ? list : list.slice(0, FIRST_ROWS));
  const runningBadge = <span className="ml-1 rounded-sm bg-emerald-500 px-1 text-[9px] text-white dark:bg-green-600">{t('running')}</span>;

  return (
    <section aria-label={t('paraya aspects')} className="min-w-0 space-y-4">
      <Heading command="paraya.aspects">
        {t('Which progressing (Paraya) grahas aspect a natal graha or the ascendant by sign, not by degree: a graha in the same sign as the point, or in its 5th, 7th or 9th sign, aspects it for the whole of its stay there.')}
      </Heading>

      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('range')}>
        {RANGES.map(range => (
          <button key={range.years} type="button" aria-pressed={years === range.years} onClick={() => { setYears(range.years); setShowAll(false); }} className={chip(years === range.years)}>
            {t(range.label)}
          </button>
        ))}
        <span className="mx-1 text-zinc-300 dark:text-zinc-600">·</span>
        {PROGRESSION_RELATIONS.map(relation => (
          <button key={relation} type="button" aria-pressed={relations.includes(relation)} title={relationText(relation)} onClick={() => toggleRelation(relation)} className={chip(relations.includes(relation))}>
            {relation}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('progressing grahas')}>
        {PARAYA_BODIES.map(body => (
          <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>
        ))}
        <span className="ml-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('beta')}</span>
        {PARAYA_BETA_BODIES.map(body => (
          <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>
        ))}
      </div>

      {/* At the target moment: who aspects each natal point */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('at the target moment')}</div>
        <ScrollTable minWidth="min-w-[420px]" headers={[t('Natal'), t('Sign'), t('Aspected by'), '#']}>
          {nowRows.map(row => (
            <tr key={row.name} className={ROW} data-now={row.name}>
              <td className={NAME_CELL}>{code(row.name)}</td>
              <td className={VALUE_CELL}>{SIGN_ABBR[row.signIndex]}</td>
              <td className={`${BODY_CELL} text-zinc-700 dark:text-zinc-300`}>
                {row.aspects.length > 0 ? aspectsText(row.aspects) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
              </td>
              <td className={`${BODY_CELL} ${row.aspects.length >= minimum ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{row.aspects.length}{row.aspects.length >= minimum && ' ✓'}</td>
            </tr>
          ))}
        </ScrollTable>
      </div>

      {/* Several at once, or a search */}
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('aspect view')}>
        <button type="button" aria-pressed={mode === 'several'} onClick={() => { setMode('several'); setShowAll(false); }} className={chip(mode === 'several')}>{t('several at once')}</button>
        <button type="button" aria-pressed={mode === 'search'} onClick={() => { setMode('search'); setShowAll(false); }} className={chip(mode === 'search')}>{t('search')}</button>
        {mode === 'several' && (
          <>
            <span className="mx-1 text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('at least')}</span>
            {MINIMUMS.map(value => (
              <button key={value} type="button" aria-pressed={minimum === value} onClick={() => { setMinimum(value); setShowAll(false); }} className={chip(minimum === value)}>{value}</button>
            ))}
          </>
        )}
      </div>

      {mode === 'search' && (
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <label className="flex items-center gap-1">
            {t('Progressing')}
            <select value={searchBody} onChange={event => { setSearchBody(event.target.value as ParayaBody | ''); setShowAll(false); }} aria-label={t('progressing graha')} className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
              <option value="">{t('any')}</option>
              {ALL_PARAYA_BODIES.map(body => <option key={body} value={body}>{code(body)} · {body}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1">
            {t('aspects')}
            <select value={searchNatal} onChange={event => { setSearchNatal(event.target.value); setShowAll(false); }} aria-label={t('natal point')} className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
              <option value="">{t('any')}</option>
              {PROGRESSION_NATAL.map(name => <option key={name} value={name}>{code(name)} · {name}</option>)}
            </select>
          </label>
        </div>
      )}

      {mode === 'several' ? (
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('several at once')} · {togetherRows.length}</div>
          {togetherRows.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No natal point is aspected by that many grahas in this period.')}</p>}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rowsOf(togetherRows).map(({ natals, signIndex, item }) => (
              <li key={`${natals[0]}-${item.startAge}`} className="flex items-center gap-2 py-1 text-[11px] font-mono" data-together={natals[0]}>
                <span className="w-44 shrink-0 text-zinc-500 dark:text-zinc-400">{dates(item.startAge, item.endAge)}</span>
                <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                  <span className="font-bold">{natalCodes(natals)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500"> {SIGN_ABBR[signIndex]}</span>
                  {' ← '}
                  <span className="font-bold text-violet-600 dark:text-violet-400">{aspectsText(item.aspects)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500"> · {item.aspects.length}</span>
                  {running(item.startAge, item.endAge) && runningBadge}
                </span>
                {onSetTarget && <button type="button" onClick={() => setTarget(timeOf(item.startAge))} className="shrink-0 rounded border border-violet-300 px-2 py-1.5 text-[10px] text-violet-700 sm:px-1.5 sm:py-0.5 dark:border-violet-700 dark:text-violet-300">{t('set target')}</button>}
              </li>
            ))}
          </ul>
          {togetherRows.length > FIRST_ROWS && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
              {showAll ? t('show fewer') : `${t('show all')} ${togetherRows.length}`}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('search')} · {foundRows.length}</div>
          {foundRows.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No aspects in this period.')}</p>}
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rowsOf(foundRows).map(({ natals, signIndex, item }) => (
              <li key={`${item.body}-${natals[0]}-${item.startAge}`} className="flex items-center gap-2 py-1 text-[11px] font-mono" data-aspect={`${item.body}|${natals[0]}|${item.relation}`}>
                <span className="w-44 shrink-0 text-zinc-500 dark:text-zinc-400">{dates(item.startAge, item.endAge)}</span>
                <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                  <span className="font-bold text-violet-600 dark:text-violet-400">{code(item.body)}</span>
                  {` ${relationText(item.relation)} `}
                  <span className="font-bold">{natalCodes(natals)}</span>
                  <span className="text-zinc-400 dark:text-zinc-500"> {SIGN_ABBR[signIndex]}</span>
                  {running(item.startAge, item.endAge) && runningBadge}
                </span>
                {onSetTarget && <button type="button" onClick={() => setTarget(timeOf(item.startAge))} className="shrink-0 rounded border border-violet-300 px-2 py-1.5 text-[10px] text-violet-700 sm:px-1.5 sm:py-0.5 dark:border-violet-700 dark:text-violet-300">{t('set target')}</button>}
              </li>
            ))}
          </ul>
          {foundRows.length > FIRST_ROWS && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
              {showAll ? t('show fewer') : `${t('show all')} ${foundRows.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
