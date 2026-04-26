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

const BTN =
  "px-2 py-1 text-xs font-mono rounded transition-colors bg-white dark:bg-zinc-800 " +
  "border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 " +
  "hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed";

const MENU_ITEM =
  "block w-full min-h-12 px-4 py-3 text-left text-sm font-mono text-zinc-700 dark:text-zinc-200 " +
  "border-b border-zinc-100 dark:border-zinc-700/70 last:border-b-0 " +
  "hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed";

export default function FileActions({ snapshot, hasChart, onNew, onLoad, onExport, onImport, onActiveNameChange, compact }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showLoad, setShowLoad] = useState(false);
  const [savedList, setSavedList] = useState<SavedChart[]>([]);
  const [showMenu, setShowMenu] = useState(false);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeSnapshot = (snap: SavedChartData): SavedChartData => ({
    ...snap,
    targetDate: snap.targetDate || new Date().toISOString().slice(0, 10),
    showCoords: snap.showCoords ?? true,
  });

  const refreshList = useCallback(() => {
    setSavedList(loadSavedCharts());
  }, []);

  const hasSnapshotData = !!snapshot.birthDatetime && !!snapshot.manualLat && !!snapshot.manualLng;
  const isActiveSaved = activeId !== null && loadSavedCharts().some((c) => c.id === activeId);

  const closeAll = () => {
    setShowMenu(false);
    setShowLoad(false);
    setShowSaveAs(false);
  };

  const handleNew = () => {
    if (hasChart || hasSnapshotData) {
      setConfirmNew(true);
      setShowMenu(false);
      return;
    }
    clearActiveSavedChartId();
    setActiveId(null);
    onActiveNameChange?.(null);
    closeAll();
    onNew();
  };

  const confirmNewAction = () => {
    setConfirmNew(false);
    clearActiveSavedChartId();
    setActiveId(null);
    onActiveNameChange?.(null);
    closeAll();
    onNew();
  };

  const openLoad = () => {
    const list = loadSavedCharts();
    if (list.length === 0) {
      alert("No saved charts yet. Use SAVE AS to save the current chart.");
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

  const handleSave = () => {
    if (!isActiveSaved || !hasSnapshotData || !activeId) return;
    const updated = updateSavedChart(activeId, normalizeSnapshot(snapshot));
    if (updated) onActiveNameChange?.(updated.name);
    refreshList();
    setShowMenu(false);
  };

  const openSaveAs = () => {
    setSaveAsName("");
    setShowMenu(false);
    setShowSaveAs(true);
  };

  const handleSaveAs = () => {
    const name = saveAsName.trim();
    if (!name || !hasSnapshotData) return;
    const created = saveChartAsNew(name, normalizeSnapshot(snapshot));
    setActiveSavedChartId(created.id);
    setActiveId(created.id);
    onActiveNameChange?.(created.name);
    setShowSaveAs(false);
    setSaveAsName("");
  };

  const handleExport = () => {
    setShowMenu(false);
    onExport();
  };

  const handleImport = () => {
    setShowMenu(false);
    onImport();
  };

  const sheetPosition = compact
    ? "fixed top-20 left-4 right-4 z-[130] max-h-[70dvh]"
    : "absolute top-full right-0 mt-1 z-[130] w-72 max-h-[60vh]";

  const modalPosition = compact
    ? "fixed top-20 left-4 right-4 z-[150]"
    : "absolute top-full right-0 mt-1 z-[150] w-72";

  return (
    <div className="relative inline-flex items-center gap-1 shrink-0">
      {compact ? (
        <button
          onClick={() => setShowMenu((p) => !p)}
          className="w-9 h-9 shrink-0 flex items-center justify-center p-0 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xl leading-none font-mono hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          title="Chart actions"
          aria-label="Chart actions"
        >
          ⋮
        </button>
      ) : (
        <>
          <button onClick={handleNew} className={BTN}>{confirmNew ? "confirm?" : "NEW"}</button>
          <button onClick={openLoad} className={BTN}>LOAD</button>
          <button onClick={handleSave} disabled={!isActiveSaved || !hasSnapshotData} className={BTN}>SAVE</button>
          <button onClick={openSaveAs} disabled={!hasSnapshotData} className={BTN}>SAVE AS</button>
          <button onClick={handleExport} className={BTN}>EXPORT</button>
          <button onClick={handleImport} className={BTN}>IMPORT</button>
        </>
      )}

      {showMenu && compact && (
        <>
          <div className="fixed inset-0 z-[120] bg-black/30" onClick={() => setShowMenu(false)} />
          <div className={`${sheetPosition} overflow-y-auto whitespace-normal rounded-xl bg-white dark:bg-zinc-800 shadow-2xl border border-zinc-200 dark:border-zinc-700`}>
            <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-700/70">
              chart actions
            </div>
            <button onClick={handleNew} className={MENU_ITEM}>{confirmNew ? "CONFIRM NEW" : "NEW"}</button>
            <button onClick={openLoad} className={MENU_ITEM}>LOAD</button>
            <button onClick={handleSave} disabled={!isActiveSaved || !hasSnapshotData} className={MENU_ITEM}>SAVE</button>
            <button onClick={openSaveAs} disabled={!hasSnapshotData} className={MENU_ITEM}>SAVE AS</button>
            <button onClick={handleExport} className={MENU_ITEM}>EXPORT</button>
            <button onClick={handleImport} className={MENU_ITEM}>IMPORT</button>
          </div>
        </>
      )}

      {showLoad && (
        <>
          <div className="fixed inset-0 z-[120] bg-black/30" onClick={() => setShowLoad(false)} />
          <div className={`${sheetPosition} overflow-y-auto whitespace-normal bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700`}>
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">saved charts</span>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{savedList.length}</span>
            </div>
            {savedList.map((chart) => (
              <div
                key={chart.id}
                onClick={() => handlePickChart(chart)}
                className={`px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/60 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                  activeId === chart.id ? "bg-zinc-50 dark:bg-zinc-700/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-200 truncate">{chart.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                      {chart.chartData.city || chart.chartData.birthDatetime || "saved chart"}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                      {new Date(chart.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, chart.id)}
                    className="shrink-0 px-2 py-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                  >
                    del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showSaveAs && (
        <>
          <div className="fixed inset-0 z-[140] bg-black/30" onClick={() => setShowSaveAs(false)} />
          <div className={`${modalPosition} whitespace-normal bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3`}>
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">save chart as</div>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveAs(); }}
              placeholder="Chart name"
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 mb-2"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveAs(false)} className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={handleSaveAs} disabled={!saveAsName.trim()} className="px-3 py-1.5 text-xs font-mono rounded bg-emerald-600 hover:bg-emerald-700 dark:bg-green-700 dark:hover:bg-green-600 text-white disabled:opacity-30 transition-colors">Save</button>
            </div>
          </div>
        </>
      )}

      {confirmNew && (
        <>
          <div className="fixed inset-0 z-[140] bg-black/30" onClick={() => setConfirmNew(false)} />
          <div className={`${modalPosition} whitespace-normal bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3`}>
            <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Discard current chart?</div>
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-3">Unsaved changes will be lost.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmNew(false)} className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel</button>
              <button onClick={confirmNewAction} className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors">Discard &amp; New</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
