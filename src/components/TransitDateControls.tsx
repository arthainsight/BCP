'use client';

export type TransitDateControlsProps = {
  transitDatetime: string;
  onTransitDatetimeChange: (value: string) => void;
  onCalculateTransit: () => void;
  transitLoading?: boolean;
};

function getNowString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`;
}

const INPUT =
  'px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 flex-1 min-w-0';

export default function TransitDateControls({
  transitDatetime,
  onTransitDatetimeChange,
  onCalculateTransit,
  transitLoading = false,
}: TransitDateControlsProps) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        transit datetime · updates automatically
      </div>
      <div className="flex gap-1.5 items-center min-w-0">
        <input
          type="text"
          value={transitDatetime}
          onChange={e => onTransitDatetimeChange(e.target.value)}
          placeholder="dd.mm.yyyy hh.mm.ss"
          className={INPUT}
        />
        <button
          type="button"
          onClick={() => onTransitDatetimeChange(getNowString())}
          className="shrink-0 px-2 py-1.5 text-[10px] font-mono rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-emerald-400 dark:hover:border-green-600 hover:text-emerald-700 dark:hover:text-green-400 transition-colors"
        >
          Now
        </button>
        <button
          type="button"
          onClick={onCalculateTransit}
          disabled={transitLoading || !transitDatetime.trim()}
          className="shrink-0 px-2 py-1.5 text-[10px] font-mono rounded bg-emerald-600 dark:bg-green-700 text-white disabled:opacity-40 hover:bg-emerald-700 dark:hover:bg-green-600 transition-colors whitespace-nowrap"
        >
          {transitLoading ? '…' : 'Calculate transit'}
        </button>
      </div>
    </div>
  );
}
