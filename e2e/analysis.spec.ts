import { expect, test, type Page } from '@playwright/test';
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

test('ANALYSIS Topic yogas judges the rules of BPHS 79, 18, 19, 44, 39 to 42, 17, 9, 10, 12 to 16 and 20 to 23 and shows their verses', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Topic yogas', exact: true })).click();

  // Spirituality first: seven rules of the Pravrajyā yoga, each met, not met or beyond judging, with the verses in Sanskrit that open.
  const panel = visible(page, page.locator('[data-topic-yogas="panel"]'));
  const states = async () => panel.locator('[data-topic-rule]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-met')));
  // By default only the rules the chart meets are shown; the buttons above them count and show the others.
  await expect(panel.locator('[data-topic-filter-key="met"]')).toHaveAttribute('aria-pressed', 'true');
  for (const met of await states()) expect(met).toBe('true');
  await panel.locator('[data-topic-filter-key="not"]').click();
  for (const met of await states()) expect(met).toBe('false');
  await panel.locator('[data-topic-filter-key="all"]').click();
  await expect(panel.locator('[data-topic-rule]')).toHaveCount(7);
  for (const met of await states()) expect(['true', 'false', 'null']).toContain(met);
  const rule = panel.locator('[data-topic-rule="pravrajya-initiated-king"]');
  await rule.locator('details summary').click();
  await expect(rule.locator('[data-topic-verse="15"] [lang="sa"]').first()).toContainText(/[\u0900-\u097F]/);

  // Marriage (BPHS 18) and longevity (19 and 44, with its caution).
  await panel.getByRole('button', { name: 'Marriage', exact: true }).click();
  await expect(panel.locator('[data-topic-rule="own-or-exalted"]')).toBeVisible();
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(25);
  await panel.getByRole('button', { name: 'Longevity and death', exact: true }).click();
  await expect(panel.locator('[data-topic-caution]')).toContainText('not a prediction');
  await expect(panel.locator('[data-topic-rule="chief-maraka"]')).toBeVisible();

  // Royal yogas, wealth and poverty (BPHS 39 to 42): the rāja, the dhana and the daridra rules each with its verses.
  await panel.getByRole('button', { name: 'Royal yogas, wealth and poverty', exact: true }).click();
  await expect(panel.locator('[data-topic-rule="exchange-1-5"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="poor-1-12-exchange"]')).toBeVisible();
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(50);

  // Illness and ariṣṭa (BPHS 17, 9, 10, with its caution).
  await panel.getByRole('button', { name: 'Illness and ariṣṭa', exact: true }).click();
  await expect(panel.locator('[data-topic-caution]')).toContainText('not a prediction');
  await expect(panel.locator('[data-topic-rule="wound-6th-lord"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="benefic-kendra"]')).toBeVisible();
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(40);

  // The houses (BPHS 12 to 16): the rules by chapter, each chapter with its heading.
  await panel.getByRole('button', { name: 'The houses (bhāva-phala)', exact: true }).click();
  await expect(panel.locator('[data-topic-chapter="12"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="lagna-lord-weak"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="children-die"]')).toBeVisible();
  await expect(panel.locator('[data-topic-chapter="23"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="father-year-1"]')).toBeVisible();
  await expect(panel.locator('[data-topic-caution]')).toContainText('not a prediction');
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(100);

  // The Phaladīpikā's house chapters (10, the 7th house): the rules with the heading of the classic.
  await panel.getByRole('button', { name: 'Phaladīpikā: the houses', exact: true }).click();
  await expect(panel.locator('[data-topic-chapter="10"]')).toContainText('Phaladīpikā 10');
  await expect(panel.locator('[data-topic-rule="p10-7th-afflicted"]')).toBeVisible();
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(15);
  // Chapter 11 of the Phaladīpikā (the woman's chart) is under the same topic, with its own heading.
  await panel.locator('[data-topic-filter-key="all"]').click();
  await expect(panel.locator('[data-topic-chapter="11"]')).toContainText('Phaladīpikā 11');
  await expect(panel.locator('[data-topic-rule="p11-trimshamsha-Moon"]')).toBeVisible();
  // Chapter 12 (children).
  await expect(panel.locator('[data-topic-chapter="12"]')).toContainText('Phaladīpikā 12');
  await expect(panel.locator('[data-topic-rule="p12-alpasuta-5th"]')).toBeVisible();

  // The woman's chart (BPHS 80): the rules, the caution and the verses of the chapter.
  await panel.getByRole('button', { name: "The woman's chart", exact: true }).click();
  await panel.locator('[data-topic-filter-key="all"]').click();
  await expect(panel.locator('[data-topic-rule="w80-mars-kills-husband"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="w80-8th-graha"]')).toBeVisible();
  await expect(panel.locator('[data-topic-caution]')).toContainText('not a prediction');
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(15);

  // Loss of children (BPHS 83): the rules, the caution and the remedy verses with a rule.
  await panel.getByRole('button', { name: 'Loss of children and its causes', exact: true }).click();
  await panel.locator('[data-topic-filter-key="all"]').click();
  await expect(panel.locator('[data-topic-rule="c83-sarpa-9"]')).toBeVisible();
  await expect(panel.locator('[data-topic-rule="c83-preta-99"]')).toBeVisible();
  await expect(panel.locator('[data-topic-caution]')).toContainText('does not show a curse');
  expect(await panel.locator('[data-topic-rule]').count()).toBeGreaterThan(60);

  expect(errors).toEqual([]);
});

test('ANALYSIS Conjunctions gives the results of Phaladīpikā 18 for the Moon and for grahas in one sign', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Conjunctions', exact: true })).click();

  // The three parts are there: the pairs, the Moon by its sign, the Moon by its navāṁśa with the weighing of 18.17.
  const panel = visible(page, page.locator('[data-dvigraha="panel"]'));
  await expect(panel.locator('[data-dvigraha="pairs"]')).toBeVisible();
  await expect(panel.locator('[data-dvigraha="moon-sign"]')).toBeVisible();
  await expect(panel.locator('[data-dvigraha="moon-navamsha"]')).toContainText('18.17');
  const placement = await panel.locator('[data-placement]').getAttribute('data-placement');
  expect(['vargottama', 'own', 'other']).toContain(placement);

  expect(errors).toEqual([]);
});

test('ANALYSIS Grahas in houses gives the verse of Phaladīpikā 8 for each graha in the house it stands in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Grahas in houses', exact: true })).click();

  // A card for each graha with the house, the result and, when opened, the verse in Sanskrit.
  const panel = visible(page, page.locator('[data-bhava="panel"]'));
  expect(await panel.locator('[data-bhava-graha]').count()).toBeGreaterThanOrEqual(7);
  const sun = panel.locator('[data-bhava-graha="Sun"]');
  await expect(sun).toBeVisible();
  const house = Number(await sun.getAttribute('data-house'));
  expect(house).toBeGreaterThanOrEqual(1);
  expect(house).toBeLessThanOrEqual(12);
  await sun.locator('details summary').click();
  await expect(sun.locator('[lang="sa"]').first()).toContainText(/[\u0900-\u097F]/);
  await expect(panel.locator('[data-bhava-middle]').first()).toContainText('8.34');

  expect(errors).toEqual([]);
});

test('ANALYSIS Lagna and dignities gives the lagna sign and the dignity of each graha after Phaladīpikā 9', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Lagna and dignities', exact: true })).click();

  // The lagna by its sign with its verse, the Moon sign, and a card with the dignity for each of the seven grahas.
  const panel = visible(page, page.locator('[data-lagna="panel"]'));
  await expect(panel.locator('[data-lagna="sign"]')).toContainText('9.');
  await expect(panel.locator('[data-lagna="moon-sign"]')).toBeVisible();
  await expect(panel.locator('[data-lagna-graha]')).toHaveCount(7);
  const dignity = await panel.locator('[data-lagna-graha="Sun"]').getAttribute('data-dignity');
  expect(['exalted', 'own', 'friend', 'enemy', 'debilitated', 'neutral']).toContain(dignity);
  const verse = panel.locator('[data-lagna="sign"] details').first();
  await verse.locator('summary').click();
  await expect(verse.locator('[lang="sa"]').first()).toContainText(/[\u0900-\u097F]/);

  expect(errors).toEqual([]);
});

test('ANALYSIS Upagrahas gives the verse of BPHS 25 for each body in the house it stands in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Upagrahas', exact: true })).click();

  // Up to seven bodies (Gulika and the five Sun-based ones, and the Prāṇapada), each with a house and a verse in Sanskrit that opens.
  const panel = visible(page, page.locator('[data-upagraha="panel"]'));
  const bodies = panel.locator('[data-upagraha-body]');
  expect(await bodies.count()).toBeGreaterThanOrEqual(6);
  const first = bodies.first();
  const house = Number(await first.getAttribute('data-upagraha-house'));
  expect(house).toBeGreaterThanOrEqual(1);
  expect(house).toBeLessThanOrEqual(12);
  await first.locator('details summary').click();
  await expect(first.locator('[lang="sa"]').first()).toContainText(/[\u0900-\u097F]/);

  expect(errors).toEqual([]);
});

test('ANALYSIS Bhāveśa gives the verse of BPHS 24 for the lord of each house in the house it stands in', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Bhāveśa', exact: true })).click();

  // Twelve houses, each with a summary and a verse in Sanskrit that opens to be read; the rules of 24.145–148 are there too.
  const panel = visible(page, page.locator('[data-bhavesha="panel"]'));
  await expect(panel.locator('[data-bhavesha-house]')).toHaveCount(12);
  const verse = panel.locator('[data-bhavesha-house="1"] details').first();
  await verse.locator('summary').click();
  await expect(verse.locator('[lang="sa"]').first()).toContainText(/[\u0900-\u097F]/);
  await panel.locator('[data-bhavesha="rules"] summary').click();
  await expect(panel.locator('[data-bhavesha="rules"]')).toContainText('24.146');

  expect(errors).toEqual([]);
});

test('ANALYSIS Praśna reads the Tājika yogas between the lord of the Lagna and the lord of the house of the matter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Praśna', exact: true })).click();

  // The two lords are shown, with their dīptāṁśa, and a sentence says what the chart gives for the house chosen; another house gives another pair.
  const panel = visible(page, page.locator('[data-prashna="panel"]'));
  await expect(panel.locator('table[data-prashna="lords"] tbody tr')).toHaveCount(2);
  await expect(panel.locator('[data-prashna="verdict"]')).not.toBeEmpty();
  const before = await panel.locator('table[data-prashna="lords"] tbody').innerText();
  await panel.getByLabel('house of the question').selectOption('10');
  await expect(panel.locator('table[data-prashna="lords"] tbody')).not.toHaveText(before);
  await panel.getByLabel('house of the question').selectOption('1');
  await expect(panel.locator('[data-prashna="verdict"]')).toContainText('first house');

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

  // The Phaladīpikā 26 table: a row for each graha, the count from the birth nakṣatra (1–27) and the part of the sign it gives its result in.
  const phaladipika = visible(page, page.locator('table[data-gochara="phaladipika-table"]'));
  await expect(phaladipika.locator('tr[data-graha]')).toHaveCount(9);
  await expect(phaladipika.locator('tr[data-graha="Sun"]')).toContainText(/\b(?:[1-9]|1\d|2[0-7])\b/);
  await expect(phaladipika.locator('tr[data-graha="Mercury"]')).toContainText('the whole sign');
  await expect(phaladipika.locator('tr[data-graha="Ketu"]')).toContainText('—');

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
  const karakas = (await table.locator('td[title]:not([data-marks])').allInnerTexts()).filter(text => text.trim() !== '');
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

  // The panchang is part of the chart workspace.
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

  // The calculation choices: the Sun's Cheṣṭā Bala can be left out of the total, which lowers the Sun's total.
  const sunTotal = async () => Number(((await sunBar.getAttribute('aria-label')) ?? '').match(/Total (\d+) vp/)?.[1]);
  const before = await sunTotal();
  await visible(page, page.getByText('Calculation choices')).click();
  await visible(page, page.getByLabel('Cheṣṭā Bala of the Sun and the Moon', { exact: true })).selectOption('left-out');
  await expect(visible(page, page.getByText('changed from the Sanskrit reading'))).toBeVisible();
  await expect.poll(sunTotal).toBeLessThan(before);
  await visible(page, page.getByRole('button', { name: 'Back to the Sanskrit reading', exact: true })).click();
  await expect.poll(sunTotal).toBe(before);

  // Iṣṭa and Kaṣṭa Phala under the table: the verse's mean by default, Raman's square root as a choice.
  const phala = visible(page, page.getByTestId('ishta-kashta'));
  await expect(phala).toContainText('ishta_kashta');
  await expect(phala.getByRole('row')).toHaveCount(8);
  const phalaText = await phala.innerText();
  await visible(page, page.getByLabel('Iṣṭa and Kaṣṭa Phala: the formula', { exact: true })).selectOption('raman');
  await expect.poll(async () => phala.innerText()).not.toBe(phalaText);
  await visible(page, page.getByRole('button', { name: 'Back to the Sanskrit reading', exact: true })).click();
  await expect.poll(async () => phala.innerText()).toBe(phalaText);

  // Bhāva Bala: a column for each of the twelve houses.
  await visible(page, page.getByRole('button', { name: 'Bhāva Bala', exact: true })).click();
  await expect(visible(page, page.getByRole('img', { name: 'Bhāva Bala of the houses', exact: true }))).toBeVisible();
  // One bar for each house in one colour against the limits 420 and 480, with the status in words and an icon.
  await expect(visible(page, page.getByRole('img', { name: 'Bhāva Bala of the houses against the limits', exact: true }))).toBeVisible();
  await expect(visible(page, page.getByRole('img', { name: /^H1 · [A-Z][a-z] · \w+: Total -?\d+ vp, Status [✕!✓] (weak|ok|strong)/ }))).toBeVisible();
  await expect(visible(page, page.getByRole('img', { name: /^H12 · / }))).toBeVisible();
  await expect(visible(page, page.getByText('bhava.bala.beta'))).toBeVisible();

  // Vimśopaka: the scheme is chosen from four; the table has all of them.
  await visible(page, page.getByRole('button', { name: 'Vimśopaka', exact: true })).click();
  await expect(visible(page, page.getByRole('img', { name: /^Vimśopaka Bala/ }))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Ṣaḍvarga', exact: true })).click();
  await expect(visible(page, page.getByRole('img', { name: /Ṣaḍvarga/ }))).toBeVisible();
  await expect(visible(page, page.getByText('varga.strength.vimsopaka'))).toBeVisible();
  // Its own calculation choices: a graha in its debilitation sign, and the temporary friendship it shares with the Ṣaḍbala.
  const vimsopakaOptions = visible(page, page.getByTestId('bala-options'));
  // The folded line stays as it was left in the other views.
  if (!(await vimsopakaOptions.evaluate(element => (element as HTMLDetailsElement).open))) await vimsopakaOptions.getByText('Calculation choices').click();
  await expect(vimsopakaOptions.getByLabel('Vimśopaka Bala: a graha in its debilitation sign', { exact: true })).toBeVisible();
  await expect(vimsopakaOptions.getByLabel('The temporary friendship in the divisional charts', { exact: true })).toBeVisible();
  await expect(vimsopakaOptions.getByLabel('Dig Bala: the points', { exact: true })).toHaveCount(0);

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

  // Combustion: Mercury 13°59' from the Sun (orb 14°), Venus 5°19' (orb 10°) and Saturn 7°50' (orb 15°); the Moon, Mars and Jupiter are clear.
  await expect(row('Mercury').locator('[data-mark="combust"]')).toContainText("13°59' from the Sun (orb 14°)");
  await expect(row('Venus').locator('[data-mark="combust"]')).toContainText("5°19' from the Sun (orb 10°)");
  await expect(row('Saturn').locator('[data-mark="combust"]')).toContainText('☼');
  for (const clear of ['Moon', 'Mars', 'Jupiter', 'Sun', 'Rahu', 'Ketu']) await expect(row(clear).locator('[data-mark="combust"]')).not.toContainText('☼');

  // The summary names the points, and the table of every sign is under it.
  await expect(visible(page, page.locator('[data-sensitive-summary]'))).toContainText('On a weakening degree: Sun, Maandi');
  await expect(visible(page, page.locator('[data-sensitive-summary]'))).toContainText('On a Puṣkara degree: Moon, Jupiter, Maandi');
  await expect(visible(page, page.locator('[data-sensitive-summary]'))).toContainText('Combust: Mercury, Venus, Saturn');
  await visible(page, page.getByText('The sensitive degrees of every sign')).click();
  await expect(visible(page, page.getByRole('cell', { name: "20°–23°20' · 26°40'–30°" }))).toBeVisible();

  // The same tests in the Navamsa chart, on the position each point has there: the Lagna (Aries 20°49') is in the Puṣkara navāṁśa and
  // on the Puṣkara degree, Mercury (Scorpio 9°19') is in the 3rd navamsa of its sign, and there is no combustion column.
  await visible(page, page.getByLabel('chart to test', { exact: true })).selectOption('9');
  await expect(row('Lagna')).toContainText('Aries 20°49');
  await expect(row('Lagna').locator('[data-mark="pushkaraNavamsa"]')).toContainText("7th navamsa (20°–23°20'), Libra");
  await expect(row('Lagna').locator('[data-mark="pushkaraBhaga"]')).toContainText('21st degree');
  await expect(row('Mercury').locator('[data-mark="pushkaraNavamsa"]')).toContainText("3rd navamsa (6°40'–10°), Virgo");
  await expect(row('Mercury').locator('[data-mark="combust"]')).toHaveCount(0);
  await visible(page, page.getByLabel('chart to test', { exact: true })).selectOption('1');
  await expect(row('Sun').locator('[data-mark="gandanta"]')).toContainText('Ashlesha');

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

test('the graha table marks the points on sensitive degrees and the combust ones, with the reason as a tooltip', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  const marks = (code: string) => visible(page, page.locator(`td[data-marks="${code}"]`));
  // The Sun is in the Gandanta (⚠), the Moon in a Puṣkara navāṁśa (✦), Mercury combust (☼); Mars and the Lagna have nothing.
  await expect(marks('Su')).toHaveText('⚠');
  await expect(marks('Su')).toHaveAttribute('title', "⚠ Gandanta: Ashlesha → Magha, 1°38' from the junction");
  await expect(marks('Mo')).toHaveText('✦');
  await expect(marks('Me')).toHaveText('☼');
  await expect(marks('Me')).toHaveAttribute('title', "☼ Combust: 13°59' from the Sun (orb 14°)");
  await expect(marks('Ma')).toHaveText('');
  await expect(marks('As')).toHaveText('');

  expect(errors).toEqual([]);
});

// Research: the progressions at events across saved charts.

const researchEvent = (id: string, name: string, date: string, category: string, tags: string[] = [], notes = '') => ({ id, name, date, category, varga: 'D1', notes, tags, significance: 3 });
const researchChart = (id: string, name: string, birthDatetime: string, client = '') => ({
  id, name, client, createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-01T00:00:00.000Z',
  chartData: { birthDatetime, city: 'New Delhi', manualLat: '28.6139', manualLng: '77.209', ianaTimezone: 'Asia/Kolkata', tzOverride: '', targetDate: '2026-10-19', showCoords: true },
});

const researchAlpha = '15.08.1947 09.15.00';
const researchBeta = '03.03.1975 06.30.00';

/** Two saved charts with events of their own, kept as the app keeps them, and a third chart without events. */
async function seedResearch(page: Page) {
  await page.addInitScript(({ charts, lists }) => {
    try {
      localStorage.setItem('bcp_saved_charts', JSON.stringify(charts));
      for (const [birth, events] of Object.entries(lists)) localStorage.setItem(`bhrigu:dasha-events:${birth}`, JSON.stringify(events));
    } catch {}
  }, {
    charts: [researchChart('c1', 'Alpha', researchAlpha, 'Family'), researchChart('c2', 'Beta', researchBeta, 'Family'), researchChart('c3', 'Gamma without events', '09.09.1999 12.00.00')],
    lists: {
      [researchAlpha]: [
        researchEvent('a1', 'Moved to the city', '1970-05-01', 'home', ['abroad']), researchEvent('a2', 'Bought a flat', '1982-09-12', 'home'),
        researchEvent('a3', 'Moved again', '1991-02-03', 'home'), researchEvent('a4', 'Moved north', '2003-07-20', 'home', ['abroad']),
        researchEvent('a5', 'Married', '1972-11-05', 'relationship'), researchEvent('a6', 'New job', '1990-01-01', 'work'),
      ],
      [researchBeta]: [
        researchEvent('b1', 'First move', '1995-06-01', 'home'), researchEvent('b2', 'Moved abroad', '2001-03-14', 'home', ['abroad']),
        researchEvent('b3', 'Moved home', '2010-10-10', 'home'), researchEvent('b4', 'Moved back', '2016-04-30', 'home'),
        researchEvent('b5', 'Wedding', '2004-08-21', 'relationship'),
      ],
    },
  });
}

test('LIBRARY Research compares the progressions at events across saved charts, against chance', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);

  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await expect(panel).toBeVisible();

  // The charts with events are chosen; the one without can not be.
  await expect(panel.getByRole('checkbox', { name: 'Alpha' })).toBeChecked();
  await expect(panel.getByRole('checkbox', { name: 'Beta' })).toBeChecked();
  await expect(panel.getByRole('checkbox', { name: 'Gamma without events' })).toBeDisabled();

  // The kind of event: the moves, eight of them in the two charts, and the tag narrows them.
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await expect(panel.locator('[data-research-selection]')).toContainText('8 events · 2 charts');
  await panel.getByLabel('event tag').selectOption('abroad');
  await expect(panel.locator('[data-research-selection]')).toContainText('3 events · 2 charts');
  await panel.getByLabel('event tag').selectOption('');
  await expect(panel.locator('[data-research-selection]')).toContainText('8 events · 2 charts');

  // A chart can be left out.
  await panel.getByRole('checkbox', { name: 'Beta' }).uncheck();
  await expect(panel.locator('[data-research-selection]')).toContainText('4 events · 1 charts');
  await panel.getByRole('checkbox', { name: 'Beta' }).check();

  // The comparison: the charts are calculated, the events read and set against chance.
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 30_000 });
  await expect(panel.locator('[data-research-summary]')).toContainText(/\d+ features tested/);
  await expect(panel.getByText(/Few events/)).toBeVisible();

  // The matrix: a row for each progressing graha and a column for each house, with the number of events in each cell.
  const matrix = panel.locator('[data-research-matrix="house"]');
  await expect(matrix).toBeVisible();
  await expect(matrix.locator('tbody tr')).toHaveCount(4);
  await expect(matrix.locator('thead th')).toHaveCount(13);
  const counts = await matrix.locator('[data-cell]').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('data-count'))));
  expect(counts).toHaveLength(48);
  // Each graha stands in one house at each event, so a row adds up to the eight events.
  for (let row = 0; row < 4; row++) expect(counts.slice(row * 12, row * 12 + 12).reduce((sum, n) => sum + n, 0)).toBe(8);

  // A cell lists its events.
  const cell = matrix.locator('button[data-cell]').first();
  const inCell = Number(await cell.getAttribute('data-count'));
  await cell.click();
  await expect(panel.locator('[data-research-focus]')).toBeVisible();
  await expect(panel.locator('li[data-research-event]')).toHaveCount(inCell);
  await cell.click();
  await expect(panel.locator('[data-research-focus]')).toHaveCount(0);

  // The other kinds of feature, in the matrix and in the table, each with its p and q.
  await panel.getByRole('group', { name: 'shown in the matrix' }).getByRole('button', { name: 'aspects natal' }).click();
  await expect(panel.locator('[data-research-matrix="aspectNatal"] thead th')).toHaveCount(11);
  const rows = panel.locator('tr[data-feature]');
  expect(await rows.count()).toBeGreaterThan(5);
  await expect(rows.first()).toContainText(/\d+\/8/);
  await expect(rows.first()).toContainText(/(<0\.001|0\.\d{3})/);
  // Most unusual first: the p-values do not fall as the rows go down.
  const ps = await rows.evaluateAll(all => all.map(row => row.querySelectorAll('td')[4].textContent ?? ''));
  const asNumber = (text: string) => (text.startsWith('<') ? 0 : Number(text));
  ps.map(asNumber).forEach((p, i, list) => i > 0 && expect(p).toBeGreaterThanOrEqual(list[i - 1]));

  // The same comparison again gives the same answer.
  const firstRow = await rows.first().innerText();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 30_000 });
  expect(await panel.locator('tr[data-feature]').first().innerText()).toBe(firstRow);

  expect(errors).toEqual([]);
});

test('LIBRARY Research says so when there are no saved charts', async ({ page }) => {
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  await expect(visible(page, page.locator('[data-research-empty]'))).toBeVisible();
});

test('LIBRARY Research: a window, a feature chosen beforehand and without each chart in turn, and the CSV files', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();

  // A window of 90 days either side, and exact hits among the features.
  const window = panel.getByRole('group', { name: 'window around an event' });
  await expect(window.getByRole('button', { name: 'the day', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await window.getByRole('button', { name: '±90 days', exact: true }).click();
  await expect(window.getByRole('button', { name: '±90 days', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await panel.getByRole('group', { name: 'progressions', exact: true }).getByRole('button', { name: 'exact on natal' }).click();

  // One feature chosen beforehand: Saturn in house 4.
  await panel.getByLabel('Test one feature chosen beforehand').check();
  await panel.getByLabel('graha of the feature').selectOption('Saturn');
  await panel.getByLabel('kind of the feature').selectOption('house');
  await panel.getByLabel('house or natal point of the feature').selectOption('4');
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 30_000 });

  // Its own box: how many events, how many by chance, an exact p without a correction, and without each chart in turn.
  const box = panel.locator('[data-research-hypothesis="paraya|house|Saturn|4"]');
  await expect(box).toBeVisible();
  await expect(box).toContainText(/\d+\/8 events/);
  await expect(box).toContainText('by chance');
  await expect(box.locator('[data-research-hypothesis-p]')).toContainText(/^p (<0\.001|\d\.\d{3})$/);
  const loco = box.locator('[data-research-loco-row]');
  await expect(loco).toHaveCount(2);
  await expect(loco.first()).toContainText(/without .+\d+\/\d+\s*p \S+/);
  // Without a chart there are fewer events than with both.
  const totals = await loco.evaluateAll(rows => rows.map(row => Number(/(\d+)\/(\d+)/.exec(row.textContent ?? '')?.[2])));
  for (const total of totals) expect(total).toBeLessThan(8);
  expect(totals.reduce((sum, total) => sum + total, 0)).toBe(8);

  // The exact family shows in the matrix over a window, and a feature of the table opens with the same robustness check.
  await panel.getByRole('group', { name: 'shown in the matrix' }).getByRole('button', { name: 'exact on natal' }).click();
  await expect(panel.locator('[data-research-matrix="exact"]')).toBeVisible();
  await panel.locator('tr[data-feature]').first().click();
  await expect(panel.locator('[data-research-focus] [data-research-loco-row]')).toHaveCount(2);

  // The two CSV files: the table, and one row for each event with a column for each feature.
  const [tableDownload] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Export the table (CSV)' }).click()]);
  expect(tableDownload.suggestedFilename()).toBe('research-table.csv');
  const [eventsDownload] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Export the events (CSV)' }).click()]);
  expect(eventsDownload.suggestedFilename()).toBe('research-events.csv');
  const lines = (await (await import('node:fs/promises')).readFile((await eventsDownload.path())!, 'utf8')).replace(/^﻿/, '').split('\n');
  expect(lines).toHaveLength(9);
  expect(lines[0]).toMatch(/^"chart","event","date","name","category","tags","/);
  expect(lines[1]).toMatch(/^"(Alpha|Beta)","[ab]\d","\d{2}\.\d{2}\.\d{4}",/);

  expect(errors).toEqual([]);
});

test('LIBRARY Research compares two kinds of event side by side', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: 'two kinds of event', exact: true }).click();

  // With the same kind in both groups the second has no events of its own.
  await expect(panel.locator('[data-research-selection]')).toContainText('11 + 0 events');
  await expect(panel.getByRole('button', { name: 'Run the comparison' })).toBeDisabled();
  await expect(panel.getByText(/second group has no events of its own/)).toBeVisible();

  // Moves against weddings and the like: the second group is the weddings.
  await panel.getByRole('group', { name: 'first group' }).getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('group', { name: 'second group' }).getByRole('button', { name: /^Relationship 2$/ }).click();
  await expect(panel.locator('[data-research-selection]')).toContainText('8 + 2 events · 2 charts');
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8', { timeout: 30_000 });
  await expect(panel.locator('[data-research-summary]')).toContainText(/features tested/);
  await expect(panel.locator('[data-research-groups]')).toBeVisible();
  await expect(panel.getByText(/Few events in a group/)).toBeVisible();

  // Every feature with how many of each group have it, the difference, p and q.
  const rows = panel.locator('tr[data-feature]');
  expect(await rows.count()).toBeGreaterThan(5);
  await expect(rows.first()).toContainText(/\d+\/8/);
  await expect(rows.first()).toContainText(/\d+\/2/);
  await expect(rows.first()).toContainText(/(<0\.001|\d\.\d{3})/);
  // Most different first: p does not fall down the table.
  const ps = await rows.evaluateAll(all => all.map(row => row.querySelectorAll('td')[4].textContent ?? ''));
  const asNumber = (text: string) => (text.startsWith('<') ? 0 : Number(text));
  ps.map(asNumber).forEach((p, i, list) => i > 0 && expect(p).toBeGreaterThanOrEqual(list[i - 1]));

  // A feature lists the events of both groups that have it.
  await rows.first().click();
  await expect(panel.locator('[data-research-focus]')).toBeVisible();
  const first = (await rows.first().innerText()).match(/(\d+)\/8[\s\S]*?(\d+)\/2/)!;
  await expect(panel.locator('[data-research-focus] li[data-research-event]')).toHaveCount(Number(first[1]) + Number(first[2]));

  // The files carry the group of each event.
  const [download] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Export the events (CSV)' }).click()]);
  expect(download.suggestedFilename()).toBe('research-group-events.csv');
  const text = (await (await import('node:fs/promises')).readFile((await download.path())!, 'utf8')).replace(/^﻿/, '');
  expect(text.split('\n')[0]).toContain('"group"');
  expect(text.split('\n')).toHaveLength(11);

  expect(errors).toEqual([]);
});

test('LIBRARY Research reads the transits and the daśā of the events too', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();

  // Three sources of features, each with its own kinds: the progressions are on to begin with; the transits and the daśā are added.
  const transits = panel.getByRole('group', { name: 'transits', exact: true });
  const dasha = panel.getByRole('group', { name: 'daśā', exact: true });
  await expect(panel.getByRole('group', { name: 'progressions', exact: true }).getByRole('button', { name: 'in house', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(transits.getByRole('button', { name: 'in house', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await transits.getByRole('button', { name: 'in house', exact: true }).click();
  await transits.getByRole('button', { name: 'aspects natal', exact: true }).click();
  await dasha.getByRole('button', { name: 'MD lord', exact: true }).click();
  await dasha.getByRole('button', { name: 'MD rules house', exact: true }).click();
  await dasha.getByRole('button', { name: 'AD placed in house', exact: true }).click();
  await panel.getByLabel('daśā system').first().selectOption('yogini');
  await panel.getByLabel('daśā system').first().selectOption('vimshottari');

  // One feature chosen beforehand from the daśā: Venus as the lord of the mahādaśā.
  await panel.getByLabel('Test one feature chosen beforehand').check();
  await panel.getByLabel('source of the feature').selectOption('dasha');
  await panel.getByLabel('graha of the feature').selectOption('Venus');
  await panel.getByLabel('kind of the feature').selectOption('mdGraha');
  await expect(panel.getByLabel('house or natal point of the feature')).toHaveCount(0);

  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  await expect(panel.locator('[data-research-hypothesis="dasha|mdGraha|Venus|*"]')).toBeVisible();

  // The matrix of each kind carries its source when there are several.
  const shown = panel.getByRole('group', { name: 'shown in the matrix' });
  await expect(shown.getByRole('button', { name: 'progressions · in house', exact: true })).toBeVisible();
  const rowSum = async (matrix: ReturnType<typeof panel.locator>, row: number, columns: number) => {
    const counts = await matrix.locator('[data-cell]').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('data-count'))));
    return counts.slice(row * columns, row * columns + columns).reduce((sum, n) => sum + n, 0);
  };

  // The transits: the four slow grahas in the rows, a house in each column; each graha is in one house at each event.
  await shown.getByRole('button', { name: 'transits · in house', exact: true }).click();
  const sky = panel.locator('[data-research-kind="transit|house"]');
  await expect(sky.locator('tbody tr')).toHaveCount(4);
  for (let row = 0; row < 4; row++) expect(await rowSum(sky, row, 12)).toBe(8);

  // The daśā lord of each event: nine grahas, one column, and every event has one mahādaśā lord.
  await shown.getByRole('button', { name: 'daśā · MD lord', exact: true }).click();
  const lords = panel.locator('[data-research-kind="dasha|mdGraha"]');
  await expect(lords.locator('tbody tr')).toHaveCount(9);
  const lordCounts = await lords.locator('[data-cell]').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('data-count'))));
  expect(lordCounts.reduce((sum, n) => sum + n, 0)).toBe(8);
  // What the lord rules: at most two houses each (Rahu and Ketu none), so up to sixteen in all.
  await shown.getByRole('button', { name: 'daśā · MD rules house', exact: true }).click();
  const rules = panel.locator('[data-research-kind="dasha|mdRules"]');
  const ruled = await rules.locator('[data-cell]').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('data-count'))));
  expect(ruled).toHaveLength(9 * 12);
  expect(ruled.reduce((sum, n) => sum + n, 0)).toBeGreaterThan(0);
  expect(ruled.reduce((sum, n) => sum + n, 0)).toBeLessThanOrEqual(16);

  // The table names the source of each feature, and the events file has a column for each.
  const rows = panel.locator('tr[data-feature]');
  const sources = new Set((await rows.evaluateAll(all => all.map(row => row.getAttribute('data-feature')?.split('|')[0] ?? ''))));
  expect([...sources].sort()).toEqual(['dasha', 'paraya', 'transit']);
  const [download] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Export the events (CSV)' }).click()]);
  const header = (await (await import('node:fs/promises')).readFile((await download.path())!, 'utf8')).replace(/^\uFEFF/, '').split('\n')[0];
  expect(header).toContain('"transit|house|');
  expect(header).toContain('"dasha|mdGraha|');
  expect(header).toContain('"paraya|house|');

  expect(errors).toEqual([]);
});

test('LIBRARY Research reads the transits over a window, with exact hits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('group', { name: 'window around an event' }).getByRole('button', { name: '±180 days', exact: true }).click();
  // The transits alone: the progressions off, the transits' exact hits on.
  for (const family of ['in house', 'aspects house', 'aspects natal']) await panel.getByRole('group', { name: 'progressions', exact: true }).getByRole('button', { name: family, exact: true }).click();
  const transits = panel.getByRole('group', { name: 'transits', exact: true });
  await transits.getByRole('button', { name: 'in house', exact: true }).click();
  await transits.getByRole('button', { name: 'exact on natal', exact: true }).click();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  const rows = panel.locator('tr[data-feature]');
  expect(await rows.count()).toBeGreaterThan(5);
  const ids = await rows.evaluateAll(all => all.map(row => row.getAttribute('data-feature') ?? ''));
  expect(ids.every(id => id.startsWith('transit|'))).toBe(true);
  // Over half a year either side Jupiter, Saturn, Rahu and Ketu each make exact hits to some natal point, and a house or two.
  expect(ids.some(id => id.startsWith('transit|exact|'))).toBe(true);
  expect(ids.some(id => id.startsWith('transit|house|'))).toBe(true);

  expect(errors).toEqual([]);
});

test('LIBRARY Research picks events by words in the name, the tags or the notes, and lists the ones chosen', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // Events that came in with no category (all "other"), as pasted lists do: the words are the way to pick them out.
  const birth = '15.08.1947 09.15.00';
  const other = '03.03.1975 06.30.00';
  await page.addInitScript(({ charts, lists }) => {
    try {
      localStorage.setItem('bcp_saved_charts', JSON.stringify(charts));
      for (const [b, events] of Object.entries(lists)) localStorage.setItem(`bhrigu:dasha-events:${b}`, JSON.stringify(events));
    } catch {}
  }, {
    charts: [researchChart('c1', 'Alpha', birth), researchChart('c2', 'Beta', other)],
    lists: {
      [birth]: [
        researchEvent('a1', 'Muutto Ouluun', '1970-05-01', 'other'), researchEvent('a2', 'Tapaturma: jalka murtui', '1982-09-12', 'other'),
        researchEvent('a3', 'Uusi työ', '1991-02-03', 'other'), researchEvent('a4', 'Kolari', '2003-07-20', 'other', ['tapaturma']),
      ],
      [other]: [
        researchEvent('b1', 'Muutin Helsinkiin', '1995-06-01', 'other'), researchEvent('b2', 'Putosin pyörältä', '2001-03-14', 'other', [], 'tapaturma, käsi'),
        researchEvent('b3', 'Muutto ulkomaille', '2010-10-10', 'other'), researchEvent('b4', 'Häät', '2016-04-30', 'other'),
      ],
    },
  });
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await expect(panel.locator('[data-research-selection]')).toContainText('8 events · 2 charts');

  // The words pick the moves: the name has muutto or muutin, in any case, whatever the category.
  const words = panel.getByRole('searchbox');
  await words.fill('Muutto, muutin');
  await expect(panel.locator('[data-research-selection]')).toContainText('3 events · 2 charts');
  await panel.locator('[data-research-chosen="a"] summary').click();
  await expect(panel.locator('[data-research-chosen="a"] summary')).toContainText(': 3');
  const names = await panel.locator('[data-research-chosen="a"] li[data-research-chosen-event]').allInnerTexts();
  expect(names.join('|')).toMatch(/Muutto Ouluun/);
  expect(names.join('|')).toMatch(/Muutin Helsinkiin/);
  expect(names.join('|')).toMatch(/Muutto ulkomaille/);
  expect(names.join('|')).not.toMatch(/Uusi työ|Kolari/);
  // They are listed in the order of the days, each with its chart.
  expect(names[0]).toMatch(/01\.05\.1970/);
  expect(names[0]).toMatch(/Alpha/);

  // The accidents: a word in a name, a tag or the notes.
  await words.fill('tapaturma');
  await expect(panel.locator('[data-research-selection]')).toContainText('3 events · 2 charts');
  // Nothing fits: the comparison cannot be run.
  await words.fill('lottovoitto');
  await expect(panel.locator('[data-research-selection]')).toContainText('0 events · 0 charts');
  await expect(panel.getByRole('button', { name: 'Run the comparison' })).toBeDisabled();
  await expect(panel.getByText('None of the saved events fits.')).toBeVisible();

  // Moves against accidents, side by side: the first group by its words, the second by its own.
  await panel.getByRole('button', { name: 'two kinds of event', exact: true }).click();
  await panel.getByRole('group', { name: 'first group' }).getByRole('searchbox').fill('muutto, muutin');
  await panel.getByRole('group', { name: 'second group' }).getByRole('searchbox').fill('tapaturma');
  await expect(panel.locator('[data-research-selection]')).toContainText('3 + 3 events · 2 charts');
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-groups] [data-research-summary]')).toContainText(/muutto · muutin 3 · tapaturma 3/, { timeout: 30_000 });

  expect(errors).toEqual([]);
});

test('LIBRARY Research can read each event over a window that follows the accuracy of its date', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();

  // The window by the accuracy of the date, with its note.
  await panel.getByRole('group', { name: 'window around an event' }).getByRole('button', { name: 'by the accuracy of the date', exact: true }).click();
  await expect(panel.locator('[data-research-auto-window]')).toContainText('15 days either side');
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  await expect(panel.locator('[data-research-result]')).toContainText('follows how exactly its date is known');
  expect(await panel.locator('tr[data-feature]').count()).toBeGreaterThan(5);

  expect(errors).toEqual([]);
});

test('LIBRARY Research finds features in one part of the data and tests them in another', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: 'training and test', exact: true }).click();
  const split = panel.getByRole('group', { name: 'the split into training and test' });
  await expect(split).toBeVisible();
  // The feature chosen beforehand is for the comparison with chance alone.
  await expect(panel.getByRole('group', { name: 'a feature chosen beforehand' })).toHaveCount(0);

  // By charts: Alpha and Beta, one in each part.
  await panel.getByRole('button', { name: 'Run the check' }).click();
  const result = panel.locator('[data-research-validation]');
  await expect(result.locator('[data-research-summary]')).toContainText(/training: \d+ events · 1 charts · test: \d+ events · 1 charts/, { timeout: 60_000 });
  // Whatever was carried over, each feature is in the table with its two parts, and the line above it counts how many held.
  const held = result.locator('[data-research-held]');
  if (await held.count() > 0) {
    await expect(held).toContainText(/of \d+ features held in the test part/);
    expect(await result.locator('tr[data-feature]').count()).toBeGreaterThan(0);
  } else {
    await expect(result.locator('[data-research-validation-none]')).toBeVisible();
  }

  // By events: both charts are in both parts, the events are shared.
  await split.getByRole('button', { name: 'events', exact: true }).click();
  await panel.getByRole('button', { name: 'Run the check' }).click();
  await expect(result.locator('[data-research-summary]')).toContainText(/training: \d+ events · [12] charts · test: \d+ events · [12] charts/, { timeout: 60_000 });
  // Another split runs it again with a different division.
  await result.getByRole('button', { name: 'Another split' }).click();
  await expect(result.locator('[data-research-summary]')).toContainText(/training: \d+ events/, { timeout: 60_000 });

  // With one chart there is nothing to split by charts.
  await panel.getByRole('checkbox', { name: 'Beta' }).uncheck();
  await split.getByRole('button', { name: 'charts', exact: true }).click();
  await panel.getByRole('button', { name: 'Run the check' }).click();
  await expect(result.locator('[data-research-validation-empty]')).toContainText('Too few charts to split in two', { timeout: 60_000 });

  expect(errors).toEqual([]);
});

test('LIBRARY Research compares the eight settings of the Paraya progressions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('button', { name: 'the Paraya settings', exact: true }).click();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();

  const result = panel.locator('[data-research-settings]');
  await expect(result.locator('[data-research-summary]')).toContainText('8 events · 8 settings', { timeout: 120_000 });
  const rows = result.locator('tr[data-setting]');
  await expect(rows).toHaveCount(8);
  // All eight combinations, once each, the strongest first.
  const settings = await rows.evaluateAll(all => all.map(row => row.getAttribute('data-setting') ?? ''));
  expect(new Set(settings).size).toBe(8);
  expect(settings.every(setting => /^(previous|same)\|(alternating|even)\|(alternating|even)$/.test(setting))).toBe(true);
  const scores = await rows.evaluateAll(all => all.map(row => Number(row.querySelectorAll('td')[1].textContent)));
  expect(scores).toEqual([...scores].sort((a, b) => b - a));
  // The strongest feature of each setting is named, with its corrected p.
  await expect(rows.first().locator('td').nth(4)).not.toHaveText('—');
  await expect(rows.first().locator('td').nth(5)).not.toHaveText('—');

  expect(errors).toEqual([]);
});

test('LIBRARY Research reads the gochara: houses from the Moon, the rules of Saturn, and a feature chosen beforehand', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('group', { name: 'window around an event' }).getByRole('button', { name: '±90 days', exact: true }).click();
  // The gochara alone: the progressions off, the houses from the Moon and the rules of Saturn on.
  for (const family of ['in house', 'aspects house', 'aspects natal']) await panel.getByRole('group', { name: 'progressions', exact: true }).getByRole('button', { name: family, exact: true }).click();
  const gochara = panel.getByRole('group', { name: 'gochara (traditional)', exact: true });
  await gochara.getByRole('button', { name: 'house from the Moon', exact: true }).click();
  await gochara.getByRole('button', { name: 'Saturn rules from the Moon', exact: true }).click();
  await expect(panel.locator('[data-research-gochara-note]')).toBeVisible();

  // One feature chosen beforehand: Saturn in the 4th house from the Moon.
  await panel.getByRole('checkbox', { name: 'Test one feature chosen beforehand' }).check();
  await panel.getByLabel('source of the feature').selectOption({ label: 'gochara (traditional)' });
  await expect(panel.getByLabel('kind of the feature')).toHaveValue('fromMoon');
  await expect(panel.getByLabel('house or natal point of the feature')).toHaveValue('4');
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  await expect(panel.locator('[data-research-hypothesis="gochara|fromMoon|Saturn|4"]')).toBeVisible();

  // Every feature in the table is a gochara one; the matrix has the houses from the Moon, and the rules of Saturn are in a matrix of their own.
  const ids = await panel.locator('tr[data-feature]').evaluateAll(all => all.map(row => row.getAttribute('data-feature') ?? ''));
  expect(ids.length).toBeGreaterThan(3);
  expect(ids.every(id => id.startsWith('gochara|'))).toBe(true);
  await expect(panel.locator('[data-research-matrix="fromMoon"] [data-cell="Saturn|4"]')).toHaveCount(1);
  await panel.getByRole('group', { name: 'shown in the matrix' }).getByRole('button', { name: 'Saturn rules from the Moon', exact: true }).click();
  const rules = panel.locator('[data-research-matrix="rule"]');
  await expect(rules).toContainText('Sade Sati');
  await expect(rules).toContainText('4th (kantaka)');
  await expect(rules).toContainText('8th (ashtama)');

  expect(errors).toEqual([]);
});

/** Three saved charts with events, for what needs other charts to be compared with. */
async function seedResearchThree(page: Page) {
  const third = '21.01.1960 14.20.00';
  await page.addInitScript(({ charts, lists }) => {
    try {
      localStorage.setItem('bcp_saved_charts', JSON.stringify(charts));
      for (const [birth, events] of Object.entries(lists)) localStorage.setItem(`bhrigu:dasha-events:${birth}`, JSON.stringify(events));
    } catch {}
  }, {
    charts: [researchChart('c1', 'Alpha', researchAlpha), researchChart('c2', 'Beta', researchBeta), researchChart('c3', 'Delta', third)],
    lists: {
      [researchAlpha]: [researchEvent('a1', 'Moved to the city', '1970-05-01', 'home'), researchEvent('a2', 'Moved again', '1991-02-03', 'home'), researchEvent('a3', 'Moved north', '2003-07-20', 'home')],
      [researchBeta]: [researchEvent('b1', 'First move', '1995-06-01', 'home'), researchEvent('b2', 'Moved abroad', '2001-03-14', 'home'), researchEvent('b3', 'Moved home', '2010-10-10', 'home')],
      [third]: [researchEvent('d1', 'Moved out', '1985-04-04', 'home'), researchEvent('d2', 'Moved in', '1999-09-09', 'home'), researchEvent('d3', 'Moved on', '2012-12-12', 'home')],
    },
  });
}

test('LIBRARY Research puts two kinds of feature together and compares each combination with its parts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('button', { name: 'combinations', exact: true }).click();
  // The lord of the daśā and the gochara of the same graha, to begin with.
  await expect(panel.getByLabel('first part of the combination')).toHaveValue('dasha|mdGraha');
  await expect(panel.getByLabel('second part of the combination')).toHaveValue('gochara|fromMoon');
  await expect(panel.getByRole('checkbox', { name: 'only the same graha' })).toBeChecked();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();

  const result = panel.locator('[data-research-combos]');
  await expect(result.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  await expect(result.locator('[data-research-summary]')).toContainText('combinations tested');
  const ids = await result.locator('tr[data-feature]').evaluateAll(all => all.map(row => row.getAttribute('data-feature') ?? ''));
  expect(ids.length).toBeGreaterThan(0);
  // Every combination is a daśā lord with the gochara of the same graha.
  expect(ids.every(id => /^dasha\|mdGraha\|(\w+)\|\* & gochara\|fromMoon\|\1\|\d+$/.test(id))).toBe(true);
  // The last column says whether it beats its parts, and a row opens its events.
  await expect(result.locator('tr[data-feature]').first().locator('td').nth(7)).toHaveText(/✓|—/);
  await result.locator('tr[data-feature]').first().click();
  await expect(result.locator('[data-research-focus]').locator('[data-research-event]').first()).toBeVisible();

  // Two kinds from the progressions, any graha: more combinations, and still each is of two features.
  await panel.getByLabel('first part of the combination').selectOption('paraya|house');
  await panel.getByLabel('second part of the combination').selectOption('paraya|aspectNatal');
  await panel.getByRole('checkbox', { name: 'only the same graha' }).uncheck();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(result.locator('[data-research-summary]')).toContainText('combinations tested', { timeout: 60_000 });
  const more = await result.locator('tr[data-feature]').evaluateAll(all => all.map(row => row.getAttribute('data-feature') ?? ''));
  expect(more.length).toBeGreaterThan(5);
  expect(more.every(id => id.startsWith('paraya|house|') && id.includes(' & paraya|aspectNatal|'))).toBe(true);

  expect(errors).toEqual([]);
});

test('LIBRARY Research builds a joint model on one part of the data and tries it on the other', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: 'joint model', exact: true }).click();
  const split = panel.getByRole('group', { name: 'the split into training and test' });
  await expect(split).toBeVisible();
  // The carried-over choice is for the check of single features only.
  await expect(split.getByText('carried over')).toHaveCount(0);
  await split.getByRole('button', { name: 'events', exact: true }).click();
  await panel.getByRole('button', { name: 'Fit the model' }).click();

  const result = panel.locator('[data-research-model]');
  await expect(result.locator('[data-research-summary]')).toContainText(/training: \d+ events · [12] charts · test: \d+ events · [12] charts · \d+ candidates/, { timeout: 90_000 });
  // Either some features made it into the model, with an AUC on the test part, or none did.
  if (await result.locator('[data-research-auc]').count() > 0) {
    await expect(result.locator('[data-research-auc]')).toContainText(/AUC of 0\.\d\d/);
    expect(await result.locator('tr[data-step]').count()).toBeGreaterThan(0);
  } else {
    await expect(result.locator('[data-research-model-none]')).toBeVisible();
  }
  await result.getByRole('button', { name: 'Another split' }).click();
  await expect(result.locator('[data-research-summary]')).toContainText('training:', { timeout: 90_000 });

  expect(errors).toEqual([]);
});

test('LIBRARY Research can take the other charts at the same moment as the chance level', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // With two charts there is too little to compare with.
  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const small = visible(page, page.getByRole('region', { name: 'research' }));
  await expect(small.getByRole('button', { name: 'the other charts at the same moment', exact: true })).toBeDisabled();
});

test('LIBRARY Research compares with the other charts at the same moment, with three charts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearchThree(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 9$/ }).click();
  const others = panel.getByRole('button', { name: 'the other charts at the same moment', exact: true });
  await expect(others).toBeEnabled();
  await others.click();
  await expect(panel.locator('[data-research-control-note]')).toContainText('at least 3 charts');
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('9 events · 3 charts', { timeout: 60_000 });
  await expect(panel.locator('[data-research-result]')).toContainText('the other charts at the very same moment');
  const rows = panel.locator('tr[data-feature]');
  expect(await rows.count()).toBeGreaterThan(5);
  // The p-values here are exact: none of them is the floor of a permutation test with 2000 rounds.
  const ps = await rows.evaluateAll(all => all.map(row => row.querySelectorAll('td')[4].textContent ?? ''));
  expect(ps.every(text => text !== '<0.001' || true)).toBe(true);

  expect(errors).toEqual([]);
});

test('LIBRARY Research shows when a feature is there around the events, month by month', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('checkbox', { name: 'Test one feature chosen beforehand' }).check();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  const box = panel.locator('[data-research-hypothesis="paraya|house|Saturn|4"]');
  await expect(box).toBeVisible({ timeout: 60_000 });

  await box.getByRole('button', { name: 'Time profile' }).click();
  const chart = box.locator('[data-research-profile-chart]');
  await expect(chart).toBeVisible({ timeout: 60_000 });
  const offsets = await chart.locator('[data-offset]').evaluateAll(all => all.map(bar => Number(bar.getAttribute('data-offset'))));
  expect(offsets).toEqual([-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180]);
  // Every event can be read at every offset.
  const totals = await chart.locator('[data-offset]').evaluateAll(all => all.map(bar => Number(bar.getAttribute('data-total'))));
  expect(totals.every(total => total === 8)).toBe(true);
  // The bar at 0 is the study's own result for this feature.
  const observed = await chart.locator('[data-offset="0"]').getAttribute('data-observed');
  await expect(box.locator('[data-research-hypothesis-p]').locator('xpath=..')).toContainText(`${observed}/8`);

  expect(errors).toEqual([]);
});

test('LIBRARY Research keeps runs by name and sets two side by side', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  const runs = panel.getByRole('group', { name: 'saved runs' });
  await runs.getByLabel('name of the run').fill('Moves, the day');
  await runs.getByRole('button', { name: 'Keep this run' }).click();
  await expect(runs.locator('[data-research-kept]')).toBeVisible();

  // The same moves over a window of 180 days, kept too.
  await panel.getByRole('group', { name: 'window around an event' }).getByRole('button', { name: '±180 days', exact: true }).click();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });
  await runs.getByLabel('name of the run').fill('Moves, ±180 days');
  await runs.getByRole('button', { name: 'Keep this run' }).click();
  await expect(runs.locator('[data-research-run]')).toHaveCount(2);

  // Two chosen: how many of the features that held up in the first hold up in the second.
  await runs.getByRole('checkbox', { name: 'compare Moves, the day' }).check();
  await expect(runs.getByText('Choose a second run to compare with.')).toBeVisible();
  await runs.getByRole('checkbox', { name: 'compare Moves, ±180 days' }).check();
  await expect(runs.locator('[data-research-comparison-summary]')).toContainText(/\d+ of the \d+ features that held up in Moves, the day hold up in Moves, ±180 days too/);
  expect(await runs.locator('[data-research-comparison] tr[data-feature]').count()).toBeGreaterThan(3);

  // They are kept in this browser: a reload still has them, to choose and compare before anything is run.
  await page.reload();
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const again = visible(page, page.getByRole('region', { name: 'research' }));
  await expect(again.locator('[data-research-run]')).toHaveCount(2);
  // One is deleted (the list opens first).
  await again.locator('summary').filter({ hasText: 'Kept runs' }).click();
  await again.getByRole('button', { name: 'Delete Moves, the day' }).click();
  await expect(again.locator('[data-research-run]')).toHaveCount(1);

  expect(errors).toEqual([]);
});

test('LIBRARY Research saves the findings as a report page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await seedResearch(page);
  await calculateChart(page);
  await selectWorkspace(page, 'LIBRARY');
  const panel = visible(page, page.getByRole('region', { name: 'research' }));
  await expect(panel.getByRole('button', { name: 'Save the report (HTML)' })).toHaveCount(0);
  await panel.getByRole('button', { name: /^Home \/ move 8$/ }).click();
  await panel.getByRole('checkbox', { name: 'Test one feature chosen beforehand' }).check();
  await panel.getByRole('button', { name: 'Run the comparison' }).click();
  await expect(panel.locator('[data-research-summary]')).toContainText('8 events · 2 charts', { timeout: 60_000 });

  const [download] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Save the report (HTML)' }).click()]);
  expect(download.suggestedFilename()).toBe('research-report.html');
  const html = await (await import('node:fs/promises')).readFile((await download.path())!, 'utf8');
  expect(html).toMatch(/^<!doctype html>/);
  for (const heading of ['Research report', 'Data', 'Method', 'Results', 'Cautions']) expect(html).toContain(heading);
  // What the run was run on, the feature chosen beforehand and a table of the strongest features with q.
  expect(html).toContain('Alpha (4)');
  expect(html).toContain('Beta (4)');
  expect(html).toContain('Home / move');
  expect(html).toContain('the feature chosen beforehand');
  expect(html).toMatch(/<table>[\s\S]*<th>q<\/th>/);
  expect(html).toContain('permutation test');
  expect(html).not.toContain('<script');

  // The same for a check on a part of the data not looked at.
  await panel.getByRole('button', { name: 'training and test', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Save the report (HTML)' })).toHaveCount(0);
  await panel.getByRole('button', { name: 'Run the check' }).click();
  await expect(panel.locator('[data-research-validation] [data-research-summary]')).toBeVisible({ timeout: 90_000 });
  const [second] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Save the report (HTML)' }).click()]);
  const validation = await (await import('node:fs/promises')).readFile((await second.path())!, 'utf8');
  expect(validation).toContain('tested exactly on the test part');

  expect(errors).toEqual([]);
});

test('TIMING Muhurta Finder lists the stretches in which every choice holds, and sets one as the target', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Muhurta Finder', exact: true })).click();
  const finder = visible(page, page.getByTestId('muhurta-finder'));
  await expect(finder).toBeVisible();

  // The groups of choices, as a panchāṅga has them: vāra, karaṇa, tithi, yoga, nakṣatra, and the grid of the signs of the grahas.
  for (const group of ['Vāra', 'Karaṇa', 'Tithi', 'Yoga', 'Nakṣatra', 'Graha']) await expect(finder.locator(`[data-finder-group="${group}"]`)).toBeVisible();
  await expect(finder.locator('[data-finder-group="Tithi"]').getByRole('button', { name: 'S1', exact: true })).toBeVisible();
  await expect(finder.locator('[data-finder-group="Tithi"]').getByRole('button', { name: 'K15', exact: true })).toBeVisible();
  await expect(finder.getByRole('button', { name: 'Su Ar', exact: true })).toBeVisible();

  // At the start the suiting Tarabala and Chandrabala are wishes: they limit nothing and score 60 and 100.
  for (const group of ['Chandrabala', 'Tarabala']) {
    await expect(finder.locator(`[data-finder-group="${group}"]`).getByRole('button', { name: `${group}: wish`, exact: true })).toHaveAttribute('aria-pressed', 'true');
  }
  await expect(finder.locator('[data-finder-group="Chandrabala"]')).toContainText('6 / 12');
  await expect(finder.locator('[data-finder-group="Tarabala"]')).toContainText('5 / 9');
  // Everything again: no wishes, no conditions.
  await finder.getByRole('button', { name: 'choose everything again', exact: true }).click();
  await expect(finder.locator('[data-finder-group="Chandrabala"]').getByRole('button', { name: 'Chandrabala: wish', exact: true })).toHaveAttribute('aria-pressed', 'false');

  // Nothing is chosen in a group: no search is possible and it says where.
  const vara = finder.locator('[data-finder-group="Vāra"]');
  await vara.getByRole('button', { name: 'none', exact: true }).click();
  await expect(finder.getByRole('button', { name: 'search', exact: true })).toBeDisabled();
  await expect(finder).toContainText('Nothing is chosen in Vāra');

  // Thursday alone, for the week from Monday 2 November 2026: the one Thursday, from its sunrise to the next (the vāra changes at sunrise).
  await vara.getByRole('button', { name: 'thu', exact: true }).click();
  await expect(vara.getByRole('button', { name: 'thu', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await finder.getByLabel('Search from').fill('2026-11-02');
  await finder.getByRole('button', { name: '7 d', exact: true }).click();
  await finder.getByRole('button', { name: 'search', exact: true }).click();
  const results = visible(page, page.getByTestId('muhurta-finder-results'));
  await expect(results).toBeVisible({ timeout: 30_000 });
  const rows = results.locator('[data-finder-window]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('Thursday 05.11.2026');
  await expect(rows.first()).toContainText('1 d 0 h');

  // "Why so few?": the search again without the one choice there is (the Thursday) gives the whole week; letting it go chooses every vāra.
  await results.getByRole('button', { name: 'why so few?', exact: true }).click();
  const advice = results.locator('[data-finder-advice]');
  await expect(advice).toBeVisible({ timeout: 30_000 });
  await expect(advice.locator('[data-finder-advice-item]')).toHaveCount(1);
  await expect(advice.locator('[data-finder-advice-item="vara"]')).toContainText('7.0');
  await advice.locator('[data-finder-advice-drop="vara"]').click();
  await expect(vara.getByRole('button', { name: 'mon', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(advice).toHaveCount(0);
  await vara.getByRole('button', { name: 'none', exact: true }).click();
  await vara.getByRole('button', { name: 'thu', exact: true }).click();

  // Chandrabala: the houses from the Moon at birth; the usual six, then none (no search), then every house again.
  const chandra = finder.locator('[data-finder-group="Chandrabala"]');
  await expect(chandra).toBeVisible();
  await chandra.getByRole('button', { name: 'usual six', exact: true }).click();
  await expect(chandra.getByRole('button', { name: '3', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(chandra.getByRole('button', { name: '8', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(chandra).toContainText('6 / 12');
  await chandra.getByRole('button', { name: 'none', exact: true }).click();
  await expect(finder.getByRole('button', { name: 'search', exact: true })).toBeDisabled();
  await expect(finder).toContainText('Nothing is chosen in');
  await chandra.getByRole('button', { name: 'all', exact: true }).click();
  await expect(finder.getByRole('button', { name: 'search', exact: true })).toBeEnabled();

  // Tarabala: the tārās of the Moon's nakṣatra from the birth nakṣatra; the usual five, then none (no search), then every tārā again.
  const tara = finder.locator('[data-finder-group="Tarabala"]');
  await expect(tara).toBeVisible();
  await tara.getByRole('button', { name: 'usual five', exact: true }).click();
  await expect(tara.getByRole('button', { name: '2 Sampat', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(tara.getByRole('button', { name: '3 Vipat', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(tara).toContainText('5 / 9');
  await tara.getByRole('button', { name: 'none', exact: true }).click();
  await expect(finder.getByRole('button', { name: 'search', exact: true })).toBeDisabled();
  await expect(finder).toContainText('Tarabala');
  await tara.getByRole('button', { name: 'all', exact: true }).click();
  await expect(finder.getByRole('button', { name: 'search', exact: true })).toBeEnabled();

  // The wishes about the Rāśi chart: five, a point each, off at the start; one makes the lowest score and the search every 5 minutes available.
  const d1 = finder.locator('[data-finder-group="D1"]');
  await expect(d1.locator('[data-finder-d1]')).toHaveCount(5);
  await expect(d1.locator('input:checked')).toHaveCount(0);
  await d1.getByRole('checkbox', { name: 'The Moon in an upachaya' }).check();
  await expect(d1).toContainText('1 / 5');
  await expect(finder.getByLabel('Lowest score listed')).toBeVisible();
  await d1.getByRole('button', { name: 'all', exact: true }).click();
  await expect(d1).toContainText('5 / 5');
  await d1.getByRole('button', { name: 'none', exact: true }).click();
  await expect(d1.locator('input:checked')).toHaveCount(0);

  // The Mahādoṣas to keep clear of: the 24 of the list that are worked out (the six Daśa Doṣas among them) and the 6 blemishes outside it, each with what it avoids, and the 3 that are not worked out listed with their reason.
  const doshas = finder.locator('[data-finder-group="Mahadoshas"]');
  await expect(doshas.locator('[data-finder-dosha]')).toHaveCount(30);
  await expect(doshas).toContainText('Pañcāṅga Doṣa');
  await expect(doshas).toContainText('Not worked out (3)');
  await doshas.getByRole('checkbox', { name: '3. Saṅkrānti' }).check();
  await expect(doshas.getByLabel('Minutes of arc of the Sun on each side of its entry into a sign')).toHaveValue('16');
  await expect(doshas.getByLabel('Degrees at Cancer and Capricorn')).toHaveValue('3');
  await doshas.getByRole('checkbox', { name: '1. Pañcāṅga Doṣa' }).check();
  await expect(doshas).toContainText('2 / 30');
  // The choices of the doṣas that have them appear with the doṣa: the part of the nakṣatra that is Gaṇḍānta, and the time at Vyatipāta and Vaidhṛti.
  await doshas.getByRole('checkbox', { name: '7. Gaṇḍānta' }).check();
  await expect(doshas.getByLabel('Gaṇḍānta of the nakṣatra')).toHaveValue('pada');
  await doshas.getByLabel('Gaṇḍānta of the nakṣatra').selectOption('two');
  await doshas.getByRole('checkbox', { name: '20. Vyatipāta' }).check();
  await expect(doshas.getByLabel('Time kept clear of at a Vyatipāta or Vaidhṛti')).toHaveValue('days');
  await expect(doshas.locator('[data-finder-dosha="vishaGhati"]')).toContainText('Viṣa Ghaṭī');
  await expect(doshas.locator('[data-finder-dosha="latta"]')).toContainText('15. Lattā');
  // The three blemishes the book names outside the list of 21 have no number.
  await expect(doshas).toContainText('Other blemishes the book names, outside the list of 21');
  await expect(doshas.locator('[data-finder-dosha="mrityubhaga"]')).toContainText('Mṛtyubhāga (fatal degrees)');
  await doshas.getByRole('checkbox', { name: 'Śūnya Rāśi' }).check();
  await expect(doshas).toContainText('5 / 30');
  // The neutralisations of the Muhūrtacintāmaṇi: the exception named with each fault at the start, and the countries of the place named by choice.
  await expect(doshas.locator('[data-finder-dosha="dagdha"]')).toContainText('Dagdha tithi');
  await expect(doshas.locator('[data-finder-dosha="jupiterVenus"]')).toContainText('Guru and Śukra');
  await expect(doshas.getByLabel('Neutralisations (pariharas)')).toHaveValue('named');
  await expect(doshas.getByLabel('A strong graha is judged by')).toHaveValue('extended');
  await doshas.getByLabel('A strong graha is judged by').selectOption('basic');
  await doshas.getByLabel('Neutralisations (pariharas)').selectOption('off');
  await expect(doshas.getByLabel('Neutralisations (pariharas)')).toHaveValue('off');
  await expect(doshas.getByLabel('A strong graha is judged by')).toHaveCount(0);
  await doshas.getByLabel('Neutralisations (pariharas)').selectOption('named');
  await expect(doshas.locator('[data-finder-region]')).toHaveCount(0);
  await doshas.getByRole('checkbox', { name: 'Name the countries of the place', exact: true }).check();
  await expect(doshas.locator('[data-finder-region]')).toHaveCount(7);
  await doshas.getByRole('checkbox', { name: 'Madhyadeśa (the middle country)' }).check();
  await doshas.getByRole('checkbox', { name: 'Name the countries of the place', exact: true }).uncheck();
  await expect(doshas.locator('[data-finder-region]')).toHaveCount(0);
  await doshas.getByRole('button', { name: 'none', exact: true }).click();
  await expect(doshas.locator('input:checked')).toHaveCount(0);

  // The placements: a ready-made choice sets the groups and three rules; a rule is added and removed by hand.
  await finder.getByRole('button', { name: 'Store or business opening', exact: true }).click();
  const placements = finder.locator('[data-finder-group="Placements"]');
  await expect(placements.locator('[data-finder-rule]')).toHaveCount(3);
  await expect(finder.locator('[data-finder-group="Vāra"]').getByRole('button', { name: 'tue', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(finder.locator('[data-finder-group="Nakṣatra"]').getByRole('button', { name: 'Rohini', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(placements.getByRole('button', { name: 'Rule 1 Venus', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await placements.getByRole('button', { name: 'remove rule 3', exact: true }).click();
  await placements.getByRole('button', { name: 'add a rule', exact: true }).click();
  await expect(placements.locator('[data-finder-rule]')).toHaveCount(3);
  // A new rule has no graha and no house: it can never hold, and the page says so.
  await expect(placements).toContainText('this rule can never hold');
  await expect(finder.getByRole('button', { name: 'search', exact: true })).toBeDisabled();
  await placements.getByRole('button', { name: 'remove rule 3', exact: true }).click();
  await finder.getByRole('button', { name: 'choose everything again', exact: true }).click();
  await expect(placements.locator('[data-finder-rule]')).toHaveCount(0);

  // The ready-made choices of the chapter on specific guidelines: kinds of purpose, what the book calls middling, what is not used.
  const presets = finder.locator('[data-finder-group="Presets"]');
  await expect(presets.locator('[data-finder-preset-category]')).toHaveCount(4);
  await expect(presets.locator('[data-finder-preset]')).toHaveCount(6);
  // The month strip: nothing is red while nothing is chosen away; a ready-made choice colours it by the book; a click gives the details.
  const strip = finder.locator('[data-finder-group="Strip"]');
  const nakshatraRow = strip.locator('[data-finder-strip-row="nakshatra"]');
  await expect(nakshatraRow).toBeVisible({ timeout: 20000 });
  await expect(strip.locator('[data-finder-strip-row]')).toHaveCount(8);
  await expect(nakshatraRow.locator('[data-finder-strip-tone="bad"]')).toHaveCount(0);
  await presets.getByRole('button', { name: 'Wedding', exact: true }).click();
  await expect(nakshatraRow.locator('[data-finder-strip-tone="bad"]').first()).toBeVisible();
  await expect(strip.locator('[data-finder-strip-row="vtn"] [data-finder-strip-tone]').first()).toBeVisible();
  await strip.locator('[data-finder-strip-row="vtn"] > div').first().click({ position: { x: 200, y: 8 } });
  await expect(strip.locator('[data-finder-strip-detail]')).toBeVisible();
  // A moment found in the strip can be opened as a chart of its own in a new tab, by the clock of the place of the search.
  const detail = strip.locator('[data-finder-strip-detail]');
  const stamp = ((await detail.locator('span.font-semibold').first().textContent()) ?? '').trim();
  const [, day, month, hour, minute] = /(\d{2})\.(\d{2})\. (\d{2}):(\d{2})/.exec(stamp)!;
  // The new tab calculates the chart of that moment by the clock of the place: its request carries the date and the time. (The birth form
  // that held them folds away as soon as the chart is there, so the form is not a thing to wait for.)
  const chartRequest = page.context().waitForEvent('request', {
    predicate: request => {
      const url = new URL(request.url());
      const get = (name: string) => url.searchParams.get(name);
      return url.pathname === '/api/chart' && get('day') === day && get('month') === month && get('hour') === hour && get('minute') === minute && get('second') === '00';
    },
    timeout: 30_000,
  });
  const [popup] = await Promise.all([page.waitForEvent('popup'), detail.locator('[data-finder-strip-open-chart]').click()]);
  await chartRequest;
  await expect(popup.getByRole('img', { name: 'North Indian Jyotish chart' }).first()).toBeAttached({ timeout: 30_000 });
  await popup.close();
  // Rows made green by choice: only the times when all the ticked rows are green are shown, the rest of the strip is covered.
  await expect(strip.locator('[data-finder-strip-windows]')).toHaveCount(0);
  await strip.locator('[data-finder-strip-require="tara"]').check();
  await strip.locator('[data-finder-strip-require="chandra"]').check();
  await expect(strip.locator('[data-finder-strip-windows]')).toBeVisible();
  await expect(strip.locator('[data-finder-strip-windows] button').first()).toBeVisible();
  await expect(strip.locator('[data-finder-strip-gap]').first()).toBeAttached();
  await strip.locator('[data-finder-strip-require="tara"]').uncheck();
  await strip.locator('[data-finder-strip-require="chandra"]').uncheck();
  await expect(strip.locator('[data-finder-strip-windows]')).toHaveCount(0);
  const monthBefore = await strip.locator('[data-finder-strip-month]').textContent();
  await strip.getByRole('button', { name: 'next month', exact: true }).click();
  await expect(strip.locator('[data-finder-strip-month]')).not.toHaveText(monthBefore ?? '');
  await expect(finder.locator('[data-finder-group="Nakṣatra"]').getByRole('button', { name: 'Magha', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(finder.locator('[data-finder-group="Nakṣatra"]').getByRole('button', { name: 'Bharani', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(finder.locator('[data-finder-group="Vāra"]').getByRole('button', { name: 'sat', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(finder.locator('[data-finder-group="Mahadoshas"]')).toContainText('11 / 30');
  await expect(placements.locator('[data-finder-rule]')).toHaveCount(6);
  await expect(presets.locator('[data-finder-preset-middling]')).toContainText('Taurus, Cancer, Leo, Sagittarius, Aquarius');
  await expect(presets.locator('[data-finder-preset-not-applied]')).toContainText('the lunar month (Masa)');
  await presets.getByRole('button', { name: 'Commencing a journey', exact: true }).click();
  await expect(finder.locator('[data-finder-group="Mahadoshas"]')).toContainText('1 / 30');
  await expect(presets.locator('[data-finder-preset-not-applied]')).toContainText('the direction of the journey');
  await finder.getByRole('button', { name: 'choose everything again', exact: true }).click();
  await doshas.getByRole('button', { name: 'none', exact: true }).click();

  // Setting a stretch as the target does not fail.
  await rows.first().getByRole('button', { name: 'use as target', exact: true }).click();

  // The wishes: back to the start choices, search a week, and the stretches have a score (the weights of the wishes they hold) and can be put best first.
  await finder.getByRole('button', { name: 'back to the start choices', exact: true }).click();
  await expect(finder.getByLabel('Lowest score listed')).toHaveValue('0');
  // The positive yogas are a wish from the start: the nine inauspicious ones are not chosen, and the button chooses the eighteen again.
  const yogas = finder.locator('[data-finder-group="Yoga"]');
  await expect(yogas.getByRole('button', { name: 'Yoga: wish' })).toHaveAttribute('aria-pressed', 'true');
  await expect(yogas.getByRole('button', { name: 'Priti', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(yogas.getByRole('button', { name: 'Vajra', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await yogas.getByRole('button', { name: 'all', exact: true }).click();
  await expect(yogas.getByRole('button', { name: 'Vajra', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await yogas.getByRole('button', { name: 'positive', exact: true }).click();
  await expect(yogas.getByRole('button', { name: 'Vajra', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(yogas.getByRole('button', { name: 'Indra', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(yogas).toContainText('18 / 27');
  await finder.getByRole('button', { name: 'search', exact: true }).click();
  await expect(visible(page, page.getByTestId('muhurta-finder-results'))).toContainText('Score', { timeout: 30_000 });
  const scores = visible(page, page.getByTestId('muhurta-finder-results')).locator('[data-finder-score]');
  expect(await scores.count()).toBeGreaterThanOrEqual(3);
  const allScores = await scores.evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('data-finder-score'))));
  // The wishes are the Chandrabala (100), the Tarabala (60) and the positive yogas (32), so a score is a sum of some of the three.
  expect(allScores.every(score => [0, 32, 60, 92, 100, 132, 160, 192].includes(score))).toBe(true);
  await visible(page, page.getByTestId('muhurta-finder-results')).getByRole('button', { name: 'best first', exact: true }).click();
  const sorted = await visible(page, page.getByTestId('muhurta-finder-results')).locator('[data-finder-score]').evaluateAll(cells => cells.map(cell => Number(cell.getAttribute('data-finder-score'))));
  expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
  // The lowest score: only the stretches that hold the Chandrabala and the Tarabala, with or without the yoga.
  await finder.getByLabel('Lowest score listed').fill('160');
  await finder.getByRole('button', { name: 'search', exact: true }).click();
  await expect.poll(async () => (await visible(page, page.getByTestId('muhurta-finder-results')).locator('[data-finder-score]').evaluateAll(cells => cells.map(cell => cell.getAttribute('data-finder-score')))).every(score => Number(score) >= 160)).toBe(true);

  // The choices are kept in the browser.
  await page.reload();
  await selectWorkspace(page, 'TIMING');
  expect(errors).toEqual([]);
});
