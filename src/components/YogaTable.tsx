'use client';

import { useState } from 'react';
import { ChartData } from '@/types';
import { calculateYogas, YogaCategory } from '@/lib/yogas';
import { qualifyYogas, classify, type StrengthClassification } from '@/lib/yogaStrength';

const CATEGORY_LABELS: Record<YogaCategory, string> = {
  solar:                'Solar',
  moon:                 'Lunar',
  raja:                 'Raja',
  dhana:                'Dhana',
  general:              'General',
  'pancha-mahapurusha': 'Pancha Mahapurusha',
};

function strengthColor(c: StrengthClassification): string {
  switch (c) {
    case 'Very Strong': return 'text-green-600 dark:text-green-400';
    case 'Strong':      return 'text-emerald-600 dark:text-emerald-400';
    case 'Moderate':    return 'text-amber-600 dark:text-amber-400';
    case 'Weak':        return 'text-red-600 dark:text-red-400';
  }
}

function strengthBg(c: StrengthClassification): string {
  switch (c) {
    case 'Very Strong': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'Strong':      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
    case 'Moderate':    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    case 'Weak':        return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  }
}

function breakdownTitle(breakdown: NonNullable<ReturnType<typeof qualifyYogas>[number]['breakdown']>): string {
  const lines: string[] = [];
  if (breakdown.rasi)         lines.push(`Rāśi: ${breakdown.rasi > 0 ? '+' : ''}${breakdown.rasi}`);
  if (breakdown.dignity)      lines.push(`Dignity: ${breakdown.dignity > 0 ? '+' : ''}${breakdown.dignity}`);
  if (breakdown.navamsa)      lines.push(`Navamsa: ${breakdown.navamsa > 0 ? '+' : ''}${breakdown.navamsa}`);
  if (breakdown.vargottama)   lines.push(`Vargottama: +${breakdown.vargottama}`);
  if (breakdown.conjunctions) lines.push(`Conjunctions: ${breakdown.conjunctions > 0 ? '+' : ''}${breakdown.conjunctions}`);
  if (breakdown.aspects)      lines.push(`Aspects: ${breakdown.aspects > 0 ? '+' : ''}${breakdown.aspects}`);
  if (breakdown.kartari)      lines.push(`Kartari: ${breakdown.kartari > 0 ? '+' : ''}${breakdown.kartari}`);
  return lines.join(' | ');
}

interface Props {
  chart: ChartData;
  showInactive?: boolean;
}

export default function YogaTable({ chart, showInactive = false }: Props) {
  const [sortByStrength, setSortByStrength] = useState(false);

  const raw     = calculateYogas(chart.planets, chart.ascendant.sign);
  const all     = qualifyYogas(raw, chart.planets);
  const visible = showInactive ? all : all.filter(y => y.status === 'active');

  const sorted = sortByStrength
    ? [...visible].sort((a, b) => {
        const sa = a.strength ?? -Infinity;
        const sb = b.strength ?? -Infinity;
        return sb - sa;
      })
    : visible;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; yoga.detection</div>
        <button
          type="button"
          onClick={() => setSortByStrength(v => !v)}
          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
            sortByStrength
              ? 'border-emerald-400 dark:border-green-600 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500 hover:border-zinc-400'
          }`}
        >
          {sortByStrength ? '↓ strength' : 'sort by strength'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 py-4 text-center">
          No active yogas found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="p-2 text-left whitespace-nowrap">Yoga</th>
                <th
                  className="p-2 text-left whitespace-nowrap cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-300"
                  onClick={() => setSortByStrength(v => !v)}
                  title="Click to sort by strength"
                >
                  Strength {sortByStrength ? '↓' : ''}
                </th>
                <th className="p-2 text-left whitespace-nowrap">Category</th>
                {showInactive && <th className="p-2 text-left whitespace-nowrap">Status</th>}
                <th className="p-2 text-left whitespace-nowrap">Reference</th>
                <th className="p-2 text-left whitespace-nowrap">Planets</th>
                <th className="p-2 text-left min-w-[160px]">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(yoga => (
                <tr
                  key={yoga.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 ${
                    yoga.status === 'inactive' ? 'opacity-50' : ''
                  }`}
                >
                  <td className={`p-2 font-bold whitespace-nowrap ${
                    yoga.status === 'active'
                      ? 'text-emerald-700 dark:text-green-400'
                      : 'text-zinc-500 dark:text-zinc-500'
                  }`}>
                    {yoga.name}
                  </td>

                  {/* Strength cell */}
                  <td className="p-2 whitespace-nowrap">
                    {yoga.strength !== null && yoga.classification !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${strengthBg(yoga.classification)}`}
                        title={yoga.breakdown ? breakdownTitle(yoga.breakdown) : undefined}
                      >
                        <span className="tabular-nums">{yoga.strength > 0 ? '+' : ''}{yoga.strength}</span>
                        <span className={`hidden sm:inline font-normal ${strengthColor(yoga.classification)}`}>
                          {yoga.classification}
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-600">—</span>
                    )}
                  </td>

                  <td className="p-2 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                    {CATEGORY_LABELS[yoga.category] ?? yoga.category}
                  </td>
                  {showInactive && (
                    <td className="p-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        yoga.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-green-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                      }`}>
                        {yoga.status}
                      </span>
                    </td>
                  )}
                  <td className="p-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {yoga.referencePlanet}
                  </td>
                  <td className="p-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {yoga.planetsInvolved.length > 0 ? yoga.planetsInvolved.join(', ') : '—'}
                  </td>
                  <td className="p-2 text-zinc-500 dark:text-zinc-500 break-words max-w-[240px]">
                    {yoga.resultText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
