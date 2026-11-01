import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible } from './helpers';

// TIMING: the daśā systems, the muhurta, the transit hits and the summary.

test('TIMING Paraya shows where the seven progressing grahas stand and every hit to the natal points, in the 1st, 5th, 7th and 9th sign', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  // Transit Hits is the transits only: the Paraya hits are all in the Paraya tab.
  await visible(page, page.getByRole('button', { name: 'Transit Hits', exact: true })).click();
  await expect(page.getByRole('region', { name: 'paraya hits' })).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Paraya', exact: true })).click();
  const panel = visible(page, page.getByRole('region', { name: 'paraya progressions' }));
  await expect(panel).toBeVisible();

  // The seven progressing grahas, each with the sign it stands in; the three of the beta are marked.
  for (const body of ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mars', 'Mercury', 'Venus']) {
    await expect(panel.locator(`tr[data-progressing="${body}"]`)).toBeVisible();
  }
  await expect(panel.locator('tr[data-progressing="Jupiter"]')).toContainText(/Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces/);
  await expect(panel.locator('tr[data-progressing="Mars"]')).toContainText('β');
  await expect(panel.locator('tr[data-progressing="Jupiter"]')).not.toContainText('β');

  // Ten years hold hits of all four kinds, in months.
  await panel.getByRole('button', { name: '10 yr', exact: true }).click();
  await expect(panel.locator('div[data-month]').first()).toBeVisible();
  const hits = (filter = '') => panel.locator(`li[data-hit${filter}]`);
  for (const relation of ['1', '5', '7', '9']) await expect(hits(`$="|${relation}"`).first()).toBeAttached();
  await panel.getByRole('button', { name: /^show all/ }).click();
  await expect(panel).toContainText('7th from natal');

  // The 7th can be left out, and so can the beta grahas.
  const seventh = panel.getByRole('button', { name: '7', exact: true });
  await expect(seventh).toHaveAttribute('aria-pressed', 'true');
  await seventh.click();
  await expect(hits('$="|7"')).toHaveCount(0);
  await seventh.click();
  await expect(hits('$="|7"').first()).toBeAttached();
  await expect(hits('^="Mercury|"').first()).toBeAttached();
  for (const code of ['Ma', 'Me', 'Ve']) await panel.getByRole('group', { name: 'progressing grahas' }).getByRole('button', { name: code, exact: true }).click();
  await expect(hits('^="Mercury|"')).toHaveCount(0);
  await expect(panel.locator('tr[data-progressing="Mercury"]')).toHaveCount(0);
  await expect(hits('^="Jupiter|"').first()).toBeAttached();

  // A cell of the overview picks one pair; the same cell again, or the chip, lets go of it.
  const cell = panel.locator('button[data-cell]').first();
  const pair = (await cell.getAttribute('data-cell'))!;
  await cell.click();
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await expect(hits(`^="${pair}|"`).first()).toBeAttached();
  expect(await hits().count()).toBe(await hits(`^="${pair}|"`).count());
  await cell.click();
  await expect(cell).toHaveAttribute('aria-pressed', 'false');

  expect(errors).toEqual([]);
});

test('TIMING Paraya aspects shows who aspects each natal point by sign, when several do at once, and a search for when a graha aspects another', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Paraya aspects', exact: true })).click();
  const panel = visible(page, page.getByRole('region', { name: 'paraya aspects' }));
  await expect(panel).toBeVisible();

  // At the target moment: the ten natal points, each with the progressing grahas that aspect its sign and the kind of aspect (1, 5, 7 or 9).
  for (const point of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Asc']) {
    await expect(panel.locator(`tr[data-now="${point}"]`)).toBeVisible();
  }
  await expect(panel.locator('tr[data-now]').filter({ hasText: /(Ju|Sa|Ra|Ke) [1579]/ }).first()).toBeVisible();

  // Several at once: thirty years hold plenty of stretches in which two aspect the same point, fewer where three do, and none where five of the four do.
  await panel.getByRole('button', { name: '30 yr', exact: true }).click();
  const together = panel.locator('li[data-together]');
  await expect(together.first()).toBeVisible();
  await panel.getByRole('button', { name: /^show all/ }).click();
  const two = await together.count();
  expect(two).toBeGreaterThan(10);
  await expect(together.first()).toContainText('←');
  // Su, Mo, Me, Ve and Sa are all in Cancer in this chart, so they are aspected by the same grahas at the same times: one row for the five.
  await expect(together.filter({ hasText: 'Su Mo Me Ve Sa' }).first()).toBeVisible();
  await panel.getByRole('button', { name: '3', exact: true }).click();
  const three = await together.count();
  expect(three).toBeLessThan(two);
  await panel.getByRole('button', { name: '4', exact: true }).click();
  expect(await together.count()).toBeLessThanOrEqual(three);
  await panel.getByRole('button', { name: '2', exact: true }).click();
  // The beta grahas add more.
  const grahas = panel.getByRole('group', { name: 'progressing grahas' });
  await grahas.getByRole('button', { name: 'Ma', exact: true }).click();
  await grahas.getByRole('button', { name: 'Me', exact: true }).click();
  await grahas.getByRole('button', { name: 'Ve', exact: true }).click();
  await panel.getByRole('button', { name: /^show all/ }).click();
  expect(await together.count()).toBeGreaterThan(two);
  for (const code of ['Ma', 'Me', 'Ve']) await grahas.getByRole('button', { name: code, exact: true }).click();

  // The search: when Jupiter aspects the Moon, in dates, by the kind of aspect.
  await panel.getByRole('button', { name: 'search', exact: true }).click();
  await panel.getByLabel('progressing graha', { exact: true }).selectOption('Jupiter');
  await panel.getByLabel('natal point', { exact: true }).selectOption('Moon');
  const aspects = panel.locator('li[data-aspect]');
  await expect(aspects.first()).toBeVisible();
  expect(await aspects.count()).toBeGreaterThanOrEqual(3);
  for (const row of await aspects.all()) await expect(row).toHaveAttribute('data-aspect', /^Jupiter\|Moon\|[1579]$/);
  await expect(aspects.first()).toContainText(/\d{2}\.\d{2}\.\d{4} → \d{2}\.\d{2}\.\d{4}/);
  // Left out kinds are left out.
  await panel.getByRole('button', { name: '7', exact: true }).click();
  await expect(panel.locator('li[data-aspect$="|7"]')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('TIMING Paraya aspects has a timeline, the exact dates inside a stretch, and the daśā running through it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Paraya aspects', exact: true })).click();
  const panel = visible(page, page.getByRole('region', { name: 'paraya aspects' }));
  await expect(panel).toBeVisible();

  // The timeline: a row for each sign with natal points (Su, Mo, Me, Ve and Sa share Cancer), stretches shaded by the number of grahas, and a readout.
  const strip = panel.locator('[data-strip]');
  await expect(strip).toBeVisible();
  await expect(strip.locator('[data-strip-row]').first()).toBeVisible();
  expect(await strip.locator('[data-strip-row]').count()).toBeGreaterThanOrEqual(5);
  await expect(strip.locator('[data-strip-row="Sun Moon Mercury Venus Saturn"]')).toHaveCount(1);
  const segment = strip.locator('rect[data-count]').first();
  await expect(strip.locator('[data-strip-readout]')).toContainText('Hover or focus');
  await segment.hover();
  await expect(strip.locator('[data-strip-readout]')).toContainText(/\d{2}\.\d{2}\.\d{4} → \d{2}\.\d{2}\.\d{4}/);
  await expect(strip.locator('[data-strip-readout]')).not.toContainText('Hover or focus');

  // The daśā running through each stretch, in the first row and then only where the aspected graha is a daśā lord.
  const together = panel.locator('li[data-together]');
  await expect(together.first().locator('[data-dasha]')).toContainText(/Vimś\s+\S+–\S+/);
  const all = await together.count();
  await panel.getByRole('button', { name: 'show all' }).click().catch(() => {});
  await panel.getByRole('button', { name: 'MD lord', exact: true }).click();
  const lords = await together.count();
  expect(lords).toBeLessThan(all);
  await panel.getByRole('button', { name: 'MD or AD lord', exact: true }).click();
  expect(await together.count()).toBeGreaterThanOrEqual(lords);
  await panel.getByRole('button', { name: 'any time', exact: true }).click();
  expect(await together.count()).toBe(all);
  // The daśā line can be switched off, and another system chosen.
  await panel.getByRole('button', { name: 'daśā', exact: true }).click();
  await expect(together.first().locator('[data-dasha]')).toHaveCount(0);
  await panel.getByRole('button', { name: 'daśā', exact: true }).click();
  await panel.getByLabel('daśā system').selectOption('yogini');
  await expect(together.first().locator('[data-dasha]')).toContainText('Yog');

  // The exact dates: a row that holds some opens to them, each a day, a graha, the kind of aspect and a natal point, with a button for the target.
  await panel.getByLabel('daśā system').selectOption('vimshottari');
  const withDates = together.filter({ has: page.getByRole('button', { name: /exact dates: [1-9]/ }) }).first();
  await expect(withDates).toBeVisible();
  await withDates.getByRole('button', { name: /exact dates/ }).click();
  const exact = withDates.locator('li[data-exact-hit]');
  expect(await exact.count()).toBeGreaterThan(0);
  await expect(exact.first()).toContainText(/\d{2}\.\d{2}\.\d{4}/);
  await expect(exact.first().getByRole('button', { name: 'set target' })).toBeVisible();
  await withDates.getByRole('button', { name: /exact dates/ }).click();
  await expect(withDates.locator('[data-exact]')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('TIMING Paraya aspects works on the transits: the same views from the sky', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Paraya aspects', exact: true })).click();
  const panel = visible(page, page.getByRole('region', { name: 'paraya aspects' }));
  await panel.getByRole('button', { name: 'transits', exact: true }).click();

  // The positions come from the ephemeris: wait for them, then the table at the target moment, the timeline and the stretches are there.
  await expect(panel.locator('[data-strip]')).toBeVisible({ timeout: 30_000 });
  for (const point of ['Sun', 'Moon', 'Asc']) await expect(panel.locator(`tr[data-now="${point}"]`)).toBeVisible();
  await expect(panel.locator('tr[data-now]').filter({ hasText: /(Ju|Sa|Ra|Ke) \d/ }).first()).toBeVisible();
  await expect(panel.locator('li[data-together]').first()).toBeVisible();
  await expect(panel.locator('li[data-together]').first()).toContainText('←');

  // Each transiting graha has its own aspects: the buttons are the 1st, 3rd, 4th, 5th, 7th, 8th, 9th and 10th, and turning one off leaves the grahas that do not have it alone.
  const kinds = panel.getByRole('group', { name: 'range' });
  for (const relation of ['1', '3', '4', '5', '7', '8', '9', '10']) await expect(kinds.getByRole('button', { name: relation, exact: true })).toBeVisible();

  // The faster grahas can be added up to ten years and not for thirty.
  const grahas = panel.getByRole('group', { name: 'transiting grahas' });
  await expect(grahas.getByRole('button', { name: 'Ma', exact: true })).toBeEnabled();
  await panel.getByRole('button', { name: '30 yr', exact: true }).click();
  await expect(grahas.getByRole('button', { name: 'Ma', exact: true })).toBeDisabled();

  // The search: Saturn through the thirty years visits every sign, so it aspects the Moon from the Moon's sign and the signs it aspects: the Moon is its 3rd, 7th and 10th.
  await panel.getByRole('button', { name: 'search', exact: true }).click();
  await panel.getByLabel('transiting graha', { exact: true }).selectOption('Saturn');
  await panel.getByLabel('natal point', { exact: true }).selectOption('Moon');
  const aspects = panel.locator('li[data-aspect]');
  await expect(aspects.first()).toBeVisible({ timeout: 30_000 });
  expect(await aspects.count()).toBeGreaterThanOrEqual(4);
  const relations = new Set<string>();
  for (const row of await aspects.all()) {
    const key = (await row.getAttribute('data-aspect')) ?? '';
    expect(key).toMatch(/^Saturn\|Moon\|(1|3|7|10)$/);
    relations.add(key.split('|')[2]);
  }
  expect([...relations].sort((a, b) => Number(a) - Number(b))).toEqual(['1', '3', '7', '10']);
  // A stay of Saturn that reaches the Moon's degree opens to the days of it (a short stay at the edge of a sign, where Saturn turns back, may not reach it,
  // and a retrograde loop can pass it three times).
  const reaching = aspects.filter({ has: page.getByRole('button', { name: /exact dates: [1-9]/ }) }).first();
  await reaching.getByRole('button', { name: /exact dates/ }).click();
  const exact = reaching.locator('li[data-exact-hit]');
  expect(await exact.count()).toBeGreaterThanOrEqual(1);
  await expect(exact.first()).toHaveAttribute('data-exact-hit', /^Saturn\|Moon\|(1|3|7|10)$/);

  // Back to the progressions.
  await panel.getByRole('button', { name: 'progressions (Paraya)', exact: true }).click();
  await expect(panel.getByRole('group', { name: 'progressing grahas' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('a graha that was retrograde at birth begins one sign back, or in its natal sign when that is chosen in Settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // 15.10.2023: Jupiter and Saturn were retrograde.
  await calculateChart(page, '15.10.2023 09.15.00');
  await selectWorkspace(page, 'ANALYSIS');
  await expect(visible(page, page.locator('tr', { has: page.locator('td', { hasText: /^Ju ℞$/ }) }))).toBeVisible();
  const stands = async (body: string) => {
    await selectWorkspace(page, 'TIMING');
    await visible(page, page.getByRole('button', { name: 'Paraya', exact: true })).click();
    return (await visible(page, page.locator(`tr[data-progressing="${body}"]`)).innerText()).replace(/\s+/g, ' ');
  };
  const before = { Jupiter: await stands('Jupiter'), Saturn: await stands('Saturn'), Rahu: await stands('Rahu') };

  await selectWorkspace(page, '⚙');
  const choice = visible(page, page.locator('select').filter({ has: page.locator('option', { hasText: 'the natal sign' }) }));
  await expect(choice).toHaveValue('previous');
  await choice.selectOption('same');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('calculationSettings') ?? '{}').parayaRetro)).toBe('same');

  // Jupiter and Saturn stand in another sign; Rahu, which is not moved, stands where it did.
  expect(await stands('Jupiter')).not.toEqual(before.Jupiter);
  expect(await stands('Saturn')).not.toEqual(before.Saturn);
  expect(await stands('Rahu')).toEqual(before.Rahu);

  expect(errors).toEqual([]);
});

test('the Paraya options in Settings change the Paraya hits', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const hitsText = async () => {
    await selectWorkspace(page, 'TIMING');
    await visible(page, page.getByRole('button', { name: 'Paraya', exact: true })).click();
    const panel = visible(page, page.getByRole('region', { name: 'paraya progressions' }));
    await panel.getByRole('button', { name: '10 yr', exact: true }).click();
    await panel.getByRole('button', { name: /^show all/ }).click();
    return (await panel.locator('li[data-hit]').allInnerTexts()).join(' ').replace(/\s+/g, ' ');
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

test('The Dasas tab has the systems side by side in columns, and each daśā keeps a note', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

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
    const second = await visible(page, page.getByRole('button', { name: /^Vimsottari (Utpanna|Kshema|Adhana)/ })).boundingBox();
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
  await expect(yearly.locator('thead th', { hasText: /^Vimsottari$/ })).toBeVisible();
  await expect(yearly.locator('td.font-bold').first()).toBeVisible();
  await yearly.getByRole('button', { name: '+10 yr' }).click();
  await expect(yearly.locator('tbody tr').first()).toContainText('2026');

  expect(errors).toEqual([]);
});

test('the Vimsottari daśās drill down level by level, and NOW opens the running periods', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  // The original method of U K Jha is switched on in Settings; it shares the drill-down with the plain Vimsottari.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha systems/ })).click();
  await visible(page, page.getByText('Vimsottari Original (U K Jha)')).locator('..').getByRole('switch').click();
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

  for (const system of [{ name: /^Vimsottari (?!Utpanna|Kshema|Adhana|Original)/, original: false }, { name: /^Vimsottari Original/, original: true }]) {
    const card = visible(page, page.getByRole('button', { name: system.name }));
    await card.click();
    // The card (its header and what opens under it) is the header's parent.
    const panel = card.locator('xpath=..');
    await expect(panel).toContainText('active now');
    await expect(panel).toContainText(/MD · \d+ periods/);
    // The method of U K Jha shows its own parameters above the periods.
    if (system.original) await expect(panel).toContainText('original method parameters');

    // A period opens the periods inside it; back goes up again.
    await panel.getByRole('button', { name: /^(Ke|Ve|Su|Mo|Ma|Ra|Ju|Sa|Me)\b/ }).first().click();
    await expect(panel).toContainText(/AD · \d+ periods/);
    await panel.getByRole('button', { name: '← back' }).click();
    await expect(panel).toContainText(/MD · \d+ periods/);

    // NOW goes to the deepest of the periods running now, with the ones above it as the way back.
    await panel.getByRole('button', { name: 'NOW', exact: true }).click();
    await expect(panel).not.toContainText(/MD · \d+ periods/);
    await expect(panel.getByRole('button', { name: '← back' })).toBeEnabled();
    await card.click();
  }
  await expect(visible(page, page.getByText('original method parameters'))).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('Vimsottari Utpanna / Kshema / Adhana starts from the Moon house rule, or the one chosen in Settings', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

  const card = visible(page, page.getByRole('button', { name: /^Vimsottari (Utpanna|Kshema|Adhana).*[▶▼]$/ }));
  await expect(card).toHaveAttribute('aria-expanded', 'false');
  await card.click();
  await expect(card).toHaveAttribute('aria-expanded', 'true');

  // The three candidates, the strongest marked; the daśās below start from it.
  const rows = visible(page, page.locator('tbody tr[data-variant]').locator('..')).locator('tr[data-variant]');
  await expect(rows).toHaveCount(3);
  // The Moon of this chart is in the 11th house, which gives Utpanna (Sanjay Rath).
  await expect(card).toContainText('Vimsottari Utpanna');
  await expect(visible(page, page.getByText('Moon in house 11 → Utpanna'))).toBeVisible();
  await expect(visible(page, page.locator('tr[data-variant="utpanna"]'))).toContainText('●');
  await expect(visible(page, page.getByText(/^> vimshottari utpanna$/i))).toBeVisible();

  // Settings can fix the choice.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha methods/ })).click();
  await visible(page, page.locator('select', { has: page.getByRole('option', { name: 'Kshema (4th nakshatra)' }) })).selectOption('kshema');
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  const kshema = visible(page, page.getByRole('button', { name: /^Vimsottari Kshema.*[▶▼]$/ }));
  await kshema.click();
  await expect(visible(page, page.getByText(/chosen in Settings: Kshema/))).toBeVisible();
  await expect(visible(page, page.locator('tr[data-variant="kshema"]'))).toContainText('●');

  // The year of a daśā is a choice that is kept; the Julian year is the start, and the panels start afresh with the new one.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha methods/ })).click();
  await expect(visible(page, page.getByLabel('Year of a dasha'))).toHaveValue('julian');
  await visible(page, page.getByLabel('Year of a dasha')).selectOption('savana');
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('dashaSettings') ?? '{}').yearLength)).toBe('savana');
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha methods/ })).click();
  await expect(visible(page, page.getByLabel('Year of a dasha'))).toHaveValue('savana');
  await visible(page, page.getByLabel('Year of a dasha')).selectOption('julian');
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('dashaSettings') ?? '{}').yearLength)).toBe('julian');

  // The VDS daśā carries the name of U K Jha.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha systems/ })).click();
  await expect(visible(page, page.getByText('Vimsottari Original (U K Jha)'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('Utpanna / Kshema / Adhana is not used when the Moon stands in a house with no rule', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.route('**/api/geocode**', (route) =>
    route.fulfill({ json: { results: [{ name: 'New Delhi', country: 'India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }] } })
  );
  await page.goto('/');
  // Two hours later than the other tests' chart the Lagna is Libra and the Moon is in the 10th house.
  await visible(page, page.getByPlaceholder('15.08.1947 09.15.00')).fill('15.08.1947 11.30.00');
  await visible(page, page.getByPlaceholder('e.g. New Delhi')).fill('New Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: 'Calculate Chart' })).click();
  await expect(visible(page, page.locator('svg[aria-label="North Indian Jyotish chart"]'))).toBeVisible({ timeout: 30_000 });

  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  const card = visible(page, page.getByRole('button', { name: /^Vimsottari Utpanna \/ Kshema \/ Adhana.*[▶▼]$/ }));
  await expect(card).toContainText('Conditional: not applicable (Moon in 10H');
  await card.click();
  await expect(visible(page, page.getByText(/Moon in house 10: this daśā is not used/))).toBeVisible();
  await expect(page.locator('tr[data-variant] >> text=●')).toHaveCount(0);

  // The chart's ··· menu still offers the other systems, and says this one has nothing to show.
  await selectWorkspace(page, 'CHART');
  await visible(page, page.getByRole('button', { name: '···' })).click();
  await visible(page, page.getByLabel('dasha lords from')).selectOption('vimshottariVariant');
  await expect(visible(page, page.getByText('not applicable for this chart'))).toBeVisible();
  await visible(page, page.getByLabel('dasha lords from')).selectOption('vimshottari');
  await expect(visible(page, page.getByText('not applicable for this chart'))).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('TIMING Muhurta lists Rahu Kala, Yamaganda, Gulika Kala, Abhijit and the Choghadiya, for the birthplace or another place', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Muhurta', exact: true })).click();

  // The three kālas and Abhijit, each with a clock range, then eight Choghaḍiyā by day and eight by night.
  for (const key of ['rahu', 'yamaganda', 'gulika', 'abhijit']) {
    await expect(visible(page, page.locator(`tr[data-muhurta="${key}"]`))).toContainText(/\d{2}:\d{2}:\d{2} – \d{2}:\d{2}:\d{2}/);
  }
  await expect(visible(page, page.locator('[data-muhurta="sun"]'))).toContainText(/\d{2}:\d{2}:\d{2}/);
  await expect(page.locator('li[data-choghadiya]:visible')).toHaveCount(16);

  // Abhijit is the midday muhurta: it starts between ten and thirteen o'clock.
  const abhijit = (await visible(page, page.locator('tr[data-muhurta="abhijit"]')).innerText()).match(/(\d{2}):\d{2}:\d{2} –/);
  expect(Number(abhijit?.[1])).toBeGreaterThanOrEqual(10);
  expect(Number(abhijit?.[1])).toBeLessThanOrEqual(13);

  // Another place can be looked up (the lookup is answered locally with New Delhi).
  await visible(page, page.getByRole('button', { name: 'residence…' })).click();
  await visible(page, page.getByPlaceholder('City of residence that year')).fill('Delhi');
  await visible(page, page.getByRole('button', { name: 'lookup' })).click();
  await visible(page, page.getByRole('button', { name: /New Delhi, India/ })).click();
  await expect(visible(page, page.getByText(/New Delhi, India \(28\.61, 77\.21\)/))).toBeVisible();
  await expect(page.locator('li[data-choghadiya]:visible')).toHaveCount(16);

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

test('TIMING Dasas draws the daśā systems in groups, and the … list chooses the active ones', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

  // The three groups: the nakṣatra daśās, the rāśi daśās and the others, which hold the Naisargika (off to begin with).
  const nakshatra = visible(page, page.getByRole('region', { name: 'Nakshatra daśās' }));
  const rasi = visible(page, page.getByRole('region', { name: 'Rāśi daśās' }));
  await expect(nakshatra).toBeVisible();
  await expect(rasi).toBeVisible();
  const other = visible(page, page.getByRole('region', { name: 'Other daśās' }));
  await expect(other.getByRole('heading')).toContainText('0/3');
  await expect(other).toContainText('None of these is active.');
  // The default settings: 4 of the 5 nakṣatra systems (the Original of U K Jha is off, and so are the eight conditional ones of BPHS 46.24–43) and 3 of the 10 rāśi ones (the five more of the Jaimini Sūtras are off as well).
  await expect(nakshatra.getByRole('heading')).toContainText('4/13');
  await expect(rasi.getByRole('heading')).toContainText('3/10');
  await expect(nakshatra.getByRole('button', { name: /^Vimsottari/ }).first()).toBeVisible();
  await expect(nakshatra.getByRole('button', { name: /^Yoginī/ })).toBeVisible();
  await expect(rasi.getByRole('button', { name: /^Nārāyaṇa/ })).toBeVisible();
  await expect(rasi.getByRole('button', { name: /^Chara/ })).toHaveCount(0);
  await expect(nakshatra.getByRole('button', { name: /^Nārāyaṇa/ })).toHaveCount(0);

  // The … button counts the active systems and opens the list of all of them, in the same groups.
  const picker = visible(page, page.getByRole('button', { name: 'Choose daśā systems' }));
  await expect(picker).toContainText('7/26');
  await expect(picker).toHaveAttribute('aria-expanded', 'false');
  await picker.click();
  await expect(picker).toHaveAttribute('aria-expanded', 'true');
  const list = visible(page, page.getByRole('group', { name: 'Choose daśā systems' }));
  await expect(list.getByRole('checkbox')).toHaveCount(26);
  await expect(list.getByRole('checkbox', { name: /^Chara/ })).not.toBeChecked();
  await expect(list.getByRole('checkbox', { name: /^Vimsottari Original/ })).not.toBeChecked();
  await expect(list.getByRole('checkbox', { name: /^Mūla/ })).toBeChecked();
  await expect(list.getByText('beta')).toHaveCount(10);

  // A box makes a system active at once, in its own group; the choice is the one of Settings and is kept.
  await list.getByRole('checkbox', { name: /^Chara/ }).check();
  await expect(rasi.getByRole('button', { name: /^Chara/ })).toBeVisible();
  await expect(rasi.getByRole('heading')).toContainText('4/10');
  await expect(picker).toContainText('8/26');
  await list.getByRole('checkbox', { name: /^Yoginī/ }).uncheck();
  await expect(nakshatra.getByRole('button', { name: /^Yoginī/ })).toHaveCount(0);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dashaSettings') ?? '{}').dashas);
  expect(stored).toMatchObject({ chara: true, yogini: false, vimshottari: true });

  // None switches a whole group off: it then says so, and the other group stays as it was.
  await list.getByRole('button', { name: 'none' }).nth(1).click();
  await expect(rasi.locator('button[aria-expanded]')).toHaveCount(0);
  await expect(rasi).toContainText('None of these is active.');
  await expect(nakshatra.getByRole('button', { name: /^Vimsottari/ }).first()).toBeVisible();
  await expect(picker).toContainText('3/26');
  // All switches it on again, the beta ones included.
  await list.getByRole('button', { name: 'all' }).nth(1).click();
  await expect(rasi.locator('button[aria-expanded]')).toHaveCount(10);

  // Settings shows the same boxes.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha systems/ })).click();
  await expect(visible(page, page.getByText('Yoginī Daśā')).locator('..').getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await expect(visible(page, page.getByText('Chara Daśā', { exact: true })).locator('..').getByRole('switch')).toHaveAttribute('aria-checked', 'true');

  expect(errors).toEqual([]);
});

test('the Naisargika daśā is in the other daśās, from birth in the order of natural strength', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // The date is fixed so that the running period is known: the chart is of 15.08.1947, so on 15.08.2026 the native is 79, in Saturn's 50 years.
  await page.clock.setFixedTime(new Date('2026-08-15T12:00:00'));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  // Off to begin with; the … list makes it active, and it is drawn in the group of the other daśās.
  const other = visible(page, page.getByRole('region', { name: 'Other daśās' }));
  await expect(other.getByRole('button', { name: /^Naisargika/ })).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Choose daśā systems' })).click();
  await visible(page, page.getByRole('group', { name: 'Choose daśā systems' })).getByRole('checkbox', { name: /^Naisargika/ }).check();
  const card = other.getByRole('button', { name: /^Naisargika/ });
  await expect(card).toBeVisible();
  // The header already tells the running periods: Saturn's (the Moon 1, Mars 2, Mercury 9, Venus 20, Jupiter 18 and the Sun 20 end at 70, 2017; Saturn's 50 years end in 2067).
  await expect(card).toContainText(/Saturn – \w+ – \w+ · MD → 08\.2067/);
  await card.click();
  const panel = card.locator('xpath=..');
  await expect(panel).toContainText('132-year cycle from birth');
  await expect(panel).toContainText('MD · 8 periods');
  const rows = panel.locator('button.grid');
  await expect(rows).toHaveCount(8);
  const expected: [string, string][] = [['Moon', '1.00'], ['Mars', '2.00'], ['Mercury', '9.00'], ['Venus', '20.00'], ['Jupiter', '18.00'], ['Sun', '20.00'], ['Saturn', '50.00'], ['Lagna', '12.00']];
  for (const [index, [name, years]] of expected.entries()) {
    await expect(rows.nth(index).locator('span').first()).toHaveText(name);
    await expect(rows.nth(index)).toContainText(`${years} y`);
  }
  // The Moon's period begins at birth; a period opens the periods inside it, the grahas of the signs from its lord's, and back goes up.
  await expect(rows.first()).toContainText('15.08.1947');
  await rows.first().click();
  await expect(panel).toContainText(/AD · \d periods/);
  await panel.getByRole('button', { name: '← back' }).click();
  await expect(panel).toContainText('MD · 8 periods');

  expect(errors).toEqual([]);
});

test('TIMING Dasas lists the daśā systems closed and opens one on click', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

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

test('TIMING Nakṣatra Praveśa and Yoga Praveśa give the annual chart for the return of the Moon and of the Sun-and-Moon sum', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');

  // Nakṣatra Praveśa: the Moon of 15.08.1947 is in Pushya, pada 2, and the year starts when it comes back.
  await visible(page, page.getByRole('button', { name: 'Nakṣatra Praveśa', exact: true })).click();
  const nakshatra = visible(page, page.locator('[data-pravesha="nakshatra"]'));
  await expect(nakshatra).toBeVisible();
  const rows = nakshatra.locator('[data-pravesha-rows]');
  await expect(rows).toContainText('Pushya (8) · pada 2', { timeout: 30_000 });
  await expect(rows).toContainText(/begins\s*\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}/);
  await expect(rows).toContainText(/ends\s*\d{2}\.\d{2}\.\d{4}/);
  await expect(rows).toContainText(/year\s*\d+ completed/);
  await expect(rows).toContainText(/tithi praveśa\s*\d{2}\.\d{2}\.\d{4}/i);
  await expect(rows).toContainText('Cn');
  await expect(nakshatra).toContainText('in the lunar month of birth, the last return at or before the Tithi Praveśa.');

  // The daśā of the year: the Vimśottarī of birth begins again, from the lord of Pushya (Saturn), nine periods in all.
  const nakshatraDasha = nakshatra.locator('button', { hasText: /^(Saturn|Mercury|Ketu|Venus|Sun|Moon|Mars|Rahu|Jupiter)\s*\d{2}\.\d{2}\.\d{4} → \d{2}\.\d{2}\.\d{4}$/ });
  await expect(nakshatra).toContainText('Vimśottarī daśā (beta)');
  await expect(nakshatraDasha).toHaveCount(9);
  await expect(nakshatraDasha.first()).toContainText('Saturn');
  await expect(nakshatraDasha.nth(1)).toContainText('Mercury');
  await expect(nakshatraDasha.last()).toContainText('Jupiter');

  // The other rule: the last return before the birthday; the same month is the one chosen at first.
  const sameMonth = visible(page, page.getByRole('button', { name: 'Same month', exact: true }));
  const beforeBirthday = visible(page, page.getByRole('button', { name: 'Before birthday', exact: true }));
  await expect(sameMonth).toHaveAttribute('aria-pressed', 'true');
  await expect(beforeBirthday).toHaveAttribute('aria-pressed', 'false');
  await beforeBirthday.click();
  await expect(beforeBirthday).toHaveAttribute('aria-pressed', 'true');
  await expect(sameMonth).toHaveAttribute('aria-pressed', 'false');
  await expect(nakshatra).toContainText('the last one at or before the birthday.');
  await expect(rows).toContainText('Pushya (8) · pada 2');
  await expect(rows).toContainText(/begins\s*\d{2}\.\d{2}\.\d{4}/);
  // The choice stays when the tab changes to the Yoga Praveśa, and back to the same month with one click.
  await visible(page, page.getByRole('button', { name: 'Yoga Praveśa', exact: true })).click();
  await expect(visible(page, page.getByRole('button', { name: 'Before birthday', exact: true }))).toHaveAttribute('aria-pressed', 'true');
  await expect(visible(page, page.locator('[data-pravesha="yoga"]'))).toContainText('the last one at or before the birthday.');
  await visible(page, page.getByRole('button', { name: 'Nakṣatra Praveśa', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Same month', exact: true })).click();
  await expect(visible(page, page.locator('[data-pravesha="nakshatra"]'))).toContainText('in the lunar month of birth, the last return at or before the Tithi Praveśa.');

  // A year back.
  const yearBefore = (await visible(page, page.locator('[data-pravesha="nakshatra"]').getByText(/^\d{4}$/)).innerText()).trim();
  await visible(page, page.getByRole('button', { name: 'Previous year', exact: true })).click();
  await expect(visible(page, page.locator('[data-pravesha="nakshatra"]').getByText(String(Number(yearBefore) - 1), { exact: true }))).toBeVisible();

  // Yoga Praveśa: the yoga of 15.08.1947 is Vyatipata, 36 % spent.
  await visible(page, page.getByRole('button', { name: 'Yoga Praveśa', exact: true })).click();
  const yoga = visible(page, page.locator('[data-pravesha="yoga"]'));
  await expect(yoga).toBeVisible();
  await expect(yoga.locator('[data-pravesha-rows]')).toContainText('Vyatipata (17) · 36.2 % spent', { timeout: 30_000 });
  await expect(yoga).toContainText('depends on the ayanamsa twice');
  // Its daśā counts the yoga like a nakshatra: Vyatipata is the 17th, which has the lord Saturn.
  await expect(yoga).toContainText('Yoga Vimśottarī daśā (beta)');
  const yogaDasha = yoga.locator('button', { hasText: /^(Saturn|Mercury|Ketu|Venus|Sun|Moon|Mars|Rahu|Jupiter)\s*\d{2}\.\d{2}\.\d{4} → \d{2}\.\d{2}\.\d{4}$/ });
  await expect(yogaDasha).toHaveCount(9);
  await expect(yogaDasha.first()).toContainText('Saturn');
  await expect(yoga.locator('[data-pravesha-rows]')).toContainText(/begins\s*\d{2}\.\d{2}\.\d{4}/);

  expect(errors).toEqual([]);
});

test('TIMING Year at a glance puts Tithi, Nakṣatra and Yoga Praveśa and Varṣaphala on one time axis', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Year at a glance', exact: true })).click();
  const glance = visible(page, page.locator('[data-year-glance]'));
  await expect(glance).toBeVisible();

  // All four have their moment, in the form of the other panels, and a lord of the year and a lagna.
  const rows = glance.locator('[data-year-table] tbody tr');
  await expect(rows).toHaveCount(4);
  for (const id of ['tithi', 'nakshatra', 'yoga', 'varsha']) {
    const row = glance.locator(`[data-year-row="${id}"]`);
    await expect(row).toContainText(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2} \(UTC\+5:30\)/, { timeout: 30_000 });
    await expect(row).toContainText(/(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)/);
    await expect(row).toContainText(/(Ar|Ta|Ge|Cn|Le|Vi|Li|Sc|Sg|Cp|Aq|Pi) \d+°/);
    await expect(glance.locator(`[data-year-bar="${id}"] rect`)).toHaveCount(1);
  }
  await expect(glance.locator('[data-year-timeline]')).toBeVisible();

  // The bars are on one axis: each starts where its moment falls, a few weeks apart, and every one is about a year long.
  const geometry = await glance.locator('[data-year-bar] rect').evaluateAll((rects) => rects.map((rect) => ({ x: Number(rect.getAttribute('x')), width: Number(rect.getAttribute('width')) })));
  expect(geometry).toHaveLength(4);
  const starts = geometry.map((g) => g.x);
  expect(Math.max(...starts) - Math.min(...starts)).toBeGreaterThan(0);
  expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(120);
  for (const g of geometry) expect(g.width).toBeGreaterThan(550);

  // The rows agree with the panels: Nakṣatra Praveśa begins at the same moment in its own tab.
  const glanceBegins = (await glance.locator('[data-year-row="nakshatra"] td').nth(1).innerText()).trim();
  await visible(page, page.getByRole('button', { name: 'Nakṣatra Praveśa', exact: true })).click();
  await expect(visible(page, page.locator('[data-pravesha-rows]'))).toContainText(glanceBegins.slice(0, 19), { timeout: 30_000 });

  // A year back moves all four.
  await visible(page, page.getByRole('button', { name: 'Year at a glance', exact: true })).click();
  const yearText = visible(page, page.locator('[data-year-glance]').getByText(/^\d{4}$/));
  const shownYear = Number((await yearText.innerText()).trim());
  await visible(page, page.getByRole('button', { name: 'Previous year', exact: true })).click();
  await expect(visible(page, page.locator('[data-year-glance]').getByText(String(shownYear - 1), { exact: true }))).toBeVisible();
  await expect(glance.locator('[data-year-row="tithi"]')).toContainText(String(shownYear - 1), { timeout: 30_000 });
  await expect(glance.locator('[data-year-row="varsha"]')).toContainText(String(shownYear - 1), { timeout: 30_000 });

  // The rule for Nakṣatra and Yoga Praveśa can be switched here too.
  const before = visible(page, page.getByRole('button', { name: 'Before birthday', exact: true }));
  await before.click();
  await expect(before).toHaveAttribute('aria-pressed', 'true');
  await expect(glance.locator('[data-year-row="yoga"]')).toContainText(/\d{2}\.\d{2}\.\d{4}/, { timeout: 30_000 });

  expect(errors).toEqual([]);
});

test('TIMING Sudarśana draws the three charts and makes the house of the year active in all of them, with its months and days', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // The clock stands still on 14.10.2026, so the year in force is the same on every run.
  await page.clock.setFixedTime(new Date('2026-10-14T12:00:00Z'));
  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Sudarśana', exact: true })).click();
  const chart = visible(page, page.locator('[data-sud="chart"]'));
  await expect(chart).toBeVisible();

  // Three rings of twelve houses. The chart of 15.08.1947: the Lagna is Virgo, the Moon and the Sun are in Cancer.
  await expect(chart.locator('[data-sud-cell]')).toHaveCount(36);
  await expect(chart.locator('[data-sud-cell="lagna-1"]')).toHaveAttribute('data-sud-sign', '6');
  await expect(chart.locator('[data-sud-cell="moon-1"]')).toHaveAttribute('data-sud-sign', '4');
  await expect(chart.locator('[data-sud-cell="sun-1"]')).toHaveAttribute('data-sud-sign', '4');
  await expect(chart.locator('[data-sud-cell="lagna-3"]')).toHaveAttribute('data-sud-sign', '8');

  // BPHS draws the Lagna's chart innermost and the Sun's outermost.
  const area = (id: string) => chart.locator(`[data-sud-cell="${id}"] path`).first().evaluate((path) => { const box = (path as SVGPathElement).getBBox(); return box.width * box.height; });
  const [outer, middle, inner] = [await area('sun-1'), await area('moon-1'), await area('lagna-1')];
  expect(outer).toBeGreaterThan(middle);
  expect(middle).toBeGreaterThan(inner);
  // The Moon and the Sun are in Cancer together, so BPHS says to judge from the Lagna chart alone.
  await expect(visible(page, page.locator('[data-sud="not-applicable"]'))).toContainText('not in three different signs');

  // 14.10.2026: 79 years completed, so the 80th year runs, and the 8th house (79 mod 12 = 7, plus one) is active in all three.
  await expect(chart.locator('[data-sud="centre-age"]')).toContainText('age 79', { timeout: 30_000 });
  await expect(chart.locator('[data-sud="centre-house"]')).toContainText('house 8');
  for (const ring of ['lagna', 'moon', 'sun']) await expect(chart.locator(`[data-sud-year="${ring}"]`)).toHaveCount(1);
  const panel = visible(page, page.locator('[data-sud="houses"]'));
  await expect(panel).toContainText('The active house 8 in the three charts');
  // From Virgo the 8th house is Aries; Jupiter (7th aspect) and Saturn (10th aspect) look at it, its lord Mars is in Gemini, the 10th from Virgo.
  const lagnaRow = panel.locator('[data-sud-row="lagna"]');
  await expect(lagnaRow).toContainText('Ar');
  await expect(lagnaRow).toContainText('Ge (house 10)');
  await expect(lagnaRow).toContainText('Ju Sa');
  // Nothing stands in Aries; Jupiter (benefic) and Saturn (malefic) aspect it: mixed. Aquarius is aspected by Jupiter alone.
  await expect(lagnaRow.locator('[data-sud-verdict]')).toHaveAttribute('data-sud-verdict', 'mixed');
  await expect(lagnaRow.locator('[data-sud-verdict]')).toHaveAttribute('data-sud-basis', 'aspects');
  await expect(panel.locator('[data-sud-row="moon"] [data-sud-verdict]')).toHaveAttribute('data-sud-verdict', 'benefic');
  await expect(panel.locator('[data-sud-row="sun"] [data-sud-verdict]')).toHaveAttribute('data-sud-basis', 'aspects');
  // From Cancer the 8th house is Aquarius, from the Moon and from the Sun alike.
  await expect(panel.locator('[data-sud-row="moon"]')).toContainText('Aq');
  await expect(panel.locator('[data-sud-row="sun"]')).toContainText('Aq');

  // The year runs between two solar returns in August; the twelve months follow from the house of the year.
  const dates = visible(page, page.locator('[data-sud-year-dates]'));
  await expect(dates).toContainText(/begins\s*\d{2}\.08\.2026/);
  await expect(dates).toContainText(/ends\s*\d{2}\.08\.2027/);
  const months = visible(page, page.locator('[data-sud="months"]')).locator('[data-sud-month-row]');
  await expect(months).toHaveCount(12);
  await expect(months.first()).toContainText('8');
  const houses = await months.evaluateAll((rows) => rows.map((row) => Number(row.querySelectorAll('td')[2].textContent)));
  expect(houses).toEqual([8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7]);

  // A month opens its twelve Pratyantara daśās, and is marked in the three rings.
  await months.nth(2).click();
  await expect(chart.locator('[data-sud-month]')).toHaveCount(3);
  const pratyantaras = visible(page, page.locator('[data-sud="pratyantaras"]')).locator('[data-sud-pratyantara-row]');
  await expect(pratyantaras).toHaveCount(12);
  await expect(pratyantaras.first().locator('td').nth(3)).toHaveText('10');
  await expect(pratyantaras.nth(3).locator('td').nth(3)).toHaveText('1');

  // A Pratyantara daśā opens its twelve Vidāśās, starting from the same house.
  await pratyantaras.first().click();
  const vidasas = visible(page, page.locator('[data-sud="vidasas"]')).locator('[data-sud-vidasha-row]');
  await expect(vidasas).toHaveCount(12);
  await expect(vidasas.first().locator('td').nth(3)).toHaveText('10');
  await expect(vidasas.nth(3).locator('td').nth(3)).toHaveText('1');

  // A year back: the 7th house.
  await visible(page, page.getByRole('button', { name: 'Previous year', exact: true })).click();
  await expect(chart.locator('[data-sud="centre-age"]')).toContainText('age 78', { timeout: 30_000 });
  await expect(chart.locator('[data-sud="centre-house"]')).toContainText('house 7');

  expect(errors).toEqual([]);
});

test('the conditional nakṣatra daśās of BPHS 46 are off to begin with, and each says when it applies and whether this chart meets it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();

  // None of the eight is drawn to begin with; the list names them and shows the condition of each on hover.
  await expect(page.getByRole('button', { name: /^Ṣoḍaśottarī/ })).toHaveCount(0);
  const picker = visible(page, page.getByRole('button', { name: 'Choose daśā systems' }));
  await picker.click();
  const list = visible(page, page.getByRole('group', { name: 'Choose daśā systems' }));
  for (const name of ['Ṣoḍaśottarī', 'Dvādaśottarī', 'Pañcottarī', 'Śatābdikā', 'Caturaśītisamā', 'Dvisaptatisamā', 'Ṣaṣṭihāyanī', 'Ṣaṭtriṃśatsamā']) {
    await expect(list.getByRole('checkbox', { name: new RegExp(`^${name}`) })).not.toBeChecked();
  }
  await expect(list.locator('label', { hasText: 'Ṣoḍaśottarī' })).toHaveAttribute('title', /hora/);

  // Switched on, a daśā opens with its condition and the facts of the chart, and says whether the condition is met.
  await list.getByRole('checkbox', { name: /^Ṣoḍaśottarī/ }).check();
  await list.getByRole('checkbox', { name: /^Śatābdikā/ }).check();
  await visible(page, page.getByRole('button', { name: /^Ṣoḍaśottarī/ })).click();
  const card = page.locator('#dasha-shodashottari');
  await expect(card).toContainText('When the daśā applies');
  await expect(card).toContainText('BPHS 46.24–26');
  await expect(card).toContainText(/Condition met|Condition not met/);
  await expect(card).toContainText(/hora/);
  await visible(page, page.getByRole('button', { name: /^Śatābdikā/ })).click();
  await expect(page.locator('#dasha-shatabdika')).toContainText('Vargottama');

  // The Aṣṭottarī states both of its conditions as well.
  await visible(page, page.getByRole('button', { name: /^Aṣṭottarī/ })).click();
  await expect(page.locator('#dasha-ashtottari')).toContainText('46.23');

  expect(errors).toEqual([]);
});

test('the Jaimini rāśi daśās (Yogārdha, Dṛg, Trikoṇa, Śūla) are off to begin with and the Mūla and the Brahma graha follow the Sūtras unless Settings say otherwise', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  const rasi = visible(page, page.getByRole('region', { name: 'Rāśi daśās' }));
  for (const name of ['Yogārdha', 'Dṛg', 'Trikoṇa', 'Śūla', 'Maṇḍūka']) await expect(rasi.getByRole('button', { name: new RegExp(`^${name}`) })).toHaveCount(0);

  const picker = visible(page, page.getByRole('button', { name: 'Choose daśā systems' }));
  await picker.click();
  const list = visible(page, page.getByRole('group', { name: 'Choose daśā systems' }));
  for (const name of ['Yogārdha', 'Dṛg', 'Trikoṇa', 'Śūla', 'Maṇḍūka']) await list.getByRole('checkbox', { name: new RegExp(`^${name}`) }).check();
  await visible(page, page.getByRole('button', { name: /^Dṛg/ })).click();
  const drig = page.locator('#dasha-drig');
  await expect(drig).toContainText('Jaimini Sūtras 2.4.21–23');
  await expect(drig).toContainText('9th from the Lagna');
  await visible(page, page.getByRole('button', { name: /^Śūla/ })).click();
  await expect(page.locator('#dasha-shula')).toContainText('Jaimini Sūtras 2.3.18–25');
  await expect(page.locator('#dasha-shula')).toContainText('Maṇḍūka antardaśā');
  await visible(page, page.getByRole('button', { name: /^Maṇḍūka/ })).click();
  await expect(page.locator('#dasha-mandooka')).toContainText('BPHS 46.179–180');

  // The Mūla is the Kendrādi of the Sūtras, from the Ātmakāraka; the PyJHora way is the other choice in Settings.
  await visible(page, page.getByRole('button', { name: /^Mūla/ })).click();
  const moola = page.locator('#dasha-moola');
  await expect(moola).toContainText('Kendrādi rāśi daśā · Jaimini Sūtras 2.4.11–14');
  await expect(moola).toContainText('Ātmakāraka');
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha methods/ })).click();
  await expect(visible(page, page.getByLabel('Brahma graha', { exact: true }))).toHaveValue('jaimini');
  await visible(page, page.getByLabel('Mula', { exact: true })).selectOption('pyjhora');
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  await visible(page, page.getByRole('button', { name: /^Mūla/ })).click();
  await expect(page.locator('#dasha-moola')).toContainText('PVR/JHora');

  expect(errors).toEqual([]);
});

test('the Kālachakra says when it applies (Phaladīpikā 22.30), and the span of life the text takes shows beside the Naisargika', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Choose daśā systems' })).click();
  const list = visible(page, page.getByRole('group', { name: 'Choose daśā systems' }));
  await list.getByRole('checkbox', { name: /^Kālachakra/ }).check();
  await list.getByRole('checkbox', { name: /^Naisargika/ }).check();
  await visible(page, page.getByRole('button', { name: /^Kālachakra/ })).click();
  const kala = page.locator('#dasha-kalaChakra');
  await expect(kala).toContainText('Phaladīpikā 22.30');
  await expect(kala).toContainText('When the daśā applies');
  await expect(kala).toContainText(/Condition met|Condition not met/);
  await visible(page, page.getByRole('button', { name: /^Naisargika/ })).click();
  await expect(page.locator('#dasha-naisargika')).toContainText(/Phaladīpikā 22\.2[89]/);

  // The PyJHora way, always, is a choice in Settings.
  await selectWorkspace(page, '⚙');
  await visible(page, page.getByRole('button', { name: /dasha methods/ })).click();
  await expect(visible(page, page.getByLabel('Kalachakra', { exact: true }))).toHaveValue('text');
  await visible(page, page.getByLabel('Kalachakra', { exact: true })).selectOption('always');
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  await visible(page, page.getByRole('button', { name: /^Kālachakra/ })).click();
  await expect(page.locator('#dasha-kalaChakra')).toContainText('kālachakra daśā');

  expect(errors).toEqual([]);
});

test('the Paiṇḍī and Aṃśī daśās (the length of life, BPHS 46.201) are off to begin with and show how their order and years were found', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Dasas', exact: true })).click();
  await expect(page.getByRole('button', { name: /^Paiṇḍī/ })).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Choose daśā systems' })).click();
  const list = visible(page, page.getByRole('group', { name: 'Choose daśā systems' }));
  await list.getByRole('checkbox', { name: /^Paiṇḍī/ }).check();
  await list.getByRole('checkbox', { name: /^Aṃśī/ }).check();
  await visible(page, page.getByRole('button', { name: /^Paiṇḍī/ })).click();
  const paindi = page.locator('#dasha-paindi');
  await expect(paindi).toContainText('Piṇḍāyu');
  await expect(paindi).toContainText(/grahas · [\d.]+ years in all/);
  await paindi.getByText('How the order and the years were found').click();
  await expect(paindi).toContainText('Strongest of the Lagna');
  await expect(paindi).toContainText('Sun:');
  await visible(page, page.getByRole('button', { name: /^Aṃśī/ })).click();
  await expect(page.locator('#dasha-amshi')).toContainText('Aṃśāyu');

  expect(errors).toEqual([]);
});
