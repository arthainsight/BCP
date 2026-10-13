'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CalculationSettings, ChartData, ChartDisplaySettings, DashaSettings, PlanetData } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import { reportDate, reportTitle } from '@/lib/report';
import { noteList } from '@/lib/palm/annotations';
import { renderAnnotated } from '@/lib/palm/image';
import { listPalms, storageAvailable, type PalmRecord } from '@/lib/palm/storage';
import { useT } from '@/lib/i18n';
import type { DashaLordMarks } from './chartLayers';
import ChartDivisionsView from './ChartDivisionsView';
import JyotishGrahaTable from './JyotishGrahaTable';
import TimingSummary from './TimingSummary';
import { useOverlay } from '@/hooks/useOverlay';

type Props = {
  chart: ChartData | null;
  /** The name of the saved chart that is open, if there is one. */
  chartName: string | null;
  birthDatetime: string;
  place: string;
  utcOffset: number | null;
  targetDate: string;
  chartDisplaySettings: ChartDisplaySettings;
  calculationSettings: CalculationSettings;
  dashaSettings: DashaSettings;
  karakaByPlanet: Record<string, string>;
  nakshatraAdjust: number;
  dashaLords: DashaLordMarks | null;
  transitPlanets: PlanetData[];
  onClose: () => void;
};

const INPUT = 'mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900';
const HEADING = 'mb-2 border-b border-zinc-200 pb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500';

/** The report is a white page whatever the theme: the dark class is taken off the page while it is open. */
function useLightPage() {
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => { if (wasDark) root.classList.add('dark'); };
  }, []);
}

/** A palm photograph with its drawing, as a picture, and its numbered notes under it. */
function PalmFigure({ record }: { record: PalmRecord }) {
  const t = useT();
  const [url, setUrl] = useState('');
  useEffect(() => {
    let cancelled = false;
    let created = '';
    renderAnnotated(record.image, record.width, record.height, record.annotations, false, record.scale)
      .then(blob => {
        if (cancelled) return;
        created = URL.createObjectURL(blob);
        setUrl(created);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [record]);
  const notes = noteList(record.annotations).filter(entry => entry.label || entry.note);
  return (
    <figure className="break-inside-avoid space-y-2" data-report-palm={record.id}>
      <figcaption className="text-xs font-mono font-semibold text-zinc-800">
        {record.name} · {t(record.side === 'right' ? 'Right hand' : record.side === 'left' ? 'Left hand' : 'Palm')}
      </figcaption>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={record.name} className="mx-auto max-h-[165mm] w-auto max-w-full rounded border border-zinc-200" />
      ) : (
        <div className="py-8 text-center text-[10px] font-mono text-zinc-400">{t('Calculating…')}</div>
      )}
      {notes.length > 0 && (
        <ol className="space-y-1 text-[11px] leading-snug text-zinc-700">
          {notes.map(entry => (
            <li key={entry.id} className="flex gap-2">
              <span className="font-mono font-bold text-emerald-700">{entry.number}.</span>
              <span className="min-w-0 break-words">{entry.label && <b>{entry.label} </b>}{entry.note}</span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}

/**
 * The client report: the chart, the graha positions, the timing summary and the marked palm photographs with their
 * notes, on white pages that print as they look. Print / PDF opens the browser's own dialog, which saves a PDF.
 */
export default function ClientReport({
  chart, chartName, birthDatetime, place, utcOffset, targetDate, chartDisplaySettings, calculationSettings, dashaSettings, karakaByPlanet, nakshatraAdjust, dashaLords, transitPlanets, onClose,
}: Props) {
  const t = useT();
  const [title, setTitle] = useState(() => reportTitle(chartName, birthDatetime, t('Chart report')));
  const [preparedFor, setPreparedFor] = useState('');
  const [remarks, setRemarks] = useState('');
  const [withChart, setWithChart] = useState(true);
  const [withTable, setWithTable] = useState(true);
  const [withSummary, setWithSummary] = useState(true);
  const [palms, setPalms] = useState<PalmRecord[]>([]);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const today = useMemo(() => reportDate(new Date()), []);

  useLightPage();

  // The page that is printed is the report alone; the file of a saved PDF is named after the title.
  useEffect(() => {
    document.body.dataset.printReport = '1';
    return () => { delete document.body.dataset.printReport; };
  }, []);
  useEffect(() => {
    const previous = document.title;
    document.title = title.trim() || previous;
    return () => { document.title = previous; };
  }, [title]);
  useOverlay(onClose);

  // The palm photographs are kept in the browser's database; all of them are in the report until they are unticked.
  useEffect(() => {
    if (!storageAvailable()) return;
    let cancelled = false;
    listPalms()
      .then(found => {
        if (cancelled) return;
        setPalms(found);
        setChosen(Object.fromEntries(found.map(record => [record.id, true])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const shownPalms = palms.filter(record => chosen[record.id]);
  const offset = utcOffset === null ? '' : `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset % 1 === 0 ? utcOffset.toFixed(0) : utcOffset.toFixed(1)}`;
  const nothing = !(chart && (withChart || withTable || withSummary)) && shownPalms.length === 0;

  const check = (label: string, value: boolean, set: (next: boolean) => void) => (
    <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-700">
      <input type="checkbox" checked={value} onChange={event => set(event.target.checked)} />
      {label}
    </label>
  );

  return createPortal(
    <div
      data-report-root
      className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-200 text-zinc-900 print:bg-white"
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('Client report')}
    >
      <div className="print:hidden sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-zinc-300 bg-white px-3 py-2">
        <div className="min-w-0 flex-1 truncate text-sm font-mono font-semibold">{t('Client report')}</div>
        <button type="button" onClick={() => window.print()} disabled={nothing} className="min-h-9 rounded-md border border-emerald-500 bg-emerald-500 px-3 text-sm font-mono text-white hover:bg-emerald-600 disabled:opacity-40">
          {t('Print / PDF')}
        </button>
        <button type="button" onClick={onClose} aria-label={t('Close')} className="min-h-9 rounded-md border border-zinc-400 bg-zinc-100 px-3 text-sm">✕</button>
      </div>

      <div className="print:hidden mx-auto grid max-w-[210mm] gap-3 px-4 pt-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-zinc-300 bg-white p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('What is in the report')}</div>
          {chart ? (
            <>
              {check(t('chart'), withChart, setWithChart)}
              {check(t('graha positions'), withTable, setWithTable)}
              {check(t('timing summary'), withSummary, setWithSummary)}
            </>
          ) : (
            <p className="text-[10px] font-mono text-zinc-500">{t('Calculate a chart to add it to the report.')}</p>
          )}
          {palms.length > 0 && (
            <div className="space-y-1 border-t border-zinc-200 pt-2">
              {palms.map(record => (
                <label key={record.id} className="flex items-center gap-1.5 text-xs font-mono text-zinc-700">
                  <input type="checkbox" checked={Boolean(chosen[record.id])} onChange={event => setChosen(current => ({ ...current, [record.id]: event.target.checked }))} data-report-pick={record.id} />
                  <span className="min-w-0 truncate">{t('palm')}: {record.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2 rounded-lg border border-zinc-300 bg-white p-3">
          <label className="block text-[10px] font-mono text-zinc-500">
            {t('Title')}
            <input value={title} onChange={event => setTitle(event.target.value)} aria-label={t('Title')} className={INPUT} />
          </label>
          <label className="block text-[10px] font-mono text-zinc-500">
            {t('Prepared for')}
            <input value={preparedFor} onChange={event => setPreparedFor(event.target.value)} aria-label={t('Prepared for')} className={INPUT} />
          </label>
          <label className="block text-[10px] font-mono text-zinc-500">
            {t('Remarks at the end')}
            <textarea value={remarks} onChange={event => setRemarks(event.target.value)} aria-label={t('Remarks at the end')} rows={3} className={INPUT} />
          </label>
        </div>
      </div>

      <article data-report className="mx-auto my-4 max-w-[210mm] space-y-6 bg-white p-[12mm] text-zinc-900 shadow print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="space-y-1 border-b-2 border-zinc-800 pb-3">
          <h1 className="text-xl font-semibold" data-report-title>{title}</h1>
          <p className="text-[11px] font-mono text-zinc-600">
            {[preparedFor.trim() && `${t('Prepared for')} ${preparedFor.trim()}`, today].filter(Boolean).join(' · ')}
          </p>
          {chart && (
            <p className="text-[11px] font-mono text-zinc-600">
              {t('Born')} {birthDatetime}{place ? ` · ${place}` : ''}{offset ? ` · ${offset}` : ''}
            </p>
          )}
        </header>

        {chart && withChart && (
          <section className="break-inside-avoid" data-report-section="chart">
            <div className={HEADING}>{t('chart')}</div>
            <div className="mx-auto max-w-[480px]">
              <ChartDivisionsView
                chart={chart}
                divisions={[1]}
                chartStyle={chartDisplaySettings.chartStyle ?? 'north'}
                outerDivision={chartDisplaySettings.mixedOuterDivision}
                chartDisplaySettings={chartDisplaySettings}
                karakaByPlanet={karakaByPlanet}
                nakshatraAdjust={nakshatraAdjust}
                dashaLords={dashaLords}
                transitPlanets={transitPlanets}
                onFocus={() => {}}
              />
            </div>
          </section>
        )}

        {chart && withTable && (
          <section className="break-inside-avoid" data-report-section="table">
            <div className={HEADING}>{t('graha positions')}</div>
            <JyotishGrahaTable
              chart={chart}
              karakaByPlanet={karakaByPlanet}
              degreePrecision={chartDisplaySettings.degreePrecision ?? 'off'}
              showOuterPlanets={chartDisplaySettings.showOuterPlanets}
              showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
              nakshatraAdjust={nakshatraAdjust}
            />
          </section>
        )}

        {chart && withSummary && (
          <section data-report-section="summary">
            <div className={HEADING}>{t('timing summary')}</div>
            <TimingSummary chart={chart} birthDatetime={birthDatetime} targetDate={targetDate} dashaSettings={dashaSettings} calculationSettings={calculationSettings} />
          </section>
        )}

        {shownPalms.length > 0 && (
          <section className="space-y-6" data-report-section="palms">
            <div className={HEADING}>{t('palm')}</div>
            {shownPalms.map(record => <PalmFigure key={record.id} record={record} />)}
          </section>
        )}

        {remarks.trim() && (
          <section className="break-inside-avoid" data-report-section="remarks">
            <div className={HEADING}>{t('Remarks')}</div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{remarks.trim()}</p>
          </section>
        )}

        {nothing && <p className="print:hidden text-xs font-mono text-zinc-500">{t('Nothing is in the report yet: choose something to put in it.')}</p>}

        <footer className="border-t border-zinc-200 pt-2 text-[9px] font-mono text-zinc-400">
          {APP_NAME} by Riku Forsell {APP_VERSION}
        </footer>
      </article>
    </div>,
    document.body,
  );
}
