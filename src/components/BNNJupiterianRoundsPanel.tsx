'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { SIGN_NAMES } from '@/lib/varga/index';
import {
  calculateJupiterianRounds,
  getHouseFromTemporaryLagna,
} from '@/lib/bnn/jupiterianRounds';
import { GRAHA_KARAKAS, GRAHA_FULL_NAMES } from '@/lib/bnn/karakas';
import type { GrahaKey } from '@/lib/bnn/types';

const PLANET_TO_KEY: Record<string, GrahaKey> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

// BNN Jupiterian-specific Sun karakatwa (not Parashari dasha interpretation)
const SUN_JR_KARAKATWA = [
  'Fame / Name / Recognition',
  'Talent / Brilliance / Specialisation',
  'Father / Son / Prominent Person',
  'Large-scale prospects / Ambitious plans',
  'Government / Political / Administration',
  'Presiding deity / Religious ceremonies / Family functions',
  'Chemicals / Designing / Organisational matters',
];

function parseBirthDatetime(dt: string): Date | null {
  const match = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  return new Date(
    parseInt(yyyy), parseInt(mm) - 1, parseInt(dd),
    parseInt(hh), parseInt(min), parseInt(ss),
  );
}

function parseTargetDate(td: string): Date | null {
  const parts = td.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

function computeAgeYears(birth: Date, target: Date): number {
  const diffMs = target.getTime() - birth.getTime();
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

interface Props {
  chart: ChartData;
  birthDatetime?: string;
  targetDate?: string;
}

const INPUT =
  'px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 w-24';

export default function BNNJupiterianRoundsPanel({ chart, birthDatetime, targetDate }: Props) {
  const natalJupiter = chart.planets.find(p => p.name === 'Jupiter');

  // Derive sign index and degree (with safe defaults so all hooks run unconditionally)
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

  const grahaActivations = useMemo(() => {
    if (!result.currentRound) return [];
    const { activeSignIndex } = result.currentRound;
    return chart.planets
      .filter(p => PLANET_TO_KEY[p.name] !== undefined)
      .map(p => {
        const key = PLANET_TO_KEY[p.name];
        const planetSignIndex = p.sign - 1;
        const house = getHouseFromTemporaryLagna(activeSignIndex, planetSignIndex);
        const karakatwa =
          key === 'Su'
            ? SUN_JR_KARAKATWA.join('; ')
            : (GRAHA_KARAKAS[key]?.join(', ') ?? 'Karakatwa mapping pending');
        return { key, name: GRAHA_FULL_NAMES[key], natalSign: SIGN_NAMES[planetSignIndex], house, karakatwa };
      })
      .sort((a, b) => a.house - b.house);
  }, [chart.planets, result.currentRound]);

  // Early return after all hooks
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
      {/* Title */}
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; BNN Jupiterian Rounds</div>

      {/* Natal Jupiter info */}
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

      {/* Graha activation table */}
      {currentRound && grahaActivations.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            graha activations from {currentRound.activeSignName} (temp. lagna)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-1 pr-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">H</th>
                  <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Graha</th>
                  <th className="text-left py-1 pr-3 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Natal sign</th>
                  <th className="text-left py-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-normal">Karakatwa</th>
                </tr>
              </thead>
              <tbody>
                {grahaActivations.map(g => (
                  <tr key={g.key} className="border-b border-zinc-100 dark:border-zinc-800 align-top">
                    <td className="py-1 pr-2 text-zinc-500 dark:text-zinc-500">{g.house}</td>
                    <td className="py-1 pr-3 text-zinc-700 dark:text-zinc-300">
                      <span className="font-semibold">{g.key}</span>
                      <span className="text-zinc-400 dark:text-zinc-600 ml-1">{g.name}</span>
                    </td>
                    <td className="py-1 pr-3 text-zinc-600 dark:text-zinc-400">{g.natalSign}</td>
                    <td className="py-1 text-zinc-500 dark:text-zinc-500 leading-relaxed">
                      {g.key === 'Su' ? (
                        <details className="cursor-pointer">
                          <summary className="text-zinc-500 dark:text-zinc-400 select-none">
                            Sun karakatwa (BNN JR)
                          </summary>
                          <ul className="mt-1 space-y-0.5 text-[10px]">
                            {SUN_JR_KARAKATWA.map(k => <li key={k}>· {k}</li>)}
                          </ul>
                        </details>
                      ) : (
                        <span className="text-[10px]">{g.karakatwa}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Explanatory note */}
      <div className="rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2">
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed">
          BNN Jupiterian Rounds are calculated from natal Jupiter&apos;s degree within its sign.
          The active rashi acts as a temporary lagna / reference point for each round.
          This is separate from transit Jupiter, BCP, Vimshottari, and Parashari dasha logic.
          Sun karakatwa reflects the BNN timing layer — not Parashari house significations.
        </p>
      </div>
    </div>
  );
}
