import { expect, test, type Page } from '@playwright/test';

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

  expect(errors).toEqual([]);
});

test('CHART workspace shows the chart (and editable birth data), not only the form', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  // Returning to CHART keeps the natal chart visible…
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText(/Asc 12°18'|ASC 12°18'/))).toBeVisible();

  // …while the birth-data form stays available for editing.
  await expect(visible(page, page.getByPlaceholder('15.08.1947 09.15.00'))).toBeVisible();
  await expect(visible(page, page.getByRole('button', { name: 'Calculate Chart' }))).toBeVisible();

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

test('BNN Major and BNN Minor labels render in the North Indian chart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  await expect(visible(page, page.locator('svg').locator('text', { hasText: /BNN Maj/ }))).toBeVisible();
  await expect(visible(page, page.locator('svg').locator('text', { hasText: /BNN Min/ }))).toBeVisible();

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

test('ANALYSIS exposes Grahas, Varga, Nāḍī, Aṣṭakavarga and Dṛṣṭi', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');

  for (const tab of ['Grahas', 'Varga', 'Nāḍī', 'Aṣṭakavarga', 'Dṛṣṭi']) {
    await visible(page, page.getByRole('button', { name: tab, exact: true })).click();
    await expect(visible(page, page.getByRole('button', { name: tab, exact: true }))).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test('TIMING exposes Dasha, Transit Hits, Sign changes, Tithi Praveśa and Varṣaphala', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');

  const dashaLabels = ['Dasha', 'transit.hits', 'Sign changes', 'Tithi Praveśa', 'Varṣaphala'];
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
