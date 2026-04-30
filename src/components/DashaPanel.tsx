import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { RENDERABLE_DASHAS } from '@/lib/dashaRegistry';
import { renderDasha, DashaRendererContext } from '@/lib/dashaRenderers';
import CollapsibleCard from './CollapsibleCard';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  collapsible?: boolean;
}

export default function DashaPanel({ bcp, planets, ascendant, birthDatetime, dashaSettings, collapsible = false }: Props) {
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

  const ctx: DashaRendererContext = { bcp, planets, ascendant, birthDatetime, charaOptions };

  if (!collapsible) {
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

  return (
    <div className="space-y-2">
      {activeDashas.map((d, i) => (
        <CollapsibleCard key={d.key} title={d.label} defaultOpen={i === 0}>
          {d.renderer ? renderDasha(d.renderer, ctx) : null}
        </CollapsibleCard>
      ))}
    </div>
  );
}
