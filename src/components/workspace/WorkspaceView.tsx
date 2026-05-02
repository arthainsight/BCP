'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  ChartData, BcpResult, PlanetData, ChartDisplaySettings,
  DashaSettings, WorkspacePanel, WorkspacePanelType,
} from '@/types';
import NorthIndianChart from '../NorthIndianChart';
import SouthIndianChart from '../SouthIndianChart';
import BNNEventDetectionPanel from '../BNNEventDetectionPanel';
import GrahasPanel from '../GrahasPanel';
import DashaPanel from '../DashaPanel';
import BcpSummary from '../BcpSummary';
import { calculateJupiterianRounds } from '@/lib/bnn/jupiterianRounds';
import { calculateMinorProgression } from '@/lib/bnn/jupiterMinorProgression';

// ── Constants ─────────────────────────────────────────────────────────────────

const PANEL_OPTIONS: { value: WorkspacePanelType; label: string }[] = [
  { value: 'natal',        label: 'Natal Chart' },
  { value: 'natal-transit', label: 'Natal + Transit' },
  { value: 'bcp',          label: 'BCP' },
  { value: 'bnn',          label: 'BNN' },
  { value: 'vimshottari',  label: 'Vimshottari' },
  { value: 'graha-table',  label: 'Graha Table' },
];

const PANEL_TITLES: Record<WorkspacePanelType, string> = {
  'natal':        'Natal Chart',
  'natal-transit': 'Natal + Transit',
  'bcp':          'BCP',
  'bnn':          'BNN',
  'vimshottari':  'Vimshottari',
  'graha-table':  'Graha Table',
};

const DEFAULT_PANELS: WorkspacePanel[] = [
  { id: 'ws-1', title: 'BNN',            type: 'bnn' },
  { id: 'ws-2', title: 'BCP',            type: 'bcp' },
  { id: 'ws-3', title: 'Natal + Transit', type: 'natal-transit' },
];

const VIMSHOTTARI_SETTINGS: DashaSettings = {
  dashas: { bcp: false, vimshottari: true, vds: false },
};

// ── Date helpers (same as ChartSection) ───────────────────────────────────────

function parseBirthDt(dt: string): Date | null {
  const m = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]),
    parseInt(m[4]), parseInt(m[5]), parseInt(m[6]));
}

function parseTargetDt(td: string): Date | null {
  const p = td.split('-');
  if (p.length !== 3) return null;
  const [y, mo, d] = p.map(Number);
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null;
  return new Date(y, mo - 1, d, 12, 0, 0);
}

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

export interface WorkspaceViewProps {
  chart: ChartData;
  bcp: BcpResult | null;
  transitPlanets: PlanetData[];
  birthDatetime: string;
  targetDate: string;
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet: Record<string, string>;
  nakshatraAdjust: number;
  dashaSettings: DashaSettings;
}

export default function WorkspaceView({
  chart,
  bcp,
  transitPlanets,
  birthDatetime,
  targetDate,
  chartDisplaySettings,
  karakaByPlanet,
  nakshatraAdjust,
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

  // ── BNN computation (shared across all bnn panels) ──
  const bnnHouses = useMemo(() => {
    const birth = parseBirthDt(birthDatetime);
    const target = parseTargetDt(targetDate);
    if (!birth || !target) return { major: 0, minor: 0 };
    const ageYears = Math.max(0, (target.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const natalJupiter = chart.planets.find(p => p.name === 'Jupiter');
    if (!natalJupiter) return { major: 0, minor: 0 };
    const natalJupiterSignIndex = natalJupiter.sign - 1;
    const natalJupiterDegree = natalJupiter.degree;
    const planets = chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 }));
    const roundsResult = calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree, ageYears });
    const minorResult = calculateMinorProgression({ natalJupiterSignIndex, ageYears, planets });
    const asc = chart.ascendant.sign;
    return {
      major: roundsResult.currentRound
        ? ((roundsResult.currentRound.activeSignIndex + 1 - asc + 12) % 12) + 1
        : 0,
      minor: ((minorResult.minorSignIndex + 1 - asc + 12) % 12) + 1,
    };
  }, [chart, birthDatetime, targetDate]);

  // ── Panel management ──
  const addPanel = useCallback(() => {
    if (panels.length >= 4) return;
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
  }) {
    const {
      yearHouse = 0,
      monthHouse = 0,
      bnnMaj = 0,
      bnnMin = 0,
      showTransit = false,
    } = opts;

    const shared = {
      ascendantSign: chart.ascendant.sign,
      planets: chart.planets,
      specialLagnas: chart.specialLagnas ?? [],
      showNatalPlanets: chartDisplaySettings.showNatalPlanets ?? true,
      showSigns: chartDisplaySettings.showSigns ?? true,
      showDegrees: chartDisplaySettings.showDegrees ?? false,
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
      transitPlanets: showTransit ? transitPlanets : [],
      showTransitPlanets: showTransit,
    };

    return chartStyle === 'south'
      ? <SouthIndianChart {...shared} />
      : <NorthIndianChart {...shared} />;
  }

  // ── Per-panel content ──
  function renderContent(panel: WorkspacePanel) {
    switch (panel.type) {
      case 'natal':
        return renderChart({});

      case 'natal-transit':
        return (
          <div className="space-y-2">
            {renderChart({ showTransit: transitPlanets.length > 0 })}
            {transitPlanets.length === 0 && (
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 text-center pt-1">
                No transit data — calculate transit in the main view.
              </p>
            )}
          </div>
        );

      case 'bcp':
        return (
          <div className="space-y-4">
            {renderChart({
              yearHouse: bcp?.activeYearHouse ?? 0,
              monthHouse: bcp?.activeMonthHouse ?? 0,
            })}
            {bcp && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <BcpSummary bcp={bcp} planets={chart.planets} ascSign={chart.ascendant.sign} />
              </div>
            )}
          </div>
        );

      case 'bnn':
        return (
          <div className="space-y-4">
            {renderChart({ bnnMaj: bnnHouses.major, bnnMin: bnnHouses.minor })}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <BNNEventDetectionPanel
                chart={chart}
                birthDatetime={birthDatetime}
                targetDate={targetDate}
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
          />
        );
    }
  }

  // ── Grid class ──
  const gridClass =
    panels.length === 1 ? 'grid grid-cols-1' :
    panels.length === 2 ? 'grid grid-cols-1 md:grid-cols-2' :
                          'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; workspace</div>
        {panels.length < 4 && (
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
