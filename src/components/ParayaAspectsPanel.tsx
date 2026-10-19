'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { parayaPeriodsOf, parayaTimelineOf } from '@/lib/bnn/bnnHouses';
import { ALL_PARAYA_BODIES, PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { findParayaHits } from '@/lib/bnn/parayaHits';
import {
  aspectPeriodsOf, aspectsAt, convergencesOf, groupBySign, hitsWithin, overlapping, stripRows,
  type AspectPeriod, type Convergence, type ExactHit, type Stay,
} from '@/lib/bnn/parayaAspects';
import { PROGRESSION_NATAL, formatHitDay } from '@/lib/bnn/parayaProgression';
import { findTransitHits, PROGRESSION_RELATIONS, TRANSIT_RELATIONS, transitRelationsOf, type HitRelation, type LongitudeSeries, type RelationsOf } from '@/lib/transitHits';
import { transitStays } from '@/lib/transitAspects';
import { GRAHA_DASHA_SYSTEMS, grahaDashaTable, type GrahaDashaSystem } from '@/lib/dashaEvents';
import { dashaLordsDuring, hasLord, type DashaStretch, type LordLevel } from '@/lib/dashaDuring';
import type { VimshottariVariantChoice } from '@/lib/vimshottariVariants';
import { SIGN_ABBR } from '@/lib/signs';
import { ordinal } from '@/lib/ordinal';
import { useLanguage, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { pad2 } from '@/lib/dateFormat';
import { JULIAN_YEAR_MS } from '@/lib/time';
import { transitSeriesUrl } from '@/lib/apiParams';
import { useDebouncedJson } from '@/hooks/useDebouncedJson';
import { BODY_CELL, Heading, NAME_CELL, ROW, ScrollTable, VALUE_CELL } from './balaShared';
import AspectStrip from './AspectStrip';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate: string;
  calculationSettings?: CalculationSettings;
  /** Which of Utpanna, Kṣema and Ādhāna the variant Vimśottarī starts from. */
  variantChoice?: VimshottariVariantChoice;
  /** Moves the target moment (DD.MM.YYYY HH.MM.SS). */
  onSetTarget?: (value: string) => void;
};

type Source = 'paraya' | 'transit';
type LordFilter = 'all' | LordLevel;
type Series = { start: number; series: Record<string, { step: number; longitudes: number[] }> };

const RANGES = [
  { label: '1 yr', years: 1 },
  { label: '3 yr', years: 3 },
  { label: '10 yr', years: 10 },
  { label: '30 yr', years: 30 },
];
const MINIMUMS = [2, 3, 4];
const FIRST_ROWS = 40;
const LORD_PAIRS = 4;

/** The transiting grahas: the four slow ones to begin with, and the four faster ones, which are only worked out for ten years or less. */
const TRANSIT_SLOW = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'] as const;
const TRANSIT_FAST = ['Sun', 'Mars', 'Mercury', 'Venus'] as const;
const TRANSIT_BODIES: readonly string[] = [...TRANSIT_SLOW, ...TRANSIT_FAST];
const FAST_YEARS = 10;

/** A stretch as the lists show it: one or more natal points, the grahas that aspect them and for how long. */
interface RowData {
  key: string;
  natals: string[];
  signIndex: number;
  startAge: number;
  endAge: number;
  aspects: { body: string; relation: HitRelation }[];
}

/** The aspect view: which grahas aspect a natal point by sign, for the progressing (Paraya) grahas or for the transits. */
export default function ParayaAspectsPanel({ chart, birthDatetime, targetDate, calculationSettings, variantChoice, onSetTarget }: Props) {
  const t = useT();
  const language = useLanguage();
  const { code } = useGrahaNames();
  const [source, setSource] = useState<Source>('paraya');
  const [years, setYears] = useState(10);
  const [selected, setSelected] = useState<Record<Source, readonly string[]>>({ paraya: PARAYA_BODIES, transit: TRANSIT_SLOW });
  const [relationChoice, setRelationChoice] = useState<Record<Source, readonly HitRelation[]>>({ paraya: PROGRESSION_RELATIONS, transit: TRANSIT_RELATIONS });
  const [minimum, setMinimum] = useState(2);
  const [mode, setMode] = useState<'several' | 'search'>('several');
  const [searchBody, setSearchBody] = useState('');
  const [searchNatal, setSearchNatal] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showDasha, setShowDasha] = useState(true);
  const [dashaSystem, setDashaSystem] = useState<GrahaDashaSystem>('vimshottari');
  const [lordFilter, setLordFilter] = useState<LordFilter>('all');

  const saturn = calculationSettings?.parayaSaturn ?? 'alternating';
  const rahu = calculationSettings?.parayaRahu ?? 'alternating';
  const retro = calculationSettings?.parayaRetro ?? 'previous';
  const progression = source === 'paraya';
  const allBodies: readonly string[] = progression ? ALL_PARAYA_BODIES : TRANSIT_BODIES;
  const bodies = selected[source];
  const choices = progression ? PROGRESSION_RELATIONS : TRANSIT_RELATIONS;
  const relations = relationChoice[source];
  /** What is looked at for each graha: the relations chosen, and in the transits only those the graha has (Saturn the 3rd, 7th and 10th, Jupiter the 5th, 7th and 9th, and so on). */
  const relationsOf = useMemo<RelationsOf>(() => (progression ? relations : (body: string) => transitRelationsOf(body).filter(item => relations.includes(item))), [progression, relations]);

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
  const bodyOrder = (body: string) => allBodies.indexOf(body);

  // The transits come from the ephemeris: the slow grahas always, the faster ones only when one of them is chosen and the range is short.
  const days = Math.ceil(years * 365.25) + 2;
  const fastWanted = years <= FAST_YEARS && bodies.some(body => (TRANSIT_FAST as readonly string[]).includes(body));
  const slowSeries = useDebouncedJson<Series>(!progression && from ? transitSeriesUrl(targetDate, days, TRANSIT_SLOW, calculationSettings) : null);
  const fastSeries = useDebouncedJson<Series>(!progression && from && fastWanted ? transitSeriesUrl(targetDate, days, TRANSIT_FAST, calculationSettings) : null);
  const transitSeries = useMemo(() => {
    const result: Record<string, LongitudeSeries> = {};
    for (const loaded of [slowSeries.data, fastSeries.data]) {
      if (!loaded) continue;
      for (const [body, sample] of Object.entries(loaded.series)) result[body] = { start: loaded.start, step: sample.step, longitudes: sample.longitudes };
    }
    return result;
  }, [slowSeries.data, fastSeries.data]);
  const loading = !progression && (slowSeries.loading || (fastWanted && fastSeries.loading));
  const loadError = progression ? '' : slowSeries.error || (fastWanted ? fastSeries.error : '');

  // The stays of every graha in the signs up to the end of the range, and from them the aspect periods of each natal point.
  const options = useMemo(() => ({ saturn, rahu, retro }), [saturn, rahu, retro]);
  const stays = useMemo(() => {
    const result: Record<string, Stay[]> = {};
    if (!birth) return result;
    if (progression) {
      for (const body of ALL_PARAYA_BODIES) result[body] = parayaTimelineOf(chart, body, toAge + 1, options);
    } else {
      for (const [body, series] of Object.entries(transitSeries)) result[body] = transitStays(body, series, birth.getTime());
    }
    return result;
  }, [chart, birth, toAge, options, progression, transitSeries]);
  const periodsByNatal = useMemo(() => {
    const byNatal = new Map<string, AspectPeriod[]>();
    for (const point of natal) {
      byNatal.set(point.name, bodies.flatMap(body => aspectPeriodsOf(stays[body] ?? [], point, relationsOf)));
    }
    return byNatal;
  }, [natal, bodies, stays, relationsOf]);

  // At the target moment.
  const nowRows = useMemo(() => {
    if (!birth || !from) return [];
    const current: { body: string; signIndex: number }[] = progression
      ? parayaPeriodsOf(chart, nowAge, options, true).filter(period => bodies.includes(period.body))
      : bodies.flatMap(body => (stays[body] ?? []).filter(stay => stay.startAge <= nowAge && nowAge < stay.endAge));
    return natal.map(point => ({ ...point, aspects: aspectsAt(current, point.signIndex, relationsOf) }));
  }, [chart, birth, from, nowAge, options, bodies, natal, relationsOf, progression, stays]);

  // The exact degree: when each graha stands at the degree of a natal point, in its own sign or in a sign it aspects.
  const exactHits = useMemo<ExactHit[]>(() => {
    if (!birth || !from) return [];
    if (progression) {
      return findParayaHits({ chart, birthTime: birth.getTime(), fromTime: from.getTime(), toTime: timeOf(toAge), relations, options, bodies: bodies as ParayaBody[] })
        .map(hit => ({ body: hit.body, natal: hit.natal, relation: hit.relation, time: hit.time }));
    }
    const points = [
      ...chart.planets.filter(planet => (PROGRESSION_NATAL as readonly string[]).includes(planet.name)).map(planet => ({ name: planet.name, longitude: planet.longitude })),
      { name: 'Asc', longitude: chart.ascendant.longitude },
    ];
    const chosen = Object.fromEntries(Object.entries(transitSeries).filter(([body]) => bodies.includes(body)));
    return findTransitHits(chosen, points, relationsOf).map(hit => ({ body: hit.transit, natal: hit.natal, relation: hit.relation, time: hit.time, retrograde: hit.retrograde }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, birth, from, toAge, relations, relationsOf, options, bodies, progression, transitSeries]);

  // The daśā lords through each stretch.
  const dashaTable = useMemo(
    () => (birth ? grahaDashaTable(dashaSystem, { birthDate: birth, planets: chart.planets, ascendant: chart.ascendant, variantChoice }) : null),
    [birth, dashaSystem, chart, variantChoice],
  );
  const wantsDasha = Boolean(dashaTable) && (showDasha || lordFilter !== 'all');

  /** The rows, with the daśā lords through each, and without those that the daśā filter leaves out. */
  const withDasha = (rows: RowData[]) => {
    const decorated = rows.map(row => ({ row, lords: wantsDasha && dashaTable ? dashaLordsDuring(dashaTable, timeOf(row.startAge), timeOf(row.endAge)) : null }));
    return lordFilter === 'all' || !dashaTable ? decorated : decorated.filter(({ row, lords }) => hasLord(lords ?? [], row.natals, lordFilter));
  };
  const signOf = (name: string) => natal.find(point => point.name === name)?.signIndex ?? 0;

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
    return list.sort((a, b) => a.startAge - b.startAge || order(a.natal) - order(b.natal) || bodyOrder(a.body) - bodyOrder(b.body));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natal, periodsByNatal, searchBody, searchNatal, nowAge, toAge, progression]);

  // Natal points in one sign are aspected by the same grahas at the same times: one row for them.
  const togetherRows = useMemo(() => withDasha(
    groupBySign(together, signOf, item => item.aspects.map(a => `${a.body}${a.relation}`).sort().join(','))
      .map(({ natals, signIndex, item }) => ({ key: `${natals[0]}-${item.startAge}`, natals, signIndex, startAge: item.startAge, endAge: item.endAge, aspects: item.aspects })),
  ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [together, natal, dashaTable, wantsDasha, lordFilter]);
  const foundRows = useMemo(() => withDasha(
    groupBySign(found, signOf, item => `${item.body}|${item.relation}`)
      .map(({ natals, signIndex, item }) => ({ key: `${item.body}-${natals[0]}-${item.startAge}`, natals, signIndex, startAge: item.startAge, endAge: item.endAge, aspects: [{ body: item.body, relation: item.relation }] })),
  ),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [found, natal, dashaTable, wantsDasha, lordFilter]);

  const strip = useMemo(() => stripRows(natal, periodsByNatal, nowAge, toAge), [natal, periodsByNatal, nowAge, toAge]);

  const natalCodes = (names: string[]) => names.map(name => code(name)).join(' ');
  // The progressions have the house of the graha from the natal point; the transits have the grahas' own aspects, counted from the graha.
  const relationText = (relation: HitRelation) => (relation === 1 ? t('over natal') : `${ordinal(relation, language)} ${progression ? t('from natal') : t('aspect on')}`);
  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;
  const toggleBody = (body: string) => {
    setSelected(current => ({
      ...current,
      [source]: current[source].includes(body) ? current[source].filter(item => item !== body) : allBodies.filter(item => item === body || current[source].includes(item)),
    }));
    setShowAll(false);
  };
  const toggleRelation = (relation: HitRelation) => {
    setRelationChoice(current => ({ ...current, [source]: current[source].includes(relation) ? current[source].filter(item => item !== relation) : choices.filter(item => item === relation || current[source].includes(item)) }));
    setShowAll(false);
  };
  const chooseSource = (next: Source) => {
    setSource(next);
    setSearchBody('');
    setShowAll(false);
  };
  const setTarget = (time: number) => {
    const d = new Date(Math.max(time, birth?.getTime() ?? time));
    onSetTarget?.(`${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}.${pad2(d.getMinutes())}.00`);
  };
  const dates = (startAge: number, endAge: number) => `${formatHitDay(timeOf(startAge))} → ${formatHitDay(timeOf(endAge))}`;
  const running = (startAge: number, endAge: number) => startAge <= nowAge && nowAge < endAge;
  const aspectsText = (aspects: { body: string; relation: HitRelation }[]) => aspects.map(item => `${code(item.body)} ${item.relation}`).join(' · ');

  const rowsOf = <T,>(list: T[]) => (showAll ? list : list.slice(0, FIRST_ROWS));
  const dashaLabel = GRAHA_DASHA_SYSTEMS.find(item => item.key === dashaSystem)?.short ?? '';
  const renderRow = (row: RowData, lords: DashaStretch[] | null, attrs: Record<string, string>, summary: ReactNode) => (
    <StretchRow
      key={row.key}
      attrs={attrs}
      dates={dates(row.startAge, row.endAge)}
      isRunning={running(row.startAge, row.endAge)}
      summary={summary}
      hits={hitsWithin(exactHits, { natals: row.natals, aspects: row.aspects, startTime: timeOf(row.startAge), endTime: timeOf(row.endAge) })}
      lords={lords}
      dashaLabel={dashaLabel}
      natals={row.natals}
      startTime={timeOf(row.startAge)}
      relationText={relationText}
      onSetTarget={onSetTarget ? setTarget : undefined}
    />
  );
  const showMore = (count: number) => count > FIRST_ROWS && (
    <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
      {showAll ? t('show fewer') : `${t('show all')} ${count}`}
    </button>
  );
  const groupLabel = progression ? t('progressing grahas') : t('transiting grahas');
  const ready = !loading && !loadError;

  return (
    <section aria-label={t('paraya aspects')} className="min-w-0 space-y-4">
      <Heading command="paraya.aspects">
        {progression
          ? t('Which progressing (Paraya) grahas aspect a natal graha or the ascendant by sign, not by degree: a graha in the same sign as the point, or in its 5th, 7th or 9th sign, aspects it for the whole of its stay there.')
          : t('Which transiting grahas aspect a natal graha or the ascendant by sign, not by degree: a graha in the same sign as the point, or in a sign it aspects (Saturn the 3rd, 7th and 10th, Jupiter the 5th, 7th and 9th, Mars the 4th, 7th and 8th, Rahu and Ketu the 5th and 9th, the others the 7th), aspects it for as long as it is there, and a graha that turns retrograde can leave a sign and come back to it.')}
      </Heading>

      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('aspects of')}>
        <button type="button" aria-pressed={progression} onClick={() => chooseSource('paraya')} className={chip(progression)}>{t('progressions (Paraya)')}</button>
        <button type="button" aria-pressed={!progression} onClick={() => chooseSource('transit')} className={chip(!progression)}>{t('transits')}</button>
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('range')}>
        {RANGES.map(range => (
          <button key={range.years} type="button" aria-pressed={years === range.years} onClick={() => { setYears(range.years); setShowAll(false); }} className={chip(years === range.years)}>
            {t(range.label)}
          </button>
        ))}
        <span className="mx-1 text-zinc-300 dark:text-zinc-600">·</span>
        {choices.map(relation => (
          <button key={relation} type="button" aria-pressed={relations.includes(relation)} title={relationText(relation)} onClick={() => toggleRelation(relation)} className={chip(relations.includes(relation))}>
            {relation}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={groupLabel}>
        {(progression ? PARAYA_BODIES : TRANSIT_SLOW).map(body => (
          <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>
        ))}
        <span className="ml-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{progression ? t('beta') : t('faster, up to 10 years')}</span>
        {(progression ? PARAYA_BETA_BODIES : TRANSIT_FAST).map(body => (
          <button
            key={body}
            type="button"
            aria-pressed={bodies.includes(body)}
            disabled={!progression && years > FAST_YEARS}
            title={body}
            onClick={() => toggleBody(body)}
            className={`${chip(bodies.includes(body))} disabled:opacity-40`}
          >
            {code(body)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('daśā')}>
        <button type="button" aria-pressed={showDasha} onClick={() => setShowDasha(v => !v)} className={chip(showDasha)}>{t('daśā')}</button>
        <select value={dashaSystem} onChange={event => { setDashaSystem(event.target.value as GrahaDashaSystem); setShowAll(false); }} aria-label={t('daśā system')} className="max-w-[11rem] rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {GRAHA_DASHA_SYSTEMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <span className="ml-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('the aspected graha is a daśā lord')}</span>
        {([['all', 'any time'], ['md', 'MD lord'], ['mdad', 'MD or AD lord']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={lordFilter === value} onClick={() => { setLordFilter(value); setShowAll(false); }} className={chip(lordFilter === value)}>{t(label)}</button>
        ))}
      </div>
      {!dashaTable && <p className="text-[10px] font-mono text-zinc-400">{t('This daśā system does not apply to this chart.')}</p>}

      {loading && <p className="text-[10px] font-mono text-zinc-400">{t('Calculating…')}</p>}
      {loadError && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load transits:')} {loadError}</p>}

      {ready && (
        <>
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

          <AspectStrip rows={strip} fromAge={nowAge} toAge={toAge} timeOf={timeOf} aspectsText={aspectsText} onPick={onSetTarget ? setTarget : undefined} />

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
                {progression ? t('Progressing') : t('Transiting')}
                <select value={searchBody} onChange={event => { setSearchBody(event.target.value); setShowAll(false); }} aria-label={progression ? t('progressing graha') : t('transiting graha')} className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
                  <option value="">{t('any')}</option>
                  {allBodies.map(body => <option key={body} value={body}>{code(body)} · {body}</option>)}
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
                {rowsOf(togetherRows).map(({ row, lords }) => renderRow(row, lords, { 'data-together': row.natals[0] }, (
                  <>
                    <span className="font-bold">{natalCodes(row.natals)}</span>
                    <span className="text-zinc-400 dark:text-zinc-500"> {SIGN_ABBR[row.signIndex]}</span>
                    {' ← '}
                    <span className="font-bold text-violet-600 dark:text-violet-400">{aspectsText(row.aspects)}</span>
                    <span className="text-zinc-400 dark:text-zinc-500"> · {row.aspects.length}</span>
                  </>
                )))}
              </ul>
              {showMore(togetherRows.length)}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('search')} · {foundRows.length}</div>
              {foundRows.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No aspects in this period.')}</p>}
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {rowsOf(foundRows).map(({ row, lords }) => renderRow(row, lords, { 'data-aspect': `${row.aspects[0].body}|${row.natals[0]}|${row.aspects[0].relation}` }, (
                  <>
                    <span className="font-bold text-violet-600 dark:text-violet-400">{code(row.aspects[0].body)}</span>
                    {` ${relationText(row.aspects[0].relation)} `}
                    <span className="font-bold">{natalCodes(row.natals)}</span>
                    <span className="text-zinc-400 dark:text-zinc-500"> {SIGN_ABBR[row.signIndex]}</span>
                  </>
                )))}
              </ul>
              {showMore(foundRows.length)}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** The daśā lords of the stretches, as MD–AD pairs in the order of time. */
function lordPairs(lords: readonly DashaStretch[]) {
  const pairs: { md: string; ad: string }[] = [];
  for (const lord of lords) {
    const last = pairs[pairs.length - 1];
    if (!last || last.md !== lord.md || last.ad !== lord.ad) pairs.push({ md: lord.md, ad: lord.ad });
  }
  return pairs;
}

/** One stretch of the lists: when, who aspects whom, the daśā running through it, and (opened) the exact dates inside it. */
function StretchRow({ attrs, dates, isRunning, summary, hits, lords, dashaLabel, natals, startTime, relationText, onSetTarget }: {
  attrs: Record<string, string>;
  dates: string;
  isRunning: boolean;
  summary: ReactNode;
  hits: ExactHit[];
  lords: DashaStretch[] | null;
  dashaLabel: string;
  natals: string[];
  startTime: number;
  relationText: (relation: HitRelation) => string;
  onSetTarget?: (time: number) => void;
}) {
  const t = useT();
  const { code } = useGrahaNames();
  const [open, setOpen] = useState(false);
  const pairs = lords ? lordPairs(lords) : [];
  const lordClass = (lord: string) => (natals.includes(lord) ? 'font-bold text-violet-600 dark:text-violet-400' : '');
  const setButton = (time: number, label: string) => onSetTarget && (
    <button type="button" onClick={() => onSetTarget(time)} className="shrink-0 rounded border border-violet-300 px-2 py-1.5 text-[10px] text-violet-700 sm:px-1.5 sm:py-0.5 dark:border-violet-700 dark:text-violet-300">{label}</button>
  );
  const day = (time: number) => formatHitDay(time);
  return (
    <li className="py-1 text-[11px] font-mono" {...attrs}>
      <div className="flex items-center gap-2">
        <span className="w-44 shrink-0 text-zinc-500 dark:text-zinc-400">{dates}</span>
        <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
          {summary}
          {isRunning && <span className="ml-1 rounded-sm bg-emerald-500 px-1 text-[9px] text-white dark:bg-green-600">{t('running')}</span>}
        </span>
        {setButton(startTime, t('set target'))}
      </div>
      {pairs.length > 0 && (
        <div className="ml-[11.5rem] mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400" data-dasha>
          <span className="text-zinc-400 dark:text-zinc-500">{dashaLabel} </span>
          {pairs.slice(0, LORD_PAIRS).map((pair, i) => (
            <span key={`${pair.md}-${pair.ad}-${i}`}>
              {i > 0 && ' → '}
              <span className={lordClass(pair.md)}>{code(pair.md)}</span>–<span className={lordClass(pair.ad)}>{code(pair.ad)}</span>
            </span>
          ))}
          {pairs.length > LORD_PAIRS && <span className="text-zinc-400 dark:text-zinc-500"> +{pairs.length - LORD_PAIRS}</span>}
        </div>
      )}
      <div className="ml-[11.5rem] mt-0.5">
        <button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="text-[10px] text-emerald-700 dark:text-green-400">
          {open ? '▾' : '▸'} {t('exact dates')}: {hits.length}
        </button>
      </div>
      {open && (
        <div className="ml-[11.5rem] mt-1 space-y-1" data-exact>
          {hits.length === 0 && <p className="text-[10px] text-zinc-400">{t('No exact degree is reached inside this stretch.')}</p>}
          <ul className="space-y-0.5">
            {hits.map(hit => (
              <li key={`${hit.body}-${hit.natal}-${hit.relation}-${hit.time}`} className="flex items-center gap-2" data-exact-hit={`${hit.body}|${hit.natal}|${hit.relation}`}>
                <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{day(hit.time)}</span>
                <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                  <span className="font-bold text-violet-600 dark:text-violet-400">{code(hit.body)}{hit.retrograde ? '℞' : ''}</span>
                  {` ${relationText(hit.relation)} `}
                  <span className="font-bold">{code(hit.natal)}</span>
                </span>
                {setButton(hit.time, t('set target'))}
              </li>
            ))}
          </ul>
          {lords && lords.length > 0 && (
            <ul className="space-y-0.5 border-t border-zinc-100 pt-1 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400" data-dasha-list>
              {lords.map(lord => (
                <li key={`${lord.md}-${lord.ad}-${lord.startTime}`}>
                  <span className="inline-block w-44 text-zinc-400 dark:text-zinc-500">{day(lord.startTime)} → {day(lord.endTime)}</span>
                  {dashaLabel} <span className={lordClass(lord.md)}>{code(lord.md)}</span>–<span className={lordClass(lord.ad)}>{code(lord.ad)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
