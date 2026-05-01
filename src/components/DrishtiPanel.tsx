'use client';

import { PlanetData } from '@/types';
import { buildDrishti, calculateGrahaDrishti, calculateRashiDrishti } from '@/lib/drishti';
import CollapsibleCard from './CollapsibleCard';

const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const SIGN_ABBR: Record<number, string> = {
  1: 'Ar', 2: 'Ta', 3: 'Ge', 4: 'Cn', 5: 'Le', 6: 'Vi',
  7: 'Li', 8: 'Sc', 9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi',
};

function code(name: string): string {
  return PLANET_CODES[name] ?? name.slice(0, 2);
}

interface Props {
  chart?: any;
  planets?: PlanetData[];
  ascendantSign?: number;
  showGrahaDrishti?: boolean;
  showRashiDrishti?: boolean;
}

export default function DrishtiPanel({
  chart,
  planets,
  ascendantSign,
  showGrahaDrishti = true,
  showRashiDrishti = true,
}: Props) {
  const sourcePlanets = planets ?? chart?.planets ?? [];
  const sourceAscendantSign = ascendantSign ?? chart?.ascendant?.sign ?? 1;

  if (!chart && sourcePlanets.length === 0) return null;
  if (!showGrahaDrishti && !showRashiDrishti) return null;

  const grahaAspects = showGrahaDrishti ? calculateGrahaDrishti(sourcePlanets) : [];
  const rashiAspects = showRashiDrishti ? calculateRashiDrishti(sourcePlanets, sourceAscendantSign) : [];
  const summary = chart ? buildDrishti(chart) : null;

  return (
    <div className="space-y-3 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; dṛṣṭi.aspects</div>

      {showGrahaDrishti && (
        <CollapsibleCard title="Graha Dṛṣṭi (Parashari)" defaultOpen>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Graha</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">From</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Aspects</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Planets there</th>
                </tr>
              </thead>
              <tbody>
                {grahaAspects.map((a, i) => (
                  <tr key={`${a.planet}-${a.fromHouse}-${a.toHouse}-${i}`} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="p-1.5 font-bold text-emerald-700 dark:text-green-400">{code(a.planet)}</td>
                    <td className="p-1.5 text-zinc-600 dark:text-zinc-300">H{a.fromHouse}</td>
                    <td className="p-1.5 text-zinc-700 dark:text-zinc-200 font-semibold">H{a.toHouse}</td>
                    <td className="p-1.5 text-cyan-700 dark:text-cyan-300">
                      {a.aspectedPlanets.length ? a.aspectedPlanets.map(code).join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
            All planets: 7th · Mars: +4th +8th · Jupiter: +5th +9th · Saturn: +3rd +10th
          </div>
        </CollapsibleCard>
      )}

      {showRashiDrishti && (
        <CollapsibleCard title="Rāśi Dṛṣṭi (Jaimini)" defaultOpen>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">From sign</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Occupants</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Aspects</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Planets there</th>
                </tr>
              </thead>
              <tbody>
                {rashiAspects.map((a, i) => (
                  <tr key={`${a.fromSign}-${a.toSign}-${i}`} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="p-1.5 text-violet-700 dark:text-violet-300 font-semibold">{SIGN_ABBR[a.fromSign]}</td>
                    <td className="p-1.5 text-zinc-600 dark:text-zinc-300">
                      {a.fromPlanets.length ? a.fromPlanets.map(code).join(', ') : '—'}
                    </td>
                    <td className="p-1.5 text-violet-700 dark:text-violet-300 font-semibold">{SIGN_ABBR[a.toSign]}</td>
                    <td className="p-1.5 text-cyan-700 dark:text-cyan-300">
                      {a.toPlanets.length ? a.toPlanets.map(code).join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
            Movable→Fixed · Fixed→Movable (non-adjacent) · Dual→all Dual
          </div>
        </CollapsibleCard>
      )}

      {summary && (
        <CollapsibleCard title="Dṛṣṭi house summary">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">House</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Graha</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Rāśi</th>
                  <th className="p-1.5 text-left text-zinc-500 dark:text-zinc-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.houses.map((row) => (
                  <tr key={row.house} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="p-1.5 font-semibold">H{row.house}</td>
                    <td className="p-1.5">{row.graha.length ? row.graha.join(', ') : '—'}</td>
                    <td className="p-1.5">{row.rashi.length ? row.rashi.join(', ') : '—'}</td>
                    <td className="p-1.5 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleCard>
      )}
    </div>
  );
}
