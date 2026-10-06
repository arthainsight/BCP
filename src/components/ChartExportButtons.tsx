'use client';

import { useState, type RefObject } from 'react';

type Props = {
  /** The element to capture: the chart with its legend. */
  targetRef: RefObject<HTMLElement | null>;
  /** File name without extension. */
  fileName: string;
};

const BUTTON = 'rounded border border-zinc-200 px-2 py-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100';

/**
 * Downloads a chart as PNG or SVG. The South Indian chart is HTML rather than
 * SVG, so both formats go through html-to-image, which is only loaded when a
 * button is pressed.
 */
export default function ChartExportButtons({ targetRef, fileName }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async (format: 'png' | 'svg') => {
    const node = targetRef.current;
    if (!node) return;
    setBusy(true);
    setError('');
    try {
      const { toPng, toSvg } = await import('html-to-image');
      const options = {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        pixelRatio: 2,
        // Leave the export buttons themselves out of the picture.
        filter: (element: HTMLElement) => !element.dataset?.exportIgnore,
      };
      const url = format === 'png' ? await toPng(node, options) : await toSvg(node, options);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${format}`;
      link.click();
    } catch {
      setError('Export failed. Try again, or use a screenshot.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1" data-export-ignore="true">
      {error && <span className="mr-1 text-[10px] font-mono text-rose-600 dark:text-rose-400">{error}</span>}
      <button type="button" disabled={busy} onClick={() => void download('png')} className={BUTTON}>⇩ PNG</button>
      <button type="button" disabled={busy} onClick={() => void download('svg')} className={BUTTON}>⇩ SVG</button>
    </div>
  );
}
