import { BcpResult, PlanetData, DashaSettings } from '@/types';
import BcpSummary from './BcpSummary';
import VimshottariPanel from './VimshottariPanel';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascSign: number;
  birthDatetime: string;
  dashaSettings: DashaSettings;
}

export default function DashaPanel({ bcp, planets, ascSign, birthDatetime, dashaSettings }: Props) {
  const { showBcp, showVimshottari } = dashaSettings;
  const both = showBcp && showVimshottari;

  if (!showBcp && !showVimshottari) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
        All Dasha panels are disabled. Enable them in Settings → Dasha.
      </div>
    );
  }

  return (
    <div className={both ? 'flex flex-col md:grid md:grid-cols-2 md:gap-6 gap-6' : 'space-y-4'}>
      {showBcp && (
        <div>
          <BcpSummary bcp={bcp} planets={planets} ascSign={ascSign} />
        </div>
      )}
      {showVimshottari && (
        <div>
          <VimshottariPanel
            planets={planets}
            birthDatetime={birthDatetime}
          />
        </div>
      )}
    </div>
  );
}
