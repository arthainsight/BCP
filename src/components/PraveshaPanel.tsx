'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, ChartStyle } from '@/types';
// Types only: the calculation module loads the ephemeris, which cannot be bundled for the browser. The
// calculation runs in /api/pravesha.
import type { PraveshaKind, PraveshaMethod, PraveshaResult } from '@/lib/pravesha';
import type { VedicDay } from '@/lib/lunisolar';
import { nakshatraOfLongitude, yogaOfSum } from '@/lib/praveshaNames';
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
  toggleClass,
  useAnnualFetch,
  type AnnualPlace,
  type LocalMahadasha,
  type LocalParts,
} from './annualShared';
import { SIGN_ABBR } from '@/lib/signs';
import { fill, useLanguage, useT } from '@/lib/i18n';
import { ordinal } from '@/lib/ordinal';

type PraveshaResponse = {
  pravesha: PraveshaResult;
  local: LocalParts;
  tzOffset: number;
  completedAge: number;
  vedicDay: VedicDay;
  tithiPravesaLocal: LocalParts;
  next: PraveshaResult & { local: LocalParts; tzOffset: number };
  dasha: LocalMahadasha[];
  chart: ChartData;
};

type Props = {
  kind: PraveshaKind;
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

const MASA_NAMES = [
  'Chaitra', 'Vaiśākha', 'Jyeṣṭha', 'Āṣāḍha', 'Śrāvaṇa', 'Bhādrapada',
  'Āśvina', 'Kārttika', 'Mārgaśīrṣa', 'Pauṣa', 'Māgha', 'Phālguna',
];

/**
 * Nakṣatra Praveśa and Yoga Praveśa: the annual chart cast when the Moon returns to its natal longitude, or
 * when the sum of the Sun's and the Moon's longitudes returns to its natal value. Counted like Tithi Praveśa.
 */
export default function PraveshaPanel({
  kind, chart, birthDatetime, targetDate, ianaTimezone, calculationSettings, chartStyle, chartDisplaySettings, nakshatraAdjust = 0, place, onPlaceChange,
}: Props) {
  const t = useT();
  const language = useLanguage();
  // null year means "the year in force at the target date".
  const [year, setYear] = useState<number | null>(null);
  const [method, setMethod] = useState<PraveshaMethod>('lunar-month');
  const [showNatal, setShowNatal] = useState(false);

  const query = buildAnnualParams({ chart, birthDatetime, ianaTimezone, calculationSettings, place, year, targetDate, extra: { kind, method } });
  const { data: shown, error, loading } = useAnnualFetch<PraveshaResponse>('/api/pravesha', query);

  const title = kind === 'nakshatra' ? 'Nakṣatra Praveśa — annual chart' : 'Yoga Praveśa — annual chart';
  if (!query) {
    return <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{t(kind === 'nakshatra' ? 'Birth date and place are needed for Nakṣatra Praveśa.' : 'Birth date and place are needed for Yoga Praveśa.')}</div>;
  }

  const shownYear = shown?.pravesha.year;
  const natalValue = shown?.pravesha.natalValue ?? 0;
  const nakshatra = shown && kind === 'nakshatra' ? nakshatraOfLongitude(natalValue) : null;
  const yoga = shown && kind === 'yoga' ? yogaOfSum(natalValue) : null;

  return (
    <div className="space-y-3 min-w-0" data-pravesha={kind}>
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">{t(title)}</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          {kind === 'nakshatra'
            ? t('Cast for the moment the Moon returns to exactly its natal longitude — the same nakshatra, pada and place in it, to the arc-second —')
            : t('Cast for the moment the sum of the longitudes of the Sun and the Moon returns to its natal value — the same yoga and the same part of it spent, to the arc-second —')}
          {method === 'lunar-month'
            ? t(' in the lunar month of birth, the last return at or before the Tithi Praveśa.')
            : t(' the last one at or before the birthday.')}
          {' '}{t('The vāra lord at that moment is the lord of the year.')}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <YearStepper shownYear={shownYear} year={year} onChange={setYear} />
        <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
          <button type="button" className={toggleClass(method === 'lunar-month')} aria-pressed={method === 'lunar-month'} title={t('The return inside the lunar month of birth, the last one at or before the Tithi Praveśa')} onClick={() => setMethod('lunar-month')}>{t('Same month')}</button>
          <button type="button" className={toggleClass(method === 'before-birthday')} aria-pressed={method === 'before-birthday'} title={t('The last return at or before the birthday')} onClick={() => setMethod('before-birthday')}>{t('Before birthday')}</button>
        </div>
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

          <div className="space-y-2" data-pravesha-rows>
            <Row label={t('begins')} value={`${fmtLocal(shown.local)} (${fmtOffset(shown.tzOffset)})`} />
            <Row label={t('ends')} value={`${fmtLocal(shown.next.local)} (${fmtOffset(shown.next.tzOffset)})`} />
            <Row label={t('year')} value={fill(t('{age} completed · {ordinal} year running'), { age: shown.completedAge, ordinal: ordinal(shown.completedAge + 1, language) })} />
            {nakshatra && <Row label={t('nakshatra')} value={`${nakshatra.name} (${nakshatra.number}) · ${t('pada')} ${nakshatra.pada}`} />}
            {nakshatra && <Row label={t('Moon')} value={`${SIGN_ABBR[Math.floor(natalValue / 30)]} ${formatDegree(natalValue % 30, 'second')}`} />}
            {yoga && <Row label="yoga" value={`${yoga.name} (${yoga.number}) · ${fill(t('{percent} % spent'), { percent: (yoga.spent * 100).toFixed(1) })}`} />}
            {yoga && <Row label={t('Sun + Moon')} value={formatDegree(natalValue, 'second')} />}
            <Row label={t('tithi praveśa')} value={fmtLocal(shown.tithiPravesaLocal)} />
            <Row label="masa" value={`${MASA_NAMES[shown.pravesha.masaIndex]}${shown.pravesha.birthInAdhikaMasa ? t(' (born in adhika māsa)') : ''}`} />
            <Row label="vara" value={fill(t('{vara} · year lord {lord}'), { vara: t(shown.vedicDay.vara), lord: shown.vedicDay.varaLord })} />
            <Row label="hora" value={`${shown.vedicDay.horaLord}${shown.vedicDay.sunTimesFound ? '' : t(' (no sunrise — 6/18 h assumed)')}`} />
            <Row label="lagna" value={`${SIGN_ABBR[shown.chart.ascendant.sign - 1]} ${formatDegree(shown.chart.ascendant.degree, 'minute')}`} />
          </div>

          {kind === 'yoga' && (
            <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
              {t('The sum of two sidereal longitudes depends on the ayanamsa twice, so the moment moves with the ayanamsa of Settings.')}
            </div>
          )}

          <AnnualDashaList
            title={kind === 'nakshatra' ? 'Vimśottarī daśā (beta)' : 'Yoga Vimśottarī daśā (beta)'}
            note={t(kind === 'nakshatra'
              ? 'Vimśottarī’s 120 years compressed into this year. The Moon stands where it did at birth, so the daśā of birth begins again: the lord of the birth nakshatra, with the same part of its period spent. Antardaśās begin with the mahādaśā lord. The running period at the target date is highlighted.'
              : 'Vimśottarī’s 120 years compressed into this year, entered by the yoga of birth counted like a nakshatra (the 1st yoga as Ashwini, and so on round the nine lords), with the part of the yoga spent as the part of the period spent. Antardaśās begin with the mahādaśā lord. The running period at the target date is highlighted.')}
            dasha={shown.dasha}
            referenceJd={referenceJd(targetDate, shown.tzOffset)}
          />

          <AnnualPlanetTable annual={shown.chart} natal={chart} showOuterPlanets={chartDisplaySettings.showOuterPlanets} />
        </div>
      )}
    </div>
  );
}
