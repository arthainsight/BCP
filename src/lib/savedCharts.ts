import { ChartDisplaySettings, CalculationSettings, DashaSettings } from '@/types';

export interface SavedChartData {
  birthDatetime: string;
  city: string;
  manualLat: string;
  manualLng: string;
  ianaTimezone: string;
  tzOverride: string;
  targetDate: string;
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
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
