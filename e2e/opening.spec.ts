import { expect, test, type Page } from '@playwright/test';
import { visible } from './helpers';

// The page opens with the chart of this moment at Porvoo, North Indian, the name empty; the place and the moment are in the
// form to change, and Settings can make the page open blank. (The other tests start blank: playwright.config.ts turns it off.)

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

  test('unless Settings say to open blank', async ({ page }) => {
    await page.goto('/');
    await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });
    await visible(page, page.getByRole('button', { name: '⚙' })).click();
    await visible(page, page.getByLabel('open with the chart of now at Porvoo')).selectOption('off');
    await page.reload();
    await expect(visible(page, page.getByRole('button', { name: 'Calculate Chart' }))).toBeVisible();
    await expect(page.locator('svg[aria-label="North Indian Jyotish chart"]')).toHaveCount(0);
  });
});
