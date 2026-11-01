'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle } from '@/types';
import type { OfficeRole } from '@/lib/varshaphala';
import { formatDegree } from '@/lib/formatDegree';
import StyledChart from './StyledChart';
import {
  AnnualDashaList, AnnualPlaceControl, AnnualPlanetTable, Row, annualChartProps, buildAnnualParams, fmtLocal, fmtOffset, referenceJd, toggleClass, useAnnualFetch,
  type AnnualPlace, type LocalMahadasha, type LocalParts,
} from './annualShared';
import { SIGN_ABBR } from '@/lib/signs';
import { fill, useT } from '@/lib/i18n';

type Kind = 'masa' | 'dina';
type PeriodResponse = {
  kind: Kind;
  n: number;
  count: number;
  year: number;
  local: LocalParts;
  tzOffset: number;
  dayChart: boolean;
  end: { local: LocalParts; tzOffset: number };
  muntha: { sign: number; house: number } | null;
  officeBearers: { planet: string; roles: OfficeRole[]; bala: number }[];
  strongest: string | null;
  patyamshi: LocalMahadasha[];
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
  /** The Varṣa-praveśa year the months and days are counted in. */
  year: number | null;
};

/**
 * Māsa-praveśa and Dina-praveśa (Tājika Nīlakaṇṭhī, Varṣatantra): the chart for the moment the Sun is (n − 1) signs (a month) or (n − 1) degrees (a day) beyond its natal longitude,
 * counted from the Varṣa-praveśa. For a month the six office bearers and the Pātyāṁśī daśā of 30 days for 360.
 */
export default function VarshaPeriodPanel({ chart, birthDatetime, targetDate, ianaTimezone, calculationSettings, chartStyle, chartDisplaySettings, nakshatraAdjust = 0, place, onPlaceChange, year }: Props) {
  const t = useT();
  const [kind, setKind] = useState<Kind>('masa');
  const [n, setN] = useState<number | null>(null);
  const extra: Record<string, string> = { kind };
  if (n !== null) extra.n = String(n);
  const query = buildAnnualParams({ chart, birthDatetime, ianaTimezone, calculationSettings, place, year, targetDate, extra });
  const { data: shown, error, loading } = useAnnualFetch<PeriodResponse>('/api/varshaphala/period', query);
  if (!query) return null;
  const ROLE: Record<string, string> = {
    'Māsa lagneśa': 'Māsa lagneśa', 'Muntheśa': 'Muntheśa', 'Janma lagneśa': 'Janma lagneśa', 'Tri-rāśi pati': 'Tri-rāśi pati', 'Dina-rātri pati': 'Dina-rātri pati', 'Varṣa lagneśa': 'Varṣa lagneśa',
  };
  const step = (delta: number) => { if (shown) setN(Math.min(shown.count, Math.max(1, shown.n + delta))); };

  return (
    <div className="space-y-3 min-w-0 border-t border-zinc-200 pt-3 dark:border-zinc-800" data-varsha="period">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{t('Māsa-praveśa and Dina-praveśa')}</div>
        <div className="mt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Tājika Nīlakaṇṭhī, Varṣatantra: the chart for the moment the Sun is (n − 1) signs beyond its natal longitude for the nth month, or (n − 1) degrees beyond it for the nth day, counted from the Varṣa-praveśa. For a month: the six office bearers (the text says only that the stronger of them is the lord; Pañcavargīya Bala is the measure here) and the Pātyāṁśī daśā of 30 days for 360. The seven office bearers of a day and the results of the verses are not given.')}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(['masa', 'dina'] as const).map(option => (
          <button key={option} type="button" className={toggleClass(kind === option)} onClick={() => { setKind(option); setN(null); }}>{option === 'masa' ? t('month') : t('day')}</button>
        ))}
        <button type="button" className={toggleClass(false)} onClick={() => step(-1)} disabled={!shown || shown.n <= 1} aria-label={t('previous')}>‹</button>
        <span className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-300">{shown ? `${shown.n} / ${shown.count}` : '…'}</span>
        <button type="button" className={toggleClass(false)} onClick={() => step(1)} disabled={!shown || shown.n >= shown.count} aria-label={t('next')}>›</button>
        {n !== null && <button type="button" className={toggleClass(false)} onClick={() => setN(null)}>{t('now')}</button>}
        {loading && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('calculating…')}</span>}
      </div>
      <AnnualPlaceControl place={place} onChange={onPlaceChange} />
      {error && <div className="text-xs font-mono text-red-600 dark:text-red-400">{error}</div>}
      {shown && (
        <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          <StyledChart style={chartStyle} {...annualChartProps(shown.chart, chart, false, chartDisplaySettings, nakshatraAdjust)} />
          <div className="space-y-2">
            <Row label={t('begins')} value={`${fmtLocal(shown.local)} (${fmtOffset(shown.tzOffset)}) · ${shown.dayChart ? t('day') : t('night')}`} />
            <Row label={t('ends')} value={`${fmtLocal(shown.end.local)} (${fmtOffset(shown.end.tzOffset)})`} />
            <Row label="lagna" value={`${SIGN_ABBR[shown.chart.ascendant.sign - 1]} ${formatDegree(shown.chart.ascendant.degree, 'minute')}`} />
            {shown.muntha && <Row label="muntha" value={`${SIGN_ABBR[shown.muntha.sign - 1]} · ${fill(t('house {house} of the annual chart'), { house: shown.muntha.house })}`} />}
          </div>
          {shown.officeBearers.length > 0 && (
            <div className="overflow-x-auto">
              <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Office bearers of the month')}</div>
              <table className="w-full text-[11px] font-mono">
                <tbody className="text-zinc-700 dark:text-zinc-300">
                  {shown.officeBearers.map(o => (
                    <tr key={o.planet} className={`border-t border-zinc-100 dark:border-zinc-800 ${o.planet === shown.strongest ? 'font-semibold text-emerald-700 dark:text-green-400' : ''}`}>
                      <td className="py-1 pr-3">{o.planet}</td>
                      <td className="py-1 pr-3">{o.roles.map(role => t(ROLE[role] ?? role)).join(', ')}</td>
                      <td className="py-1 tabular-nums">{o.bala.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AnnualDashaList
            title={t('Pātyāṁśī daśā')}
            note={t('The Lagna and the grahas by their degrees in their signs, from the smallest; each takes the part of the period that its degrees less those of the one before it are of the greatest degrees.')}
            dasha={shown.patyamshi}
            referenceJd={referenceJd(targetDate, shown.tzOffset)}
          />
          <AnnualPlanetTable annual={shown.chart} natal={chart} showOuterPlanets={chartDisplaySettings.showOuterPlanets} />
        </div>
      )}
    </div>
  );
}
