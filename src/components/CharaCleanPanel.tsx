'use client';

import { PlanetData, CharaOptions } from '@/types';
import { calculateCleanCharaMD } from '@/lib/charaClean';
import { parseDateTime } from '@/lib/bcp';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  settings: CharaOptions;
}

export default function CharaCleanPanel({ planets, ascendant, birthDatetime, settings }: Props) {
  const bd = parseDateTime(birthDatetime);
  const result = bd ? calculateCleanCharaMD(planets, ascendant.sign, bd, settings) : null;

  if (!result) {
    return <div className="text-xs font-mono text-zinc-400">No data</div>;
  }

  return (
    <div className="space-y-2">
      <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">&gt; chara dasha</div>
      <div className="text-[10px] font-mono text-zinc-400">start: {result.startBasis}</div>

      <div className="space-y-1">
        {result.entries.map((e) => (
          <div key={e.startDate.getTime()} className="text-[11px] font-mono">
            <b>{e.abbr}</b> {e.durationYears}y · lord {e.debug.lord} ({e.debug.lordSign}) · {e.debug.direction}
          </div>
        ))}
      </div>
    </div>
  );
}
