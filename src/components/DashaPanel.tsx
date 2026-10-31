import { PlanetData, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { useMemo } from 'react';
import { isNakshatraSystemKey, nakshatraSystem } from '@/lib/nakshatraSystems';
import { DASHA_FAMILIES, RENDERABLE_DASHAS, type DashaFamily, type DashaKey } from '@/lib/dashaRegistry';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { mdChangeFlag } from '@/lib/dashaView';
import { useGrahaNames } from '@/lib/grahaNames';
import { renderDasha, DashaRendererContext } from '@/lib/dashaRenderers';
import DashaTimeline from './DashaTimeline';
import DashaDateFinder from './DashaDateFinder';
import DashaSystemCard from './DashaSystemCard';
import { DashaSystemPickerButton, DashaSystemPickerList, type PickerGroup } from './DashaSystemPicker';
import { useDashaNotes } from '@/hooks/useDashaNotes';
import { useT } from '@/lib/i18n';
import { translateDashaText } from '@/lib/dashaText';
import { useEffect, useState, type CSSProperties } from 'react';
import { pad2 } from '@/lib/dateFormat';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  view?: 'all' | 'finder' | 'timeline' | 'systems';
  /** Target date, YYYY-MM-DD; the running periods in the system headers are for this day. */
  targetDate?: string;
  /** Saves the daśā settings; with it the Dasas tab can choose which systems are active. */
  onUpdateDashaSettings?: (update: Partial<DashaSettings>) => void;
}

export default function DashaPanel({ planets, ascendant, birthDatetime, dashaSettings, view = 'all', targetDate, onUpdateDashaSettings }: Props) {
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
  const variantChoice = dashaSettings.variantChoice ?? DEFAULT_DASHA_SETTINGS.variantChoice;
  const summaries = useMemo(() => {
    const birthDate = parseDateTime(birthDatetime);
    if (!birthDate || view === 'finder' || view === 'timeline') return {} as Record<string, DashaEventSnapshot>;
    const eventDate = (targetDate && parseTargetDateString(targetDate)) || new Date();
    return Object.fromEntries(
      calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions, rasiOptions, variantChoice }).map(snapshot => [snapshot.key, snapshot]),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthDatetime, targetDate, planets, ascendant, dashaSettings, view]);
  const activeDashas = RENDERABLE_DASHAS.filter(d => d.renderer && normalizedDashas[d.key]);
  // The systems in the groups of the Dasas tab, in the order of the registry within each.
  const groups: { family: DashaFamily; label: string; members: typeof RENDERABLE_DASHAS; active: typeof RENDERABLE_DASHAS }[] = DASHA_FAMILIES.map(({ key, label }) => {
    const members = RENDERABLE_DASHAS.filter(d => d.family === key);
    return { family: key, label, members, active: members.filter(d => activeDashas.includes(d)) };
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerGroups: PickerGroup[] = groups.map(group => ({ family: group.family, label: group.label, items: group.members.map(d => ({ key: d.key, label: d.label, status: d.status, active: Boolean(normalizedDashas[d.key]), hint: isNakshatraSystemKey(d.key) ? t(nakshatraSystem(d.key).condition) : undefined })) }));
  const setActive = (keys: string[], value: boolean) => {
    const dashas = { ...normalizedDashas };
    for (const key of keys) dashas[key as DashaKey] = value;
    onUpdateDashaSettings?.({ dashas });
  };

  if (activeDashas.length === 0 && view !== 'systems') {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
        {t('All Dasha panels are disabled. Enable them in Settings → Dasha.')}
      </div>
    );
  }

  const ctx: DashaRendererContext = { planets, ascendant, birthDatetime, charaOptions, rasiOptions, variantChoice };
  if (view === 'finder') return <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} variantChoice={variantChoice} />;
  if (view === 'timeline') return <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} variantChoice={variantChoice} />;

  const today = (targetDate && parseTargetDateString(targetDate)) || new Date();

  return (
    <div className="space-y-3">
      {view === 'systems' && (
        <div className="flex items-start justify-between gap-2">
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
          {onUpdateDashaSettings && <div className="ml-auto"><DashaSystemPickerButton groups={pickerGroups} open={pickerOpen} onToggleOpen={() => setPickerOpen(value => !value)} /></div>}
        </div>
      )}
      {view === 'systems' && onUpdateDashaSettings && pickerOpen && (
        <DashaSystemPickerList
          groups={pickerGroups}
          onToggle={key => setActive([key], !normalizedDashas[key as DashaKey])}
          onSetGroup={(family, value) => setActive(groups.find(group => group.family === family)?.members.map(d => d.key) ?? [], value)}
        />
      )}
      {view === 'all' && <DashaDateFinder planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} dashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} variantChoice={variantChoice} />}
      {view === 'all' && <DashaTimeline planets={planets} ascendant={ascendant} birthDatetime={birthDatetime} normalizedDashas={normalizedDashas} charaOptions={charaOptions} rasiOptions={rasiOptions} variantChoice={variantChoice} />}
      {view === 'systems' && activeDashas.length === 0 && (
        <div className="py-4 text-xs font-mono italic text-zinc-400 dark:text-zinc-600">
          {onUpdateDashaSettings ? t('No daśā system is active. Choose them with the … button.') : t('All Dasha panels are disabled. Enable them in Settings → Dasha.')}
        </div>
      )}
      {/* Side by side from the sm breakpoint up; one under the other on a phone. The systems are in three groups. */}
      {groups.filter(group => group.members.length > 0 && (group.active.length > 0 || view === 'systems')).map(group => (
        <section key={group.family} aria-label={t(group.label)} className="space-y-2">
          {view === 'systems' && (
            <h3 className="flex items-baseline gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              <span>{t(group.label)}</span>
              <span className="normal-case tracking-normal">{group.active.length}/{group.members.length}</span>
            </h3>
          )}
          {group.active.length === 0 ? (
            <div className="text-[10px] font-mono italic text-zinc-400 dark:text-zinc-600">{t('None of these is active.')}</div>
          ) : (
            <div
              className="grid grid-cols-1 items-start gap-3 sm:[grid-template-columns:repeat(var(--columns),minmax(0,1fr))]"
              style={{ '--columns': columns } as CSSProperties}
            >
              {group.active.map(d => (
                <DashaSystemCard
                  key={d.key}
                  id={`dasha-${d.key}`}
                  title={d.key === 'vimshottariVariant' ? summaries[d.key]?.label ?? d.label : d.label}
                  summary={translate(runningPeriod(summaries[d.key], t) ?? (isNakshatraSystemKey(d.key) ? t('Condition not met') : '')) || undefined}
                  flag={mdChangeFlag(summaries[d.key], today, t('MD changes'))}
                  note={notes[d.key] ?? ''}
                  onNoteChange={note => setNote(d.key, note)}
                >
                  {d.renderer ? renderDasha(d.renderer, ctx) : null}
                </DashaSystemCard>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}


/** "Ve – Sa – Me · MD until 03.2027": the running periods of one system, for its header. */
function runningPeriod(snapshot: DashaEventSnapshot | undefined, t: (text: string) => string): string | undefined {
  if (!snapshot || snapshot.levels.length === 0) return snapshot?.note ? translateDashaText(snapshot.note, t) : undefined;
  const periods = snapshot.levels.map(level => level.value).join(' – ');
  const end = snapshot.mdRange?.endDate;
  return end ? `${periods} · MD → ${pad2(end.getMonth() + 1)}.${end.getFullYear()}` : periods;
}
