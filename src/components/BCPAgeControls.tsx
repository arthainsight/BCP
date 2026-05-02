'use client';

export type BCPAgeControlsProps = {
  useManualBcpMode: boolean;
  onUseManualBcpModeChange: (value: boolean) => void;
  manualBcpAge: string;
  onManualBcpAgeChange: (value: string) => void;
  manualBcpMonth: string;
  onManualBcpMonthChange: (value: string) => void;
  activeYearHouse?: number;
  activeMonthHouse?: number;
};

const INPUT =
  'w-20 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500';

export default function BCPAgeControls({
  useManualBcpMode,
  onUseManualBcpModeChange,
  manualBcpAge,
  onManualBcpAgeChange,
  manualBcpMonth,
  onManualBcpMonthChange,
  activeYearHouse,
  activeMonthHouse,
}: BCPAgeControlsProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          BCP age
        </div>
        <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useManualBcpMode}
            onChange={e => onUseManualBcpModeChange(e.target.checked)}
            className="w-3.5 h-3.5 accent-emerald-600 dark:accent-green-500"
          />
          manual
        </label>
      </div>

      {useManualBcpMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">age</label>
            <input
              type="number"
              min="0"
              value={manualBcpAge}
              onChange={e => onManualBcpAgeChange(e.target.value)}
              placeholder="41"
              className={INPUT}
            />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">mo</label>
            <input
              type="number"
              min="1"
              max="12"
              value={manualBcpMonth}
              onChange={e => onManualBcpMonthChange(e.target.value)}
              placeholder="1"
              className={INPUT}
            />
          </div>
          {(activeYearHouse || activeMonthHouse) ? (
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              Active:{' '}
              <span className="text-cyan-600 dark:text-cyan-400">Y:H{activeYearHouse}</span>
              {' / '}
              <span className="text-emerald-700 dark:text-green-400">M:H{activeMonthHouse}</span>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
