import { ChartData, ChartDisplaySettings, DEFAULT_CHART_DISPLAY } from '@/types';
import JyotishGrahaTable from './JyotishGrahaTable';

interface Props {
  chart: ChartData;
  karakaByPlanet: Record<string, string>;
  chartDisplaySettings?: ChartDisplaySettings;
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

export default function GrahasPanel({ chart, karakaByPlanet, chartDisplaySettings }: Props) {
  const settings = readChartDisplaySettings(chartDisplaySettings);

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; graha.positions</div>
      <JyotishGrahaTable
        chart={chart}
        karakaByPlanet={karakaByPlanet}
        showOuterPlanets={settings.showOuterPlanets}
        showSpecialLagnas={settings.showSpecialLagnas}
      />
    </div>
  );
}
