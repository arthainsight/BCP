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
import { annotatePlanets } from '@/lib/planetMarks';
import { buildLayerControls, CHART_LAYER_LABELS, withDashaLayers, type DashaLordMarks } from './chartLayers';
import { ChartFillContext } from './chartFill';
import type { NadiParayaHouseActivation } from '@/lib/bnn/nadiParaya';
import { editCount, movedSigns, type ChartEdits } from '@/lib/chartEdit';
import { SIGN_NAMES } from '@/lib/signs';
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
  /** The grahas and the Lagna that have been moved to another house, and how to move one or take the moves back. The chart given is the edited one. */
  edits?: ChartEdits;
  onMoveBody?: (name: string, step: 1 | -1) => void;
  onResetEdits?: (name?: string) => void;
}

/** The bodies that can be moved in the chart view, with their short names. Ketu goes with Rāhu, so it is not a body of its own here. */
const EDIT_BODIES: { name: string; short: string }[] = [
  { name: 'Asc', short: 'As' }, { name: 'Sun', short: 'Su' }, { name: 'Moon', short: 'Mo' }, { name: 'Mars', short: 'Ma' }, { name: 'Mercury', short: 'Me' },
  { name: 'Jupiter', short: 'Ju' }, { name: 'Venus', short: 'Ve' }, { name: 'Saturn', short: 'Sa' }, { name: 'Rahu', short: 'Ra/Ke' },
];

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
  edits = {},
  onMoveBody,
  onResetEdits,
}: ChartSectionProps) {
  const t = useT();
  const [chartStyle, setChartStyle] = useState<ChartStyle>(chartDisplaySettings.chartStyle ?? 'north');
  const [fullscreen, setFullscreen] = useState(false);
  // Selected natal or transit body from clicking a chart label. Selection is a
  // highlight only — it never hides the other bodies.
  const [selectedPlanet, setSelectedPlanet] = useState<{ kind: 'natal' | 'transit'; name: string } | null>(null);
  const [showDisplay, setShowDisplay] = useState(false);
  // The edit bar: which body is picked to be moved. A graha that is tapped in the chart while editing is the one picked.
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('Moon');
  const canEdit = onMoveBody !== undefined && onResetEdits !== undefined;
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
    yogi: true,
  }, onToggleChartDisplay);

  // The props of the D1 chart with all its layers; the mixed style draws it in the middle.
  const d1Props = {
    activeYearHouse: yearHouse,
    activeMonthHouse: monthHouse,
    ascendantSign: chart.ascendant.sign,
    ascendantDegree: chart.ascendant.degree,
    planets: annotatePlanets(chart.planets, 1, nakshatraAdjust),
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
    onPlanetSelect: (selection: { kind: 'natal' | 'transit'; name: string } | null) => {
      setSelectedPlanet(selection);
      if (editing && selection?.kind === 'natal') setEditBody(selection.name === 'Ketu' ? 'Rahu' : selection.name);
    },
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
        {chartDisplaySettings.showTargetBar && targetDate && onTargetDateChange && (
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
                  <ChartDisplayToggle label={t('target date bar')} value={chartDisplaySettings.showTargetBar} onToggle={() => onToggleChartDisplay?.('showTargetBar')} />
                  <DegreePrecisionPicker compact value={chartDisplaySettings.degreePrecision} onChange={degreePrecision => onUpdateChartDisplay?.({ degreePrecision })} />
                  {onUpdateChartDisplay && (
                    <ChartFontScaleField label={t('text size')} value={chartDisplaySettings.chartFontScale} onChange={chartFontScale => onUpdateChartDisplay({ chartFontScale })} />
                  )}
                </div>
              </>
            )}
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(on => !on)}
              aria-pressed={editing}
              title={t('Move a graha or the Lagna to the next or the previous house to see what the chart would be')}
              className={`shrink-0 rounded-md border px-2 py-1.5 text-[10px] font-mono ${editing || editCount(edits) > 0
                ? 'border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-300'
                : 'border-zinc-200 text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'}`}
              data-chart-edit-toggle
            >
              {t('✎ edit')}{editCount(edits) > 0 ? ` (${editCount(edits)})` : ''}
            </button>
          )}
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

      {canEdit && (editing || editCount(edits) > 0) && (() => {
        const planet = editBody === 'Asc' ? null : chart.planets.find(entry => entry.name === editBody);
        const sign = editBody === 'Asc' ? chart.ascendant.sign : planet?.sign;
        const degree = editBody === 'Asc' ? chart.ascendant.degree : planet?.degree;
        const house = planet?.house;
        const moved = movedSigns(edits, editBody);
        return (
          <div className="space-y-1.5 rounded-md border border-amber-300 bg-amber-50/60 p-2 dark:border-amber-800 dark:bg-amber-950/20" data-chart-edit>
            {editing && (
              <>
                <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('graha or Lagna to move')}>
                  {EDIT_BODIES.map(body => (
                    <button
                      key={body.name}
                      type="button"
                      onClick={() => setEditBody(body.name)}
                      aria-pressed={editBody === body.name}
                      title={body.name === 'Rahu' ? 'Rāhu and Ketu' : body.name === 'Asc' ? t('Lagna') : body.name}
                      className={`rounded border px-1.5 py-1 text-[10px] font-mono ${editBody === body.name
                        ? 'border-amber-600 bg-amber-500 text-white dark:border-amber-500 dark:bg-amber-600'
                        : 'border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300'}${movedSigns(edits, body.name) !== 0 ? ' ring-1 ring-amber-500' : ''}`}
                      data-chart-edit-body={body.name}
                    >
                      {body.short}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                  <button type="button" onClick={() => onMoveBody?.(editBody, -1)} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600" data-chart-edit-move="-1">
                    ◀ {t('previous house')}
                  </button>
                  <button type="button" onClick={() => onMoveBody?.(editBody, 1)} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600" data-chart-edit-move="1">
                    {t('next house')} ▶
                  </button>
                  <span data-chart-edit-readout>
                    {editBody === 'Asc' ? t('Lagna') : editBody === 'Rahu' ? 'Rāhu / Ketu' : editBody}
                    {sign !== undefined && degree !== undefined ? `: ${SIGN_NAMES[sign - 1]} ${Math.floor(degree)}°` : ''}
                    {house !== undefined ? ` · ${t('house')} ${house}` : ''}
                    {moved !== 0 ? ` · ${moved > 0 ? '+' : ''}${moved}` : ''}
                  </span>
                  {moved !== 0 && (
                    <button type="button" onClick={() => onResetEdits?.(editBody)} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600" data-chart-edit-reset-one>
                      {t('back to where it was')}
                    </button>
                  )}
                </div>
              </>
            )}
            {editCount(edits) > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
                <span data-chart-edit-note>
                  {t('Edited chart: the moves are not saved and the other workspaces show the calculated chart. The special lagnas are left out while a move stands.')}
                </span>
                <button type="button" onClick={() => onResetEdits?.()} className="rounded border border-amber-600 px-2 py-1 text-amber-800 dark:border-amber-500 dark:text-amber-300" data-chart-edit-reset-all>
                  {t('↺ reset all')}
                </button>
              </div>
            )}
          </div>
        );
      })()}

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
