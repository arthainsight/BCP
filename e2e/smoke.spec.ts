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

  // Directions: the cross with the four directions; every graha stands in one.
  await visible(page, page.getByRole('button', { name: 'Directions', exact: true })).click();
  for (const direction of ['North', 'East', 'South', 'West']) {
    await expect(visible(page, page.getByRole('region', { name: direction, exact: true }))).toBeVisible();
  }
  await expect(visible(page, page.getByRole('group', { name: 'Direction chart' }))).toContainText('Mo');
  await visible(page, page.getByRole('button', { name: 'by house' })).click();
  await expect(visible(page, page.getByRole('region', { name: 'East', exact: true }))).toContainText('Asc');

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
    const second = await visible(page, page.getByRole('button', { name: /^Yogin/ })).boundingBox();
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
  await expect(yearly.locator('thead th', { hasText: 'Vimsottari' })).toBeVisible();
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

  await visible(page, page.getByRole('button', { name: '⤢ wide' })).click();
  await expect(page.locator('svg[aria-label="North Indian Jyotish chart"]').locator('visible=true')).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Systems', exact: true })).click();
  const panel = await visible(page, page.getByRole('button', { name: /^Vimsottari/ })).boundingBox();
  expect(panel?.width ?? 0).toBeGreaterThan(900);

  await visible(page, page.getByRole('button', { name: '⤡ narrow' })).click();
  await expect(chart).toBeVisible();

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
