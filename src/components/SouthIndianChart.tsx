'use client';

import { PlanetData } from '@/types';

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  ascendantSign: number;
  planets: PlanetData[];
}

const SIGN_NAMES = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const GRID: (number | null)[] = [
  12, 1, 2, 3,
  11, null, null, 4,
  10, null, null, 5,
  9, 8, 7, 6,
];

function getHouse(sign: number, ascendantSign: number): number {
  return ((sign - ascendantSign + 12) % 12) + 1;
}

function getCellClass(house: number, year: number, month: number): string {
  const both = house === year && house === month;
  if (both) return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700';
  if (house === year) return 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700';
  if (house === month) return 'bg-emerald-100 dark:bg-green-900/30 border-emerald-300 dark:border-green-700';
  return 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700';
}

export default function SouthIndianChart({ activeYearHouse, activeMonthHouse, ascendantSign, planets }: Props) {
  const bySign: Record<number, PlanetData[]> = {};
  planets.forEach((p) => {
    if (!bySign[p.sign]) bySign[p.sign] = [];
    bySign[p.sign].push(p);
  });

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="grid grid-cols-4 gap-1 aspect-square">
        {GRID.map((sign, idx) => {
          if (!sign) {
            return (
              <div
                key={`empty-${idx}`}
                className="aspect-square border border-transparent"
                aria-hidden="true"
              />
            );
          }

          const house = getHouse(sign, ascendantSign);
          const planetsHere = bySign[sign] ?? [];

          return (
            <div
              key={sign}
              className={`aspect-square min-w-0 overflow-hidden rounded-md border p-1.5 font-mono ${getCellClass(house, activeYearHouse, activeMonthHouse)}`}
            >
              <div className="flex items-start justify-between gap-1 text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
                <span>{SIGN_NAMES[sign]}</span>
                <span className="text-zinc-400 dark:text-zinc-600">H{house}</span>
              </div>

              {sign === ascendantSign && (
                <div className="mt-1 text-[10px] leading-none font-bold text-emerald-700 dark:text-green-400">ASC</div>
              )}

              <div className="mt-1 flex flex-wrap gap-x-1 gap-y-0.5 text-[12px] leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                {planetsHere.map((p) => (
                  <span key={p.name}>{PLANET_CODES[p.name] ?? p.name.slice(0, 2)}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center gap-4 text-[13px] font-mono">
        <span className="text-cyan-600 dark:text-cyan-400 font-semibold">■ Year</span>
        <span className="text-emerald-700 dark:text-green-400 font-semibold">■ Month</span>
        <span className="text-purple-600 dark:text-purple-400 font-semibold">■ Both</span>
      </div>
    </div>
  );
}
