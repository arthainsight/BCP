import { expect, test, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

// Smoke test for the current navigation: CHART / TIMING / ANALYSIS + Settings.
// Fails on any uncaught page error. The city lookup is answered locally so the
// test needs no network.

const visible = (page: Page, locator: ReturnType<Page['locator']>) => locator.locator('visible=true').first();

/** Clicks a button in the primary CHART / TIMING / ANALYSIS / ⚙ navigation. */
async function selectWorkspace(page: Page, label: string) {
  await page
    .getByRole('button', { name: label, exact: true })
    .locator('visible=true')
    .first()
    .click();
}

async function calculateChart(page: Page) {
  await page.route('**/api/geocode**', (route) =>
    route.fulfill({
      json: { results: [{ name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }] },
    })
  );
  await page.goto('/');

  // CHART is the initial workspace and shows the birth-data panel.
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill('15.08.1947 09.15.00');
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('New Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();

  // The calculation renders the natal chart (North Indian by default).
  await expect(visible(page, page.getByText(/Asc 12°18'|ASC 12°18'/))).toBeVisible({ timeout: 30_000 });
}

test('the primary navigation exposes CHART / TIMING / ANALYSIS / Settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  for (const label of ['CHART', 'TIMING', 'ANALYSIS', '⚙']) {
    await expect(visible(page, page.getByRole('button', { name: label, exact: true }))).toBeVisible();
  }

  // The name of the app and its maker are at the bottom of the page.
  await expect(page.getByRole('contentinfo')).toContainText('bhrigu.code by Riku Forsell');

  expect(errors).toEqual([]);
});

test('CHART workspace shows the chart (and editable birth data), not only the form', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  // Returning to CHART keeps the natal chart visible…
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText(/Asc 12°18'|ASC 12°18'/))).toBeVisible();

  // …while the birth data stays available for editing: the form beside the chart on a wide screen,
  // one line with an edit button on a phone.
  if (info.project.name === 'phone') {
    await expect(visible(page, page.locator('[data-data-summary]'))).toContainText('15.08.1947 09.15.00');
    await expect(page.getByPlaceholder('15.08.1947 09.15.00').locator('visible=true')).toHaveCount(0);
    await visible(page, page.getByRole('button', { name: 'edit', exact: true })).click();
  }
  await expect(visible(page, page.getByPlaceholder('15.08.1947 09.15.00'))).toBeVisible();
  await expect(visible(page, page.getByRole('button', { name: 'Calculate Chart' }))).toBeVisible();

  expect(errors).toEqual([]);
});

test('phone: the place is one line, the form folds away with the chart, and the navigation follows the screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the phone layout');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.route('**/api/geocode**', (route) =>
    route.fulfill({ json: { results: [{ name: 'Kotka', country: 'Finland', latitude: 60.4664, longitude: 26.94582, timezone: 'Europe/Helsinki' }] } })
  );
  await page.goto('/');
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill('13.10.1987 00.15.00');
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('Kotka, Finland');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();

  // After the lookup the place is one line, and the coordinate fields and the time zone box are behind edit.
  const place = visible(page, page.locator('[data-location-summary]'));
  await expect(place).toContainText('60.4664, 26.9458');
  await expect(place).toContainText('Europe/Helsinki');
  await expect(place).toContainText('+2h UTC');
  await expect(page.getByText('override UTC offset (leave blank for auto)').locator('visible=true')).toHaveCount(0);
  await place.getByRole('button', { name: 'edit', exact: true }).click();
  await expect(visible(page, page.getByText('override UTC offset (leave blank for auto)'))).toBeVisible();
  await place.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByText('override UTC offset (leave blank for auto)').locator('visible=true')).toHaveCount(0);

  // Calculating folds the form into one line, so the chart is at the top; the navigation says CHART, as the screen does.
  await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();
  const summary = visible(page, page.locator('[data-data-summary]'));
  await expect(summary).toContainText('13.10.1987 00.15.00');
  await expect(summary).toContainText('Kotka, Finland');
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible();
  await expect(page.getByPlaceholder('15.08.1947 09.15.00').locator('visible=true')).toHaveCount(0);
  const nav = page.getByRole('navigation', { name: 'Primary' }).locator('visible=true');
  await expect(nav.getByRole('button', { name: 'CHART', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('button', { name: 'ANALYSIS', exact: true })).not.toHaveAttribute('aria-current', 'page');
  const summaryBox = (await summary.boundingBox())!;
  const chartBox = (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).boundingBox())!;
  expect(chartBox.y).toBeLessThan(summaryBox.y + 600); // the chart starts under the one-line summary, not under the form

  // Hide and edit: the form opens again with a hide button, and folds again.
  await summary.getByRole('button', { name: 'edit', exact: true }).click();
  await expect(visible(page, page.getByPlaceholder('15.08.1947 09.15.00'))).toHaveValue('13.10.1987 00.15.00');
  await visible(page, page.getByRole('button', { name: '▲ hide', exact: true })).click();
  await expect(visible(page, page.locator('[data-data-summary]'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('calculates a chart from the CHART workspace and switches North/South', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  // North Indian chart renders by default.
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible();

  // Switch to South Indian and back to North.
  const south = page.getByRole('button', { name: 'S', exact: true }).locator('visible=true').first();
  const north = page.getByRole('button', { name: 'N', exact: true }).locator('visible=true').first();
  await south.click();
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toHaveCount(0);
  await north.click();
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('North + South draws both charts, the North chart inside the South chart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const north = () => visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'));
  const both = visible(page, page.getByRole('button', { name: 'N+S', exact: true }));

  await both.click();
  await expect(both).toHaveAttribute('aria-pressed', 'true');

  // The North chart sits in the middle of the South grid, which keeps its planets in the outer cells.
  const centre = visible(page, page.locator('[data-chart="center"]'));
  await expect(centre).toBeVisible();
  await expect(centre.locator('svg[aria-label="North Indian Jyotish chart"]')).toBeVisible();
  await expect(north()).toHaveCount(1);
  const outer = await visible(page, page.locator('[data-chart="center"]').locator('xpath=..')).textContent();
  expect(outer ?? '').toMatch(/H1/);

  // Both charts show the ascendant and the grahas.
  expect(await north().textContent()).toMatch(/Asc/);
  expect(await centre.locator('xpath=..').textContent()).toMatch(/Su/);

  // The choice is kept for the next chart, and N and S still switch to one chart.
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}').chartStyle)).toBe('both');
  await calculateChart(page);
  await expect(visible(page, page.locator('[data-chart="center"]'))).toBeVisible();

  await visible(page, page.getByRole('button', { name: 'S', exact: true })).click();
  await expect(page.locator('[data-chart="center"]').locator('visible=true')).toHaveCount(0);
  await expect(north()).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'N', exact: true })).click();
  await expect(north()).toBeVisible();
  await expect(page.locator('[data-chart="center"]').locator('visible=true')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('the text of North + South is the same size in both charts, and the text size can be changed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await visible(page, page.getByRole('button', { name: 'N+S', exact: true })).click();
  const centre = visible(page, page.locator('[data-chart="center"]'));
  await expect(centre).toBeVisible();

  // The largest label of each chart, in screen pixels.
  const sizes = () => centre.evaluate((node) => {
    const south = node.parentElement as HTMLElement;
    const svg = node.querySelector('svg') as SVGSVGElement;
    const unit = svg.getBoundingClientRect().width / 550;
    const north = [...svg.querySelectorAll('text')].map(text => Number(text.getAttribute('font-size')) * unit);
    const outer = [...south.querySelectorAll('div[style*="font-size"]')]
      .filter(div => !node.contains(div) && div.classList.contains('whitespace-nowrap'))
      .map(div => parseFloat(getComputedStyle(div).fontSize));
    return { north: Math.max(...north), south: Math.max(...outer) };
  });

  await expect.poll(async () => Math.abs((await sizes()).north - (await sizes()).south)).toBeLessThan(0.8);
  const usual = await sizes();
  expect(usual.south).toBeGreaterThan(10);
  expect(usual.south).toBeLessThanOrEqual(11.01);

  // The text size is in the ··· menu; both charts follow it.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByRole('slider', { name: 'text size' })).fill('1.3');
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(async () => (await sizes()).south).toBeGreaterThan(usual.south * 1.25);
  const larger = await sizes();
  expect(Math.abs(larger.north - larger.south)).toBeLessThan(0.8);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}').chartFontScale)).toBe(1.3);

  // Reset brings the usual size back.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByRole('button', { name: 'reset', exact: true })).click();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(async () => (await sizes()).south).toBeLessThan(usual.south * 1.05);

  expect(errors).toEqual([]);
});

test('split view: CHART, TIMING, ANALYSIS and PALM side by side on a wide screen', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const split = page.getByRole('button', { name: '⊞ split', exact: true });

  // A phone has its own split view, tested below.
  if (info.project.name !== 'desktop') return;

  const pane = (name: string) => page.locator(`[data-pane="${name}"]`);
  const panes = () => page.locator('[data-pane]');
  // The phone and the wide navigation are both in the page, one of them hidden.
  const nav = (name: string) => visible(page, page.locator(`[data-split-item="${name}"]`));

  // Switching it on keeps the workspace that is open, and adds the usual second one.
  await expect(split).toHaveAttribute('aria-pressed', 'false');
  await split.click();
  await expect(split).toHaveAttribute('aria-pressed', 'true');
  await expect(panes()).toHaveCount(2);
  await expect(pane('chart').locator('svg[aria-label="North Indian Jyotish chart"]')).toBeVisible();
  await expect(pane('analysis')).toContainText('Lagna');
  await expect(nav('chart')).toHaveAttribute('aria-pressed', 'true');
  await expect(nav('timing')).toHaveAttribute('aria-pressed', 'false');

  // Every workspace is a switch: all four on the same screen, the chart still in view.
  await nav('timing').click();
  await nav('palm').click();
  await expect(panes()).toHaveCount(4);
  await expect(pane('timing')).toBeVisible();
  await expect(pane('palm').locator('[data-palm="workspace"]')).toBeVisible();
  await expect(pane('chart').locator('svg[aria-label="North Indian Jyotish chart"]')).toBeVisible();
  const boxes = await Promise.all(['chart', 'timing', 'analysis', 'palm'].map(async name => (await pane(name).boundingBox())!));
  expect(boxes[0].x).toBeLessThan(boxes[1].x - 100); // chart left of timing, two columns of two
  expect(boxes[2].y).toBeGreaterThan(boxes[0].y + 100); // analysis on the second row
  // Every pane is shown in full (the page scrolls, the panes do not), and the chart pane has no form over the chart.
  const clipped = () => page.locator('[data-pane]').evaluateAll(nodes => nodes.filter(node => node.scrollHeight > node.clientHeight + 1).length);
  expect(await clipped()).toBe(0);
  await expect(pane('chart').locator('[data-data-line]')).toContainText('15.08.1947 09.15.00');
  await expect(pane('chart').getByPlaceholder('15.08.1947 09.15.00')).toHaveCount(0);
  await pane('chart').locator('[data-data-line]').click();
  await expect(pane('chart').getByPlaceholder('15.08.1947 09.15.00')).toBeVisible();
  await pane('chart').locator('[data-data-line]').click();
  await expect(pane('chart').getByPlaceholder('15.08.1947 09.15.00')).toHaveCount(0);

  // The rows can be chosen: one row of four across the screen, two rows of two, or left to the width (auto).
  const rowsButton = (rows: string) => visible(page, page.locator(`[data-split-rows="${rows}"]`));
  const layout = () => Promise.all(['chart', 'timing', 'analysis', 'palm'].map(async name => (await pane(name).boundingBox())!));
  await expect(rowsButton('auto')).toHaveAttribute('aria-pressed', 'true');
  await rowsButton('1').click();
  await expect(rowsButton('1')).toHaveAttribute('aria-pressed', 'true');
  const oneRow = await layout();
  expect(new Set(oneRow.map(box => Math.round(box.y))).size).toBe(1);
  expect(oneRow[3].x).toBeGreaterThan(oneRow[0].x + 3 * 200);
  await rowsButton('2').click();
  const twoRows = await layout();
  expect(twoRows[2].y).toBeGreaterThan(twoRows[0].y + 100);
  expect(twoRows[1].x).toBeGreaterThan(twoRows[0].x + 200);
  await rowsButton('auto').click();
  expect((await layout())[2].y).toBeGreaterThan(twoRows[0].y + 100); // a screen of this width is two rows of two on its own
  await rowsButton('2').click();

  // On a very wide screen auto is one row of four; two rows stay two rows of two.
  await page.setViewportSize({ width: 1920, height: 1000 });
  await rowsButton('auto').click();
  expect(new Set((await layout()).map(box => Math.round(box.y))).size).toBe(1);
  await rowsButton('2').click();
  const wideTwoRows = await layout();
  expect(wideTwoRows[2].y).toBeGreaterThan(wideTwoRows[0].y + 100);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Switching one off leaves the others; the last one cannot be switched off.
  await nav('analysis').click();
  await expect(pane('analysis')).toHaveCount(0);
  await expect(panes()).toHaveCount(3);
  // Three panes in two rows: the third takes the whole second row.
  const three = await Promise.all(['chart', 'timing', 'palm'].map(async name => (await pane(name).boundingBox())!));
  expect(three[2].y).toBeGreaterThan(three[0].y + 100);
  expect(three[2].width).toBeGreaterThan(three[0].width * 1.8);
  await nav('timing').click();
  await nav('palm').click();
  await expect(panes()).toHaveCount(1);
  await expect(rowsButton('1')).toHaveCount(0); // one pane has nothing to arrange
  await nav('chart').click();
  await expect(panes()).toHaveCount(1);
  await nav('analysis').click();
  await nav('palm').click();
  await expect(panes()).toHaveCount(3);

  // The choice is kept for the next visit.
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('splitView') ?? 'null'));
  expect(await stored()).toEqual({ on: true, panes: ['chart', 'analysis', 'palm'], rows: 2 });
  await page.reload();
  await expect(panes()).toHaveCount(3);
  await expect(pane('palm')).toBeVisible();

  // Settings is a screen of its own; a workspace brings the panes back.
  await visible(page, page.getByRole('button', { name: '⚙', exact: true })).click();
  await expect(page.locator('[data-split-view]')).toHaveCount(0);
  await expect(visible(page, page.getByText('ayanamsa', { exact: true }))).toBeVisible();
  await nav('timing').click();
  await expect(panes()).toHaveCount(4);

  // Off: one workspace again, the last one touched.
  await split.click();
  await expect(split).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-split-view]')).toHaveCount(0);
  await expect(panes()).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('split view on a phone: the workspaces stacked and shown in full', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the phone layout');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const split = page.getByRole('button', { name: '⊞ split', exact: true });
  const panes = page.locator('[data-mobile-pane]');
  const nav = (name: string) => visible(page, page.locator(`[data-split-item="${name}"]`));

  // On: the workspace on the screen stays, with the usual second one under it.
  await expect(split).toHaveAttribute('aria-pressed', 'false');
  await split.click();
  await expect(split).toHaveAttribute('aria-pressed', 'true');
  await expect(panes).toHaveCount(2);
  const [top, bottom] = await Promise.all(['chart', 'analysis'].map(async name => (await page.locator(`[data-mobile-pane="${name}"]`).boundingBox())!));
  expect(bottom.y).toBeGreaterThanOrEqual(top.y + top.height - 1); // one above the other
  expect(Math.abs(bottom.x - top.x)).toBeLessThan(2);
  // Each pane is shown in full: the page scrolls, the panes do not.
  const clipped = () => page.locator('[data-mobile-pane]').evaluateAll(nodes => nodes.filter(node => node.scrollHeight > node.clientHeight + 1).length);
  expect(await clipped()).toBe(0);
  const chartBox = (await page.locator('[data-mobile-pane="chart"] svg[aria-label="North Indian Jyotish chart"]').boundingBox())!;
  expect(chartBox.y + chartBox.height).toBeLessThanOrEqual(top.y + top.height + 1);
  expect((await page.locator('[data-mobile-pane="chart"] [data-data-line]').boundingBox())!.height).toBeLessThan(40); // the birth data is one thin line
  await expect(page.locator('[data-mobile-pane="chart"] [data-data-line]')).toContainText('15.08.1947 09.15.00');
  await expect(page.locator('[data-mobile-pane="chart"]').getByPlaceholder('15.08.1947 09.15.00')).toHaveCount(0);
  await expect(page.locator('[data-mobile-pane="analysis"]')).toContainText('Lagna');
  await expect(nav('chart')).toHaveAttribute('aria-pressed', 'true');
  await expect(nav('timing')).toHaveAttribute('aria-pressed', 'false');

  // Every workspace is a switch here too; the rows choice is for wide screens only.
  await nav('timing').click();
  await nav('palm').click();
  await expect(panes).toHaveCount(4);
  await expect(page.locator('[data-split-rows]').locator('visible=true')).toHaveCount(0);
  await nav('analysis').click();
  await expect(panes).toHaveCount(3);
  await nav('timing').click();
  await nav('palm').click();
  await expect(panes).toHaveCount(1);

  await nav('chart').click();
  await expect(panes).toHaveCount(1); // the last one stays

  // The panes are remembered with the wide layout's; Settings is a screen of its own.
  await nav('palm').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('splitView') ?? 'null').panes)).toEqual(['chart', 'palm']);
  await visible(page, page.getByRole('button', { name: '⚙', exact: true })).click();
  await expect(page.locator('[data-mobile-split]')).toHaveCount(0);
  await expect(visible(page, page.getByText('ayanamsa', { exact: true }))).toBeVisible();
  await nav('timing').click();
  await expect(panes).toHaveCount(3);

  // Off: one workspace at a time again.
  await split.click();
  await expect(split).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-mobile-split]')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('screen recording: the screen and the voice are recorded to a video that can be downloaded', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'a phone browser cannot record the screen');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // The browser's own picker and its microphone question cannot be answered in a test: the "screen" is a canvas
  // that keeps changing and the "voice" is a tone. The recorder itself, the MediaRecorder, is the real one.
  await page.addInitScript(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext('2d')!;
    let frame = 0;
    setInterval(() => { frame += 1; context.fillStyle = `hsl(${(frame * 7) % 360} 70% 50%)`; context.fillRect(0, 0, 320, 180); }, 50);
    const calls = { screen: 0, mic: 0 };
    (window as unknown as { __calls: typeof calls }).__calls = calls;
    navigator.mediaDevices.getDisplayMedia = async () => { calls.screen += 1; return canvas.captureStream(15); };
    navigator.mediaDevices.getUserMedia = async () => {
      calls.mic += 1;
      const audio = new AudioContext();
      const tone = audio.createOscillator();
      const out = audio.createMediaStreamDestination();
      tone.connect(out);
      tone.start();
      return out.stream;
    };
  });
  await page.goto('/');

  const calls = () => page.evaluate(() => (window as unknown as { __calls: { screen: number; mic: number } }).__calls);
  const idle = visible(page, page.locator('[data-recorder="idle"]'));
  const active = visible(page, page.locator('[data-recorder="active"]'));
  const clock = () => visible(page, page.locator('[data-recorder-clock]')).innerText();
  const mic = visible(page, page.getByRole('button', { name: 'record the microphone' }));

  // The microphone is on to begin with; recording asks for the screen and the voice.
  await expect(idle).toBeVisible();
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await visible(page, page.getByRole('button', { name: 'rec', exact: true })).click();
  await expect(active).toBeVisible();
  await expect.poll(clock).toMatch(/^0:0[1-9]$/);
  expect(await calls()).toEqual({ screen: 1, mic: 1 });

  // Pausing holds the clock; continuing runs it again.
  await visible(page, page.getByRole('button', { name: 'pause', exact: true })).click();
  const held = await clock();
  await page.waitForTimeout(1200);
  expect(await clock()).toBe(held);
  await visible(page, page.getByRole('button', { name: 'continue', exact: true })).click();
  await expect.poll(clock).not.toBe(held);

  // Stopping leaves the video in a card in the corner, with its length and size.
  await visible(page, page.getByTitle('Stop the recording')).click();
  const panel = page.locator('[data-recording-panel]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-recording-info]')).toHaveText(/^\d:\d\d · \d+(\.\d)? (kB|MB) · (webm|mp4)$/);
  expect(await panel.locator('video').getAttribute('src')).toMatch(/^blob:/);
  await expect(idle).toBeVisible();
  await expect(panel).toContainText('lost if you close the page');

  // Download saves a real file with a name from the date.
  const [download] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Download video' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^bhrigu-code-\d{4}-\d\d-\d\d-\d{4}\.(webm|mp4)$/);
  const saved = await download.path();
  expect(saved).toBeTruthy();
  expect(readFileSync(saved!).length).toBeGreaterThan(1000);
  await expect(panel).toContainText('Saved to your downloads.');
  await panel.getByRole('button', { name: 'Discard' }).click();
  await expect(panel).toHaveCount(0);

  // With the microphone off the voice is not asked for, and the choice is remembered.
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('screenRecorderMic'))).toBe('false');
  await visible(page, page.getByRole('button', { name: 'rec', exact: true })).click();
  await expect(active).toBeVisible();
  await page.waitForTimeout(1200);
  await visible(page, page.getByTitle('Stop the recording')).click();
  await expect(panel).toBeVisible();
  expect(await calls()).toEqual({ screen: 2, mic: 1 });
  await panel.getByRole('button', { name: 'Discard' }).click();
  await page.reload();
  await expect(visible(page, page.getByRole('button', { name: 'record the microphone' }))).toHaveAttribute('aria-pressed', 'false');

  expect(errors).toEqual([]);
});

test('normal transit overlay toggles on and off in CHART', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  // The layer switches live behind the ··· menu of the chart.
  await page.getByRole('button', { name: '···' }).locator('visible=true').first().click();
  const transit = page.getByRole('button', { name: /transit/i }).locator('visible=true').first();
  await expect(transit).toHaveAttribute('aria-pressed', 'false');

  // ON — the twelve normal transit bodies are drawn in the transit colour.
  await transit.click();
  await expect(transit).toHaveAttribute('aria-pressed', 'true');
  await expect(visible(page, page.locator('svg tspan[fill="#f43f5e"]'))).toBeVisible({ timeout: 10_000 });

  // OFF — the overlay disappears.
  await transit.click();
  await expect(transit).toHaveAttribute('aria-pressed', 'false');

  expect(errors).toEqual([]);
});

test('RSN Major and RSN Minor labels render in the North Indian chart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  await expect(visible(page, page.locator('svg').locator('text', { hasText: /RSN Maj/ }))).toBeVisible();
  await expect(visible(page, page.locator('svg').locator('text', { hasText: /RSN Min/ }))).toBeVisible();

  expect(errors).toEqual([]);
});

test('divisional charts stay on screen next to the daśā panel on a wide screen', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const group = visible(page, page.getByRole('group', { name: 'divisional charts' }));
  const d9 = group.getByRole('button', { name: 'D9', exact: true });
  const d10 = group.getByRole('button', { name: 'D10', exact: true });
  await d9.click();
  await d10.click();
  await expect(d9).toHaveAttribute('aria-pressed', 'true');
  await expect(visible(page, page.getByRole('button', { name: /^D9 Navāṁśa/ }))).toBeVisible();
  await expect(visible(page, page.getByRole('button', { name: /^D10 Daśāṁśa/ }))).toBeVisible();

  // Only D9 left, full size.
  await group.getByRole('button', { name: 'D1', exact: true }).click();
  await d10.click();
  await expect(d10).toHaveAttribute('aria-pressed', 'false');
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible();

  // On a wide screen the chart column stays while TIMING is open.
  if (info.project.name === 'desktop') {
    await selectWorkspace(page, 'TIMING');
    await expect(visible(page, page.getByRole('button', { name: 'Systems', exact: true }))).toBeVisible();
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible();
    await expect(visible(page, page.getByRole('group', { name: 'divisional charts' }).getByRole('button', { name: 'D9', exact: true }))).toHaveAttribute('aria-pressed', 'true');
  }

  expect(errors).toEqual([]);
});

test('on a phone the chart stays pinned at the top while the daśās scroll', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'the pinned chart is for the single-column phone layout');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();

  const pinned = page.getByRole('region', { name: 'pinned chart' });
  await expect(pinned.locator('svg[aria-label="North Indian Jyotish chart"]')).toBeVisible();

  // Scroll the daśā list: the chart stays at the top of the screen, just below the app's top bar.
  await page.evaluate(() => window.scrollTo(0, 500));
  const barBottom = async () => (await page.locator('header').locator('visible=true').first().boundingBox())?.height ?? 0;
  await expect.poll(async () => Math.abs(((await pinned.boundingBox())?.y ?? 999) - (await barBottom()))).toBeLessThan(3);
  await expect(visible(page, page.getByRole('button', { name: /^Vimsottari/ }))).toBeVisible();

  // It folds away, and the daśās keep their place.
  await pinned.getByRole('button', { name: 'hide chart' }).click();
  await expect(pinned.locator('svg')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('ANALYSIS Nava-Tara chakra and the direction chart show the grahas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');

  // Nava-Tara: nine Taras of three nakshatras each, counted from the Moon's.
  await visible(page, page.getByRole('button', { name: 'Nava-Tara', exact: true })).click();
  for (const tara of ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-Mitra']) {
    await expect(visible(page, page.getByRole('region', { name: tara, exact: true }))).toBeVisible();
  }
  await expect(visible(page, page.getByRole('region', { name: 'Janma', exact: true }))).toContainText('Mo');

  // Directions: the South Indian chart with the directions of its signs and the compass beside it; every graha stands in one direction.
  await visible(page, page.getByRole('button', { name: 'Directions', exact: true })).click();
  const directions = visible(page, page.getByRole('group', { name: 'Direction chart' }));
  for (const direction of ['North', 'East', 'South', 'West']) {
    await expect(directions.locator(`[data-direction="${direction}"]`)).toHaveCount(1);
  }
  // 15.08.1947 in Delhi: the Moon is in Cancer (water: north), the Sun in Cancer too, Saturn in Cancer; Jupiter in Libra (air: west).
  const compass = (direction: string) => directions.locator(`[data-direction="${direction}"]`);
  await expect(compass('North')).toContainText('Mo');
  await expect(compass('North')).toContainText('Sun');
  await expect(compass('West')).toContainText('Jup');
  // Ketu is in Scorpio (north), Rahu in Taurus (south), Mars in Gemini (west); no graha is in a fire sign, so the east is empty.
  await expect(compass('North')).toContainText('Ket');
  await expect(compass('South')).toContainText('Rah');
  await expect(compass('West')).toContainText('Mars');
  await expect(compass('East')).toHaveText('');
  // Every graha has a red arrow over its name: to the right when it is direct, to the left when it is retrograde (the nodes always go left).
  expect(await compass('North').locator('path[stroke="#ef4444"]').count()).toBe(6);
  expect(await compass('South').locator('path[stroke="#ef4444"]').count()).toBe(1);
  // The signs have their directions at the edge of the grid, and the degrees stand beside the grahas.
  await expect(directions.getByRole('img', { name: 'South Indian chart with the directions of the signs' })).toContainText("°");
  // The direction belongs to the sign, so there is no choice of houses and no transits here.
  for (const gone of ['by sign', 'by house', 'Transit']) {
    await expect(page.getByRole('button', { name: gone, exact: true }).locator('visible=true')).toHaveCount(0);
  }
  await expect(directions).not.toContainText('Dig Bala');
  await expect(directions.locator('[data-direction]')).toHaveCount(4);

  expect(errors).toEqual([]);
});

test('transit.hits also lists the Paraya hits, to the 1st, 5th and 9th from each natal graha', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Transit Hits', exact: true })).click();

  const paraya = visible(page, page.getByRole('region', { name: 'paraya hits' }));
  await expect(paraya).toBeVisible();

  // Ten years hold every kind of hit: the point itself and its 5th and 9th sign.
  await paraya.getByRole('button', { name: '10 yr', exact: true }).click();
  await paraya.getByRole('button', { name: /^show all/ }).click();
  await expect(paraya).toContainText('over natal');
  await expect(paraya).toContainText('5th from natal');
  await expect(paraya).toContainText('9th from natal');
  await expect(paraya).toContainText(/age \d+\.\d/);

  expect(errors).toEqual([]);
});

test('the Paraya options in Settings change the Paraya hits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const hitsText = async () => {
    await selectWorkspace(page, 'TIMING');
    await visible(page, page.getByRole('button', { name: 'Transit Hits', exact: true })).click();
    const paraya = visible(page, page.getByRole('region', { name: 'paraya hits' }));
    await paraya.getByRole('button', { name: '10 yr', exact: true }).click();
    await paraya.getByRole('button', { name: /^show all/ }).click();
    return (await paraya.locator('ul').innerText()).replace(/\s+/g, ' ');
  };
  const before = await hitsText();

  // Saturn 2.5 years in every sign, and Rahu / Ketu 1.5.
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ has: page.locator('option', { hasText: '2.5 years per sign' }) })).selectOption('even');
  await visible(page, page.locator('select').filter({ has: page.locator('option', { hasText: '1.5 years per sign' }) })).selectOption('even');
  const after = await hitsText();

  expect(after).not.toEqual(before);
  expect(after).toMatch(/age \d+\.\d/);

  expect(errors).toEqual([]);
});

test('the graha names in Settings switch between English and Sanskrit', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const table = visible(page, page.locator('table').filter({ hasText: 'Graha' }));
  // English to start with.
  await expect(table).toContainText('Mercury');
  await expect(table).not.toContainText('Budha');

  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ has: page.locator('option', { hasText: /^Sanskrit/ }) })).selectOption('sanskrit');
  await selectWorkspace(page, 'ANALYSIS');
  const sanskrit = visible(page, page.locator('table').filter({ hasText: 'Graha' }));
  await expect(sanskrit).toContainText('Budha');
  await expect(sanskrit).toContainText('Candra');
  await expect(sanskrit).not.toContainText('Mercury');

  // The chart labels follow: Mercury is Bu, Jupiter Gu.
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toContainText('Gu');

  expect(errors).toEqual([]);
});

test('Systems stand side by side in columns, and each daśā keeps a note', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();

  // A note on the Vimsottari daśā is kept in the browser with the chart's birth moment.
  const vimshottari = visible(page, page.getByRole('button', { name: /^Vimsottari/ }));
  await vimshottari.click();
  await visible(page, page.getByRole('textbox', { name: /Vimsottari notes/ })).fill('Saturn return period');
  await expect(visible(page, page.getByLabel('has a note'))).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('bhrigu:dasha-notes:15.08.1947 09.15.00'));
  expect(JSON.parse(stored ?? '{}')).toEqual({ vimshottari: 'Saturn return period' });
  await vimshottari.click();

  if (info.project.name === 'desktop') {
    // Two columns: the first two cards sit on the same row.
    const columns = visible(page, page.getByText('columns', { exact: true })).locator('..');
    await columns.getByRole('button', { name: '2', exact: true }).click();
    const first = await visible(page, page.getByRole('button', { name: /^Vimsottari/ })).boundingBox();
    const second = await visible(page, page.getByRole('button', { name: /^Vimsottari (Utpanna|Kshema|Adhana)/ })).boundingBox();
    expect(Math.abs((first?.y ?? 0) - (second?.y ?? 99))).toBeLessThan(4);
    expect((second?.x ?? 0)).toBeGreaterThan((first?.x ?? 0) + 50);
  }

  expect(errors).toEqual([]);
});

test('the Dasha Slider and the Yearly table show the running daśās through time', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');

  // Slider: dragging changes the date and the running periods.
  await visible(page, page.getByRole('button', { name: 'Slider', exact: true })).click();
  const slider = visible(page, page.getByRole('slider', { name: 'dasha slider' }));
  await expect(slider).toBeVisible();
  const section = visible(page, page.getByRole('region', { name: 'dasha slider' }));
  const before = await section.innerText();
  await slider.fill('3000');
  await expect(section).not.toHaveText(before);
  await expect(section).toContainText(/age 8\.\d/);
  await expect(section).toContainText('Vimsottari');

  // Yearly: a row for each year, and the changes of MD marked.
  await visible(page, page.getByRole('button', { name: 'Yearly', exact: true })).click();
  const yearly = visible(page, page.getByRole('region', { name: 'yearly dashas' }));
  await expect(yearly.locator('tbody tr')).toHaveCount(21);
  await expect(yearly.locator('thead th', { hasText: /^Vimsottari$/ })).toBeVisible();
  await expect(yearly.locator('td.font-bold').first()).toBeVisible();
  await yearly.getByRole('button', { name: '+10 yr' }).click();
  await expect(yearly.locator('tbody tr').first()).toContainText('2026');

  expect(errors).toEqual([]);
});

test('an event shows the transits of its day on the charts', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('textbox', { name: 'Event name' })).fill('Moved abroad');
  await visible(page, page.getByLabel('Event date')).fill('2015-06-15');
  await visible(page, page.getByRole('button', { name: 'Add', exact: true })).click();

  // The Transits button keeps the preview open: the natal chart with the transits of that day.
  await visible(page, page.getByRole('button', { name: 'Transits on the charts' })).click();
  const preview = visible(page, page.getByRole('region', { name: 'event transits' }));
  await expect(preview).toContainText('15.06.2015 12:00');
  await expect(preview.locator('svg[aria-label="North Indian Jyotish chart"]')).toBeVisible({ timeout: 15_000 });
  // The transiting grahas are drawn in the transit colour.
  await expect(preview.locator('svg tspan[fill="#f43f5e"]').first()).toBeVisible();

  // It follows the divisional charts: D9 next to D1.
  await preview.getByRole('group', { name: 'divisional charts' }).getByRole('button', { name: 'D9', exact: true }).click();
  await expect(preview.locator('svg[aria-label="North Indian Jyotish chart"]')).toHaveCount(2);

  // With a pointer (the desktop), resting on the event is enough; unpinned, it closes again.
  if (info.project.name === 'desktop') {
    await visible(page, page.getByRole('button', { name: 'Transits on the charts' })).click();
    // The pointer is still over the event, so move it away before it can close.
    await page.mouse.move(2, 2);
    await expect(page.getByRole('region', { name: 'event transits' })).toHaveCount(0);
    await visible(page, page.locator('details').filter({ hasText: 'Moved abroad' })).hover();
    await expect(visible(page, page.getByRole('region', { name: 'event transits' }))).toBeVisible({ timeout: 5_000 });
  }

  expect(errors).toEqual([]);
});

test('the timing panel can take the whole width on a wide screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the wide mode is for a wide screen');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  const chart = visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'));
  await expect(chart).toBeVisible();

  await expect(visible(page, page.getByRole('button', { name: '⤢ full' }))).toBeInViewport({ ratio: 1 });
  await visible(page, page.getByRole('button', { name: '⤢ full' })).click();
  await expect(page.locator('svg[aria-label="North Indian Jyotish chart"]').locator('visible=true')).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();
  const panel = await visible(page, page.getByRole('button', { name: /^Vimsottari/ })).boundingBox();
  expect(panel?.width ?? 0).toBeGreaterThan(900);

  await visible(page, page.getByRole('button', { name: '⤡ narrow' })).click();
  await expect(chart).toBeVisible();

  expect(errors).toEqual([]);
});

test('the analysis can take the whole width on a wide screen, as the timing and the palm can', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the full mode is for a wide screen');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const chart = page.locator('svg[aria-label="North Indian Jyotish chart"]').locator('visible=true');
  await expect(chart).toHaveCount(1);

  // The same ⤢ full button as in TIMING and PALM, in view beside the tabs: the chart steps aside and the analysis is as wide as the screen.
  await expect(visible(page, page.getByRole('button', { name: '⤢ full', exact: true }))).toBeInViewport({ ratio: 1 });
  await visible(page, page.getByRole('button', { name: '⤢ full', exact: true })).click();
  await expect(chart).toHaveCount(0);
  const table = await visible(page, page.getByRole('button', { name: 'Varga', exact: true })).boundingBox();
  expect(table).toBeTruthy();
  const analysis = await visible(page, page.getByText('graha.positions')).locator('xpath=ancestor::div[contains(@class,"space-y-3")][1]').boundingBox();
  expect(analysis?.width ?? 0).toBeGreaterThan(1000);

  // The choice is remembered, and ⤡ narrow brings the chart back.
  expect(await page.evaluate(() => localStorage.getItem('analysisWide'))).toBe('true');
  await visible(page, page.getByRole('button', { name: '⤡ narrow', exact: true })).click();
  await expect(chart).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem('analysisWide'))).toBe('false');

  // The other two have the same button, and one workspace's full mode does not leak into another.
  await selectWorkspace(page, 'TIMING');
  await expect(visible(page, page.getByRole('button', { name: '⤢ full', exact: true }))).toBeVisible();
  await expect(chart).toHaveCount(1);
  await selectWorkspace(page, 'PALM');
  await expect(visible(page, page.getByRole('button', { name: '⤢ full', exact: true }))).toBeVisible();

  expect(errors).toEqual([]);
});

test('the data panel has no heading and no time zone box: the place is one line', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.route('**/api/geocode**', (route) =>
    route.fulfill({ json: { results: [{ name: 'Kotka', country: 'Finland', latitude: 60.4664, longitude: 26.94582, timezone: 'Europe/Helsinki' }] } })
  );
  await page.goto('/');
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill('13.10.1987 00.15.00');
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('Kotka, Finland');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();

  const place = visible(page, page.locator('[data-location-summary]'));
  await expect(place).toContainText('60.4664, 26.9458');
  await expect(place).toContainText('Europe/Helsinki');
  await expect(place).toContainText('+2h UTC');
  // Not the "> data" heading, not the "> LOCATION" one, not the grey TIMEZONE box with its override field.
  await expect(page.getByText('> data', { exact: true }).locator('visible=true')).toHaveCount(0);
  await expect(page.getByText('> location', { exact: true }).locator('visible=true')).toHaveCount(0);
  await expect(page.getByText('timezone', { exact: true }).locator('visible=true')).toHaveCount(0);
  await expect(page.getByText('override UTC offset (leave blank for auto)').locator('visible=true')).toHaveCount(0);
  await place.getByRole('button', { name: 'edit', exact: true }).click();
  await expect(visible(page, page.getByText('override UTC offset (leave blank for auto)'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('ANALYSIS Special Sphutas lists the special lagnas and follows the sunrise choice', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true })).click();

  const table = visible(page, page.locator('table').filter({ hasText: 'Sphuta' }));
  for (const name of ['Bhava Lagna', 'Hora Lagna', 'Ghati Lagna', 'Pranapada Lagna', 'Sree Lagna', 'Bhrigu Bindu', 'Arudha Lagna', '22nd Drekkana', '64th Navamsa', 'Indu Lagna', 'Varnada Lagna']) {
    await expect(table).toContainText(name);
  }
  // Degrees, minutes and seconds to hundredths, then the nakshatra and pada.
  await expect(table.locator('tbody tr').first()).toContainText(/\d+° \d+' \d+\.\d{2}"/);
  const hora = async () => (await table.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ');
  const mean = await hora();
  await expect(visible(page, page.getByText(/mean-time sunrise \d{2}:\d{2}:\d{2}/))).toBeVisible();

  // The true sunrise moves the lagnas that run on the time since sunrise.
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ has: page.locator('option', { hasText: /^True sunrise$/ }) })).selectOption('true');
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true })).click();
  const trueTable = visible(page, page.locator('table').filter({ hasText: 'Sphuta' }));
  await expect(visible(page, page.getByText(/true sunrise \d{2}:\d{2}:\d{2}/))).toBeVisible();
  expect((await trueTable.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ')).not.toEqual(mean);

  // A sunrise typed in replaces the calculated one in the table.
  const trueHora = (await trueTable.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ');
  await visible(page, page.getByRole('textbox', { name: 'manual sunrise' })).fill('06:28:31');
  await expect(visible(page, page.getByText(/manual sunrise 06:28:31/))).toBeVisible();
  expect((await trueTable.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ')).not.toEqual(trueHora);
  await visible(page, page.getByRole('textbox', { name: 'manual sunrise' })).fill('26:99');
  await expect(visible(page, page.getByText('Not a time of day'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('ANALYSIS Special Sphutas also lists the upagrahas, Karakamsa and the Arudha pada table', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true })).click();

  // Gulika and Maandi from Saturn's part of the day, and the five Sun-based ones.
  const upagrahas = visible(page, page.locator('table').filter({ hasText: 'Upagraha' }));
  for (const key of ['Gu', 'Md', 'Dh', 'Vy', 'Pa', 'In', 'Uk']) {
    await expect(upagrahas.locator(`tr[data-upagraha="${key}"]`)).toContainText(/\d+° \d+' \d+\.\d{2}"/);
  }
  const gulika = async () => (await upagrahas.locator('tr[data-upagraha="Gu"]').innerText()).replace(/\s+/g, ' ');
  const atBeginning = await gulika();
  // The 15 Aug 1947 Sun is in Cancer, so Upaketu (Sun − 30°) is in Gemini.
  await expect(upagrahas.locator('tr[data-upagraha="Uk"]')).toContainText('Gemini');

  // The moment of Saturn's part that gives Gulika can be chosen.
  await visible(page, page.getByRole('combobox', { name: /Gulika/ })).selectOption('end');
  await expect.poll(gulika).not.toEqual(atBeginning);

  // Karakamsa and Svamsa name the sign of the Atmakaraka in the Navamsa.
  await expect(visible(page, page.locator('tr[data-jaimini="karakamsa"]'))).toContainText(/Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/);
  await expect(visible(page, page.locator('tr[data-jaimini="svamsa"]'))).toBeVisible();

  // One pada for every house, AL12 being the Upapada.
  for (const name of ['AL', 'AL2', 'AL7', 'AL12']) {
    await expect(visible(page, page.locator(`tr[data-pada="${name}"]`))).toBeVisible();
  }
  await expect(visible(page, page.locator('tr[data-pada="AL12"]'))).toContainText('UL');

  expect(errors).toEqual([]);
});

test('the Paraya grahas can be drawn one at a time, or all', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const chartText = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  // The Paraya labels carry a degree ("Ju 4.5°"); the natal grahas show none by default.
  const parayas = async () => [...new Set([...(await chartText()).matchAll(/(Ju|Sa|Ra|Ke) \d+\.\d°/g)].map(match => match[1]))].sort();
  const all = await parayas();
  expect(all.length).toBeGreaterThanOrEqual(2);

  const group = () => visible(page, page.getByRole('group', { name: 'paraya grahas' }));
  const open = async () => { await visible(page, page.getByRole('button', { name: '···' })).click(); };
  const close = async () => { await page.keyboard.press('Escape'); await page.mouse.click(2, 2); };

  // None draws none of them.
  await open();
  await visible(page, page.getByRole('button', { name: 'none', exact: true }).first()).click();
  await close();
  await expect.poll(parayas).toEqual([]);

  // One chip draws that graha alone.
  const one = all[0];
  await open();
  await group().getByRole('button', { name: one, exact: true }).click();
  await expect(group().getByRole('button', { name: one, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await close();
  await expect.poll(parayas).toEqual([one]);

  // A second chip adds it; all brings back every one.
  const two = all[1];
  await open();
  await group().getByRole('button', { name: two, exact: true }).click();
  await close();
  await expect.poll(parayas).toEqual([one, two].sort());
  await open();
  await visible(page, page.getByRole('button', { name: 'all', exact: true }).first()).click();
  await close();
  await expect.poll(parayas).toEqual(all);

  // The choice is kept after a reload.
  await open();
  await visible(page, page.getByRole('button', { name: 'none', exact: true }).first()).click();
  await close();
  await page.waitForTimeout(300);
  await page.reload();
  await expect(visible(page, page.getByPlaceholder('15.08.1947 09.15.00'))).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}').parayaBodies)).toEqual([]);

  expect(errors).toEqual([]);
});

test('the upagrahas and Karakamsa can be marked on the charts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const chartText = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  expect(await chartText()).not.toMatch(/Gu|Md|KA/);

  // The ··· menu has a chip for each point.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  const points = visible(page, page.getByRole('group', { name: 'upagrahas and karakamsa' }));
  await points.getByRole('button', { name: 'Gu', exact: true }).click();
  await points.getByRole('button', { name: 'KA', exact: true }).click();
  await expect(points.getByRole('button', { name: 'KA', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(chartText).toMatch(/Gu/);
  expect(await chartText()).toMatch(/KA/);

  // The Navamsa chart marks Gulika in its own division; Karakamsa is a rāśi sign and stays out.
  const divisionBar = () => visible(page, page.getByRole('group', { name: 'divisional charts' }));
  await divisionBar().getByRole('button', { name: 'D9', exact: true }).click();
  await divisionBar().getByRole('button', { name: 'D1', exact: true }).click();
  await expect.poll(chartText).toMatch(/Gu/);
  expect(await chartText()).not.toMatch(/KA/);
  await divisionBar().getByRole('button', { name: 'D1', exact: true }).click();
  await divisionBar().getByRole('button', { name: 'D9', exact: true }).click();
  await expect.poll(chartText).toMatch(/KA/);

  // All switches the eight on at once, none clears them.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByRole('button', { name: 'all', exact: true }).last()).click();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(async () => {
    const text = await chartText();
    return ['Gu', 'Md', 'Dh', 'Vy', 'Pa', 'In', 'Uk', 'KA'].every(code => text.includes(code));
  }).toBe(true);
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByRole('button', { name: 'none', exact: true }).last()).click();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(chartText).not.toMatch(/Gu|Md|KA/);

  expect(errors).toEqual([]);
});

test('the Arudha padas AL, AL2 … can be marked on the charts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const chartText = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  expect(await chartText()).not.toMatch(/AL\d*/);

  // The ··· menu has a chip for each pada.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  const padas = visible(page, page.getByRole('group', { name: 'arudha padas' }));
  await padas.getByRole('button', { name: 'AL', exact: true }).click();
  await padas.getByRole('button', { name: 'AL12', exact: true }).click();
  await expect(padas.getByRole('button', { name: 'AL12', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(chartText).toMatch(/AL(?!\d)/);
  expect(await chartText()).toMatch(/AL12/);

  // The divisional charts work the padas out in their own division.
  await visible(page, page.getByRole('group', { name: 'divisional charts' }).getByRole('button', { name: 'D9', exact: true })).click();
  await visible(page, page.getByRole('group', { name: 'divisional charts' }).getByRole('button', { name: 'D1', exact: true })).click();
  await expect.poll(async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '').toMatch(/AL(?!\d)/);

  // All switches the twelve on at once.
  // The Paraya grahas and the upagrahas have their own all and none, so these are scoped to the padas.
  const padaHeader = () => visible(page, page.getByRole('group', { name: 'arudha padas' })).locator('xpath=preceding-sibling::div[1]');
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await padaHeader().getByRole('button', { name: 'all', exact: true }).click();
  const allPadas = visible(page, page.getByRole('group', { name: 'arudha padas' }));
  for (const name of ['AL', 'AL2', 'AL5', 'AL9', 'AL12']) {
    await expect(allPadas.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(padaHeader().getByRole('button', { name: 'all', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(async () => {
    const text = (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
    return ['AL2', 'AL3', 'AL4', 'AL5', 'AL6', 'AL7', 'AL8', 'AL9', 'AL10', 'AL11', 'AL12'].every(name => text.includes(name));
  }).toBe(true);

  // None clears them again.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await padaHeader().getByRole('button', { name: 'none', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect.poll(async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '').not.toMatch(/AL\d*/);

  expect(errors).toEqual([]);
});

test('the houses of the running daśā lords get a border that can be switched off', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const northChart = () => visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'));
  await expect(northChart().locator('title', { hasText: 'Mahadasha lord' })).toHaveCount(1);
  await expect(northChart().locator('title', { hasText: 'Antardasha lord' })).toHaveCount(1);

  // The ··· menu switches the borders off without touching the ᴹ/ᴬ marks.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByRole('button', { name: 'dasha houses' })).click();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect(northChart().locator('title', { hasText: 'Mahadasha lord' })).toHaveCount(0);
  await expect.poll(async () => (await northChart().textContent()) ?? '').toMatch(/[ᴹᴬ]/);

  expect(errors).toEqual([]);
});

test('the chara karakas can be seven or eight, ranked by degrees or minutes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const chartText = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByRole('button', { name: 'karaka', exact: true })).click();
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  // Eight karakas include the Pitṛkāraka; the Rahu leg is there too.
  await expect.poll(chartText).toMatch(/PiK/);

  await selectWorkspace(page, '⚙');
  const scheme = visible(page, page.locator('select', { has: page.getByRole('option', { name: '7 karakas (without Rahu)' }) }));
  await scheme.selectOption('7');
  await visible(page, page.locator('select', { has: page.getByRole('option', { name: 'Highest minute' }) })).selectOption('minute');

  await selectWorkspace(page, 'CHART');
  await expect.poll(chartText).not.toMatch(/PiK/);
  expect(await chartText()).toMatch(/AK/);
  expect(await chartText()).toMatch(/DK/);

  expect(errors).toEqual([]);
});

test('the dasha lords on the chart name their system, which the ··· menu changes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const northChart = () => visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'));
  // The hover text of a lord's house names the daśā system the lords come from.
  await expect(northChart().locator('title', { hasText: 'Mahadasha lord' })).toContainText('Vimś');

  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByLabel('dasha lords from')).selectOption('vds');
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect(northChart().locator('title', { hasText: 'Mahadasha lord' })).toContainText('VDS');

  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByLabel('dasha lords from')).selectOption('vimshottariVariant');
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect(northChart().locator('title', { hasText: 'Mahadasha lord' })).toContainText('Utp/Ksh/Adh');

  expect(errors).toEqual([]);
});

test('Vimsottari Utpanna / Kshema / Adhana starts from the Moon house rule, or the one chosen in Settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();

  const card = visible(page, page.getByRole('button', { name: /^Vimsottari (Utpanna|Kshema|Adhana).*[▶▼]$/ }));
  await expect(card).toHaveAttribute('aria-expanded', 'false');
  await card.click();
  await expect(card).toHaveAttribute('aria-expanded', 'true');

  // The three candidates, the strongest marked; the daśās below start from it.
  const rows = visible(page, page.locator('tbody tr[data-variant]').locator('..')).locator('tr[data-variant]');
  await expect(rows).toHaveCount(3);
  // The Moon of this chart is in the 11th house, which gives Utpanna (Sanjay Rath).
  await expect(card).toContainText('Vimsottari Utpanna');
  await expect(visible(page, page.getByText('Moon in house 11 → Utpanna'))).toBeVisible();
  await expect(visible(page, page.locator('tr[data-variant="utpanna"]'))).toContainText('●');
  await expect(visible(page, page.getByText(/^> vimshottari utpanna$/i))).toBeVisible();

  // Settings can fix the choice.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha methods/ })).click();
  await visible(page, page.locator('select', { has: page.getByRole('option', { name: 'Kshema (4th nakshatra)' }) })).selectOption('kshema');
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();
  const kshema = visible(page, page.getByRole('button', { name: /^Vimsottari Kshema.*[▶▼]$/ }));
  await kshema.click();
  await expect(visible(page, page.getByText(/chosen in Settings: Kshema/))).toBeVisible();
  await expect(visible(page, page.locator('tr[data-variant="kshema"]'))).toContainText('●');

  // The VDS daśā carries the name of U K Jha.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha systems/ })).click();
  await expect(visible(page, page.getByText('Vimsottari Original (U K Jha)'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('Utpanna / Kshema / Adhana is not used when the Moon stands in a house with no rule', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.route('**/api/geocode**', (route) =>
    route.fulfill({ json: { results: [{ name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }] } })
  );
  await page.goto('/');
  // Two hours later than the other tests' chart the Lagna is Libra and the Moon is in the 10th house.
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill('15.08.1947 11.30.00');
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('New Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });

  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();
  const card = visible(page, page.getByRole('button', { name: /^Vimsottari Utpanna \/ Kshema \/ Adhana.*[▶▼]$/ }));
  await expect(card).toContainText('Conditional: not applicable (Moon in 10H');
  await card.click();
  await expect(visible(page, page.getByText(/Moon in house 10: this daśā is not used/))).toBeVisible();
  await expect(page.locator('tr[data-variant] >> text=●')).toHaveCount(0);

  // The chart's ··· menu still offers the other systems, and says this one has nothing to show.
  await selectWorkspace(page, 'CHART');
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByLabel('dasha lords from')).selectOption('vimshottariVariant');
  await expect(visible(page, page.getByText('not applicable for this chart'))).toBeVisible();
  await visible(page, page.getByLabel('dasha lords from')).selectOption('vimshottari');
  await expect(visible(page, page.getByText('not applicable for this chart'))).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('TIMING Muhurta lists Rahu Kala, Yamaganda, Gulika Kala, Abhijit and the Choghadiya, for the birthplace or another place', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Muhurta', exact: true })).click();

  // The three kālas and Abhijit, each with a clock range, then eight Choghaḍiyā by day and eight by night.
  for (const key of ['rahu', 'yamaganda', 'gulika', 'abhijit']) {
    await expect(visible(page, page.locator(`tr[data-muhurta="${key}"]`))).toContainText(/\d{2}:\d{2}:\d{2} – \d{2}:\d{2}:\d{2}/);
  }
  await expect(visible(page, page.locator('[data-muhurta="sun"]'))).toContainText(/\d{2}:\d{2}:\d{2}/);
  await expect(page.locator('li[data-choghadiya]:visible')).toHaveCount(16);

  // Abhijit is the midday muhurta: it starts between ten and thirteen o'clock.
  const abhijit = (await visible(page, page.locator('tr[data-muhurta="abhijit"]')).innerText()).match(/(\d{2}):\d{2}:\d{2} –/);
  expect(Number(abhijit?.[1])).toBeGreaterThanOrEqual(10);
  expect(Number(abhijit?.[1])).toBeLessThanOrEqual(13);

  // Another place can be looked up (the lookup is answered locally with New Delhi).
  await visible(page, page.getByRole('button', { name: 'residence…' })).click();
  await visible(page, page.getByPlaceholder('City of residence that year')).fill('Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: /New Delhi, India/ })).click();
  await expect(visible(page, page.getByText(/New Delhi, India \(28\.61, 77\.21\)/))).toBeVisible();
  await expect(page.locator('li[data-choghadiya]:visible')).toHaveCount(16);

  expect(errors).toEqual([]);
});

test('ANALYSIS Gochara reads the transits against the Moon and the Ashtakavarga bindus', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Gochara', exact: true })).click();

  // One row for each of the nine grahas, with the house from the Lagna and from the Moon.
  const transits = visible(page, page.locator('table[data-gochara="transits"]'));
  await expect(transits.locator('tr[data-graha]')).toHaveCount(9);
  await expect(transits.locator('tr[data-graha="Saturn"]')).toContainText(/\d+\s*(?:✓|✗)/);
  // Rahu and Ketu have no Ashtakavarga of their own.
  await expect(transits.locator('tr[data-graha="Rahu"]')).toContainText('—');

  // The grid gives every graha's bindus in the twelve signs, the sign it is in marked, and the Sarva adds to 337.
  const grid = visible(page, page.locator('table[data-gochara="grid"]'));
  await expect(grid.locator('td[data-here="true"]')).toHaveCount(7);
  const sav = (await grid.locator('tr', { has: page.locator('th', { hasText: 'SAV' }) }).locator('td').allInnerTexts()).map(Number);
  expect(sav).toHaveLength(12);
  expect(sav.reduce((sum, value) => sum + value, 0)).toBe(337);

  expect(errors).toEqual([]);
});

test('ANALYSIS Argala lists the intervening and opposing grahas of every house and graha', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Argala', exact: true })).click();

  // The twelve houses from the Lagna, each with the 2nd, 4th, 11th and 5th argala.
  const houses = visible(page, page.locator('table[data-argala-view="houses"]'));
  await expect(houses.locator('tr[data-argala-row]')).toHaveCount(12);
  await expect(houses.locator('tr[data-argala-row="1"] td')).toHaveCount(4);
  // The chart has grahas in the argala houses, and some argalas stand while others are obstructed.
  await expect(houses.locator('td[data-argala="effective"]').first()).toBeVisible();
  await expect(houses.locator('td[data-argala="obstructed"]').first()).toBeVisible();

  // The same for each graha, counted from its own sign.
  await visible(page, page.getByRole('group', { name: 'argala view' })).getByRole('button', { name: 'Grahas', exact: true }).click();
  const grahas = visible(page, page.locator('table[data-argala-view="grahas"]'));
  await expect(grahas.locator('tr[data-argala-row]')).toHaveCount(9);
  await expect(grahas.locator('tr[data-argala-row="Saturn"] td')).toHaveCount(4);

  expect(errors).toEqual([]);
});

test('ANALYSIS Bhava Chalit places the grahas by bhava, with Sripati or equal bhavas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Bhava Chalit', exact: true })).click();

  // The chart and the twelve bhavas; the 1st has the Lagna (Virgo 12°18′) as its middle.
  await expect(visible(page, page.locator('[data-chalit="chart"] svg'))).toBeVisible();
  const table = visible(page, page.locator('table[data-chalit="table"]'));
  await expect(table.locator('tr[data-bhava]')).toHaveCount(12);
  await expect(table.locator('tr[data-bhava="1"]')).toContainText('Vi 12°18′');
  await expect(visible(page, page.locator('[data-chalit="moved"]'))).toContainText(/No graha changes house|rasi house \d+ → bhava \d+/);

  // The equal bhavas put the 4th madhya exactly 90° on from the Lagna.
  await visible(page, page.getByLabel('bhava system')).selectOption('equal');
  await expect(table.locator('tr[data-bhava="4"]')).toContainText('Sg 12°18′');
  await expect(table.locator('tr[data-bhava="10"]')).toContainText('Ge 12°18′');

  expect(errors).toEqual([]);
});

/** A small PNG made on the spot: a diagonal gradient, so the photograph is not a flat colour. */
function makePng(width: number, height: number): Buffer {
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

test('PALM: the chart stays beside the palm on a wide screen, and the stroke width has a slider', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const chartSvg = () => page.locator('svg[aria-label="North Indian Jyotish chart"]').locator('visible=true');
  await selectWorkspace(page, 'PALM');
  await expect(visible(page, page.locator('[data-palm="workspace"]'))).toBeVisible();

  // On a wide screen the chart is still there beside the palm; the wide button hides it and brings it back.
  if (info.project.name === 'desktop') {
    await expect(chartSvg()).toHaveCount(1);
    const wide = visible(page, page.getByRole('button', { name: '⤢ full', exact: true }));
    await wide.click();
    await expect(chartSvg()).toHaveCount(0);
    await expect(visible(page, page.locator('[data-palm="workspace"]'))).toBeVisible();
    await page.reload();
    await selectWorkspace(page, 'PALM');
    await expect(visible(page, page.getByRole('button', { name: '⤡ narrow', exact: true }))).toBeVisible();
    await visible(page, page.getByRole('button', { name: '⤡ narrow', exact: true })).click();
    await calculateChart(page);
    await selectWorkspace(page, 'PALM');
    await expect(chartSvg()).toHaveCount(1);
  }

  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'stroke.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  const slider = () => visible(page, page.getByRole('slider', { name: 'Stroke' }));
  const strokes = () => canvas.locator('g[data-kind="pen"] path');
  const widths = async () => (await strokes().evaluateAll(nodes => nodes.map(node => Math.round(Number(node.getAttribute('stroke-width')) * 100) / 100))).sort((a, b) => a - b);
  const drag = async (from: [number, number], to: [number, number]) => {
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2) + 6, { steps: 4 });
    await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
    await page.mouse.up();
  };

  // The photograph is 800 high, so a unit is 0.8 pixels of it: the usual width of 6 is 4.8.
  await visible(page, page.getByRole('button', { name: 'Pen', exact: true })).click();
  await drag([0.4, 0.3], [0.45, 0.7]);
  await expect.poll(widths).toEqual([4.8]);

  // A drawing is selected as soon as it is made, and the slider sets its width; one drag of the slider is one undo step.
  await slider().fill('12');
  await expect.poll(widths).toEqual([9.6]);
  await visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  await expect.poll(widths).toEqual([4.8]);

  // The next stroke is drawn with the width that was last set.
  await drag([0.7, 0.3], [0.75, 0.7]);
  await expect.poll(widths).toEqual([4.8, 9.6]);
  await expect(slider()).toHaveValue('12');

  // Selecting the first stroke shows its own width on the slider.
  await visible(page, page.getByRole('button', { name: 'Select', exact: true })).click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.425, box.y + box.height * 0.5);
  await expect(visible(page, page.locator('[data-palm="properties"]'))).toBeVisible();
  await expect(slider()).toHaveValue('6');
  await slider().fill('3');
  await expect.poll(widths).toEqual([2.4, 9.6]);

  expect(errors).toEqual([]);
});

test('PALM: upload a palm photograph, draw on it, number the notes, show it to the client and save it as a picture', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, 'PALM');
  await expect(visible(page, page.getByText('Upload or drop a photograph of a palm to begin.'))).toBeVisible();

  // Upload a photograph: it opens in the editor with an empty drawing.
  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'maria-right.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  await expect(visible(page, page.getByLabel('Name of the photograph'))).toHaveValue('maria-right');
  const shapes = (kind: string) => canvas.locator(`g[data-kind="${kind}"]`);

  // On a phone the toolbar scrolls out of view, so the photograph is brought into view before the pointer moves over it.
  const boxOf = async () => {
    await canvas.scrollIntoViewIfNeeded();
    return (await canvas.boundingBox())!;
  };
  const drag = async (from: [number, number], to: [number, number]) => {
    const box = await boxOf();
    await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2) + 6, { steps: 4 });
    await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
    await page.mouse.up();
  };
  const tool = (name: string) => visible(page, page.getByRole('button', { name, exact: true })).click();

  // A pen stroke along a line of the palm, an arrow and a circle.
  await tool('Pen');
  await drag([0.4, 0.3], [0.45, 0.7]);
  await expect(shapes('pen')).toHaveCount(1);
  await tool('Arrow');
  await drag([0.7, 0.25], [0.55, 0.45]);
  await expect(shapes('arrow')).toHaveCount(1);
  await tool('Circle');
  await drag([0.3, 0.75], [0.5, 0.9]);
  await expect(shapes('ellipse')).toHaveCount(1);

  // A pin is numbered at once and waits for its note.
  await tool('Pin');
  const box = await boxOf();
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.5);
  await expect(shapes('pin')).toHaveCount(1);
  await expect(visible(page, page.getByLabel('Note', { exact: true }))).toBeFocused();
  await page.keyboard.type('Career turns at 35');
  await expect(visible(page, page.locator('[data-palm="notes"] [data-note="1"]'))).toContainText('Career turns at 35');

  // Select can move a drawing and delete it; undo brings it back.
  await tool('Select');
  await boxOf();
  const before = await shapes('ellipse').locator('ellipse').getAttribute('cx');
  const ellipseBox = (await shapes('ellipse').locator('ellipse').boundingBox())!;
  await page.mouse.move(ellipseBox.x + ellipseBox.width / 2, ellipseBox.y + 1);
  await page.mouse.down();
  await page.mouse.move(ellipseBox.x + ellipseBox.width / 2 + 30, ellipseBox.y + 1, { steps: 4 });
  await page.mouse.up();
  await expect(visible(page, page.locator('[data-palm="properties"]'))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Delete', exact: true })).click();
  await expect(shapes('ellipse')).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  await expect(shapes('ellipse')).toHaveCount(1);
  expect(before).not.toBeNull();

  // Everything is kept on this device: after a reload the photograph and its drawing are back.
  await page.waitForTimeout(600);
  await page.reload();
  await selectWorkspace(page, 'PALM');
  const again = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(again).toBeVisible();
  await expect(again.locator('g[data-kind="pen"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="arrow"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="ellipse"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="pin"]')).toHaveCount(1);
  await expect(visible(page, page.locator('[data-palm="notes"] [data-note="1"]'))).toContainText('Career turns at 35');

  // The client view: large, with the numbered notes; a note zooms to its place.
  await visible(page, page.getByRole('button', { name: 'Client view', exact: true })).click();
  const client = visible(page, page.getByRole('dialog', { name: 'Client view' }));
  await expect(client).toBeVisible();
  const zoom = () => client.locator('[data-palm="zoom"]').innerText();
  const overview = await zoom();
  await client.locator('[data-client-note="1"]').click();
  await expect.poll(zoom).not.toEqual(overview);
  await client.getByRole('button', { name: 'Whole palm' }).click();
  await expect.poll(zoom).toEqual(overview);
  await page.keyboard.press('Escape');
  await expect(client).toBeHidden();

  // Save the picture, drawing and notes together.
  const download = page.waitForEvent('download');
  await visible(page, page.getByRole('button', { name: 'Download PNG', exact: true })).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('maria-right.png');
  const bytes = readFileSync(await file.path());
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.length).toBeGreaterThan(2000);

  // Rename, then delete the photograph.
  await visible(page, page.getByLabel('Name of the photograph')).fill('Maria, oikea käsi');
  await expect(visible(page, page.locator('[data-palm="records"]'))).toContainText('Maria, oikea käsi');
  await visible(page, page.getByRole('button', { name: 'Delete photograph' })).click();
  await visible(page, page.getByRole('button', { name: 'Delete this photograph?' })).click();
  await expect(visible(page, page.getByText('Upload or drop a photograph of a palm to begin.'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('TIMING Summary gathers the running daśās, sign changes and transit hits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Summary', exact: true })).click();

  const summary = visible(page, page.locator('#timing-summary'));
  await expect(summary).toContainText('Summary for');
  await expect(summary).toContainText(/Vimsottari\s*\w+ – \w+/);
  await expect(summary).toContainText('→', { timeout: 15_000 });
  await expect(summary).toContainText('over natal', { timeout: 15_000 });
  await expect(summary.getByRole('button', { name: 'Print / PDF' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('TIMING Systems lists the daśā systems closed and opens one on click', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();

  const vimshottari = visible(page, page.getByRole('button', { name: /^Vimsottari .*[▶▼]$/ }));
  await expect(vimshottari).toBeVisible();
  await expect(vimshottari).toHaveAttribute('aria-expanded', 'false');
  // Every system starts closed.
  await expect(page.locator('button[aria-expanded="true"]').filter({ hasText: '▼' })).toHaveCount(0);

  // The header already tells which period is running: lords joined by dashes and the MD end.
  await expect(vimshottari).toContainText(/\w+ – \w+.*MD → \d{2}\.\d{4}/);

  await vimshottari.click();
  await expect(vimshottari).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('button[aria-expanded="true"]').filter({ hasText: '▼' })).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('the graha table shows the karakas and the nakshatras whatever the chart shows, and the nakshatra zodiac follows the grahas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // The chart's own labels have no nakshatras: the table does not follow them.
  await page.addInitScript(() => {
    if (!localStorage.getItem('chartDisplaySettings')) localStorage.setItem('chartDisplaySettings', JSON.stringify({ showNakshatra: false, showCharaKaraka: false }));
  });
  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const table = visible(page, page.locator('table', { has: page.locator('th', { hasText: 'Kāraka' }) }));
  const moon = () => table.locator('tr', { hasText: 'Moon' });
  await expect(table.locator('th', { hasText: 'Nakṣatra' })).toBeVisible();
  await expect(table.locator('th', { hasText: 'Kāraka' })).toBeVisible();
  await expect(moon()).toContainText('Puṣya');
  // The chara karakas are in the Kāraka column: the 8 of the default scheme, on the 8 grahas with Rahu.
  const karakas = (await table.locator('td[title]').allInnerTexts()).filter(text => text.trim() !== '');
  expect(karakas).toHaveLength(8);
  expect(karakas).toEqual(expect.arrayContaining(['AK', 'AmK', 'BK', 'MK', 'PiK', 'PuK', 'GK', 'DK']));

  // The nakshatra zodiac: the grahas' ayanamsa to begin with; the tropical zodiac moves the Moon on to Maghā; Lahiri is the grahas' own here.
  await selectWorkspace(page, '⚙');
  const zodiac = visible(page, page.locator('select').filter({ has: page.locator('option[value="same"]') }));
  await expect(zodiac).toHaveValue('same');
  await expect(zodiac.locator('option[value="same"]')).toHaveText('Same ayanamsa as the grahas');
  await zodiac.selectOption('tropical');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('calculationSettings') ?? '{}').nakshatraMode)).toBe('tropical');
  await selectWorkspace(page, 'ANALYSIS');
  await expect(moon()).toContainText('Maghā');
  await selectWorkspace(page, '⚙');
  await zodiac.selectOption('lahiri');
  await selectWorkspace(page, 'ANALYSIS');
  await expect(moon()).toContainText('Puṣya');
  await selectWorkspace(page, '⚙');
  await zodiac.selectOption('same');
  await selectWorkspace(page, 'ANALYSIS');
  await expect(moon()).toContainText('Puṣya');

  expect(errors).toEqual([]);
});

test('a stored "sidereal" nakshatra zodiac, the old default, means the same ayanamsa as the grahas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.addInitScript(() => {
    localStorage.setItem('calculationSettings', JSON.stringify({ ayanamsa: 'lahiri', ayanamsaOffsetDegrees: 0, nodeMode: 'mean', nakshatraMode: 'sidereal' }));
  });
  await page.goto('/');
  await selectWorkspace(page, '⚙');
  await expect(visible(page, page.locator('select').filter({ has: page.locator('option[value="same"]') }))).toHaveValue('same');

  expect(errors).toEqual([]);
});

test('the yoga detection is shut until it is opened', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');

  // The graha positions are open; the yoga table is a closed line.
  await expect(visible(page, page.getByText('graha.positions'))).toBeVisible();
  const toggle = visible(page, page.getByRole('button', { name: /yoga\.detection/ }));
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toContainText('expand');
  await expect(page.locator('th').filter({ hasText: /^Yoga$/ }).locator('visible=true')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'sort by strength' }).locator('visible=true')).toHaveCount(0);

  // Opening it shows the table and the sort button; closing it hides them again.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toContainText('collapse');
  await expect(visible(page, page.locator('th').filter({ hasText: /^Yoga$/ }))).toBeVisible();
  const sort = visible(page, page.getByRole('button', { name: 'sort by strength' }));
  await sort.click();
  await expect(visible(page, page.getByRole('button', { name: '↓ strength' }))).toBeVisible();
  await toggle.click();
  await expect(page.locator('th').filter({ hasText: /^Yoga$/ }).locator('visible=true')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('ANALYSIS exposes Grahas, Varga, Nāḍī, Aṣṭakavarga, Dṛṣṭi, Nava-Tara and Directions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');

  for (const tab of ['Grahas', 'Varga', 'Nāḍī', 'Aṣṭakavarga', 'Dṛṣṭi', 'Nava-Tara', 'Directions']) {
    await visible(page, page.getByRole('button', { name: tab, exact: true })).click();
    await expect(visible(page, page.getByRole('button', { name: tab, exact: true }))).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test('TIMING exposes Dasha, Summary, Transit Hits, Sign changes, Tithi Praveśa and Varṣaphala', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');

  const dashaLabels = ['Dasha', 'Summary', 'Transit Hits', 'Sign changes', 'Tithi Praveśa', 'Varṣaphala'];
  for (const tab of dashaLabels) {
    await visible(page, page.getByRole('button', { name: tab, exact: true })).click();
    await expect(visible(page, page.getByRole('button', { name: tab, exact: true }))).toBeVisible();
  }

  // Sign changes lists when the grahas move into the next sign.
  await visible(page, page.getByRole('button', { name: 'Sign changes', exact: true })).click();
  await expect(visible(page, page.getByText('→').first())).toBeVisible({ timeout: 15_000 });
  // Stations and combustion are listed too (a year is certain to hold Mercury's turns).
  await visible(page, page.getByRole('button', { name: '12 mo', exact: true })).click();
  await expect(visible(page, page.getByText(/turns retrograde/).first())).toBeVisible({ timeout: 15_000 });

  expect(errors).toEqual([]);
});

test('Settings panel renders the global ayanamsa control', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, '⚙');

  await expect(visible(page, page.getByText('ayanamsa', { exact: true }))).toBeVisible();

  expect(errors).toEqual([]);
});

test('the interface switches to Finnish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ hasText: 'Suomi' })).selectOption('fi');
  await expect(visible(page, page.getByText('laskenta', { exact: true }))).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fi');

  expect(errors).toEqual([]);
});
