import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { RENDERABLE_DASHAS } from '@/lib/dashaRegistry';
import { renderDasha, DashaRendererContext } from '@/lib/dashaRenderers';
import DashaTimeline from './DashaTimeline';
import DashaDateFinder from './DashaDateFinder';
import DashaSystemCard from './DashaSystemCard';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  view?: 'all' | 'finder' | 'timeline' | 'systems';
}

export default function DashaPanel({ bcp, planets, ascendant, birthDatetime, dashaSettings, view = 'all' }: Props) {
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
  if (view === 'finder') return <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />;
  if (view === 'timeline') return <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />;

  return (
    <div className="space-y-3">
      {view === 'all' && <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />}
      {view === 'all' && <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />}
      {activeDashas.map(d => (
        <DashaSystemCard key={d.key} id={`dasha-${d.key}`} title={d.label}>
          {d.renderer ? renderDasha(d.renderer, ctx) : null}
        </DashaSystemCard>
      ))}
    </div>
  );
}
