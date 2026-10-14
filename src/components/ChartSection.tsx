'use client';

import ChipPicker from './ChipPicker';
import { useEffect, useRef, useState } from 'react';
import { BcpResult, ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import StyledChart from './StyledChart';
import NestedChart from './NestedChart';
import { mixedShape } from '@/lib/chartStyle';
import ChartExportButtons from './ChartExportButtons';
import TargetDateBar from './TargetDateBar';
import ChartDivisionBar from './ChartDivisionBar';
import ChartDivisionsView from './ChartDivisionsView';
import { useChartDivisions } from '@/hooks/useChartDivisions';
import { VARGA_DIVISIONS, VARGA_NAMES } from '@/lib/vargaChart';
import { vargaChartProps } from '@/lib/vargaChartProps';
import { useArudhaPadas } from '@/hooks/useArudhaPadas';
import { setChartPointKeys, useChartPoints } from '@/hooks/useChartPoints';
import { atmakarakaOf, POINT_KEYS, POINT_NAMES, selectedChartPoints } from '@/lib/chartPoints';
import { ARUDHA_PADAS, arudhaName, calculateArudhaPadas } from '@/lib/arudhaPadas';
import { PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import ParayaChips from './ParayaChips';
import { ChartFontScaleField, DashaMarkSelect, DegreePrecisionPicker } from './ChartDisplayControls';
import { buildLayerControls, CHART_LAYER_LABELS, withDashaLayers, type DashaLordMarks } from './chartLayers';
import { ChartFillContext } from './chartFill';
import type { NadiParayaHouseActivation } from '@/lib/bnn/nadiParaya';
import { useT } from '@/lib/i18n';

export interface ChartSectionProps {
  bcp: BcpResult | null;
  chart: ChartData | null;
  transitPlanets: PlanetData[];
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet: Record<string, string>;
  transitLoading: boolean;
  nakshatraAdjust?: number;
  targetDate?: string;
  onTargetDateChange?: (value: string) => void;
  /** Time of the target moment, HH:MM; the transits are calculated for it. */
  targetTime?: string;
  onTargetTimeChange?: (value: string) => void;
  /** BNN houses from calculateBnnHouses; 0 hides the highlight. */
  bnnMajorHouseFromParent?: number;
  bnnMinorHouseFromParent?: number;
  nadiParayaHousesFromParent?: NadiParayaHouseActivation[];
  /** Vimshottari lords running at the target date. */
  dashaLordsFromParent?: DashaLordMarks | null;
  onToggleChartDisplay?: (key: keyof ChartDisplaySettings) => void;
  onUpdateChartDisplay?: (update: Partial<ChartDisplaySettings>) => void;
}

function ChartDisplayToggle({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-300">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={value}
        aria-label={label}
        className={`rounded-sm border px-2.5 py-1.5 text-[10px] font-mono sm:px-1.5 sm:py-0.5 sm:text-[9px] ${
          value
            ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600 text-white'
            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {value ? t('on') : t('off')}
      </button>
    </div>
  );
}

/** The chart styles the buttons above the chart switch between, in order. */
const CHART_STYLE_BUTTONS: { style: 'north' | 'south' | 'both' | 'mixedNorth' | 'mixedSouth'; label: string; title?: string }[] = [
  { style: 'north', label: 'N' },
  { style: 'south', label: 'S' },
  { style: 'both', label: 'N+S', title: 'North and South together' },
  { style: 'mixedNorth', label: 'MIX N', title: 'The D1 chart and any varga chart in the same houses, North layout' },
  { style: 'mixedSouth', label: 'MIX S', title: 'The D1 chart and any varga chart in the same houses, South layout' },
];

export default function ChartSection({
  bcp,
  chart,
  transitPlanets,
  chartDisplaySettings,
  karakaByPlanet,
  transitLoading = false,
  nakshatraAdjust = 0,
  targetDate,
  onTargetDateChange,
  targetTime,
  onTargetTimeChange,
  bnnMajorHouseFromParent = 0,
  bnnMinorHouseFromParent = 0,
  nadiParayaHousesFromParent = [],
  dashaLordsFromParent = null,
  onToggleChartDisplay,
  onUpdateChartDisplay,
}: ChartSectionProps) {
  const t = useT();
  const [chartStyle, setChartStyle] = useState<ChartStyle>(chartDisplaySettings.chartStyle ?? 'north');
  const [fullscreen, setFullscreen] = useState(false);
  // Selected natal or transit body from clicking a chart label. Selection is a
  // highlight only — it never hides the other bodies.
  const [selectedPlanet, setSelectedPlanet] = useState<{ kind: 'natal' | 'transit'; name: string } | null>(null);
  const [showDisplay, setShowDisplay] = useState(false);
  // Which divisional charts are shown; D1 alone is the full chart with its layers.
  const [divisions, setDivisions] = useChartDivisions();
  // The Āruḍha padas the viewer marks on the charts.
  const [arudhaPadas, setArudhaPadas] = useArudhaPadas();
  // The upagrahas and Karakāṁśa the viewer marks on the charts.
  const points = useChartPoints();
  const chartRef = useRef<HTMLDivElement>(null);

  // Full screen is an overlay over the whole app, plus the browser's own full
  // screen where it is available (not on iPhone). Esc, the close button or
  // leaving browser full screen all close it.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setFullscreen(false); };
    const onFullscreenChange = () => { if (!document.fullscreenElement) setFullscreen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.body.style.overflow = previousOverflow;
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [fullscreen]);

  const enterFullscreen = () => {
    setFullscreen(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const bnnHouses = { major: bnnMajorHouseFromParent, minor: bnnMinorHouseFromParent };

  // Follow the setting when it changes, while still allowing the local toggle
  // and the bcp:set-chart-style event to override it in between. Adjusting
  // state during render is React's documented alternative to mirroring a prop
  // into state from an effect, and it avoids the extra render pass.
  const [lastStyleSetting, setLastStyleSetting] = useState(chartDisplaySettings.chartStyle);
  if (chartDisplaySettings.chartStyle !== lastStyleSetting) {
    setLastStyleSetting(chartDisplaySettings.chartStyle);
    setChartStyle(chartDisplaySettings.chartStyle ?? 'north');
  }

  useEffect(() => {
    const handleChartStyleChange = (event: Event) => {
      const customEvent = event as CustomEvent<ChartStyle>;
      if (customEvent.detail === 'north' || customEvent.detail === 'south' || customEvent.detail === 'both' || customEvent.detail === 'mixedNorth' || customEvent.detail === 'mixedSouth') {
        setChartStyle(customEvent.detail);
      }
    };

    window.addEventListener('bcp:chart-style-change', handleChartStyleChange);

    return () => {
      window.removeEventListener('bcp:chart-style-change', handleChartStyleChange);
    };
  }, []);

  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs text-center px-4">
        {t('Enter birth data in the Data tab, then click Calculate to see the chart.')}
      </div>
    );
  }

  // The special lagnas of the chart, and the Āruḍha padas that are marked.
  const arudhaMarks = arudhaPadas.length > 0
    ? calculateArudhaPadas(chart.ascendant.sign, chart.planets).filter(pada => arudhaPadas.includes(pada.house))
    : [];
  const pointMarks = selectedChartPoints(chart, points, atmakarakaOf(karakaByPlanet));
  const d1SpecialLagnas = [...(chartDisplaySettings.showSpecialLagnas ? chart.specialLagnas ?? [] : []), ...arudhaMarks, ...pointMarks];
  const d1ShowSpecialLagnas = chartDisplaySettings.showSpecialLagnas || arudhaMarks.length > 0 || pointMarks.length > 0;
  const showBcp = chartDisplaySettings.showBcpHighlight === true;
  const dashaLords = withDashaLayers(dashaLordsFromParent, chartDisplaySettings);
  const outerDivision = chartDisplaySettings.mixedOuterDivision;
  const yearHouse = showBcp ? bcp.activeYearHouse : 0;
  const monthHouse = showBcp ? bcp.activeMonthHouse : 0;
  const bnnMajorHouse = chartDisplaySettings.showBnnMajorHighlight ? bnnHouses.major : 0;
  const bnnMinorHouse = chartDisplaySettings.showBnnMinorHighlight ? bnnHouses.minor : 0;
  const showTransit = chartDisplaySettings.showTransitOverlay !== false && transitPlanets.length > 0;
  const parayaBodies = chartDisplaySettings.parayaBodies ?? PARAYA_BODIES;
  const parayaHouses = chartDisplaySettings.showNadiParaya !== false ? nadiParayaHousesFromParent.filter(activation => parayaBodies.includes(activation.body)) : [];
  // Choosing a Paraya graha switches the layer on, so the choice shows at once.
  const chooseParaya = (next: ParayaBody[]) => onUpdateChartDisplay?.({ parayaBodies: next, ...(next.length > 0 ? { showNadiParaya: true } : {}) });
  const layerControls = buildLayerControls(chartDisplaySettings, {
    bcp: true,
    dasha: dashaLordsFromParent !== null,
    dashaHouses: dashaLordsFromParent !== null,
    transit: transitPlanets.length > 0,
    bnnMajor: bnnHouses.major > 0,
    bnnMinor: bnnHouses.minor > 0,
    paraya: nadiParayaHousesFromParent.length > 0,
  }, onToggleChartDisplay);

  // The props of the D1 chart with all its layers; the mixed style draws it in the middle.
  const d1Props = {
    activeYearHouse: yearHouse,
    activeMonthHouse: monthHouse,
    ascendantSign: chart.ascendant.sign,
    ascendantDegree: chart.ascendant.degree,
    planets: chart.planets,
    specialLagnas: d1SpecialLagnas,
    transitPlanets: transitPlanets,
    showSigns: chartDisplaySettings.showSigns,
    showNatalPlanets: chartDisplaySettings.showNatalPlanets,
    showTransitPlanets: showTransit,
    degreePrecision: chartDisplaySettings.degreePrecision ?? 'off',
    showCharaKaraka: chartDisplaySettings.showCharaKaraka,
    showNakshatra: chartDisplaySettings.showNakshatra,
    showOuterPlanets: chartDisplaySettings.showOuterPlanets,
    showSpecialLagnas: d1ShowSpecialLagnas,
    showBcpHighlights: showBcp,
    karakaByPlanet: karakaByPlanet,
    nakshatraAdjust: nakshatraAdjust,
    bnnMajorHouse: bnnMajorHouse,
    bnnMinorHouse: bnnMinorHouse,
    nadiParayaHouses: parayaHouses,
    dashaLords: dashaLords,
    selectedPlanet: selectedPlanet,
    onPlanetSelect: setSelectedPlanet,
  };

  // The chart outside in the mixed style: a varga, with the layers that are marked on the vargas, and a planet that is
  // tapped on either chart is marked on both.
  const outerProps = vargaChartProps({
    chart,
    division: outerDivision,
    compact: false,
    chartDisplaySettings,
    karakaByPlanet,
    nakshatraAdjust,
    dashaLords,
    highlight: selectedPlanet?.kind === 'natal' ? selectedPlanet.name : null,
    onPlanetClick: name => setSelectedPlanet(current => (current?.kind === 'natal' && current.name === name ? null : { kind: 'natal', name })),
    transitPlanets: showTransit ? transitPlanets : undefined,
    arudhaPadas,
    points,
  });

  return (
    <ChartFillContext.Provider value={fullscreen}>
    <div
      className={fullscreen
        ? 'fixed inset-0 z-[60] space-y-3 overflow-y-auto overflow-x-hidden bg-white p-3 sm:p-6 dark:bg-zinc-950'
        : 'space-y-3 min-w-0 overflow-x-hidden'}
      role={fullscreen ? 'dialog' : undefined}
      aria-modal={fullscreen || undefined}
      aria-label={fullscreen ? t('Charts in full screen') : undefined}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {targetDate && onTargetDateChange && (
          <TargetDateBar
            targetDate={targetDate}
            onTargetDateChange={onTargetDateChange}
            targetTime={targetTime}
            onTargetTimeChange={onTargetTimeChange}
            transitLoading={transitLoading}
          />
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <div
            role="group"
            aria-label={t('chart style')}
            title={t('chart style')}
            className="inline-flex shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
          >
            {CHART_STYLE_BUTTONS.map(({ style, label, title }, index) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  setChartStyle(style);
                  onUpdateChartDisplay?.({ chartStyle: style });
                }}
                aria-pressed={chartStyle === style}
                title={title ? t(title) : undefined}
                className={`px-1.5 py-1.5 text-[10px] font-mono leading-none transition-colors ${index > 0 ? 'border-l border-zinc-200 dark:border-zinc-700 ' : ''}${
                  chartStyle === style
                    ? 'bg-emerald-600 dark:bg-green-700 text-white'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mixedShape(chartStyle) && onUpdateChartDisplay && (
            <select
              value={outerDivision}
              onChange={(event) => onUpdateChartDisplay({ mixedOuterDivision: Number(event.target.value) })}
              aria-label={t('outer chart')}
              title={t('The varga chart in the outer part of the houses, with the D1 chart in the inner part')}
              className="shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {VARGA_DIVISIONS.map(division => <option key={division} value={division}>D{division} {VARGA_NAMES[division]}</option>)}
            </select>
          )}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowDisplay((v) => !v)}
              aria-expanded={showDisplay}
              aria-haspopup="true"
              title={t('chart display')}
              className="shrink-0 rounded-md border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ···
            </button>
            {showDisplay && (
              <>
                <div className="fixed inset-0 z-[70]" onClick={() => setShowDisplay(false)} />
                <div className="absolute right-0 top-full z-[80] mt-1 w-64 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 shadow-lg p-2 space-y-2">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('chart layers')}</div>
                  {(layerControls ?? []).map((control) => (
                    <ChartDisplayToggle key={control.key} label={t(CHART_LAYER_LABELS[control.key])} value={control.on} onToggle={control.onToggle} />
                  ))}
                  {onUpdateChartDisplay && nadiParayaHousesFromParent.length > 0 && (
                    <ParayaChips bodies={parayaBodies} onChange={chooseParaya} />
                  )}
                  {onUpdateChartDisplay && (
                    <DashaMarkSelect
                      compact
                      value={chartDisplaySettings.dashaMarkSystem}
                      onChange={dashaMarkSystem => onUpdateChartDisplay({ dashaMarkSystem })}
                      note={dashaLordsFromParent === null ? t('not applicable for this chart') : undefined}
                    />
                  )}
                  <div className="border-t border-zinc-200 dark:border-zinc-700" />
                  <ChipPicker title={t('arudha padas')} items={ARUDHA_PADAS} selected={arudhaPadas} onChange={setArudhaPadas} label={arudhaName} colour="amber" />
                  <div className="border-t border-zinc-200 dark:border-zinc-700" />
                  <ChipPicker title={t('upagrahas and karakamsa')} items={POINT_KEYS} selected={points.keys} onChange={setChartPointKeys} label={key => key} hint={key => POINT_NAMES[key]} colour="violet" />
                  <div className="border-t border-zinc-200 dark:border-zinc-700" />
                  <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('chart display')}</div>
                  <ChartDisplayToggle label={t('nakshatra')} value={chartDisplaySettings.showNakshatra} onToggle={() => onToggleChartDisplay?.('showNakshatra')} />
                  <ChartDisplayToggle label={t('karaka')} value={chartDisplaySettings.showCharaKaraka} onToggle={() => onToggleChartDisplay?.('showCharaKaraka')} />
                  <ChartDisplayToggle label={t('outer planets')} value={chartDisplaySettings.showOuterPlanets} onToggle={() => onToggleChartDisplay?.('showOuterPlanets')} />
                  <ChartDisplayToggle label={t('special lagnas')} value={chartDisplaySettings.showSpecialLagnas} onToggle={() => onToggleChartDisplay?.('showSpecialLagnas')} />
                  <DegreePrecisionPicker compact value={chartDisplaySettings.degreePrecision} onChange={degreePrecision => onUpdateChartDisplay?.({ degreePrecision })} />
                  {onUpdateChartDisplay && (
                    <ChartFontScaleField label={t('text size')} value={chartDisplaySettings.chartFontScale} onChange={chartFontScale => onUpdateChartDisplay({ chartFontScale })} />
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={fullscreen ? () => setFullscreen(false) : enterFullscreen}
            title={fullscreen ? t('Close full screen (Esc)') : t('Full screen')}
            aria-label={fullscreen ? t('Close full screen') : t('Full screen')}
            className="shrink-0 rounded-md border border-zinc-200 px-2 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {fullscreen ? t('✕ close') : t('⤢ full')}
          </button>
        </div>
      </div>

        {!mixedShape(chartStyle) && <ChartDivisionBar selected={divisions} onChange={setDivisions} />}

        <div ref={chartRef} className="space-y-2">
        <ChartExportButtons targetRef={chartRef} fileName={mixedShape(chartStyle) ? `chart-d1-d${outerDivision}` : `chart-${divisions.map(d => `d${d}`).join('-')}`} />
        {mixedShape(chartStyle) ? (
          <div className="space-y-1.5" data-chart="mixed">
            <div className="text-center text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              {t('outer chart')}: D{outerDivision} {VARGA_NAMES[outerDivision]} · {t('inner chart')}: D1 {VARGA_NAMES[1]}
            </div>
            <NestedChart
              shape={mixedShape(chartStyle)!}
              inner={d1Props}
              outer={outerProps}
              innerTitle={`D1 ${VARGA_NAMES[1]}`}
              outerTitle={`D${outerDivision} ${VARGA_NAMES[outerDivision]}`}
              innerWord={t('inner chart')}
              outerWord={t('outer chart')}
            />
          </div>
        ) : !(divisions.length === 1 && divisions[0] === 1) ? (
        <ChartDivisionsView
          chart={chart}
          divisions={divisions}
          chartStyle={chartStyle}
          chartDisplaySettings={chartDisplaySettings}
          karakaByPlanet={karakaByPlanet}
          nakshatraAdjust={nakshatraAdjust}
          dashaLords={dashaLords}
          onFocus={(division) => setDivisions([division])}
        />
        ) : (
        <StyledChart style={chartStyle} {...d1Props} />
        )}
        </div>
    </div>
    </ChartFillContext.Provider>
  );
}
