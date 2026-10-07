'use client';

import { Fragment } from 'react';
import { useHydrated } from '@/lib/useHydrated';
import { useTheme } from 'next-themes';
import { PlanetData, SpecialLagna } from '@/types';
import { type DegreePrecision, formatDegree } from '@/lib/formatDegree';
import type { NadiParayaHouseActivation, ParayaBody } from '@/lib/bnn/nadiParaya';
import { normalizeDegrees } from '@/lib/angles';
import { FILL_MAX_WIDTH, useChartFill } from './chartFill';
import { useT } from '@/lib/i18n';
import { dashaMark, dignityColor, type ChartLayerControl, type ChartLayerKey, type DashaLordMarks } from './chartLayers';
import { layoutHouseLabels, polygonSpanAt, type ExclusionBox, type LabelToken, type Point } from '@/lib/chartLabelLayout';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];
const SPECIAL_LAGNA_COLOR = '#d97706';
const TRANSIT_COLOR = '#f43f5e';
const HIGHLIGHT_COLOR = '#0891b2';

const BNN_MAJOR_LIGHT = '#ea580c';
const BNN_MAJOR_DARK  = '#f97316';
const BNN_MINOR_LIGHT = '#7c3aed';
const BNN_MINOR_DARK  = '#a78bfa';
const PARAYA_COLORS_LIGHT: Record<ParayaBody, string> = {
  Jupiter: '#92400e', Saturn: '#1d4ed8', Rahu: '#6d28d9', Ketu: '#c2410c',
};
const PARAYA_COLORS_DARK: Record<ParayaBody, string> = {
  Jupiter: '#fbbf24', Saturn: '#60a5fa', Rahu: '#c084fc', Ketu: '#fb923c',
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
  showHouseNumbers?: boolean;
  degreePrecision?: DegreePrecision;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  showBcpHighlights?: boolean;
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
  /** Colours natal planets by dignity in their sign (used in the Varga grid). */
  colorByDignity?: boolean;
  /** Small-chart mode for side-by-side grids: bigger type, no legend. */
  compact?: boolean;
  /** Natal planet drawn highlighted, by name. */
  highlightPlanet?: string | null;
  /** Called with a natal planet's name when its label is clicked. */
  onPlanetClick?: (name: string) => void;
  /** Selected body (natal or transit) drawn highlighted. Kind-aware sibling of `highlightPlanet`. */
  selectedPlanet?: { kind: 'natal' | 'transit'; name: string } | null;
  /** Called with the kind and name of any natal or transit label that is clicked. */
  onPlanetSelect?: (selection: { kind: 'natal' | 'transit'; name: string }) => void;
}

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

function getNakAbbr(longitude: number): string {
  const idx = Math.floor(longitude / (40 / 3));
  return NAK_ABBR[Math.min(idx, 26)] ?? '';
}

const SIGN_ABBR: Record<number, string> = {
  1: 'Ar',  2: 'Ta',  3: 'Ge',  4: 'Cn',
  5: 'Le',  6: 'Vi',  7: 'Li',  8: 'Sc',
  9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi',
};

type HouseShape = {
  house: number;
  points: string;
  planet: { x: number; y: number };
  sign: { x: number; y: number };
};

const HOUSES: HouseShape[] = [
  { house: 1,  points: '250,0 375,125 250,250 125,125',     planet: { x: 250, y: 115 }, sign: { x: 250, y: 220 } },
  { house: 2,  points: '0,0 250,0 125,125',                  planet: { x: 125, y: 70  }, sign: { x: 125, y: 95  } },
  { house: 3,  points: '0,0 125,125 0,250',                  planet: { x: 55,  y: 130 }, sign: { x: 95,  y: 130 } },
  { house: 4,  points: '0,250 125,125 250,250 125,375',      planet: { x: 135, y: 250 }, sign: { x: 220, y: 250 } },
  { house: 5,  points: '0,250 125,375 0,500',                planet: { x: 55,  y: 370 }, sign: { x: 95,  y: 380 } },
  { house: 6,  points: '0,500 125,375 250,500',              planet: { x: 125, y: 430 }, sign: { x: 125, y: 400 } },
  { house: 7,  points: '250,500 125,375 250,250 375,375',    planet: { x: 250, y: 390 }, sign: { x: 250, y: 280 } },
  { house: 8,  points: '250,500 375,375 500,500',            planet: { x: 375, y: 430 }, sign: { x: 375, y: 400 } },
  { house: 9,  points: '500,500 375,375 500,250',            planet: { x: 445, y: 370 }, sign: { x: 400, y: 380 } },
  { house: 10, points: '500,250 375,375 250,250 375,125',    planet: { x: 365, y: 250 }, sign: { x: 280, y: 250 } },
  { house: 11, points: '500,250 375,125 500,0',              planet: { x: 445, y: 130 }, sign: { x: 400, y: 130 } },
  { house: 12, points: '500,0 375,125 250,0',                planet: { x: 375, y: 70  }, sign: { x: 375, y: 95  } },
];

const HOUSE_POLYGONS: Record<number, Point[]> = Object.fromEntries(
  HOUSES.map(item => [item.house, item.points.split(' ').map(pair => pair.split(',').map(Number) as [number, number])]),
);

// Monospace metrics matching layoutHouseLabels.
const BNN_CHAR_WIDTH = 0.6;
const BNN_LINE_HEIGHT = 1.2;

/**
 * Places the BNN Major/Minor labels as a compact vertical block directly below
 * the existing planet/sign label cluster of a house, keeping the block inside
 * the house polygon. The font is shrunk step by step until the whole block
 * fits with a margin from the triangle edges, so the labels stay readable but
 * never spill outside the BNN region or on top of the existing content.
 *
 * Returns one entry per text, each with its own centred x/y and the shared
 * fitted font size. The caller renders them top-to-bottom.
 */
function layoutBnnBlock(
  polygon: Point[],
  labels: { x: number; y: number; fontSize: number }[],
  texts: string[],
  margin = 6,
): { x: number; y: number; fontSize: number }[] {
  const ys = polygon.map(p => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Bottom edge of the existing label cluster (below which the BNN block sits).
  const clusterBottom = labels.reduce(
    (max, l) => Math.max(max, l.y + l.fontSize * 0.6),
    minY,
  );

  const maxChars = Math.max(...texts.map(t => Array.from(t).length));

  // Largest first: shrink until the block fits inside the polygon.
  for (let fontSize = 8; fontSize >= 4; fontSize--) {
    const lineHeight = fontSize * BNN_LINE_HEIGHT;
    const textWidth = maxChars * fontSize * BNN_CHAR_WIDTH;
    const gap = fontSize * 0.4;

    // Place the block just below the cluster, centred on the band it occupies.
    let blockTop = clusterBottom + gap;
    let fits = true;
    const lineCentres: number[] = [];
    for (let i = 0; i < texts.length; i++) {
      const centre = blockTop + lineHeight * 0.5 + i * lineHeight;
      lineCentres.push(centre);
      const span = polygonSpanAt(polygon, centre);
      if (!span || span[1] - span[0] < textWidth + 2 * margin) { fits = false; break; }
    }
    const blockBottom = blockTop + texts.length * lineHeight;
    if (!fits || blockBottom > maxY - margin) continue;

    return texts.map((_text, i) => {
      const centre = lineCentres[i];
      const span = polygonSpanAt(polygon, centre)!;
      return { x: (span[0] + span[1]) / 2, y: centre, fontSize };
    });
  }

  // Nothing fits below the cluster at any size: fall back to a single stacked
  // block at the minimum size, still inside the polygon.
  const fontSize = 4;
  const lineHeight = fontSize * BNN_LINE_HEIGHT;
  const bottom = maxY - margin;
  return texts.map((_text, i) => {
    const centre = bottom - (texts.length - 1 - i) * lineHeight - lineHeight * 0.5;
    const span = polygonSpanAt(polygon, centre) ?? [0, 0] as unknown as [number, number];
    return { x: (span[0] + span[1]) / 2, y: centre, fontSize };
  });
}

function getHouseFill(
  house: number,
  activeYearHouse: number,
  activeMonthHouse: number,
  isDark: boolean,
  showBcpHighlights: boolean,
  bnnMajHouse: number,
  bnnMinHouse: number,
): string {
  const bcpBoth  = showBcpHighlights && house === activeYearHouse && house === activeMonthHouse;
  const bcpYear  = showBcpHighlights && house === activeYearHouse;
  const bcpMonth = showBcpHighlights && house === activeMonthHouse;

  if (isDark) {
    if (bcpBoth)  return 'rgba(168, 85, 247, 0.20)';
    if (bcpYear)  return 'rgba(34, 211, 238, 0.18)';
    if (bcpMonth) return 'rgba(74, 222, 128, 0.16)';
    const bnnMaj = bnnMajHouse > 0 && house === bnnMajHouse;
    const bnnMin = bnnMinHouse > 0 && house === bnnMinHouse;
    if (bnnMaj && bnnMin) return 'rgba(249, 115, 22, 0.20)';
    if (bnnMaj) return 'rgba(249, 115, 22, 0.15)';
    if (bnnMin) return 'rgba(139, 92, 246, 0.14)';
    return '#18181b';
  }

  if (bcpBoth)  return 'rgba(147, 51, 234, 0.14)';
  if (bcpYear)  return 'rgba(0, 160, 220, 0.14)';
  if (bcpMonth) return 'rgba(22, 163, 74, 0.12)';
  const bnnMaj = bnnMajHouse > 0 && house === bnnMajHouse;
  const bnnMin = bnnMinHouse > 0 && house === bnnMinHouse;
  if (bnnMaj && bnnMin) return 'rgba(234, 88, 12, 0.16)';
  if (bnnMaj) return 'rgba(234, 88, 12, 0.11)';
  if (bnnMin) return 'rgba(124, 58, 237, 0.09)';
  return '#ffffff';
}

function getPlanetFill(house: number, activeYearHouse: number, activeMonthHouse: number, isDark: boolean, showBcpHighlights: boolean): string {
  const both  = showBcpHighlights && house === activeYearHouse && house === activeMonthHouse;
  const year  = showBcpHighlights && house === activeYearHouse;
  const month = showBcpHighlights && house === activeMonthHouse;

  if (both)  return isDark ? '#c084fc' : '#9333ea';
  if (year)  return isDark ? '#22d3ee' : '#0891b2';
  if (month) return isDark ? '#4ade80' : '#16a34a';
  return isDark ? '#e4e4e7' : '#27272a';
}

function getSignForHouse(ascendantSign: number, house: number): number {
  return ((ascendantSign + house - 2) % 12) + 1;
}

function getHouseFromSign(sign: number, ascendantSign: number): number {
  return ((sign - ascendantSign + 12) % 12) + 1;
}

function filterOuterPlanets(planets: PlanetData[], showOuterPlanets: boolean): PlanetData[] {
  return showOuterPlanets ? planets : planets.filter((p) => !OUTER_PLANETS.includes(p.name));
}

export default function NorthIndianChart({
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
  showHouseNumbers = false,
  degreePrecision = 'off' as DegreePrecision,
  showCharaKaraka = false,
  showNakshatra = false,
  showBcpHighlights = true,
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
  colorByDignity = false,
  compact = false,
  highlightPlanet = null,
  onPlanetClick,
  selectedPlanet = null,
  onPlanetSelect,
}: Props) {
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const fill = useChartFill();
  const isDark = !hydrated || resolvedTheme === 'dark';

  const visiblePlanets = filterOuterPlanets(planets, showOuterPlanets);
  // Transits always show all bodies: `showOuterPlanets` governs the natal chart
  // only, so Normal Transits ON reveals Uranus, Neptune and Pluto too.
  const visibleTransitPlanets = transitPlanets;

  const strokeColor = isDark ? '#71717a' : '#71717a';
  const signFill = isDark ? '#a1a1aa' : '#52525b';
  const hNumFill = isDark ? '#71717a' : '#71717a';
  const bnnMajColor = isDark ? BNN_MAJOR_DARK : BNN_MAJOR_LIGHT;
  const bnnMinColor = isDark ? BNN_MINOR_DARK : BNN_MINOR_LIGHT;
  const parayaColors = isDark ? PARAYA_COLORS_DARK : PARAYA_COLORS_LIGHT;


  const natalLabel = (planet: PlanetData) => {
    const parts = [(PLANET_CODES[planet.name] ?? planet.name.slice(0, 2)) + (planet.isRetrograde ? '℞' : '') + dashaMark(planet.name, dashaLords)];
    if (degreePrecision !== 'off') parts.push(formatDegree(planet.degree, degreePrecision));
    if (showCharaKaraka && karakaByPlanet[planet.name]) parts.push(karakaByPlanet[planet.name]);
    if (showNakshatra) parts.push(getNakAbbr(normalizeDegrees(planet.longitude + nakshatraAdjust)));
    return parts.join(' ');
  };
  const transitLabel = (planet: PlanetData) => {
    const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);
    return degreePrecision !== 'off' ? `${code} ${formatDegree(planet.degree, degreePrecision)}` : code;
  };

  return (
    <div className={fill ? 'w-full mx-auto' : 'w-full max-w-[620px] mx-auto'} style={fill ? { maxWidth: FILL_MAX_WIDTH } : undefined}>
      <svg viewBox="-25 -25 550 550" className="w-full h-auto overflow-visible" role="img" aria-label="North Indian Jyotish chart">
        {HOUSES.map((item) => {
          const sign = getSignForHouse(ascendantSign, item.house);
          type MergedPlanet = PlanetData & { isTransit: boolean };

          const natalInHouse: MergedPlanet[] = showNatalPlanets
            ? visiblePlanets.filter((p) => Number(p.house) === item.house).map((p) => ({ ...p, isTransit: false }))
            : [];
          const transitInHouse: MergedPlanet[] = showTransitPlanets
            ? visibleTransitPlanets.filter((p) => Number(p.house) === item.house).map((p) => ({ ...p, isTransit: true }))
            : [];
          const specialInHouse = showSpecialLagnas
            ? specialLagnas.filter((sl) => getHouseFromSign(sl.sign, ascendantSign) === item.house)
            : [];
          const parayaHere = nadiParayaHouses.filter(activation => activation.house === item.house);

          const isBnnMaj = bnnMajorHouse > 0 && item.house === bnnMajorHouse;
          const isBnnMin = bnnMinorHouse > 0 && item.house === bnnMinorHouse;
          const bnnLabels: { text: string; color: string }[] = [];
          if (isBnnMaj && isBnnMin) {
            bnnLabels.push({ text: 'BNN Maj', color: bnnMajColor }, { text: 'BNN Min', color: bnnMinColor });
          } else if (isBnnMaj) {
            bnnLabels.push({ text: 'BNN Maj', color: bnnMajColor });
          } else if (isBnnMin) {
            bnnLabels.push({ text: 'BNN Min', color: bnnMinColor });
          }

          const tokens: LabelToken[] = [];
          if (item.house === 1 && ascendantDegree !== undefined) {
            tokens.push({ key: 'asc', group: 'asc', text: `Asc ${formatDegree(ascendantDegree, degreePrecision === 'off' ? 'minute' : degreePrecision)}` });
          }
          parayaHere.forEach(activation => tokens.push({ key: `paraya-${activation.body}`, group: 'paraya', text: `${PARAYA_CODES[activation.body]} ${activation.degree.toFixed(1)}°` }));
          natalInHouse.forEach(planet => tokens.push({ key: `na-${planet.name}`, group: 'natal', text: natalLabel(planet) }));
          transitInHouse.forEach(planet => tokens.push({ key: `tr-${planet.name}`, group: 'transit', text: transitLabel(planet) }));
          specialInHouse.forEach((sl, index) => tokens.push({ key: `sl-${sl.name}-${index}`, group: 'special', text: sl.name }));

          // Keep labels clear of the sign and house number; BNN finds free
          // space around them afterwards (existing labels have priority).
          const signHalf = compact ? 22 : 13;
          const signBlockBottom = item.sign.y + (showHouseNumbers ? 14 : compact ? 14 : 8);
          const exclude: ExclusionBox[] = showSigns || showHouseNumbers
            ? [{ x0: item.sign.x - signHalf, x1: item.sign.x + signHalf, y0: item.sign.y - (compact ? 15 : 9), y1: signBlockBottom }]
            : [];
          const longNatal = natalInHouse.some(planet => natalLabel(planet).length > 3);
          const layout = layoutHouseLabels(
            tokens,
            { polygon: HOUSE_POLYGONS[item.house], exclude, anchorY: item.planet.y },
            compact ? { maxFontSize: 44, minFontSize: 18 } : { maxFontSize: longNatal ? 13 : 16 },
          );
          // Place the BNN block directly below the existing label cluster,
          // inside the house polygon, shrinking the font until it fits. Existing
          // labels keep priority; the BNN block is not allowed to overlap them.
          const occupiedLabels = [
            { x: item.sign.x, y: item.sign.y, fontSize: compact ? 24 : 13 },
            ...layout.rows.map(row => ({ x: row.x, y: row.y, fontSize: row.fontSize })),
          ];
          const bnnPositions = bnnLabels.length
            ? layoutBnnBlock(HOUSE_POLYGONS[item.house], occupiedLabels, bnnLabels.map(l => l.text))
            : [];
          const planetFill = getPlanetFill(item.house, activeYearHouse, activeMonthHouse, isDark, showBcpHighlights);
          const parayaFill = (key: string) => parayaColors[(key.slice('paraya-'.length)) as ParayaBody];

          return (
            <g key={item.house}>
              <polygon
                points={item.points}
                fill={getHouseFill(item.house, activeYearHouse, activeMonthHouse, isDark, showBcpHighlights, bnnMajorHouse, bnnMinorHouse)}
                stroke={strokeColor}
                strokeWidth="2"
              />
              {/* BNN Major: solid orange border overlay */}
              {isBnnMaj && (
                <polygon
                  points={item.points}
                  fill="none"
                  stroke={bnnMajColor}
                  strokeWidth="3"
                />
              )}
              {/* BNN Minor: dashed violet border overlay */}
              {isBnnMin && (
                <polygon
                  points={item.points}
                  fill="none"
                  stroke={bnnMinColor}
                  strokeWidth="3"
                  strokeDasharray="8,5"
                />
              )}
              {showSigns && (
                <text x={item.sign.x} y={item.sign.y} textAnchor="middle" dominantBaseline="middle" fontSize={compact ? 24 : 13} fontWeight="600" fill={signFill}>
                  {SIGN_ABBR[sign]}
                </text>
              )}
              {showHouseNumbers && (
                <text x={item.sign.x} y={item.sign.y + 14} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="600" fill={hNumFill}>
                  H{item.house}
                </text>
              )}
              {/* BNN labels — a compact block below the existing label cluster */}
              {bnnLabels.map((label, i) => {
                const pos = bnnPositions[i];
                if (!pos) return null;
                return (
                  <text
                    key={label.text}
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={pos.fontSize}
                    fontWeight="800"
                    fill={label.color}
                  >
                    {label.text}
                  </text>
                );
              })}
              {layout.rows.map((row, rowIndex) => (
                <text
                  key={`row-${item.house}-${rowIndex}`}
                  x={row.x}
                  y={row.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={row.fontSize}
                  fontWeight={row.group === 'paraya' ? 900 : row.group === 'transit' ? 800 : 700}
                  opacity={row.group === 'transit' ? 0.9 : row.group === 'special' ? 0.85 : 1}
                  {...(row.group === 'paraya' ? { stroke: isDark ? '#18181b' : '#ffffff', strokeWidth: 3, strokeLinejoin: 'round' as const, style: { paintOrder: 'stroke fill' } } : {})}
                >
                  {row.tokens.map((token, index) => {
                    const tokenKind = token.group === 'natal' ? 'natal' : token.group === 'transit' ? 'transit' : null;
                    const tokenName = tokenKind
                      ? tokenKind === 'natal' ? token.key.slice('na-'.length) : token.key.slice('tr-'.length)
                      : null;
                    const selectedHere =
                      tokenName !== null && selectedPlanet !== null && selectedPlanet.name === tokenName && selectedPlanet.kind === tokenKind;
                    // Legacy natal-only highlight (used by the Varga grid's planet follow).
                    const highlighted = tokenName !== null && tokenKind === 'natal' && tokenName === highlightPlanet;
                    const clickable = tokenName !== null
                      && (onPlanetClick !== undefined || onPlanetSelect !== undefined)
                      && (tokenKind === 'natal' || (tokenKind === 'transit' && onPlanetSelect !== undefined));
                    const handleClick = () => {
                      if (!tokenName || !tokenKind) return;
                      if (tokenKind === 'transit') onPlanetSelect?.({ kind: 'transit', name: tokenName });
                      else if (onPlanetSelect) onPlanetSelect({ kind: 'natal', name: tokenName });
                      else onPlanetClick?.(tokenName);
                    };
                    return (
                      <Fragment key={token.key}>
                        {index > 0 ? ' ' : ''}
                        <tspan
                          fill={selectedHere || highlighted ? HIGHLIGHT_COLOR
                            : token.group === 'natal' ? (colorByDignity && tokenName ? dignityColor(tokenName, sign, isDark) : undefined) ?? planetFill
                            : token.group === 'transit' ? TRANSIT_COLOR
                            : token.group === 'special' ? SPECIAL_LAGNA_COLOR
                            : token.group === 'paraya' ? parayaFill(token.key)
                            : signFill}
                          textDecoration={selectedHere || highlighted ? 'underline' : undefined}
                          onClick={clickable ? handleClick : undefined}
                          style={clickable ? { cursor: 'pointer' } : undefined}
                        >
                          {token.text}
                        </tspan>
                      </Fragment>
                    );
                  })}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
