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
  showDegrees?: boolean;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  karakaByPlanet?: Record<string, string>;
}

const SIGN_NAMES = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};
const NAK_ABBR = [
  'Asw', 'Bha', 'Krt', 'Roh', 'Mrg', 'Ard',
  'Pun', 'Pus', 'Asl', 'Mag', 'PFa', 'UFa',
  'Has', 'Cit', 'Swa', 'Vis', 'Anu', 'Jye',
  'Mul', 'PAs', 'UAs', 'Sra', 'Dha', 'Sat',
  'PBh', 'UBh', 'Rev',
];
const TRANSIT_COLOR = '#f43f5e';

const GRID: (number | null)[] = [
  12, 1, 2, 3,
  11, null, null, 4,
  10, null, null, 5,
  9, 8, 7, 6,
];

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
  showDegrees: boolean,
  showNakshatra: boolean,
  showCharaKaraka: boolean,
  karakaByPlanet: Record<string, string>,
): string {
  const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);
  if (isTransit) return code;

  const parts = [code];
  if (showDegrees) parts.push(`${Math.floor(planet.degree)}°`);
  if (showCharaKaraka) {
    const karaka = karakaByPlanet[planet.name];
    if (karaka) parts.push(karaka);
  }
  if (showNakshatra) parts.push(getNakAbbr(planet.longitude));
  return parts.join(' ');
}

export default function SouthIndianChart({
  activeYearHouse,
  activeMonthHouse,
  ascendantSign,
  planets,
  transitPlanets = [],
  showNatalPlanets = true,
  showTransitPlanets = false,
  showSigns = true,
  showDegrees = false,
  showCharaKaraka = false,
  showNakshatra = false,
  karakaByPlanet = {},
}: Props) {
  type MergedPlanet = PlanetData & { isTransit: boolean };
  const bySign: Record<number, MergedPlanet[]> = {};

  if (showNatalPlanets) {
    planets.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: false });
    });
  }

  if (showTransitPlanets) {
    transitPlanets.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: true });
    });
  }

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div
        className="grid gap-1 aspect-square"
        style={{
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        {GRID.map((sign, idx) => {
          if (!sign) {
            return <div key={`empty-${idx}`} className="w-full h-full min-w-0 min-h-0 border border-transparent" aria-hidden="true" />;
          }

          const house = getHouse(sign, ascendantSign);
          const planetsHere = bySign[sign] ?? [];

          return (
            <div
              key={sign}
              className={`w-full h-full min-w-0 min-h-0 overflow-hidden rounded-md border p-1.5 font-mono ${getCellClass(house, activeYearHouse, activeMonthHouse)}`}
            >
              <div className="flex items-start justify-between gap-1 text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
                <span>{showSigns ? SIGN_NAMES[sign] : ''}</span>
                <span className="text-zinc-400 dark:text-zinc-600">H{house}</span>
              </div>

              {sign === ascendantSign && (
                <div className="mt-1 text-[10px] leading-none font-bold text-emerald-700 dark:text-green-400">ASC</div>
              )}

              <div className="mt-1 flex flex-col gap-0.5 text-[11px] leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                {planetsHere.map((p, index) => (
                  <span
                    key={`${p.isTransit ? 'tr' : 'na'}-${p.name}-${index}`}
                    className="truncate"
                    style={p.isTransit ? { color: TRANSIT_COLOR } : undefined}
                  >
                    {getPlanetLabel(p, p.isTransit, showDegrees, showNakshatra, showCharaKaraka, karakaByPlanet)}
                  </span>
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
        {showTransitPlanets && <span style={{ color: TRANSIT_COLOR }} className="font-semibold">■ Transit</span>}
      </div>
    </div>
  );
}
