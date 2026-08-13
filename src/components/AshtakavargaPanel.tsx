'use client';

import { useState } from 'react';
import type { ChartData } from '@/types';
import { buildAshtakavarga, mapAshtakavargaHousesToSigns } from '@/lib/ashtakavarga';
import type { AshtakavargaPlanet } from '@/lib/ashtakavarga';

const SIGNS = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const PLANET_ABBR: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
};

type AvSelection = 'SAV' | AshtakavargaPlanet;

function numberColor(value: number, isSav: boolean): string {
  const neutral = isSav ? value === 28 : value === 4;
  if (neutral) return 'text-black dark:text-white';
  const good = isSav ? value > 28 : value > 4;
  return good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

function svgNumberColor(value: number, isSav: boolean): string {
  if (isSav ? value === 28 : value === 4) return 'currentColor';
  return (isSav ? value > 28 : value > 4) ? '#16a34a' : '#dc2626';
}

const HOUSES = [
  { house: 1, points: '250,0 375,125 250,250 125,125', x: 250, y: 118, sx: 250, sy: 220 },
  { house: 2, points: '0,0 250,0 125,125', x: 125, y: 54, sx: 125, sy: 96 },
  { house: 3, points: '0,0 125,125 0,250', x: 48, y: 128, sx: 96, sy: 128 },
  { house: 4, points: '0,250 125,125 250,250 125,375', x: 132, y: 250, sx: 220, sy: 250 },
  { house: 5, points: '0,250 125,375 0,500', x: 48, y: 372, sx: 96, sy: 380 },
  { house: 6, points: '0,500 125,375 250,500', x: 125, y: 446, sx: 125, sy: 402 },
  { house: 7, points: '250,500 125,375 250,250 375,375', x: 250, y: 382, sx: 250, sy: 280 },
  { house: 8, points: '250,500 375,375 500,500', x: 375, y: 446, sx: 375, sy: 402 },
  { house: 9, points: '500,500 375,375 500,250', x: 452, y: 372, sx: 404, sy: 380 },
  { house: 10, points: '500,250 375,375 250,250 375,125', x: 368, y: 250, sx: 280, sy: 250 },
  { house: 11, points: '500,250 375,125 500,0', x: 452, y: 128, sx: 404, sy: 128 },
  { house: 12, points: '500,0 375,125 250,0', x: 375, y: 54, sx: 375, sy: 96 },
];

function NorthIndianAvChart({ houses, ascendantSign, label, isSav }: { houses: number[]; ascendantSign: number; label: string; isSav: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="mb-2 text-center text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">{label}</div>
      <svg viewBox="-8 -8 516 516" className="h-auto w-full text-zinc-700 dark:text-zinc-200" role="img" aria-label={`${label} North Indian chart`}>
        {HOUSES.map((item) => {
          const signIndex = (ascendantSign + item.house - 2) % 12;
          return (
            <g key={item.house}>
              <polygon points={item.points} fill="transparent" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" />
              <text x={item.x} y={item.y} textAnchor="middle" dominantBaseline="middle" fontSize="30" fontWeight="800" fill={svgNumberColor(houses[item.house - 1] ?? 0, isSav)}>
                {houses[item.house - 1] ?? 0}
              </text>
              <text x={item.sx} y={item.sy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600" fill="currentColor" opacity="0.55">
                {SIGNS[signIndex]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AshtakavargaPanel({ chart }: { chart: ChartData }) {
  const ascendantSign = chart.ascendant.sign;
  const [view, setView] = useState<'table' | 'north'>('table');
  const [selection, setSelection] = useState<AvSelection>('SAV');
  const { bav, sav } = buildAshtakavarga(chart);
  const selectedRow = selection === 'SAV' ? null : bav.find((row) => row.planet === selection);
  const selectedHouses = selectedRow?.houses ?? sav.houses;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Aṣṭakavarga</h3>
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Bhinna &amp; Sarva · signs Ar–Pi</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button type="button" onClick={() => setView('table')} className={`rounded px-2.5 py-1 text-[10px] font-mono ${view === 'table' ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-emerald-400' : 'text-zinc-500'}`}>Table</button>
          <button type="button" onClick={() => setView('north')} className={`rounded px-2.5 py-1 text-[10px] font-mono ${view === 'north' ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-emerald-400' : 'text-zinc-500'}`}>North Indian</button>
        </div>
      </div>

      {view === 'north' ? (
        <div>
          <label className="mb-3 block text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Points
            <select value={selection} onChange={(event) => setSelection(event.target.value as AvSelection)} className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs normal-case tracking-normal text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
              <option value="SAV">SAV — Sarva</option>
              {bav.map((row) => <option key={row.planet} value={row.planet}>{row.planet} BAV</option>)}
            </select>
          </label>
          <NorthIndianAvChart houses={selectedHouses} ascendantSign={ascendantSign} label={`Parāśara · ${selection === 'SAV' ? 'SAV' : `${selection} BAV`}`} isSav={selection === 'SAV'} />
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-center font-mono text-xs">
          <thead>
            <tr className="text-zinc-500 dark:text-zinc-400">
              <th scope="col" className="sticky left-0 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-left">Graha</th>
              {SIGNS.map((sign) => (
                <th scope="col" key={sign} className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-semibold">{sign}</th>
              ))}
              <th scope="col" className="border border-zinc-200 dark:border-zinc-700 px-2 py-2">Σ</th>
            </tr>
          </thead>
          <tbody>
            {bav.map((row) => {
              const values = mapAshtakavargaHousesToSigns(row.houses, ascendantSign);
              return (
                <tr key={row.planet} className="text-zinc-700 dark:text-zinc-200">
                  <th scope="row" title={row.planet} className="sticky left-0 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-left font-semibold">
                    {PLANET_ABBR[row.planet]}
                  </th>
                  {values.map((value, signIndex) => (
                    <td key={SIGNS[signIndex]} className={`border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-semibold tabular-nums ${numberColor(value, false)}`}>{value}</td>
                  ))}
                  <td className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-semibold tabular-nums">{row.total}</td>
                </tr>
              );
            })}
            <tr>
              <th scope="row" title="Sarva Ashtakavarga" className="sticky left-0 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-left font-bold">SAV</th>
              {mapAshtakavargaHousesToSigns(sav.houses, ascendantSign).map((value, signIndex) => (
                <td key={SIGNS[signIndex]} className={`border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-bold tabular-nums ${numberColor(value, true)}`}>{value}</td>
              ))}
              <td className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-bold tabular-nums">{sav.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
