'use client';

import { ChartDisplaySettings } from '@/types';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
}

export default function SettingsPanel({ chartDisplaySettings }: Props) {

  const setChartStyle=(style:'north'|'south')=>{
    const next={...chartDisplaySettings,chartStyle:style};
    localStorage.setItem('chartDisplaySettings',JSON.stringify(next));
    window.location.reload();
  };

  return (
    <div className="space-y-4">
      <div className="text-xs font-mono">&gt; charts</div>

      <div className="flex gap-2">
        <button onClick={()=>setChartStyle('north')} className="px-2 py-1 border">North</button>
        <button onClick={()=>setChartStyle('south')} className="px-2 py-1 border">South</button>
      </div>

    </div>
  );
}
