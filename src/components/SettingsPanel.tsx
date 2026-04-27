'use client';

import { useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, DashaSettings, ChartStyle } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import UpdatesPanel from './UpdatesPanel';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
  onToggleChartDisplay: (key: keyof ChartDisplaySettings) => void;
  onUpdateChartDisplay?: (update: Partial<ChartDisplaySettings>) => void;
  calculationSettings: CalculationSettings;
  onUpdateCalculationSettings: (update: Partial<CalculationSettings>) => void;
  dashaSettings: DashaSettings;
  onUpdateDashaSettings: (update: Partial<DashaSettings>) => void;
}

const CHART_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns', label: 'signs' },
  { key: 'showNatalPlanets', label: 'natal' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showDegrees', label: 'degrees' },
  { key: 'showNakshatra', label: 'nakshatra' },
  { key: 'showCharaKaraka', label: 'karaka' },
];

export default function SettingsPanel({
  chartDisplaySettings,
  onToggleChartDisplay,
}: Props) {
  const [chartsOpen, setChartsOpen] = useState(false);

  const setChartStyle = (style: ChartStyle) => {
    try {
      const next = { ...chartDisplaySettings, chartStyle: style };
      localStorage.setItem('chartDisplaySettings', JSON.stringify(next));
    } catch {}

    window.dispatchEvent(new CustomEvent('bcp:chart-style-change', { detail: style }));
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; settings</div>

      <div className="space-y-4">
        <div className="text-xs font-mono">&gt; charts</div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setChartStyle('north')}
            className={`px-3 py-2 border ${chartDisplaySettings.chartStyle === 'north' ? 'bg-emerald-100' : ''}`}
          >
            North Indian
          </button>
          <button
            onClick={() => setChartStyle('south')}
            className={`px-3 py-2 border ${chartDisplaySettings.chartStyle === 'south' ? 'bg-emerald-100' : ''}`}
          >
            South Indian
          </button>
        </div>
      </div>
    </div>
  );
}
