import { expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';

// What the browser tests share. The tests fail on any uncaught page error, and
// the city lookup is answered locally so they need no network.

export const visible = (page: Page, locator: ReturnType<Page['locator']>) => locator.locator('visible=true').first();

/** Clicks a button in the primary CHART / TIMING / ANALYSIS / ⚙ navigation. */
export async function selectWorkspace(page: Page, label: string) {
  await page
    .getByRole('button', { name: label, exact: true })
    .locator('visible=true')
    .first()
    .click();
}

/**
 * Switches chart layers on before the page loads: a chart starts with every layer off, and some tests look at one. The choice is only
 * stored when the browser has none yet, so a reload keeps what the page itself has stored.
 */
export async function withChartLayers(page: Page, layers: Record<string, boolean>) {
  await page.addInitScript((stored) => {
    try {
      if (!localStorage.getItem('chartDisplaySettings')) localStorage.setItem('chartDisplaySettings', JSON.stringify(stored));
    } catch {}
  }, layers);
}

/** Calculates the chart of 15.08.1947 in New Delhi, or of another birth moment (DD.MM.YYYY HH.MM.SS) in New Delhi. */
export async function calculateChart(page: Page, birth = '15.08.1947 09.15.00') {
  await page.route('**/api/geocode**', (route) =>
    route.fulfill({
      json: { results: [{ name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }] },
    })
  );
  await page.goto('/');

  // CHART is the initial workspace and shows the birth-data panel.
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill(birth);
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('New Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();

  // The calculation renders the natal chart (North Indian by default).
  await expect(visible(page, page.getByText(birth === '15.08.1947 09.15.00' ? /Asc 12°18'|ASC 12°18'/ : /Asc \d+°\d+'|ASC \d+°\d+'/))).toBeVisible({ timeout: 30_000 });
}

/** A small PNG made on the spot: a diagonal gradient, so the photograph is not a flat colour. */
export function makePng(width: number, height: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(crc(body), body.length + 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    for (let x = 0; x < width; x++) {
      row[1 + x * 3] = 200 - Math.floor((x / width) * 80);
      row[2 + x * 3] = 150 - Math.floor((y / height) * 60);
      row[3 + x * 3] = 120;
    }
    rows.push(row);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
}
