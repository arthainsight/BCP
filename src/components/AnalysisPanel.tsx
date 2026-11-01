'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, PlanetData } from '@/types';
import type { DashaLordMarks } from './chartLayers';
import GrahasPanel from './GrahasPanel';
import VargaGridPanel from './VargaGridPanel';
import VargaMatrix from './VargaMatrix';
import BalaPanel from './BalaPanel';
import SensitiveDegreesPanel from './SensitiveDegreesPanel';
import NadiAmsaPanel from './NadiAmsaPanel';
import AshtakavargaPanel from './AshtakavargaPanel';
import DrishtiPanel from './DrishtiPanel';
import NavataraPanel from './NavataraPanel';
import DirectionChartPanel from './DirectionChartPanel';
import SpecialSphutasPanel from './SpecialSphutasPanel';
import SarvatobhadraPanel from './SarvatobhadraPanel';
import KotaChakraPanel from './KotaChakraPanel';
import GocharaPanel from './GocharaPanel';
import PrashnaPanel from './PrashnaPanel';
import BhavaLordPanel from './BhavaLordPanel';
import TopicYogaPanel from './TopicYogaPanel';
import UpagrahaResultsPanel from './UpagrahaResultsPanel';
import DvigrahaPanel from './DvigrahaPanel';
import GrahaBhavaPanel from './GrahaBhavaPanel';
import LagnaPhalaPanel from './LagnaPhalaPanel';
import ArgalaPanel from './ArgalaPanel';
import BhavaChalitPanel from './BhavaChalitPanel';
import FullWidthToggle from './FullWidthToggle';
import { useT } from '@/lib/i18n';

export type AnalysisView = 'grahas' | 'varga' | 'bala' | 'degrees' | 'nadi' | 'ashtakavarga' | 'gochara' | 'drishti' | 'argala' | 'chalit' | 'tara' | 'dik' | 'sphutas' | 'sarvatobhadra' | 'kota' | 'prashna' | 'bhavesha' | 'topicyogas' | 'upagrahas' | 'dvigraha' | 'grahabhava' | 'lagnaphala';

const VIEW_GROUPS: { label: string; views: { key: AnalysisView; label: string }[] }[] = [
  { label: 'Chart & strength', views: [
    { key: 'grahas', label: 'Grahas' }, { key: 'varga', label: 'Varga' },
    { key: 'bala', label: 'Bala' }, { key: 'degrees', label: 'Sensitive Degrees' },
    { key: 'chalit', label: 'Bhava Chalit' }, { key: 'sphutas', label: 'Special Sphutas' },
  ] },
  { label: 'Relationships', views: [
    { key: 'nadi', label: 'Nāḍī' }, { key: 'drishti', label: 'Dṛṣṭi' }, { key: 'argala', label: 'Argala' },
  ] },
  { label: 'Transits & directions', views: [
    { key: 'gochara', label: 'Gochara' }, { key: 'tara', label: 'Nava-Tara' }, { key: 'dik', label: 'Directions' },
  ] },
  { label: 'Classical systems', views: [
    { key: 'ashtakavarga', label: 'Aṣṭakavarga' }, { key: 'sarvatobhadra', label: 'Sarvatobhadra' }, { key: 'kota', label: 'Kota Chakra' }, { key: 'prashna', label: 'Praśna' }, { key: 'bhavesha', label: 'Bhāveśa' }, { key: 'topicyogas', label: 'Topic yogas' }, { key: 'upagrahas', label: 'Upagrahas' }, { key: 'dvigraha', label: 'Conjunctions' }, { key: 'grahabhava', label: 'Grahas in houses' }, { key: 'lagnaphala', label: 'Lagna and dignities' },
  ] },
];

/** A request from elsewhere in the app to show one view, for example the Matrix of the Varga view. A new id is a new request. */
export interface AnalysisRequest {
  id: number;
  view: AnalysisView;
  vargaView?: 'chart' | 'table';
}

interface Props {
  chart: ChartData;
  karakaByPlanet: Record<string, string>;
  chartDisplaySettings: ChartDisplaySettings;
  nakshatraAdjust?: number;
  birthDatetime?: string;
  dashaLords: DashaLordMarks | null;
  /** Transiting grahas at the target moment, for the Nava-Tara and direction charts. */
  transitPlanets?: PlanetData[];
  /** The sunrise choice for the special sphutas. */
  calculationSettings?: CalculationSettings;
  /** The analysis takes the whole width of a wide screen, with the chart hidden. */
  wide?: boolean;
  onToggleWide?: () => void;
  request?: AnalysisRequest | null;
}

/**
 * The ANALYSIS workspace: structural and analytical Jyotish tools. Graha
 * positions, avasthas, sahams and yoga detection (GrahasPanel) plus the
 * divisional/aspect tools that were previously reached from Chart's `> views`.
 */
export default function AnalysisPanel({
  chart,
  karakaByPlanet,
  chartDisplaySettings,
  nakshatraAdjust = 0,
  birthDatetime = '',
  dashaLords,
  transitPlanets = [],
  calculationSettings,
  wide = false,
  onToggleWide,
  request,
}: Props) {
  const t = useT();
  const chartStyle = chartDisplaySettings.chartStyle ?? 'north';
  const [view, setView] = useState<AnalysisView>(request?.view ?? 'grahas');
  const [vargaView, setVargaView] = useState<'chart' | 'table'>(request?.vargaView ?? 'chart');
  // A new request while the panel is open: follow it. One made before the panel opened is the starting point above.
  const [handledRequest, setHandledRequest] = useState(request?.id);
  if (request && request.id !== handledRequest) {
    setHandledRequest(request.id);
    setView(request.view);
    if (request.vargaView) setVargaView(request.vargaView);
  }

  const tabClass = (id: AnalysisView) =>
    `shrink-0 px-2.5 py-1.5 text-[10px] font-mono rounded-md ${view === id ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          {VIEW_GROUPS.map((group) => (
            <div key={group.label} data-tool-group={group.label} className="flex min-w-0 items-center gap-2">
              <span className="w-28 shrink-0 text-[9px] font-mono uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{t(group.label)}</span>
              <div className="min-w-0 flex-1 overflow-x-auto">
                <div className="inline-flex min-w-max gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
                  {group.views.map((item) => (
                    <button key={item.key} type="button" onClick={() => setView(item.key)} className={tabClass(item.key)}>
                      {item.key === 'grahas' || item.key === 'dik' || item.key === 'sphutas' || item.key === 'gochara' || item.key === 'degrees' ? t(item.label) : item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        {onToggleWide && <FullWidthToggle wide={wide} onToggle={onToggleWide} />}
      </div>

      {view === 'grahas' && (
        <GrahasPanel
          chart={chart}
          karakaByPlanet={karakaByPlanet}
          chartDisplaySettings={chartDisplaySettings}
          nakshatraAdjust={nakshatraAdjust}
          birthDatetime={birthDatetime}
        />
      )}

      {view === 'varga' && (
        <div className="min-w-0 space-y-4">
          <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
            <button
              type="button"
              onClick={() => setVargaView('chart')}
              className={`rounded-md px-2.5 py-1 text-[10px] font-mono ${vargaView === 'chart' ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              {t('Charts')}
            </button>
            <button
              type="button"
              onClick={() => setVargaView('table')}
              className={`rounded-md px-2.5 py-1 text-[10px] font-mono ${vargaView === 'table' ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              {t('Matrix')}
            </button>
          </div>
          {vargaView === 'chart' ? (
            <VargaGridPanel
              chart={chart}
              dashaLords={dashaLords}
              chartStyle={chartStyle}
              chartDisplaySettings={chartDisplaySettings}
              karakaByPlanet={karakaByPlanet}
              nakshatraAdjust={nakshatraAdjust}
            />
          ) : (
            <div className="overflow-x-auto"><VargaMatrix chart={chart} /></div>
          )}
        </div>
      )}

      {view === 'bala' && <BalaPanel chart={chart} />}

      {view === 'degrees' && <SensitiveDegreesPanel chart={chart} nakshatraAdjust={nakshatraAdjust} />}

      {view === 'nadi' && (
        <div className="min-w-0 overflow-x-auto"><NadiAmsaPanel chart={chart} /></div>
      )}

      {view === 'ashtakavarga' && (
        <div className="min-w-0 overflow-x-auto"><AshtakavargaPanel chart={chart} /></div>
      )}

      {view === 'prashna' && <PrashnaPanel chart={chart} />}
      {view === 'bhavesha' && <BhavaLordPanel chart={chart} />}
      {view === 'topicyogas' && <TopicYogaPanel chart={chart} />}
      {view === 'upagrahas' && <UpagrahaResultsPanel chart={chart} />}
      {view === 'dvigraha' && <DvigrahaPanel chart={chart} />}
      {view === 'grahabhava' && <GrahaBhavaPanel chart={chart} />}
      {view === 'lagnaphala' && <LagnaPhalaPanel chart={chart} />}

      {view === 'gochara' && (
        <GocharaPanel chart={chart} transitPlanets={transitPlanets} />
      )}

      {view === 'drishti' && (
        <div className="min-w-0 overflow-x-auto"><DrishtiPanel chart={chart} /></div>
      )}

      {view === 'argala' && (
        <div className="min-w-0 overflow-x-auto"><ArgalaPanel chart={chart} /></div>
      )}

      {view === 'chalit' && (
        <BhavaChalitPanel chart={chart} />
      )}

      {view === 'tara' && (
        <NavataraPanel chart={chart} transitPlanets={transitPlanets} nakshatraAdjust={nakshatraAdjust} />
      )}

      {view === 'dik' && (
        <DirectionChartPanel chart={chart} />
      )}

      {view === 'sarvatobhadra' && (
        <SarvatobhadraPanel chart={chart} transitPlanets={transitPlanets} nakshatraAdjust={nakshatraAdjust} />
      )}

      {view === 'kota' && (
        <KotaChakraPanel chart={chart} transitPlanets={transitPlanets} nakshatraAdjust={nakshatraAdjust} />
      )}

      {view === 'sphutas' && (
        <SpecialSphutasPanel chart={chart} calculationSettings={calculationSettings} nakshatraAdjust={nakshatraAdjust} />
      )}

    </div>
  );
}
