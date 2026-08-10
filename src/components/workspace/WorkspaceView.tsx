'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  ChartData, BcpResult, PlanetData, ChartDisplaySettings,
  DashaSettings, WorkspacePanel, WorkspacePanelType,
} from '@/types';
import NorthIndianChart from '../NorthIndianChart';
import SouthIndianChart from '../SouthIndianChart';
import TransitDateControls from '../TransitDateControls';
import BNNEventDetectionPanel from '../BNNEventDetectionPanel';
import type { NadiParayaHouseActivation } from '@/lib/bnn/nadiParaya';
import BCPAgeControls from '../BCPAgeControls';
import GrahasPanel from '../GrahasPanel';
import DashaPanel from '../DashaPanel';
import BcpSummary from '../BcpSummary';
import YogaTable from '../YogaTable';
import { VargaMatrixCard, VargaStrengthCard, ShadbalaCard, BhavaBalaCard } from '@/pages/VargaMatrix';

// ── Constants ─────────────────────────────────────────────────────────────────

const PANEL_OPTIONS: { value: WorkspacePanelType; label: string }[] = [
  { value: 'natal',          label: 'Natal Chart' },
  { value: 'natal-transit',  label: 'Natal + Transit' },
  { value: 'bcp',            label: 'BCP' },
  { value: 'bnn',            label: 'BNN' },
  { value: 'vimshottari',    label: 'Vimshottari' },
  { value: 'graha-table',    label: 'Graha Table' },
  { value: 'yoga-table',     label: 'Yoga Table' },
  { value: 'varga-matrix',   label: 'Varga Matrix' },
  { value: 'varga-strength', label: 'Varga Strength / Viṁśopaka Bala' },
  { value: 'shadbala',       label: 'Shadbala beta' },
  { value: 'bhava-bala',     label: 'Bhava Bala beta' },
];

const PANEL_TITLES: Record<WorkspacePanelType, string> = {
  'natal':          'Natal Chart',
  'natal-transit':  'Natal + Transit',
  'bcp':            'BCP',
  'bnn':            'BNN',
  'vimshottari':    'Vimshottari',
  'graha-table':    'Graha Table',
  'yoga-table':     'Yoga Table',
  'varga-matrix':   'Varga Matrix',
  'varga-strength': 'Varga Strength / Viṁśopaka Bala',
  'shadbala':       'Shadbala beta',
  'bhava-bala':     'Bhava Bala beta',
};

const DEFAULT_PANELS: WorkspacePanel[] = [
  { id: 'ws-1', title: 'BNN',            type: 'bnn' },
  { id: 'ws-2', title: 'BCP',            type: 'bcp' },
  { id: 'ws-3', title: 'Natal + Transit', type: 'natal-transit' },
];

const VIMSHOTTARI_SETTINGS: DashaSettings = {
  dashas: { bcp: false, vimshottari: true, vds: false },
};

// ── WorkspacePanelCard ────────────────────────────────────────────────────────

interface PanelCardProps {
  panel: WorkspacePanel;
  canRemove: boolean;
  onTypeChange: (type: WorkspacePanelType) => void;
  onRemove: () => void;
  children: React.ReactNode;
}

function WorkspacePanelCard({ panel, canRemove, onTypeChange, onRemove, children }: PanelCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 shrink-0">
        <select
          value={panel.type}
          onChange={e => onTypeChange(e.target.value as WorkspacePanelType)}
          className="flex-1 min-w-0 text-xs font-mono bg-transparent text-zinc-700 dark:text-zinc-300 border-none outline-none cursor-pointer"
        >
          {PANEL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="md:hidden text-[10px] font-mono text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 px-1 leading-none shrink-0"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 px-1 leading-none shrink-0"
            aria-label="Remove panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Body */}
      <div className={`flex-1 min-w-0 overflow-auto p-3 ${collapsed ? 'hidden md:block' : ''}`}>
        {children}
      </div>
    </div>
  );
}

// ── Main WorkspaceView ────────────────────────────────────────────────────────

type BcpManualProps = {
  useManualBcpMode: boolean;
  onUseManualBcpModeChange: (v: boolean) => void;
  manualBcpAge: string;
  onManualBcpAgeChange: (v: string) => void;
  manualBcpMonth: string;
  onManualBcpMonthChange: (v: string) => void;
  manualBcpResult: BcpResult | null;
};

export interface WorkspaceViewProps {
  chart: ChartData;
  bcp: BcpResult | null;
  transitPlanets: PlanetData[];
  transitDatetime: string;
  onTransitDatetimeChange: (v: string) => void;
  onCalculateTransit: () => void;
  transitLoading?: boolean;
  birthDatetime: string;
  targetDate: string;
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet: Record<string, string>;
  nakshatraAdjust: number;
  dashaSettings: DashaSettings;
  effectiveBnnHouses: { major: number; minor: number };
  effectiveNadiParayaHouses: NadiParayaHouseActivation[];
  bnnOverrideStr: string;
  onBnnOverrideStrChange: (v: string) => void;
  bcpEnabled: boolean;
  bcpManualProps: BcpManualProps;
}

export default function WorkspaceView({
  chart,
  bcp,
  transitPlanets,
  transitDatetime,
  onTransitDatetimeChange,
  onCalculateTransit,
  transitLoading = false,
  birthDatetime,
  targetDate,
  chartDisplaySettings,
  karakaByPlanet,
  nakshatraAdjust,
  effectiveBnnHouses,
  effectiveNadiParayaHouses,
  bnnOverrideStr,
  onBnnOverrideStrChange,
  bcpEnabled,
  bcpManualProps,
}: WorkspaceViewProps) {
  // ── Panel state ──
  const [panels, setPanels] = useState<WorkspacePanel[]>(() => {
    try {
      const raw = localStorage.getItem('workspace_panels');
      if (raw) {
        const parsed = JSON.parse(raw) as WorkspacePanel[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PANELS;
  });

  useEffect(() => {
    try { localStorage.setItem('workspace_panels', JSON.stringify(panels)); } catch {}
  }, [panels]);

  // bnnHouses come from parent (already includes age override via effectiveBnnHouses)
  const bnnHouses = effectiveBnnHouses;

  // ── Panel management ──
  const addPanel = useCallback(() => {
    if (panels.length >= 8) return;
    setPanels(prev => [...prev, { id: `ws-${Date.now()}`, title: 'Natal Chart', type: 'natal' }]);
  }, [panels.length]);

  const removePanel = useCallback((id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  }, []);

  const changeType = useCallback((id: string, type: WorkspacePanelType) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, type, title: PANEL_TITLES[type] } : p));
  }, []);

  // ── Chart rendering helper ──
  const chartStyle = chartDisplaySettings.chartStyle ?? 'north';

  function renderChart(opts: {
    yearHouse?: number;
    monthHouse?: number;
    bnnMaj?: number;
    bnnMin?: number;
    showTransit?: boolean;
    legendLayers?: { bcp?: boolean; bnn?: boolean; transit?: boolean };
  }) {
    const {
      yearHouse = 0,
      monthHouse = 0,
      bnnMaj = 0,
      bnnMin = 0,
      showTransit = false,
      legendLayers,
    } = opts;

    const shared = {
      ascendantSign: chart.ascendant.sign,
      planets: chart.planets,
      specialLagnas: chart.specialLagnas ?? [],
      showNatalPlanets: chartDisplaySettings.showNatalPlanets ?? true,
      showSigns: chartDisplaySettings.showSigns ?? true,
      degreePrecision: chartDisplaySettings.degreePrecision ?? 'off',
      showCharaKaraka: chartDisplaySettings.showCharaKaraka ?? false,
      showNakshatra: chartDisplaySettings.showNakshatra ?? true,
      showOuterPlanets: chartDisplaySettings.showOuterPlanets ?? false,
      showSpecialLagnas: chartDisplaySettings.showSpecialLagnas ?? true,
      karakaByPlanet,
      nakshatraAdjust,
      activeYearHouse: yearHouse,
      activeMonthHouse: monthHouse,
      bnnMajorHouse: bnnMaj,
      bnnMinorHouse: bnnMin,
      nadiParayaHouses: effectiveNadiParayaHouses,
      transitPlanets: showTransit ? transitPlanets : [],
      showTransitPlanets: showTransit,
      legendLayers,
    };

    return chartStyle === 'south'
      ? <SouthIndianChart {...shared} />
      : <NorthIndianChart {...shared} />;
  }

  // ── Per-panel content ──
  function renderContent(panel: WorkspacePanel) {
    switch (panel.type) {
      case 'natal':
        return renderChart({ legendLayers: { bcp: false, bnn: false, transit: false } });

      case 'natal-transit':
        return (
          <div className="space-y-2">
            {renderChart({ showTransit: transitPlanets.length > 0, legendLayers: { bcp: false, bnn: false, transit: true } })}
            <TransitDateControls
              transitDatetime={transitDatetime}
              onTransitDatetimeChange={onTransitDatetimeChange}
              onCalculateTransit={onCalculateTransit}
              transitLoading={transitLoading}
            />
          </div>
        );

      case 'bcp': {
        const effectiveWorkspaceBcp =
          bcpManualProps.useManualBcpMode && bcpManualProps.manualBcpResult
            ? bcpManualProps.manualBcpResult
            : bcp;
        return (
          <div className="space-y-4">
            {renderChart({
              yearHouse: effectiveWorkspaceBcp?.activeYearHouse ?? 0,
              monthHouse: effectiveWorkspaceBcp?.activeMonthHouse ?? 0,
              legendLayers: { bcp: true, bnn: false, transit: false },
            })}
            {bcp && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-3">
                <BcpSummary bcp={effectiveWorkspaceBcp ?? bcp} planets={chart.planets} ascSign={chart.ascendant.sign} />
                {bcpEnabled && (
                  <BCPAgeControls
                    useManualBcpMode={bcpManualProps.useManualBcpMode}
                    onUseManualBcpModeChange={bcpManualProps.onUseManualBcpModeChange}
                    manualBcpAge={bcpManualProps.manualBcpAge}
                    onManualBcpAgeChange={bcpManualProps.onManualBcpAgeChange}
                    manualBcpMonth={bcpManualProps.manualBcpMonth}
                    onManualBcpMonthChange={bcpManualProps.onManualBcpMonthChange}
                    activeYearHouse={effectiveWorkspaceBcp?.activeYearHouse ?? bcp?.activeYearHouse}
                    activeMonthHouse={effectiveWorkspaceBcp?.activeMonthHouse ?? bcp?.activeMonthHouse}
                  />
                )}
              </div>
            )}
          </div>
        );
      }

      case 'bnn':
        return (
          <div className="space-y-4">
            {renderChart({ bnnMaj: bnnHouses.major, bnnMin: bnnHouses.minor, legendLayers: { bcp: false, bnn: true, transit: false } })}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <BNNEventDetectionPanel
                chart={chart}
                birthDatetime={birthDatetime}
                targetDate={targetDate}
                bnnOverrideStr={bnnOverrideStr}
                onBnnOverrideStrChange={onBnnOverrideStrChange}
              />
            </div>
          </div>
        );

      case 'vimshottari':
        if (!bcp) {
          return (
            <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 py-8 text-center">
              Calculate chart to see Vimshottari.
            </p>
          );
        }
        return (
          <DashaPanel
            bcp={bcp}
            planets={chart.planets}
            ascendant={chart.ascendant}
            birthDatetime={birthDatetime}
            dashaSettings={VIMSHOTTARI_SETTINGS}
            collapsible={false}
          />
        );

      case 'graha-table':
        return (
          <GrahasPanel
            chart={chart}
            karakaByPlanet={karakaByPlanet}
            chartDisplaySettings={chartDisplaySettings}
            nakshatraAdjust={nakshatraAdjust}
            birthDatetime={birthDatetime}
          />
        );

      case 'yoga-table':
        return <YogaTable chart={chart} />;

      case 'varga-matrix':
        return <VargaMatrixCard chart={chart} />;

      case 'varga-strength':
        return <VargaStrengthCard chart={chart} />;

      case 'shadbala':
        return <ShadbalaCard chart={chart} />;

      case 'bhava-bala':
        return <BhavaBalaCard chart={chart} />;
    }
  }

  // ── Grid class ──
  const gridClass =
    panels.length <= 1 ? 'grid grid-cols-1' :
    panels.length <= 2 ? 'grid grid-cols-1 md:grid-cols-2' :
    panels.length <= 4 ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' :
                         'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; workspace</div>
        {panels.length < 8 && (
          <button
            type="button"
            onClick={addPanel}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-emerald-400 dark:hover:border-green-600 hover:text-emerald-700 dark:hover:text-green-400 transition-colors"
          >
            + add panel
          </button>
        )}
      </div>

      <div className={`${gridClass} gap-4`}>
        {panels.map(panel => (
          <WorkspacePanelCard
            key={panel.id}
            panel={panel}
            canRemove={panels.length > 1}
            onTypeChange={type => changeType(panel.id, type)}
            onRemove={() => removePanel(panel.id)}
          >
            {renderContent(panel)}
          </WorkspacePanelCard>
        ))}
      </div>
    </div>
  );
}
