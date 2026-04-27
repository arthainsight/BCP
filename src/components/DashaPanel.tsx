import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import BcpSummary from './BcpSummary';
import VimshottariPanel from './VimshottariPanel';
import VdsPanel from './VdsPanel';
import CharaPanel from './CharaPanel';
import CharaCleanPanel from './CharaCleanPanel';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
}

export default function DashaPanel({ bcp, planets, ascendant, birthDatetime, dashaSettings }: Props) {
  const { dashas } = dashaSettings;
  const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
  const enabledCount = [dashas.bcp, dashas.vimshottari, dashas.vds, dashas.charaBeta, dashas.chara].filter(Boolean).length;

  if (enabledCount === 0) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
        All Dasha panels are disabled. Enable them in Settings → Dasha.
      </div>
    );
  }

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
    >
      {dashas.bcp && (
        <div className="min-w-0">
          <BcpSummary bcp={bcp} planets={planets} ascSign={ascendant.sign} />
        </div>
      )}
      {dashas.vimshottari && (
        <div className="min-w-0">
          <VimshottariPanel planets={planets} birthDatetime={birthDatetime} />
        </div>
      )}
      {dashas.vds && (
        <div className="min-w-0">
          <VdsPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
        </div>
      )}
      {dashas.charaBeta && (
        <div className="min-w-0">
          <CharaPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
        </div>
      )}
      {dashas.chara && (
        <div className="min-w-0">
          <CharaCleanPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} settings={charaOptions} />
        </div>
      )}
    </div>
  );
}
