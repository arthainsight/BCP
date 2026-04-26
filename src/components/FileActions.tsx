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
  hideSave?: boolean;
  compact?: boolean;
}

const BTN_BASE =
  "font-mono rounded transition-colors bg-white dark:bg-zinc-800 " +
  "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 " +
  "hover:bg-zinc-100 dark:hover:bg-zinc-700 " +
  "disabled:opacity-30 disabled:cursor-not-allowed " +
  "disabled:hover:bg-white dark:disabled:hover:bg-zinc-800";

const BTN = "px-2 py-1 text-xs " + BTN_BASE;
const BTN_COMPACT = "px-1.5 py-0.5 text-[10px] " + BTN_BASE;

export default function FileActions({ snapshot, hasChart, onNew, onLoad, onExport, onImport, onActiveNameChange, hideSave, compact }: Props) {
  const btn = compact ? BTN_COMPACT : BTN;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showLoad, setShowLoad] = useState(false);
  const [savedList, setSavedList] = useState<SavedChart[]>([]);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    const id = getActiveSavedChartId();
    setActiveId(id);
    if (id && onActiveNameChange) {
      const chart = loadSavedCharts().find((c) => c.id === id);
      onActiveNameChange(chart?.name ?? null);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const refreshList = useCallback(() => {
    setSavedList(loadSavedCharts());
  }, []);

  const hasSnapshotData =
    !!snapshot.birthDatetime && !!snapshot.manualLat && !!snapshot.manualLng;

  const isActiveSaved =
    activeId !== null && loadSavedCharts().some((c) => c.id === activeId);

  // ── NEW ──
  const handleNew = () => {
    if (hasChart || hasSnapshotData) {
      setConfirmNew(true);
    } else {
      clearActiveSavedChartId();
      setActiveId(null);
      onActiveNameChange?.(null);
      onNew();
    }
  };

  const confirmNewAction = () => {
    setConfirmNew(false);
    clearActiveSavedChartId();
    setActiveId(null);
    onActiveNameChange?.(null);
    onNew();
  };

  // ── LOAD ──
  const toggleLoad = () => {
    if (!showLoad) {
      const list = loadSavedCharts();
      if (list.length === 0) {
        alert("No saved charts yet. Use SAVE AS to save the current chart.");
        return;
      }
      setSavedList(list);
    }
    setShowLoad((p) => !p);
  };

  const handlePickChart = (chart: SavedChart) => {
    setActiveSavedChartId(chart.id);
    setActiveId(chart.id);
    onActiveNameChange?.(chart.name);
    setShowLoad(false);
    onLoad(chart.chartData, chart.id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSavedChart(id);
    setSavedList(updated);
    if (activeId === id) {
      clearActiveSavedChartId();
      setActiveId(null);
      onActiveNameChange?.(null);
    }
  };

  // ── SAVE ──
  const handleSave = () => {
    if (!activeId || !hasSnapshotData) return;
    updateSavedChart(activeId, snapshot);
    refreshList();
  };

  // ── SAVE AS ──
  const openSaveAs = () => {
    setSaveAsName("");
    setShowSaveAs(true);
  };

  const handleSaveAs = () => {
    const name = saveAsName.trim();
    if (!name || !hasSnapshotData) return;
    const created = saveChartAsNew(name, snapshot);
    setActiveSavedChartId(created.id);
    setActiveId(created.id);
    onActiveNameChange?.(created.name);
    setShowSaveAs(false);
    setSaveAsName("");
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      <button
        onClick={handleNew}
        className={
          (compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs") +
          " font-mono rounded transition-colors border " +
          (confirmNew
            ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700"
            : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700")
        }
        title="New chart session"
      >
        {confirmNew ? "confirm?" : "NEW"}
      </button>

      <button onClick={toggleLoad} className={btn} title="Load saved chart">
        LOAD
      </button>

      {!hideSave && (
        <button
          onClick={handleSave}
          disabled={!isActiveSaved || !hasSnapshotData}
          className={btn}
          title={
            !isActiveSaved
              ? "Use SAVE AS first to name this chart"
              : "Update current saved chart"
          }
        >
          SAVE
        </button>
      )}

      <button
        onClick={openSaveAs}
        disabled={!hasSnapshotData}
        className={btn}
        title="Save current chart as a new entry"
      >
        SAVE AS
      </button>

      <button onClick={onExport} className={btn} title="Export all saved charts to JSON file">
        EXPORT
      </button>

      <button onClick={onImport} className={btn} title="Import charts from JSON export file">
        IMPORT
      </button>

      {showLoad && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowLoad(false)} />
          <div className="absolute top-full right-0 mt-1 z-40 w-72 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                saved charts
              </span>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                {savedList.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {savedList.map((chart) => (
                <button
                  key={chart.id}
                  onClick={() => handlePickChart(chart)}
                  className={
                    "w-full text-left px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors " +
                    (activeId === chart.id ? "bg-zinc-50 dark:bg-zinc-700/30" : "")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                        {chart.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                        {chart.chartData.city || chart.chartData.birthDatetime}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                        {new Date(chart.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, chart.id)}
                      className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      del
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {showSaveAs && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowSaveAs(false)} />
          <div className="absolute top-full right-0 mt-1 z-40 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
              save chart as
            </div>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveAs();
              }}
              placeholder="Chart name"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 mb-2"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveAs(false)}
                className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsName.trim()}
                className="px-3 py-1.5 text-xs font-mono rounded bg-emerald-600 hover:bg-emerald-700 dark:bg-green-700 dark:hover:bg-green-600 text-white disabled:opacity-30 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {confirmNew && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setConfirmNew(false)} />
          <div className="absolute top-full left-0 mt-1 z-40 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg p-3">
            <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Discard current chart?
            </div>
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-3">
              Unsaved changes will be lost.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmNew(false)}
                className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewAction}
                className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Discard &amp; New
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
