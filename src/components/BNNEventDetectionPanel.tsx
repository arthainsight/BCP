'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { SIGN_NAMES } from '@/lib/varga/index';
import { calculateJupiterianRounds } from '@/lib/bnn/jupiterianRounds';
import { calculateMinorProgression } from '@/lib/bnn/jupiterMinorProgression';
import { detectBNNEventWindows, type BNNEventWindow } from '@/lib/bnn/eventDetection';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseBirthDatetime(dt: string): Date | null {
  const m = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6]));
}

function parseTargetDate(td: string): Date | null {
  const p = td.split('-');
  if (p.length !== 3) return null;
  const [y, mo, d] = p.map(Number);
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
  return new Date(y, mo - 1, d, 12, 0, 0);
}

function computeAgeYears(birth: Date, target: Date): number {
  return Math.max(0, (target.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  if (confidence === 'high') {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-green-950/50 text-emerald-700 dark:text-green-400 border border-emerald-200 dark:border-green-900">
        high
      </span>
    );
  }
  if (confidence === 'medium') {
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
        medium
      </span>
    );
  }
  return (
    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700">
      low
    </span>
  );
}

function EventCard({ window: w }: { window: BNNEventWindow }) {
  const [open, setOpen] = useState(false);

  const borderClass =
    w.confidence === 'high'
      ? 'border-emerald-200 dark:border-green-900 bg-emerald-50/50 dark:bg-green-950/10'
      : w.confidence === 'medium'
      ? 'border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10'
      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50';

  return (
    <div className={`rounded border px-3 py-2.5 space-y-1.5 ${borderClass}`}>
      <div className="flex items-start gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">{w.label}</span>
            <ConfidenceBadge confidence={w.confidence} />
          </div>
          <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 mt-0.5">
            age {w.startAge}–{w.endAge}
            {w.activatedGrahas.length > 0 && (
              <span className="ml-2 text-zinc-400 dark:text-zinc-600">
                · {w.activatedGrahas.join(' ')}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 whitespace-nowrap"
        >
          {open ? '▼ hide' : '▶ details'}
        </button>
      </div>

      {open && (
        <div className="space-y-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
          {w.reasons.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">reasons</div>
              <ul className="space-y-0.5">
                {w.reasons.map((r, i) => (
                  <li key={i} className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed pl-2 before:content-['·'] before:mr-1.5 before:text-zinc-400">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {w.cautions.length > 0 && (
            <div className="space-y-0.5">
              <div className="text-[9px] font-mono uppercase tracking-widest text-amber-500 dark:text-amber-600">caution</div>
              <ul className="space-y-0.5">
                {w.cautions.map((c, i) => (
                  <li key={i} className="text-[10px] font-mono text-amber-700 dark:text-amber-500 leading-relaxed pl-2 before:content-['!'] before:mr-1.5 before:text-amber-400">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventGroup({
  label,
  labelClass,
  windows,
  emptyText,
}: {
  label: string;
  labelClass: string;
  windows: BNNEventWindow[];
  emptyText: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className={`text-[10px] font-mono uppercase tracking-widest ${labelClass}`}>{label}</div>
      {windows.length === 0 ? (
        <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic pl-1">{emptyText}</div>
      ) : (
        <div className="space-y-1.5">
          {windows.map(w => (
            <EventCard key={w.category} window={w} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  chart: ChartData;
  birthDatetime?: string;
  targetDate?: string;
  /** Controlled override string — when provided, the local state is ignored */
  bnnOverrideStr?: string;
  onBnnOverrideStrChange?: (v: string) => void;
}

const INPUT =
  'px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 w-24';

export default function BNNEventDetectionPanel({ chart, birthDatetime, targetDate, bnnOverrideStr, onBnnOverrideStrChange }: Props) {
  const natalJupiter = chart.planets.find(p => p.name === 'Jupiter');
  const natalJupiterSignIndex = natalJupiter ? natalJupiter.sign - 1 : 0;
  const natalJupiterDegree = natalJupiter ? natalJupiter.degree : 0;

  const autoAge = useMemo(() => {
    if (!birthDatetime || !targetDate) return null;
    const birth = parseBirthDatetime(birthDatetime);
    const target = parseTargetDate(targetDate);
    if (!birth || !target) return null;
    return computeAgeYears(birth, target);
  }, [birthDatetime, targetDate]);

  // Controlled when parent provides bnnOverrideStr; local state as fallback
  const [localOverrideStr, setLocalOverrideStr] = useState('');
  const isControlled = bnnOverrideStr !== undefined;
  const overrideStr = isControlled ? bnnOverrideStr : localOverrideStr;
  const setOverrideStr = isControlled ? (onBnnOverrideStrChange ?? (() => {})) : setLocalOverrideStr;

  const effectiveAge = useMemo(() => {
    const trimmed = overrideStr.trim();
    if (trimmed) {
      const n = parseFloat(trimmed);
      if (!isNaN(n) && n >= 0) return n;
    }
    return autoAge ?? 0;
  }, [overrideStr, autoAge]);

  const adaptedPlanets = useMemo(
    () => chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 })),
    [chart.planets],
  );

  const roundsResult = useMemo(
    () => calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree, ageYears: effectiveAge }),
    [natalJupiterSignIndex, natalJupiterDegree, effectiveAge],
  );

  const minorProgression = useMemo(
    () => calculateMinorProgression({ natalJupiterSignIndex, ageYears: effectiveAge, planets: adaptedPlanets }),
    [natalJupiterSignIndex, effectiveAge, adaptedPlanets],
  );

  const natalPlanets = useMemo(
    () => chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 })),
    [chart.planets],
  );

  const eventWindows = useMemo(
    () => detectBNNEventWindows({ roundsResult, minorProgression, natalPlanets }),
    [roundsResult, minorProgression, natalPlanets],
  );

  // All hooks above — early return after
  if (!natalJupiter) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 py-4 text-center">
        Jupiter not found in chart data.
      </div>
    );
  }

  const ageYearsInt = Math.floor(effectiveAge);
  const ageMonthsInt = Math.round((effectiveAge - ageYearsInt) * 12);

  const majorActiveSign = roundsResult.currentRound
    ? SIGN_NAMES[roundsResult.currentRound.activeSignIndex]
    : null;

  const highWindows = eventWindows.filter(w => w.confidence === 'high');
  const mediumWindows = eventWindows.filter(w => w.confidence === 'medium');
  const lowWindows = eventWindows.filter(w => w.confidence === 'low');

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; BNN Event Detection</div>

      {/* Context strip */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          context
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] font-mono">
          <span className="text-zinc-500 dark:text-zinc-400">
            age{' '}
            <span className="text-emerald-700 dark:text-green-400 font-semibold">
              {ageYearsInt}y {ageMonthsInt}m
            </span>
          </span>
          {majorActiveSign && (
            <span className="text-zinc-500 dark:text-zinc-400">
              major round:{' '}
              <span className="text-zinc-700 dark:text-zinc-300">{majorActiveSign}</span>
            </span>
          )}
          <span className="text-zinc-500 dark:text-zinc-400">
            minor sign:{' '}
            <span className="text-zinc-700 dark:text-zinc-300">{minorProgression.minorSignName}</span>
          </span>
        </div>
      </div>

      {/* Age override */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">age</div>
        {autoAge !== null && (
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            auto: {ageYearsInt} yrs {ageMonthsInt} mo
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500 dark:text-zinc-400">override:</label>
          <input
            type="number"
            min="0"
            max="120"
            step="0.1"
            value={overrideStr}
            onChange={e => setOverrideStr(e.target.value)}
            placeholder={effectiveAge.toFixed(1)}
            className={INPUT}
          />
        </div>
      </div>

      {/* High confidence */}
      <EventGroup
        label="Strong event windows"
        labelClass="text-emerald-600 dark:text-green-500"
        windows={highWindows}
        emptyText="No high-confidence event windows active."
      />

      {/* Medium confidence */}
      <EventGroup
        label="Medium event windows"
        labelClass="text-amber-600 dark:text-amber-500"
        windows={mediumWindows}
        emptyText="No medium-confidence event windows active."
      />

      {/* Low confidence */}
      <EventGroup
        label="Low / background themes"
        labelClass="text-zinc-400 dark:text-zinc-600"
        windows={lowWindows}
        emptyText="No background themes active."
      />

      {/* Disclaimer */}
      <div className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed">
          Event windows combine Jupiterian Round (major layer) and Minor Jupiter Progression (minor layer).
          High = strong activation in both layers. Always confirm with dasha and transit before treating as prediction.
        </p>
      </div>
    </div>
  );
}
