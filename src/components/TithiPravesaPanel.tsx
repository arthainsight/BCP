'use client';

import { useEffect, useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle, DegreePrecision, PlanetData } from '@/types';
// Types only: the calculation module loads the ephemeris, which cannot be
// bundled for the browser. The calculation runs in /api/tithi-pravesha.
import type { TithiPravesaMethod, TithiPravesaResult, VedicDay } from '@/lib/tithiPravesha';
import { formatDegree } from '@/lib/formatDegree';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

type TpResponse = {
  tithiPravesa: TithiPravesaResult;
  local: LocalParts;
  tzOffset: number;
  completedAge: number;
  vedicDay: VedicDay;
  next: TithiPravesaResult & { local: LocalParts; tzOffset: number };
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
};

const TITHI_NAMES = [
  'Pratipadā', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī',
  'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī',
];
const MASA_NAMES = [
  'Chaitra', 'Vaiśākha', 'Jyeṣṭha', 'Āṣāḍha', 'Śrāvaṇa', 'Bhādrapada',
  'Āśvina', 'Kārttika', 'Mārgaśīrṣa', 'Pauṣa', 'Māgha', 'Phālguna',
];
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

function tithiLabel(index: number): string {
  const paksha = index < 15 ? 'Śukla' : 'Kṛṣṇa';
  const n = index % 15;
  const name = n === 14 ? (index < 15 ? 'Pūrṇimā' : 'Amāvāsyā') : TITHI_NAMES[n];
  return `${paksha} ${name} (${index + 1}/30)`;
}

function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

const pad = (n: number) => String(n).padStart(2, '0');
const fmtLocal = (p: LocalParts) => `${pad(p.day)}.${pad(p.month)}.${p.year} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
const fmtOffset = (h: number) => {
  const sign = h < 0 ? '−' : '+';
  const abs = Math.abs(h);
  return `UTC${sign}${Math.floor(abs)}${abs % 1 ? `:${pad(Math.round((abs % 1) * 60))}` : ''}`;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="w-24 shrink-0 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{label}</span>
      <span className="min-w-0 break-words text-xs font-mono text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

export default function TithiPravesaPanel({
  chart,
  birthDatetime,
  targetDate,
  ianaTimezone,
  calculationSettings,
  chartStyle,
  chartDisplaySettings,
  nakshatraAdjust = 0,
}: Props) {
  // null year means "the year in force at the target date".
  const [year, setYear] = useState<number | null>(null);
  const [method, setMethod] = useState<TithiPravesaMethod>('lunar-month');
  const [showNatal, setShowNatal] = useState(false);
  const [result, setResult] = useState<{ key: string; data?: TpResponse; error?: string } | null>(null);

  const match = birthDatetime.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  const params = new URLSearchParams();
  if (match && chart.debug) {
    const [, dd, mm, yyyy, hh, min, ss] = match;
    params.set('year', yyyy); params.set('month', mm); params.set('day', dd);
    params.set('hour', hh); params.set('minute', min); params.set('second', ss);
    params.set('tz', String(chart.debug.utcOffset));
    params.set('lat', String(chart.debug.latitude));
    params.set('lng', String(chart.debug.longitude));
    if (ianaTimezone) params.set('iana', ianaTimezone);
    params.set('ayanamsa', calculationSettings?.ayanamsa ?? 'lahiri');
    params.set('ayanamsaOffset', String(calculationSettings?.ayanamsaOffsetDegrees ?? 0));
    params.set('nodeMode', calculationSettings?.nodeMode ?? 'mean');
    params.set('method', method);
    if (year !== null) params.set('tpYear', String(year));
    else params.set('target', targetDate || new Date().toISOString().slice(0, 10));
  }
  const requestKey = match && chart.debug ? params.toString() : '';

  useEffect(() => {
    if (!requestKey) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/tithi-pravesha?' + requestKey);
        const data = await res.json();
        if (cancelled) return;
        setResult(data.error ? { key: requestKey, error: data.error } : { key: requestKey, data });
      } catch (e) {
        if (!cancelled) setResult({ key: requestKey, error: String(e) });
      }
    })();
    return () => { cancelled = true; };
  }, [requestKey]);

  if (!requestKey) {
    return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">Birth date and place are needed for Tithi Praveśa.</div>;
  }

  const current = result?.key === requestKey ? result : null;
  const data = current?.data;
  // Keep showing the previous chart while the next year loads, so the page does not jump.
  const shown = data ?? result?.data;
  const loading = !current;
  const shownYear = shown?.tithiPravesa.year;

  const tpChart = shown?.chart;
  const natalOverlay: PlanetData[] = tpChart && showNatal
    ? chart.planets.map((p) => ({ ...p, house: ((p.sign - tpChart.ascendant.sign + 12) % 12) + 1 }))
    : [];

  const chartProps = tpChart ? {
    activeYearHouse: 0,
    activeMonthHouse: 0,
    ascendantSign: tpChart.ascendant.sign,
    planets: tpChart.planets,
    specialLagnas: chartDisplaySettings.showSpecialLagnas ? tpChart.specialLagnas ?? [] : [],
    transitPlanets: natalOverlay,
    showTransitPlanets: natalOverlay.length > 0,
    showSigns: chartDisplaySettings.showSigns,
    showNatalPlanets: true,
    degreePrecision: (chartDisplaySettings.degreePrecision ?? 'off') as DegreePrecision,
    showCharaKaraka: false,
    showNakshatra: chartDisplaySettings.showNakshatra,
    showOuterPlanets: chartDisplaySettings.showOuterPlanets,
    showSpecialLagnas: chartDisplaySettings.showSpecialLagnas,
    showBcpHighlights: false,
    nakshatraAdjust,
  } : null;

  const buttonClass = (active: boolean) =>
    `rounded-md px-2.5 py-1 text-[10px] font-mono ${active ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`;

  return (
    <div className="space-y-3 min-w-0">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Tithi Praveśa — annual chart</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          Cast for the moment the Moon returns to its natal distance from the Sun — the birth tithi to the arc-second —
          {method === 'lunar-month'
            ? ' in the lunar month of birth (amānta, nija month in adhika years).'
            : ' nearest the Sun’s return to its natal sidereal longitude.'}
          {' '}The vāra lord at that moment is the lord of the year. Chart for the birthplace.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
          <button type="button" className={buttonClass(false)} disabled={!shownYear} onClick={() => shownYear && setYear(shownYear - 1)} aria-label="Previous year">‹</button>
          <span className="px-1 text-[11px] font-mono tabular-nums text-zinc-700 dark:text-zinc-300">{shownYear ?? '····'}</span>
          <button type="button" className={buttonClass(false)} disabled={!shownYear} onClick={() => shownYear && setYear(shownYear + 1)} aria-label="Next year">›</button>
          <button type="button" className={buttonClass(year === null)} onClick={() => setYear(null)} title="The year in force at the target date">current</button>
        </div>
        <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
          <button type="button" className={buttonClass(method === 'lunar-month')} onClick={() => setMethod('lunar-month')}>Lunar month</button>
          <button type="button" className={buttonClass(method === 'solar-return')} onClick={() => setMethod('solar-return')}>Near solar return</button>
        </div>
        <label className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <input type="checkbox" checked={showNatal} onChange={(e) => setShowNatal(e.target.checked)} />
          natal overlay
        </label>
        {loading && <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">calculating…</span>}
      </div>

      {current?.error && (
        <div className="text-xs font-mono text-red-600 dark:text-red-400">{current.error}</div>
      )}

      {shown && chartProps && (
        <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
          {chartStyle === 'south' ? <SouthIndianChart {...chartProps} /> : <NorthIndianChart {...chartProps} />}

          <div className="space-y-2">
            <Row label="begins" value={`${fmtLocal(shown.local)} (${fmtOffset(shown.tzOffset)})`} />
            <Row label="ends" value={`${fmtLocal(shown.next.local)} (${fmtOffset(shown.next.tzOffset)})`} />
            <Row label="year" value={`${shown.completedAge} completed · ${ordinal(shown.completedAge + 1)} year running`} />
            <Row label="tithi" value={tithiLabel(shown.tithiPravesa.tithiIndex)} />
            <Row label="elongation" value={`${formatDegree(shown.tithiPravesa.natalElongation, 'second')} Moon − Sun`} />
            <Row label="masa" value={`${MASA_NAMES[shown.tithiPravesa.masaIndex]}${shown.tithiPravesa.birthInAdhikaMasa ? ' (born in adhika māsa)' : ''}`} />
            <Row label="vara" value={`${shown.vedicDay.vara} · year lord ${shown.vedicDay.varaLord}`} />
            <Row label="hora" value={`${shown.vedicDay.horaLord}${shown.vedicDay.sunTimesFound ? '' : ' (no sunrise — 6/18 h assumed)'}`} />
            <Row label="lagna" value={`${SIGN_ABBR[shown.chart.ascendant.sign - 1]} ${formatDegree(shown.chart.ascendant.degree, 'minute')}`} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  <th className="py-1 pr-3 font-normal">graha</th>
                  <th className="py-1 pr-3 font-normal">sign</th>
                  <th className="py-1 pr-3 font-normal">degree</th>
                  <th className="py-1 pr-3 font-normal">house</th>
                  <th className="py-1 font-normal">natal house</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                {shown.chart.planets
                  .filter((p) => chartDisplaySettings.showOuterPlanets || !['Uranus', 'Neptune', 'Pluto'].includes(p.name))
                  .map((p) => (
                    <tr key={p.name} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="py-1 pr-3">{p.name}{p.isRetrograde && p.name !== 'Rahu' && p.name !== 'Ketu' ? ' ℞' : ''}</td>
                      <td className="py-1 pr-3">{SIGN_ABBR[p.sign - 1]}</td>
                      <td className="py-1 pr-3 tabular-nums">{formatDegree(p.degree, 'minute')}</td>
                      <td className="py-1 pr-3 tabular-nums">{p.house}</td>
                      <td className="py-1 tabular-nums">{((p.sign - chart.ascendant.sign + 12) % 12) + 1}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
