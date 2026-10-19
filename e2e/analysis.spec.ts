import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible, withChartLayers } from './helpers';

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

test('the nakshatra zodiac can be any ayanamsa of the list, and the panchang follows it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // The panchang is part of the chart workspace when it is switched on.
  await page.addInitScript(() => {
    if (!localStorage.getItem('chartDisplaySettings')) localStorage.setItem('chartDisplaySettings', JSON.stringify({ showPanchang: true }));
  });
  await calculateChart(page);
  // The chart of 15.08.1947 in Lahiri: the Moon at 99.8° of the Lahiri zodiac is in Pushya, 2nd pada (96°40′ to 100°).
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText('Pushya · Pada 2'))).toBeVisible();

  await selectWorkspace(page, '⚙');
  const zodiac = visible(page, page.locator('select').filter({ has: page.locator('option[value="same"]') }));
  // Every choice of the ayanamsa select is a choice here, with "same as the grahas" first, in the same groups.
  const ayanamsa = visible(page, page.locator('select').filter({ has: page.locator('option[value="custom-lahiri"]') }).filter({ hasNot: page.locator('option[value="same"]') }));
  // (Wait for the options to be there before they are read.)
  await expect(ayanamsa.locator('option')).toHaveCount(17);
  await expect(zodiac.locator('option')).toHaveCount(18);
  const ayanamsaValues = await ayanamsa.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value));
  expect(ayanamsaValues).toHaveLength(17);
  expect(await zodiac.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value))).toEqual(['same', ...ayanamsaValues]);
  expect(await zodiac.locator('optgroup').evaluateAll(groups => groups.map(group => (group as HTMLOptGroupElement).label)))
    .toEqual(await ayanamsa.locator('optgroup').evaluateAll(groups => groups.map(group => (group as HTMLOptGroupElement).label)));
  for (const value of ['raman', 'krishnamurti', 'fagan-bradley', 'yukteshwar', 'true-chitra', 'mardyks', 'ushashashi', 'tropical', 'custom-lahiri']) {
    await expect(zodiac.locator(`option[value="${value}"]`)).toHaveCount(1);
  }

  // Raman puts the Moon at 101.2°, in the 3rd pada (100° to 103°20′); the tropical zodiac at 122.9°, in Maghā; Lahiri is the grahas' own.
  await zodiac.selectOption('raman');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('calculationSettings') ?? '{}').nakshatraMode)).toBe('raman');
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText('Pushya · Pada 3'))).toBeVisible();
  await selectWorkspace(page, '⚙');
  await zodiac.selectOption('tropical');
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText(/^Magha · Pada \d$/))).toBeVisible();
  await selectWorkspace(page, '⚙');
  await zodiac.selectOption('lahiri');
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText('Pushya · Pada 2'))).toBeVisible();
  // Custom Lahiri here takes the adjustment of the ayanamsa select: a note says so.
  await selectWorkspace(page, '⚙');
  await zodiac.selectOption('custom-lahiri');
  await expect(visible(page, page.getByText('Custom Lahiri here uses the Lahiri adjustment of the ayanamsa above.'))).toBeVisible();

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

test('the yoga table has the Nabhasa yogas and the other classical ones, each with its reason', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');

  // The chart of 15.08.1947: the seven grahas are in three signs (Gemini, Cancer, Libra), which is the Shoola yoga, and no
  // other Nabhasa yoga holds; the Venus and Mercury, lords of the 9th and 10th, stand together in Cancer.
  const row = (name: string) => visible(page, page.locator('tr').filter({ has: page.locator('td:first-child', { hasText: new RegExp(`^${name}$`) }) }));
  await expect(row('Shoola')).toContainText('Nabhasa');
  await expect(row('Shoola')).toContainText('Planets in 3 signs');
  await expect(row('Dharma-Karmadhipati')).toContainText('Raja');
  await expect(row('Dharma-Karmadhipati')).toContainText('9th lord Venus in Cancer, house 11');
  await expect(row('Dharma-Karmadhipati')).toContainText('Conjunct');
  // The Moon is in the same sign as the Sun (the New Moon side of it), a Kendra from the Sun: Adhama of BPHS 37.1, the lowest of
  // the three (Varishta, Sama, Adhama), of which exactly one always holds.
  await expect(row('Adhama')).toContainText('Moon in 1st from Sun (Kendra)');
  // Only the active yogas are listed; the others are not.
  await expect(page.locator('td:first-child').filter({ hasText: /^(Gada|Gajakesari|Varishta|Sama|Kemadruma|Kurma)$/ }).locator('visible=true')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('the yoga detection is open at first, and what you choose is remembered', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');

  // The graha positions and the yoga table are both open.
  await expect(visible(page, page.getByText('graha.positions'))).toBeVisible();
  const toggle = visible(page, page.getByRole('button', { name: /yoga\.detection/ }));
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toContainText('collapse');
  await expect(visible(page, page.locator('th').filter({ hasText: /^Yoga$/ }))).toBeVisible();

  // The sort button is there; closing the table hides it and the table.
  const sort = visible(page, page.getByRole('button', { name: 'sort by strength' }));
  await sort.click();
  await expect(visible(page, page.getByRole('button', { name: '↓ strength' }))).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toContainText('expand');
  await expect(page.locator('th').filter({ hasText: /^Yoga$/ }).locator('visible=true')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /strength/ }).locator('visible=true')).toHaveCount(0);

  // The choice is kept: after a reload the table is still closed, and opening it is kept the same way.
  expect(await page.evaluate(() => localStorage.getItem('bhrigu:yoga-detection-open'))).toBe('false');
  await page.reload();
  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const again = visible(page, page.getByRole('button', { name: /yoga\.detection/ }));
  await expect(again).toHaveAttribute('aria-expanded', 'false');
  await again.click();
  await expect(again).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => localStorage.getItem('bhrigu:yoga-detection-open'))).toBe('true');
  await expect(visible(page, page.locator('th').filter({ hasText: /^Yoga$/ }))).toBeVisible();

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

test('the outer planets come after Rahu and Ketu in the graha table', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.addInitScript(() => {
    if (!localStorage.getItem('chartDisplaySettings')) localStorage.setItem('chartDisplaySettings', JSON.stringify({ showOuterPlanets: true }));
  });
  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const table = visible(page, page.locator('table', { has: page.locator('th', { hasText: 'Kāraka' }) }));
  await expect(table.locator('tr', { hasText: 'Pluto' })).toBeVisible();
  const names = await table.locator('tbody tr td:nth-child(2)').allInnerTexts();
  const at = (name: string) => names.findIndex(text => text.includes(name));
  expect(at('Saturn')).toBeGreaterThan(-1);
  expect(at('Rahu')).toBe(at('Saturn') + 1);
  expect(at('Ketu')).toBe(at('Rahu') + 1);
  expect(at('Uranus')).toBeGreaterThan(at('Ketu'));
  expect(at('Neptune')).toBe(at('Uranus') + 1);
  expect(at('Pluto')).toBe(at('Neptune') + 1);

  expect(errors).toEqual([]);
});

test('a sunrise typed in Settings moves the special lagnas of the graha table too', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await withChartLayers(page, { showSpecialLagnas: true });
  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const table = visible(page, page.locator('table', { has: page.locator('th', { hasText: 'Kāraka' }) }));
  const hora = async () => (await table.locator('tr', { has: page.locator('td', { hasText: /^HL$/ }) }).innerText()).replace(/\s+/g, ' ');
  const before = await hora();
  expect(before).toMatch(/HL/);

  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('textbox', { name: 'manual sunrise' })).fill('05:00:00');
  await selectWorkspace(page, 'ANALYSIS');
  await expect.poll(hora).not.toEqual(before);

  // Emptying the field goes back to the calculated sunrise and the same lagna.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('textbox', { name: 'manual sunrise' })).fill('');
  await selectWorkspace(page, 'ANALYSIS');
  await expect.poll(hora).toEqual(before);

  expect(errors).toEqual([]);
});

test('ANALYSIS Sarvatobhadra puts the grahas in the squares of their nakshatras, all inside the boxes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Sarvatobhadra', exact: true })).click();
  const chart = visible(page, page.locator('[data-sbc="chart"]'));
  await expect(chart).toBeVisible();

  // 9 × 9 squares: 28 nakshatras on the edge, 12 signs, the 5 tithi groups.
  await expect(chart.locator('[data-sbc-cell]')).toHaveCount(81);
  await expect(chart.locator('[data-sbc-kind="nakshatra"]')).toHaveCount(28);
  await expect(chart.locator('[data-sbc-kind="sign"]')).toHaveCount(12);
  await expect(chart.locator('[data-sbc-kind="tithi"]')).toHaveCount(5);
  await expect(chart.locator('[data-sbc-label="Abhi"]')).toHaveCount(1);

  // The chart of 15.08.1947 09.15 in New Delhi: the Moon is in Pushya, the Lagna (Virgo 12°) in Hasta.
  const cellOf = (label: string) => chart.locator(`[data-sbc-kind="nakshatra"][data-sbc-label="${label}"]`);
  await expect(cellOf('Push').locator('[data-sbc-planet="Moon"]')).toHaveCount(1);
  await expect(cellOf('Hast').locator('[data-sbc-planet="Asc"]')).toHaveCount(1);
  const legend = visible(page, page.locator('[data-sbc="legend"]'));
  await expect(legend).toContainText('Janma nakshatra: Pushya');
  await expect(legend).toContainText('Moon sign: Cn');
  await expect(legend).toContainText('Lagna sign: Vi');
  await expect(legend).toContainText('Birth day: Friday · Rikta');
  await expect(legend).toContainText('Birth tithi: Krishna 14 · Rikta');

  // Every text stays inside its own square, however many grahas stand in it.
  const outside = await chart.evaluate((svg) => {
    const bad: string[] = [];
    for (const group of Array.from(svg.querySelectorAll('[data-sbc-cell]'))) {
      const box = (group.querySelector('rect') as SVGRectElement).getBBox();
      for (const text of Array.from(group.querySelectorAll('text'))) {
        const b = (text as SVGTextElement).getBBox();
        if (b.x < box.x - 0.5 || b.y < box.y - 0.5 || b.x + b.width > box.x + box.width + 0.5 || b.y + b.height > box.y + box.height + 0.5) {
          bad.push(`${group.getAttribute('data-sbc-cell')}: ${text.textContent}`);
        }
      }
    }
    return bad;
  });
  expect(outside).toEqual([]);

  // The transiting grahas can be added, in a colour of their own.
  const transit = visible(page, page.getByRole('button', { name: 'Transit', exact: true }));
  if (await transit.isEnabled()) {
    await transit.click();
    await expect(chart.locator('[data-sbc-transit="true"]').first()).toBeVisible();
    expect(await chart.evaluate((svg) => Array.from(svg.querySelectorAll('[data-sbc-cell]')).flatMap((group) => {
      const box = (group.querySelector('rect') as SVGRectElement).getBBox();
      return Array.from(group.querySelectorAll('text')).filter((text) => {
        const b = (text as SVGTextElement).getBBox();
        return b.x < box.x - 0.5 || b.y < box.y - 0.5 || b.x + b.width > box.x + box.width + 0.5 || b.y + b.height > box.y + box.height + 0.5;
      }).map((text) => text.textContent);
    }))).toEqual([]);
  }

  expect(errors).toEqual([]);
});

test('ANALYSIS Sarvatobhadra draws the vedha of a graha: across the chart and on the two diagonals', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Sarvatobhadra', exact: true })).click();
  const chart = visible(page, page.locator('[data-sbc="chart"]'));
  await expect(chart).toBeVisible();
  await expect(chart.locator('[data-sbc-vedha-line]')).toHaveCount(0);

  // Jupiter stands in Vishakha: across the chart is Dhanishtha, and the diagonals reach Anuradha and Krittika.
  await visible(page, page.locator('[data-sbc-choice="n:Jupiter"]')).click();
  await expect(chart.locator('[data-sbc-vedha-line]')).toHaveCount(3);
  await expect(chart.locator('[data-sbc-vedha-line="across"]')).toHaveCount(1);
  await expect(chart.locator('[data-sbc-vedha-line="diagonal"]')).toHaveCount(2);
  await expect(chart.locator('[data-sbc-vedha="source"]')).toHaveCount(1);
  await expect(chart.locator('[data-sbc-cell][data-sbc-label="Visa"] [data-sbc-vedha="source"]')).toHaveCount(1);
  const marked = chart.locator('[data-sbc-vedha="target"]');
  await expect(marked).toHaveCount(3);
  for (const label of ['Dhan', 'Anu', 'Krit']) {
    await expect(chart.locator(`[data-sbc-cell][data-sbc-label="${label}"] [data-sbc-vedha="target"]`)).toHaveCount(1);
  }

  // The list names them, with the grahas that stand in them: Ketu is in Anuradha and Rahu in Krittika.
  const row = visible(page, page.locator('[data-sbc-vedha-from="n:Jupiter"]'));
  await expect(row).toContainText('Dhan');
  await expect(row.locator('[data-sbc-vedha-target="Anu"]')).toContainText('Ke');
  await expect(row.locator('[data-sbc-vedha-target="Krit"]')).toContainText('Ra');
  await expect(row.locator('[data-sbc-vedha-target="Dhan"]')).not.toContainText('[');

  // Another graha moves the lines; choosing the same one again takes them away.
  await visible(page, page.locator('[data-sbc-choice="n:Moon"]')).click();
  await expect(chart.locator('[data-sbc-cell][data-sbc-label="Push"] [data-sbc-vedha="source"]')).toHaveCount(1);
  await expect(chart.locator('[data-sbc-cell][data-sbc-label="Visa"] [data-sbc-vedha="source"]')).toHaveCount(0);
  await visible(page, page.locator('[data-sbc-choice="n:Moon"]')).click();
  await expect(chart.locator('[data-sbc-vedha-line]')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('ANALYSIS Sarvatobhadra marks the squares the lines cross, the syllable of a name and the birth points a graha pierces', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Sarvatobhadra', exact: true })).click();
  const chart = visible(page, page.locator('[data-sbc="chart"]'));
  await expect(chart).toBeVisible();
  const pierced = visible(page, page.locator('[data-sbc="pierced"]'));

  // The chart of 15.08.1947: Saturn in Ashlesha has a line through Cancer (the Moon's sign) and the Rikta square, which is the
  // tithi (Krishna 14) and the weekday (Friday) of the birth. Both are crossed, not ends of a line.
  const saturn = pierced.locator('[data-sbc-pierced-from="n:Saturn"]');
  await expect(saturn).toBeVisible();
  await expect(saturn.locator('[data-sbc-pierced-point="moonSign"]')).toHaveAttribute('data-sbc-pierced-at', 'line');
  await expect(saturn.locator('[data-sbc-pierced-point="tithi"]')).toHaveAttribute('data-sbc-pierced-at', 'line');
  await expect(saturn.locator('[data-sbc-pierced-point="vara"]')).toHaveAttribute('data-sbc-pierced-at', 'line');
  await expect(saturn).not.toContainText('Janma nakshatra');

  // Choosing Saturn draws its lines and tints the squares they cross; the nakshatras they end on are marked as before.
  await expect(chart.locator('[data-sbc-vedha="crossed"]')).toHaveCount(0);
  await visible(page, page.locator('[data-sbc-choice="n:Saturn"]')).click();
  await expect(chart.locator('[data-sbc-vedha-line]')).toHaveCount(3);
  await expect(chart.locator('[data-sbc-vedha="target"]')).toHaveCount(3);
  // Across: uu m t~ p r t ri (7 squares before Anuradha); the diagonals: d Cn Nanda Rikta Aq g (6 before Dhanishtha) and none before Magha.
  await expect(chart.locator('[data-sbc-vedha="crossed"]')).toHaveCount(13);
  for (const label of ['Cn', 'Nanda', 'Rikta', 'Aq', 'uu', 'ri']) {
    await expect(chart.locator(`[data-sbc-cell][data-sbc-label="${label}"] [data-sbc-vedha="crossed"]`)).toHaveCount(1);
  }
  await expect(chart.locator('[data-sbc-cell][data-sbc-label="Anu"] [data-sbc-vedha="crossed"]')).toHaveCount(0);
  await visible(page, page.locator('[data-sbc-choice="n:Saturn"]')).click();
  await expect(chart.locator('[data-sbc-vedha="crossed"]')).toHaveCount(0);

  // The syllable of the name: its squares are marked, and a graha that has a line through one of them pierces it.
  const syllable = visible(page, page.getByRole('textbox', { name: 'name syllable' }));
  await syllable.fill('zzz');
  await expect(visible(page, page.getByText('No square has that letter'))).toBeVisible();
  await syllable.fill('ch');
  await expect(chart.locator('[data-sbc-cell][data-sbc-label="ch"] [data-sbc-roles~="name"]')).toHaveCount(1);
  await expect(visible(page, page.locator('[data-sbc="legend"]'))).toContainText('Name syllable: ch');
  // Rahu in Krittika (on the right edge, row 2) has its straight line along that row, through 'ch'.
  const rahu = pierced.locator('[data-sbc-pierced-from="n:Rahu"]');
  await expect(rahu.locator('[data-sbc-pierced-point="name"]')).toHaveAttribute('data-sbc-pierced-at', 'line');
  await syllable.fill('');
  await expect(chart.locator('[data-sbc-roles~="name"]')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('ANALYSIS Kota Chakra counts the nakshatras from the Moon\'s, puts the grahas in their squares and names the Swami and the Pala', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Kota Chakra', exact: true })).click();
  const chart = visible(page, page.locator('[data-kota="chart"]'));
  await expect(chart).toBeVisible();

  // 28 nakshatras in four squares: 8, 8, 8 and 4.
  await expect(chart.locator('[data-kota-square]')).toHaveCount(28);
  for (const [ring, count] of [[0, 8], [1, 8], [2, 8], [3, 4]]) await expect(chart.locator(`[data-kota-ring="${ring}"]`)).toHaveCount(count);

  // The chart of 15.08.1947 09.15 in New Delhi: the Moon is in Pushya (pada 2), the first place of the count, at the
  // top left of the outer square; Pushya's neighbours in the count follow it.
  const square = (nakshatra: string) => chart.locator(`[data-kota-square="${nakshatra}"]`);
  await expect(square('Pushya')).toHaveAttribute('data-kota-place', '1');
  await expect(square('Pushya')).toHaveAttribute('data-kota-ring', '0');
  await expect(square('Pushya').locator('[data-kota-janma="true"]')).toHaveCount(1);
  await expect(square('Ashlesha')).toHaveAttribute('data-kota-place', '2');
  await expect(square('Ashlesha')).toHaveAttribute('data-kota-ring', '1');
  await expect(square('Punarvasu')).toHaveAttribute('data-kota-place', '28');
  await expect(square('Rohini')).toHaveAttribute('data-kota-ring', '3');

  // The grahas stand in the squares of their nakshatras.
  await expect(square('Pushya').locator('[data-kota-planet="Moon"]')).toHaveCount(1);
  await expect(square('Pushya').locator('[data-kota-planet="Mercury"]')).toHaveCount(1);
  await expect(square('Ashlesha').locator('[data-kota-planet="Sun"]')).toHaveCount(1);
  await expect(square('Ashlesha').locator('[data-kota-planet="Venus"]')).toHaveCount(1);
  await expect(square('Ashlesha').locator('[data-kota-planet="Saturn"]')).toHaveCount(1);
  await expect(square('Ardra').locator('[data-kota-planet="Mars"]')).toHaveCount(1);
  await expect(square('Vishakha').locator('[data-kota-planet="Jupiter"]')).toHaveCount(1);
  await expect(square('Krittika').locator('[data-kota-planet="Rahu"]')).toHaveCount(1);
  await expect(square('Anuradha').locator('[data-kota-planet="Ketu"]')).toHaveCount(1);
  await expect(square('Hasta').locator('[data-kota-planet="Asc"]')).toHaveCount(1);

  // The Moon is in Cancer, so the Swami is the Moon; Pushya pada 2 gives Rahu as the Pala.
  await expect(visible(page, page.locator('[data-kota-swami]'))).toHaveAttribute('data-kota-swami', 'Moon');
  await expect(visible(page, page.locator('[data-kota-pala]'))).toHaveAttribute('data-kota-pala', 'Rahu');
  await expect(visible(page, page.locator('[data-kota="legend"]'))).toContainText('Janma nakshatra: Pushya (pada 2)');
  await expect(visible(page, page.locator('[data-kota-row="n:Moon"]'))).toContainText('Bahya (exterior)');
  await expect(visible(page, page.locator('[data-kota-row="n:Sun"]'))).toContainText('Praakaara (wall)');

  // Where they stand: the Moon, the Swami, is in Pushya (Bahya); Rahu, the Pala, in Krittika (inside the wall).
  await expect(visible(page, page.locator('[data-kota="lords-place"]'))).toContainText('Kota Swami (fort lord): Moon — Bahya (exterior)');
  await expect(visible(page, page.locator('[data-kota="lords-place"]'))).toContainText('Kota Pala (fort guard): Rahu — Durgantara (interior)');

  // The count can begin at Krittika, as the fort wheel of the Agni Purana does: the same squares, Krittika first, Pushya the 6th.
  await visible(page, page.getByRole('button', { name: 'Krittika (Agni Purana)', exact: true })).click();
  await expect(square('Krittika')).toHaveAttribute('data-kota-place', '1');
  await expect(square('Krittika')).toHaveAttribute('data-kota-ring', '0');
  await expect(square('Pushya')).toHaveAttribute('data-kota-place', '6');
  await expect(square('Pushya')).toHaveAttribute('data-kota-ring', '1');
  await expect(square('Pushya').locator('[data-kota-janma="true"]')).toHaveCount(1);
  await expect(square('Pushya').locator('[data-kota-planet="Moon"]')).toHaveCount(1);
  await visible(page, page.getByRole('button', { name: 'Janma nakshatra', exact: true })).click();
  await expect(square('Pushya')).toHaveAttribute('data-kota-place', '1');

  // Every text stays inside its own square, however many grahas stand in it.
  const outside = () => chart.evaluate((svg) => {
    const bad: string[] = [];
    for (const group of Array.from(svg.querySelectorAll('[data-kota-square]'))) {
      const box = (group.querySelector('rect') as SVGRectElement).getBBox();
      for (const text of Array.from(group.querySelectorAll('text'))) {
        const b = (text as SVGTextElement).getBBox();
        if (b.x < box.x - 0.5 || b.y < box.y - 0.5 || b.x + b.width > box.x + box.width + 0.5 || b.y + b.height > box.y + box.height + 0.5) {
          bad.push(`${group.getAttribute('data-kota-square')}: ${text.textContent}`);
        }
      }
    }
    return bad;
  });
  expect(await outside()).toEqual([]);

  // The transiting grahas can be added, in a colour of their own.
  const transit = visible(page, page.getByRole('button', { name: 'Transit', exact: true }));
  if (await transit.isEnabled()) {
    await transit.click();
    await expect(chart.locator('[data-kota-transit="true"]').first()).toBeVisible();
    expect(await outside()).toEqual([]);
    // The transiting grahas are read in the heart of the fort and outside it.
    const reading = visible(page, page.locator('[data-kota="reading"]'));
    await expect(reading.locator('[data-kota-zone="heart"]')).toContainText('Heart (Stambha, Durgantara)');
    await expect(reading.locator('[data-kota-zone="outer"]')).toContainText('Outside (Praakaara, Bahya)');
    await expect(reading.locator('[data-kota-zone]')).toHaveCount(2);
  }

  expect(errors).toEqual([]);
});

test('ANALYSIS Bala has a diagram and a table for the Ṣaḍbala, the Bhāva Bala and the Vimśopaka', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Bala', exact: true })).click();

  // Ṣaḍbala first: a bar for each of the seven grahas against the required strength, with a status word and icon, and the six balas in a second diagram.
  const against = visible(page, page.getByRole('img', { name: 'Ṣaḍbala against the required', exact: true }));
  await expect(against).toBeVisible();
  await expect(visible(page, page.getByText(/(✕|!|✓) \d+ % (weak|ok|strong)/))).toBeVisible();
  await expect(visible(page, page.getByRole('img', { name: 'What the Ṣaḍbala is made of', exact: true }))).toBeVisible();
  // Every bar can be reached with the keyboard and tells its numbers.
  const sunBar = visible(page, page.getByRole('img', { name: /^Sun: Total \d+ vp, Required 390 vp/ }));
  await sunBar.focus();
  await expect(visible(page, page.getByRole('status'))).toContainText('390 vp');
  // The table is below the diagrams.
  await expect(visible(page, page.getByText('shadbala.beta'))).toBeVisible();

  // Bhāva Bala: a column for each of the twelve houses.
  await visible(page, page.getByRole('button', { name: 'Bhāva Bala', exact: true })).click();
  await expect(visible(page, page.getByRole('img', { name: 'Bhāva Bala of the houses', exact: true }))).toBeVisible();
  await expect(visible(page, page.getByRole('img', { name: /^H12 · / }))).toBeVisible();
  await expect(visible(page, page.getByText('bhava.bala.beta'))).toBeVisible();

  // Vimśopaka: the scheme is chosen from four; the table has all of them.
  await visible(page, page.getByRole('button', { name: 'Vimśopaka', exact: true })).click();
  await expect(visible(page, page.getByRole('img', { name: /^Vimśopaka Bala/ }))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Ṣaḍvarga', exact: true })).click();
  await expect(visible(page, page.getByRole('img', { name: /Ṣaḍvarga/ }))).toBeVisible();
  await expect(visible(page, page.getByText('varga.strength.vimsopaka'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('ANALYSIS Sensitive Degrees marks Sandhi, Gandanta, Mṛtyu Bhāga and the Puṣkara degrees of the Lagna, the grahas and Māndi', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Sensitive Degrees', exact: true })).click();

  const row = (point: string) => visible(page, page.locator(`tr[data-point="${point}"]`));
  for (const point of ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Maandi']) await expect(row(point)).toBeVisible();

  // 15.08.1947: the Sun is at 28°21' of Cancer, 1°38' before the end of Ashlesha, in its last pada: Gandanta (and not Sandhi, which is within 1°).
  await expect(row('Sun').locator('[data-mark="gandanta"]')).toContainText('Ashlesha → Magha, 1°38\' from the junction');
  await expect(row('Sun').locator('[data-mark="sandhi"]')).not.toContainText('⚠');
  // The Moon at 9°48' of Cancer is in the Puṣkara navāṁśa 6°40'–10° (the 3rd), Jupiter at 25°54' of Libra in the 23°20'–26°40' one (the 8th).
  await expect(row('Moon').locator('[data-mark="pushkaraNavamsa"]')).toContainText("3rd navamsa (6°40'–10°)");
  await expect(row('Jupiter').locator('[data-mark="pushkaraNavamsa"]')).toContainText("8th navamsa (23°20'–26°40')");
  // Māndi at 29°44' of Leo: 0°15' from the end of the sign, and in the last Puṣkara navāṁśa of a fire sign.
  await expect(row('Maandi').locator('[data-mark="sandhi"]')).toContainText("0°15' from the end of the sign");
  await expect(row('Maandi').locator('[data-mark="pushkaraNavamsa"]')).toContainText('9th navamsa');
  // The Lagna (Virgo 12°18') is on none of them.
  await expect(row('Lagna')).not.toContainText(/⚠|✦/);

  // The summary names the points, and the table of every sign is under it.
  await expect(visible(page, page.locator('[data-sensitive-summary]'))).toContainText('On a weakening degree: Sun, Maandi');
  await expect(visible(page, page.locator('[data-sensitive-summary]'))).toContainText('On a Puṣkara degree: Moon, Jupiter, Maandi');
  await visible(page, page.getByText('The sensitive degrees of every sign')).click();
  await expect(visible(page, page.getByRole('cell', { name: "20°–23°20' · 26°40'–30°" }))).toBeVisible();

  // Special Sphutas has the Yogi, the Sahayogi and the Avayogi: Sun + Moon + 93°20' is Aquarius 11°29', in Shatabhisha (Rahu's).
  await visible(page, page.getByRole('button', { name: 'Special Sphutas', exact: true })).click();
  const yogi = visible(page, page.locator('[data-yogi]'));
  await expect(yogi.locator('[data-yogi-role="Yogi"]')).toContainText('Rahu');
  await expect(yogi.locator('[data-yogi-role="Yogi"]')).toContainText('Shatabhisha');
  await expect(yogi.locator('[data-yogi-role="Sahayogi"]')).toContainText('Saturn');
  await expect(yogi.locator('[data-yogi-role="Avayogi"]')).toContainText('Venus');
  await expect(yogi.locator('[data-yogi-role="Avayogi"]')).toContainText('Purva Phalguni');

  expect(errors).toEqual([]);
});
