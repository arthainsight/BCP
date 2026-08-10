'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { calculateAvasthas } from '@/lib/avasthas';

const ABBR: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };

export default function AvasthaPanel({ chart, birthDatetime }: { chart: ChartData; birthDatetime: string }) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => calculateAvasthas(chart, birthDatetime), [chart, birthDatetime]);

  return (
    <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <button type="button" onClick={() => setExpanded((value) => !value)} className="flex w-full items-center justify-between text-left">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; planetary.avasthas</span>
        <span className="text-[10px] font-mono text-zinc-400">{expanded ? 'collapse' : 'expand'}</span>
      </button>
      {expanded && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[10px] font-mono">
            <thead><tr className="border-b border-zinc-200 text-left text-zinc-400 dark:border-zinc-700">
              <th className="p-2">Graha</th><th className="p-2">Bālādi</th><th className="p-2">Dīptādi</th><th className="p-2">Jāgratādi</th><th className="p-2">Lajjitādi</th><th className="p-2">Śayanādi</th>
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.planet} className="border-b border-zinc-100 align-top text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                <td className="p-2 font-bold">{ABBR[row.planet]}</td>
                <td className="p-2" title={row.reasons.baladi}>{row.baladi}</td>
                <td className="p-2" title={row.reasons.deeptadi}>{row.deeptadi}</td>
                <td className="p-2" title={row.reasons.jagratadi}>{row.jagratadi}</td>
                <td className="p-2" title={row.reasons.lajjitadi}>{row.lajjitadi.join(', ') || '—'}</td>
                <td className="p-2" title={row.reasons.sayanadi}>{row.sayanadi}</td>
              </tr>
            ))}</tbody>
          </table>
          <p className="mt-2 text-[9px] leading-relaxed text-zinc-400">Hover a value to see its calculation basis. Śayanādi shows the primary 12-fold state; sub-states are not included.</p>
        </div>
      )}
    </div>
  );
}