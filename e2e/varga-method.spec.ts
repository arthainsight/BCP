import { expect, test } from '@playwright/test';
import { calculateChart, selectWorkspace, visible } from './helpers';

// Settings → display → "rule of the divisional charts": the Parivṛtti ways of placing the parts of the signs. The charts say
// which divisions follow the rule, and the strengths keep the Parāśara one.

test('the divisional charts can follow a Parivṛtti rule, and say so', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await calculateChart(page);

  // D10 is on the division bar; the Parāśara rule is the one to begin with, and nothing is said about another.
  await visible(page, page.getByRole('button', { name: 'D10', exact: true })).click();
  await expect(page.getByText(/Parivṛtti rule/)).toHaveCount(0);

  await selectWorkspace(page, '⚙');
  const rule = visible(page, page.getByLabel('rule of the divisional charts'));
  await expect(rule).toHaveValue('parasara');
  await rule.selectOption('parivritti-cyclic');
  await expect(rule).toHaveValue('parivritti-cyclic');
  // The Settings say which divisions it is for.
  await expect(visible(page, page.getByText(/Divisions with this rule:.*D10/))).toBeVisible();

  // Back on the chart, D10 is marked as following the rule; D1 and D9 are not (the cyclic rule has none for D9).
  await selectWorkspace(page, 'CHART');
  await expect(visible(page, page.getByText(/Parivṛtti rule: D10/))).toBeVisible();
  await expect(page.getByText(/Parivṛtti rule: .*D9/)).toHaveCount(0);

  // The choice is kept over a reload.
  await page.reload();
  await selectWorkspace(page, '⚙');
  await expect(visible(page, page.getByLabel('rule of the divisional charts'))).toHaveValue('parivritti-cyclic');
  expect(errors).toEqual([]);
});
