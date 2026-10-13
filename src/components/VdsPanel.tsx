'use client';

import { useMemo } from 'react';
import { calculateVds } from '@/lib/vds';
import { parseDateTime } from '@/lib/bcp';
import { useGrahaNames } from '@/lib/grahaNames';
import { PlanetData } from '@/types';
import DashaDrilldown from './DashaDrilldown';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
}

const TITLE = 'vimsottari original (u k jha)';

/** Vimśottarī as U K Jha gives it, with the facts of his method (the cycle, the DTP and the DOP) above the periods. */
export default function VdsPanel({ planets, ascendant, birthDatetime }: Props) {
  const { code } = useGrahaNames();
  const result = useMemo(() => {
    const moon = planets.find(p => p.name === 'Moon');
    const sun = planets.find(p => p.name === 'Sun');
    if (!moon || !sun || moon.longitude == null || sun.longitude == null) return null;
    const birth = parseDateTime(birthDatetime);
    if (!birth) return null;
    const planetLongitudes: Record<string, number> = {};
    for (const planet of planets) planetLongitudes[planet.name] = planet.longitude;
    return calculateVds({
      moonLongitude: moon.longitude,
      sunLongitude: sun.longitude,
      lagnaLongitude: ascendant.longitude,
      lagnaSign: ascendant.sign,
      lagnaDegree: ascendant.degree,
      birthDate: birth,
      planetLongitudes,
    });
  }, [planets, ascendant, birthDatetime]);

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; {TITLE}</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">Moon, Sun, Lagna, or birth datetime data missing.</div>
      </div>
    );
  }

  const details = (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
      <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">original method parameters</div>
      <div className="grid grid-cols-3 gap-x-3 text-[10px] font-mono">
        <div>
          <div className="text-zinc-400 dark:text-zinc-600">cycle</div>
          <div className="font-semibold text-zinc-700 dark:text-zinc-200 truncate">{result.cycle === 'krittikadi' ? 'Krittikadi' : 'Ardradi'}</div>
        </div>
        <div>
          <div className="text-zinc-400 dark:text-zinc-600">DTP</div>
          <div className="text-cyan-700 dark:text-cyan-300 font-semibold">{code(result.dtp)}</div>
        </div>
        <div>
          <div className="text-zinc-400 dark:text-zinc-600">DOP</div>
          <div className="text-emerald-700 dark:text-green-300 font-semibold">{code(result.dop)}</div>
        </div>
      </div>
    </div>
  );
  return <DashaDrilldown entries={result.entries} title={TITLE} details={details} />;
}
