import { expect, test, type Page } from '@playwright/test';

const criticalRoutes = [
  '/',
  '/relay/',
  '/relay/host/',
  '/relay/host/linux-vm/',
  '/relay/memos/',
  '/training/',
  '/training/relay-operator-workshop/',
  '/proposal/',
  '/books/',
  '/software/',
  '/proof/',
  '/receipts/',
  '/story/',
  '/terms/',
  '/privacy/',
] as const;

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const theme of ['light', 'dark'] as const) {
  for (const route of criticalRoutes) {
    test(`${route} renders its primary surface in ${theme} theme`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page);
      await page.addInitScript((value) => localStorage.setItem('of-theme', value), theme);
      const response = await page.goto(route);

      expect(response?.ok(), `${route} returned ${response?.status()}`).toBe(true);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      expect(runtimeErrors).toEqual([]);
    });
  }
}

for (const route of ['/', '/relay/', '/relay/host/', '/relay/host/linux-vm/', '/training/relay-operator-workshop/', '/proposal/'] as const) {
  test(`${route} has no document-level overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem('of-theme', 'light'));
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test('the visible theme control persists an explicit user choice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('of-theme', 'light'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'light');
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme-mode', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
