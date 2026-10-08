import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { useMemo } from 'react';
import { RENDERABLE_DASHAS } from '@/lib/dashaRegistry';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
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
  /** Target date, YYYY-MM-DD; the running periods in the system headers are for this day. */
  targetDate?: string;
}

export default function DashaPanel({ bcp, planets, ascendant, birthDatetime, dashaSettings, view = 'all', targetDate }: Props) {
  const normalizedDashas = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };
  const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
  const rasiOptions = { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions };
  const summaries = useMemo(() => {
    const birthDate = parseDateTime(birthDatetime);
    if (!birthDate || view === 'finder' || view === 'timeline') return {} as Record<string, DashaEventSnapshot>;
    const eventDate = (targetDate && parseTargetDateString(targetDate)) || new Date();
    return Object.fromEntries(
      calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions, rasiOptions }).map(snapshot => [snapshot.key, snapshot]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDatetime, targetDate, planets, ascendant, dashaSettings, view]);
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
        <DashaSystemCard key={d.key} id={`dasha-${d.key}`} title={d.label} summary={runningPeriod(summaries[d.key])}>
          {d.renderer ? renderDasha(d.renderer, ctx) : null}
        </DashaSystemCard>
      ))}
    </div>
  );
}

const pad = (value: number) => String(value).padStart(2, '0');

/** "Ve – Sa – Me · MD until 03.2027": the running periods of one system, for its header. */
function runningPeriod(snapshot?: DashaEventSnapshot): string | undefined {
  if (!snapshot || snapshot.levels.length === 0) return snapshot?.note;
  const periods = snapshot.levels.map(level => level.value).join(' – ');
  const end = snapshot.mdRange?.endDate;
  return end ? `${periods} · MD → ${pad(end.getMonth() + 1)}.${end.getFullYear()}` : periods;
}
