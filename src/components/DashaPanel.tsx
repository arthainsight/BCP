import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { RENDERABLE_DASHA_KEYS, DashaKey } from '@/lib/dashaRegistry';
import BcpSummary from './BcpSummary';
import VimshottariPanel from './VimshottariPanel';
import VdsPanel from './VdsPanel';
import CharaCleanPanel from './CharaCleanPanel';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
}

export default function DashaPanel({ bcp, planets, ascendant, birthDatetime, dashaSettings }: Props) {
  const normalizedDashas = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };
  const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
  const activeRenderableDashas = RENDERABLE_DASHA_KEYS.filter((key) => Boolean(normalizedDashas[key]));

  if (activeRenderableDashas.length === 0) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
        All Dasha panels are disabled. Enable them in Settings → Dasha.
      </div>
    );
  }

  const renderDasha = (key: DashaKey) => {
    switch (key) {
      case 'bcp':
        return <BcpSummary bcp={bcp} planets={planets} ascSign={ascendant.sign} />;
      case 'vimshottari':
        return <VimshottariPanel planets={planets} birthDatetime={birthDatetime} />;
      case 'vds':
        return <VdsPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />;
      case 'chara':
        return <CharaCleanPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} settings={charaOptions} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
    >
      {activeRenderableDashas.map((key) => {
        const panel = renderDasha(key);
        if (!panel) return null;
        return (
          <div key={key} className="min-w-0">
            {panel}
          </div>
        );
      })}
    </div>
  );
}
