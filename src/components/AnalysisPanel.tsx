'use client';

import { useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, PlanetData } from '@/types';
import type { DashaLordMarks } from './chartLayers';
import GrahasPanel from './GrahasPanel';
import VargaGridPanel from './VargaGridPanel';
import VargaMatrix from '@/pages/VargaMatrix';
import NadiAmsaPanel from './NadiAmsaPanel';
import AshtakavargaPanel from './AshtakavargaPanel';
import DrishtiPanel from './DrishtiPanel';
import NavataraPanel from './NavataraPanel';
import DirectionChartPanel from './DirectionChartPanel';
import SpecialSphutasPanel from './SpecialSphutasPanel';
import GocharaPanel from './GocharaPanel';
import ArgalaPanel from './ArgalaPanel';
import BhavaChalitPanel from './BhavaChalitPanel';
import { useT } from '@/lib/i18n';

type View = 'grahas' | 'varga' | 'nadi' | 'ashtakavarga' | 'gochara' | 'drishti' | 'argala' | 'chalit' | 'tara' | 'dik' | 'sphutas';

const VIEWS: { key: View; label: string }[] = [
  { key: 'grahas', label: 'Grahas' },
  { key: 'varga', label: 'Varga' },
  { key: 'nadi', label: 'Nāḍī' },
  { key: 'ashtakavarga', label: 'Aṣṭakavarga' },
  { key: 'gochara', label: 'Gochara' },
  { key: 'drishti', label: 'Dṛṣṭi' },
  { key: 'argala', label: 'Argala' },
  { key: 'chalit', label: 'Bhava Chalit' },
  { key: 'tara', label: 'Nava-Tara' },
  { key: 'dik', label: 'Directions' },
  { key: 'sphutas', label: 'Special Sphutas' },
];

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
}: Props) {
  const t = useT();
  const chartStyle = chartDisplaySettings.chartStyle ?? 'north';
  const [view, setView] = useState<View>('grahas');
  const [vargaView, setVargaView] = useState<'chart' | 'table'>('chart');

  const tabClass = (id: View) =>
    `shrink-0 px-2.5 py-1.5 text-[10px] font-mono rounded-md ${view === id ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex items-center gap-1 min-w-0 overflow-x-auto">
        <div className="inline-flex min-w-max gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
          {VIEWS.map((item) => (
            <button key={item.key} type="button" onClick={() => setView(item.key)} className={tabClass(item.key)}>
              {item.key === 'grahas' || item.key === 'dik' || item.key === 'sphutas' || item.key === 'gochara' ? t(item.label) : item.label}
            </button>
          ))}
        </div>
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
              {t('Matrix & Bala')}
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

      {view === 'nadi' && (
        <div className="min-w-0 overflow-x-auto"><NadiAmsaPanel chart={chart} /></div>
      )}

      {view === 'ashtakavarga' && (
        <div className="min-w-0 overflow-x-auto"><AshtakavargaPanel chart={chart} /></div>
      )}

      {view === 'gochara' && (
        <GocharaPanel chart={chart} transitPlanets={transitPlanets} />
      )}

      {view === 'drishti' && (
        <div className="min-w-0 overflow-x-auto"><DrishtiPanel chart={chart} showGrahaDrishti={chartDisplaySettings.showGrahaDrishti ?? true} showRashiDrishti={chartDisplaySettings.showRashiDrishti ?? true} /></div>
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
        <DirectionChartPanel chart={chart} transitPlanets={transitPlanets} />
      )}

      {view === 'sphutas' && (
        <SpecialSphutasPanel chart={chart} calculationSettings={calculationSettings} nakshatraAdjust={nakshatraAdjust} />
      )}
    </div>
  );
}
