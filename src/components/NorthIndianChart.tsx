'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PlanetData, SpecialLagna } from '@/types';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];
const SPECIAL_LAGNA_COLOR = '#a855f7';

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
  showDegrees?: boolean;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  showBcpHighlights?: boolean;
  showOuterPlanets?: boolean;
  showSpecialLagnas?: boolean;
  karakaByPlanet?: Record<string, string>;
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

const TRANSIT_COLOR = '#f43f5e';

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

function getHouseFill(house: number, activeYearHouse: number, activeMonthHouse: number, isDark: boolean, showBcpHighlights: boolean): string {
  const both  = showBcpHighlights && house === activeYearHouse && house === activeMonthHouse;
  const year  = showBcpHighlights && house === activeYearHouse;
  const month = showBcpHighlights && house === activeMonthHouse;

  if (isDark) {
    if (both)  return 'rgba(168, 85, 247, 0.20)';
    if (year)  return 'rgba(34, 211, 238, 0.18)';
    if (month) return 'rgba(74, 222, 128, 0.16)';
    return '#18181b';
  }
  if (both)  return 'rgba(147, 51, 234, 0.14)';
  if (year)  return 'rgba(0, 160, 220, 0.14)';
  if (month) return 'rgba(22, 163, 74, 0.12)';
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
  showDegrees = false,
  showCharaKaraka = false,
  showNakshatra = false,
  showBcpHighlights = true,
  showOuterPlanets = false,
  showSpecialLagnas = false,
  karakaByPlanet = {},
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

          return (
            <g key={item.house}>
              <polygon
                points={item.points}
                fill={getHouseFill(item.house, activeYearHouse, activeMonthHouse, isDark, showBcpHighlights)}
                stroke={strokeColor}
                strokeWidth="2"
              />
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
              {allPlanets.map((planet, index) => {
                const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);
                const parts: string[] = [code];
                if (!planet.isTransit) {
                  if (showDegrees) parts.push(`${Math.floor(planet.degree)}°`);
                  if (showCharaKaraka) {
                    const k = karakaByPlanet[planet.name];
                    if (k) parts.push(k);
                  }
                  if (showNakshatra) parts.push(getNakAbbr(planet.longitude));
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

      {(showBcpHighlights || showTransitPlanets || showSpecialLagnas) && (
        <div className="mt-3 flex justify-center gap-4 text-[13px] font-mono flex-wrap">
          {showBcpHighlights && <span className="text-cyan-600 dark:text-cyan-400 font-semibold">■ Year</span>}
          {showBcpHighlights && <span className="text-emerald-700 dark:text-green-400 font-semibold">■ Month</span>}
          {showBcpHighlights && <span className="text-purple-600 dark:text-purple-400 font-semibold">■ Both</span>}
          {showTransitPlanets && <span style={{ color: TRANSIT_COLOR }} className="font-semibold">■ Transit</span>}
          {showSpecialLagnas && <span style={{ color: SPECIAL_LAGNA_COLOR }} className="font-semibold">■ Special</span>}
        </div>
      )}
    </div>
  );
}
