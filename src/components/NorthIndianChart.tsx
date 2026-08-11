'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PlanetData, SpecialLagna } from '@/types';
import { type DegreePrecision, formatDegree } from '@/lib/formatDegree';
import type { NadiParayaHouseActivation, ParayaBody } from '@/lib/bnn/nadiParaya';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];
const SPECIAL_LAGNA_COLOR = '#d97706';
const TRANSIT_COLOR = '#f43f5e';

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
  paraya: { x: number; y: number; step: number };
};

const HOUSES: HouseShape[] = [
  { house: 1,  points: '250,0 375,125 250,250 125,125',     planet: { x: 250, y: 115 }, sign: { x: 250, y: 220 }, paraya: { x: 250, y: 205, step: -12 } },
  { house: 2,  points: '0,0 250,0 125,125',                  planet: { x: 125, y: 70  }, sign: { x: 125, y: 95  }, paraya: { x: 125, y: 25, step: 12 } },
  { house: 3,  points: '0,0 125,125 0,250',                  planet: { x: 55,  y: 130 }, sign: { x: 95,  y: 130 }, paraya: { x: 103, y: 125, step: 12 } },
  { house: 4,  points: '0,250 125,125 250,250 125,375',      planet: { x: 135, y: 250 }, sign: { x: 220, y: 250 }, paraya: { x: 200, y: 250, step: 12 } },
  { house: 5,  points: '0,250 125,375 0,500',                planet: { x: 55,  y: 370 }, sign: { x: 95,  y: 380 }, paraya: { x: 103, y: 375, step: -12 } },
  { house: 6,  points: '0,500 125,375 250,500',              planet: { x: 125, y: 430 }, sign: { x: 125, y: 400 }, paraya: { x: 125, y: 395, step: 12 } },
  { house: 7,  points: '250,500 125,375 250,250 375,375',    planet: { x: 250, y: 390 }, sign: { x: 250, y: 280 }, paraya: { x: 250, y: 295, step: 12 } },
  { house: 8,  points: '250,500 375,375 500,500',            planet: { x: 375, y: 430 }, sign: { x: 375, y: 400 }, paraya: { x: 375, y: 395, step: 12 } },
  { house: 9,  points: '500,500 375,375 500,250',            planet: { x: 445, y: 370 }, sign: { x: 400, y: 380 }, paraya: { x: 397, y: 375, step: -12 } },
  { house: 10, points: '500,250 375,375 250,250 375,125',    planet: { x: 365, y: 250 }, sign: { x: 280, y: 250 }, paraya: { x: 300, y: 250, step: 12 } },
  { house: 11, points: '500,250 375,125 500,0',              planet: { x: 445, y: 130 }, sign: { x: 400, y: 130 }, paraya: { x: 465, y: 65, step: 12 } },
  { house: 12, points: '500,0 375,125 250,0',                planet: { x: 375, y: 70  }, sign: { x: 375, y: 95  }, paraya: { x: 375, y: 105, step: -12 } },
];

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
}: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === 'dark';

  const visiblePlanets = filterOuterPlanets(planets, showOuterPlanets);
  const visibleTransitPlanets = filterOuterPlanets(transitPlanets, showOuterPlanets);

  const strokeColor = isDark ? '#71717a' : '#71717a';
  const signFill = isDark ? '#a1a1aa' : '#52525b';
  const hNumFill = isDark ? '#71717a' : '#71717a';
  const bnnMajColor = isDark ? BNN_MAJOR_DARK : BNN_MAJOR_LIGHT;
  const bnnMinColor = isDark ? BNN_MINOR_DARK : BNN_MINOR_LIGHT;
  const parayaColors = isDark ? PARAYA_COLORS_DARK : PARAYA_COLORS_LIGHT;

  const hasBnn = bnnMajorHouse > 0 || bnnMinorHouse > 0;
  const hasParaya = nadiParayaHouses.length > 0;

  return (
    <div className="w-full max-w-[620px] mx-auto">
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
          const allPlanets: MergedPlanet[] = [...natalInHouse, ...transitInHouse];

          const totalItems = allPlanets.length + specialInHouse.length;
          const dynamicLineHeight = totalItems > 6 ? 13 : totalItems > 4 ? 15 : 18;
          const totalHeight = (Math.max(totalItems, 1) - 1) * dynamicLineHeight;
          const startY = item.planet.y - totalHeight / 2;

          const isBnnMaj = bnnMajorHouse > 0 && item.house === bnnMajorHouse;
          const isBnnMin = bnnMinorHouse > 0 && item.house === bnnMinorHouse;
          const bnnLabel = (isBnnMaj && isBnnMin) ? 'BNN Maj+Min' : isBnnMaj ? 'BNN Maj' : isBnnMin ? 'BNN Min' : null;
          const bnnLabelColor = (isBnnMaj && isBnnMin) ? (isDark ? '#e879f9' : '#a21caf') : isBnnMaj ? bnnMajColor : bnnMinColor;
          const parayaHere = nadiParayaHouses.filter(activation => activation.house === item.house);

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
              {parayaHere.map((activation, index) => (
                <polygon
                  key={`paraya-border-${activation.body}`}
                  points={item.points}
                  fill="none"
                  stroke={parayaColors[activation.body]}
                  strokeWidth="4"
                  strokeDasharray="12,36"
                  strokeDashoffset={String(index * -12)}
                />
              ))}
              {showSigns && (
                <text x={item.sign.x} y={item.sign.y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="600" fill={signFill}>
                  {SIGN_ABBR[sign]}
                </text>
              )}
              {showHouseNumbers && (
                <text x={item.sign.x} y={item.sign.y + 14} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="600" fill={hNumFill}>
                  H{item.house}
                </text>
              )}
              {/* BNN label — sits below the sign abbreviation */}
              {bnnLabel && (
                <text
                  x={item.sign.x}
                  y={item.sign.y + (showSigns ? 13 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="8"
                  fontWeight="800"
                  fill={bnnLabelColor}
                >
                  {bnnLabel}
                </text>
              )}
              {parayaHere.map((activation, index) => (
                <text
                  key={`paraya-label-${activation.body}`}
                  x={item.paraya.x}
                  y={item.paraya.y + index * item.paraya.step}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="10"
                  fontWeight="900"
                  fill={parayaColors[activation.body]}
                  stroke={isDark ? '#18181b' : '#ffffff'}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  style={{ paintOrder: 'stroke fill' }}
                >
                  {PARAYA_CODES[activation.body]} {activation.degree.toFixed(1)}°
                </text>
              ))}
              {allPlanets.map((planet, index) => {
                const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);
                const retroSuffix = !planet.isTransit && planet.isRetrograde ? '℞' : '';
                const parts: string[] = [code + retroSuffix];
                if (degreePrecision !== 'off') parts.push(formatDegree(planet.degree, degreePrecision));
                if (!planet.isTransit) {
                  if (showCharaKaraka) {
                    const k = karakaByPlanet[planet.name];
                    if (k) parts.push(k);
                  }
                  if (showNakshatra) parts.push(getNakAbbr(((planet.longitude + nakshatraAdjust) % 360 + 360) % 360));
                }
                const label = parts.join(' ');
                const fontSize = planet.isTransit ? '12' : (parts.length > 1 ? '13' : '16');
                return (
                  <text
                    key={`${planet.isTransit ? 'tr' : 'na'}-${item.house}-${planet.name}-${index}`}
                    x={item.planet.x}
                    y={startY + index * dynamicLineHeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontWeight={planet.isTransit ? '800' : '700'}
                    fill={planet.isTransit ? TRANSIT_COLOR : getPlanetFill(item.house, activeYearHouse, activeMonthHouse, isDark, showBcpHighlights)}
                    opacity={planet.isTransit ? 0.9 : 1}
                  >
                    {label}
                  </text>
                );
              })}
              {specialInHouse.map((sl, index) => (
                <text
                  key={`sl-${item.house}-${sl.name}-${index}`}
                  x={item.planet.x}
                  y={startY + (allPlanets.length + index) * dynamicLineHeight}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={SPECIAL_LAGNA_COLOR}
                  opacity={0.85}
                >
                  {sl.name}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      {(showBcpHighlights || showTransitPlanets || showSpecialLagnas || hasBnn || hasParaya) && (
        <div className="mt-3 flex justify-center gap-4 text-[11px] font-mono flex-wrap">
          {showBcpHighlights && legendLayers?.bcp !== false && <span className="text-cyan-600 dark:text-cyan-400 font-semibold">■ BCP Year</span>}
          {showBcpHighlights && legendLayers?.bcp !== false && <span className="text-emerald-700 dark:text-green-400 font-semibold">■ BCP Month</span>}
          {showBcpHighlights && legendLayers?.bcp !== false && <span className="text-purple-600 dark:text-purple-400 font-semibold">■ BCP Both</span>}
          {bnnMajorHouse > 0 && legendLayers?.bnn !== false && <span style={{ color: isDark ? BNN_MAJOR_DARK : BNN_MAJOR_LIGHT }} className="font-semibold">■ BNN Major</span>}
          {bnnMinorHouse > 0 && legendLayers?.bnn !== false && <span style={{ color: isDark ? BNN_MINOR_DARK : BNN_MINOR_LIGHT }} className="font-semibold">╌ BNN Minor</span>}
          {hasParaya && <span className="font-semibold"><span style={{ color: parayaColors.Jupiter }}>Ju</span> <span style={{ color: parayaColors.Saturn }}>Sa</span> <span style={{ color: parayaColors.Rahu }}>Ra</span> <span style={{ color: parayaColors.Ketu }}>Ke</span> Paraya</span>}
          {showTransitPlanets && legendLayers?.transit !== false && <span style={{ color: TRANSIT_COLOR }} className="font-semibold">■ Transit</span>}
          {showSpecialLagnas && <span style={{ color: SPECIAL_LAGNA_COLOR }} className="font-semibold">■ Special</span>}
        </div>
      )}
    </div>
  );
}
