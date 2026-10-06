import type { CSSProperties, ReactNode } from 'react';
import type { ChartDisplaySettings } from '@/types';

// The coloured chart layers a viewer can switch on and off, from the Settings
// panel or by clicking their entry in the chart legend.
export type ChartLayerKey = 'transit' | 'bnnMajor' | 'bnnMinor' | 'paraya';

export const CHART_LAYER_SETTINGS: Record<ChartLayerKey, keyof ChartDisplaySettings> = {
  transit: 'showTransitOverlay',
  bnnMajor: 'showBnnMajorHighlight',
  bnnMinor: 'showBnnMinorHighlight',
  paraya: 'showNadiParaya',
};

export const CHART_LAYER_LABELS: Record<ChartLayerKey, string> = {
  transit: 'transit',
  bnnMajor: 'BNN major',
  bnnMinor: 'BNN minor',
  paraya: 'paraya Ju Sa Ke Ra',
};

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
export function LegendEntry({ control, style, children }: { control?: ChartLayerControl; style?: CSSProperties; children: ReactNode }) {
  if (!control) return <span style={style} className="font-semibold">{children}</span>;
  return (
    <button
      type="button"
      onClick={control.onToggle}
      aria-pressed={control.on}
      title={control.on ? 'Hide this layer' : 'Show this layer'}
      style={style}
      className={`font-semibold rounded px-1 -mx-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${control.on ? '' : 'opacity-40 line-through'}`}
    >
      {children}
    </button>
  );
}
