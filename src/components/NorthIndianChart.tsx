'use client';

import { Planet } from '@/types';

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  planets: Planet[];
}

type HouseShape = {
  house: number;
  points: string;
  label: { x: number; y: number };
  planets: { x: number; y: number };
};

const HOUSES: HouseShape[] = [
  {
    house: 1,
    points: '250,0 375,125 250,250 125,125',
    label: { x: 250, y: 92 },
    planets: { x: 250, y: 130 },
  },
  {
    house: 2,
    points: '0,0 250,0 125,125',
    label: { x: 125, y: 42 },
    planets: { x: 125, y: 75 },
  },
  {
    house: 3,
    points: '0,0 125,125 0,250',
    label: { x: 42, y: 125 },
    planets: { x: 75, y: 125 },
  },
  {
    house: 4,
    points: '0,250 125,125 250,250 125,375',
    label: { x: 92, y: 250 },
    planets: { x: 130, y: 250 },
  },
  {
    house: 5,
    points: '0,250 125,375 0,500',
    label: { x: 42, y: 375 },
    planets: { x: 75, y: 375 },
  },
  {
    house: 6,
    points: '0,500 125,375 250,500',
    label: { x: 125, y: 458 },
    planets: { x: 125, y: 425 },
  },
  {
    house: 7,
    points: '250,500 125,375 250,250 375,375',
    label: { x: 250, y: 408 },
    planets: { x: 250, y: 370 },
  },
  {
    house: 8,
    points: '250,500 375,375 500,500',
    label: { x: 375, y: 458 },
    planets: { x: 375, y: 425 },
  },
  {
    house: 9,
    points: '500,500 375,375 500,250',
    label: { x: 458, y: 375 },
    planets: { x: 425, y: 375 },
  },
  {
    house: 10,
    points: '500,250 375,375 250,250 375,125',
    label: { x: 408, y: 250 },
    planets: { x: 370, y: 250 },
  },
  {
    house: 11,
    points: '500,250 375,125 500,0',
    label: { x: 458, y: 125 },
    planets: { x: 425, y: 125 },
  },
  {
    house: 12,
    points: '500,0 375,125 250,0',
    label: { x: 375, y: 42 },
    planets: { x: 375, y: 75 },
  },
];

function getHouseFill(house: number, activeYearHouse: number, activeMonthHouse: number) {
  if (house === activeYearHouse && house === activeMonthHouse) return '#e9d5ff';
  if (house === activeYearHouse) return '#bfdbfe';
  if (house === activeMonthHouse) return '#bbf7d0';
  return '#ffffff';
}

export default function NorthIndianChart({
  activeYearHouse,
  activeMonthHouse,
  planets,
}: Props) {
  return (
    <div className="w-full max-w-[520px] mx-auto">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-auto bg-white"
        role="img"
        aria-label="North Indian Jyotish chart"
      >
        {HOUSES.map((item) => {
          const housePlanets = planets.filter(
            (planet) => Number(planet.house) === item.house
          );

          return (
            <g key={item.house}>
              <polygon
                points={item.points}
                fill={getHouseFill(
                  item.house,
                  activeYearHouse,
                  activeMonthHouse
                )}
                stroke="#111827"
                strokeWidth="2"
              />

              <text
                x={item.label.x}
                y={item.label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="800"
                fill="#111827"
              >
                {item.house}
              </text>

              {housePlanets.map((planet, index) => (
                <text
                  key={`${planet.name}-${index}`}
                  x={item.planets.x}
                  y={item.planets.y + index * 18}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="15"
                  fontWeight="600"
                  fill="#111827"
                >
                  {planet.name}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex justify-center gap-4 text-sm">
        <span className="text-blue-700 font-semibold">■ Vuosi</span>
        <span className="text-green-700 font-semibold">■ Kuukausi</span>
        <span className="text-purple-700 font-semibold">■ Molemmat</span>
      </div>
    </div>
  );
}