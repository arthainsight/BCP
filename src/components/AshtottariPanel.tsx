'use client';
import { useMemo, useState } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateAshtottari, calculateAshtottariSubDashas, evaluateAshtottariEligibility } from '@/lib/ashtottari';
import NakshatraDashaPanel from './NakshatraDashaPanel';

export default function AshtottariPanel({ planets, ascendant, birthDatetime }: { planets: PlanetData[]; ascendant: { sign: number }; birthDatetime: string }) {
  const [forceCalculation, setForceCalculation] = useState(false);
  const eligibility = useMemo(() => evaluateAshtottariEligibility(planets, ascendant.sign), [planets, ascendant.sign]);
  const result = useMemo(() => {
    const moon = planets.find(planet => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    return moon && birth ? calculateAshtottari(moon.longitude, birth) : null;
  }, [planets, birthDatetime]);
  if (!result) return <div className="text-xs font-mono text-zinc-400">Moon and birth datetime required.</div>;
  if (!eligibility.eligible && !forceCalculation) return <div className="space-y-3 font-mono">
    <div className="flex flex-wrap items-center gap-2"><span className="text-xs uppercase tracking-widest text-zinc-500">&gt; aṣṭottarī daśā</span><span className="rounded border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] uppercase text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">Condition not met</span></div>
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[10px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
      <div className="font-semibold">{eligibility.method}</div>
      {eligibility.reasons.map(reason => <div key={reason}>· {reason}</div>)}
      <p className="mt-2 text-amber-700 dark:text-amber-400">Applicability is disputed between traditions. This check uses the named BPHS/PVR Rahu rule.</p>
    </div>
    <button type="button" onClick={() => setForceCalculation(true)} className="rounded border border-zinc-300 px-2.5 py-1.5 text-[10px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">Calculate anyway</button>
  </div>;
  const status = eligibility.eligible ? 'Condition met' : 'Forced · condition not met';
  return <div className="space-y-2">
    <div className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase ${eligibility.eligible ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'}`}>{status}</div>
    <NakshatraDashaPanel title="aṣṭottarī daśā" subtitle={`${result.nakshatra} · ${result.startLord} birth balance · ${eligibility.method} · conditional 108-year system`} entries={result.entries} calculateChildren={calculateAshtottariSubDashas} />
  </div>;
}
