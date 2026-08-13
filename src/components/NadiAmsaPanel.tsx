'use client';

import type { ChartData } from '@/types';
import { SIGN_ABBR } from '@/lib/varga';
import { calculateDevaKeralamNadiAmsa, calculateSiddharNadiAmsa } from '@/lib/nadiAmsa';
import { normalizeDegrees } from '@/lib/angles';

const BODY_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function formatLongitude(longitude: number): string {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.floor(normalized / 30);
  const degrees = normalized % 30;
  const wholeDegrees = Math.floor(degrees);
  const minutesFloat = (degrees - wholeDegrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.floor((minutesFloat - minutes) * 60 + 1e-7);
  return `${SIGN_ABBR[signIndex]} ${wholeDegrees}°${String(minutes).padStart(2, '0')}′${String(seconds).padStart(2, '0')}″`;
}

export default function NadiAmsaPanel({ chart }: { chart: ChartData }) {
  const longitudeByBody = new Map<string, number>();
  longitudeByBody.set('Lagna', chart.ascendant.longitude);
  chart.planets.forEach((planet) => longitudeByBody.set(planet.name, planet.longitude));

  const rows = BODY_ORDER.flatMap((body) => {
    const longitude = longitudeByBody.get(body);
    if (typeof longitude !== 'number') return [];
    return [{
      body,
      longitude,
      devaKeralam: calculateDevaKeralamNadiAmsa(longitude),
      siddhar: calculateSiddharNadiAmsa(longitude),
    }];
  });

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Nāḍī-aṁśa calculation</div>
        <div className="mt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          Sidereal longitude · 150 × 0°12′ divisions · Siddhar halves 0°06′
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[760px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Body</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Longitude</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Deva Keralam name</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Siddhar D150</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Siddhar half</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ body, longitude, devaKeralam, siddhar }) => (
              <tr key={body} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{body}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 whitespace-nowrap text-zinc-600 dark:text-zinc-300">{formatLongitude(longitude)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 whitespace-nowrap">
                  <span className="font-bold text-amber-700 dark:text-amber-300">{devaKeralam.nadiName}</span>
                  <span className="ml-1 text-[9px] text-zinc-400">#{devaKeralam.nadiNumber} · {devaKeralam.modality}</span>
                </td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 whitespace-nowrap font-bold text-cyan-700 dark:text-cyan-300">
                  {SIGN_ABBR[siddhar.signIndex]} <span className="font-normal text-zinc-400">· part {siddhar.rawDivision}</span>
                </td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                  {siddhar.half === 'purva' ? 'Pūrva' : 'Para'} <span className="text-zinc-400">#{siddhar.halfNumber}/300</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
        <p>Deva Keralam: name and number; movable 1→150, fixed 150→1, dual 76→150 then 1→75.</p>
        <p>Siddhar: equal D150 harmonic sign with each nāḍī split into pūrva and para halves.</p>
      </div>
    </div>
  );
}
