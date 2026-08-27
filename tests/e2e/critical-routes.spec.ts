import { expect, test, type Page } from '@playwright/test';

const criticalRoutes = [
  '/',
  '/flow/',
  '/flow/writing-with-ai/',
  '/flow/receipts/',
  '/flow/models-and-runtime/',
  '/flow/documents-and-files/',
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

// The site has ONE appearance. The saved/system theme runtime was retired
// (scripts/test/theme-default.test.mjs guards the source), so every route must
// paint light and stay light, including for a visitor whose browser still
// carries the old `of-theme` preference from before the change.
for (const route of criticalRoutes) {
  test(`${route} renders its primary surface`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const response = await page.goto(route);

    expect(response?.ok(), `${route} returned ${response?.status()}`).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });
}

test('a stale saved dark preference no longer changes the appearance', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('of-theme', 'dark'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme-mode', /.*/);
  await expect(page.locator('#theme-toggle')).toHaveCount(0);
});

for (const route of ['/', '/flow/', '/flow/receipts/', '/relay/', '/relay/host/', '/relay/host/linux-vm/', '/training/relay-operator-workshop/', '/proposal/'] as const) {
  test(`${route} has no document-level overflow at 390px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
