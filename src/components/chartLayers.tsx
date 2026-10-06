import type { CSSProperties, ReactNode } from 'react';
import type { ChartDisplaySettings } from '@/types';
import { signDignity } from '@/lib/dignity';
import { useT } from '@/lib/i18n';

// The coloured chart layers a viewer can switch on and off, from the Settings
// panel or by clicking their entry in the chart legend.
export type ChartLayerKey = 'bcp' | 'dasha' | 'transit' | 'bnnMajor' | 'bnnMinor' | 'paraya';

export const CHART_LAYER_SETTINGS: Record<ChartLayerKey, keyof ChartDisplaySettings> = {
  bcp: 'showBcpHighlight',
  dasha: 'showDashaLords',
  transit: 'showTransitOverlay',
  bnnMajor: 'showBnnMajorHighlight',
  bnnMinor: 'showBnnMinorHighlight',
  paraya: 'showNadiParaya',
};

export const CHART_LAYER_LABELS: Record<ChartLayerKey, string> = {
  bcp: 'BCP year/month',
  dasha: 'dasha lords',
  transit: 'transit',
  bnnMajor: 'BNN major',
  bnnMinor: 'BNN minor',
  paraya: 'paraya Ju Sa Ke Ra',
};

/** Running Vimshottari lords, marked on the natal planets. */
export interface DashaLordMarks {
  md: string;
  ad: string;
  /** Short name of the dasha system, shown in the legend. */
  label?: string;
}

/** Superscript after a natal planet: ᴹ for the mahadasha lord, ᴬ for the antardasha lord. */
export function dashaMark(planet: string, lords?: DashaLordMarks | null): string {
  if (!lords) return '';
  return (lords.md === planet ? 'ᴹ' : '') + (lords.ad === planet ? 'ᴬ' : '');
}

/** Label colour for a graha's dignity in a sign: exalted green, own sign blue, debilitated red. */
export function dignityColor(planet: string, sign: number, isDark: boolean): string | undefined {
  switch (signDignity(planet, sign)) {
    case 'exalted': return isDark ? '#4ade80' : '#15803d';
    case 'own': return isDark ? '#7dd3fc' : '#0369a1';
    case 'debilitated': return isDark ? '#fb7185' : '#be123c';
    default: return undefined;
  }
}

export interface ChartLayerControl {
  key: ChartLayerKey;
  on: boolean;
  onToggle: () => void;
}

/**
 * Legend controls for the layers that have something to draw. A layer that is
 * switched off keeps its control, so it can be switched back on from the legend.
 */
export function buildLayerControls(
  settings: ChartDisplaySettings,
  available: Partial<Record<ChartLayerKey, boolean>>,
  onToggle?: (key: keyof ChartDisplaySettings) => void,
): ChartLayerControl[] | undefined {
  if (!onToggle) return undefined;
  return (Object.keys(CHART_LAYER_SETTINGS) as ChartLayerKey[])
    .filter(key => available[key])
    .map(key => ({
      key,
      on: settings[CHART_LAYER_SETTINGS[key]] !== false,
      onToggle: () => onToggle(CHART_LAYER_SETTINGS[key]),
    }));
}

/** A legend entry: a toggle button when a control is given, plain text otherwise. */
export function LegendEntry({ control, style, className = '', children }: { control?: ChartLayerControl; style?: CSSProperties; className?: string; children: ReactNode }) {
  const t = useT();
  if (!control) return <span style={style} className={`font-semibold ${className}`}>{children}</span>;
  return (
    <button
      type="button"
      onClick={control.onToggle}
      aria-pressed={control.on}
      title={control.on ? t('Hide this layer') : t('Show this layer')}
      style={style}
      className={`font-semibold rounded px-1 -mx-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className} ${control.on ? '' : 'opacity-40 line-through'}`}
    >
      {children}
    </button>
  );
}
