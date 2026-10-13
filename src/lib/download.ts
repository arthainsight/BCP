// Saving a file from the page: the browser downloads it under the name given.

/** Saves what a URL (an object URL, a data URL) points to. */
export function saveUrl(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Saves text or a Blob as a file. */
export function saveFile(filename: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  saveUrl(url, filename);
  // The download has started by now; a moment later the URL is let go.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** One cell of a CSV file: quoted, with the quotes inside doubled. */
export const csvCell = (value: unknown): string => `"${String(value ?? '').replaceAll('"', '""')}"`;

/** Rows of cells as the text of a CSV file. */
export const csvText = (rows: unknown[][]): string => rows.map(row => row.map(csvCell).join(',')).join('\n');
