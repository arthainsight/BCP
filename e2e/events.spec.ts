import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible } from './helpers';

// The Event List: pasting, bulk editing, the transits of an event day.

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

test('an event shows the progressions (Paraya) of its day, for its first and last day', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('textbox', { name: 'Event name' })).fill('Moved house');
  await visible(page, page.getByLabel('Event date')).fill('2015-06-15');
  await visible(page, page.getByRole('button', { name: 'Add', exact: true })).click();

  // The card names the four progressing grahas of the day: where each stood, its house, and the natal points it aspected by sign.
  const card = visible(page, page.locator('details').filter({ hasText: 'Moved house' }));
  const progressions = card.locator('[data-event-progressions="2015-06-15"]');
  await expect(progressions).toBeVisible();
  for (const body of ['Jupiter', 'Saturn', 'Rahu', 'Ketu']) await expect(progressions.locator(`[data-event-progression="${body}"]`)).toContainText(/H\d+/);
  await expect(progressions.locator('[data-event-progression]')).toHaveCount(4);
  await expect(progressions.locator('[data-aspect]').first()).toBeVisible();
  for (const aspect of await progressions.locator('[data-aspect]').all()) await expect(aspect).toHaveAttribute('data-aspect', /^(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|Asc)\|[1579]$/);

  // They are what the Paraya tab shows for that day: the same sign and degree for each graha.
  const standing = async (body: string) => ((await progressions.locator(`[data-event-progression="${body}"]`).innerText()).match(/([A-Z][a-z]+) (\d+°\d+')/) ?? [])[0];
  const onTheCard = { Jupiter: await standing('Jupiter'), Saturn: await standing('Saturn') };
  expect(onTheCard.Jupiter).toBeTruthy();
  await card.getByRole('button', { name: 'Set as target' }).click();
  await visible(page, page.getByRole('button', { name: 'Paraya', exact: true })).click();
  for (const body of ['Jupiter', 'Saturn'] as const) {
    const row = visible(page, page.locator(`tr[data-progressing="${body}"]`));
    expect((await row.innerText()).replace(/\s+/g, ' ')).toContain(onTheCard[body]);
  }

  // An event that lasted for a while has them for its last day too.
  await visible(page, page.getByRole('button', { name: 'Dasha', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  const again = visible(page, page.locator('details').filter({ hasText: 'Moved house' }));
  await again.getByLabel('End date').fill('2016-01-15');
  await expect(again.locator('[data-event-progressions]')).toHaveCount(2);
  await expect(again.locator('[data-event-progressions="2016-01-15"]')).toBeVisible();

  expect(errors).toEqual([]);
});

test('many events can be pasted into the Event List at once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Paste', exact: true })).click();

  const box = visible(page, page.getByRole('group', { name: 'Paste many events' }));
  await box.getByRole('textbox', { name: 'Events to add' }).fill([
    '15.6.2015 Moved abroad',
    '2.1.2018; New job; työ; D10; 5; started at the bank',
    '2019-03-04 Daughter born',
    'Surgery 7/11/2020',
    '31.2.2016 Not a day',
  ].join('\n'));

  // It tells what it understood before anything is added.
  await expect(box).toContainText('4 new');
  await expect(box).toContainText('1 lines not understood');
  await expect(box.getByRole('list', { name: 'Lines not understood' })).toContainText('31.2.2016 Not a day');
  await box.getByRole('button', { name: 'Add 4 events' }).click();

  // The box closes and the four events are in the list, in date order.
  await expect(page.getByRole('group', { name: 'Paste many events' })).toHaveCount(0);
  await expect(visible(page, page.getByText('Added 4 events.'))).toBeVisible();
  const names = ['Moved abroad', 'New job', 'Daughter born', 'Surgery'];
  for (const name of names) await expect(visible(page, page.locator('details').filter({ hasText: name }))).toBeVisible();

  // The same lines again add nothing: they are in the list already.
  await visible(page, page.getByRole('button', { name: 'Paste', exact: true })).click();
  await visible(page, page.getByRole('textbox', { name: 'Events to add' })).fill('15.6.2015 Moved abroad');
  await expect(visible(page, page.getByRole('group', { name: 'Paste many events' }))).toContainText('0 new · 1 already in the list');
  await expect(visible(page, page.getByRole('button', { name: /^Add\s*events$/ }))).toBeDisabled();

  expect(errors).toEqual([]);
});

test('events can be pasted with periods and loose dates, and changed or deleted many at once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Paste', exact: true })).click();
  const box = visible(page, page.getByRole('group', { name: 'Paste many events' }));
  await box.getByRole('textbox', { name: 'Events to add' }).fill([
    '15.6.2015 Moved abroad',
    '2.1.2018; New job; work; D10; 5',
    '2015 - 2017 Studied abroad',
    '3/2019 Daughter born',
    '2020-05-05 Surgery',
  ].join('\n'));
  await expect(box).toContainText('5 new');
  await box.getByRole('button', { name: 'Add 5 events' }).click();
  await expect(visible(page, page.getByText('Added 5 events.'))).toBeVisible();
  const card = (name: string) => visible(page, page.locator('details').filter({ hasText: name }));

  // A period shows both its days, and a loose date is marked, which the search finds.
  await expect(card('Studied abroad')).toContainText('01.01.2015 – 31.12.2017');
  await visible(page, page.getByPlaceholder('Search names, notes or tags')).fill('approx');
  await expect(card('Daughter born')).toBeVisible();
  await expect(page.locator('details').filter({ hasText: 'Surgery' })).toHaveCount(0);
  await visible(page, page.getByPlaceholder('Search names, notes or tags')).fill('');

  // Choose them all and change them together.
  const bar = visible(page, page.getByRole('group', { name: 'Bulk editing' }));
  await bar.getByRole('checkbox', { name: /Select all shown/ }).check();
  await expect(bar).toContainText('5 selected');
  await bar.getByLabel('Set category of the selected events').selectOption('health');
  await expect(visible(page, page.getByText('Changed 5 events.'))).toBeVisible();
  await expect(card('Surgery')).toContainText('Health');
  await expect(card('New job')).toContainText('Health');
  await bar.getByLabel('Tags for the selected events').fill('review, checked');
  await bar.getByRole('button', { name: 'Add tags' }).click();
  await visible(page, page.getByPlaceholder('Search names, notes or tags')).fill('checked');
  await expect(card('Surgery')).toBeVisible();
  await expect(card('Moved abroad')).toBeVisible();
  await visible(page, page.getByPlaceholder('Search names, notes or tags')).fill('');

  // A period becomes a single day again.
  await bar.getByRole('button', { name: 'Clear end date' }).click();
  await expect(card('Studied abroad')).not.toContainText('31.12.2017');

  // One event is deleted after a question, and Undo brings it back.
  await bar.getByRole('checkbox', { name: /Select all shown/ }).uncheck();
  await expect(bar).not.toContainText('selected');
  await visible(page, page.getByRole('checkbox', { name: 'Select Surgery' })).check();
  await bar.getByRole('button', { name: 'Delete selected (1)' }).click();
  await bar.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(visible(page, page.getByText('Deleted 1 events.'))).toBeVisible();
  await expect(page.locator('details').filter({ hasText: 'Surgery' })).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  await expect(card('Surgery')).toBeVisible();

  // The list can be grouped by year.
  await bar.getByRole('checkbox', { name: 'Group by year' }).check();
  await expect(visible(page, page.getByRole('heading', { name: '2015 · 2', level: 4 }))).toBeVisible();

  expect(errors).toEqual([]);
});

test('events can be sorted by the words in them, with a preview, and Undo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Paste', exact: true })).click();
  const box = visible(page, page.getByRole('group', { name: 'Paste many events' }));
  // Pasted as they come: no category, no tags.
  await box.getByRole('textbox', { name: 'Events to add' }).fill([
    '1.5.2010 Muutto Ouluun',
    '3.6.2012 Muutin Helsinkiin',
    '4.7.2014 Tapaturma: jalka murtui',
    '5.8.2016 Uusi työ',
  ].join('\n'));
  await box.getByRole('button', { name: 'Add 4 events' }).click();
  await expect(visible(page, page.getByText('Added 4 events.'))).toBeVisible();
  const card = (name: string) => visible(page, page.locator('details').filter({ hasText: name }));
  await expect(card('Muutto Ouluun')).toContainText('Other');

  // The panel is closed at first; a set of words fills in the words, the category and the tag, and the preview says what they find before anything changes.
  await visible(page, page.getByRole('button', { name: 'Classify events by words' })).click();
  const panel = visible(page, page.getByRole('group', { name: 'Classify events by words' }));
  await expect(panel.locator('[data-classify-preview]')).toContainText('Write some words');
  await panel.getByRole('button', { name: 'Moves', exact: true }).click();
  await expect(panel.getByLabel('Words to look for')).toHaveValue(/muutto/);
  await expect(panel.locator('[data-classify-preview]')).toContainText('2 events found, 2 would change.');
  await expect(panel.locator('[data-classify-preview]')).toContainText('Muutto Ouluun');
  await expect(panel.locator('[data-classify-preview]')).not.toContainText('Uusi työ');
  await expect(card('Muutto Ouluun')).toContainText('Other');

  // Sorted: the two moves have the category Home and the tag, and the others stay as they were.
  await panel.getByRole('button', { name: 'Sort 2 events' }).click();
  await expect(visible(page, page.getByText('Sorted 2 events.'))).toBeVisible();
  await expect(card('Muutto Ouluun')).toContainText('Home');
  await expect(card('Muutin Helsinkiin')).toContainText('Home');
  await expect(card('Uusi työ')).toContainText('Other');
  await visible(page, page.getByPlaceholder('Search names, notes or tags')).fill('move');
  await expect(card('Muutto Ouluun')).toBeVisible();
  await expect(page.locator('details').filter({ hasText: 'Uusi työ' })).toHaveCount(0);
  await visible(page, page.getByPlaceholder('Search names, notes or tags')).fill('');

  // Only the events still in Other are taken, so the same set finds none now; without that choice it finds the two, which have the category and the tag already.
  await panel.getByRole('button', { name: 'Moves', exact: true }).click();
  await expect(panel.locator('[data-classify-preview]')).toContainText('0 events found, 0 would change.');
  await panel.getByRole('checkbox', { name: 'Only the events still in the category Other' }).uncheck();
  await expect(panel.locator('[data-classify-preview]')).toContainText('2 events found, 0 would change.');
  await expect(panel.getByRole('button', { name: /^Sort 0 events$/ })).toBeDisabled();

  // Undo brings the old list back.
  await visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  await expect(card('Muutto Ouluun')).toContainText('Other');
  await expect(card('Muutin Helsinkiin')).toContainText('Other');

  expect(errors).toEqual([]);
});

test('how exactly the date of an event is known can be chosen, one by one or for many at once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Paste', exact: true })).click();
  const box = visible(page, page.getByRole('group', { name: 'Paste many events' }));
  // A month and a year come in with their accuracy; a day is a day.
  await box.getByRole('textbox', { name: 'Events to add' }).fill(['3/2015 Rough month', '2016 Rough year', '15.6.2017 Exact day'].join('\n'));
  await box.getByRole('button', { name: 'Add 3 events' }).click();
  await expect(visible(page, page.getByText('Added 3 events.'))).toBeVisible();
  const card = (name: string) => visible(page, page.locator('details').filter({ hasText: name }));
  const accuracy = async (name: string) => {
    const open = card(name);
    if ((await open.getAttribute('open')) === null) await open.locator('summary').first().click();
    return open.getByLabel('Date accuracy');
  };
  await expect(await accuracy('Rough month')).toHaveValue('month');
  await expect(await accuracy('Rough year')).toHaveValue('year');
  await expect(await accuracy('Exact day')).toHaveValue('day');

  // One event is changed by hand: the day known only to the year.
  await (await accuracy('Exact day')).selectOption('year');
  await expect(await accuracy('Exact day')).toHaveValue('year');

  // Many at once, with the bulk bar.
  const bar = visible(page, page.getByRole('group', { name: 'Bulk editing' }));
  await bar.getByRole('checkbox', { name: /Select all shown/ }).check();
  await bar.getByLabel('Set date accuracy of the selected events').selectOption('month');
  await expect(visible(page, page.getByText('Changed 3 events.'))).toBeVisible();
  for (const name of ['Rough month', 'Rough year', 'Exact day']) await expect(await accuracy(name)).toHaveValue('month');

  // The form that adds one event has it too: an event known to the month stays so.
  await visible(page, page.getByLabel('Event name', { exact: true })).fill('Added by hand');
  await visible(page, page.getByLabel('Event date accuracy')).selectOption('month');
  await visible(page, page.getByRole('button', { name: 'Add', exact: true })).click();
  await expect(await accuracy('Added by hand')).toHaveValue('month');

  expect(errors).toEqual([]);
});

test('an event opens the Matrix of the Varga view in ANALYSIS', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('textbox', { name: 'Event name' })).fill('Moved abroad');
  await visible(page, page.getByRole('button', { name: 'Add', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Open Varga Matrix' })).click();

  // ANALYSIS is on screen, on the Varga view, showing the matrix and not the charts.
  await expect(visible(page, page.getByText('varga.matrix'))).toBeVisible();
  await expect(visible(page, page.getByRole('button', { name: 'Matrix', exact: true }))).toBeVisible();

  // And it works again after going elsewhere and back to the events.
  await selectWorkspace(page, 'TIMING');
  await visible(page, page.getByRole('button', { name: 'Events', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Open Varga Matrix' })).click();
  await expect(visible(page, page.getByText('varga.matrix'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('the Event List is in Finnish, with its messages and Undo', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ hasText: 'Suomi' })).selectOption('fi');
  await selectWorkspace(page, 'AJANKOHTA');
  await visible(page, page.getByRole('button', { name: 'Tapahtumat', exact: true })).click();

  // The form, the paste box and the messages are Finnish.
  await expect(visible(page, page.getByText('Tapahtumalista 2.0'))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Liitä', exact: true })).click();
  const box = visible(page, page.getByRole('group', { name: 'Liitä monta tapahtumaa' }));
  await box.getByRole('textbox', { name: 'Lisättävät tapahtumat' }).fill('15.6.2015 Muutto ulkomaille\n2015 - 2017 Opiskelu\nei päivää');
  await expect(box).toContainText('2 uutta');
  await expect(box).toContainText('1 riviä ei ymmärretty');
  await box.getByRole('button', { name: 'Lisää 2 tapahtumaa' }).click();
  await expect(visible(page, page.getByText('Lisätty tapahtumia: 2.'))).toBeVisible();
  await expect(visible(page, page.locator('details').filter({ hasText: 'Opiskelu' }))).toContainText('Muu');

  // Bulk editing and its Undo.
  const bar = visible(page, page.getByRole('group', { name: 'Massamuokkaus' }));
  await bar.getByRole('checkbox', { name: /Valitse kaikki näkyvät/ }).check();
  await expect(bar).toContainText('2 valittu');
  await bar.getByLabel('Aseta valittujen tapahtumien luokka').selectOption('health');
  await expect(visible(page, page.getByText('Muutettu tapahtumia: 2.'))).toBeVisible();
  await expect(visible(page, page.locator('details').filter({ hasText: 'Opiskelu' }))).toContainText('Terveys');
  await visible(page, page.getByRole('button', { name: 'Kumoa', exact: true })).click();
  await expect(visible(page, page.getByText('Peruttu.'))).toBeVisible();
  await expect(visible(page, page.locator('details').filter({ hasText: 'Opiskelu' }))).toContainText('Muu');

  expect(errors).toEqual([]);
});
