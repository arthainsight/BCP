import { ChartDisplaySettings, CalculationSettings, DashaSettings } from '@/types';
import { newId } from './ids';

export interface SavedChartData {
  birthDatetime: string;
  city: string;
  manualLat: string;
  manualLng: string;
  ianaTimezone: string;
  tzOverride: string;
  targetDate: string;
  /** Time of the target moment, HH:MM; older saves have none and mean noon. */
  targetTime?: string;
  showCoords: boolean;
  calculationSettings?: CalculationSettings;
  chartDisplaySettings?: ChartDisplaySettings;
  dashaSettings?: DashaSettings;
}

export interface SavedChart {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  chartData: SavedChartData;
}

const STORAGE_KEY = "bcp_saved_charts";
const ACTIVE_KEY = "bcp_active_saved_chart_id";

export function loadSavedCharts(): SavedChart[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedChart[];
  } catch {
    return [];
  }
}

function persist(charts: SavedChart[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  } catch {
    // quota — ignore
  }
}

export function deleteSavedChart(id: string): SavedChart[] {
  const charts = loadSavedCharts().filter((c) => c.id !== id);
  persist(charts);
  return charts;
}

export function saveChartAsNew(name: string, chartData: SavedChartData): SavedChart {
  const charts = loadSavedCharts();
  const now = new Date().toISOString();
  const newChart: SavedChart = {
    id: newId(),
    name,
    createdAt: now,
    updatedAt: now,
    chartData,
  };
  charts.push(newChart);
  persist(charts);
  return newChart;
}

export function updateSavedChart(id: string, chartData: SavedChartData): SavedChart | null {
  const charts = loadSavedCharts();
  const idx = charts.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  charts[idx] = {
    ...charts[idx],
    updatedAt: new Date().toISOString(),
    chartData,
  };
  persist(charts);
  return charts[idx];
}

export function getActiveSavedChartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveSavedChartId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function clearActiveSavedChartId(): void {
  setActiveSavedChartId(null);
}

// ── Exporting and importing the saved charts ───────────────────────────────────────────────────────────────────────────

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** A saved chart read from a file, made whole: anything that is not a chart is null, a missing field is empty. */
function readSavedChart(value: unknown, takenIds: Set<string>): SavedChart | null {
  if (!isObject(value) || !isObject(value.chartData) || typeof value.chartData.birthDatetime !== 'string') return null;
  const data = value.chartData;
  const now = new Date().toISOString();
  const id = typeof value.id === 'string' && value.id && !takenIds.has(value.id) ? value.id : newId();
  takenIds.add(id);
  return {
    id,
    name: text(value.name),
    createdAt: text(value.createdAt) || now,
    updatedAt: text(value.updatedAt) || now,
    chartData: {
      ...(data as unknown as SavedChartData),
      birthDatetime: data.birthDatetime as string,
      city: text(data.city), manualLat: text(data.manualLat), manualLng: text(data.manualLng), ianaTimezone: text(data.ianaTimezone),
      tzOverride: text(data.tzOverride), targetDate: text(data.targetDate), showCoords: data.showCoords === true,
    },
  };
}

/** The charts of an export file (the text of it), ready to be added to the saved ones; throws when it is not an export. */
export function readSavedChartsExport(fileText: string, takenIds: ReadonlySet<string> = new Set()): SavedChart[] {
  const parsed: unknown = JSON.parse(fileText);
  if (!isObject(parsed) || !Array.isArray(parsed.charts)) throw new Error('Not an export of saved charts');
  const taken = new Set(takenIds);
  return parsed.charts.map(chart => readSavedChart(chart, taken)).filter((chart): chart is SavedChart => chart !== null);
}

/** The saved charts as the text of an export file, or null when there are none. */
export function exportSavedCharts(): string | null {
  const charts = loadSavedCharts();
  return charts.length ? JSON.stringify({ exportedAt: new Date().toISOString(), charts }, null, 2) : null;
}

/** Adds the charts of an export file to the saved ones (one whose id is in use gets a new id) and tells how many were added. */
export function importSavedCharts(fileText: string): number {
  const existing = loadSavedCharts();
  const added = readSavedChartsExport(fileText, new Set(existing.map(chart => chart.id)));
  persist([...existing, ...added]);
  return added.length;
}

export type SavedChartSort = 'updated' | 'name';

/**
 * The saved charts that match a search (name, place or birth date, without regard to case) in the chosen order:
 * the most recently changed first, or by name. A search with several words needs every word to be found.
 */
export function filterSavedCharts(charts: readonly SavedChart[], query: string, sort: SavedChartSort = 'updated'): SavedChart[] {
  const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matching = charts.filter(chart => {
    const text = `${chart.name} ${chart.chartData.city} ${chart.chartData.birthDatetime}`.toLocaleLowerCase();
    return words.every(word => text.includes(word));
  });
  return [...matching].sort(sort === 'name'
    ? (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    : (a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
