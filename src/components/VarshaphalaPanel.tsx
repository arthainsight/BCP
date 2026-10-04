'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle } from '@/types';
// Types only: the route does the ephemeris work.
import type { OfficeBearer, PanchaVargiyaBala } from '@/lib/varshaphala';
import { formatDegree } from '@/lib/formatDegree';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import {
  AnnualDashaList,
  AnnualPlaceControl,
  AnnualPlanetTable,
  Row,
  SIGN_ABBR,
  YearStepper,
  annualChartProps,
  buildAnnualParams,
  fmtLocal,
  fmtOffset,
  ordinal,
  referenceJd,
  useAnnualFetch,
  type AnnualPlace,
  type LocalMahadasha,
  type LocalParts,
} from './annualShared';

type VpResponse = {
  year: number;
  local: LocalParts;
  tzOffset: number;
  completedAge: number;
  dayYear: boolean;
  natalAscSign: number;
  muntha: { sign: number; house: number };
  officeBearers: OfficeBearer[];
  yearLord: string;
  reason: string;
  bala: PanchaVargiyaBala[];
  dasha: LocalMahadasha[];
  next: { year: number; local: LocalParts; tzOffset: number };
  chart: ChartData;
};

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate?: string;
  ianaTimezone?: string;
  calculationSettings?: CalculationSettings;
  chartStyle: ChartStyle;
  chartDisplaySettings: ChartDisplaySettings;
  nakshatraAdjust?: number;
  place: AnnualPlace;
  onPlaceChange: (place: AnnualPlace) => void;
};

const ASPECT_LABEL: Record<string, string> = {
  conjunction: 'conjunct', sextile: 'sextile ✓', trine: 'trine ✓', square: 'square', opposition: 'opposition',
};

const fixed = (n: number) => n.toFixed(2);

export default function VarshaphalaPanel({
  chart,
  birthDatetime,
  targetDate,
  ianaTimezone,
  calculationSettings,
  chartStyle,
  chartDisplaySettings,
  nakshatraAdjust = 0,
  place,
  onPlaceChange,
}: Props) {
  const [year, setYear] = useState<number | null>(null);
  const [showNatal, setShowNatal] = useState(false);

  const query = buildAnnualParams({ chart, birthDatetime, ianaTimezone, calculationSettings, place, year, targetDate });
  const { data: shown, error, loading } = useAnnualFetch<VpResponse>('/api/varshaphala', query);

  if (!query) {
    return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">Birth date and place are needed for Varṣaphala.</div>;
  }

  return (
    <div className="space-y-3 min-w-0">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Varṣaphala — Tājika annual chart</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          Cast for the moment the Sun returns to its natal sidereal longitude. Muntha moves one sign a year from the natal lagna;
          the lord of the year is chosen from the five office bearers. Rules after P.V.R. Narasimha Rao, chapters 28–30.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <YearStepper shownYear={shown?.year} year={year} onChange={setYear} />
        <label className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <input type="checkbox" checked={showNatal} onChange={(e) => setShowNatal(e.target.checked)} />
          natal overlay
        </label>
        {loading && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">calculating…</span>}
      </div>

      <AnnualPlaceControl place={place} onChange={onPlaceChange} />

      {error && <div className="text-xs font-mono text-red-600 dark:text-red-400">{error}</div>}

      {shown && (
        <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          {chartStyle === 'south'
            ? <SouthIndianChart {...annualChartProps(shown.chart, chart, showNatal, chartDisplaySettings, nakshatraAdjust)} />
            : <NorthIndianChart {...annualChartProps(shown.chart, chart, showNatal, chartDisplaySettings, nakshatraAdjust)} />}

          <div className="space-y-2">
            <Row label="begins" value={`${fmtLocal(shown.local)} (${fmtOffset(shown.tzOffset)}) · ${shown.dayYear ? 'day' : 'night'}`} />
            <Row label="ends" value={`${fmtLocal(shown.next.local)} (${fmtOffset(shown.next.tzOffset)})`} />
            <Row label="year" value={`${shown.completedAge} completed · ${ordinal(shown.completedAge + 1)} year running`} />
            <Row label="lagna" value={`${SIGN_ABBR[shown.chart.ascendant.sign - 1]} ${formatDegree(shown.chart.ascendant.degree, 'minute')}`} />
            <Row label="muntha" value={`${SIGN_ABBR[shown.muntha.sign - 1]} · house ${shown.muntha.house} of the annual chart`} />
            <Row label="year lord" value={`${shown.yearLord} — ${shown.reason}`} />
          </div>

          <div className="overflow-x-auto">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Pañcādhikārī — office bearers</div>
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  <th className="py-1 pr-3 font-normal">graha</th>
                  <th className="py-1 pr-3 font-normal">office</th>
                  <th className="py-1 pr-3 font-normal">on lagna</th>
                  <th className="py-1 font-normal">bala</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {shown.officeBearers.map((o) => (
                  <tr key={o.planet} className={`border-t border-zinc-100 dark:border-zinc-800 ${o.planet === shown.yearLord ? 'text-emerald-700 dark:text-green-400 font-semibold' : ''}`}>
                    <td className="py-1 pr-3">{o.planet}</td>
                    <td className="py-1 pr-3">{o.roles.join(', ')}</td>
                    <td className="py-1 pr-3">{o.aspectOnLagna ? ASPECT_LABEL[o.aspectOnLagna] : '—'}</td>
                    <td className="py-1 tabular-nums">{fixed(o.bala)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Pañcavargīya Bala</div>
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  <th className="py-1 pr-2 font-normal">graha</th>
                  <th className="py-1 pr-2 font-normal">kṣetra</th>
                  <th className="py-1 pr-2 font-normal">uccha</th>
                  <th className="py-1 pr-2 font-normal">hadda</th>
                  <th className="py-1 pr-2 font-normal">D3</th>
                  <th className="py-1 pr-2 font-normal">D9</th>
                  <th className="py-1 font-normal">total</th>
                </tr>
              </thead>
              <tbody className="tabular-nums text-zinc-700 dark:text-zinc-300">
                {shown.bala.map((b) => (
                  <tr key={b.planet} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1 pr-2">{b.planet}</td>
                    <td className="py-1 pr-2">{fixed(b.kshetra)}</td>
                    <td className="py-1 pr-2">{fixed(b.uchcha)}</td>
                    <td className="py-1 pr-2">{fixed(b.hadda)}</td>
                    <td className="py-1 pr-2">{fixed(b.drekkana)}</td>
                    <td className="py-1 pr-2">{fixed(b.navamsa)}</td>
                    <td className="py-1 font-semibold">{fixed(b.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AnnualDashaList
            title="Mudda daśā (Varṣa Vimśottarī)"
            note="Vimśottarī compressed into this year, entered from the natal nakṣatra advanced one lord per completed year. The running period at the target date is highlighted."
            dasha={shown.dasha}
            referenceJd={referenceJd(targetDate, shown.tzOffset)}
          />

          <AnnualPlanetTable annual={shown.chart} natal={chart} showOuterPlanets={chartDisplaySettings.showOuterPlanets} />
        </div>
      )}
    </div>
  );
}
