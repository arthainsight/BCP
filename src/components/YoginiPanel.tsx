'use client';
import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateYogini, calculateYoginiSubDashas } from '@/lib/yogini';
import NakshatraDashaPanel from './NakshatraDashaPanel';

export default function YoginiPanel({ planets, birthDatetime }: { planets: PlanetData[]; birthDatetime: string }) {
  const result = useMemo(() => {
    const moon = planets.find(planet => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    return moon && birth ? calculateYogini(moon.longitude, birth) : null;
  }, [planets, birthDatetime]);
  if (!result) return <div className="text-xs font-mono text-zinc-400">Moon and birth datetime required.</div>;
  return <NakshatraDashaPanel title="yoginī daśā" subtitle={`36-year cycle · birth balance: ${result.startYogini}`} entries={result.entries} calculateChildren={calculateYoginiSubDashas} showYoginiName />;
}
