'use client';

import { useMemo, useState } from 'react';
import type { ChartData, PlanetData } from '@/types';
import { KOTA_RINGS, kotaLayout, kotaNakshatra, kotaPada, kotaPalaAt, kotaSquareOf, kotaSwami, kotaZone, type KotaSquare } from '@/lib/kotaChakra';
import { dynamicBeneficStatus } from '@/lib/yogaCommon';
import { SBC_GRID, SBC_NAKSHATRA_CELLS, sbcMarkLayout } from '@/lib/sarvatobhadra';
import { useGrahaNames } from '@/lib/grahaNames';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  transitPlanets?: PlanetData[];
  nakshatraAdjust?: number;
};

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/** The squares from the outside in: what they are called, and how they are coloured. */
const RING_LABELS = ['Bahya (exterior)', 'Praakaara (wall)', 'Durgantara (interior)', 'Stambha (pillar)'] as const;
const RING_FILL = [
  'fill-rose-200 dark:fill-rose-950/70',
  'fill-orange-100 dark:fill-orange-950/60',
  'fill-lime-100 dark:fill-lime-950/50',
  'fill-green-200 dark:fill-green-900/60',
];

/** The square (row, column) of the 9 × 9 grid of a place in a ring: the squares of the rings are one step in from each other. */
function gridPosition(ring: number, slot: number): [number, number] {
  if (ring === 3) return [[3, 4], [4, 5], [5, 4], [4, 3]][slot] as [number, number];
  const lo = ring;
  const hi = 8 - ring;
  return [[lo, lo], [lo, 4], [lo, hi], [4, hi], [hi, hi], [hi, 4], [hi, lo], [4, lo]][slot] as [number, number];
}

const labelOf = (nakshatra: string) => {
  const [row, column] = SBC_NAKSHATRA_CELLS[nakshatra];
  return SBC_GRID[row][column].label;
};

interface Mark { name: string; label: string; retrograde: boolean; transit: boolean }

/**
 * The Kota Chakra: the 28 nakṣatras in four squares inside one another, counted from the Moon's nakṣatra at birth, with
 * the grahas in the squares of their nakṣatras, and the Kota Swāmī and Kota Pāla.
 */
export default function KotaChakraPanel({ chart, transitPlanets = [], nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const { code, name: grahaFullName } = useGrahaNames();
  const [showTransit, setShowTransit] = useState(false);
  // Where the count begins: the Moon's nakṣatra (JHora and the modern school) or Krittikā (the fort wheel of Agni Purāṇa 128).
  const [countFrom, setCountFrom] = useState<'janma' | 'krittika'>('janma');

  const moon = chart.planets.find(planet => planet.name === 'Moon');

  const model = useMemo(() => {
    if (!moon) return null;
    const birthStar = kotaNakshatra(moon.longitude, nakshatraAdjust);
    const layout = kotaLayout(countFrom === 'janma' ? birthStar : 'Krittika');
    const pada = kotaPada(moon.longitude, nakshatraAdjust);

    const isRetro = (planet: PlanetData) => Boolean(planet.isRetrograde) && planet.name !== 'Rahu' && planet.name !== 'Ketu';
    const marks: (Mark & { square: KotaSquare })[] = [];
    const add = (name: string, longitude: number, retrograde: boolean, transit: boolean) => {
      const square = kotaSquareOf(layout, kotaNakshatra(longitude, nakshatraAdjust));
      if (square) marks.push({ name, label: code(name), retrograde, transit, square });
    };
    add('Asc', chart.ascendant.longitude, false, false);
    for (const planet of chart.planets.filter(item => GRAHAS.includes(item.name))) add(planet.name, planet.longitude, isRetro(planet), false);
    if (showTransit) for (const planet of transitPlanets.filter(item => GRAHAS.includes(item.name))) add(planet.name, planet.longitude, isRetro(planet), true);

    const byNakshatra = new Map<string, Mark[]>();
    for (const mark of marks) byNakshatra.set(mark.square.nakshatra, [...(byNakshatra.get(mark.square.nakshatra) ?? []), mark]);

    // The reading: where the transiting grahas stand, in the heart of the fort or round it, benefics and malefics apart.
    const zones = (['heart', 'outer'] as const).map(zone => {
      const here = marks.filter(mark => mark.transit && kotaZone(mark.square.ring) === zone);
      const status = (mark: Mark) => dynamicBeneficStatus(mark.name, transitPlanets);
      return { zone, benefics: here.filter(mark => status(mark) === true), malefics: here.filter(mark => status(mark) === false) };
    });
    const swami = kotaSwami(moon.sign);
    const pala = kotaPalaAt(moon.longitude, nakshatraAdjust);
    const natalRing = (name: string) => marks.find(mark => !mark.transit && mark.name === name)?.square.ring ?? null;

    return { birthStar, pada, layout, marks, byNakshatra, swami, pala, zones, swamiRing: natalRing(swami), palaRing: natalRing(pala) };
  }, [chart, moon, transitPlanets, showTransit, nakshatraAdjust, code, countFrom]);

  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  if (!model) return null;

  const renderSquare = (square: KotaSquare) => {
    const [row, column] = gridPosition(square.ring, square.slot);
    const x = column * 100;
    const y = row * 100;
    const marks = model.byNakshatra.get(square.nakshatra) ?? [];
    const longest = Math.max(0, ...marks.map(item => item.label.length + (item.retrograde ? 1 : 0)));
    const layout = sbcMarkLayout(marks.length, longest);
    const lines: Mark[][] = [];
    for (let index = 0; index < marks.length; index += layout.perLine) lines.push(marks.slice(index, index + layout.perLine));
    const janma = square.nakshatra === model.birthStar;

    return (
      <g key={square.nakshatra} data-kota-square={square.nakshatra} data-kota-ring={square.ring} data-kota-place={square.place}>
        <rect x={x + 6} y={y + 6} width={88} height={88} rx={6} className={`${janma ? 'fill-amber-200 dark:fill-amber-900/60' : 'fill-white dark:fill-zinc-900'} stroke-zinc-400 dark:stroke-zinc-600`} strokeWidth={1.5} />
        {janma && <rect data-kota-janma="true" x={x + 10} y={y + 10} width={80} height={80} rx={4} fill="none" className="stroke-amber-500" strokeWidth={4} />}
        <text x={x + 50} y={y + 28} textAnchor="middle" fontSize={20} fontWeight={600} className="fill-emerald-700 dark:fill-green-400">{labelOf(square.nakshatra)}</text>
        {lines.map((line, lineIndex) => line.map((item, index) => (
          <text
            key={`${item.transit ? 't' : 'n'}-${item.name}`}
            data-kota-planet={item.name}
            data-kota-transit={item.transit ? 'true' : undefined}
            x={x + (100 / (line.length + 1)) * (index + 1)}
            y={y + 40 + layout.lineHeight * (lineIndex + 0.85)}
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

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Kota chakra')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The fort wheel: the 28 nakshatras (with Abhijit) in four squares inside one another, counted from the Moon’s nakshatra at birth. Every graha stands in the square of its nakshatra.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button type="button" aria-pressed={showTransit} disabled={transitPlanets.length === 0} onClick={() => setShowTransit(value => !value)} className={`${chip(showTransit)} disabled:opacity-40`}>
          {t('Transit')}
        </button>
        <span className="ml-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('count from')}</span>
        <button type="button" aria-pressed={countFrom === 'janma'} onClick={() => setCountFrom('janma')} className={chip(countFrom === 'janma')}>{t('Janma nakshatra')}</button>
        <button type="button" aria-pressed={countFrom === 'krittika'} onClick={() => setCountFrom('krittika')} title={t('The fort wheel of Agni Purana 128 begins with Krittika.')} className={chip(countFrom === 'krittika')}>{t('Krittika (Agni Purana)')}</button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-kota="lords">
        <span>{t('Kota Swami (fort lord)')}: <span className="font-bold text-emerald-700 dark:text-green-400" data-kota-swami={model.swami}>{grahaFullName(model.swami)}</span></span>
        <span>{t('Kota Pala (fort guard)')}: <span className="font-bold text-red-700 dark:text-red-400" data-kota-pala={model.pala}>{grahaFullName(model.pala)}</span></span>
      </div>

      <div className="mx-auto w-full max-w-[640px]">
        <svg viewBox="-2 -2 904 904" role="img" aria-label={t('Kota chakra')} data-kota="chart" className="h-auto w-full font-mono">
          {KOTA_RINGS.map((_, ring) => (
            <rect key={ring} x={ring * 100} y={ring * 100} width={900 - ring * 200} height={900 - ring * 200} className={`${RING_FILL[ring]} stroke-zinc-700 dark:stroke-zinc-400`} strokeWidth={ring === 0 ? 2 : 3} />
          ))}
          {model.layout.flat().map(renderSquare)}
        </svg>
      </div>

      <ul className="space-y-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300" data-kota="legend">
        {RING_LABELS.map((label, ring) => (
          <li key={label}>
            <svg width="12" height="12" className="inline-block align-[-2px]" aria-hidden="true"><rect x="1" y="1" width="10" height="10" className={`${RING_FILL[ring]} stroke-zinc-500`} strokeWidth={1.5} /></svg>{' '}
            {t(label)}
          </li>
        ))}
        <li>
          <svg width="12" height="12" className="inline-block align-[-2px]" aria-hidden="true"><rect x="1" y="1" width="10" height="10" className="fill-amber-200 stroke-amber-500 dark:fill-amber-900/60" strokeWidth={2} /></svg>{' '}
          {t('Janma nakshatra')}: <span className="font-bold">{model.birthStar}</span> <span className="text-zinc-400 dark:text-zinc-500">({t('pada')} {model.pada})</span>
        </li>
      </ul>

      <div data-kota="squares">
        <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Grahas in the squares')}</div>
        <ul className="space-y-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
          {model.marks.map(mark => (
            <li key={`${mark.transit ? 't' : 'n'}-${mark.name}`} data-kota-row={`${mark.transit ? 't' : 'n'}:${mark.name}`} className={mark.transit ? 'text-violet-700 dark:text-violet-300' : ''}>
              <span className="font-bold">{mark.name === 'Asc' ? grahaFullName('Asc') : grahaFullName(mark.name)}{mark.transit ? ` (${t('transit')})` : ''}</span>
              <span className="text-zinc-400 dark:text-zinc-500"> {labelOf(mark.square.nakshatra)}</span> · {t(RING_LABELS[mark.square.ring])}
            </li>
          ))}
        </ul>
      </div>

      <div data-kota="reading">
        <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Reading')}</div>
        <p className="mb-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The Stambha and the Durgantara are the heart of the fort, the Praakaara and the Bahya what surrounds it. As the modern school teaches it (K. K. Joshi, ed. K. N. Rao): benefics in the heart strengthen the fort and malefics there do the reverse; malefics outside are adverse circumstances and benefics outside improve them. It is read for the transiting grahas against the Moon’s nakshatra of birth. Not validated; the fort wheel of the Agni Purana is about war and has none of this.')}
        </p>
        {showTransit ? (
          <ul className="space-y-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
            {model.zones.map(({ zone, benefics, malefics }) => (
              <li key={zone} data-kota-zone={zone}>
                <span className="font-bold">{t(zone === 'heart' ? 'Heart (Stambha, Durgantara)' : 'Outside (Praakaara, Bahya)')}</span>
                {' — '}{t('benefics')}: <span className="text-emerald-700 dark:text-green-400">{benefics.length ? benefics.map(mark => mark.label).join(' ') : '—'}</span>
                {' · '}{t('malefics')}: <span className="text-red-700 dark:text-red-400">{malefics.length ? malefics.map(mark => mark.label).join(' ') : '—'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('Switch Transit on to read the transiting grahas against the natal Moon.')}</p>
        )}
        {model.swamiRing !== null && model.palaRing !== null && (
          <p className="mt-1 text-[10px] font-mono text-zinc-600 dark:text-zinc-300" data-kota="lords-place">
            {t('Kota Swami (fort lord)')}: {grahaFullName(model.swami)} — {t(RING_LABELS[model.swamiRing])} · {t('Kota Pala (fort guard)')}: {grahaFullName(model.pala)} — {t(RING_LABELS[model.palaRing])}
            {kotaZone(model.swamiRing) === 'heart' && model.palaRing === 0 && <span className="text-emerald-700 dark:text-green-400"> · {t('the Swami in the heart and the Pala outside, the arrangement taught as the best')}</span>}
          </p>
        )}
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Counted as benefic: Jupiter, Venus, Mercury unless it is with a malefic, and the Moon within 60° of the full Moon; as malefic: the Sun, Mars, Saturn, the nodes, Mercury with a malefic and the Moon within 60° of the new Moon.')}
        </p>
      </div>

      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('The Kota Swami is the lord of the Moon’s sign at birth (Mars for Scorpio, Saturn for Aquarius); the Kota Pala is the graha of the first letter of the name syllable of the Moon’s pada, by the table of JHora (a modern one: no classical text for it was found). Abhijit is the stretch from 6°40′ to 10°53′20″ of Capricorn and holds a graha that stands in it, which JHora does not; the nakshatras follow the nakshatra zodiac of Settings.')}
      </p>
    </div>
  );
}
