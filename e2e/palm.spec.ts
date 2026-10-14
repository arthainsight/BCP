import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { calculateChart, makePng, selectWorkspace, visible } from './helpers';

// PALM: photographs, drawing, the ruler and the comparison.

test('PALM: the chart stays beside the palm on a wide screen, and the stroke width has a slider', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await calculateChart(page);
  const chartSvg = () => page.locator('svg[aria-label="North Indian Jyotish chart"]').locator('visible=true');
  await selectWorkspace(page, 'PALM');
  await expect(visible(page, page.locator('[data-palm="workspace"]'))).toBeVisible();

  // On a wide screen the chart is still there beside the palm; the wide button hides it and brings it back.
  if (info.project.name === 'desktop') {
    await expect(chartSvg()).toHaveCount(1);
    const wide = visible(page, page.getByRole('button', { name: '⤢ full', exact: true }));
    await wide.click();
    await expect(chartSvg()).toHaveCount(0);
    await expect(visible(page, page.locator('[data-palm="workspace"]'))).toBeVisible();
    await page.reload();
    await selectWorkspace(page, 'PALM');
    await expect(visible(page, page.getByRole('button', { name: '⤡ narrow', exact: true }))).toBeVisible();
    await visible(page, page.getByRole('button', { name: '⤡ narrow', exact: true })).click();
    await calculateChart(page);
    await selectWorkspace(page, 'PALM');
    await expect(chartSvg()).toHaveCount(1);
  }

  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'stroke.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  const slider = () => visible(page, page.getByRole('slider', { name: 'Stroke' }));
  const strokes = () => canvas.locator('g[data-kind="pen"] path');
  const widths = async () => (await strokes().evaluateAll(nodes => nodes.map(node => Math.round(Number(node.getAttribute('stroke-width')) * 100) / 100))).sort((a, b) => a - b);
  const drag = async (from: [number, number], to: [number, number]) => {
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2) + 6, { steps: 4 });
    await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
    await page.mouse.up();
  };

  // The photograph is 800 high, so a unit is 0.8 pixels of it: the usual width of 6 is 4.8.
  await visible(page, page.getByRole('button', { name: 'Pen', exact: true })).click();
  await drag([0.4, 0.3], [0.45, 0.7]);
  await expect.poll(widths).toEqual([4.8]);

  // A drawing is selected as soon as it is made, and the slider sets its width; one drag of the slider is one undo step.
  await slider().fill('12');
  await expect.poll(widths).toEqual([9.6]);
  await visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  await expect.poll(widths).toEqual([4.8]);

  // The next stroke is drawn with the width that was last set.
  await drag([0.7, 0.3], [0.75, 0.7]);
  await expect.poll(widths).toEqual([4.8, 9.6]);
  await expect(slider()).toHaveValue('12');

  // Selecting the first stroke shows its own width on the slider.
  await visible(page, page.getByRole('button', { name: 'Select', exact: true })).click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.425, box.y + box.height * 0.5);
  await expect(visible(page, page.locator('[data-palm="properties"]'))).toBeVisible();
  await expect(slider()).toHaveValue('6');
  await slider().fill('3');
  await expect.poll(widths).toEqual([2.4, 9.6]);

  expect(errors).toEqual([]);
});

test('PALM: upload a palm photograph, draw on it, number the notes, show it to the client and save it as a picture', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, 'PALM');
  await expect(visible(page, page.getByText('Upload or drop a photograph of a palm to begin.'))).toBeVisible();

  // Upload a photograph: it opens in the editor with an empty drawing.
  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'maria-right.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  await expect(visible(page, page.getByLabel('Name of the photograph'))).toHaveValue('maria-right');
  const shapes = (kind: string) => canvas.locator(`g[data-kind="${kind}"]`);

  // On a phone the toolbar scrolls out of view, so the photograph is brought into view before the pointer moves over it.
  const boxOf = async () => {
    await canvas.scrollIntoViewIfNeeded();
    return (await canvas.boundingBox())!;
  };
  const drag = async (from: [number, number], to: [number, number]) => {
    const box = await boxOf();
    await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2) + 6, { steps: 4 });
    await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
    await page.mouse.up();
  };
  const tool = (name: string) => visible(page, page.getByRole('button', { name, exact: true })).click();

  // A pen stroke along a line of the palm, an arrow and a circle.
  await tool('Pen');
  await drag([0.4, 0.3], [0.45, 0.7]);
  await expect(shapes('pen')).toHaveCount(1);
  await tool('Arrow');
  await drag([0.7, 0.25], [0.55, 0.45]);
  await expect(shapes('arrow')).toHaveCount(1);
  await tool('Ellipse');
  await drag([0.3, 0.75], [0.5, 0.9]);
  await expect(shapes('ellipse')).toHaveCount(1);

  // A pin is numbered at once and waits for its note.
  await tool('Pin');
  const box = await boxOf();
  await page.mouse.click(box.x + box.width * 0.45, box.y + box.height * 0.5);
  await expect(shapes('pin')).toHaveCount(1);
  await expect(visible(page, page.getByLabel('Note', { exact: true }))).toBeFocused();
  await page.keyboard.type('Career turns at 35');
  await expect(visible(page, page.locator('[data-palm="notes"] [data-note="1"]'))).toContainText('Career turns at 35');

  // Select can move a drawing and delete it; undo brings it back.
  await tool('Select');
  await boxOf();
  const before = await shapes('ellipse').locator('ellipse').getAttribute('cx');
  const ellipseBox = (await shapes('ellipse').locator('ellipse').boundingBox())!;
  await page.mouse.move(ellipseBox.x + ellipseBox.width / 2, ellipseBox.y + 1);
  await page.mouse.down();
  await page.mouse.move(ellipseBox.x + ellipseBox.width / 2 + 30, ellipseBox.y + 1, { steps: 4 });
  await page.mouse.up();
  await expect(visible(page, page.locator('[data-palm="properties"]'))).toBeVisible();
  await visible(page, page.getByRole('button', { name: 'Delete', exact: true })).click();
  await expect(shapes('ellipse')).toHaveCount(0);
  await visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  await expect(shapes('ellipse')).toHaveCount(1);
  expect(before).not.toBeNull();

  // Everything is kept on this device: after a reload the photograph and its drawing are back.
  await page.waitForTimeout(600);
  await page.reload();
  await selectWorkspace(page, 'PALM');
  const again = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(again).toBeVisible();
  await expect(again.locator('g[data-kind="pen"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="arrow"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="ellipse"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="pin"]')).toHaveCount(1);
  await expect(visible(page, page.locator('[data-palm="notes"] [data-note="1"]'))).toContainText('Career turns at 35');

  // The client view: large, with the numbered notes; a note zooms to its place.
  await visible(page, page.getByRole('button', { name: 'Client view', exact: true })).click();
  const client = visible(page, page.getByRole('dialog', { name: 'Client view' }));
  await expect(client).toBeVisible();
  const zoom = () => client.locator('[data-palm="zoom"]').innerText();
  const overview = await zoom();
  await client.locator('[data-client-note="1"]').click();
  await expect.poll(zoom).not.toEqual(overview);
  await client.getByRole('button', { name: 'Whole palm' }).click();
  await expect.poll(zoom).toEqual(overview);
  await page.keyboard.press('Escape');
  await expect(client).toBeHidden();

  // Save the picture, drawing and notes together.
  const download = page.waitForEvent('download');
  await visible(page, page.getByRole('button', { name: 'Download PNG', exact: true })).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('maria-right.png');
  const bytes = readFileSync(await file.path());
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.length).toBeGreaterThan(2000);

  // Rename, then delete the photograph.
  await visible(page, page.getByLabel('Name of the photograph')).fill('Maria, oikea käsi');
  await expect(visible(page, page.locator('[data-palm="records"]'))).toContainText('Maria, oikea käsi');
  await visible(page, page.getByRole('button', { name: 'Delete photograph' })).click();
  await visible(page, page.getByRole('button', { name: 'Delete this photograph?' })).click();
  await expect(visible(page, page.getByText('Upload or drop a photograph of a palm to begin.'))).toBeVisible();

  expect(errors).toEqual([]);
});

test('PALM: a ruler that finds the middle, a circle that stays round, an eraser and dots that change a drawing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, 'PALM');
  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'tools.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  const shapes = (kind: string) => canvas.locator(`g[data-kind="${kind}"]`);
  const tool = (name: string) => visible(page, page.getByRole('button', { name, exact: true })).click();
  const boxOf = async () => {
    await canvas.scrollIntoViewIfNeeded();
    return (await canvas.boundingBox())!;
  };
  const drag = async (from: [number, number], to: [number, number]) => {
    const box = await boxOf();
    await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2) + 6, { steps: 4 });
    await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
    await page.mouse.up();
  };
  const centreOf = async (locator: ReturnType<typeof canvas.locator>) => {
    await canvas.scrollIntoViewIfNeeded();
    const box = (await locator.first().boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
  };
  const undo = () => visible(page, page.getByRole('button', { name: 'Undo', exact: true })).click();
  const number = async (locator: ReturnType<typeof canvas.locator>, attribute: string) => Number(await locator.first().getAttribute(attribute));

  // A ruler says its length and, divided in two, the middle; the parts can be changed.
  await tool('Ruler');
  await drag([0.3, 0.2], [0.7, 0.2]);
  await expect(shapes('ruler')).toHaveCount(1);
  await expect(canvas.locator('[data-ruler-label]')).toHaveText(/^\d+ ÷ 2 = \d+(\.\d)?$/);
  await expect(shapes('ruler').locator('circle')).toHaveCount(1);
  await visible(page, page.getByRole('combobox', { name: 'Parts' })).selectOption('4');
  await expect(canvas.locator('[data-ruler-label]')).toContainText('÷ 4 =');
  const marks = async () => ((await shapes('ruler').locator('path').first().getAttribute('d')) ?? '').split('M').length - 1;
  expect(await marks()).toBe(6);
  await visible(page, page.getByRole('combobox', { name: 'Parts' })).selectOption('3');
  expect(await marks()).toBe(5);
  await expect(shapes('ruler').locator('circle'), 'three parts have no middle').toHaveCount(0);
  await visible(page, page.getByRole('combobox', { name: 'Parts' })).selectOption('2');
  await expect(shapes('ruler').locator('circle')).toHaveCount(1);

  // A pin put near the middle of the ruler catches on it.
  await tool('Pin');
  const middle = await centreOf(shapes('ruler').locator('circle'));
  await page.mouse.click(middle.x + 4, middle.y + 3);
  await expect(shapes('pin')).toHaveCount(1);
  const pinAt = { x: await number(shapes('pin').locator('circle'), 'cx'), y: await number(shapes('pin').locator('circle'), 'cy') };
  expect(Math.abs(pinAt.x - (await number(shapes('ruler').locator('circle'), 'cx')))).toBeLessThan(0.01);
  expect(Math.abs(pinAt.y - (await number(shapes('ruler').locator('circle'), 'cy')))).toBeLessThan(0.01);
  // With snapping off the same click lands where it was made.
  await visible(page, page.getByRole('button', { name: 'snap', exact: true })).click();
  await tool('Pin');
  // (The page may have scrolled to reach the buttons, so the middle is looked up again.)
  const middleAgain = await centreOf(shapes('ruler').locator('circle'));
  await page.mouse.click(middleAgain.x + 4, middleAgain.y + 3);
  await expect(shapes('pin')).toHaveCount(2);
  expect(await number(shapes('pin').nth(1).locator('circle'), 'cx')).not.toBeCloseTo(pinAt.x, 1);
  await undo();
  await visible(page, page.getByRole('button', { name: 'snap', exact: true })).click();
  await expect(shapes('pin')).toHaveCount(1);

  // A circle stays a circle, whichever way it is dragged.
  await tool('Circle');
  await drag([0.45, 0.65], [0.55, 0.7]);
  await expect(shapes('circle')).toHaveCount(1);
  const round = (await shapes('circle').locator('circle').first().boundingBox())!;
  expect(Math.abs(round.width - round.height)).toBeLessThan(1.5);
  expect(round.width).toBeGreaterThan(20);

  // The eraser wipes a stroke in two; one wipe is one undo step.
  await tool('Pen');
  await drag([0.35, 0.4], [0.65, 0.4]);
  await expect(shapes('pen')).toHaveCount(1);
  await tool('Eraser');
  await expect(visible(page, page.getByRole('slider', { name: 'Eraser' }))).toBeVisible();
  const stroke = await centreOf(shapes('pen').locator('path'));
  await page.mouse.move(stroke.x, stroke.y - 40);
  await expect(canvas.locator('[data-eraser-ring]')).toHaveCount(1);
  await page.mouse.down();
  await page.mouse.move(stroke.x, stroke.y + 40, { steps: 8 });
  await page.mouse.up();
  await expect(shapes('pen')).toHaveCount(2);
  await undo();
  await expect(shapes('pen')).toHaveCount(1);

  // Anything else it touches goes whole.
  const ring = (await shapes('circle').locator('circle').first().boundingBox())!;
  await page.mouse.move(ring.x - 30, ring.y + ring.height / 2);
  await page.mouse.down();
  await page.mouse.move(ring.x + 30, ring.y + ring.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(shapes('circle')).toHaveCount(0);
  await undo();
  await expect(shapes('circle')).toHaveCount(1);

  // A line, once drawn, can be moved and changed: the button beside it leads to its dots.
  await tool('Line');
  await drag([0.35, 0.85], [0.65, 0.85]);
  await expect(shapes('line')).toHaveCount(1);
  await visible(page, page.getByRole('button', { name: /Move or reshape/ })).click();
  await expect(visible(page, page.getByRole('button', { name: 'Select', exact: true }))).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas.locator('[data-handle]')).toHaveCount(2);
  const lineEnd = shapes('line').locator('line');
  const before = { x1: await number(lineEnd, 'x1'), x2: await number(lineEnd, 'x2'), y2: await number(lineEnd, 'y2') };
  const end = await centreOf(canvas.locator('[data-handle="to"]'));
  await page.mouse.move(end.x, end.y);
  await page.mouse.down();
  await page.mouse.move(end.x + 40, end.y - 40, { steps: 6 });
  await page.mouse.up();
  expect(await number(lineEnd, 'x1')).toBeCloseTo(before.x1, 3);
  expect(await number(lineEnd, 'x2')).toBeGreaterThan(before.x2 + 10);
  expect(await number(lineEnd, 'y2')).toBeLessThan(before.y2 - 10);
  await undo();
  expect(await number(lineEnd, 'x2')).toBeCloseTo(before.x2, 3);

  // The circle is changed by the dot on its edge, the stroke by the dots along it.
  const edge = await centreOf(shapes('circle').locator('circle'));
  await page.mouse.click(edge.box.x, edge.y);
  const radius = await number(shapes('circle').locator('circle'), 'r');
  await expect(canvas.locator('[data-handle="radius"]')).toHaveCount(1);
  const grip = await centreOf(canvas.locator('[data-handle="radius"]'));
  await page.mouse.move(grip.x, grip.y);
  await page.mouse.down();
  await page.mouse.move(grip.x + 30, grip.y, { steps: 6 });
  await page.mouse.up();
  expect(await number(shapes('circle').locator('circle'), 'r')).toBeGreaterThan(radius + 10);

  const pathBefore = await shapes('pen').locator('path').first().getAttribute('d');
  const along = await centreOf(shapes('pen').locator('path'));
  await page.mouse.click(along.x, along.y + 3);
  expect(await canvas.locator('[data-handle]').count()).toBeGreaterThanOrEqual(2);
  const vertex = await centreOf(canvas.locator('[data-handle]').nth(1));
  await page.mouse.move(vertex.x, vertex.y);
  await page.mouse.down();
  await page.mouse.move(vertex.x, vertex.y + 30, { steps: 6 });
  await page.mouse.up();
  expect(await shapes('pen').locator('path').first().getAttribute('d')).not.toEqual(pathBefore);

  // The ruler and the circle are kept, and are in the saved picture.
  await page.waitForTimeout(600);
  await page.reload();
  await selectWorkspace(page, 'PALM');
  const again = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(again).toBeVisible();
  await expect(again.locator('g[data-kind="ruler"]')).toHaveCount(1);
  await expect(again.locator('g[data-kind="circle"]')).toHaveCount(1);
  await expect(again.locator('[data-ruler-label]')).toHaveText(/÷ 2 =/);
  const download = page.waitForEvent('download');
  await visible(page, page.getByRole('button', { name: 'Download PNG', exact: true })).click();
  const bytes = readFileSync(await (await download).path());
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  expect(errors).toEqual([]);
});

test('PALM: a ruler gives the photograph a scale in centimetres, and ages are marked along a line', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, 'PALM');
  await visible(page, page.getByLabel('Upload palm photographs')).setInputFiles({ name: 'ages.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  const canvas = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(canvas).toBeVisible();
  const shapes = (kind: string) => canvas.locator(`g[data-kind="${kind}"]`);
  const tool = (name: string) => visible(page, page.getByRole('button', { name, exact: true })).click();
  const drag = async (from: [number, number], to: [number, number]) => {
    await canvas.scrollIntoViewIfNeeded();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2) + 6, { steps: 4 });
    await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
    await page.mouse.up();
  };
  const labels = () => canvas.locator('[data-ruler-label]');

  // Without a scale a ruler speaks in pixels; the real length of one ruler gives the scale, and then every ruler is in centimetres.
  await tool('Ruler');
  await drag([0.3, 0.2], [0.7, 0.2]);
  await expect(labels()).toHaveText(/^\d+ ÷ 2 = \d+(\.\d)?$/);
  await expect(visible(page, page.getByText('Lengths are in pixels of the photograph.'))).toBeVisible();
  const lengthField = visible(page, page.getByRole('textbox', { name: 'real length of this ruler, in cm' }));
  const useScale = visible(page, page.getByRole('button', { name: 'use as the scale of the photograph' }));
  await expect(useScale).toBeDisabled();
  await lengthField.fill('10');
  await useScale.click();
  await expect(labels()).toHaveText('10 cm ÷ 2 = 5 cm');
  await expect(visible(page, page.locator('[data-palm="scale"]'))).toContainText('1 cm =');
  await drag([0.3, 0.3], [0.5, 0.3]);
  await expect(shapes('ruler')).toHaveCount(2);
  await expect(labels().nth(1)).toHaveText(/^\d+(\.\d+)? cm ÷ 2 = \d+(\.\d+)? cm$/);
  await expect(visible(page, page.getByText('Lengths are in centimetres, by the scale of the photograph.'))).toBeVisible();

  // Ages along a stroke: a mark for every ten years from birth to seventy; the ages can be changed, and a nonsense value is not taken.
  await tool('Pen');
  await drag([0.35, 0.5], [0.65, 0.8]);
  await expect(shapes('pen')).toHaveCount(1);
  await visible(page, page.getByRole('checkbox', { name: 'ages along the line' })).check();
  const ages = () => canvas.locator('[data-age]');
  await expect(ages()).toHaveCount(8);
  await expect(ages().first()).toHaveAttribute('data-age', '0');
  await expect(ages().last()).toHaveAttribute('data-age', '70');
  await expect(ages().last().locator('text')).toHaveText('70');
  const end = visible(page, page.getByRole('spinbutton', { name: 'age at the end' }));
  await end.fill('40');
  await end.press('Tab');
  await expect(ages()).toHaveCount(5);
  await end.fill('0');
  await end.press('Tab');
  await expect(ages(), 'an end age equal to the start is not a scale').toHaveCount(5);
  await expect(end).toHaveValue('40');
  const every = visible(page, page.getByRole('spinbutton', { name: 'a mark every' }));
  await every.fill('20');
  await every.press('Tab');
  await expect(ages()).toHaveCount(3);

  // Both are kept, and are in the saved picture.
  await page.waitForTimeout(600);
  await page.reload();
  await selectWorkspace(page, 'PALM');
  const again = visible(page, page.locator('[data-palm="canvas"]'));
  await expect(again).toBeVisible();
  await expect(again.locator('[data-age]')).toHaveCount(3);
  await expect(again.locator('[data-ruler-label]').first()).toHaveText('10 cm ÷ 2 = 5 cm');
  await expect(visible(page, page.locator('[data-palm="scale"]'))).toBeVisible();
  const download = page.waitForEvent('download');
  await visible(page, page.getByRole('button', { name: 'Download PNG', exact: true })).click();
  expect([...readFileSync(await (await download).path()).subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  // Clearing the scale takes the rulers back to pixels.
  await visible(page, page.locator('[data-palm="scale"]').getByRole('button', { name: 'clear' })).click();
  await expect(again.locator('[data-ruler-label]').first()).toHaveText(/^\d+ ÷ 2 = \d+(\.\d)?$/);

  expect(errors).toEqual([]);
});

test('PALM: two photographs side by side, with the zoom shared', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await selectWorkspace(page, 'PALM');
  const upload = visible(page, page.getByLabel('Upload palm photographs'));
  await upload.setInputFiles({ name: 'one.png', mimeType: 'image/png', buffer: makePng(600, 800) });
  await expect(visible(page, page.locator('[data-palm="canvas"]'))).toBeVisible();
  // One photograph cannot be compared with anything.
  await expect(visible(page, page.getByRole('button', { name: 'Compare', exact: true }))).toHaveCount(0);
  await upload.setInputFiles({ name: 'two.png', mimeType: 'image/png', buffer: makePng(800, 600) });
  await expect(visible(page, page.locator('[data-palm-record]').nth(1))).toBeVisible();

  // The open photograph is a right hand, the other a left one: they are put side by side.
  await visible(page, page.getByLabel('Hand', { exact: true })).selectOption('right');
  await visible(page, page.locator('[data-palm-record]').nth(1)).click();
  await visible(page, page.getByLabel('Hand', { exact: true })).selectOption('left');
  await visible(page, page.locator('[data-palm-record]').nth(1)).click();
  await visible(page, page.getByRole('button', { name: 'Compare', exact: true })).click();
  const dialog = page.getByRole('dialog', { name: 'Compare palms' });
  await expect(dialog).toBeVisible();
  const left = dialog.getByRole('combobox', { name: 'photograph on the left' });
  const right = dialog.getByRole('combobox', { name: 'photograph on the right' });
  expect(await left.inputValue()).not.toEqual(await right.inputValue());
  await expect(left.locator('option:checked')).toContainText('Right hand');
  await expect(right.locator('option:checked')).toContainText('Left hand');
  const zooms = dialog.locator('[data-palm="zoom"]');
  await expect(zooms).toHaveCount(2);
  await expect(zooms.first()).toHaveText('100%');
  await expect(zooms.last()).toHaveText('100%');

  // Zoom one and the other follows, though the photographs differ in shape.
  await dialog.locator('[data-palm-side]').first().getByRole('button', { name: 'Zoom in' }).click();
  await expect(zooms.first()).not.toHaveText('100%');
  await expect.poll(async () => (await zooms.last().innerText())).toEqual(await zooms.first().innerText());
  const together = await zooms.first().innerText();

  // Unlinked, they move on their own.
  await dialog.getByRole('checkbox', { name: 'link the zoom' }).uncheck();
  await dialog.locator('[data-palm-side]').first().getByRole('button', { name: 'Zoom in' }).click();
  await expect.poll(async () => (await zooms.first().innerText())).not.toEqual(together);
  await expect(zooms.last()).toHaveText(together);

  // Linked again, fitting one fits both.
  await dialog.getByRole('checkbox', { name: 'link the zoom' }).check();
  await dialog.locator('[data-palm-side]').last().getByRole('button', { name: 'Fit to window' }).click();
  await expect(zooms.first()).toHaveText('100%');
  await expect(zooms.last()).toHaveText('100%');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(errors).toEqual([]);
});
