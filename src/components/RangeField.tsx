'use client';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** The value as shown next to the label. */
  format: (value: number) => string;
  onChange: (value: number) => void;
  /** Called when a drag or a key press on the slider is over, so a run of changes can count as one. */
  onDone?: () => void;
  /** Called by the reset button; the button is left out when this is not given. */
  onReset?: () => void;
  resetLabel?: string;
  resetDisabled?: boolean;
  className?: string;
};

/** A labelled slider with its value shown beside the label and an optional reset. */
export default function RangeField({ label, value, min, max, step, format, onChange, onDone, onReset, resetLabel, resetDisabled, className = '' }: Props) {
  return (
    <div className={`text-[10px] font-mono text-zinc-600 dark:text-zinc-300 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400" data-range-value>{format(value)}</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={resetDisabled}
              className="rounded-sm border border-zinc-200 px-1.5 py-0.5 text-[9px] text-zinc-500 hover:text-zinc-800 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {resetLabel ?? '↺'}
            </button>
          )}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        onPointerUp={onDone}
        onKeyUp={onDone}
        onBlur={onDone}
        className="mt-1 block h-5 w-full accent-emerald-600 dark:accent-green-500"
      />
    </div>
  );
}
