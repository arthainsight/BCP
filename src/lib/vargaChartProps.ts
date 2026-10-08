import type { ChartData, ChartDisplaySettings } from '@/types';
import type { DashaLordMarks } from '@/components/chartLayers';
import { buildVargaChart } from './vargaChart';

interface Options {
  chart: ChartData;
  division: number;
  compact: boolean;
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  dashaLords?: DashaLordMarks | null;
  highlight?: string | null;
  onPlanetClick?: (name: string) => void;
}

/** Props for a North or South Indian chart drawing one divisional chart. */
export function vargaChartProps({
  chart, division, compact, chartDisplaySettings, karakaByPlanet = {}, nakshatraAdjust = 0, dashaLords = null, highlight = null, onPlanetClick,
}: Options) {
  const varga = buildVargaChart(chart, division);
  return {
    activeYearHouse: 0,
    activeMonthHouse: 0,
    ascendantSign: varga.ascendantSign,
    planets: varga.planets,
    showSigns: chartDisplaySettings.showSigns,
    showNatalPlanets: true,
    showOuterPlanets: chartDisplaySettings.showOuterPlanets,
    showBcpHighlights: false,
    // Small charts show planet codes only; the enlarged chart follows the settings.
    // BCP highlights and transits are rāśi concepts, so they stay off here.
    degreePrecision: compact ? 'off' as const : chartDisplaySettings.degreePrecision ?? 'off',
    showCharaKaraka: compact ? false : chartDisplaySettings.showCharaKaraka,
    karakaByPlanet,
    showNakshatra: !compact && division === 1 && chartDisplaySettings.showNakshatra,
    nakshatraAdjust,
    specialLagnas: varga.specialLagnas,
    showSpecialLagnas: !compact && chartDisplaySettings.showSpecialLagnas,
    dashaLords,
    colorByDignity: true,
    compact,
    highlightPlanet: highlight,
    onPlanetClick,
  };
}
