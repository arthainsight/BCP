'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { calculateSahams } from '@/lib/sahams';

const SIGN_ABBR = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

function position(degree: number, sign: number) {
  const d = Math.floor(degree);
  const minutesFloat = (degree - d) * 60;
  const m = Math.floor(minutesFloat);
  const s = Math.round((minutesFloat - m) * 60);
  return `${SIGN_ABBR[sign]} ${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}

export default function SahamPanel({ chart, birthDatetime }: { chart: ChartData; birthDatetime: string }) {
  const [expanded, setExpanded] = useState(false);
  const result = useMemo(() => calculateSahams(chart, birthDatetime), [chart, birthDatetime]);
  return (
    <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between text-left">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; sahams</span>
        <span className="text-[10px] font-mono text-zinc-400">{expanded ? 'collapse' : 'expand'}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] font-mono text-zinc-400">{result.night ? 'night' : 'day'} formula · Tajika 30° correction</div>
          <div className="max-h-[560px] overflow-auto rounded-md border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[720px] border-collapse text-[10px] font-mono">
              <thead className="sticky top-0 bg-zinc-50 text-left text-zinc-400 dark:bg-zinc-900"><tr>
                <th className="p-2">Saham</th><th className="p-2">Position</th><th className="p-2">Nakshatra</th><th className="p-2">H</th><th className="p-2">Meaning</th>
              </tr></thead>
              <tbody>{result.rows.map((row) => (
                <tr key={row.key} title={row.formula} className="border-t border-zinc-100 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                  <td className="p-2 font-semibold">{row.name}</td><td className="p-2">{position(row.degree, row.sign)}</td><td className="p-2">{row.nakshatra} {row.pada}</td><td className="p-2">{row.house}</td><td className="p-2 text-zinc-500 dark:text-zinc-400">{row.meaning}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="text-[9px] leading-relaxed text-zinc-400">Hover a row to see its formula. Sahams refine chart themes; they do not create a promise independently.</p>
        </div>
      )}
    </div>
  );
}