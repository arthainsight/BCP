'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PlanetData } from '@/types';

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  ascendantSign: number;
  planets: PlanetData[];
  transitPlanets?: PlanetData[];
  showNatalPlanets?: boolean;
  showTransitPlanets?: boolean;
  showSigns?: boolean;
  showHouseNumbers?: boolean;
  showDegrees?: boolean;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  karakaByPlanet?: Record<string, string>;
}

// Always-on short codes
const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

// 3-char nakshatra abbreviations (index 0–26)
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

// Rose-500 — clearly distinct from natal labels
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


function getHouseFill(
  house: number,
  activeYearHouse: number,
  activeMonthHouse: number,
  isDark: boolean,
): string {
  const both  = house === activeYearHouse && house === activeMonthHouse;
  const year  = house === activeYearHouse;
  const month = house === activeMonthHouse;

  if (isDark) {
    if (both)  return 'rgba(168, 85, 247, 0.15)';
    if (year)  return 'rgba(34, 211, 238, 0.13)';
    if (month) return 'rgba(74, 222, 128, 0.12)';
    return '#18181b';
  } else {
    if (both)  return '#f3e8ff';
    if (year)  return '#dbeafe';
    if (month) return '#dcfce7';
    return '#ffffff';
  }
}

// Natal planets in active BCP houses inherit that house's accent color.
// All other natal planets use a neutral label color.
function getPlanetFill(
  house: number,
  activeYearHouse: number,
  activeMonthHouse: number,
  isDark: boolean,
): string {
  const both  = house === activeYearHouse && house === activeMonthHouse;
  const year  = house === activeYearHouse;
  const month = house === activeMonthHouse;

  if (both)  return isDark ? '#c084fc' : '#9333ea'; // purple-400 / purple-600
  if (year)  return isDark ? '#22d3ee' : '#0891b2'; // cyan-400   / cyan-600
  if (month) return isDark ? '#4ade80' : '#16a34a'; // green-400  / green-600
  return isDark ? '#d4d4d8' : '#3f3f46';             // zinc-300   / zinc-700
}

function getSignForHouse(ascendantSign: number, house: number): number {
  return ((ascendantSign + house - 2) % 12) + 1;
}

export default function NorthIndianChart({
  activeYearHouse,
  activeMonthHouse,
  ascendantSign,
  planets,
  transitPlanets = [],
  showNatalPlanets = true,
  showTransitPlanets = false,
  showSigns = true,
  showHouseNumbers = false,
  showDegrees = false,
  showCharaKaraka = false,
  showNakshatra = false,
  karakaByPlanet = {},
}: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Before mount, assume dark to avoid a light-flash on dark systems
  const isDark = !mounted || resolvedTheme === 'dark';

  const strokeColor   = isDark ? '#52525b' : '#a1a1aa';
  const signFill      = isDark ? '#a1a1aa' : '#3f3f46';
  const hNumFill      = isDark ? '#71717a' : '#71717a';

  return (
    <div className="w-full max-w-[620px] mx-auto">
      <svg
        viewBox="-25 -25 550 550"
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="North Indian Jyotish chart"
      >
        {HOUSES.map((item) => {
          const sign = getSignForHouse(ascendantSign, item.house);

          type MergedPlanet = PlanetData & { isTransit: boolean };

          const natalInHouse: MergedPlanet[] = showNatalPlanets
            ? planets.filter((p) => Number(p.house) === item.house).map((p) => ({ ...p, isTransit: false }))
            : [];

          const transitInHouse: MergedPlanet[] = showTransitPlanets
            ? transitPlanets.filter((p) => Number(p.house) === item.house).map((p) => ({ ...p, isTransit: true }))
            : [];

          // Natal first, transit after — single unified stack
          const allPlanets: MergedPlanet[] = [...natalInHouse, ...transitInHouse];

          const dynamicLineHeight =
            allPlanets.length > 5 ? 12 :
            allPlanets.length > 3 ? 14 :
            16;

          const totalHeight = (allPlanets.length - 1) * dynamicLineHeight;
          const startY = item.planet.y - totalHeight / 2;

          return (
            <g key={item.house}>
              <polygon
                points={item.points}
                fill={getHouseFill(item.house, activeYearHouse, activeMonthHouse, isDark)}
                stroke={strokeColor}
                strokeWidth="2"
              />

              {showSigns && (
                <text
                  x={item.sign.x}
                  y={item.sign.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={signFill}
                >
                  {SIGN_ABBR[sign]}
                </text>
              )}

              {showHouseNumbers && (
                <text
                  x={item.sign.x}
                  y={item.sign.y + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={hNumFill}
                >
                  H{item.house}
                </text>
              )}

              {allPlanets.map((planet, index) => {
                const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);

                // Build suffix parts for natal planets only
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
                const fontSize = planet.isTransit ? '11' : (parts.length > 1 ? '11' : '15');

                return (
                  <text
                    key={`${planet.isTransit ? 'tr' : 'na'}-${item.house}-${planet.name}-${index}`}
                    x={item.planet.x}
                    y={startY + index * dynamicLineHeight}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={fontSize}
                    fontWeight={planet.isTransit ? '800' : '700'}
                    fill={planet.isTransit ? TRANSIT_COLOR : getPlanetFill(item.house, activeYearHouse, activeMonthHouse, isDark)}
                    opacity={planet.isTransit ? 0.9 : 1}
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex justify-center gap-4 text-xs font-mono">
        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">■ Year</span>
        <span className="text-emerald-700 dark:text-green-400 font-semibold">■ Month</span>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">■ Both</span>
        {showTransitPlanets && (
          <span style={{ color: TRANSIT_COLOR }} className="font-semibold">■ Transit</span>
        )}
      </div>
    </div>
  );
}
