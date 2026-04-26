"use client";

import { useState, useCallback, useEffect } from "react";
import {
  SavedChart,
  SavedChartData,
  loadSavedCharts,
  deleteSavedChart,
  saveChartAsNew,
  updateSavedChart,
  getActiveSavedChartId,
  setActiveSavedChartId,
  clearActiveSavedChartId,
} from "@/lib/savedCharts";

export type ChartSnapshot = SavedChartData;

interface Props {
  snapshot: ChartSnapshot;
  hasChart: boolean;
  onNew: () => void;
  onLoad: (snapshot: ChartSnapshot, id: string) => void;
  onExport: () => void;
  onImport: () => void;
  onActiveNameChange?: (name: string | null) => void;
  compact?: boolean;
}

const MENU_ITEM =
  "w-full px-4 py-3 text-left text-sm font-mono text-zinc-700 dark:text-zinc-200 " +
  "border-b border-zinc-100 dark:border-zinc-700/70 last:border-b-0 " +
  "hover:bg-zinc-100 dark:hover:bg-zinc-700";

export default function FileActions({ snapshot, hasChart, onNew, onLoad, onExport, onImport, onActiveNameChange, compact }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showLoad, setShowLoad] = useState(false);
  const [savedList, setSavedList] = useState<SavedChart[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const id = getActiveSavedChartId();
    setActiveId(id);
    if (id && onActiveNameChange) {
      const chart = loadSavedCharts().find((c) => c.id === id);
      onActiveNameChange(chart?.name ?? null);
    }
  }, []);

  const normalizeSnapshot = (snap: SavedChartData): SavedChartData => ({
    ...snap,
    targetDate: snap.targetDate || new Date().toISOString().slice(0, 10),
    showCoords: snap.showCoords ?? true,
  });

  const toggleLoad = () => {
    const list = loadSavedCharts();
    if (list.length === 0) {
      alert("No saved charts yet.");
      return;
    }
    setSavedList(list);
    setShowMenu(false);
    setShowLoad(true);
  };

  const handlePickChart = (chart: SavedChart) => {
    setActiveSavedChartId(chart.id);
    setActiveId(chart.id);
    onActiveNameChange?.(chart.name);
    setShowLoad(false);
    onLoad(normalizeSnapshot(chart.chartData), chart.id);
  };

  return (
    <div className="relative inline-flex items-center">
      {compact && (
        <>
          <button
            onClick={() => setShowMenu((p) => !p)}
            className="w-9 h-9 flex items-center justify-center rounded border bg-white dark:bg-zinc-800"
          >
            ⋮
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-[100] bg-black/30" onClick={() => setShowMenu(false)} />
              <div className="fixed top-20 left-4 right-4 z-[110] max-h-[70dvh] overflow-y-auto rounded-xl bg-white dark:bg-zinc-800 shadow-2xl border">
                <button onClick={onNew} className={MENU_ITEM}>NEW</button>
                <button onClick={toggleLoad} className={MENU_ITEM}>LOAD</button>
                <button onClick={onExport} className={MENU_ITEM}>EXPORT</button>
                <button onClick={onImport} className={MENU_ITEM}>IMPORT</button>
              </div>
            </>
          )}
        </>
      )}

      {showLoad && (
        <>
          <div className="fixed inset-0 z-[120] bg-black/30" onClick={() => setShowLoad(false)} />
          <div className="fixed top-20 left-4 right-4 z-[130] max-h-[70dvh] overflow-y-auto bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border">
            {savedList.map((chart) => (
              <div
                key={chart.id}
                onClick={() => handlePickChart(chart)}
                className="px-4 py-3 border-b cursor-pointer hover:bg-zinc-100"
              >
                <div className="text-xs font-mono">{chart.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
