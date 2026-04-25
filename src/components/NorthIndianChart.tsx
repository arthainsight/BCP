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
  text: { x: number; y: number };
};

const HOUSES: HouseShape[] = [
  { house: 1, points: '250,0 375,125 250,250 125,125', text: { x: 250, y: 105 } },
  { house: 2, points: '0,0 250,0 125,125', text: { x: 155, y: 70 } },

  // LEFT SIDE TRIANGLES — move LEFT, not right
  { house: 3, points: '0,0 125,125 0,250', text: { x: 48, y: 135 } },
  { house: 4, points: '0,250 125,125 250,250 125,375', text: { x: 145, y: 250 } },
  { house: 5, points: '0,250 125,375 0,500', text: { x: 48, y: 365 } },

  { house: 6, points: '0,500 125,375 250,500', text: { x: 155, y: 430 } },
  { house: 7, points: '250,500 125,375 250,250 375,375', text: { x: 250, y: 395 } },
  { house: 8, points: '250,500 375,375 500,500', text: { x: 345, y: 430 } },

  // RIGHT SIDE TRIANGLES — move RIGHT, not left
  { house: 9, points: '500,500 375,375 500,250', text: { x: 452, y: 365 } },
  { house: 10, points: '500,250 375,375 250,250 375,125', text: { x: 355, y: 250 } },
  { house: 11, points: '500,250 375,125 500,0', text: { x: 452, y: 135 } },
  { house: 12, points: '500,0 375,125 250,0', text: { x: 385, y: 75 } },
];

function getHouseFill(
  house: number,
  activeYearHouse: number,
  activeMonthHouse: number
) {
  if (house === activeYearHouse && house === activeMonthHouse) return '#3b0764';
  if (house === activeYearHouse) return '#1e3a5f';
  if (house === activeMonthHouse) return '#14532d';
  return '#18181b';
}

function houseSign(ascendantSign: number, house: number): number {
  return ((ascendantSign - 1 + house - 1) % 12) + 1;
}

function getPlanetColor(name: string) {
  return PLANET_COLORS[name] ?? '#e5e7eb';
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
          const { x, y } = item.text;
          const sign = houseSign(ascendantSign, item.house);

          const natalInHouse = showNatalPlanets
            ? planets.filter((p) => Number(p.house) === item.house)
            : [];

          const transitInHouse = showTransitPlanets
            ? transitPlanets.filter((p) => Number(p.house) === item.house)
            : [];

          const hasSigns = showSigns;
          const signY = y - 22;
          const natalStartY = hasSigns ? y : y - 8;
          const lineHeight = 18;

          const transitStartY =
            natalStartY +
            natalInHouse.length * lineHeight +
            (natalInHouse.length > 0 ? 12 : 0);

          return (
            <g key={item.house}>
              <polygon
                points={item.points}
                fill={getHouseFill(
                  item.house,
                  activeYearHouse,
                  activeMonthHouse
                )}
                stroke="#52525b"
                strokeWidth="2"
              />

              {showSigns && (
                <text
                  x={x}
                  y={signY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill="#a1a1aa"
                >
                  {SIGN_ABBR[sign]}
                </text>
              )}

              {natalInHouse.map((planet, index) => (
                <text
                  key={`natal-${item.house}-${planet.name}-${index}`}
                  x={x}
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
                  x={x}
                  y={transitStartY + index * 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="500"
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