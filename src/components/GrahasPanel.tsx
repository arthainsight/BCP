import { ChartData, ChartDisplaySettings } from '@/types';
import JyotishGrahaTable from './JyotishGrahaTable';

interface Props {
  chart: ChartData;
  karakaByPlanet: Record<string, string>;
  chartDisplaySettings: ChartDisplaySettings;
}

export default function GrahasPanel({ chart, karakaByPlanet, chartDisplaySettings }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; graha.positions</div>
      <JyotishGrahaTable
        chart={chart}
        karakaByPlanet={karakaByPlanet}
        showOuterPlanets={chartDisplaySettings.showOuterPlanets}
        showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
      />
    </div>
  );
}
