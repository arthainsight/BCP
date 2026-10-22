'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { findParayaHits } from '@/lib/bnn/parayaHits';
import { parayaPeriodsOf } from '@/lib/bnn/bnnHouses';
import { ALL_PARAYA_BODIES, PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { PROGRESSION_NATAL, filterHits, formatHitDay, formatHitDayShort, groupByMonth, limitGroups, nextHitOf, overviewOf } from '@/lib/bnn/parayaProgression';
import { PROGRESSION_RELATIONS, RELATION_OFFSET, type HitRelation } from '@/lib/transitHits';
import { SIGN_ABBR, SIGN_NAMES } from '@/lib/signs';
import { formatDegree } from '@/lib/formatDegree';
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
const FIRST_ROWS = 40;

const isBeta = (body: ParayaBody) => (PARAYA_BETA_BODIES as readonly ParayaBody[]).includes(body);

/**
 * The Paraya tab: the seven progressing grahas (Jupiter, Saturn, Rahu and Ketu, and Mars, Mercury and Venus in beta) where they stand now
 * and when each of them next reaches a natal point or the ascendant, an overview of the seven against the ten natal points, and every hit
 * in the order of time: the same degree in the 1st, 5th, 7th and 9th sign from the natal point. Worked out in the browser from the age.
 */

const CHAKRA_BODIES: readonly ParayaBody[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mercury', 'Venus', 'Mars'];
const CHAKRA_COLORS: Record<ParayaBody, string> = {
  Jupiter: '#f59e0b', Saturn: '#60a5fa', Rahu: '#a78bfa', Ketu: '#cbd5e1',
  Mercury: '#4ade80', Venus: '#f472b6', Mars: '#f87171',
};
const CHAKRA_GLYPHS: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'As',
};
const CHAKRA_SIGNS = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const CHAKRA_CENTER = 360;
const CHAKRA_POINT = (radius: number, longitude: number) => {
  const angle = ((90 - longitude) * Math.PI) / 180;
  return { x: CHAKRA_CENTER + radius * Math.cos(angle), y: CHAKRA_CENTER - radius * Math.sin(angle) };
};

function BhriguChakra({ chart, now, relations, code }: {
  chart: ChartData;
  now: ReturnType<typeof parayaPeriodsOf>;
  relations: readonly HitRelation[];
  code: (body: string) => string;
}) {
  const cx = CHAKRA_CENTER;
  const outer = 306;
  const ringWidth = 29;
  const natalRadius = 72;
  const ringBodies = CHAKRA_BODIES.filter(body => now.some(position => position.body === body));
  const natal = chart.planets.filter(planet => CHAKRA_GLYPHS[planet.name]);
  const relationOn = (progressionSign: number, natalSign: number) => {
    const count = ((natalSign - progressionSign + 12) % 12) + 1;
    return relations.includes(count as HitRelation);
  };
  return (
    <section className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800" aria-label="Bhṛgu Chakra">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Bhṛgu Chakra</h3>
        <p className="text-[10px] text-zinc-500">Natal inner circle · shared zodiac sectors · active natal grahas highlighted</p>
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div className="mx-auto w-full max-w-[720px]">
          <svg viewBox="0 0 720 720" role="img" aria-label="Natal chart with seven separate progression rings" className="h-auto w-full">
            {Array.from({ length: 12 }, (_, i) => {
              const a = CHAKRA_POINT(outer, i * 30);
              const label = CHAKRA_POINT(outer + 16, i * 30 + 15);
              return <g key={i}>
                <line x1={cx} y1={cx} x2={a.x} y2={a.y} stroke="#52525b" strokeWidth="1" />
                <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fill="#60a5fa" fontSize="11">{CHAKRA_SIGNS[i]}</text>
              </g>;
            })}
            <circle cx={cx} cy={cx} r={outer} fill="none" stroke="#71717a" strokeWidth="1.2" />
            {ringBodies.map((body, index) => {
              const radius = outer - (ringBodies.length - 1 - index) * ringWidth;
              const position = now.find(item => item.body === body);
              if (!position) return null;
              const progressingPoint = CHAKRA_POINT(radius, position.signIndex * 30 + position.degree);
              const activated = natal.filter(planet => relationOn(position.signIndex, planet.sign - 1));
              return <g key={body} data-chakra-ring={body}>
                <circle cx={cx} cy={cx} r={radius} fill="none" stroke={CHAKRA_COLORS[body]} strokeOpacity=".7" strokeWidth="2" />
                {activated.map(planet => {
                  const p = CHAKRA_POINT(radius, (planet.sign - 1) * 30 + planet.degree);
                  return <g key={planet.name} data-activated-natal={planet.name}>
                    <circle cx={p.x} cy={p.y} r="10" fill={CHAKRA_COLORS[body]} fillOpacity=".18" stroke={CHAKRA_COLORS[body]} strokeWidth="1.2" />
                    <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9" fontWeight="700" fill={CHAKRA_COLORS[body]}>{CHAKRA_GLYPHS[planet.name]}</text>
                  </g>;
                })}
                <circle cx={progressingPoint.x} cy={progressingPoint.y} r="6" fill={CHAKRA_COLORS[body]} stroke="#18181b" strokeWidth="1.5" />
                <text x={progressingPoint.x} y={progressingPoint.y - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={CHAKRA_COLORS[body]}>{CHAKRA_GLYPHS[body]}</text>
              </g>;
            })}
            <circle cx={cx} cy={cx} r={natalRadius} fill="#27272a" stroke="#fbbf24" strokeWidth="2" />
            {natal.map(planet => {
              // Natal grahas only need to be legible inside their zodiac house.
              // Do not use natal degrees here: conjunctions can overlap. Place each
              // house's grahas in evenly spaced slots around the house's midpoint.
              const inHouse = natal.filter(item => item.sign === planet.sign);
              const slot = inHouse.findIndex(item => item.name === planet.name);
              const angleOffset = (slot % 3 - 1) * 8;
              const radius = 88 + Math.floor(slot / 3) * 13;
              const p = CHAKRA_POINT(radius, (planet.sign - 1) * 30 + 15 + angleOffset);
              return <text key={planet.name} data-natal-house={planet.sign} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#fbbf24">{CHAKRA_GLYPHS[planet.name]}</text>;
            })}
            <text x={cx} y={cx + 5} textAnchor="middle" fontSize="12" fill="#fafafa">NATAL</text>
          </svg>
        </div>
        <aside className="space-y-1 text-xs">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Rings · inner → outer</div>
          <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-800"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Natal chart</div>
          {ringBodies.map(body => {
            const position = now.find(item => item.body === body);
            const activated = position ? natal.filter(planet => relationOn(position.signIndex, planet.sign - 1)) : [];
            return <div key={body} className="space-y-1 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHAKRA_COLORS[body] }} /><span className="font-medium">{code(body)}</span><span className="ml-auto text-zinc-500">{position ? SIGN_NAMES[position.signIndex] : '—'}</span></div>
              <div className="pl-4 text-[10px] text-zinc-500">Activates: {activated.length ? activated.map(planet => code(planet.name)).join(' · ') : '—'}</div>
            </div>;
          })}
          <p className="pt-1 text-[10px] leading-relaxed text-zinc-500">Highlights use the selected sign relationships: {relations.join(' · ')}. Shared radial divisions and sign labels are drawn once.</p>
        </aside>
      </div>
    </section>
  );
}

export default function ParayaProgressionPanel({ chart, birthDatetime, targetDate, calculationSettings, onSetTarget }: Props) {
  const t = useT();
  const language = useLanguage();
  const { code } = useGrahaNames();
  const [years, setYears] = useState(3);
  const [bodies, setBodies] = useState<readonly ParayaBody[]>(ALL_PARAYA_BODIES);
  const [relations, setRelations] = useState<readonly HitRelation[]>(PROGRESSION_RELATIONS);
  const [focus, setFocus] = useState<{ body: ParayaBody; natal: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const saturn = calculationSettings?.parayaSaturn ?? 'alternating';
  const rahu = calculationSettings?.parayaRahu ?? 'alternating';
  const retro = calculationSettings?.parayaRetro ?? 'previous';

  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const from = useMemo(() => parseTargetDateString(targetDate), [targetDate]);

  // Every hit of the seven in the range; the chips and the overview only choose among them.
  const hits = useMemo(() => {
    if (!birth || !from) return [];
    return findParayaHits({
      chart,
      birthTime: birth.getTime(),
      fromTime: from.getTime(),
      toTime: from.getTime() + years * JULIAN_YEAR_MS,
      relations: PROGRESSION_RELATIONS,
      options: { saturn, rahu, retro },
      bodies: ALL_PARAYA_BODIES,
    });
  }, [chart, birth, from, years, saturn, rahu, retro]);

  const chosen = useMemo(() => filterHits(hits, { bodies, relations }), [hits, bodies, relations]);
  const listed = useMemo(() => (focus ? filterHits(chosen, { bodies, relations, body: focus.body, natal: focus.natal }) : chosen), [chosen, focus, bodies, relations]);
  const cells = useMemo(() => overviewOf(chosen), [chosen]);
  const next = useMemo(() => nextHitOf(chosen), [chosen]);
  const months = useMemo(() => groupByMonth(listed), [listed]);

  // Where the progressing grahas stand at the target moment.
  const now = useMemo(() => {
    if (!birth || !from) return [];
    const age = Math.max(0, (from.getTime() - birth.getTime()) / JULIAN_YEAR_MS);
    return parayaPeriodsOf(chart, age, { saturn, rahu, retro }, true);
  }, [chart, birth, from, saturn, rahu, retro]);

  // The natal points: the sign and degree of each, for the sign a hit puts the progressing graha in.
  const natalAt = useMemo(() => {
    const points: Record<string, { sign: number; degree: number }> = { Asc: { sign: chart.ascendant.sign - 1, degree: chart.ascendant.degree } };
    for (const planet of chart.planets) points[planet.name] = { sign: planet.sign - 1, degree: planet.degree };
    return points;
  }, [chart]);

  const relationText = (relation: HitRelation) => (relation === 1 ? t('over natal') : `${ordinal(relation, language)} ${t('from natal')}`);
  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;
  const toggleBody = (body: ParayaBody) => {
    setBodies(current => (current.includes(body) ? current.filter(item => item !== body) : ALL_PARAYA_BODIES.filter(item => item === body || current.includes(item))));
    setFocus(null);
    setShowAll(false);
  };
  const toggleRelation = (relation: HitRelation) => {
    setRelations(current => (current.includes(relation) ? current.filter(item => item !== relation) : PROGRESSION_RELATIONS.filter(item => item === relation || current.includes(item))));
    setShowAll(false);
  };
  const monthName = (year: number, month: number) => new Date(year, month, 1).toLocaleDateString(language === 'fi' ? 'fi-FI' : 'en-GB', { month: 'long', year: 'numeric' });
  const setTarget = (time: number) => {
    const d = new Date(time);
    onSetTarget?.(`${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}.${pad2(d.getMinutes())}.00`);
  };

  const limited = limitGroups(months, showAll ? null : FIRST_ROWS);

  const progressingBodies = ALL_PARAYA_BODIES.filter(body => bodies.includes(body));

  return (
    <section aria-label={t('paraya progressions')} className="min-w-0 space-y-4">
      <div className="space-y-1">
        <Heading command="paraya.progressions">
          {t('The progressing grahas (Paraya), moved by age: where they stand at the target moment, and when each reaches a natal graha or the ascendant — the same degree in the 1st, 5th, 7th and 9th sign from it. Mars, Mercury and Venus are in beta.')}
        </Heading>
      </div>

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

      <BhriguChakra chart={chart} now={now} relations={relations} code={code} />

      {/* Where they stand and what comes next */}
      <ScrollTable minWidth="min-w-[440px]" headers={[t('Progressing'), t('Stands in'), t('House'), t('Next hit')]}>
        {progressingBodies.map(body => {
          const period = now.find(item => item.body === body);
          const hit = next.get(body);
          const asc = chart.ascendant.sign - 1;
          return (
            <tr key={body} className={ROW} data-progressing={body}>
              <td className={NAME_CELL}>{code(body)}{isBeta(body) && <span className="ml-1 text-[9px] font-normal text-zinc-400">β</span>}</td>
              <td className={`${VALUE_CELL} whitespace-nowrap`}>{period ? `${SIGN_NAMES[period.signIndex]} ${formatDegree(period.degree, 'minute')}` : '—'}</td>
              <td className={VALUE_CELL}>{period ? `H${((period.signIndex - asc + 12) % 12) + 1}` : '—'}</td>
              <td className={`${BODY_CELL} text-zinc-700 dark:text-zinc-300`}>
                {hit
                  ? <><span className="whitespace-nowrap font-bold">{formatHitDay(hit.time)}</span> {relationText(hit.relation)} <span className="font-bold">{code(hit.natal)}</span> <span className="text-zinc-400 dark:text-zinc-500">· {t('age')} {hit.ageYears.toFixed(1)}</span></>
                  : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
              </td>
            </tr>
          );
        })}
      </ScrollTable>

      {/* The seven against the ten natal points: the first hit of each pair in the range */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('first hit of each pair')}</div>
        <ScrollTable minWidth="min-w-[760px]" headers={['', ...PROGRESSION_NATAL.map(point => code(point))]}>
          {progressingBodies.map(body => (
            <tr key={body} className={ROW}>
              <td className={NAME_CELL}>{code(body)}</td>
              {PROGRESSION_NATAL.map(point => {
                const cell = cells.get(`${body}|${point}`);
                const active = focus?.body === body && focus.natal === point;
                return (
                  <td key={point} className={`${BODY_CELL} p-0`}>
                    {cell ? (
                      <button
                        type="button"
                        data-cell={`${body}|${point}`}
                        aria-pressed={active}
                        onClick={() => { setFocus(active ? null : { body, natal: point }); setShowAll(false); }}
                        title={`${code(body)} → ${code(point)}: ${cell.count}`}
                        className={`block w-full px-1.5 py-1.5 text-left text-[10px] leading-tight ${active ? 'bg-emerald-500 text-white dark:bg-green-600' : 'text-emerald-700 hover:bg-emerald-50 dark:text-green-400 dark:hover:bg-zinc-800'}`}
                      >
                        <span className="block whitespace-nowrap">{formatHitDayShort(cell.first.time)}</span>
                        {cell.count > 1 && <span className="block opacity-60">×{cell.count}</span>}
                      </button>
                    ) : <span className="block px-1.5 py-1.5 text-zinc-300 dark:text-zinc-600">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </ScrollTable>
      </div>

      {/* The hits in the order of time */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('hits in time order')} · {listed.length}</div>
          {focus && (
            <button type="button" onClick={() => setFocus(null)} className="rounded-md border border-emerald-500 px-2 py-1 text-[10px] font-mono text-emerald-700 dark:border-green-600 dark:text-green-400">
              {code(focus.body)} → {code(focus.natal)} ✕
            </button>
          )}
        </div>
        {listed.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No paraya hits in this period.')}</p>}
        {limited.map(group => (
          <div key={group.key} data-month={group.key}>
            <h4 className="border-b border-zinc-200 pb-0.5 text-[10px] font-mono font-bold capitalize text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              {monthName(group.year, group.month)} <span className="font-normal text-zinc-400 dark:text-zinc-600">· {group.hits.length}</span>
            </h4>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {group.rows.map(hit => {
                const natal = natalAt[hit.natal];
                const sign = natal ? (natal.sign + RELATION_OFFSET[hit.relation] / 30) % 12 : null;
                return (
                  <li key={`${hit.body}-${hit.natal}-${hit.relation}-${hit.time}`} className="flex items-center gap-2 py-1 text-[11px] font-mono" data-hit={`${hit.body}|${hit.natal}|${hit.relation}`}>
                    <span className="w-24 shrink-0 text-zinc-500 dark:text-zinc-400">{formatHitDay(hit.time)}</span>
                    <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                      <span className="font-bold text-violet-600 dark:text-violet-400">{code(hit.body)}</span>
                      {` ${relationText(hit.relation)} `}
                      <span className="font-bold">{code(hit.natal)}</span>
                      {natal && sign !== null && <span className="text-zinc-400 dark:text-zinc-500"> · {SIGN_ABBR[sign]} {formatDegree(natal.degree, 'minute')}</span>}
                      <span className="text-zinc-400 dark:text-zinc-500"> · {t('age')} {hit.ageYears.toFixed(1)}</span>
                    </span>
                    {onSetTarget && (
                      <button
                        type="button"
                        onClick={() => setTarget(hit.time)}
                        className="shrink-0 rounded border border-violet-300 px-2 py-1.5 text-[10px] text-violet-700 sm:px-1.5 sm:py-0.5 dark:border-violet-700 dark:text-violet-300"
                      >
                        {t('set target')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {listed.length > FIRST_ROWS && (
          <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
            {showAll ? t('show fewer') : `${t('show all')} ${listed.length}`}
          </button>
        )}
      </div>
    </section>
  );
}
