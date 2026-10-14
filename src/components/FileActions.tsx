"use client";

import { useState, useCallback, useEffect } from "react";
import { fill, useT } from '@/lib/i18n';
import { saveFile } from '@/lib/download';
import { decodeShare, encodeShare, shareUrl } from '@/lib/shareLink';
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
  exportSavedCharts,
  importSavedCharts,
} from "@/lib/savedCharts";

export type ChartSnapshot = SavedChartData;

interface Props {
  snapshot: ChartSnapshot;
  hasChart: boolean;
  onNew: () => void;
  onLoad: (snapshot: ChartSnapshot, id: string) => void;
  /** Opens the client report. */
  onReport?: () => void;
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

export default function FileActions({ snapshot, hasChart, onNew, onLoad, onReport, onActiveNameChange, compact }: Props) {
  const t = useT();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showLoad, setShowLoad] = useState(false);
  const [savedList, setSavedList] = useState<SavedChart[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const [notice, setNotice] = useState("");

  // A notice (a copied link, a number of imported charts, a refusal) goes away by itself.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const id = getActiveSavedChartId();
    // localStorage is unreadable during the server render, so this genuinely has to happen after mount. It runs once with an empty dependency list and cannot cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      setShowMenu(false);
      setNotice(t("No saved charts yet. Use SAVE AS to save the current chart."));
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
    const exported = exportSavedCharts();
    if (exported === null) setNotice(t("No saved charts to export."));
    else saveFile("bcp-charts-export.json", exported, "application/json");
  };

  // The charts of the file are added to the saved ones; a backup restored in Settings replaces everything instead.
  const handleImport = () => {
    setShowMenu(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = importSavedCharts(reader.result as string);
          setNotice(fill(t(imported === 1 ? "Imported {count} chart." : "Imported {count} charts."), { count: imported }));
        } catch {
          setNotice(t("Failed to read file. Make sure it is a valid export file."));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReport = () => {
    setShowMenu(false);
    onReport?.();
  };

  // A link with the birth data after the #: it is not sent to any server, only to whoever is given the link.
  const handleShare = async () => {
    setShowMenu(false);
    if (!hasSnapshotData) return;
    const shared = {
      birthDatetime: snapshot.birthDatetime,
      city: snapshot.city,
      lat: snapshot.manualLat,
      lng: snapshot.manualLng,
      ianaTimezone: snapshot.ianaTimezone,
      tzOverride: snapshot.tzOverride,
    };
    if (!decodeShare(encodeShare(shared))) {
      setNotice(t("This chart cannot be put in a link: check the birth time and the coordinates."));
      return;
    }
    const link = shareUrl(window.location.href, shared);
    try {
      await navigator.clipboard.writeText(link);
      setNotice(t("Link copied. It holds the birth data, so give it only to the person it is for."));
    } catch {
      window.prompt(t("Copy this link"), link);
    }
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
          title={t('Chart actions')}
          aria-label={t('Chart actions')}
        >
          ⋮
        </button>
      ) : (
        <>
          <button onClick={handleNew} className={BTN}>{confirmNew ? t('confirm?') : t('NEW')}</button>
          <button onClick={openLoad} className={BTN}>{t('LOAD')}</button>
          <button onClick={handleSave} disabled={!isActiveSaved || !hasSnapshotData} className={BTN}>{t('SAVE')}</button>
          <button onClick={openSaveAs} disabled={!hasSnapshotData} className={BTN}>{t('SAVE AS')}</button>
          <button onClick={handleExport} className={BTN}>{t('EXPORT')}</button>
          <button onClick={handleImport} className={BTN}>{t('IMPORT')}</button>
          <button onClick={handleShare} disabled={!hasSnapshotData} title={t('Copy a link that opens this chart')} className={BTN}>{t('SHARE')}</button>
          {onReport && <button onClick={handleReport} title={t('The chart, the timing summary and the palm photographs on pages to print or save as a PDF')} className={BTN}>{t('REPORT')}</button>}
        </>
      )}

      {showMenu && compact && (
        <>
          <div className="fixed inset-0 z-[120] bg-black/30" onClick={() => setShowMenu(false)} />
          <div className={`${sheetPosition} overflow-y-auto whitespace-normal rounded-xl bg-white dark:bg-zinc-800 shadow-2xl border border-zinc-200 dark:border-zinc-700`}>
            <div className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-700/70">
              {t('chart actions')}
            </div>
            <button onClick={handleNew} className={MENU_ITEM}>{confirmNew ? t('CONFIRM NEW') : t('NEW')}</button>
            <button onClick={openLoad} className={MENU_ITEM}>{t('LOAD')}</button>
            <button onClick={handleSave} disabled={!isActiveSaved || !hasSnapshotData} className={MENU_ITEM}>{t('SAVE')}</button>
            <button onClick={openSaveAs} disabled={!hasSnapshotData} className={MENU_ITEM}>{t('SAVE AS')}</button>
            <button onClick={handleExport} className={MENU_ITEM}>{t('EXPORT')}</button>
            <button onClick={handleImport} className={MENU_ITEM}>{t('IMPORT')}</button>
            <button onClick={handleShare} disabled={!hasSnapshotData} className={MENU_ITEM}>{t('SHARE')}</button>
            {onReport && <button onClick={handleReport} className={MENU_ITEM}>{t('REPORT')}</button>}
          </div>
        </>
      )}

      {notice && (
        <div role="status" data-share-notice className="fixed bottom-16 left-1/2 z-[200] max-w-[90vw] -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-mono text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          {notice}
        </div>
      )}

      {showLoad && (
        <>
          <div className="fixed inset-0 z-[120] bg-black/30" onClick={() => setShowLoad(false)} />
          <div className={`${sheetPosition} overflow-y-auto whitespace-normal bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700`}>
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{t('saved charts')}</span>
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
                    {t('del')}
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
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">{t('save chart as')}</div>
            <input
              type="text"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveAs(); }}
              placeholder={t('Chart name')}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500 mb-2"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveAs(false)} className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">{t('Cancel')}</button>
              <button onClick={handleSaveAs} disabled={!saveAsName.trim()} className="px-3 py-1.5 text-xs font-mono rounded bg-emerald-600 hover:bg-emerald-700 dark:bg-green-700 dark:hover:bg-green-600 text-white disabled:opacity-30 transition-colors">{t('Save')}</button>
            </div>
          </div>
        </>
      )}

      {confirmNew && (
        <>
          <div className="fixed inset-0 z-[140] bg-black/30" onClick={() => setConfirmNew(false)} />
          <div className={`${modalPosition} whitespace-normal bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3`}>
            <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{t('Discard current chart?')}</div>
            <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-3">{t('Unsaved changes will be lost.')}</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmNew(false)} className="px-3 py-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">{t('Cancel')}</button>
              <button onClick={confirmNewAction} className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors">{t('Discard & New')}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
