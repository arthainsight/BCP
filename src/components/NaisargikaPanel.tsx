'use client';
import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateNaisargika, calculateNaisargikaSubDashas, NAISARGIKA_TOTAL_YEARS } from '@/lib/naisargika';
import NakshatraDashaPanel from './NakshatraDashaPanel';
import LifespanMethodNote from './LifespanMethodNote';
import { useT } from '@/lib/i18n';

export default function NaisargikaPanel({ planets, ascendant, birthDatetime }: { planets: PlanetData[]; ascendant: { sign: number }; birthDatetime: string }) {
  const t = useT();
  const entries = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    return birth ? calculateNaisargika(birth).entries : null;
  }, [birthDatetime]);
  if (!entries) return <div className="text-xs font-mono text-zinc-400">{t('Birth datetime required.')}</div>;
  return (
    <div className="space-y-2">
    <LifespanMethodNote planets={planets} ascendantSign={ascendant.sign} />
    <NakshatraDashaPanel
      title="naisargika daśā"
      subtitle={`${NAISARGIKA_TOTAL_YEARS}-year cycle from birth · Moon 1, Mars 2, Mercury 9, Venus 20, Jupiter 18, Sun 20, Saturn 50, Lagna 12`}
      entries={entries}
      calculateChildren={parent => calculateNaisargikaSubDashas(parent, planets, ascendant.sign)}
    />
    </div>
  );
}
