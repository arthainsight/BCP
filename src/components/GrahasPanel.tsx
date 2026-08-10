import { ChartData, ChartDisplaySettings, DEFAULT_CHART_DISPLAY } from '@/types';
import JyotishGrahaTable from './JyotishGrahaTable';
import DrishtiPanel from './DrishtiPanel';
import YogaTable from './YogaTable';
import AvasthaPanel from './AvasthaPanel';
import SahamPanel from './SahamPanel';

interface Props {
  chart: ChartData;
  karakaByPlanet: Record<string, string>;
  chartDisplaySettings?: ChartDisplaySettings;
  nakshatraAdjust?: number;
  birthDatetime?: string;
}

function readChartDisplaySettings(fallback?: ChartDisplaySettings): ChartDisplaySettings {
  if (fallback) return { ...DEFAULT_CHART_DISPLAY, ...fallback };
  if (typeof window === 'undefined') return DEFAULT_CHART_DISPLAY;
  try {
    const raw = localStorage.getItem('chartDisplaySettings');
    return raw ? { ...DEFAULT_CHART_DISPLAY, ...JSON.parse(raw) } : DEFAULT_CHART_DISPLAY;
  } catch {
    return DEFAULT_CHART_DISPLAY;
  }
}

export default function GrahasPanel({ chart, karakaByPlanet, chartDisplaySettings, nakshatraAdjust = 0, birthDatetime = '' }: Props) {
  const settings = readChartDisplaySettings(chartDisplaySettings);

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; graha.positions</div>
      <JyotishGrahaTable
        chart={chart}
        karakaByPlanet={karakaByPlanet}
        degreePrecision={settings.degreePrecision ?? 'off'}
        showOuterPlanets={settings.showOuterPlanets}
        showSpecialLagnas={settings.showSpecialLagnas}
        showNakshatra={settings.showNakshatra}
        showNakshatraPada={settings.showNakshatraPada}
        showD108={settings.showD108}
        nakshatraAdjust={nakshatraAdjust}
      />
      {(settings.showGrahaDrishti || settings.showRashiDrishti) && (
        <DrishtiPanel
          planets={chart.planets}
          ascendantSign={chart.ascendant.sign}
          showGrahaDrishti={settings.showGrahaDrishti}
          showRashiDrishti={settings.showRashiDrishti}
        />
      )}
      <AvasthaPanel chart={chart} birthDatetime={birthDatetime} />
      <SahamPanel chart={chart} birthDatetime={birthDatetime} />
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
        <YogaTable chart={chart} />
      </div>
    </div>
  );
}