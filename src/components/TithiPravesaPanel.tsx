'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle } from '@/types';
// Types only: the calculation module loads the ephemeris, which cannot be
// bundled for the browser. The calculation runs in /api/tithi-pravesha.
import type { TithiPravesaMethod, TithiPravesaResult, VedicDay } from '@/lib/tithiPravesha';
import { formatDegree } from '@/lib/formatDegree';
import StyledChart from './StyledChart';
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
  toggleClass,
  useAnnualFetch,
  type AnnualPlace,
  type LocalMahadasha,
  type LocalParts,
} from './annualShared';

type TpResponse = {
  tithiPravesa: TithiPravesaResult;
  local: LocalParts;
  tzOffset: number;
  completedAge: number;
  vedicDay: VedicDay;
  next: TithiPravesaResult & { local: LocalParts; tzOffset: number };
  dasha: LocalMahadasha[];
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

const TITHI_NAMES = [
  'Pratipadā', 'Dvitīyā', 'Tṛtīyā', 'Caturthī', 'Pañcamī', 'Ṣaṣṭhī', 'Saptamī', 'Aṣṭamī',
  'Navamī', 'Daśamī', 'Ekādaśī', 'Dvādaśī', 'Trayodaśī', 'Caturdaśī',
];
const MASA_NAMES = [
  'Chaitra', 'Vaiśākha', 'Jyeṣṭha', 'Āṣāḍha', 'Śrāvaṇa', 'Bhādrapada',
  'Āśvina', 'Kārttika', 'Mārgaśīrṣa', 'Pauṣa', 'Māgha', 'Phālguna',
];

function tithiLabel(index: number): string {
  const paksha = index < 15 ? 'Śukla' : 'Kṛṣṇa';
  const n = index % 15;
  const name = n === 14 ? (index < 15 ? 'Pūrṇimā' : 'Amāvāsyā') : TITHI_NAMES[n];
  return `${paksha} ${name} (${index + 1}/30)`;
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
  place,
  onPlaceChange,
}: Props) {
  // null year means "the year in force at the target date".
  const [year, setYear] = useState<number | null>(null);
  const [method, setMethod] = useState<TithiPravesaMethod>('lunar-month');
  const [showNatal, setShowNatal] = useState(false);

  const query = buildAnnualParams({ chart, birthDatetime, ianaTimezone, calculationSettings, place, year, targetDate, extra: { method } });
  const { data: shown, error, loading } = useAnnualFetch<TpResponse>('/api/tithi-pravesha', query);

  if (!query) {
    return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">Birth date and place are needed for Tithi Praveśa.</div>;
  }

  const shownYear = shown?.tithiPravesa.year;

  return (
    <div className="space-y-3 min-w-0">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Tithi Praveśa — annual chart</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          Cast for the moment the Moon returns to its natal distance from the Sun — the birth tithi to the arc-second —
          {method === 'lunar-month'
            ? ' in the lunar month of birth (amānta, nija month in adhika years).'
            : ' nearest the Sun’s return to its natal sidereal longitude.'}
          {' '}The vāra lord at that moment is the lord of the year.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <YearStepper shownYear={shownYear} year={year} onChange={setYear} />
        <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
          <button type="button" className={toggleClass(method === 'lunar-month')} onClick={() => setMethod('lunar-month')}>Lunar month</button>
          <button type="button" className={toggleClass(method === 'solar-return')} onClick={() => setMethod('solar-return')}>Near solar return</button>
        </div>
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
          <StyledChart style={chartStyle} {...annualChartProps(shown.chart, chart, showNatal, chartDisplaySettings, nakshatraAdjust)} />

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

          <AnnualDashaList
            title="Tithi Aṣṭottarī daśā (beta)"
            note="Aṣṭottarī’s 108 years compressed into this year, entered from the lord of the birth tithi. Antardaśās begin with the mahādaśā lord. The running period at the target date is highlighted."
            dasha={shown.dasha}
            referenceJd={referenceJd(targetDate, shown.tzOffset)}
          />

          <AnnualPlanetTable annual={shown.chart} natal={chart} showOuterPlanets={chartDisplaySettings.showOuterPlanets} />
        </div>
      )}
    </div>
  );
}
