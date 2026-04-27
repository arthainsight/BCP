'use client';

import { useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, DashaSettings } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import UpdatesPanel from './UpdatesPanel';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
  onToggleChartDisplay: (key: keyof ChartDisplaySettings) => void;
  onUpdateChartDisplay: (update: Partial<ChartDisplaySettings>) => void;
  calculationSettings: CalculationSettings;
  onUpdateCalculationSettings: (update: Partial<CalculationSettings>) => void;
  dashaSettings: DashaSettings;
  onUpdateDashaSettings: (update: Partial<DashaSettings>) => void;
}

export default function SettingsPanel({ chartDisplaySettings, onUpdateChartDisplay }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-xs font-mono">chart style</div>
      <div className="flex gap-2">
        <button onClick={()=>onUpdateChartDisplay({chartStyle:'north'})} className="px-2 py-1 border">North</button>
        <button onClick={()=>onUpdateChartDisplay({chartStyle:'south'})} className="px-2 py-1 border">South</button>
      </div>
    </div>
  );
}
