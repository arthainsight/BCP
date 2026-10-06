import { expect, test, type Page } from '@playwright/test';

// One chart, every main view. Fails on any uncaught page error.
// The city lookup is answered locally so the test needs no network.

const visible = (page: Page, locator: ReturnType<Page['locator']>) => locator.locator('visible=true').first();

async function calculateChart(page: Page) {
  await page.route('**/api/geocode**', route => route.fulfill({
    json: { results: [{ name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }] },
  }));
  await page.goto('/');
  const dataTab = page.getByRole('button', { name: 'Data', exact: true }).locator('visible=true');
  if (await dataTab.count()) await dataTab.first().click();
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill('15.08.1947 09.15.00');
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('New Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();
  const chartTab = page.getByRole('navigation').getByRole('button', { name: 'Chart', exact: true });
  if (await chartTab.locator('visible=true').count()) await chartTab.click();
}

test('calculates a chart and opens every main view', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));

  await calculateChart(page);

  // Natal chart with the ascendant degree in the 1st house.
  await expect(visible(page, page.getByText(/Asc 12°18'|ASC 12°18'/))).toBeVisible({ timeout: 30_000 });

  // Varga: Ṣaḍvarga by default, six small charts, a chart opens full size.
  await visible(page, page.getByRole('button', { name: 'Varga', exact: true })).click();
  await expect(visible(page, page.getByRole('button', { name: /^D9/ }))).toBeVisible();
  await expect(page.getByRole('button', { name: /^D\d+ / }).locator('visible=true')).toHaveCount(6);
  await visible(page, page.getByRole('button', { name: 'Ve', exact: true })).click();
  await expect(visible(page, page.getByText(/D3 Pi ↑/))).toBeVisible();
  await visible(page, page.getByRole('button', { name: /^D9/ })).click();
  await expect(visible(page, page.getByText('Marriage, dharma and inner strength', { exact: false }))).toBeVisible();

  // Full screen opens and Esc closes it.
  await visible(page, page.getByRole('button', { name: 'Full screen' })).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Target date: stepping back a year changes the date without a reload.
  await visible(page, page.getByRole('button', { name: 'Chart', exact: true })).click();
  const dateField = visible(page, page.locator('input[type="date"]'));
  const before = await dateField.inputValue();
  await visible(page, page.getByRole('button', { name: 'Back one year' })).click();
  await expect(dateField).not.toHaveValue(before);

  // The transits follow the target moment: stepping an hour recalculates them.
  const timeField = visible(page, page.locator('input[type="time"]'));
  await timeField.fill('23:30');
  const transitRequest = page.waitForRequest(request => request.url().includes('/api/chart?') && request.url().includes('hour=00'));
  await visible(page, page.getByRole('button', { name: 'Forward one hour' })).click();
  await transitRequest;
  await expect(timeField).toHaveValue('00:30');

  // Transit hits load for the twelve months after the target date.
  await visible(page, page.getByRole('button', { name: /transit hits/ })).click();
  await expect(visible(page, page.getByText(/over natal/))).toBeVisible({ timeout: 30_000 });

  // The other chart views render.
  for (const tab of ['Nāḍī', 'Aṣṭakavarga', 'Dṛṣṭi', 'Tithi Praveśa', 'Varṣaphala', 'Chart']) {
    await visible(page, page.getByRole('button', { name: tab, exact: true })).click();
  }

  expect(errors).toEqual([]);
});

test('settings open on calculations with the other groups collapsed', async ({ page }) => {
  await page.goto('/');
  const settingsTab = page.getByRole('navigation').getByRole('button', { name: 'Settings', exact: true });
  if (await settingsTab.locator('visible=true').count()) await settingsTab.click();
  else await visible(page, page.getByRole('button', { name: /settings/i })).click();
  await expect(visible(page, page.getByText('ayanamsa', { exact: true }))).toBeVisible();
  const layers = visible(page, page.getByRole('button', { name: 'chart layers' }));
  await expect(layers).toHaveAttribute('aria-expanded', 'false');
  await layers.click();
  await expect(visible(page, page.getByText('BCP year/month'))).toBeVisible();
});

test('the interface switches to Finnish', async ({ page }) => {
  await page.goto('/');
  const settingsTab = page.getByRole('navigation').getByRole('button', { name: 'Settings', exact: true });
  if (await settingsTab.locator('visible=true').count()) await settingsTab.click();
  else await visible(page, page.getByRole('button', { name: /settings/i })).click();
  await visible(page, page.locator('select').filter({ hasText: 'Suomi' })).selectOption('fi');
  await expect(visible(page, page.getByText('laskenta', { exact: true }))).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fi');
  const dataTab = page.getByRole('navigation').getByRole('button', { name: 'Tiedot', exact: true });
  if (await dataTab.locator('visible=true').count()) await dataTab.click();
  else await visible(page, page.getByRole('button', { name: 'tiedot', exact: true })).click();
  await expect(visible(page, page.getByRole('button', { name: 'Laske kartta' }))).toBeVisible();
});
