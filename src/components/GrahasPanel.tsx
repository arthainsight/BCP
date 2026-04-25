import { ChartData } from '@/types';
import JyotishGrahaTable from './JyotishGrahaTable';

interface Props {
  chart: ChartData;
  karakaByPlanet: Record<string, string>;
}

export default function GrahasPanel({ chart, karakaByPlanet }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; graha.positions</div>
      <JyotishGrahaTable chart={chart} karakaByPlanet={karakaByPlanet} />
    </div>
  );
}
