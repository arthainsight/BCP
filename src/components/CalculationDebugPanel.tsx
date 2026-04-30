'use client';

import { useState } from 'react';
import { DebugInfo } from '@/types';

interface Props {
  debug?: DebugInfo;
  ianaTimezone?: string;
  defaultOpen?: boolean;
}

function fmtOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '';
  return `${sign}${offset % 1 === 0 ? offset.toFixed(0) : offset.toFixed(1)}h UTC`;
}

export default function CalculationDebugPanel({ debug, ianaTimezone, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  if (!debug) return null;

  const rows: Array<[string, string]> = [
    ['engine',      debug.ephemerisEngine],
    ['input time',  debug.inputDateTime],
    ...(ianaTimezone ? [['timezone', ianaTimezone] as [string, string]] : []),
    ['utc offset',  fmtOffset(debug.utcOffset)],
    ['julian day',  debug.julianDay.toFixed(4)],
    ['ayanamsa',    debug.ayanamsa.toFixed(6) + '°'],
    ['asc degree',  debug.ascendantDegree.toFixed(4) + '°'],
    ['asc sign',    String(debug.ascendantSign)],
    ['latitude',    debug.latitude.toFixed(4)],
    ['longitude',   debug.longitude.toFixed(4)],
  ];

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        <span className="text-[9px]">{open ? '▼' : '▶'}</span>
        calculation details
      </button>

      {open && (
        <div className="mt-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded p-3">
          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-zinc-100 dark:border-zinc-700/40 last:border-0">
                  <td className="py-1 pr-4 text-zinc-400 dark:text-zinc-500 whitespace-nowrap w-28">{k}</td>
                  <td className="py-1 text-zinc-700 dark:text-zinc-300 break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
