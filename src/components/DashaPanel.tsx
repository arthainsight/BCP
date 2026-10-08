import { BcpResult, PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { useMemo } from 'react';
import { RENDERABLE_DASHAS } from '@/lib/dashaRegistry';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { mdChangeFlag } from '@/lib/dashaView';
import { useGrahaNames } from '@/lib/grahaNames';
import { renderDasha, DashaRendererContext } from '@/lib/dashaRenderers';
import DashaTimeline from './DashaTimeline';
import DashaDateFinder from './DashaDateFinder';
import DashaSystemCard from './DashaSystemCard';
import { useDashaNotes } from '@/hooks/useDashaNotes';
import { useT } from '@/lib/i18n';
import { useEffect, useState, type CSSProperties } from 'react';

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
  const { translate } = useGrahaNames();
  const t = useT();
  const [notes, setNote] = useDashaNotes(birthDatetime);
  // How many daśā systems stand side by side on a wide screen; remembered.
  const [columns, setColumnsState] = useState(1);
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem('dashaColumns'));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored >= 1 && stored <= 4) setColumnsState(stored);
    } catch {}
  }, []);
  const setColumns = (value: number) => {
    setColumnsState(value);
    try { localStorage.setItem('dashaColumns', String(value)); } catch {}
  };
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

  const today = (targetDate && parseTargetDateString(targetDate)) || new Date();

  return (
    <div className="space-y-3">
      {view === 'systems' && (
        <div className="hidden items-center gap-1 sm:flex">
          <span className="mr-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('columns')}</span>
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              type="button"
              aria-pressed={columns === count}
              onClick={() => setColumns(count)}
              className={`rounded-md border px-2 py-1 text-[10px] font-mono ${columns === count
                ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
                : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`}
            >
              {count}
            </button>
          ))}
        </div>
      )}
      {view === 'all' && <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />}
      {view === 'all' && <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} />}
      {/* Side by side from the sm breakpoint up; one under the other on a phone. */}
      <div
        className="grid grid-cols-1 items-start gap-3 sm:[grid-template-columns:repeat(var(--columns),minmax(0,1fr))]"
        style={{ '--columns': columns } as CSSProperties}
      >
        {activeDashas.map(d => (
          <DashaSystemCard
            key={d.key}
            id={`dasha-${d.key}`}
            title={d.label}
            summary={translate(runningPeriod(summaries[d.key]) ?? '') || undefined}
            flag={mdChangeFlag(summaries[d.key], today, t('MD changes'))}
            note={notes[d.key] ?? ''}
            onNoteChange={note => setNote(d.key, note)}
          >
            {d.renderer ? renderDasha(d.renderer, ctx) : null}
          </DashaSystemCard>
        ))}
      </div>
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
