'use client';

import { useEffect, useRef, useState } from 'react';
import { useHydrated } from '@/lib/useHydrated';
import { useTheme } from 'next-themes';
import { PlanetData, SpecialLagna } from '@/types';
import { type DegreePrecision, formatDegree } from '@/lib/formatDegree';
import type { NadiParayaHouseActivation, ParayaBody } from '@/lib/bnn/nadiParaya';
import { normalizeDegrees } from '@/lib/angles';
import { FILL_MAX_WIDTH, useChartFill } from './chartFill';
import { LegendEntry, dashaMark, type ChartLayerControl, type ChartLayerKey, type DashaLordMarks } from './chartLayers';
import { layoutHouseLabels, type LabelToken } from '@/lib/chartLabelLayout';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];
const SPECIAL_LAGNA_COLOR = '#d97706';
const TRANSIT_COLOR = '#f43f5e';

const BNN_MAJOR_LIGHT = '#ea580c';
const BNN_MAJOR_DARK  = '#f97316';
const BNN_MINOR_LIGHT = '#7c3aed';
const BNN_MINOR_DARK  = '#a78bfa';
const PARAYA_COLORS: Record<ParayaBody, string> = {
  Jupiter: '#92400e', Saturn: '#1d4ed8', Rahu: '#6d28d9', Ketu: '#c2410c',
};
const PARAYA_CODES: Record<ParayaBody, string> = { Jupiter: 'Ju', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  ascendantSign: number;
  /** Degree of the ascendant within its sign; shown in the 1st house when given. */
  ascendantDegree?: number;
  planets: PlanetData[];
  specialLagnas?: SpecialLagna[];
  transitPlanets?: PlanetData[];
  showNatalPlanets?: boolean;
  showTransitPlanets?: boolean;
  showSigns?: boolean;
  degreePrecision?: DegreePrecision;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  showOuterPlanets?: boolean;
  showSpecialLagnas?: boolean;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  bnnMajorHouse?: number;
  bnnMinorHouse?: number;
  nadiParayaHouses?: NadiParayaHouseActivation[];
  legendLayers?: { bcp?: boolean; bnn?: boolean; transit?: boolean };
  /** Makes the layer entries in the legend clickable switches. */
  layerControls?: ChartLayerControl[];
  /** Running dasha lords to mark on the natal planets. */
  dashaLords?: DashaLordMarks | null;
  /** Small-chart mode for side-by-side grids: tighter cells, no legend. */
  compact?: boolean;
  /** Natal planet drawn highlighted, by name. */
  highlightPlanet?: string | null;
  /** Called with a natal planet's name when its label is clicked. */
  onPlanetClick?: (name: string) => void;
}

// Grid gap (gap-1), cell padding (p-1.5) and the sign / house header plus its
// margin, in px. Labels are fitted to what is left of each cell.
const GRID_GAP = 4;
const CELL_PADDING = 6;
const CELL_HEADER = 14;
const COMPACT_CELL_PADDING = 2;
const COMPACT_CELL_HEADER = 9;
// Grid width before it is measured: a 360px phone.
const DEFAULT_GRID_WIDTH = 328;

const SIGN_NAMES = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
  Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl',
};
const NAK_ABBR = [
  'Asw', 'Bha', 'Krt', 'Roh', 'Mrg', 'Ard',
  'Pun', 'Pus', 'Asl', 'Mag', 'PFa', 'UFa',
  'Has', 'Cit', 'Swa', 'Vis', 'Anu', 'Jye',
  'Mul', 'PAs', 'UAs', 'Sra', 'Dha', 'Sat',
  'PBh', 'UBh', 'Rev',
];

const GRID: (number | null)[] = [
  12, 1, 2, 3,
  11, null, null, 4,
  10, null, null, 5,
  9, 8, 7, 6,
];

function filterOuter(planets: PlanetData[], showOuter?: boolean) {
  return showOuter ? planets : planets.filter((p) => !OUTER_PLANETS.includes(p.name));
}

function getHouse(sign: number, ascendantSign: number): number {
  return ((sign - ascendantSign + 12) % 12) + 1;
}

function getNakAbbr(longitude: number): string {
  const idx = Math.floor(longitude / (40 / 3));
  return NAK_ABBR[Math.min(idx, 26)] ?? '';
}

function getCellClass(house: number, year: number, month: number): string {
  const both = house === year && house === month;
  if (both) return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700';
  if (house === year) return 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700';
  if (house === month) return 'bg-emerald-100 dark:bg-green-900/30 border-emerald-300 dark:border-green-700';
  return 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700';
}

function getPlanetLabel(
  planet: PlanetData,
  isTransit: boolean,
  degreePrecision: DegreePrecision,
  showNakshatra: boolean,
  showCharaKaraka: boolean,
  karakaByPlanet: Record<string, string>,
  nakshatraAdjust: number,
  mark = '',
): string {
  const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);
  const retroSuffix = !isTransit && planet.isRetrograde ? '℞' : '';
  const parts = [code + retroSuffix + mark];
  if (degreePrecision !== 'off') parts.push(formatDegree(planet.degree, degreePrecision));
  if (!isTransit) {
    if (showCharaKaraka) {
      const karaka = karakaByPlanet[planet.name];
      if (karaka) parts.push(karaka);
    }
    if (showNakshatra) parts.push(getNakAbbr(normalizeDegrees(planet.longitude + nakshatraAdjust)));
  }
  return parts.join(' ');
}

function PlanetSpan({ token, highlightPlanet, onPlanetClick }: {
  token: LabelToken;
  highlightPlanet: string | null;
  onPlanetClick?: (name: string) => void;
}) {
  const planetName = token.group === 'natal' ? token.key.split('-')[1] : null;
  const highlighted = planetName !== null && planetName === highlightPlanet;
  const clickable = planetName !== null && onPlanetClick !== undefined;
  const className = highlighted ? 'text-cyan-600 dark:text-cyan-400 underline'
    : token.group === 'asc' ? 'text-emerald-700 dark:text-green-400'
    : token.group === 'special' ? 'font-semibold'
    : undefined;
  const style = highlighted ? undefined
    : token.group === 'transit' ? { color: TRANSIT_COLOR }
    : token.group === 'special' ? { color: SPECIAL_LAGNA_COLOR, opacity: 0.85 }
    : undefined;
  return (
    <span
      className={`${className ?? ''}${clickable ? ' cursor-pointer' : ''}`}
      style={style}
      onClick={clickable ? () => onPlanetClick(planetName) : undefined}
    >
      {token.text}
    </span>
  );
}

export default function SouthIndianChart({
  activeYearHouse,
  activeMonthHouse,
  ascendantSign,
  ascendantDegree,
  planets,
  specialLagnas = [],
  transitPlanets = [],
  showNatalPlanets = true,
  showTransitPlanets = false,
  showSigns = true,
  degreePrecision = 'off' as DegreePrecision,
  showCharaKaraka = false,
  showNakshatra = false,
  showOuterPlanets = false,
  showSpecialLagnas = false,
  karakaByPlanet = {},
  nakshatraAdjust = 0,
  bnnMajorHouse = 0,
  bnnMinorHouse = 0,
  nadiParayaHouses = [],
  legendLayers,
  layerControls,
  dashaLords = null,
  compact = false,
  highlightPlanet = null,
  onPlanetClick,
}: Props) {
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const fill = useChartFill();
  const isDark = !hydrated || resolvedTheme === 'dark';

  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(DEFAULT_GRID_WIDTH);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => setGridWidth(entries[0].contentRect.width));
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  const bnnMajColor = isDark ? BNN_MAJOR_DARK : BNN_MAJOR_LIGHT;
  const bnnMinColor = isDark ? BNN_MINOR_DARK : BNN_MINOR_LIGHT;

  type MergedPlanet = PlanetData & { isTransit: boolean };
  const bySign: Record<number, MergedPlanet[]> = {};

  const natal = filterOuter(planets, showOuterPlanets);
  const transits = filterOuter(transitPlanets, showOuterPlanets);

  if (showNatalPlanets) {
    natal.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: false });
    });
  }

  if (showTransitPlanets) {
    transits.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: true });
    });
  }

  const specialBySign: Record<number, SpecialLagna[]> = {};
  if (showSpecialLagnas) {
    specialLagnas.forEach((sl) => {
      if (!specialBySign[sl.sign]) specialBySign[sl.sign] = [];
      specialBySign[sl.sign].push(sl);
    });
  }

  const hasBnn = bnnMajorHouse > 0 || bnnMinorHouse > 0;
  const hasParaya = nadiParayaHouses.length > 0;
  const control = (key: ChartLayerKey) => layerControls?.find(c => c.key === key);
  const hasControls = (layerControls?.length ?? 0) > 0;

  const cellSize = (gridWidth - 3 * GRID_GAP) / 4;
  const padding = compact ? COMPACT_CELL_PADDING : CELL_PADDING;
  const contentWidth = cellSize - 2 * padding;
  const contentHeight = cellSize - 2 * padding - (compact ? COMPACT_CELL_HEADER : CELL_HEADER);

  return (
    <div className={fill ? 'w-full mx-auto' : 'w-full max-w-[520px] mx-auto'} style={fill ? { maxWidth: FILL_MAX_WIDTH } : undefined}>
      <div
        ref={gridRef}
        className="grid gap-1 aspect-square"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        {GRID.map((sign, idx) => {
          if (!sign) {
            return <div key={`empty-${idx}`} className="w-full h-full min-w-0 min-h-0 border border-transparent" aria-hidden="true" />;
          }

          const house = getHouse(sign, ascendantSign);
          const planetsHere = bySign[sign] ?? [];
          const specialHere = specialBySign[sign] ?? [];

          const isBnnMaj = bnnMajorHouse > 0 && house === bnnMajorHouse;
          const isBnnMin = bnnMinorHouse > 0 && house === bnnMinorHouse;
          const parayaHere = nadiParayaHouses.filter(activation => activation.house === house);

          const tokens: LabelToken[] = [];
          if (sign === ascendantSign) {
            tokens.push({ key: 'asc', group: 'asc', text: ascendantDegree !== undefined ? `ASC ${formatDegree(ascendantDegree, degreePrecision === 'off' ? 'minute' : degreePrecision)}` : 'ASC' });
          }
          parayaHere.forEach(activation => tokens.push({ key: `paraya-${activation.body}`, group: 'paraya', text: `${PARAYA_CODES[activation.body]} ${activation.degree.toFixed(1)}°` }));
          planetsHere.forEach((p, index) => tokens.push({
            key: `${p.isTransit ? 'tr' : 'na'}-${p.name}-${index}`,
            group: p.isTransit ? 'transit' : 'natal',
            text: getPlanetLabel(p, p.isTransit, degreePrecision, showNakshatra, showCharaKaraka, karakaByPlanet, nakshatraAdjust, p.isTransit ? '' : dashaMark(p.name, dashaLords)),
          }));
          specialHere.forEach((sl, index) => tokens.push({ key: `sl-${sl.name}-${index}`, group: 'special', text: sl.name }));
          const hasBnnLabel = (bnnMajorHouse > 0 && house === bnnMajorHouse) || (bnnMinorHouse > 0 && house === bnnMinorHouse);
          const cellHeight = contentHeight - (hasBnnLabel ? 10 : 0);
          const layout = layoutHouseLabels(
            tokens,
            { polygon: [[0, 0], [contentWidth, 0], [contentWidth, cellHeight], [0, cellHeight]], anchorY: 0 },
            { maxFontSize: compact ? 12 : 11, minFontSize: 6, padding: 0 },
          );

          // BNN background tint — only when BCP is not active on this house
          const isBcpActive = house === activeYearHouse || house === activeMonthHouse;
          const bnnBg = !isBcpActive
            ? (isBnnMaj && isBnnMin)
              ? isDark ? 'rgba(249,115,22,0.18)' : 'rgba(234,88,12,0.12)'
              : isBnnMaj
              ? isDark ? 'rgba(249,115,22,0.14)' : 'rgba(234,88,12,0.09)'
              : isBnnMin
              ? isDark ? 'rgba(139,92,246,0.13)' : 'rgba(124,58,237,0.07)'
              : undefined
            : undefined;

          const bnnBothLabel = isBnnMaj && isBnnMin;

          return (
            <div
              key={sign}
              className={`relative w-full h-full min-w-0 min-h-0 overflow-hidden rounded-md border font-mono ${compact ? 'p-0.5' : 'p-1.5'} ${getCellClass(house, activeYearHouse, activeMonthHouse)}`}
              style={bnnBg ? { backgroundColor: bnnBg } : undefined}
            >
              {/* BNN Major: solid orange border overlay */}
              {isBnnMaj && (
                <div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{ border: `2px solid ${bnnMajColor}`, zIndex: 10 }}
                />
              )}
              {/* BNN Minor: dashed violet border overlay */}
              {isBnnMin && (
                <div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{ border: `2px dashed ${bnnMinColor}`, zIndex: 11 }}
                />
              )}
              <div className={`flex items-start justify-between gap-1 leading-none text-zinc-500 dark:text-zinc-400 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
                <span>{showSigns ? SIGN_NAMES[sign] : ''}</span>
                {!compact && <span className="text-zinc-400 dark:text-zinc-600">H{house}</span>}
              </div>

              <div className={`${compact ? 'mt-px' : 'mt-1'} font-bold leading-[1.2] text-zinc-800 dark:text-zinc-100`}>
                {layout.rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="whitespace-nowrap" style={{ fontSize: `${row.fontSize}px` }}>
                    {row.tokens.map((token, index) => (
                      <span key={token.key}>
                        {index > 0 ? ' ' : ''}
                        {token.group === 'paraya' ? (
                          <span
                            className="rounded-sm px-0.5 font-black text-white"
                            style={{ backgroundColor: PARAYA_COLORS[token.key.slice('paraya-'.length) as ParayaBody], textShadow: '0 1px 1px rgba(0,0,0,0.45)' }}
                          >
                            {token.text}
                          </span>
                        ) : (
                          <PlanetSpan
                            token={token}
                            highlightPlanet={highlightPlanet}
                            onPlanetClick={onPlanetClick}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                ))}
                {/* BNN labels */}
                {bnnBothLabel ? (
                  <span className="truncate text-[8px] leading-tight font-bold" style={{ color: isDark ? '#e879f9' : '#a21caf' }}>
                    BNN Maj+Min
                  </span>
                ) : (
                  <>
                    {isBnnMaj && (
                      <span className="truncate text-[8px] leading-tight font-bold" style={{ color: bnnMajColor }}>
                        BNN Maj
                      </span>
                    )}
                    {isBnnMin && (
                      <span className="truncate text-[8px] leading-tight font-bold" style={{ color: bnnMinColor }}>
                        BNN Min
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (activeYearHouse > 0 || activeMonthHouse > 0 || showTransitPlanets || showSpecialLagnas || hasBnn || hasParaya || hasControls || dashaLords) && (
        <div className="mt-3 flex justify-center gap-4 text-[11px] font-mono flex-wrap">
          {control('bcp') && !(activeYearHouse > 0 || activeMonthHouse > 0) && <LegendEntry control={control('bcp')} style={{ color: isDark ? '#22d3ee' : '#0891b2' }}>■ BCP</LegendEntry>}
          {(activeYearHouse > 0 || activeMonthHouse > 0) && legendLayers?.bcp !== false && (
            <LegendEntry control={control('bcp')}><span className="text-cyan-600 dark:text-cyan-400">■ BCP Year</span> <span className="text-emerald-700 dark:text-green-400">■ Month</span> <span className="text-purple-600 dark:text-purple-400">■ Both</span></LegendEntry>
          )}
          {(control('bnnMajor') || (bnnMajorHouse > 0 && legendLayers?.bnn !== false)) && <LegendEntry control={control('bnnMajor')} style={{ color: bnnMajColor }}>■ BNN Major</LegendEntry>}
          {(control('bnnMinor') || (bnnMinorHouse > 0 && legendLayers?.bnn !== false)) && <LegendEntry control={control('bnnMinor')} style={{ color: bnnMinColor }}>╌ BNN Minor</LegendEntry>}
          {(control('paraya') || hasParaya) && <LegendEntry control={control('paraya')}><span style={{ color: PARAYA_COLORS.Jupiter }}>Ju</span> <span style={{ color: PARAYA_COLORS.Saturn }}>Sa</span> <span style={{ color: PARAYA_COLORS.Rahu }}>Ra</span> <span style={{ color: PARAYA_COLORS.Ketu }}>Ke</span> Paraya</LegendEntry>}
          {(control('dasha') || dashaLords) && <LegendEntry control={control('dasha')} className="text-zinc-600 dark:text-zinc-300">ᴹᴬ {dashaLords ? `${PLANET_CODES[dashaLords.md]}–${PLANET_CODES[dashaLords.ad]}` : 'Daśā'}</LegendEntry>}
          {(control('transit') || (showTransitPlanets && legendLayers?.transit !== false)) && <LegendEntry control={control('transit')} style={{ color: TRANSIT_COLOR }}>■ Transit</LegendEntry>}
          {showSpecialLagnas && <span style={{ color: SPECIAL_LAGNA_COLOR }} className="font-semibold">■ Special</span>}
        </div>
      )}
    </div>
  );
}
