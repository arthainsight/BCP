'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useHydrated } from '@/lib/useHydrated';
import { useTheme } from 'next-themes';
import { PlanetData, SpecialLagna } from '@/types';
import { type DegreePrecision, formatDegree } from '@/lib/formatDegree';
import type { NadiParayaHouseActivation, ParayaBody } from '@/lib/bnn/nadiParaya';
import { normalizeDegrees } from '@/lib/angles';
import { FILL_MAX_WIDTH, useChartFill } from './chartFill';
import { useGrahaNames } from '@/lib/grahaNames';
import { dashaHouseBorders, dashaMark, dignityColor, type DashaLordMarks } from './chartLayers';
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
  /** Running dasha lords to mark on the natal planets. */
  dashaLords?: DashaLordMarks | null;
  /** Colours natal planets by dignity in their sign (used in the Varga grid). */
  colorByDignity?: boolean;
  /** Small-chart mode for side-by-side grids: tighter cells */
  compact?: boolean;
  /** Natal planet drawn highlighted, by name. */
  highlightPlanet?: string | null;
  /** Called with a natal planet's name when its label is clicked. */
  onPlanetClick?: (name: string) => void;
  /** Selected body (natal or transit) drawn highlighted. Kind-aware sibling of `highlightPlanet`. */
  selectedPlanet?: { kind: 'natal' | 'transit'; name: string } | null;
  /** Called with the kind and name of any natal or transit label that is clicked. */
  onPlanetSelect?: (selection: { kind: 'natal' | 'transit'; name: string }) => void;
  /** Drawn in the empty middle of the chart, over its four central cells; the chart may then be wider. */
  centerContent?: ReactNode;
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
  codeOf: (name: string) => string = name => name.slice(0, 2),
): string {
  const code = codeOf(planet.name);
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

function PlanetSpan({ token, highlightPlanet, onPlanetClick, selectedPlanet, onPlanetSelect, dignity }: {
  token: LabelToken;
  highlightPlanet: string | null;
  onPlanetClick?: (name: string) => void;
  selectedPlanet?: { kind: 'natal' | 'transit'; name: string } | null;
  onPlanetSelect?: (selection: { kind: 'natal' | 'transit'; name: string }) => void;
  /** Colour for the planet's dignity, when dignities are shown. */
  dignity?: string;
}) {
  // A body is selectable when it is a natal or transit planet and a select handler exists.
  const tokenKind = token.group === 'natal' ? 'natal' : token.group === 'transit' ? 'transit' : null;
  const tokenName = tokenKind
    ? tokenKind === 'natal' ? token.key.split('-')[1] : token.key.slice('tr-'.length)
    : null;
  const selectedByName =
    tokenName !== null && selectedPlanet && selectedPlanet.name === tokenName && selectedPlanet.kind === tokenKind;
  // Legacy natal-only highlight (used by the Varga grid's planet follow).
  const highlighted = tokenName !== null && tokenKind === 'natal' && tokenName === highlightPlanet;
  const clickable = tokenName !== null && (onPlanetClick !== undefined || onPlanetSelect !== undefined) && (tokenKind === 'natal' || (tokenKind === 'transit' && onPlanetSelect !== undefined));
  const className = selectedByName ? 'text-cyan-600 dark:text-cyan-400 underline'
    : highlighted ? 'text-cyan-600 dark:text-cyan-400 underline'
    : token.group === 'asc' ? 'text-emerald-700 dark:text-green-400'
    : token.group === 'special' ? 'font-semibold'
    : undefined;
  const style = selectedByName || highlighted ? undefined
    : dignity ? { color: dignity }
    : token.group === 'transit' ? { color: TRANSIT_COLOR }
    : token.group === 'special' ? { color: SPECIAL_LAGNA_COLOR, opacity: 0.85 }
    : undefined;
  const handleClick = () => {
    if (!tokenName) return;
    if (tokenKind === 'transit') onPlanetSelect?.({ kind: 'transit', name: tokenName });
    else if (onPlanetSelect) onPlanetSelect({ kind: 'natal', name: tokenName });
    else onPlanetClick?.(tokenName);
  };
  return (
    <span
      className={`${className ?? ''}${clickable ? ' cursor-pointer' : ''}`}
      style={style}
      onClick={clickable ? handleClick : undefined}
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
  dashaLords = null,
  colorByDignity = false,
  compact = false,
  highlightPlanet = null,
  onPlanetClick,
  selectedPlanet = null,
  onPlanetSelect,
  centerContent,
}: Props) {
  const { code: grahaCode } = useGrahaNames();
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
  // Transits always show all bodies: `showOuterPlanets` governs the natal chart
  // only, so Normal Transits ON reveals Uranus, Neptune and Pluto too.
  const transits = transitPlanets;

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


  const cellSize = (gridWidth - 3 * GRID_GAP) / 4;
  const padding = compact ? COMPACT_CELL_PADDING : CELL_PADDING;
  const contentWidth = cellSize - 2 * padding;
  const contentHeight = cellSize - 2 * padding - (compact ? COMPACT_CELL_HEADER : CELL_HEADER);

  return (
    <div className={fill ? 'w-full mx-auto' : centerContent ? 'w-full max-w-[680px] mx-auto' : 'w-full max-w-[520px] mx-auto'} style={fill ? { maxWidth: FILL_MAX_WIDTH } : undefined}>
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
            if (centerContent) {
              // The four central cells are one place, drawn once from the first of them.
              return idx === 5
                ? <div key="center" data-chart="center" className="min-h-0 min-w-0 p-0.5" style={{ gridColumn: '2 / span 2', gridRow: '2 / span 2' }}>{centerContent}</div>
                : null;
            }
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
            text: getPlanetLabel(p, p.isTransit, degreePrecision, showNakshatra, showCharaKaraka, karakaByPlanet, nakshatraAdjust, p.isTransit ? '' : dashaMark(p.name, dashaLords), grahaCode),
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
              {/* BNN Minor: solid violet border overlay */}
              {isBnnMin && (
                <div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{ border: `2px solid ${bnnMinColor}`, zIndex: 11 }}
                />
              )}
              {/* Houses of the running dasha lords: cyan for the mahadasha, pink for the antardasha */}
              {dashaHouseBorders(dashaLords, (lord) => planets.some((p) => p.name === lord && p.sign === sign), isDark).map((border) => (
                <div
                  key={`dasha-${border.key}`}
                  data-dasha-house={border.key}
                  title={border.title}
                  className="absolute rounded-md pointer-events-none"
                  style={{ inset: border.key === 'md' ? 0 : 3, border: `${border.key === 'md' ? 3 : 2}px solid ${border.color}`, zIndex: 12 }}
                />
              ))}
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
                            selectedPlanet={selectedPlanet}
                            onPlanetSelect={onPlanetSelect}
                            dignity={colorByDignity && token.group === 'natal' ? dignityColor(token.key.split('-')[1], sign, isDark) : undefined}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                ))}
                {/* BNN labels */}
                {bnnBothLabel ? (
                  <span className="truncate text-[8px] leading-tight font-bold" style={{ color: isDark ? '#e879f9' : '#a21caf' }}>
                    RSN Maj+Min
                  </span>
                ) : (
                  <>
                    {isBnnMaj && (
                      <span className="truncate text-[8px] leading-tight font-bold" style={{ color: bnnMajColor }}>
                        RSN Maj
                      </span>
                    )}
                    {isBnnMin && (
                      <span className="truncate text-[8px] leading-tight font-bold" style={{ color: bnnMinColor }}>
                        RSN Min
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
