'use client';

import { PlanetData, DashaSettings } from '@/types';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  settings?: DashaSettings['charaOptions'];
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo', 6: 'Virgo',
  7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

export default function CharaCleanPanel({ planets, ascendant, birthDatetime, settings }: Props) {
  const lagna = SIGN_NAMES[ascendant.sign] ?? `Sign ${ascendant.sign}`;

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        &gt; chara dasha
      </div>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
          engine settings
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <div>start</div><div>{settings?.start ?? 'lagna'}</div>
          <div>AD start</div><div>{settings?.antardashaStart ?? 'next-dasha-rasi'}</div>
          <div>AD direction</div><div>{settings?.antardashaDirection ?? 'dasha-rasi-9h'}</div>
          <div>stronger lord</div><div>{settings?.strongerLordRule ?? 'graha'}</div>
          <div>Sc lord</div><div>{settings?.scorpioLord ?? 'Ketu'}</div>
          <div>Aq lord</div><div>{settings?.aquariusLord ?? 'Saturn'}</div>
        </div>
      </div>
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
        Clean Chara engine will be built here. Current chart: {lagna} Lagna · planets loaded: {planets.length} · birth: {birthDatetime || 'missing'}.
      </div>
    </div>
  );
}
