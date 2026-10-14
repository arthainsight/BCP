import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { calculateChart, makePng, selectWorkspace, visible } from './helpers';

// The app around the charts: language, the user guide, backup, SHARE, REPORT and the screen recording.

test('screen recording: the screen and the voice are recorded to a video that can be downloaded', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'a phone browser cannot record the screen');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // The browser's own picker and its microphone question cannot be answered in a test: the "screen" is a canvas
  // that keeps changing and the "voice" is a tone. The recorder itself, the MediaRecorder, is the real one.
  await page.addInitScript(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext('2d')!;
    let frame = 0;
    setInterval(() => { frame += 1; context.fillStyle = `hsl(${(frame * 7) % 360} 70% 50%)`; context.fillRect(0, 0, 320, 180); }, 50);
    const calls = { screen: 0, mic: 0 };
    (window as unknown as { __calls: typeof calls }).__calls = calls;
    navigator.mediaDevices.getDisplayMedia = async () => { calls.screen += 1; return canvas.captureStream(15); };
    navigator.mediaDevices.getUserMedia = async () => {
      calls.mic += 1;
      const audio = new AudioContext();
      const tone = audio.createOscillator();
      const out = audio.createMediaStreamDestination();
      tone.connect(out);
      tone.start();
      return out.stream;
    };
  });
  await page.goto('/');

  const calls = () => page.evaluate(() => (window as unknown as { __calls: { screen: number; mic: number } }).__calls);
  const idle = visible(page, page.locator('[data-recorder="idle"]'));
  const active = visible(page, page.locator('[data-recorder="active"]'));
  const clock = () => visible(page, page.locator('[data-recorder-clock]')).innerText();
  const mic = visible(page, page.getByRole('button', { name: 'record the microphone' }));

  // The microphone is on to begin with; recording asks for the screen and the voice.
  await expect(idle).toBeVisible();
  await expect(mic).toHaveAttribute('aria-pressed', 'true');
  await visible(page, page.getByRole('button', { name: 'rec', exact: true })).click();
  await expect(active).toBeVisible();
  await expect.poll(clock).toMatch(/^0:0[1-9]$/);
  expect(await calls()).toEqual({ screen: 1, mic: 1 });

  // Pausing holds the clock; continuing runs it again.
  await visible(page, page.getByRole('button', { name: 'pause', exact: true })).click();
  const held = await clock();
  await page.waitForTimeout(1200);
  expect(await clock()).toBe(held);
  await visible(page, page.getByRole('button', { name: 'continue', exact: true })).click();
  await expect.poll(clock).not.toBe(held);

  // Stopping leaves the video in a card in the corner, with its length and size.
  await visible(page, page.getByTitle('Stop the recording')).click();
  const panel = page.locator('[data-recording-panel]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('[data-recording-info]')).toHaveText(/^\d:\d\d · \d+(\.\d)? (kB|MB) · (webm|mp4)$/);
  expect(await panel.locator('video').getAttribute('src')).toMatch(/^blob:/);
  await expect(idle).toBeVisible();
  await expect(panel).toContainText('lost if you close the page');

  // Download saves a real file with a name from the date.
  const [download] = await Promise.all([page.waitForEvent('download'), panel.getByRole('button', { name: 'Download video' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^bhrigu-code-\d{4}-\d\d-\d\d-\d{4}\.(webm|mp4)$/);
  const saved = await download.path();
  expect(saved).toBeTruthy();
  expect(readFileSync(saved!).length).toBeGreaterThan(1000);
  await expect(panel).toContainText('Saved to your downloads.');
  await panel.getByRole('button', { name: 'Discard' }).click();
  await expect(panel).toHaveCount(0);

  // With the microphone off the voice is not asked for, and the choice is remembered.
  await mic.click();
  await expect(mic).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('screenRecorderMic'))).toBe('false');
  await visible(page, page.getByRole('button', { name: 'rec', exact: true })).click();
  await expect(active).toBeVisible();
  await page.waitForTimeout(1200);
  await visible(page, page.getByTitle('Stop the recording')).click();
  await expect(panel).toBeVisible();
  expect(await calls()).toEqual({ screen: 2, mic: 1 });
  await panel.getByRole('button', { name: 'Discard' }).click();
  await page.reload();
  await expect(visible(page, page.getByRole('button', { name: 'record the microphone' }))).toHaveAttribute('aria-pressed', 'false');

  expect(errors).toEqual([]);
});

test('the panels and the sentences the calculations write are in Finnish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('select').filter({ hasText: 'Suomi' })).selectOption('fi');

  // ANALYSIS: the yoga table's reasons are written by the engine in English and shown in Finnish.
  await selectWorkspace(page, 'ANALYYSI');
  await visible(page, page.getByRole('button', { name: 'Grahat', exact: true })).click();
  await visible(page, page.getByRole('button', { name: /yoga\.detection/ })).click();
  await expect(visible(page, page.getByText('Mars 12. merkissä Auringosta'))).toBeVisible();
  await expect(visible(page, page.getByText('Kendra-/Trikona-herrat').first())).toBeVisible();

  // The Varga matrix and the argala headers.
  await visible(page, page.getByRole('button', { name: 'Varga', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'Matriisi ja bala', exact: true })).click();
  await expect(visible(page, page.getByText('Neljä painotettua laskentaa asteikolla 20.'))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Argala', exact: true })).click();
  await expect(visible(page, page.getByText('4. ⊣ 10.'))).toBeVisible();

  // TIMING: the annual charts, with their ordinals, and the dasha note about the Aṣṭottarī condition.
  await selectWorkspace(page, 'AJANKOHTA');
  await visible(page, page.getByRole('button', { name: 'Tithi Praveśa', exact: true })).click();
  await expect(visible(page, page.getByText('Tithi Praveśa — vuosikartta'))).toBeVisible();
  await expect(visible(page, page.getByText(/täyttä vuotta · \d+\. vuosi käynnissä/))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Varṣaphala', exact: true })).click();
  await expect(visible(page, page.getByText('Pañcādhikārī — viisi virkamiestä'))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Daśā', exact: true })).click();
  await expect(visible(page, page.getByText(/Ehdollinen: ei sovellettavissa \(Rahu \d+\. talossa Lagnan herrasta\)/))).toBeVisible();

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

test('the top bar has a ? link that opens the user guide in a tab of its own', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  const link = visible(page, page.locator('[data-guide-link]'));
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/help');
  await expect(link).toHaveAttribute('target', '_blank');

  const [guide] = await Promise.all([context.waitForEvent('page'), link.click()]);
  await guide.waitForLoadState();
  await expect(guide).toHaveURL(/\/help$/);
  await expect(guide.getByRole('heading', { level: 1 })).toHaveText('Guide');

  expect(errors).toEqual([]);
});

test('the user guide has sections, a search, addresses for the answers and both languages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/help');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guide');
  await expect(page).toHaveTitle(/Guide/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // Every section is there, with its questions.
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(9);
  await expect(page.getByRole('heading', { level: 3, name: 'How do I calculate a chart?' })).toBeVisible();

  // The search narrows the answers, ignores diacritics and says so when nothing is found.
  const search = page.getByRole('searchbox', { name: 'Search the guide' });
  await search.fill('record screen');
  await expect(page.locator('[data-faq="recording"]')).toBeVisible();
  await expect(page.locator('[data-faq="first-chart"]')).toHaveCount(0);
  await search.fill('dasa');
  await expect(page.locator('[data-faq="dasha-systems"]')).toBeVisible();
  await search.fill('zzzqqq');
  await expect(page.locator('[data-help-empty]')).toHaveText('No answers match your search.');
  await search.fill('');
  await expect(page.locator('[data-faq]').first()).toBeVisible();

  // An answer has an address of its own, and the section links lead to the sections.
  await page.goto('/help#recording');
  await expect(page.locator('#recording')).toBeInViewport();
  await page.getByRole('link', { name: 'Palm', exact: true }).first().click();
  await expect(page).toHaveURL(/#section-palm$/);

  // The switch changes the language of the guide, and the app's setting with it.
  await page.getByRole('button', { name: 'FI', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Käyttöohje');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fi');
  await expect(page.getByRole('heading', { level: 3, name: 'Miten lasken kartan?' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}').language);
  expect(stored).toBe('fi');
  await page.getByRole('searchbox', { name: 'Hae oppaasta' }).fill('kämmen');
  await expect(page.locator('[data-faq="palm-photos"]')).toBeVisible();

  // The way back to the app.
  await page.locator('[data-help-back]').click();
  await expect(page).toHaveURL(/\/$/);

  expect(errors).toEqual([]);
});

test('the user guide opens in the language chosen in the app', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.addInitScript(() => {
    localStorage.setItem('chartDisplaySettings', JSON.stringify({ language: 'fi', chartStyle: 'south' }));
  });
  await page.goto('/help');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Käyttöohje');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fi');

  // Changing the language there leaves the other display settings as they were.
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guide');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('chartDisplaySettings') ?? '{}'));
  expect(stored.language).toBe('en');
  expect(stored.chartStyle).toBe('south');

  expect(errors).toEqual([]);
});

test('the backup keeps the palm photographs with their drawings and puts them back', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, 'PALM');
  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'safe.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Pen', exact: true })).click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5, { steps: 5 });
  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.7, { steps: 5 });
  await page.mouse.up();
  await expect(canvas.locator('g[data-kind="pen"]')).toHaveCount(1);
  await page.waitForTimeout(600);

  // The backup file has the photograph (as a picture in the file) and the drawing on it.
  await selectWorkspace(page, '⚙');
  const download = page.waitForEvent('download');
  await visible(page, page.getByRole('button', { name: 'Download backup', exact: true })).click();
  const path = await (await download).path();
  const backup = JSON.parse(readFileSync(path, 'utf8'));
  expect(backup.palms).toHaveLength(1);
  expect(backup.palms[0].image).toMatch(/^data:image\/jpeg;base64,/);
  expect(backup.palms[0].annotations).toHaveLength(1);
  expect(backup.palms[0].name).toBe('safe');

  // Without the photographs the backup has none.
  await visible(page, page.getByRole('checkbox', { name: 'include the palm photographs' })).uncheck();
  const lighter = page.waitForEvent('download');
  await visible(page, page.getByRole('button', { name: 'Download backup', exact: true })).click();
  expect(JSON.parse(readFileSync(await (await lighter).path(), 'utf8')).palms).toBeUndefined();

  // Delete the photograph, then restore the backup: it is back, drawing and all.
  await selectWorkspace(page, 'PALM');
  await visible(page, page.getByRole('button', { name: 'Delete photograph' })).click();
  await visible(page, page.getByRole('button', { name: 'Delete this photograph?' })).click();
  await expect(visible(page, page.getByText('Upload or drop a photograph of a palm to begin.'))).toBeVisible();
  await selectWorkspace(page, '⚙');
  await visible(page, page.locator('label', { hasText: 'Choose backup' })).locator('input[type="file"]').setInputFiles(path);
  await expect(visible(page, page.getByText('The palm photographs on this device are replaced too.'))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Replace and restore', exact: true })).click();
  await page.waitForLoadState('load');
  await selectWorkspace(page, 'PALM');
  const again = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(again).toBeVisible({ timeout: 15_000 });
  await expect(again.locator('g[data-kind="pen"]')).toHaveCount(1);
  await expect(visible(page, page.getByLabel('Name of the photograph'))).toHaveValue('safe');

  expect(errors).toEqual([]);
});

test('SHARE copies a link with the birth data, and opening the link calculates the chart', async ({ page, context, browser }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await calculateChart(page);
  if (info.project.name === 'phone') await visible(page, page.getByRole('button', { name: 'Chart actions', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'SHARE', exact: true })).click();
  await expect(page.locator('[data-share-notice]')).toContainText('Link copied');
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/\/#c=[A-Za-z0-9_-]+$/);

  // Someone else, with nothing saved in their browser, opens the link: the chart is calculated and the address is cleaned.
  const other = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const guest = await other.newPage();
  const guestErrors: string[] = [];
  guest.on('pageerror', (error) => guestErrors.push(error.message));
  await guest.goto(link);
  await expect(visible(guest, guest.getByText(/Asc 12°18'|ASC 12°18'/))).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => guest.url()).not.toContain('#c=');
  expect(await guest.evaluate(() => window.location.hash)).toBe('');

  // A link that is not a chart does nothing, and breaks nothing.
  await guest.goto('/#c=garbage');
  await expect(visible(guest, guest.getByRole('button', { name: 'CHART', exact: true }))).toBeVisible();
  await other.close();

  expect(errors).toEqual([]);
  expect(guestErrors).toEqual([]);
});

test('REPORT puts the chart, the timing summary and the palm photographs on pages that print', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);

  // A palm photograph with one numbered note.
  await selectWorkspace(page, 'PALM');
  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'maria.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Pin', exact: true })).click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(visible(page, page.getByLabel('Note', { exact: true }))).toBeFocused();
  await page.keyboard.type('Career turns at 35');
  await page.waitForTimeout(500);

  // The report is a white page, though the app is dark.
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  if (info.project.name === 'phone') await visible(page, page.getByRole('button', { name: 'Chart actions', exact: true })).click();
  await visible(page, page.getByRole('button', { name: 'REPORT', exact: true })).click();
  const report = page.getByRole('dialog', { name: 'Client report' });
  await expect(report).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
  await expect(report.locator('[data-report-title]')).toHaveText('Chart report · 15.08.1947');
  await expect(report.locator('[data-report-section="chart"] svg').first()).toBeVisible();
  await expect(report.locator('[data-report-section="table"]')).toContainText('Lagna');
  await expect(report.locator('[data-report-section="summary"]')).toContainText('running dashas');
  const figure = report.locator('[data-report-palm]');
  await expect(figure).toHaveCount(1);
  await expect(figure.locator('img')).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => figure.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(100);
  await expect(figure).toContainText('Career turns at 35');

  // What is in it, and what it is called, can be changed; the title names the saved PDF.
  await report.getByRole('textbox', { name: 'Title' }).fill('Maria, autumn 2026');
  await expect(report.locator('[data-report-title]')).toHaveText('Maria, autumn 2026');
  await expect(page).toHaveTitle('Maria, autumn 2026');
  await report.getByRole('textbox', { name: 'Remarks at the end' }).fill('Come back in the spring.');
  await expect(report.locator('[data-report-section="remarks"]')).toContainText('Come back in the spring.');
  await report.getByRole('checkbox', { name: /graha positions/ }).uncheck();
  await expect(report.locator('[data-report-section="table"]')).toHaveCount(0);
  await report.locator('[data-report-pick]').uncheck();
  await expect(figure).toHaveCount(0);
  await report.locator('[data-report-pick]').check();
  await expect(report.locator('[data-report-palm]')).toHaveCount(1);

  // On paper only the report is left, and it saves as a PDF.
  await page.emulateMedia({ media: 'print' });
  expect(await page.evaluate(() => {
    const others = [...document.body.children].filter(element => !element.hasAttribute('data-report-root') && element.tagName !== 'SCRIPT');
    const root = document.querySelector('[data-report-root]') as HTMLElement;
    return {
      hidden: others.every(element => getComputedStyle(element).display === 'none'),
      position: getComputedStyle(root).position,
    };
  })).toEqual({ hidden: true, position: 'static' });
  const pdf = await page.pdf({ format: 'A4' });
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(20_000);
  await page.emulateMedia({ media: 'screen' });

  // Closing it gives the page back, dark again.
  await page.keyboard.press('Escape');
  await expect(report).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
  expect(await page.evaluate(() => 'printReport' in document.body.dataset)).toBe(false);

  expect(errors).toEqual([]);
});

test('EXPORT and IMPORT of the saved charts answer in a note on the screen, not in a pop-up', async ({ page }, info) => {
  const errors: string[] = [];
  const dialogs: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => { dialogs.push(dialog.message()); void dialog.dismiss(); });

  await calculateChart(page);
  const action = async (name: string) => {
    if (info.project.name === 'phone') await visible(page, page.getByRole('button', { name: 'Chart actions', exact: true })).click();
    await visible(page, page.getByRole('button', { name, exact: true })).click();
  };
  const notice = () => visible(page, page.locator('[data-share-notice]'));

  // Nothing is saved yet, so there is nothing to export or to load.
  await action('EXPORT');
  await expect(notice()).toContainText('No saved charts to export.');
  await action('LOAD');
  await expect(notice()).toContainText('No saved charts yet.');

  // Save the chart, take the export file, and read it back: the charts are added to the saved ones.
  await action('SAVE AS');
  await visible(page, page.getByPlaceholder('Chart name')).fill('Test chart');
  await visible(page, page.getByRole('button', { name: 'Save', exact: true })).click();
  const download = page.waitForEvent('download');
  await action('EXPORT');
  const file = await (await download).path();

  const chooser = page.waitForEvent('filechooser');
  await action('IMPORT');
  await (await chooser).setFiles(file);
  await expect(notice()).toContainText('Imported 1 chart.');

  // A file that is not an export is refused in the note too.
  const other = page.waitForEvent('filechooser');
  await action('IMPORT');
  await (await other).setFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"not":"charts"}') });
  await expect(notice()).toContainText('Failed to read file.');

  expect(dialogs).toEqual([]);
  expect(errors).toEqual([]);
});
