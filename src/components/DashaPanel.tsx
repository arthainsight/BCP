import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { RENDERABLE_DASHAS } from '@/lib/dashaRegistry';
import { renderDasha, DashaRendererContext } from '@/lib/dashaRenderers';

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

  const activeDashas = RENDERABLE_DASHAS.filter(d => d.renderer && normalizedDashas[d.key]);

  if (activeDashas.length === 0) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
        All Dasha panels are disabled. Enable them in Settings → Dasha.
      </div>
    );
  }

  const ctx: DashaRendererContext = {
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
      {activeDashas.map(d => (
        <div key={d.key} className="min-w-0">
          {d.renderer ? renderDasha(d.renderer, ctx) : null}
        </div>
      ))}
    </div>
  );
}
