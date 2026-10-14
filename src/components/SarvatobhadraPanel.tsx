'use client';

import { useMemo, useState } from 'react';
import type { ChartData, PlanetData } from '@/types';
import {
  SBC_GRID, SBC_SIGN_CELLS, SBC_TITHI_CELLS,
  sbcCellOf, sbcMarkLayout, sbcNakshatra, tithiOf, vedicWeekday, weekdayGroup, type SbcCell, type SbcKind, type SbcPosition,
} from '@/lib/sarvatobhadra';
import { SIGN_ABBR } from '@/lib/signs';
import { formatDms } from '@/lib/specialSphutas';
import { useGrahaNames } from '@/lib/grahaNames';
import { useLanguage, useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  transitPlanets?: PlanetData[];
  nakshatraAdjust?: number;
};

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fi: ['sunnuntai', 'maanantai', 'tiistai', 'keskiviikko', 'torstai', 'perjantai', 'lauantai'],
};
const WEEKDAYS_SHORT = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fi: ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'],
};

/** What colours a square: the text of its kind, and the fill and the edge of a square that a role marks. */
const KIND_TEXT: Record<SbcKind, string> = {
  nakshatra: 'fill-emerald-700 dark:fill-green-400',
  vowel: 'fill-amber-700 dark:fill-amber-400',
  consonant: 'fill-pink-600 dark:fill-pink-400',
  sign: 'fill-blue-700 dark:fill-blue-400',
  tithi: 'fill-violet-600 dark:fill-violet-400',
};

type Role = 'janma' | 'moonSign' | 'lagnaSign' | 'tithi' | 'vara';
const ROLE_FILL: Record<Role, string> = {
  janma: 'fill-amber-200 dark:fill-amber-900/60',
  moonSign: 'fill-sky-200 dark:fill-sky-900/60',
  lagnaSign: 'fill-emerald-200 dark:fill-emerald-900/60',
  tithi: 'fill-violet-200 dark:fill-violet-900/60',
  vara: 'fill-violet-200 dark:fill-violet-900/60',
};
const ROLE_EDGE: Record<Role, string> = {
  janma: 'stroke-amber-500',
  moonSign: 'stroke-sky-500',
  lagnaSign: 'stroke-emerald-500',
  tithi: 'stroke-violet-500',
  vara: 'stroke-fuchsia-500',
};

interface Mark { name: string; label: string; retrograde: boolean; transit: boolean }

/**
 * The Sarvatobhadra chakra: the 28 nakṣatras round the edge, the vowels, consonants and signs inside and the
 * tithi groups with the weekdays in the middle, each graha in the square of its nakṣatra. The Moon's nakṣatra and
 * the squares of the Moon's sign, the Lagna's sign and the birth tithi and weekday are marked.
 */
export default function SarvatobhadraPanel({ chart, transitPlanets = [], nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const language = useLanguage();
  const { code, name: grahaFullName } = useGrahaNames();
  const [showTransit, setShowTransit] = useState(false);

  const moon = chart.planets.find(planet => planet.name === 'Moon');
  const sun = chart.planets.find(planet => planet.name === 'Sun');

  const model = useMemo(() => {
    // The grahas in their squares.
    const marks = new Map<string, Mark[]>();
    const put = (position: SbcPosition, mark: Mark) => {
      const key = `${position[0]}-${position[1]}`;
      marks.set(key, [...(marks.get(key) ?? []), mark]);
    };
    put(sbcCellOf(chart.ascendant.longitude, nakshatraAdjust), { name: 'Asc', label: code('Asc'), retrograde: false, transit: false });
    for (const planet of chart.planets.filter(item => GRAHAS.includes(item.name))) {
      put(sbcCellOf(planet.longitude, nakshatraAdjust), { name: planet.name, label: code(planet.name), retrograde: Boolean(planet.isRetrograde) && planet.name !== 'Rahu' && planet.name !== 'Ketu', transit: false });
    }
    if (showTransit) {
      for (const planet of transitPlanets.filter(item => GRAHAS.includes(item.name))) {
        put(sbcCellOf(planet.longitude, nakshatraAdjust), { name: planet.name, label: code(planet.name), retrograde: Boolean(planet.isRetrograde) && planet.name !== 'Rahu' && planet.name !== 'Ketu', transit: true });
      }
    }

    // The squares the birth marks.
    const roles = new Map<string, Role[]>();
    const mark = (position: SbcPosition | undefined, role: Role) => {
      if (!position) return;
      const key = `${position[0]}-${position[1]}`;
      roles.set(key, [...(roles.get(key) ?? []), role]);
    };
    const janma = moon ? sbcNakshatra(moon.longitude + nakshatraAdjust) : null;
    if (moon) mark(sbcCellOf(moon.longitude, nakshatraAdjust), 'janma');
    if (moon) mark(SBC_SIGN_CELLS[moon.sign], 'moonSign');
    mark(SBC_SIGN_CELLS[chart.ascendant.sign], 'lagnaSign');

    const tithi = moon && sun ? tithiOf(sun.longitude, moon.longitude) : null;
    if (tithi) mark(SBC_TITHI_CELLS[tithi.group], 'tithi');

    // The weekday of the birth as the Vedic day counts it (from sunrise).
    const debug = chart.debug;
    const parsed = debug?.inputDateTime ? /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(debug.inputDateTime) : null;
    const weekday = parsed
      ? vedicWeekday({ year: Number(parsed[1]), month: Number(parsed[2]), day: Number(parsed[3]) }, Number(parsed[4]) + Number(parsed[5]) / 60 + Number(parsed[6]) / 3600, debug?.sunriseLocalHours)
      : null;
    const vara = weekday === null ? null : weekdayGroup(weekday);
    if (vara) mark(SBC_TITHI_CELLS[vara], 'vara');

    return { marks, roles, janma, tithi, weekday, vara };
  }, [chart, transitPlanets, showTransit, nakshatraAdjust, moon, sun, code]);

  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  const renderCell = (cell: SbcCell, r: number, col: number) => {
    const key = `${r}-${col}`;
    const x = col * 100;
    const y = r * 100;
    const roles = model.roles.get(key) ?? [];
    const marks = model.marks.get(key) ?? [];
    const longest = Math.max(0, ...marks.map(item => item.label.length + (item.retrograde ? 1 : 0)));
    const layout = sbcMarkLayout(marks.length, longest);
    const lines: Mark[][] = [];
    for (let index = 0; index < marks.length; index += layout.perLine) lines.push(marks.slice(index, index + layout.perLine));
    const top = 40;

    return (
      <g key={key} data-sbc-cell={key} data-sbc-kind={cell.kind} data-sbc-label={cell.label}>
        <rect x={x} y={y} width={100} height={100} className={`${roles.length ? ROLE_FILL[roles[0]] : 'fill-white dark:fill-zinc-900'} stroke-zinc-400 dark:stroke-zinc-600`} strokeWidth={1.5} />
        {roles.length > 0 && <rect x={x + 4} y={y + 4} width={92} height={92} fill="none" className={ROLE_EDGE[roles[roles.length - 1]]} strokeWidth={4} />}
        {cell.kind === 'nakshatra' ? (
          <text x={x + 50} y={y + 26} textAnchor="middle" fontSize={20} fontWeight={600} className={KIND_TEXT.nakshatra}>{cell.label}</text>
        ) : cell.kind === 'tithi' ? (
          <>
            <text x={x + 50} y={y + 44} textAnchor="middle" fontSize={20} fontWeight={600} className={KIND_TEXT.tithi}>{cell.label}</text>
            <text x={x + 50} y={y + 68} textAnchor="middle" fontSize={15} className="fill-teal-700 dark:fill-teal-400">
              {(cell.weekdays ?? []).map(day => WEEKDAYS_SHORT[language][day]).join(' ')}
            </text>
          </>
        ) : (
          <text x={x + 50} y={y + 60} textAnchor="middle" fontSize={26} className={KIND_TEXT[cell.kind]}>{cell.label}</text>
        )}
        {lines.map((line, lineIndex) => line.map((item, index) => (
          <text
            key={`${item.transit ? 't' : 'n'}-${item.name}`}
            data-sbc-planet={item.name}
            data-sbc-transit={item.transit ? 'true' : undefined}
            x={x + (100 / (line.length + 1)) * (index + 1)}
            y={y + top + layout.lineHeight * (lineIndex + 0.85)}
            textAnchor="middle"
            fontSize={layout.size}
            fontWeight={700}
            fontStyle={item.retrograde ? 'italic' : 'normal'}
            className={item.transit ? 'fill-violet-600 dark:fill-violet-400' : item.name === 'Asc' ? 'fill-emerald-700 dark:fill-green-400' : 'fill-red-700 dark:fill-red-400'}
          >
            {item.label}{item.retrograde ? '℞' : ''}
          </text>
        )))}
      </g>
    );
  };

  const swatch = (role: Role) => <svg width="12" height="12" className="inline-block align-[-2px]" aria-hidden="true"><rect x="1" y="1" width="10" height="10" className={`${ROLE_FILL[role]} ${ROLE_EDGE[role]}`} strokeWidth={2} /></svg>;
  const paksha = model.tithi ? (model.tithi.tithi <= 15 ? 'Shukla' : 'Krishna') : '';
  const tithiNumber = model.tithi ? ((model.tithi.tithi - 1) % 15) + 1 : 0;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Sarvatobhadra chakra')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The 28 nakshatras (with Abhijit) round the edge, the vowels, consonants and signs inside and the tithi groups with the weekdays in the middle. Every graha stands in the square of its nakshatra.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button type="button" aria-pressed={showTransit} disabled={transitPlanets.length === 0} onClick={() => setShowTransit(value => !value)} className={`${chip(showTransit)} disabled:opacity-40`}>
          {t('Transit')}
        </button>
      </div>

      <div className="mx-auto w-full max-w-[640px]">
        <svg viewBox="-2 -2 904 904" role="img" aria-label={t('Sarvatobhadra chakra')} data-sbc="chart" className="h-auto w-full font-mono">
          {SBC_GRID.map((row, r) => row.map((cell, col) => renderCell(cell, r, col)))}
        </svg>
      </div>

      <ul className="space-y-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300" data-sbc="legend">
        {model.janma && <li>{swatch('janma')} {t('Janma nakshatra')}: <span className="font-bold">{model.janma}</span> <span className="text-zinc-400 dark:text-zinc-500">({grahaFullName('Moon')})</span></li>}
        {moon && <li>{swatch('moonSign')} {t('Moon sign')}: <span className="font-bold">{SIGN_ABBR[moon.sign - 1]}</span></li>}
        <li>{swatch('lagnaSign')} {t('Lagna sign')}: <span className="font-bold">{SIGN_ABBR[chart.ascendant.sign - 1]}</span> <span className="text-zinc-400 dark:text-zinc-500">({formatDms(chart.ascendant.degree)})</span></li>
        {model.tithi && <li>{swatch('tithi')} {t('Birth tithi')}: <span className="font-bold">{paksha} {tithiNumber}</span> · {model.tithi.group}</li>}
        {model.vara && model.weekday !== null && <li>{swatch('vara')} {t('Birth day')}: <span className="font-bold">{WEEKDAYS[language][model.weekday]}</span> · {model.vara}</li>}
      </ul>

      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('Abhijit is the stretch from 6°40′ to 10°53′20″ of Capricorn; the nakshatras follow the nakshatra zodiac of Settings. The weekday counts from sunrise.')}
      </p>
    </div>
  );
}
