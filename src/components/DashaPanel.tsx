import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { RENDERABLE_DASHAS } from '@/lib/dashaRegistry';
import { renderDasha, DashaRendererContext } from '@/lib/dashaRenderers';
import CollapsibleCard from './CollapsibleCard';
import DashaTimeline from './DashaTimeline';
import DashaDateFinder from './DashaDateFinder';

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
  const rasiOptions = { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions };
  const activeDashas = RENDERABLE_DASHAS.filter(d => d.renderer && normalizedDashas[d.key]);

  if (activeDashas.length === 0) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
        All Dasha panels are disabled. Enable them in Settings → Dasha.
      </div>
    );
  }

  const ctx: DashaRendererContext = { bcp, planets, ascendant, birthDatetime, charaOptions, rasiOptions };

  if (!collapsible) {
    return (
      <div className="space-y-8">
        <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />
        <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />
        {activeDashas.map(d => (
          <div key={d.key} id={`dasha-${d.key}`} className="min-w-0 scroll-mt-4">
            {d.renderer ? renderDasha(d.renderer, ctx) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />
      <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />
      {activeDashas.map((d, i) => (
        <div key={d.key} id={`dasha-${d.key}`} className="scroll-mt-4"><CollapsibleCard title={d.label} defaultOpen={i === 0}>
          {d.renderer ? renderDasha(d.renderer, ctx) : null}
        </CollapsibleCard></div>
      ))}
    </div>
  );
}
