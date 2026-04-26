'use client';

import { useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, DashaSettings } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import UpdatesPanel from './UpdatesPanel';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
  onToggleChartDisplay: (key: keyof ChartDisplaySettings) => void;
  calculationSettings: CalculationSettings;
  onUpdateCalculationSettings: (update: Partial<CalculationSettings>) => void;
  dashaSettings: DashaSettings;
  onUpdateDashaSettings: (update: Partial<DashaSettings>) => void;
}

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono';

export default function SettingsPanel({ calculationSettings, onUpdateCalculationSettings }: Props) {
  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500">&gt; settings</div>

      <div>
        <label className="text-xs font-mono">ayanamsa</label>
        <select className={SELECT} value={calculationSettings.ayanamsa}
          onChange={(e) => onUpdateCalculationSettings({ ayanamsa: e.target.value })}>
          <option value="tropical">Tropical (Sayana)</option>
          <option value="lahiri">Lahiri</option>
          <option value="raman">Raman</option>
          <option value="krishnamurti">Krishnamurti</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-mono">rahu / ketu</label>
        <select className={SELECT} value={calculationSettings.nodeMode}
          onChange={(e) => onUpdateCalculationSettings({ nodeMode: e.target.value })}>
          <option value="mean">Mean Node</option>
          <option value="true">True Node</option>
        </select>
      </div>

      <UpdatesPanel />
    </div>
  );
}
