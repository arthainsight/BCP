import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible } from './helpers';

// Navigation and layout: the primary navigation, the split view, the full-width panels and the phone layout.

test('the primary navigation exposes CHART / TIMING / ANALYSIS / LIFE / LIBRARY / Settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');

  for (const label of ['CHART', 'TIMING', 'ANALYSIS', 'LIFE', 'LIBRARY', '⚙']) {
    await expect(visible(page, page.getByRole('button', { name: label, exact: true }))).toBeVisible();
  }

  // The name of the app and its maker are at the bottom of the page.
  await expect(page.getByRole('contentinfo')).toContainText('bhrigu.code by Riku Forsell');

  expect(errors).toEqual([]);
});

test('ANALYSIS and TIMING tools are grouped by purpose without hiding individual tools', async ({ page }) => {
  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  for (const label of ['Chart & strength', 'Relationships', 'Transits & directions', 'Classical systems']) {
    await expect(visible(page, page.locator(`[data-tool-group="${label}"]`))).toBeVisible();
  }
  await expect(visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true }))).toBeVisible();

  await selectWorkspace(page, 'TIMING');
  for (const label of ['Periods & overview', 'Transits & progressions', 'Annual & electional']) {
    await expect(visible(page, page.locator(`[data-tool-group="${label}"]`))).toBeVisible();
  }
  await expect(visible(page, page.getByRole('button', { name: 'Varṣaphala', exact: true }))).toBeVisible();
});

test('Research presents data, study setup, and results as three clear stages', async ({ page }) => {
  await page.goto('/');
  await selectWorkspace(page, 'LIBRARY');
  const research = visible(page, page.locator('[data-library-workspace]'));
  await expect(research.locator('[data-research-step="data"]')).toContainText('Choose your data');
  await expect(research.locator('[data-research-step="design"]')).toContainText('Design and run the study');
  await expect(research.locator('[data-research-step="results"]')).toContainText('Review results');
});

test('Research separates statistical study methods from focused tools', async ({ page }) => {
  await page.goto('/');
  await selectWorkspace(page, 'LIBRARY');
  const research = visible(page, page.locator('[data-library-workspace]'));
  const methods = research.locator('[data-research-methods]');
  const focused = research.locator('[data-research-focused-tools]');
  await expect(methods).toContainText('with chance');
  await expect(methods).toContainText('joint model');
  await expect(methods.getByRole('button', { name: 'Graha Hit Finder', exact: true })).toHaveCount(0);
  await expect(focused.getByRole('button', { name: 'Graha Hit Finder', exact: true })).toBeVisible();
  await expect(focused.getByRole('button', { name: 'Event Nadi relationships', exact: true })).toBeVisible();
});

test('LIBRARY opens Research as a separate workspace', async ({ page }) => {
  await page.goto('/');
  await selectWorkspace(page, 'LIBRARY');
  await expect(visible(page, page.locator('[data-library-workspace]'))).toBeVisible();
  await expect(visible(page, page.locator('[data-library-workspace]').getByRole('heading', { name: 'Research', exact: true }))).toBeVisible();
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

test('split view: CHART, TIMING, ANALYSIS and LIFE side by side on a wide screen', async ({ page }, info) => {
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
    await expect(visible(page, page.getByRole('button', { name: 'Dasas', exact: true }))).toBeVisible();
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
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

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
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
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

  // The same ⤢ full button as in TIMING and LIFE, in view beside the tabs: the chart steps aside and the analysis is as wide as the screen.
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
  await selectWorkspace(page, 'LIFE');
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

test('TIMING exposes Dasha, Summary, Transit Hits, Sign changes, Tithi, Nakṣatra and Yoga Praveśa and Varṣaphala', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');

  const dashaLabels = ['Dasha', 'Summary', 'Transit Hits', 'Sign changes', 'Tithi Praveśa', 'Nakṣatra Praveśa', 'Yoga Praveśa', 'Varṣaphala'];
  for (const tab of dashaLabels) {
    await visible(page, page.getByRole('button', { name: tab, exact: true })).click();
    await expect(visible(page, page.getByRole('button', { name: tab, exact: true }))).toBeVisible();
  }

  // Sign changes lists when the grahas move into the next sign.
  await visible(page, page.getByRole('button', { name: 'Sign changes', exact: true })).click();
  await expect(visible(page, page.locator('li').getByText('→').first())).toBeVisible({ timeout: 15_000 });
  // Stations and combustion are listed too (a year is certain to hold Mercury's turns).
  await visible(page, page.getByRole('button', { name: '12 mo', exact: true })).click();
  await expect(visible(page, page.getByText(/turns retrograde/).first())).toBeVisible({ timeout: 15_000 });

  expect(errors).toEqual([]);
});
