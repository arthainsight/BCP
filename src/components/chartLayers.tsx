import type { CSSProperties, ReactNode } from 'react';
import type { ChartDisplaySettings } from '@/types';
import { signDignity } from '@/lib/dignity';
import { useT } from '@/lib/i18n';

// The coloured chart layers a viewer can switch on and off, from the Settings
// panel or by clicking their entry in the chart legend.
export type ChartLayerKey = 'bcp' | 'dasha' | 'dashaHouses' | 'transit' | 'bnnMajor' | 'bnnMinor' | 'paraya';

export const CHART_LAYER_SETTINGS: Record<ChartLayerKey, keyof ChartDisplaySettings> = {
  bcp: 'showBcpHighlight',
  dasha: 'showDashaLords',
  dashaHouses: 'showDashaHouses',
  transit: 'showTransitOverlay',
  bnnMajor: 'showBnnMajorHighlight',
  bnnMinor: 'showBnnMinorHighlight',
  paraya: 'showNadiParaya',
};

export const CHART_LAYER_LABELS: Record<ChartLayerKey, string> = {
  bcp: 'BCP year/month',
  dasha: 'dasha lords',
  dashaHouses: 'dasha houses',
  transit: 'transit',
  bnnMajor: 'RSN major',
  bnnMinor: 'RSN minor',
  paraya: 'paraya Ju Sa Ke Ra',
};

/** Running Vimshottari lords, marked on the natal planets. */
export interface DashaLordMarks {
  md: string;
  ad: string;
  /** Short name of the dasha system, shown in the legend. */
  label?: string;
  /** Whether the ᴹ/ᴬ marks are drawn on the planets (drawn unless false). */
  marks?: boolean;
  /** Whether the houses of the two lords get a coloured border (drawn unless false). */
  houses?: boolean;
}

/** Superscript after a natal planet: ᴹ for the mahadasha lord, ᴬ for the antardasha lord. */
export function dashaMark(planet: string, lords?: DashaLordMarks | null): string {
  if (!lords || lords.marks === false) return '';
  return (lords.md === planet ? 'ᴹ' : '') + (lords.ad === planet ? 'ᴬ' : '');
}

/** Sets which of the two dasha layers are drawn; nothing to draw gives null. */
export function withDashaLayers(lords: DashaLordMarks | null | undefined, settings: Pick<ChartDisplaySettings, 'showDashaLords' | 'showDashaHouses'>): DashaLordMarks | null {
  if (!lords) return null;
  const marks = settings.showDashaLords !== false;
  const houses = settings.showDashaHouses !== false;
  return marks || houses ? { ...lords, marks, houses } : null;
}

export const DASHA_HOUSE_COLORS = {
  md: { light: '#0891b2', dark: '#22d3ee' },
  ad: { light: '#db2777', dark: '#f472b6' },
};

/** Which lords sit in a house, as the border colours and the tooltip of that house. */
export function dashaHouseBorders(lords: DashaLordMarks | null | undefined, lordsHere: (planet: string) => boolean, isDark: boolean) {
  if (!lords || lords.houses === false) return [];
  const mode = isDark ? 'dark' : 'light';
  const borders: { key: 'md' | 'ad'; color: string; title: string }[] = [];
  if (lordsHere(lords.md)) borders.push({ key: 'md', color: DASHA_HOUSE_COLORS.md[mode], title: `Mahadasha lord ${lords.md}` });
  if (lordsHere(lords.ad)) borders.push({ key: 'ad', color: DASHA_HOUSE_COLORS.ad[mode], title: `Antardasha lord ${lords.ad}` });
  return borders;
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

/**
 * A legend entry: a button that hides the layer when a control is given, plain
 * text otherwise. A layer that is switched off is left out of the legend; it
 * comes back from Settings → chart layers.
 */
export function LegendEntry({ control, style, className = '', children }: { control?: ChartLayerControl; style?: CSSProperties; className?: string; children: ReactNode }) {
  const t = useT();
  if (control && !control.on) return null;
  if (!control) return <span style={style} className={`font-semibold ${className}`}>{children}</span>;
  return (
    <button
      type="button"
      onClick={control.onToggle}
      aria-pressed={control.on}
      title={t('Hide this layer')}
      style={style}
      className={`font-semibold rounded px-1 -mx-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
    >
      {children}
    </button>
  );
}
