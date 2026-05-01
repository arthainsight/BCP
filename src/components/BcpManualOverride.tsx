'use client';

import { BcpResult } from '@/types';

interface Props {
  useManualBcpMode: boolean;
  onUseManualBcpModeChange: (v: boolean) => void;
  manualBcpAge: string;
  onManualBcpAgeChange: (v: string) => void;
  manualBcpMonth: string;
  onManualBcpMonthChange: (v: string) => void;
  manualBcpResult: BcpResult | null;
}

const INPUT =
  'w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500';

export default function BcpManualOverride({
  useManualBcpMode, onUseManualBcpModeChange,
  manualBcpAge, onManualBcpAgeChange,
  manualBcpMonth, onManualBcpMonthChange,
  manualBcpResult,
}: Props) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          BCP override
        </span>
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useManualBcpMode}
            onChange={(e) => onUseManualBcpModeChange(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 dark:accent-green-500"
          />
          manual
        </label>
      </div>

      {useManualBcpMode && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
                completed age
              </label>
              <input
                type="number"
                min="0"
                value={manualBcpAge}
                onChange={(e) => onManualBcpAgeChange(e.target.value)}
                placeholder="41"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
                month (1–12)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={manualBcpMonth}
                onChange={(e) => onManualBcpMonthChange(e.target.value)}
                placeholder="1"
                className={INPUT}
              />
            </div>
          </div>

          {manualBcpResult && (
            <div className="bg-amber-50 dark:bg-zinc-800 border border-amber-300 dark:border-amber-700/60 rounded p-2 text-xs font-mono text-amber-700 dark:text-amber-400 space-y-0.5">
              <div>year: {manualBcpResult.runningYear} · cycle: {manualBcpResult.bcpCycle}</div>
              <div>
                year_house: <strong>H{manualBcpResult.activeYearHouse}</strong>
                {' · '}
                month_house: <strong>H{manualBcpResult.activeMonthHouse}</strong>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
