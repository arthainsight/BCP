'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { calculateSubDashas, type MahadashaEntry } from '@/lib/vimshottari';
import { formatDate, formatDateTime } from '@/lib/dateFormat';
import { useGrahaNames } from '@/lib/grahaNames';

import { useT } from '@/lib/i18n';
const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_LABEL: Record<Level, string> = { md: 'MD', ad: 'AD', pd: 'PD', sd: 'SD', prana: 'PR', deha: 'DE' };

const levelIndex = (level: Level) => LEVELS.indexOf(level);
/** From the pratyantar level down the periods are short enough that the times of day matter. */
const showsTime = (level: Level) => levelIndex(level) >= levelIndex('pd');
const entryKey = (entry: MahadashaEntry) => `${entry.lord}-${entry.startDate.getTime()}`;
const activeEntry = (entries: MahadashaEntry[], now: Date) => entries.find(entry => entry.startDate <= now && now < entry.endDate) ?? null;

function range(start: Date, end: Date, level: Level): string {
  return showsTime(level) ? `${formatDateTime(start)}–${formatDateTime(end)}` : `${formatDate(start)}–${formatDate(end)}`;
}

interface Props {
  /** The periods of the first level (the mahādaśās); the levels below them are worked out from these. */
  entries: MahadashaEntry[];
  /** The heading, after the prompt. */
  title: string;
  /** Facts of the method, shown between the heading and the periods running now. */
  details?: ReactNode;
}

/**
 * A daśā in the Vimśottarī form, six levels deep: the periods of one level, a tap on one shows the periods inside it, the
 * running periods are marked, and NOW opens the deepest of them.
 */
export default function DashaDrilldown({ entries: topEntries, title, details }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const [level, setLevel] = useState<Level>('md');
  const [selected, setSelected] = useState<MahadashaEntry[]>([]);
  const now = useMemo(() => new Date(), []);

  /** The running period of each level, from the first down. */
  const activePath = useMemo(() => {
    const path: MahadashaEntry[] = [];
    let entries = topEntries;
    for (let i = 0; i < LEVELS.length; i++) {
      const current = activeEntry(entries, now);
      if (!current) break;
      path.push(current);
      entries = calculateSubDashas(current);
    }
    return path;
  }, [topEntries, now]);

  const depth = levelIndex(level);
  const parent = depth === 0 ? null : selected[depth - 1];
  const entries = level === 'md' ? topEntries : parent ? calculateSubDashas(parent) : [];
  const currentActive = activeEntry(entries, now);
  const nextLevel = depth < LEVELS.length - 1 ? LEVELS[depth + 1] : null;
  const selectedHere = selected[depth] ?? null;
  const deep = showsTime(level);

  const goToLevel = (target: Level) => {
    setSelected(prev => prev.slice(0, levelIndex(target)));
    setLevel(target);
  };
  const goBack = () => { if (depth > 0) goToLevel(LEVELS[depth - 1]); };
  const openNow = () => {
    const index = Math.min(activePath.length - 1, LEVELS.length - 1);
    if (index < 0) return;
    setSelected(activePath.slice(0, index));
    setLevel(LEVELS[index]);
  };
  const handleRowClick = (entry: MahadashaEntry) => {
    setSelected(prev => {
      const next = prev.slice(0, depth);
      next[depth] = entry;
      return next;
    });
    if (nextLevel) setLevel(nextLevel);
  };

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; {title}</div>
        <button
          onClick={openNow}
          className="px-2 py-1 rounded-md border border-cyan-300/70 dark:border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
        >
          {t('NOW')}
        </button>
      </div>

      {details}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1">{t('active now')}</div>
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 leading-5">
          {activePath.length > 0 ? activePath.map((entry, index) => (
            <span key={`${entryKey(entry)}-${index}`} className="inline-flex items-center gap-1">
              <span>{code(entry.lord)} {LEVEL_LABEL[LEVELS[index]]}</span>
              {index < activePath.length - 1 && <span className="text-zinc-400 dark:text-zinc-600">›</span>}
            </span>
          )) : <span className="text-zinc-400 dark:text-zinc-600 italic">{t('No current period in generated timeline.')}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono min-h-[24px] min-w-0">
        {selected.map((entry, index) => {
          const selectedLevel = LEVELS[index];
          const targetLevel = LEVELS[index + 1];
          if (!selectedLevel || !targetLevel) return null;
          return (
            <span key={`${entryKey(entry)}-crumb`} className="inline-flex items-center gap-1">
              {index > 0 && <span className="text-zinc-300 dark:text-zinc-700">›</span>}
              <button
                onClick={() => goToLevel(targetLevel)}
                className={`px-2 py-1 rounded-md border transition-colors ${
                  level === targetLevel
                    ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {code(entry.lord)} {LEVEL_LABEL[selectedLevel]}
              </button>
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1">
          {selected.length > 0 && <span className="text-zinc-300 dark:text-zinc-700">›</span>}
          <button
            onClick={() => goToLevel(level)}
            className="px-2 py-1 rounded-md border border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300"
          >
            {LEVEL_LABEL[level]}
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goBack}
          disabled={level === 'md'}
          className="min-h-11 px-3 py-2 rounded-md text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {t('← back')}
        </button>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{LEVEL_LABEL[level]} · {entries.length} {t('periods')}</div>
      </div>

      <div className="space-y-1 min-w-0">
        {entries.map(entry => {
          const key = entryKey(entry);
          const active = currentActive ? entryKey(currentActive) === key : false;
          const selectedRow = selectedHere ? entryKey(selectedHere) === key : false;
          return (
            <button
              key={key}
              onClick={() => handleRowClick(entry)}
              className={`min-h-11 w-full min-w-0 text-left flex items-center gap-2 px-2 py-2 rounded-lg border transition-colors group ${
                active
                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                  : selectedRow
                  ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span className="font-mono text-xs font-bold w-7 flex-shrink-0">{code(entry.lord)}</span>
              {deep ? (
                <span className="min-w-0 flex-1 font-mono text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-500 tabular-nums leading-4">
                  <span className="block truncate">{formatDateTime(entry.startDate)}</span>
                  <span className="block truncate text-zinc-400 dark:text-zinc-600">→ {formatDateTime(entry.endDate)}</span>
                </span>
              ) : (
                <span className="min-w-0 flex-1 font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 tabular-nums truncate">{range(entry.startDate, entry.endDate, level)}</span>
              )}
              {active && <span className="text-[8px] text-cyan-500 dark:text-cyan-400 flex-shrink-0">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
