import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible } from './helpers';

// The Aṣṭakavarga beyond the Bhinna and Sarva tables: the Prastāra, the Trikoṇa and Ekādhipatya Śodhana with the Piṇḍas (BPHS 67–69),
// and the Kakṣyā. The numbers themselves are checked against PyJHora in the unit tests; here the views are there and agree with each other.

test('ANALYSIS Aṣṭakavarga shows the Prastāra, the Śodhana with the Piṇḍas and the Kakṣyā', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await calculateChart(page);
  await selectWorkspace(page, 'ANALYSIS');
  await visible(page, page.getByRole('button', { name: 'Aṣṭakavarga', exact: true })).click();
  const part = (name: string) => visible(page, page.getByRole('group', { name: /Aṣṭakavarga parts/i }).getByRole('button', { name, exact: true }));

  // The Prastāra of the Sun: the eight contributors and the Bhinnāṣṭakavarga under them, 48 bindu in all.
  await part('Prastāra').click();
  const prastara = visible(page, page.locator('[data-prastara]'));
  await expect(prastara.locator('tbody tr')).toHaveCount(9);
  await expect(prastara.locator('tbody tr').last().locator('td').last()).toHaveText('48');

  // The Śodhana: three rows for a graha, and the Piṇḍas of the seven.
  await part('Śodhana & Piṇḍa').click();
  const shodhana = visible(page, page.locator('[data-shodhana]'));
  await expect(shodhana.locator('tbody tr')).toHaveCount(4);
  const total = async (row: number) => Number(await shodhana.locator('tbody tr').nth(row).locator('td').last().textContent());
  expect(await total(1)).toBeLessThanOrEqual(await total(0));
  expect(await total(2)).toBeLessThanOrEqual(await total(1));
  const pinda = visible(page, page.locator('[data-pinda]'));
  await expect(pinda.locator('tbody tr')).toHaveCount(3);
  // The Śodhya Piṇḍa is the Rāśi Piṇḍa and the Graha Piṇḍa added, for each graha.
  const cells = async (row: number) => (await pinda.locator('tbody tr').nth(row).locator('td').allTextContents()).map(Number);
  const [rasi, graha, sodhya] = [await cells(0), await cells(1), await cells(2)];
  expect(sodhya).toEqual(rasi.map((value, index) => value + graha[index]));
  // The rules of PyJHora can be chosen, and the page says how they differ.
  await visible(page, page.getByLabel('Rules')).selectOption('pyjhora');
  await expect(visible(page, page.getByText(/PyJHora differs from the verses/))).toBeVisible();

  // The Kakṣyā of the seven grahas.
  await part('Kakṣyā').click();
  await expect(visible(page, page.locator('[data-kakshya]')).locator('tbody tr')).toHaveCount(7);

  // And back to the tables.
  await part('Bhinna & Sarva').click();
  await expect(visible(page, page.getByText('SAV', { exact: true }))).toBeVisible();
  expect(errors).toEqual([]);
});
