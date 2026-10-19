import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible, withChartLayers } from './helpers';

// Charts: North / South / mixed, the layers on them, and what the ··· menu marks.

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

  await withChartLayers(page, { showBnnMajorHighlight: true, showBnnMinorHighlight: true });
  await calculateChart(page);

  await expect(visible(page, page.locator('svg').locator('text', { hasText: /RSN Maj/ }))).toBeVisible();
  await expect(visible(page, page.locator('svg').locator('text', { hasText: /RSN Min/ }))).toBeVisible();

  expect(errors).toEqual([]);
});

test('the Paraya grahas can be drawn one at a time, or all', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await withChartLayers(page, { showNadiParaya: true });
  await calculateChart(page);
  const chartText = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  // The Paraya labels carry a degree ("Ju 4.5°"); the the natal grahas show degrees and minutes ("5°12'"), which this does not match.
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

  await withChartLayers(page, { showDashaLords: true, showDashaHouses: true });
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

test('the dasha lords on the chart name their system, which the ··· menu changes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await withChartLayers(page, { showDashaLords: true, showDashaHouses: true });
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

test('the mixed chart has the D1 chart in the inner part of every house and any varga in the outer part', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await visible(page, page.getByRole('button', { name: 'MIX N', exact: true })).click();
  const mixed = visible(page, page.locator('[data-chart="mixed"]'));
  await expect(mixed).toBeVisible();

  // One chart in the North layout: the D1 chart's ascendant, with its degrees, and the divisional bar has no use and is gone.
  const nested = mixed.locator('[data-chart="nested"]');
  await expect(nested).toHaveAttribute('data-nested-shape', 'north');
  await expect(nested).toContainText(/Asc 12°18/);
  await expect(visible(page, page.getByRole('group', { name: 'divisional charts' }))).toHaveCount(0);

  // The navamsa is the outer chart to begin with; any varga can be chosen, and the outer part changes while the inner does not.
  const outer = visible(page, page.getByRole('combobox', { name: 'outer chart' }));
  await expect(outer).toHaveValue('9');
  await expect(mixed).toContainText('outer chart: D9');
  await expect(mixed).toContainText('inner chart: D1');
  const navamsa = await nested.innerText();
  await outer.selectOption('10');
  await expect(mixed).toContainText('outer chart: D10');
  expect(await nested.innerText()).not.toEqual(navamsa);
  await expect(nested).toContainText(/Asc 12°18/);
  await outer.selectOption('1');
  await expect(mixed).toContainText('outer chart: D1 ');

  // The South layout has the two charts in the cells of the signs, and their names in the middle.
  await outer.selectOption('16');
  await visible(page, page.getByRole('button', { name: 'MIX S', exact: true })).click();
  await expect(nested).toHaveAttribute('data-nested-shape', 'south');
  await expect(nested).toContainText(/D16/);
  await expect(nested).toContainText(/D1 /);
  await expect(nested).toContainText(/Asc 12°18/);

  // The style and the varga are kept with the settings.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}'));
  expect(stored.chartStyle).toBe('mixedSouth');
  expect(stored.mixedOuterDivision).toBe(16);

  // The report draws it too.
  if (info.project.name === 'phone') await visible(page, page.getByRole('button', { name: 'Chart actions', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'REPORT', exact: true })).click();
  const report = page.getByRole('dialog', { name: 'Client report' });
  await expect(report.locator('[data-report-section="chart"] [data-chart="nested"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(report).toBeHidden();

  // And Settings has both among the chart styles, with the same choice of varga.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /^chart style / })).click();
  await expect(visible(page, page.getByRole('button', { name: 'Mixed (South)', exact: true }))).toHaveAttribute('class', /emerald/);
  const settingsOuter = visible(page, page.getByRole('combobox', { name: 'outer chart' }));
  await expect(settingsOuter).toHaveValue('16');
  await settingsOuter.selectOption('7');
  await visible(page, page.getByRole('button', { name: 'Mixed (North)', exact: true })).click();
  await expect(visible(page, page.getByRole('button', { name: 'Mixed (North)', exact: true }))).toHaveAttribute('class', /emerald/);
  await visible(page, page.getByRole('button', { name: 'North Indian', exact: true })).click();
  await expect(visible(page, page.getByRole('combobox', { name: 'outer chart' }))).toHaveCount(0);

  // A style stored by v2.84, which had one mixed style, is the North one now.
  await page.evaluate(() => localStorage.setItem('chartDisplaySettings', JSON.stringify({ chartStyle: 'mixed', mixedOuterDivision: 9 })));
  await page.reload();
  await calculateChart(page);
  await expect(visible(page, page.locator('[data-chart="nested"]'))).toHaveAttribute('data-nested-shape', 'north');

  expect(errors).toEqual([]);
});

test('a chart that is opened for the first time shows the signs, the grahas and their degrees and minutes, and no other layer', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const text = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  // The grahas with their degrees and minutes ("12°18'" for the Ascendant).
  await expect.poll(text).toMatch(/\d+°\d+'/);
  // No nakṣatra abbreviations, special lagnas, RSN labels, Paraya degrees (those have one decimal), dasha marks or dasha-lord borders.
  await expect.poll(text).not.toMatch(/RSN|[ᴹᴬ]/);
  await expect.poll(text).not.toMatch(/(Ju|Sa|Ra|Ke) \d+\.\d°/);
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).locator('title', { hasText: 'Mahadasha lord' })).toHaveCount(0);
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).not.toContainText(/\bHL\b|\bGL\b/);

  // The ··· menu has them all off.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  for (const name of ['nakshatra', 'karaka', 'outer planets', 'special lagnas', 'yogi ʸ sahayogi ˢ avayogi ᵃ']) {
    await expect(visible(page, page.getByRole('button', { name, exact: true }))).toHaveAttribute('aria-pressed', 'false');
  }

  expect(errors).toEqual([]);
});

test('a graha in a chart tells its sensitive degrees and combustion when it is hovered, in the rāśi chart and in a varga', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const north = () => visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'));
  // 15.08.1947: the Sun is in the Gandanta, the Moon and Jupiter in a Puṣkara navāṁśa, Mercury, Venus and Saturn combust; the chart itself shows none of it.
  await expect(north().locator('title', { hasText: "⚠ Gandanta: Ashlesha → Magha, 1°38' from the junction" })).toHaveCount(1);
  await expect(north().locator('title', { hasText: "✦ Puṣkara Navāṁśa: 3rd navamsa (6°40'–10°), Virgo" })).toHaveCount(1);
  await expect(north().locator('title', { hasText: "☼ Combust: 13°59' from the Sun (orb 14°)" })).toHaveCount(1);
  await expect(north().locator('title', { hasText: '☼ Combust' })).toHaveCount(3);
  // Mars has no mark and so no tooltip.
  await expect(north().locator('tspan', { hasText: /^Ma/ }).locator('title')).toHaveCount(0);

  // The Navamsa chart comes beside the rāśi chart: the tests are made on the positions there (Mercury is in a Puṣkara navāṁśa of its own there), and nothing is combust.
  await visible(page, page.getByRole('button', { name: 'D9', exact: true })).click();
  const navamsa = page.locator('svg[aria-label="North Indian Jyotish chart"]:visible').nth(1);
  await expect(navamsa.locator('title', { hasText: /Puṣkara Navāṁśa/ })).not.toHaveCount(0);
  await expect(navamsa.locator('title', { hasText: '☼ Combust' })).toHaveCount(0);
  await expect(navamsa.locator('title', { hasText: '⚠ Gandanta' })).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('the Yogi, Sahayogi and Avayogi are marked on the grahas of the charts when the layer is switched on', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const north = () => visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'));
  const roles = () => north().locator('title', { hasText: /^[ʸˢᵃ] / });
  // Off to begin with.
  await expect(roles()).toHaveCount(0);

  // The ··· menu has the layer; switching it on marks Rahu (the Yogi), Saturn (the Sahayogi) and Venus (the Avayogi) of the 15.08.1947 chart.
  await visible(page, page.getByRole('button', { name: '···' })).click();
  const toggle = visible(page, page.getByRole('button', { name: 'yogi ʸ sahayogi ˢ avayogi ᵃ', exact: true }));
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.mouse.click(2, 2);
  await expect(north().locator('tspan', { hasText: /Ra℞?ʸ/ })).toHaveCount(1);
  await expect(north().locator('tspan', { hasText: /Saˢ/ })).toHaveCount(1);
  await expect(north().locator('tspan', { hasText: /Veᵃ/ })).toHaveCount(1);
  await expect(north().locator('title', { hasText: 'ʸ Yogi' })).toHaveCount(1);
  await expect(north().locator('title', { hasText: 'ˢ Sahayogi' })).toHaveCount(1);
  await expect(north().locator('title', { hasText: 'ᵃ Avayogi' })).toHaveCount(1);

  // The varga charts carry the same marks.
  await visible(page, page.getByRole('button', { name: 'D9', exact: true })).click();
  await expect(page.locator('svg[aria-label="North Indian Jyotish chart"]:visible').nth(1).locator('tspan', { hasText: /Ra℞?ʸ/ })).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('Mars, Mercury and Venus can be tried as Paraya grahas (beta), and are off until they are chosen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await withChartLayers(page, { showNadiParaya: true });
  await calculateChart(page);
  const chartText = async () => (await visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]')).textContent()) ?? '';
  const betaLabels = async () => [...new Set([...(await chartText()).matchAll(/(Ma|Me|Ve) \d+\.\d°/g)].map(match => match[1]))].sort();
  const open = async () => { await visible(page, page.getByRole('button', { name: '···' })).click(); };
  const close = async () => { await page.keyboard.press('Escape'); await page.mouse.click(2, 2); };
  const beta = () => visible(page, page.getByRole('group', { name: 'paraya grahas beta', exact: true }));

  // The four are drawn and the three are not.
  await expect.poll(betaLabels).toEqual([]);

  // A chip of the beta row draws that graha, in the sign and degree its age puts it, with the labels of the others as they were.
  await open();
  await expect(beta().getByRole('button', { name: 'Ma', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await beta().getByRole('button', { name: 'Ma', exact: true }).click();
  await close();
  await expect.poll(betaLabels).toEqual(['Ma']);
  await open();
  await beta().getByRole('button', { name: 'Ve', exact: true }).click();
  await beta().getByRole('button', { name: 'Me', exact: true }).click();
  await close();
  await expect.poll(betaLabels).toEqual(['Ma', 'Me', 'Ve']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}').parayaBodies)).toEqual(['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mars', 'Mercury', 'Venus']);

  // They start from their natal degrees and move at the same pace, so Venus (23°2' of Cancer) stays 8°40' ahead of Mercury (14°22'), whatever the date.
  const degreeOf = async (code: string) => Number((await chartText()).match(new RegExp(`${code} (\\d+\\.\\d)°`))![1]);
  const gap = ((await degreeOf('Ve')) - (await degreeOf('Me')) + 30) % 30;
  expect(Math.abs(gap - 8.667)).toBeLessThan(0.25);

  // "all" is the four, and none clears the lot.
  await open();
  await visible(page, page.getByRole('button', { name: 'all', exact: true }).first()).click();
  await close();
  await expect.poll(betaLabels).toEqual([]);
  await open();
  await beta().getByRole('button', { name: 'Ma', exact: true }).click();
  await visible(page, page.getByRole('button', { name: 'none', exact: true }).first()).click();
  await close();
  await expect.poll(async () => (await chartText()).match(/(Ju|Sa|Ra|Ke|Ma|Me|Ve) \d+\.\d°/)).toBeNull();

  expect(errors).toEqual([]);
});
