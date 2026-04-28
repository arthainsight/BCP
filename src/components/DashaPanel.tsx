import { ReactNode } from 'react';
import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS, CharaOptions } from '@/types';
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

type DashaRendererContext = {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  charaOptions: CharaOptions;
};

type DashaRenderer = (context: DashaRendererContext) => ReactNode;

const DASHA_RENDERERS: Partial<Record<DashaKey, DashaRenderer>> = {
  bcp: ({ bcp, planets, ascendant }) => (
    <BcpSummary bcp={bcp} planets={planets} ascSign={ascendant.sign} />
  ),
  vimshottari: ({ planets, birthDatetime }) => (
    <VimshottariPanel planets={planets} birthDatetime={birthDatetime} />
  ),
  vds: ({ planets, ascendant, birthDatetime }) => (
    <VdsPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} />
  ),
  chara: ({ planets, ascendant, birthDatetime, charaOptions }) => (
    <CharaCleanPanel planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} settings={charaOptions} />
  ),
};

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

  const rendererContext: DashaRendererContext = {
    bcp,
    planets,
    ascendant,
    birthDatetime,
    charaOptions,
  };

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
    >
      {activeRenderableDashas.map((key) => {
        const renderer = DASHA_RENDERERS[key];
        if (!renderer) return null;
        return (
          <div key={key} className="min-w-0">
            {renderer(rendererContext)}
          </div>
        );
      })}
    </div>
  );
}
