'use client';

import type { CalculationSettings, ChartData, ChartDisplaySettings, PlanetData } from '@/types';
import type { TransitLocation } from '@/hooks/useEventTransits';
import type { DashaEventSnapshot } from '@/lib/dashaEvents';
import { DASHA_EVENT_CATEGORY_LABELS, DASHA_EVENT_VARGAS, formatEventDate, type DashaEventCategory, type DashaEventVarga, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { fill, useT } from '@/lib/i18n';
import { SIGN_ABBR } from '@/lib/signs';
import { getVargaSignIndex } from '@/lib/varga';
import EventTransits from './EventTransits';

const SELECT = 'mt-1 min-h-11 w-full min-w-0 rounded border border-zinc-300 bg-white px-1.5 py-2 dark:border-zinc-700 dark:bg-zinc-900';
const ACTION = 'min-h-11 rounded border px-2 py-2 text-[10px]';
const CAPTION = 'text-[10px] font-mono uppercase tracking-widest text-zinc-400';

/** The daśā systems at one day: the periods running in each, or why there are none. */
function Snapshots({ snapshots }: { snapshots: DashaEventSnapshot[] }) {
  const t = useT();
  if (!snapshots.length) return <p className="text-xs italic text-zinc-400">{t('No visible Dasha systems or invalid date.')}</p>;
  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {snapshots.map(snapshot => (
        <div key={snapshot.key} className="grid min-w-0 grid-cols-1 gap-1 py-2 text-[11px] sm:grid-cols-[minmax(105px,0.8fr)_minmax(0,1.4fr)] sm:gap-2">
          <span className="break-words font-medium text-zinc-600 dark:text-zinc-300">{snapshot.label}</span>
          {snapshot.levels.length ? (
            <span className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 font-mono">
              {snapshot.levels.map(level => (
                <span key={level.level} className="break-words"><span className="text-zinc-400">{level.level}</span> <span className="font-semibold text-emerald-700 dark:text-green-400">{level.value}</span></span>
              ))}
            </span>
          ) : <span className="break-words italic text-zinc-400">{snapshot.note ?? t('Unavailable')}</span>}
        </div>
      ))}
    </div>
  );
}

interface Props {
  item: StoredDashaEvent;
  open: boolean;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onChange: (update: Partial<StoredDashaEvent>) => void;
  onDelete: () => void;
  onHover: (hovered: boolean) => void;
  planets: PlanetData[];
  /** The daśā systems on the event's first day, and on its last day when it lasted for a while. */
  startSnapshots: DashaEventSnapshot[];
  endSnapshots: DashaEventSnapshot[];
  /** The moment the transits are shown for, and the grahas at it. */
  transitDatetime: string;
  transitPlanets: PlanetData[];
  onSetTransitDatetime?: (value: string) => void;
  onOpenVargaMatrix?: () => void;
  onOpenDateInChart?: (date: string) => void;
  /** For the transits of the event's day shown on the charts. */
  chart?: ChartData;
  chartDisplaySettings?: ChartDisplaySettings;
  transitLocation?: TransitLocation;
  calculationSettings?: CalculationSettings;
}

/** One event of the list: its name, days, category and stars on a line, and under it the details to change and the daśās of its days. */
export default function DashaEventCard({
  item, open, selected, hovered, onSelect, onChange, onDelete, onHover, planets, startSnapshots, endSnapshots,
  transitDatetime, transitPlanets, onSetTransitDatetime, onOpenVargaMatrix, onOpenDateInChart, chart, chartDisplaySettings, transitLocation, calculationSettings,
}: Props) {
  const t = useT();
  const division = Number(item.varga.slice(1));
  const transitIsOnTheDay = transitDatetime.startsWith(formatEventDate(item.date));

  return (
    <details open={open} onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)} className="group min-w-0 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2">
        <span className="row-span-2 text-zinc-400 transition-transform group-open:rotate-90">›</span>
        <span className="flex min-w-0 items-center gap-1.5">
          <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center">
            <input type="checkbox" checked={selected} onChange={onSelect} aria-label={fill(t('Select {name}'), { name: item.name })} className="h-4 w-4 accent-emerald-600" />
          </label>
          <span className="min-w-0 break-words text-xs font-semibold">{item.name}</span>
        </span>
        <button type="button" onClick={event => { event.preventDefault(); onDelete(); }} className="row-span-2 min-h-10 rounded px-2 py-1 text-[11px] text-red-600" aria-label={fill(t('Delete {name}'), { name: item.name })}>{t('Delete')}</button>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[10px] text-amber-500">{'★'.repeat(item.significance)}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500 dark:bg-zinc-800">{t(DASHA_EVENT_CATEGORY_LABELS[item.category])}</span>
          <span className="font-mono text-[10px] text-zinc-500">{formatEventDate(item.date)}{item.endDate ? ` – ${formatEventDate(item.endDate)}` : ''}</span>
        </span>
      </summary>
      <div className="min-w-0 space-y-3 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
          <label className="min-w-0 text-[10px] text-zinc-500">{t('Date')}
            <input type="date" value={item.date} onChange={event => event.target.value && onChange({ date: event.target.value })} className={SELECT} />
          </label>
          <label className="min-w-0 text-[10px] text-zinc-500">{t('End date')}
            <input type="date" value={item.endDate ?? ''} min={item.date} onChange={event => onChange({ endDate: event.target.value || undefined })} className={SELECT} />
          </label>
          <label className="min-w-0 text-[10px] text-zinc-500">{t('Category')}
            <select value={item.category} onChange={event => onChange({ category: event.target.value as DashaEventCategory })} className={SELECT}>
              {Object.entries(DASHA_EVENT_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-[10px] text-zinc-500">{t('Varga')}
            <select value={item.varga} onChange={event => onChange({ varga: event.target.value as DashaEventVarga })} className={SELECT}>
              {DASHA_EVENT_VARGAS.map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          {onOpenVargaMatrix && <button type="button" onClick={onOpenVargaMatrix} title={t('Show the Matrix & Bala of the Varga view in ANALYSIS')} className={`${ACTION} border-zinc-300 dark:border-zinc-700`}>{t('Open Varga Matrix')}</button>}
          {onSetTransitDatetime && <button type="button" onClick={() => onSetTransitDatetime(`${formatEventDate(item.date)} 12.00.00`)} title={t('Move the target moment, and the transits with it, to this date')} className={`${ACTION} border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-300`}>{t('Set as target')}</button>}
          {onOpenDateInChart && <button type="button" onClick={() => onOpenDateInChart(item.date)} title={t('Read BCP, RSN, dasha lords and transits for this date')} className={`${ACTION} border-emerald-400 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300`}>{t('Open in chart')}</button>}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <textarea value={item.notes} onChange={event => onChange({ notes: event.target.value })} placeholder={t('Notes')} rows={2} className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          <input value={item.tags.join(', ')} onChange={event => onChange({ tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} placeholder={t('Tags, comma separated')} className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          <label className="text-[10px] text-zinc-500">{t('Significance')}
            <select value={item.significance} onChange={event => onChange({ significance: Number(event.target.value) })} className="mt-1 block rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
              {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} / 5</option>)}
            </select>
          </label>
        </div>
        <div className="text-[9px] font-mono text-zinc-400">{item.varga}: {planets.map(planet => `${planet.name.slice(0, 2)} ${SIGN_ABBR[getVargaSignIndex(planet.longitude, division)]}`).join(' · ')}</div>
        <EventTransits date={item.date} chart={chart} chartDisplaySettings={chartDisplaySettings} location={transitLocation} calculationSettings={calculationSettings} hovered={hovered} />
        {transitIsOnTheDay && (
          <div className="rounded border border-violet-200 bg-violet-50/50 p-2 text-[9px] font-mono text-violet-700 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-300">
            {t('Transit')} {transitDatetime}: {transitPlanets.length ? transitPlanets.map(planet => `${planet.name.slice(0, 2)} ${SIGN_ABBR[planet.sign - 1]}`).join(' · ') : t('calculating or unavailable')}
          </div>
        )}
        {item.endDate && <div className={CAPTION}>{t('At the start')} · {formatEventDate(item.date)}</div>}
        <Snapshots snapshots={startSnapshots} />
        {item.endDate && (
          <>
            <div className={CAPTION}>{t('At the end')} · {formatEventDate(item.endDate)}</div>
            <Snapshots snapshots={endSnapshots} />
          </>
        )}
      </div>
    </details>
  );
}
