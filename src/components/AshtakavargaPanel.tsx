'use client';

import type { ChartData } from '@/types';
import { buildAshtakavarga, mapAshtakavargaHousesToSigns } from '@/lib/ashtakavarga';

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

export default function AshtakavargaPanel({ chart }: { chart: ChartData }) {
  const { bav, sav } = buildAshtakavarga(chart);
  const ascendantSign = chart.ascendant.sign;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Aṣṭakavarga</h3>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Bhinna &amp; Sarva · signs Ar–Pi</p>
      </div>

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
                    <td key={SIGNS[signIndex]} className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 tabular-nums">{value}</td>
                  ))}
                  <td className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-semibold tabular-nums">{row.total}</td>
                </tr>
              );
            })}
            <tr className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300">
              <th scope="row" title="Sarva Ashtakavarga" className="sticky left-0 z-10 bg-emerald-50 dark:bg-emerald-950 border border-zinc-200 dark:border-zinc-700 px-2 py-2 text-left font-bold">SAV</th>
              {mapAshtakavargaHousesToSigns(sav.houses, ascendantSign).map((value, signIndex) => (
                <td key={SIGNS[signIndex]} className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-bold tabular-nums">{value}</td>
              ))}
              <td className="border border-zinc-200 dark:border-zinc-700 px-2 py-2 font-bold tabular-nums">{sav.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
