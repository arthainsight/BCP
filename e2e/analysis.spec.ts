import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible } from './helpers';

// ANALYSIS: the grahas, the yogas, the sphutas and the other analysis views.

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
  // The true sunrise is the default (v2.87).
  const trueHoraFirst = await hora();
  await expect(visible(page, page.getByText(/true sunrise \d{2}:\d{2}:\d{2}/))).toBeVisible();

  // The mean-time sunrise moves the lagnas that run on the time since sunrise.
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ has: page.locator('option', { hasText: /^True sunrise$/ }) })).selectOption('mean');
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true })).click();
  const trueTable = visible(page, page.locator('table').filter({ hasText: 'Sphuta' }));
  await expect(visible(page, page.getByText(/mean-time sunrise \d{2}:\d{2}:\d{2}/))).toBeVisible();
  expect((await trueTable.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ')).not.toEqual(trueHoraFirst);

  // A sunrise typed in (in Settings) replaces the calculated one in the table, and the charts follow it.
  const meanHora = (await trueTable.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ');
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('textbox', { name: 'manual sunrise' })).fill('06:28:31');
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true })).click();
  await expect(visible(page, page.getByText(/manual sunrise 06:28:31/))).toBeVisible();
  expect((await trueTable.locator('tbody tr', { hasText: 'Hora Lagna' }).innerText()).replace(/\s+/g, ' ')).not.toEqual(meanHora);
  await selectWorkspace(page, '⚙');
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

test('ANALYSIS Dṛṣṭi shows the graha and the rāśi aspects without any setting to switch on first', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Dṛṣṭi', exact: true })).click();
  await expect(visible(page, page.getByText('Graha Dṛṣṭi (Parashari)'))).toBeVisible();
  await expect(visible(page, page.getByText('Rāśi Dṛṣṭi (Jaimini)'))).toBeVisible();
  await expect(visible(page, page.getByText('Dṛṣṭi house summary'))).toBeVisible();

  // The Grahas view no longer repeats the aspects: they have the tab of their own.
  await visible(page, page.getByRole('button', { name: 'Grahas', exact: true })).click();
  await expect(visible(page, page.getByText('graha.positions'))).toBeVisible();
  await expect(page.getByText('Graha Dṛṣṭi (Parashari)').locator('visible=true')).toHaveCount(0);

  expect(errors).toEqual([]);
});
