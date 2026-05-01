import { BcpResult, PlanetData } from '@/types';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascSign: number;
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

const HOUSE_THEMES: Record<number, string> = {
  1:  'self, body, identity',
  2:  'resources, speech, family',
  3:  'effort, skills, siblings',
  4:  'home, stability, inner life',
  5:  'creativity, learning, children',
  6:  'work, conflict, health routines',
  7:  'relationships, agreements, public interaction',
  8:  'transformation, vulnerability, hidden matters',
  9:  'dharma, teachers, belief, fortune',
  10: 'career, action, visibility',
  11: 'gains, networks, ambitions',
  12: 'retreat, loss, sleep, foreign/hidden places',
};

function getHouseSign(ascSign: number, house: number): number {
  return ((ascSign - 1 + house - 1) % 12) + 1;
}

export default function BcpSummary({ bcp, planets: _planets, ascSign }: Props) {
  const yearSign  = getHouseSign(ascSign, bcp.activeYearHouse);
  const monthSign = getHouseSign(ascSign, bcp.activeMonthHouse);
  const yearTheme  = HOUSE_THEMES[bcp.activeYearHouse]  ?? '';
  const monthTheme = HOUSE_THEMES[bcp.activeMonthHouse] ?? '';

  return (
    <div className="w-full space-y-3 text-sm">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        BCP Summary
      </div>

      <div className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
        Age {bcp.completedAge} &middot; Year {bcp.runningYear} &middot; Cycle {bcp.bcpCycle} &middot; Month {bcp.monthInRunningYear}
      </div>

      <div className="space-y-2">
        <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-md px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-500 mb-1">Year house</div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-100">
            House {bcp.activeYearHouse} &middot; {SIGN_NAMES[yearSign]}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{yearTheme}</div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-md px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-green-500 mb-1">Month house</div>
          <div className="font-semibold text-zinc-800 dark:text-zinc-100">
            House {bcp.activeMonthHouse} &middot; {SIGN_NAMES[monthSign]} &middot; month {bcp.monthInRunningYear}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{monthTheme}</div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 leading-relaxed">
        Deterministic cycle summary — not a personal interpretation
      </div>
    </div>
  );
}
