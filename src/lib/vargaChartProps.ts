import type { ChartData, ChartDisplaySettings, PlanetData } from '@/types';
import type { DashaLordMarks } from '@/components/chartLayers';
import { buildVargaChart, project } from './vargaChart';
import { calculateArudhaPadas } from './arudhaPadas';
import { atmakarakaOf, pointsForDivision, selectedChartPoints, type ChartPointsSelection } from './chartPoints';

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
  /** Transiting grahas to draw on the chart, given in the rāśi and projected into the division. */
  transitPlanets?: PlanetData[];
  /** The Āruḍha padas to mark (1 = AL … 12 = AL12), worked out in this division. */
  arudhaPadas?: number[];
  /** The upagrahas and Karakāṁśa to mark, projected into this division. */
  points?: ChartPointsSelection;
}

/** Props for a North or South Indian chart drawing one divisional chart. */
export function vargaChartProps({
  chart, division, compact, chartDisplaySettings, karakaByPlanet = {}, nakshatraAdjust = 0, dashaLords = null, highlight = null, onPlanetClick, transitPlanets, arudhaPadas = [], points,
}: Options) {
  const varga = buildVargaChart(chart, division);
  const showLagnas = !compact && chartDisplaySettings.showSpecialLagnas;
  // The padas the viewer chose are marked in the division itself, small charts included.
  const padas = arudhaPadas.length > 0
    ? calculateArudhaPadas(varga.ascendantSign, varga.planets).filter(pada => arudhaPadas.includes(pada.house))
    : [];
  const marks = points
    ? pointsForDivision(selectedChartPoints(chart, points, atmakarakaOf(karakaByPlanet)), division)
        .map(mark => ({ name: mark.name, ...project(mark.longitude, division) }))
    : [];
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
    specialLagnas: [...(showLagnas ? varga.specialLagnas : []), ...padas, ...marks],
    showSpecialLagnas: showLagnas || padas.length > 0 || marks.length > 0,
    dashaLords,
    colorByDignity: true,
    compact,
    highlightPlanet: highlight,
    onPlanetClick,
    ...(transitPlanets
      ? { transitPlanets: buildVargaChart({ ...chart, planets: transitPlanets }, division).planets, showTransitPlanets: true }
      : {}),
  };
}
