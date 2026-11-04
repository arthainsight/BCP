'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle } from '@/types';
// Types only: the route does the ephemeris work.
import type { OfficeBearer, PanchaVargiyaBala } from '@/lib/varshaphala';
import type { DwadashavargiyaRow, HarshaBalaRow } from '@/lib/varshaphalaStrength';
import { formatDegree } from '@/lib/formatDegree';
import StyledChart from './StyledChart';
import {
  AnnualDashaList,
  AnnualPlaceControl,
  AnnualPlanetTable,
  Row,
  YearStepper,
  annualChartProps,
  buildAnnualParams,
  fmtLocal,
  fmtOffset,
  referenceJd,
  useAnnualFetch,
  type AnnualPlace,
  type LocalMahadasha,
  type LocalParts,
} from './annualShared';
import { SIGN_ABBR } from '@/lib/signs';
import VarshaPeriodPanel from './VarshaPeriodPanel';

import { fill, useLanguage, useT } from '@/lib/i18n';
import { ordinal } from '@/lib/ordinal';
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
  harshaBala: HarshaBalaRow[];
  dwadashavargiyaBala: DwadashavargiyaRow[];
  dasha: LocalMahadasha[];
  patyamshi: LocalMahadasha[];
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
  const t = useT();
  const language = useLanguage();
  // The server sends the reason in English; the count is the only variable part.
  const reasonText = (reason: string) => {
    const count = /of the (\d+) office bearers/.exec(reason)?.[1];
    return count
      ? fill(t('Strongest by Pañcavargīya Bala of the {count} office bearers aspecting the annual lagna.'), { count })
      : t(reason);
  };
  const [year, setYear] = useState<number | null>(null);
  const [showNatal, setShowNatal] = useState(false);

  const query = buildAnnualParams({ chart, birthDatetime, ianaTimezone, calculationSettings, place, year, targetDate });
  const { data: shown, error, loading } = useAnnualFetch<VpResponse>('/api/varshaphala', query);

  if (!query) {
    return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{t('Birth date and place are needed for Varṣaphala.')}</div>;
  }

  return (
    <div className="space-y-3 min-w-0">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{t('Varṣaphala — Tājika annual chart')}</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          {t('Cast for the moment the Sun returns to its natal sidereal longitude. Muntha moves one sign a year from the natal lagna; the lord of the year is chosen from the five office bearers. Rules after P.V.R. Narasimha Rao, chapters 28–30.')}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <YearStepper shownYear={shown?.year} year={year} onChange={setYear} />
        <label className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <input type="checkbox" checked={showNatal} onChange={(e) => setShowNatal(e.target.checked)} />
          {t('natal overlay')}
        </label>
        {loading && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('calculating…')}</span>}
      </div>

      <AnnualPlaceControl place={place} onChange={onPlaceChange} />

      {error && <div className="text-xs font-mono text-red-600 dark:text-red-400">{error}</div>}

      {shown && (
        <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          <StyledChart style={chartStyle} {...annualChartProps(shown.chart, chart, showNatal, chartDisplaySettings, nakshatraAdjust)} />

          <div className="space-y-2">
            <Row label={t('begins')} value={`${fmtLocal(shown.local)} (${fmtOffset(shown.tzOffset)}) · ${shown.dayYear ? t('day') : t('night')}`} />
            <Row label={t('ends')} value={`${fmtLocal(shown.next.local)} (${fmtOffset(shown.next.tzOffset)})`} />
            <Row label={t('year')} value={fill(t('{age} completed · {ordinal} year running'), { age: shown.completedAge, ordinal: ordinal(shown.completedAge + 1, language) })} />
            <Row label="lagna" value={`${SIGN_ABBR[shown.chart.ascendant.sign - 1]} ${formatDegree(shown.chart.ascendant.degree, 'minute')}`} />
            <Row label="muntha" value={`${SIGN_ABBR[shown.muntha.sign - 1]} · ${fill(t('house {house} of the annual chart'), { house: shown.muntha.house })}`} />
            <Row label={t('year lord')} value={`${shown.yearLord} — ${reasonText(shown.reason)}`} />
          </div>

          <div className="overflow-x-auto">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">{t('Pañcādhikārī — office bearers')}</div>
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  <th className="py-1 pr-3 font-normal">graha</th>
                  <th className="py-1 pr-3 font-normal">{t('office')}</th>
                  <th className="py-1 pr-3 font-normal">{t('on lagna')}</th>
                  <th className="py-1 font-normal">bala</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {shown.officeBearers.map((o) => (
                  <tr key={o.planet} className={`border-t border-zinc-100 dark:border-zinc-800 ${o.planet === shown.yearLord ? 'text-emerald-700 dark:text-green-400 font-semibold' : ''}`}>
                    <td className="py-1 pr-3">{o.planet}</td>
                    <td className="py-1 pr-3">{o.roles.join(', ')}</td>
                    <td className="py-1 pr-3">{o.aspectOnLagna ? t(ASPECT_LABEL[o.aspectOnLagna]) : '—'}</td>
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
                  <th className="py-1 font-normal">{t('total')}</th>
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

          <div className="overflow-x-auto">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">Harṣa Bala · Charak</div>
            <table className="w-full min-w-[620px] text-[11px] font-mono">
              <thead><tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                <th className="py-1 pr-2 font-normal">graha</th>
                <th className="py-1 pr-2 font-normal">{t('position')}</th>
                <th className="py-1 pr-2 font-normal">{t('own / exalted')}</th>
                <th className="py-1 pr-2 font-normal">{t('gender')}</th>
                <th className="py-1 pr-2 font-normal">{t('day / night')}</th>
                <th className="py-1 font-normal">{t('total')} / 20</th>
              </tr></thead>
              <tbody className="tabular-nums text-zinc-700 dark:text-zinc-300">
                {shown.harshaBala.map(row => (
                  <tr key={row.planet} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="py-1 pr-2">{row.planet}</td>
                    <td className="py-1 pr-2">{row.positional}</td>
                    <td className="py-1 pr-2">{row.ownOrExalted}</td>
                    <td className="py-1 pr-2">{row.gender}</td>
                    <td className="py-1 pr-2">{row.dayNight}</td>
                    <td className="py-1 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Four independent conditions; each contributes five points. Male planets: Sun, Mars, Jupiter. Female planets: Moon, Mercury, Venus, Saturn.')}</p>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Dvādaśavargīya Bala · Charak</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-[11px] font-mono">
                <thead><tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  <th className="py-1 pr-2 font-normal">graha</th><th className="py-1 pr-2 font-normal">B</th>
                  <th className="py-1 pr-2 font-normal">M</th><th className="py-1 pr-2 font-normal">N</th>
                  <th className="py-1 pr-2 font-normal">{t('net')}</th><th className="py-1 font-normal">{t('result')}</th>
                </tr></thead>
                <tbody className="text-zinc-700 dark:text-zinc-300">
                  {shown.dwadashavargiyaBala.map(row => (
                    <tr key={row.planet} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="py-1 pr-2">{row.planet}</td><td className="py-1 pr-2 tabular-nums">{row.benefic}</td>
                      <td className="py-1 pr-2 tabular-nums">{row.malefic}</td><td className="py-1 pr-2 tabular-nums">{row.neutral}</td>
                      <td className="py-1 pr-2 tabular-nums">{row.net > 0 ? '+' : ''}{row.net}</td>
                      <td className={`py-1 font-semibold ${row.result === 'benefic' ? 'text-emerald-700 dark:text-green-400' : row.result === 'malefic' ? 'text-rose-600 dark:text-rose-400' : ''}`}>{t(row.result)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1">
              {shown.dwadashavargiyaBala.map(row => (
                <details key={row.planet} className="border-t border-zinc-100 pt-1 dark:border-zinc-800">
                  <summary className="cursor-pointer text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{row.planet} · {row.benefic} B / {row.malefic} M / {row.neutral} N</summary>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono sm:grid-cols-3">
                    {row.factors.map(factor => <div key={factor.division} className="text-zinc-500 dark:text-zinc-400">
                      <strong>{factor.name}</strong> · {factor.lord} · {t(factor.disposition)} <span className="text-zinc-400">({factor.reason})</span>
                    </div>)}
                  </div>
                </details>
              ))}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('B = benefic, M = malefic, N = neutral. Own, exaltation and debilitation override the Tājika relationship. D5 uses Charak’s planet-lord sequence; the other vargas use the twelve-division chart mapping.')}</p>
          </div>

          <AnnualDashaList
            title={t('Pātyāṁśī daśā')}
            note={t('The daśā of the Tājika Nīlakaṇṭhī itself (Varṣatantra, verses 1–3): the Lagna and the grahas by their degrees in their signs, from the smallest; each takes the part of the year that its degrees less those of the one before it are of the greatest degrees. The running period at the target date is highlighted.')}
            dasha={shown.patyamshi}
            referenceJd={referenceJd(targetDate, shown.tzOffset)}
          />

          <AnnualDashaList
            title="Mudda daśā (Varṣa Vimśottarī)"
            note={t('Vimśottarī compressed into this year, entered from the natal nakṣatra advanced one lord per completed year (a daśā of the commentary of Mahīdhara, not of Nīlakaṇṭha). The running period at the target date is highlighted.')}
            dasha={shown.dasha}
            referenceJd={referenceJd(targetDate, shown.tzOffset)}
          />

          <AnnualPlanetTable annual={shown.chart} natal={chart} showOuterPlanets={chartDisplaySettings.showOuterPlanets} />

          <VarshaPeriodPanel
            chart={chart}
            birthDatetime={birthDatetime}
            targetDate={targetDate}
            ianaTimezone={ianaTimezone}
            calculationSettings={calculationSettings}
            chartStyle={chartStyle}
            chartDisplaySettings={chartDisplaySettings}
            nakshatraAdjust={nakshatraAdjust}
            place={place}
            onPlaceChange={onPlaceChange}
            year={shown.year}
          />
        </div>
      )}
    </div>
  );
}
