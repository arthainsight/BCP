'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { SIGN_NAMES } from '@/lib/varga/index';
import {
  calculateJupiterianRounds,
  buildBNNJupiterianActivationString,
} from '@/lib/bnn/jupiterianRounds';
import type {
  BNNJupiterianGrahaActivation,
  BNNJupiterianActivationResult,
  ActivationRole,
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

// ── Sub-components ────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<ActivationRole, string> = {
  primary: '1st',
  trine: 'trine',
  seventh: '7th',
  dispositor: 'disp.',
  'support-2-12': '2/12',
  other: 'other',
};

const ROLE_CLASS: Record<ActivationRole, string> = {
  primary:        'bg-emerald-100 dark:bg-green-950/50 text-emerald-700 dark:text-green-400',
  trine:          'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400',
  seventh:        'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
  dispositor:     'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400',
  'support-2-12': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
  other:          'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600',
};

function RoleBadge({ role }: { role: ActivationRole }) {
  return (
    <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${ROLE_CLASS[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

function ActivationCard({ a }: { a: BNNJupiterianGrahaActivation }) {
  const visibleRoles = a.roles.filter(r => r !== 'other');
  return (
    <div className="rounded border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-2.5 py-2 space-y-1.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="font-semibold text-xs font-mono text-zinc-800 dark:text-zinc-200">{a.graha}</span>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{a.grahaName}</span>
        <span className="text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1 rounded">
          H{a.houseFromTemporaryLagna}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{a.signName}</span>
        {a.score > 0 && (
          <span className="ml-auto text-[10px] font-mono text-emerald-600 dark:text-green-600 tabular-nums">
            +{a.score}
          </span>
        )}
      </div>
      {visibleRoles.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {visibleRoles.map(r => <RoleBadge key={r} role={r} />)}
        </div>
      )}
      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed">
        {a.karakatwa.slice(0, 3).join(' · ')}
        {a.karakatwa.length > 3 && <span className="text-zinc-300 dark:text-zinc-700"> …</span>}
      </div>
      <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 leading-relaxed">
        {a.interpretation}
      </div>
    </div>
  );
}

function ActivationSection({
  title,
  grahas,
  emptyNote,
  note,
}: {
  title: string;
  grahas: BNNJupiterianGrahaActivation[];
  emptyNote: string;
  note?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {title}
      </div>
      {grahas.length === 0 ? (
        <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic pl-1">{emptyNote}</div>
      ) : (
        <div className="space-y-1.5">
          {grahas.map(a => <ActivationCard key={a.graha} a={a} />)}
        </div>
      )}
      {note && (
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 italic pl-1">{note}</div>
      )}
    </div>
  );
}

function DispositorSection({ activation }: { activation: BNNJupiterianActivationResult }) {
  const entry = activation.activations.find(a => a.roles.includes('dispositor'));
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        Dispositor Driver
      </div>
      {entry ? (
        <ActivationCard a={entry} />
      ) : (
        <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 italic pl-1">
          Dispositor ({activation.dispositorGraha}) not found in chart data.
        </div>
      )}
    </div>
  );
}

function RankedSummaryTable({ activations }: { activations: BNNJupiterianGrahaActivation[] }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        Ranked Activation Summary
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse min-w-[580px]">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left py-1 pr-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal w-6">#</th>
              <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Graha</th>
              <th className="text-left py-1 pr-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal w-8">H</th>
              <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Roles</th>
              <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal w-10">Score</th>
              <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Karakatwa</th>
              <th className="text-left py-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {activations.map((a, idx) => (
              <tr key={a.graha} className="border-b border-zinc-100 dark:border-zinc-800 align-top">
                <td className="py-1 pr-2 text-zinc-400 dark:text-zinc-600 tabular-nums">{idx + 1}</td>
                <td className="py-1 pr-3 text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold">{a.graha}</span>
                  <span className="text-zinc-400 dark:text-zinc-600 ml-1 text-[10px]">{a.grahaName}</span>
                </td>
                <td className="py-1 pr-2 text-zinc-500 dark:text-zinc-500 tabular-nums">{a.houseFromTemporaryLagna}</td>
                <td className="py-1 pr-3">
                  <div className="flex gap-0.5 flex-wrap">
                    {a.roles.filter(r => r !== 'other').map(r => <RoleBadge key={r} role={r} />)}
                    {a.roles.every(r => r === 'other') && (
                      <span className="text-[9px] font-mono text-zinc-300 dark:text-zinc-700">—</span>
                    )}
                  </div>
                </td>
                <td className="py-1 pr-3 text-zinc-500 dark:text-zinc-500 tabular-nums">
                  {a.score > 0 ? `+${a.score}` : '0'}
                </td>
                <td className="py-1 pr-3 text-zinc-500 dark:text-zinc-500">
                  <span className="text-[10px]">{a.karakatwa[0]}</span>
                  {a.karakatwa.length > 1 && (
                    <span className="text-zinc-300 dark:text-zinc-700 text-[10px]"> +{a.karakatwa.length - 1}</span>
                  )}
                </td>
                <td className="py-1 text-zinc-400 dark:text-zinc-600 text-[10px] leading-relaxed max-w-[180px]">
                  {a.interpretation.length > 60
                    ? a.interpretation.slice(0, 60) + '…'
                    : a.interpretation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default function BNNJupiterianRoundsPanel({ chart, birthDatetime, targetDate }: Props) {
  const natalJupiter = chart.planets.find(p => p.name === 'Jupiter');

  // Safe defaults so all hooks run unconditionally before any early return
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

  const result = useMemo(
    () => calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree, ageYears: effectiveAge }),
    [natalJupiterSignIndex, natalJupiterDegree, effectiveAge],
  );

  const activation = useMemo<BNNJupiterianActivationResult | null>(() => {
    if (!result.currentRound) return null;
    return buildBNNJupiterianActivationString({
      activeSignIndex: result.currentRound.activeSignIndex,
      planets: chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 })),
    });
  }, [chart.planets, result.currentRound]);

  // All hooks must run before any conditional return
  if (!natalJupiter) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 py-4 text-center">
        Jupiter not found in chart data.
      </div>
    );
  }

  const ageYearsInt = Math.floor(effectiveAge);
  const ageMonthsInt = Math.round((effectiveAge - ageYearsInt) * 12);
  const { balanceDegrees, firstRoundLength, currentRound, rounds } = result;

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; BNN Jupiterian Rounds</div>

      {/* Natal Jupiter */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          natal jupiter
        </div>
        <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          Jupiter in{' '}
          <span className="text-emerald-700 dark:text-green-400 font-semibold">
            {SIGN_NAMES[natalJupiterSignIndex]}
          </span>{' '}
          {natalJupiterDegree.toFixed(2)}°
        </div>
        <div className="flex gap-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span>balance: <span className="text-zinc-700 dark:text-zinc-300">{balanceDegrees.toFixed(2)}°</span></span>
          <span>first round: <span className="text-zinc-700 dark:text-zinc-300">{firstRoundLength} yrs</span></span>
        </div>
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

      {/* Current round */}
      {currentRound ? (
        <div className="rounded-md border border-emerald-200 dark:border-green-900 bg-emerald-50 dark:bg-green-950/20 px-3 py-2 space-y-0.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-green-600">
            current round
          </div>
          <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
            Round {currentRound.roundNumber} · age {currentRound.startAge}–{currentRound.endAge}
          </div>
          <div className="text-xs font-mono text-emerald-700 dark:text-green-400 font-semibold">
            Temporary Lagna: {currentRound.activeSignName}
          </div>
        </div>
      ) : (
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
          Age {effectiveAge.toFixed(1)} is outside all calculated rounds.
        </div>
      )}

      {/* All rounds table */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          all rounds
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Round</th>
                <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Age range</th>
                <th className="text-left py-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Active rashi</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(r => {
                const isCurrent = currentRound?.roundNumber === r.roundNumber;
                return (
                  <tr
                    key={r.roundNumber}
                    className={`border-b border-zinc-100 dark:border-zinc-800 ${isCurrent ? 'bg-emerald-50 dark:bg-green-950/20' : ''}`}
                  >
                    <td className={`py-1 pr-3 ${isCurrent ? 'text-emerald-700 dark:text-green-400 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {r.roundNumber}
                    </td>
                    <td className={`py-1 pr-3 ${isCurrent ? 'text-emerald-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-500'}`}>
                      {r.startAge}–{r.endAge}
                    </td>
                    <td className={`py-1 ${isCurrent ? 'text-emerald-700 dark:text-green-400 font-semibold' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      {r.activeSignName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BNN Jupiterian Activation String ─────────────────────────────────── */}
      {currentRound && activation && (
        <div className="space-y-5 border-t border-zinc-200 dark:border-zinc-700 pt-5">

          {/* Section title */}
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">
            &gt; BNN Jupiterian Activation String
          </div>

          {/* Context strip */}
          <div className="rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
              <span className="text-zinc-400 dark:text-zinc-600">
                Active rashi:{' '}
                <span className="text-emerald-700 dark:text-green-400 font-semibold">{activation.activeSignName}</span>
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">
                Temp. lagna:{' '}
                <span className="text-emerald-700 dark:text-green-400 font-semibold">{activation.activeSignName}</span>
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">
                Dispositor:{' '}
                <span className="text-purple-700 dark:text-purple-400 font-semibold">{activation.dispositorGraha}</span>
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">
                Round:{' '}
                <span className="text-zinc-700 dark:text-zinc-300">{currentRound.roundNumber}</span>
              </span>
            </div>
            {activation.summary.length > 0 && (
              <div className="mt-2 space-y-0.5">
                {activation.summary.map((s, i) => (
                  <div key={i} className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">· {s}</div>
                ))}
              </div>
            )}
          </div>

          <ActivationSection
            title="Primary Activation"
            grahas={activation.primaryActivations}
            emptyNote="No grahas placed in the active rashi"
          />

          <ActivationSection
            title="Trinal Activation 1-5-9"
            grahas={activation.trineActivations}
            emptyNote="No grahas in 5th or 9th from temporary lagna"
          />

          <ActivationSection
            title="7th Activation"
            grahas={activation.seventhActivations}
            emptyNote="No grahas in 7th from temporary lagna"
          />

          <DispositorSection activation={activation} />

          <ActivationSection
            title="2/12 Support Axis"
            grahas={activation.supportAxisActivations}
            emptyNote="No grahas in 2nd or 12th"
            note="2/12 is shown as a support axis, not the main activation rule."
          />

          <RankedSummaryTable activations={activation.activations} />
        </div>
      )}

      {/* Explanatory note */}
      <div className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed">
          BNN Jupiterian Rounds use natal Jupiter&apos;s degree to establish age-based rounds.
          The active rashi acts as a temporary lagna / reference point.
          Primary = grahas in the active rashi. Trinal = 5th/9th. 7th = confrontation axis.
          Dispositor always shown. 2/12 is a support axis only.
          This is separate from transit Jupiter, BCP, Vimshottari, and Parashari dasha logic.
        </p>
      </div>
    </div>
  );
}
