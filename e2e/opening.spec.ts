import { expect, test, type Page } from '@playwright/test';
import { visible } from './helpers';

// The page opens with the chart of this moment at the visitor's own place, as the hosting platform has it from the address of the
// request (Porvoo where there is none: a local run has no such headers), North Indian, the name empty; the place and the moment are in
// the form to change, and Settings can make the page open at Porvoo or blank. (The other tests start blank: playwright.config.ts turns it off.)

/** Today in Porvoo as the page shows it: dd.mm.yyyy. */
const todayInPorvoo = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).replace(/\//g, '.');

/** The birth data form: beside the chart on a wide screen, behind the edit button of the summary on a phone. */
async function birthDataForm(page: Page) {
  const moment = visible(page, page.getByPlaceholder('15.08.1947 09.15.00'));
  if (!(await moment.isVisible())) await visible(page, page.getByRole('button', { name: 'edit', exact: true })).click();
  return { moment, place: visible(page, page.getByPlaceholder('e.g. New Delhi')) };
}

test.describe('the page opens with a chart', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('of now at Porvoo, North Indian, with the name empty', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');

    // The chart is there without a button pressed, and it is the North Indian one.
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });
    await expect(visible(page, page.getByText(/Asc \d+°\d+'|ASC \d+°\d+'/))).toBeVisible();
    // Name empty (an unnamed chart is "Untitled"), the place Porvoo, the date today in Porvoo and a time of day.
    // (A phone does not show the name of the chart in its header.)
    if (info.project.name === 'desktop') await expect(page.getByText('Untitled').first()).toBeVisible();
    const { moment, place } = await birthDataForm(page);
    await expect(place).toHaveValue('Porvoo');
    await expect(moment).toHaveValue(new RegExp('^' + todayInPorvoo().replace(/\./g, '\\.') + ' \\d{2}\\.\\d{2}\\.\\d{2}$'));
    expect(errors).toEqual([]);
  });

  test('and the place and the moment can be changed in the form', async ({ page }) => {
    await page.route('**/api/geocode**', (route) => route.fulfill({ json: { results: [{ name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }] } }));
    await page.goto('/');
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });

    const { moment, place } = await birthDataForm(page);
    await moment.fill('15.08.1947 09.15.00');
    await place.fill('New Delhi');
    await visible(page, page.getByRole('button', { name: 'lookup' })).click();
    await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();
    await expect(visible(page, page.getByText(/Asc 12°18'|ASC 12°18'/))).toBeVisible({ timeout: 30_000 });
  });

  test('at the place the platform gives for the visitor, by the clock of that place', async ({ page }) => {
    await page.route('**/api/locale', (route) => route.fulfill({ json: { city: 'Tokyo', country: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' } }));
    await page.goto('/');
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });
    const { moment, place } = await birthDataForm(page);
    await expect(place).toHaveValue('Tokyo');
    const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tokyo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()).replace(/\//g, '.');
    await expect(moment).toHaveValue(new RegExp('^' + today.replace(/\./g, '\\.') + ' \\d{2}\\.\\d{2}\\.\\d{2}$'));
    // Tokyo is nine hours from Greenwich all the year.
    await expect(visible(page, page.getByText(/\+9h UTC/))).toBeVisible();
  });

  test('at Porvoo when the place is not found', async ({ page }) => {
    await page.route('**/api/locale', (route) => route.fulfill({ status: 500, body: 'no' }));
    await page.goto('/');
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });
    await expect((await birthDataForm(page)).place).toHaveValue('Porvoo');
  });

  test('Porvoo whatever the platform says, when Settings choose it', async ({ page }) => {
    await page.route('**/api/locale', (route) => route.fulfill({ json: { city: 'Tokyo', country: 'JP', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' } }));
    await page.addInitScript(() => { try { if (!localStorage.getItem('openWithNowChart')) localStorage.setItem('openWithNowChart', 'porvoo'); } catch {} });
    await page.goto('/');
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });
    await expect((await birthDataForm(page)).place).toHaveValue('Porvoo');
  });

  test('an old "off" of Settings is still blank, and Settings can make the page open blank', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('openWithNowChart', 'false'); } catch {} });
    await page.goto('/');
    await expect(visible(page, page.getByRole('button', { name: 'Calculate Chart' }))).toBeVisible();
    await expect(page.locator('svg[aria-label="North Indian Jyotish chart"]')).toHaveCount(0);
  });

  test('unless Settings say to open blank', async ({ page }) => {
    await page.goto('/');
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });
    await visible(page, page.getByRole('button', { name: '⚙' })).click();
    const choice = visible(page, page.getByLabel('the page opens with'));
    await expect(choice).toHaveValue('place');
    await choice.selectOption('blank');
    await page.reload();
    await expect(visible(page, page.getByRole('button', { name: 'Calculate Chart' }))).toBeVisible();
    await expect(page.locator('svg[aria-label="North Indian Jyotish chart"]')).toHaveCount(0);
  });
});
