'use client';

import { useEffect, useState } from 'react';
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

// ... (unchanged above)

export default function SettingsPanel({
  chartDisplaySettings,
  onToggleChartDisplay,
  onUpdateChartDisplay,
  calculationSettings,
  onUpdateCalculationSettings,
  dashaSettings,
  onUpdateDashaSettings,
}: Props) {
  const [dashaOpen, setDashaOpen] = useState(false);

  const updateChara = (key: string, value: any) => {
    const next = {
      ...dashaSettings,
      charaOptions: {
        ...dashaSettings.charaOptions,
        [key]: value,
      },
    };
    onUpdateDashaSettings(next);
    try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
  };

  return (
    <div className="space-y-5">
      {/* existing sections */}

      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-2">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">&gt; chara dasha config</div>

        <select className="w-full text-xs" value={dashaSettings.charaOptions.start} onChange={(e) => updateChara('start', e.target.value)}>
          <option value="lagna">Start: Lagna</option>
          <option value="ak">Start: Atmakaraka</option>
        </select>

        <select className="w-full text-xs" value={dashaSettings.charaOptions.mahadashaDirection} onChange={(e) => updateChara('mahadashaDirection', e.target.value)}>
          <option value="rashi-type">Direction: Rashi Type</option>
          <option value="odd-even">Direction: Odd/Even</option>
        </select>

        <select className="w-full text-xs" value={dashaSettings.charaOptions.antardashaStart} onChange={(e) => updateChara('antardashaStart', e.target.value)}>
          <option value="next-dasha-rasi">AD Start: Next</option>
          <option value="same-dasha-rasi">AD Start: Same</option>
        </select>

        <select className="w-full text-xs" value={dashaSettings.charaOptions.antardashaDirection} onChange={(e) => updateChara('antardashaDirection', e.target.value)}>
          <option value="dasha-rasi-9h">AD Direction: 9th</option>
          <option value="dasha-rasi">AD Direction: Same</option>
        </select>

        <select className="w-full text-xs" value={dashaSettings.charaOptions.strongerLordRule} onChange={(e) => updateChara('strongerLordRule', e.target.value)}>
          <option value="graha">Stronger Lord: Graha</option>
          <option value="rashi">Stronger Lord: Rashi</option>
        </select>

      </div>
    </div>
  );
}
