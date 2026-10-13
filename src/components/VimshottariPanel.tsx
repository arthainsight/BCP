'use client';

import { useMemo } from 'react';
import { calculateVimshottari } from '@/lib/vimshottari';
import { parseDateTime } from '@/lib/bcp';
import { PlanetData } from '@/types';
import DashaDrilldown from './DashaDrilldown';

interface Props {
  planets: PlanetData[];
  birthDatetime: string;
  /** Heading shown after the prompt; vimshottari when missing. */
  title?: string;
}

export default function VimshottariPanel({ planets, birthDatetime, title = 'vimshottari' }: Props) {
  const moon = planets.find(p => p.name === 'Moon');
  const result = useMemo(() => {
    if (!moon || moon.longitude == null) return null;
    const birth = parseDateTime(birthDatetime);
    return birth ? calculateVimshottari(moon.longitude, birth) : null;
  }, [moon, birthDatetime]);

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; {title}</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">{!moon ? 'Moon data required.' : 'Invalid birth datetime.'}</div>
      </div>
    );
  }
  return <DashaDrilldown entries={result.entries} title={title} />;
}
