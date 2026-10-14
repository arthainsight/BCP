'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import {
  SUDARSHANA_DRAWING, SUDARSHANA_RINGS, jdToLocalParts, sudarshanaApplies, sudarshanaFacts, sudarshanaHouse, sudarshanaRings, sudarshanaSubPeriods, sudarshanaVerdict,
  type SudarshanaRing, type SudarshanaRingId,
} from '@/lib/sudarshana';
import { SIGN_ABBR } from '@/lib/signs';
import { useGrahaNames } from '@/lib/grahaNames';
import { fill, useT } from '@/lib/i18n';
import { Row, YearStepper, buildAnnualParams, fmtDate, fmtLocal, fmtOffset, useAnnualFetch, type LocalParts } from './annualShared';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate?: string;
  ianaTimezone?: string;
  calculationSettings?: CalculationSettings;
};

type YearResponse = {
  year: number;
  jd: number;
  local: LocalParts;
  tzOffset: number;
  completedAge: number;
  next: { year: number; jd: number; local: LocalParts; tzOffset: number };
};

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const RING_LABEL: Record<SudarshanaRingId, string> = { lagna: 'Lagna', moon: 'Moon', sun: 'Sun' };

/** The circle: the outside of the Sun ring, then the Moon ring and the Lagna ring (BPHS draws the Lagna's chart innermost), the hole in the middle. */
const RADII = [440, 335, 230, 125];
const CENTRE = 450;

const point = (radius: number, degrees: number) => {
  const angle = (degrees * Math.PI) / 180;
  return { x: CENTRE + radius * Math.cos(angle), y: CENTRE - radius * Math.sin(angle) };
};

/** House 1 is at the top, the houses follow anticlockwise as in the Indian charts: the middle of house h is at 90° + 30° (h − 1). */
const middleOf = (house: number) => 90 + (house - 1) * 30;

function wedge(inner: number, outer: number, house: number): string {
  const start = middleOf(house) - 15;
  const end = middleOf(house) + 15;
  const a = point(outer, start); const b = point(outer, end); const c = point(inner, end); const d = point(inner, start);
  return `M${a.x} ${a.y} A${outer} ${outer} 0 0 0 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 0 1 ${d.x} ${d.y} Z`;
}

/**
 * The Sudarśana Chakra: the chart counted from the Lagna, from the Moon and from the Sun, one inside another, with the
 * houses the Sudarśana daśā makes active in the year shown — the same house number in all three — and the twelve
 * months and twelve days of it.
 */
export default function SudarshanaPanel({ chart, birthDatetime, targetDate, ianaTimezone, calculationSettings }: Props) {
  const t = useT();
  const { code, name: grahaFullName } = useGrahaNames();
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  const query = buildAnnualParams({ chart, birthDatetime, ianaTimezone, calculationSettings, place: null, year, targetDate });
  const { data: shown, error, loading } = useAnnualFetch<YearResponse>('/api/sudarshana', query);

  const moon = chart.planets.find(planet => planet.name === 'Moon');
  const sun = chart.planets.find(planet => planet.name === 'Sun');
  const rings = useMemo(
    () => (moon && sun ? sudarshanaRings(chart.ascendant.sign, moon.sign, sun.sign, chart.planets.filter(planet => GRAHAS.includes(planet.name))) : null),
    [chart, moon, sun],
  );

  if (!query) return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{t('Birth date and place are needed for the Sudarshana chakra.')}</div>;
  if (!rings) return null;

  const age = shown?.completedAge;
  const yearHouse = age === undefined ? null : sudarshanaHouse(age);
  const months = shown && yearHouse ? sudarshanaSubPeriods(shown.jd, shown.next.jd, yearHouse) : [];
  const selected = month !== null && months[month] ? months[month] : null;
  const days = selected ? sudarshanaSubPeriods(selected.startJd, selected.endJd, selected.house) : [];
  const local = (jd: number) => jdToLocalParts(jd, shown?.tzOffset ?? 0);

  const renderCell = (ring: SudarshanaRing, ringIndex: number, house: number) => {
    const entry = ring.houses[house - 1];
    const radius = (RADII[ringIndex] + RADII[ringIndex + 1]) / 2;
    const middle = point(radius, middleOf(house));
    const names = entry.planets;
    const size = names.length <= 3 ? 17 : names.length <= 6 ? 14 : 11;
    const perLine = names.length <= 3 ? 3 : 4;
    const lines: string[][] = [];
    for (let index = 0; index < names.length; index += perLine) lines.push(names.slice(index, index + perLine));
    return (
      <g key={`${ring.id}-${house}`} data-sud-cell={`${ring.id}-${house}`} data-sud-sign={entry.sign}>
        <path d={wedge(RADII[ringIndex + 1], RADII[ringIndex], house)} className="fill-white stroke-zinc-400 dark:fill-zinc-900 dark:stroke-zinc-600" strokeWidth={1.5} />
        {yearHouse === house && <path data-sud-year={ring.id} d={wedge(RADII[ringIndex + 1], RADII[ringIndex], house)} className="fill-amber-300/60 stroke-amber-500 dark:fill-amber-500/35" strokeWidth={3} pointerEvents="none" />}
        {selected && selected.house === house && <path data-sud-month={ring.id} d={wedge(RADII[ringIndex + 1] + 6, RADII[ringIndex] - 6, house)} fill="none" className="stroke-rose-500" strokeWidth={4} pointerEvents="none" />}
        <text x={middle.x} y={middle.y - 14} textAnchor="middle" fontSize={22} fontWeight={600} className="fill-blue-700 dark:fill-blue-400">{SIGN_ABBR[entry.sign - 1]}</text>
        {lines.map((line, lineIndex) => (
          <text key={lineIndex} x={middle.x} y={middle.y + 8 + lineIndex * (size + 3)} textAnchor="middle" fontSize={size} fontWeight={700} className="fill-red-700 dark:fill-red-400">
            {line.map(name => code(name)).join(' ')}
          </text>
        ))}
      </g>
    );
  };

  const chip = (on: boolean) =>
    `rounded-md border px-2 py-1 text-[10px] font-mono ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{t('Sudarshana chakra')}</div>
        <div className="mt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The chart counted from the Lagna, from the Moon and from the Sun, one inside another. In the Sudarshana dasha each year of age makes the next house active, the same house number in all three: the 1st in the first year, the 2nd in the second, round to the 1st again in the 13th. A year is cut in twelve months and a month in twelve days in the same order.')}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <YearStepper shownYear={shown?.year} year={year} onChange={(value) => { setYear(value); setMonth(null); }} />
        {loading && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('calculating…')}</span>}
      </div>

      {error && <div className="text-xs font-mono text-red-600 dark:text-red-400">{error}</div>}

      <div className="mx-auto w-full max-w-[640px]">
        <svg viewBox="-2 -2 904 904" role="img" aria-label={t('Sudarshana chakra')} data-sud="chart" className="h-auto w-full font-mono">
          {SUDARSHANA_DRAWING.map((id, ringIndex) => {
            const ring = rings.find(item => item.id === id)!;
            return Array.from({ length: 12 }, (_, index) => renderCell(ring, ringIndex, index + 1));
          })}
          {Array.from({ length: 12 }, (_, index) => {
            const label = point(RADII[0] - 11, middleOf(index + 1));
            return <text key={index} x={label.x} y={label.y + 5} textAnchor="middle" fontSize={14} className="fill-zinc-400 dark:fill-zinc-500">{index + 1}</text>;
          })}
          <circle cx={CENTRE} cy={CENTRE} r={RADII[3]} className="fill-zinc-50 stroke-zinc-400 dark:fill-zinc-800 dark:stroke-zinc-600" strokeWidth={1.5} />
          <text x={CENTRE} y={CENTRE - 22} textAnchor="middle" fontSize={22} fontWeight={600} className="fill-zinc-700 dark:fill-zinc-200">{t('Sudarshana')}</text>
          {age !== undefined && <text x={CENTRE} y={CENTRE + 8} textAnchor="middle" fontSize={18} className="fill-zinc-500 dark:fill-zinc-400" data-sud="centre-age">{fill(t('age {age}'), { age })}</text>}
          {yearHouse && <text x={CENTRE} y={CENTRE + 34} textAnchor="middle" fontSize={18} className="fill-amber-700 dark:fill-amber-400" data-sud="centre-house">{fill(t('house {house}'), { house: yearHouse })}</text>}
        </svg>
      </div>

      <ul className="space-y-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300" data-sud="rings">
        {SUDARSHANA_RINGS.map(id => {
          const ring = rings.find(item => item.id === id)!;
          return <li key={id}>{t(RING_LABEL[id])}: <span className="font-bold">{SIGN_ABBR[ring.referenceSign - 1]}</span> — {t(id === 'sun' ? 'outer ring' : id === 'moon' ? 'middle ring' : 'inner ring')}</li>;
        })}
      </ul>

      {!sudarshanaApplies(chart.ascendant.sign, moon!.sign, sun!.sign) && (
        <p data-sud="not-applicable" className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
          {t('The Lagna, the Moon and the Sun are not in three different signs, so BPHS says to judge from the Lagna chart alone.')}
        </p>
      )}

      {shown && yearHouse && (
        <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          <div className="space-y-2" data-sud-year-dates>
            <Row label={t('begins')} value={`${fmtLocal(shown.local)} (${fmtOffset(shown.tzOffset)})`} />
            <Row label={t('ends')} value={`${fmtLocal(shown.next.local)} (${fmtOffset(shown.next.tzOffset)})`} />
            <Row label={t('year')} value={fill(t('{age} completed · house {house} active'), { age: shown.completedAge, house: yearHouse })} />
          </div>

          <div data-sud="houses">
            <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{fill(t('The active house {house} in the three charts'), { house: yearHouse })}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    <th className="py-1 pr-3 font-normal">{t('chart')}</th>
                    <th className="py-1 pr-3 font-normal">{t('sign')}</th>
                    <th className="py-1 pr-3 font-normal">{t('lord')}</th>
                    <th className="py-1 pr-3 font-normal">{t('in the sign')}</th>
                    <th className="py-1 pr-3 font-normal">{t('aspecting')}</th>
                    <th className="py-1 font-normal">{t('verdict')}</th>
                  </tr>
                </thead>
                <tbody>
                  {SUDARSHANA_RINGS.map(id => {
                    const ring = rings.find(item => item.id === id)!;
                    const entry = ring.houses[yearHouse - 1];
                    const facts = sudarshanaFacts(ring, yearHouse, chart.planets);
                    const verdict = sudarshanaVerdict(ring, yearHouse, chart.planets);
                    return (
                      <tr key={id} data-sud-row={id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="py-1 pr-3 text-zinc-500">{t(RING_LABEL[id])}</td>
                        <td className="py-1 pr-3 font-bold">{SIGN_ABBR[entry.sign - 1]}</td>
                        <td className="py-1 pr-3">
                          {grahaFullName(entry.lord)}
                          {facts.lordPlace && <span className="text-zinc-400 dark:text-zinc-500"> → {SIGN_ABBR[facts.lordPlace.sign - 1]} ({fill(t('house {house}'), { house: facts.lordPlace.house })})</span>}
                        </td>
                        <td className="py-1 pr-3">{facts.occupants.length ? facts.occupants.map(name => code(name)).join(' ') : '—'}</td>
                        <td className="py-1 pr-3">{facts.aspecting.length ? facts.aspecting.map(name => code(name)).join(' ') : '—'}</td>
                        <td className="py-1" data-sud-verdict={verdict.nature} data-sud-basis={verdict.basis}>
                          <span className={`font-bold ${verdict.nature === 'benefic' ? 'text-emerald-700 dark:text-green-400' : verdict.nature === 'malefic' ? 'text-red-600 dark:text-red-400' : verdict.nature === 'mixed' ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>{t(verdict.nature)}</span>
                          {verdict.nature !== 'none' && <span className="text-zinc-400 dark:text-zinc-500"> {t(verdict.basis === 'occupants' ? 'by the occupants' : verdict.basis === 'aspects' ? 'by the aspects' : 'by the lord')}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div data-sud="months">
            <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('The twelve months of the year')}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    <th className="py-1 pr-3 font-normal">#</th>
                    <th className="py-1 pr-3 font-normal">{t('from')}</th>
                    <th className="py-1 pr-3 font-normal">{t('house')}</th>
                    <th className="py-1 font-normal">{t('signs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((item, index) => (
                    <tr key={index} data-sud-month-row={index + 1} aria-selected={month === index} onClick={() => setMonth(current => (current === index ? null : index))} className={`cursor-pointer border-t border-zinc-100 dark:border-zinc-800 ${month === index ? 'bg-rose-50 dark:bg-rose-950/30' : ''}`}>
                      <td className="py-1 pr-3 text-zinc-500">{index + 1}</td>
                      <td className="py-1 pr-3 tabular-nums">{fmtDate(local(item.startJd))}</td>
                      <td className="py-1 pr-3 font-bold">{item.house}</td>
                      <td className="py-1">{SUDARSHANA_RINGS.map(id => SIGN_ABBR[rings.find(ring => ring.id === id)!.houses[item.house - 1].sign - 1]).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Choose a month to see its twelve days.')}</p>
          </div>

          {selected && (
            <div data-sud="days">
              <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{fill(t('The twelve days of month {month}'), { month: (month ?? 0) + 1 })}</div>
              <div className="flex flex-wrap gap-1">
                {days.map((day, index) => (
                  <span key={index} data-sud-day-row={index + 1} className={chip(false)}>
                    {fmtDate(local(day.startJd))} · {t('house')} {day.house}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('A year of age runs from one solar return to the next (the Sun back at its natal sidereal longitude), the first from birth; the months and days are equal parts of it. BPHS does not say what a year is; this is the choice made here, as for the annual charts. The aspects are those of Parashara: the 7th from every graha, and the special aspects of Mars, Jupiter, Saturn and the nodes.')}
        <br />
        {t('The verdict follows BPHS 74: the grahas in the house decide, benefics against malefics (the Sun is a benefic only in the 1st house of a ring, a malefic in its exaltation sign does no harm); with none, the grahas that aspect it; with none, its lord. The natal grahas are used. The adjustment by the Saptavarga, the check against the Ashtakavarga and the grahas at the start of the year are not taken into account, and BPHS gives no way of combining the three charts, so none is made.')}
      </p>
    </div>
  );
}
