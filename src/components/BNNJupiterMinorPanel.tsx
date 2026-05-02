'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { SIGN_NAMES } from '@/lib/varga/index';
import { calculateMinorProgression } from '@/lib/bnn/jupiterMinorProgression';
import type { MinorActivation } from '@/lib/bnn/jupiterMinorProgression';
import {
  calculateJupiterianRounds,
  getHouseFromTemporaryLagna,
} from '@/lib/bnn/jupiterianRounds';

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

// Houses that count as "strong" in the major Jupiterian Round layer
const MAJOR_STRONG_HOUSES = new Set([1, 5, 7, 9]);

// ── Sub-components ────────────────────────────────────────────────────────────

function StrengthBadge({ strength }: { strength: 'strong' | 'weak' }) {
  return strength === 'strong' ? (
    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-100 dark:bg-green-950/50 text-emerald-700 dark:text-green-400">
      strong
    </span>
  ) : (
    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
      weak
    </span>
  );
}

function ActivationRow({ a, combined }: { a: MinorActivation; combined?: boolean }) {
  const interpretation =
    a.strength === 'strong'
      ? 'This graha is strongly activated by Minor Jupiter progression.'
      : 'This graha is weakly activated and may support or delay events.';

  return (
    <div
      className={`rounded border px-2.5 py-2 space-y-1 ${
        combined
          ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20'
          : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'
      }`}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-xs font-mono text-zinc-800 dark:text-zinc-200">{a.graha}</span>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{a.grahaName}</span>
        <span className="text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1 rounded">
          H{a.relation}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{a.signName}</span>
        <StrengthBadge strength={a.strength as 'strong' | 'weak'} />
        {combined && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 ml-auto">
            ★ TRIGGER
          </span>
        )}
      </div>
      <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 leading-relaxed">
        {interpretation}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  chart: ChartData;
  birthDatetime?: string;
  targetDate?: string;
}

const INPUT =
  'px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 w-24';

export default function BNNJupiterMinorPanel({ chart, birthDatetime, targetDate }: Props) {
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

  const [manualAgeStr, setManualAgeStr] = useState('');

  const effectiveAge = useMemo(() => {
    const trimmed = manualAgeStr.trim();
    if (trimmed) {
      const n = parseFloat(trimmed);
      if (!isNaN(n) && n >= 0) return n;
    }
    return autoAge ?? 0;
  }, [manualAgeStr, autoAge]);

  const adaptedPlanets = useMemo(
    () => chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 })),
    [chart.planets],
  );

  const minorResult = useMemo(
    () => calculateMinorProgression({ natalJupiterSignIndex, ageYears: effectiveAge, planets: adaptedPlanets }),
    [natalJupiterSignIndex, effectiveAge, adaptedPlanets],
  );

  const majorResult = useMemo(
    () => calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree, ageYears: effectiveAge }),
    [natalJupiterSignIndex, natalJupiterDegree, effectiveAge],
  );

  const combinedTriggers = useMemo<MinorActivation[]>(() => {
    const majorActiveSign = majorResult.currentRound?.activeSignIndex;
    if (majorActiveSign === undefined) return [];
    return minorResult.strongActivations.filter(a => {
      const majorHouse = getHouseFromTemporaryLagna(majorActiveSign, a.signIndex);
      return MAJOR_STRONG_HOUSES.has(majorHouse);
    });
  }, [minorResult.strongActivations, majorResult.currentRound]);

  // All hooks run before early return
  if (!natalJupiter) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 py-4 text-center">
        Jupiter not found in chart data.
      </div>
    );
  }

  const ageYearsInt = Math.floor(effectiveAge);
  const ageMonthsInt = Math.round((effectiveAge - ageYearsInt) * 12);
  const majorActiveSign = majorResult.currentRound
    ? SIGN_NAMES[majorResult.currentRound.activeSignIndex]
    : null;

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; BNN Jupiter Minor Progression</div>

      {/* Minor sign header */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2 space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          minor jupiter
        </div>
        <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          Minor sign:{' '}
          <span className="text-emerald-700 dark:text-green-400 font-semibold">
            {minorResult.minorSignName}
          </span>
          <span className="text-zinc-400 dark:text-zinc-600 ml-2 text-[10px]">
            (year {ageYearsInt} offset from natal {SIGN_NAMES[natalJupiterSignIndex]})
          </span>
        </div>
        {majorActiveSign && (
          <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
            Major round: <span className="text-zinc-600 dark:text-zinc-400">{majorActiveSign}</span>
          </div>
        )}
      </div>

      {/* Age controls */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          age
        </div>
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
            value={manualAgeStr}
            onChange={e => setManualAgeStr(e.target.value)}
            placeholder={effectiveAge.toFixed(1)}
            className={INPUT}
          />
        </div>
        <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
          using age:{' '}
          <span className="text-emerald-700 dark:text-green-400 font-semibold">
            {effectiveAge.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Strong activations */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          Strong (H1 · H2 · H5 · H7 · H9)
        </div>
        {minorResult.strongActivations.length === 0 ? (
          <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic pl-1">
            No grahas in strong houses from minor Jupiter sign.
          </div>
        ) : (
          <div className="space-y-1.5">
            {minorResult.strongActivations.map(a => (
              <ActivationRow key={a.graha} a={a} />
            ))}
          </div>
        )}
      </div>

      {/* Weak activations */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          Weak (H3 · H11 · H12)
        </div>
        {minorResult.weakActivations.length === 0 ? (
          <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic pl-1">
            No grahas in weak houses from minor Jupiter sign.
          </div>
        ) : (
          <div className="space-y-1.5">
            {minorResult.weakActivations.map(a => (
              <ActivationRow key={a.graha} a={a} />
            ))}
          </div>
        )}
      </div>

      {/* Combined triggers */}
      {majorResult.currentRound && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-600 dark:text-amber-500">
            High Probability Event Triggers
          </div>
          <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mb-1.5">
            Grahas strong in both Major Round (H1/5/7/9 from {majorActiveSign}) and Minor progression.
          </div>
          {combinedTriggers.length === 0 ? (
            <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic pl-1">
              No grahas overlap both layers in strong positions.
            </div>
          ) : (
            <div className="space-y-1.5">
              {combinedTriggers.map(a => (
                <ActivationRow key={a.graha} a={a} combined />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed">
          Minor Jupiter advances one sign per year from natal Jupiter&apos;s sign, cycling every 12 years.
          Strong = H1/2/5/7/9 from minor sign. Weak = H3/11/12. Triggers = strong in both major and minor layers.
          Separate from BCP, Vimshottari, and Parashari dasha logic.
        </p>
      </div>
    </div>
  );
}
