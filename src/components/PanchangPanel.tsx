'use client';

import { ChartData } from '@/types';
import { calculatePanchang, PanchangResult } from '@/lib/panchang';

interface Props {
  chart: ChartData;
  birthDatetime: string;
  utcOffsetHours: number;
  ayanamsaName: string;
  nakshatraAdjust?: number;
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="w-28 shrink-0 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {label}
      </span>
      <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
        {value ?? '—'}
      </span>
    </div>
  );
}

function renderRows(p: PanchangResult) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Row label="vara"      value={`${p.vara} · ${p.varaLord}`} />
        <Row label="tithi"     value={`${p.tithi} (${p.tithiNumber}) · ${p.paksha}`} />
        <Row label="nakshatra" value={`${p.nakshatra} · Pada ${p.nakshatraPada}`} />
        <Row label="karana"    value={p.karana} />
        <Row label="yoga"      value={p.yoga} />
        <Row label="hora"      value={p.hora} />
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
        <Row label="sunrise"    value={p.sunrise} />
        <Row label="sunset"     value={p.sunset} />
        <Row label="solar noon" value={p.solarNoon} />
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
        <Row label="ayanamsa" value={p.ayanamsa} />
        <Row label="masa"     value={p.masa} />
      </div>
    </div>
  );
}

export default function PanchangPanel({ chart, birthDatetime, utcOffsetHours, ayanamsaName, nakshatraAdjust = 0 }: Props) {
  if (!chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
        Calculate a chart to see Panchang
      </div>
    );
  }

  const p = calculatePanchang(chart, birthDatetime, utcOffsetHours, ayanamsaName, nakshatraAdjust);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; panchang</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          times shown in local birth timezone · masa is approximate
        </div>
      </div>
      {renderRows(p)}
    </div>
  );
}
