'use client';

import { useState, useMemo } from 'react';
import {
  calculateVimshottari,
  calculateSubDashas,
  MahadashaEntry,
} from '@/lib/vimshottari';
import { parseDateTime } from '@/lib/bcp';
import { PlanetData } from '@/types';

const ABBR: Record<string, string> = {
  Ketu: 'Ke', Venus: 'Ve', Sun: 'Su', Moon: 'Mo', Mars: 'Ma',
  Rahu: 'Ra', Jupiter: 'Ju', Saturn: 'Sa', Mercury: 'Me',
};

type Level = 'md' | 'ad' | 'pd' | 'sd' | 'prana' | 'deha';

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
  const [selected, setSelected] = useState<MahadashaEntry[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const result = useMemo(() => {
    const moon = planets.find((p) => p.name === 'Moon');
    if (!moon || moon.longitude == null) return null;
    const bd = parseDateTime(birthDatetime);
    if (!bd) return null;
    return calculateVimshottari(moon.longitude, bd);
  }, [planets, birthDatetime]);

  if (!result) return null;

  const now = new Date();

  const getEntries = () => {
    if (level === 'md') return result.entries;
    const last = selected[selected.length - 1];
    return last ? calculateSubDashas(last) : [];
  };

  const entries = getEntries();

  const nextLevel = (lvl: Level): Level | null => {
    if (lvl === 'md') return 'ad';
    if (lvl === 'ad') return 'pd';
    if (lvl === 'pd') return 'sd';
    if (lvl === 'sd') return 'prana';
    if (lvl === 'prana') return 'deha';
    return null;
  };

  const handleRowClick = (entry: MahadashaEntry) => {
    const next = nextLevel(level);
    if (next) {
      setSelected([...selected, entry]);
      setLevel(next);
      setExpandedKey(null);
    } else {
      const key = entryKey(entry);
      setExpandedKey(expandedKey === key ? null : key);
    }
  };

  return (
    <div className="space-y-2">
      <div className="font-mono text-xs">&gt; vimshottari</div>

      <div className="flex gap-1 text-[10px] font-mono flex-wrap">
        {selected.map((s, i) => (
          <span key={i}>{ABBR[s.lord]} ›</span>
        ))}
        <span>{level.toUpperCase()}</span>
      </div>

      <div>
        {entries.map((entry) => {
          const key = entryKey(entry);
          const active = isActive(entry, now);

          return (
            <button
              key={key}
              onClick={() => handleRowClick(entry)}
              className="w-full flex justify-between px-2 py-1 text-xs font-mono"
            >
              <span>{ABBR[entry.lord]}</span>
              <span>{fmtDateRange(entry.startDate, entry.endDate)}</span>
              {active && <span>●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
