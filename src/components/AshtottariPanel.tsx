'use client';
import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateAshtottari, calculateAshtottariSubDashas } from '@/lib/ashtottari';
import NakshatraDashaPanel from './NakshatraDashaPanel';

export default function AshtottariPanel({ planets, birthDatetime }: { planets: PlanetData[]; birthDatetime: string }) {
  const result = useMemo(() => {
    const moon = planets.find(planet => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    return moon && birth ? calculateAshtottari(moon.longitude, birth) : null;
  }, [planets, birthDatetime]);
  if (!result) return <div className="text-xs font-mono text-zinc-400">Moon and birth datetime required.</div>;
  return <NakshatraDashaPanel title="aṣṭottarī daśā" subtitle={`${result.nakshatra} · ${result.startLord} birth balance · conditional 108-year system`} entries={result.entries} calculateChildren={calculateAshtottariSubDashas} />;
}
