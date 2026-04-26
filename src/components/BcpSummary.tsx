import { BcpResult, PlanetData } from '@/types';
import { HOUSE_NAMES } from '@/lib/houseData';

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

function getHouseSign(ascSign: number, house: number): number {
  return ((ascSign - 1 + house - 1) % 12) + 1;
}

export default function BcpSummary({ bcp, planets: _planets, ascSign }: Props) {
  const yearSign = getHouseSign(ascSign, bcp.activeYearHouse);
  const monthSign = getHouseSign(ascSign, bcp.activeMonthHouse);

  return (
    <div className="w-full space-y-3 text-sm">
      <h3 className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; bcp.engine</h3>

      <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
          <div className="text-zinc-500 dark:text-zinc-500">completed age</div>
          <div className="text-zinc-700 dark:text-zinc-200">{bcp.completedAge} years</div>

          <div className="text-zinc-500 dark:text-zinc-500">running year</div>
          <div className="text-zinc-700 dark:text-zinc-200">{bcp.runningYear}</div>

          <div className="text-zinc-500 dark:text-zinc-500">bcp cycle</div>
          <div className="text-zinc-700 dark:text-zinc-200">cycle {bcp.bcpCycle}</div>

          <div className="text-zinc-500 dark:text-zinc-500">month in year</div>
          <div className="text-zinc-700 dark:text-zinc-200">month {bcp.monthInRunningYear}</div>

          <div className="text-zinc-500 dark:text-zinc-500">active year house</div>
          <div className="text-cyan-600 dark:text-cyan-400 font-semibold">
            H{bcp.activeYearHouse} · {SIGN_NAMES[yearSign]} · {HOUSE_NAMES[bcp.activeYearHouse]}
          </div>

          <div className="text-zinc-500 dark:text-zinc-500">active month house</div>
          <div className="text-emerald-700 dark:text-green-400 font-semibold">
            H{bcp.activeMonthHouse} · {SIGN_NAMES[monthSign]} · {HOUSE_NAMES[bcp.activeMonthHouse]}
          </div>
        </div>
      </div>
    </div>
  );
}
