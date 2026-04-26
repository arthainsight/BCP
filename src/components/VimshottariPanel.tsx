'use client';

import { useState, useMemo } from 'react';
import {
  calculateVimshottari,
  calculateAntardashas,
  calculatePratyantardashas,
  MahadashaEntry,
} from '@/lib/vimshottari';
import { parseDateTime } from '@/lib/bcp';
import { PlanetData } from '@/types';

const ABBR: Record<string, string> = {
  Ketu: 'Ke', Venus: 'Ve', Sun: 'Su', Moon: 'Mo', Mars: 'Ma',
  Rahu: 'Ra', Jupiter: 'Ju', Saturn: 'Sa', Mercury: 'Me',
};

type Level = 'md' | 'ad' | 'pd';

function fmtDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function fmtDateRange(start: Date, end: Date): string {
  return `${fmtDate(start)}–${fmtDate(end)}`;
}

function isActive(e: MahadashaEntry, now: Date): boolean {
  return e.startDate <= now && now < e.endDate;
}

function entryKey(e: MahadashaEntry): string {
  return e.lord + String(e.startDate.getTime());
}

interface Props {
  planets: PlanetData[];
  birthDatetime: string;
  showMd: boolean;
  showAd: boolean;
  showPd: boolean;
}

export default function VimshottariPanel({ planets, birthDatetime, showMd, showAd, showPd }: Props) {
  const [level, setLevel] = useState<Level>('md');
  const [selectedMd, setSelectedMd] = useState<MahadashaEntry | null>(null);
  const [selectedAd, setSelectedAd] = useState<MahadashaEntry | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const result = useMemo(() => {
    const moon = planets.find((p) => p.name === 'Moon');
    if (!moon || moon.longitude == null) return null;
    const bd = parseDateTime(birthDatetime);
    if (!bd) return null;
    return calculateVimshottari(moon.longitude, bd);
  }, [planets, birthDatetime]);

  if (!result) {
    const moon = planets.find((p) => p.name === 'Moon');
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vimshottari</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          {!moon ? 'Moon data required.' : 'Invalid birth datetime.'}
        </div>
      </div>
    );
  }

  if (!showMd) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vimshottari</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          MD disabled — enable in Settings → Dasha.
        </div>
      </div>
    );
  }

  const now = new Date();

  const entries: MahadashaEntry[] =
    level === 'md'
      ? result.entries
      : level === 'ad' && selectedMd
      ? calculateAntardashas(selectedMd)
      : level === 'pd' && selectedAd
      ? calculatePratyantardashas(selectedAd)
      : [];

  const canDrillDown = (level === 'md' && showAd) || (level === 'ad' && showPd);

  const handleRowClick = (entry: MahadashaEntry) => {
    const key = entryKey(entry);
    if (level === 'md' && showAd) {
      setSelectedMd(entry);
      setSelectedAd(null);
      setLevel('ad');
      setExpandedKey(null);
    } else if (level === 'ad' && showPd) {
      setSelectedAd(entry);
      setLevel('pd');
      setExpandedKey(null);
    } else {
      setExpandedKey(expandedKey === key ? null : key);
    }
  };

  const goTo = (target: Level) => {
    setLevel(target);
    if (target === 'md') { setSelectedMd(null); setSelectedAd(null); }
    if (target === 'ad') setSelectedAd(null);
    setExpandedKey(null);
  };

  const levelLabel = level === 'md' ? 'MD' : level === 'ad' ? 'AD' : 'PD';

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        &gt; vimshottari
      </div>

      {/* Nakshatra info */}
      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
        {result.nakshatra} · {ABBR[result.nakshatraLord] ?? result.nakshatraLord}
      </div>

      {/* Breadcrumb — shown when drilling down */}
      <div className="flex items-center gap-1 text-[10px] font-mono min-h-[16px]">
        {level === 'md' ? (
          <span className="text-zinc-500 dark:text-zinc-400">mahadasha</span>
        ) : (
          <>
            <button
              onClick={() => goTo('md')}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              {selectedMd ? (ABBR[selectedMd.lord] ?? selectedMd.lord) : '?'} MD
            </button>
            {level === 'pd' && selectedAd && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">›</span>
                <button
                  onClick={() => goTo('ad')}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  {ABBR[selectedAd.lord] ?? selectedAd.lord} AD
                </button>
              </>
            )}
            <span className="text-zinc-300 dark:text-zinc-700">›</span>
            <span className="text-zinc-700 dark:text-zinc-300">{levelLabel}</span>
          </>
        )}
      </div>

      {/* Entry list */}
      <div>
        {entries.map((entry) => {
          const key = entryKey(entry);
          const active = isActive(entry, now);
          const expanded = expandedKey === key;
          const abbr = ABBR[entry.lord] ?? entry.lord.slice(0, 2);

          return (
            <div key={key}>
              <button
                onClick={() => handleRowClick(entry)}
                className={`w-full text-left flex items-center gap-2 px-1 py-1 rounded transition-colors group ${
                  active
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span className="font-mono text-xs font-bold w-6 flex-shrink-0">
                  {abbr}
                </span>
                <span className="font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 flex-1 tabular-nums whitespace-nowrap">
                  {fmtDateRange(entry.startDate, entry.endDate)}
                </span>
                {active && (
                  <span className="text-[8px] text-amber-500 dark:text-amber-400 flex-shrink-0">●</span>
                )}
                {canDrillDown && (
                  <span className="text-[10px] text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 flex-shrink-0">
                    ›
                  </span>
                )}
              </button>
              {expanded && (
                <div className="pl-8 pb-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600 tabular-nums">
                  {entry.lord} · {fmtDate(entry.startDate)} – {fmtDate(entry.endDate)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
