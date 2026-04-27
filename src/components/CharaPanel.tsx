'use client';

import { PlanetData } from '@/types';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries',
  2: 'Taurus',
  3: 'Gemini',
  4: 'Cancer',
  5: 'Leo',
  6: 'Virgo',
  7: 'Libra',
  8: 'Scorpio',
  9: 'Sagittarius',
  10: 'Capricorn',
  11: 'Aquarius',
  12: 'Pisces',
};

export default function CharaPanel({ planets, ascendant, birthDatetime }: Props) {
  const lagnaSign = SIGN_NAMES[ascendant.sign] ?? `Sign ${ascendant.sign}`;
  const planetCount = planets.length;

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        &gt; chara dasha
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
          status
        </div>
        <div className="space-y-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <div>engine: coming next</div>
          <div>lagna: {lagnaSign}</div>
          <div>planets loaded: {planetCount}</div>
          <div>birth: {birthDatetime || 'missing'}</div>
        </div>
      </div>

      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
        Chara Dasha UI is connected. Calculation engine is not implemented yet.
      </div>
    </div>
  );
}
