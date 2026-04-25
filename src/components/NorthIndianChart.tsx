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
}

const SIGN_ABBR: Record<number, string> = {
  1: 'Ar',  2: 'Ta',  3: 'Ge',  4: 'Cn',
  5: 'Le',  6: 'Vi',  7: 'Li',  8: 'Sc',
  9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi',
};

const PLANET_COLORS: Record<string, string> = {
  Sun:     '#f97316',
  Moon:    '#93c5fd',
  Mars:    '#ef4444',
  Mercury: '#22c55e',
  Jupiter: '#eab308',
  Venus:   '#ec4899',
  Saturn:  '#6366f1',
  Rahu:    '#8b5cf6',
  Ketu:    '#a16207',
};

// Rose-500 — clearly distinct from Mars red (#ef4444)
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
    if (both)  return '#3b0764';
    if (year)  return '#1e3a5f';
    if (month) return '#14532d';
    return '#18181b';
  } else {
    if (both)  return '#f3e8ff';
    if (year)  return '#dbeafe';
    if (month) return '#dcfce7';
    return '#ffffff';
  }
}

function getPlanetColor(name: string): string {
  return PLANET_COLORS[name] ?? '#e5e7eb';
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

          const startY = item.planet.y;

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

              {allPlanets.map((planet, index) => (
                <text
                  key={`${planet.isTransit ? 'tr' : 'na'}-${item.house}-${planet.name}-${index}`}
                  x={item.planet.x}
                  y={startY + index * dynamicLineHeight}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={planet.isTransit ? '11' : '15'}
                  fontWeight={planet.isTransit ? '800' : '700'}
                  fill={planet.isTransit ? TRANSIT_COLOR : getPlanetColor(planet.name)}
                  opacity={planet.isTransit ? 0.9 : 1}
                >
                  {planet.name}
                </text>
              ))}
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
