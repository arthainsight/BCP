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
