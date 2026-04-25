'use client';

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
  1: 'Ar',
  2: 'Ta',
  3: 'Ge',
  4: 'Cn',
  5: 'Le',
  6: 'Vi',
  7: 'Li',
  8: 'Sc',
  9: 'Sg',
  10: 'Cp',
  11: 'Aq',
  12: 'Pi',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f97316',
  Moon: '#93c5fd',
  Mars: '#ef4444',
  Mercury: '#22c55e',
  Jupiter: '#eab308',
  Venus: '#ec4899',
  Saturn: '#6366f1',
  Rahu: '#8b5cf6',
  Ketu: '#a16207',
};

type HouseShape = {
  house: number;
  points: string;
  planet: { x: number; y: number };
  sign: { x: number; y: number };
};

const HOUSES: HouseShape[] = [
  {
    house: 1,
    points: '250,0 375,125 250,250 125,125',
    planet: { x: 250, y: 115 },
    sign: { x: 250, y: 220 },
  },
  {
    house: 2,
    points: '0,0 250,0 125,125',
    planet: { x: 125, y: 70 },
    sign: { x: 125, y: 95 },
  },
  {
    house: 3,
    points: '0,0 125,125 0,250',
    planet: { x: 55, y: 130 },
    sign: { x: 95, y: 130 },
  },
  {
    house: 4,
    points: '0,250 125,125 250,250 125,375',
    planet: { x: 135, y: 250 },
    sign: { x: 220, y: 250 },
  },
  {
    house: 5,
    points: '0,250 125,375 0,500',
    planet: { x: 55, y: 370 },
    sign: { x: 95, y: 380 },
  },
  {
    house: 6,
    points: '0,500 125,375 250,500',
    planet: { x: 125, y: 430 },
    sign: { x: 125, y: 400 },
  },
  {
    house: 7,
    points: '250,500 125,375 250,250 375,375',
    planet: { x: 250, y: 390 },
    sign: { x: 250, y: 280 },
  },
  {
    house: 8,
    points: '250,500 375,375 500,500',
    planet: { x: 375, y: 430 },
    sign: { x: 375, y: 400 },
  },
  {
    house: 9,
    points: '500,500 375,375 500,250',
    planet: { x: 445, y: 370 },
    sign: { x: 400, y: 380 },
  },
  {
    house: 10,
    points: '500,250 375,375 250,250 375,125',
    planet: { x: 365, y: 250 },
    sign: { x: 280, y: 250 },
  },
  {
    house: 11,
    points: '500,250 375,125 500,0',
    planet: { x: 445, y: 130 },
    sign: { x: 400, y: 130 },
  },
  {
    house: 12,
    points: '500,0 375,125 250,0',
    planet: { x: 375, y: 70 },
    sign: { x: 375, y: 95 },
  },
];

function getHouseFill(house: number, activeYearHouse: number, activeMonthHouse: number) {
  if (house === activeYearHouse && house === activeMonthHouse) return '#3b0764';
  if (house === activeYearHouse) return '#1e3a5f';
  if (house === activeMonthHouse) return '#14532d';
  return '#18181b';
}

function getPlanetColor(name: string) {
  return PLANET_COLORS[name] ?? '#e5e7eb';
}

function getSignForHouse(ascendantSign: number, house: number): number {
  return ((ascendantSign - house + 12) % 12) + 1;
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

          const natalInHouse = showNatalPlanets
            ? planets.filter((p) => Number(p.house) === item.house)
            : [];

          const transitInHouse = showTransitPlanets
            ? transitPlanets.filter((p) => Number(p.house) === item.house)
            : [];

          const natalStartY = item.planet.y;
          const lineHeight = 18;

          const transitStartY =
            natalStartY +
            natalInHouse.length * lineHeight +
            (natalInHouse.length > 0 ? 12 : 0);

          return (
            <g key={item.house}>
              <polygon
                points={item.points}
                fill={getHouseFill(item.house, activeYearHouse, activeMonthHouse)}
                stroke="#52525b"
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
                  fill="#a1a1aa"
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
                  fill="#71717a"
                >
                  H{item.house}
                </text>
              )}

              {natalInHouse.map((planet, index) => (
                <text
                  key={`natal-${item.house}-${planet.name}-${index}`}
                  x={item.planet.x}
                  y={natalStartY + index * lineHeight}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="15"
                  fontWeight="700"
                  fill={getPlanetColor(planet.name)}
                >
                  {planet.name}
                </text>
              ))}

              {transitInHouse.map((planet, index) => (
                <text
                  key={`transit-${item.house}-${planet.name}-${index}`}
                  x={item.planet.x}
                  y={transitStartY + index * 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="800"
                  fill="#9ca3af"
                >
                  T-{planet.name}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex justify-center gap-4 text-xs text-zinc-500 font-mono">
        <span className="text-cyan-400 font-semibold">■ Year</span>
        <span className="text-green-400 font-semibold">■ Month</span>
        <span className="text-purple-400 font-semibold">■ Both</span>
      </div>
    </div>
  );
}