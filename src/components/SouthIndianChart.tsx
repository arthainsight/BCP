'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PlanetData, SpecialLagna } from '@/types';
import type { AshtakavargaOverlayCell } from '@/lib/ashtakavarga';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];
const SPECIAL_LAGNA_COLOR = '#d97706';
const TRANSIT_COLOR = '#f43f5e';
const ASHTAKAVARGA_COLOR = '#06b6d4';

const BNN_MAJOR_LIGHT = '#ea580c';
const BNN_MAJOR_DARK  = '#f97316';
const BNN_MINOR_LIGHT = '#7c3aed';
const BNN_MINOR_DARK  = '#a78bfa';

interface Props {
  activeYearHouse: number;
  activeMonthHouse: number;
  ascendantSign: number;
  planets: PlanetData[];
  specialLagnas?: SpecialLagna[];
  transitPlanets?: PlanetData[];
  ashtakavargaOverlay?: AshtakavargaOverlayCell[];
  showNatalPlanets?: boolean;
  showTransitPlanets?: boolean;
  showSigns?: boolean;
  showDegrees?: boolean;
  showCharaKaraka?: boolean;
  showNakshatra?: boolean;
  showOuterPlanets?: boolean;
  showSpecialLagnas?: boolean;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  bnnMajorHouse?: number;
  bnnMinorHouse?: number;
}

const SIGN_NAMES = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
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

const GRID: (number | null)[] = [
  12, 1, 2, 3,
  11, null, null, 4,
  10, null, null, 5,
  9, 8, 7, 6,
];

function filterOuter(planets: PlanetData[], showOuter?: boolean) {
  return showOuter ? planets : planets.filter((p) => !OUTER_PLANETS.includes(p.name));
}

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
  nakshatraAdjust: number,
): string {
  const code = PLANET_CODES[planet.name] ?? planet.name.slice(0, 2);
  if (isTransit) return code;

  const parts = [code];
  if (showDegrees) parts.push(`${Math.floor(planet.degree)}°`);
  if (showCharaKaraka) {
    const karaka = karakaByPlanet[planet.name];
    if (karaka) parts.push(karaka);
  }
  if (showNakshatra) parts.push(getNakAbbr(((planet.longitude + nakshatraAdjust) % 360 + 360) % 360));
  return parts.join(' ');
}

export default function SouthIndianChart({
  activeYearHouse,
  activeMonthHouse,
  ascendantSign,
  planets,
  specialLagnas = [],
  transitPlanets = [],
  ashtakavargaOverlay = [],
  showNatalPlanets = true,
  showTransitPlanets = false,
  showSigns = true,
  showDegrees = false,
  showCharaKaraka = false,
  showNakshatra = false,
  showOuterPlanets = false,
  showSpecialLagnas = false,
  karakaByPlanet = {},
  nakshatraAdjust = 0,
  bnnMajorHouse = 0,
  bnnMinorHouse = 0,
}: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === 'dark';

  const bnnMajColor = isDark ? BNN_MAJOR_DARK : BNN_MAJOR_LIGHT;
  const bnnMinColor = isDark ? BNN_MINOR_DARK : BNN_MINOR_LIGHT;

  type MergedPlanet = PlanetData & { isTransit: boolean };
  const bySign: Record<number, MergedPlanet[]> = {};

  const natal = filterOuter(planets, showOuterPlanets);
  const transits = filterOuter(transitPlanets, showOuterPlanets);

  if (showNatalPlanets) {
    natal.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: false });
    });
  }

  if (showTransitPlanets) {
    transits.forEach((p) => {
      if (!bySign[p.sign]) bySign[p.sign] = [];
      bySign[p.sign].push({ ...p, isTransit: true });
    });
  }

  const specialBySign: Record<number, SpecialLagna[]> = {};
  if (showSpecialLagnas) {
    specialLagnas.forEach((sl) => {
      if (!specialBySign[sl.sign]) specialBySign[sl.sign] = [];
      specialBySign[sl.sign].push(sl);
    });
  }

  const hasBnn = bnnMajorHouse > 0 || bnnMinorHouse > 0;

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
          const specialHere = specialBySign[sign] ?? [];
          const avCell = ashtakavargaOverlay.find((cell) => cell.house === house);

          const isBnnMaj = bnnMajorHouse > 0 && house === bnnMajorHouse;
          const isBnnMin = bnnMinorHouse > 0 && house === bnnMinorHouse;

          // BNN background tint — only when BCP is not active on this house
          const isBcpActive = house === activeYearHouse || house === activeMonthHouse;
          const bnnBg = !isBcpActive
            ? (isBnnMaj && isBnnMin)
              ? isDark ? 'rgba(249,115,22,0.18)' : 'rgba(234,88,12,0.12)'
              : isBnnMaj
              ? isDark ? 'rgba(249,115,22,0.14)' : 'rgba(234,88,12,0.09)'
              : isBnnMin
              ? isDark ? 'rgba(139,92,246,0.13)' : 'rgba(124,58,237,0.07)'
              : undefined
            : undefined;

          const bnnBothLabel = isBnnMaj && isBnnMin;

          return (
            <div
              key={sign}
              className={`relative w-full h-full min-w-0 min-h-0 overflow-hidden rounded-md border p-1.5 font-mono ${getCellClass(house, activeYearHouse, activeMonthHouse)}`}
              style={bnnBg ? { backgroundColor: bnnBg } : undefined}
            >
              {/* BNN Major: solid orange border overlay */}
              {isBnnMaj && (
                <div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{ border: `2px solid ${bnnMajColor}`, zIndex: 10 }}
                />
              )}
              {/* BNN Minor: dashed violet border overlay */}
              {isBnnMin && (
                <div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{ border: `2px dashed ${bnnMinColor}`, zIndex: 11 }}
                />
              )}

              <div className="flex items-start justify-between gap-1 text-[10px] leading-none text-zinc-500 dark:text-zinc-400">
                <span>{showSigns ? SIGN_NAMES[sign] : ''}</span>
                <span className="text-zinc-400 dark:text-zinc-600">H{house}</span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-1 text-[10px] leading-none">
                {sign === ascendantSign ? (
                  <span className="font-bold text-emerald-700 dark:text-green-400">ASC</span>
                ) : <span />}
                {avCell && (
                  <span className="font-extrabold" style={{ color: ASHTAKAVARGA_COLOR }}>
                    AV {avCell.bindu}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-col gap-0.5 text-[11px] leading-tight font-bold text-zinc-800 dark:text-zinc-100">
                {planetsHere.map((p, index) => (
                  <span
                    key={`${p.isTransit ? 'tr' : 'na'}-${p.name}-${index}`}
                    className="truncate"
                    style={p.isTransit ? { color: TRANSIT_COLOR } : undefined}
                  >
                    {getPlanetLabel(p, p.isTransit, showDegrees, showNakshatra, showCharaKaraka, karakaByPlanet, nakshatraAdjust)}
                  </span>
                ))}
                {specialHere.map((sl, index) => (
                  <span
                    key={`sl-${sl.name}-${index}`}
                    className="truncate text-[10px] leading-tight font-semibold"
                    style={{ color: SPECIAL_LAGNA_COLOR, opacity: 0.85 }}
                  >
                    {sl.name}
                  </span>
                ))}
                {/* BNN labels */}
                {bnnBothLabel ? (
                  <span className="truncate text-[8px] leading-tight font-bold" style={{ color: isDark ? '#e879f9' : '#a21caf' }}>
                    BNN Maj+Min
                  </span>
                ) : (
                  <>
                    {isBnnMaj && (
                      <span className="truncate text-[8px] leading-tight font-bold" style={{ color: bnnMajColor }}>
                        BNN Maj
                      </span>
                    )}
                    {isBnnMin && (
                      <span className="truncate text-[8px] leading-tight font-bold" style={{ color: bnnMinColor }}>
                        BNN Min
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(activeYearHouse > 0 || activeMonthHouse > 0 || showTransitPlanets || showSpecialLagnas || ashtakavargaOverlay.length > 0 || hasBnn) && (
        <div className="mt-3 flex justify-center gap-4 text-[11px] font-mono flex-wrap">
          {(activeYearHouse > 0 || activeMonthHouse > 0) && (
            <>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">■ BCP Year</span>
              <span className="text-emerald-700 dark:text-green-400 font-semibold">■ BCP Month</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">■ BCP Both</span>
            </>
          )}
          {bnnMajorHouse > 0 && <span style={{ color: bnnMajColor }} className="font-semibold">■ BNN Major</span>}
          {bnnMinorHouse > 0 && <span style={{ color: bnnMinColor }} className="font-semibold">╌ BNN Minor</span>}
          {showTransitPlanets && <span style={{ color: TRANSIT_COLOR }} className="font-semibold">■ Transit</span>}
          {showSpecialLagnas && <span style={{ color: SPECIAL_LAGNA_COLOR }} className="font-semibold">■ Special</span>}
          {ashtakavargaOverlay.length > 0 && <span style={{ color: ASHTAKAVARGA_COLOR }} className="font-semibold">AV Ashtakavarga</span>}
        </div>
      )}
    </div>
  );
}
