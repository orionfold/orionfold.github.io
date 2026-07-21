import { expect, test, type Page } from '@playwright/test';

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const theme of ['light', 'dark'] as const) {
  test(`proposal calculator and sticky summary work in ${theme} theme`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.addInitScript((value) => localStorage.setItem('of-theme', value), theme);
    await page.goto('/proposal/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const sticky = page.locator('#proposal-sticky-summary');
    await expect(sticky).toBeVisible();
    await expect(page.locator('#sticky-savings')).toHaveText('$0.00');
    await expect(page.locator('#sticky-final')).toHaveText('$0.00');
    await expect(page.locator('#summary-subtotal')).toHaveText('$0.00');

    const productCard = page.locator('[data-offer-card="proof-founding"]');
    const productCheckbox = productCard.locator('input[name="selectedOffers"]');
    await productCard.click({ position: { x: 16, y: 16 } });
    await expect(productCheckbox).toBeChecked();
    await expect(page.locator('#sticky-selection-summary')).not.toHaveText(/select a consulting/i);
    await expect(page.locator('#summary-lines > div')).toHaveCount(1);
    await expect(page.locator('#summary-subtotal')).not.toHaveText('$0.00');
    await expect(page.locator('#sticky-savings')).not.toHaveText('$0.00');
    await expect(page.locator('#sticky-final')).not.toHaveText('$0.00');
    const productOnlyTotal = await page.locator('#sticky-final').textContent();

    const tenHourCard = page.locator('.cap-card').filter({ hasText: '10 hours' });
    await tenHourCard.click();
    await expect(tenHourCard.locator('input[name="consultingHours"]')).toBeChecked();
    await expect(page.locator('#summary-lines > div')).toHaveCount(2);
    await expect(page.locator('#sticky-final')).not.toHaveText(productOnlyTotal ?? '');

    await productCard.click({ position: { x: 16, y: 16 } });
    await expect(productCheckbox).not.toBeChecked();
    await expect(page.locator('#summary-lines > div')).toHaveCount(1);
    await expect(page.locator('#sticky-selection-summary')).toContainText(/10-hour/);

    expect(runtimeErrors).toEqual([]);
  });
}

test('proposal sticky summary remains on-screen at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('of-theme', 'light'));
  await page.goto('/proposal/');
  await page.locator('[data-offer-card="proof-founding"]').click({ position: { x: 16, y: 16 } });

  const sticky = page.locator('#proposal-sticky-summary');
  await expect(sticky).toHaveClass(/is-visible/);
  await expect.poll(async () => {
    const box = await sticky.boundingBox();
    return box ? Math.ceil(box.y + box.height) : Number.POSITIVE_INFINITY;
  }).toBeLessThanOrEqual(844);
  const box = await sticky.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await expect(page.locator('#sticky-final')).not.toHaveText('$0.00');
});
