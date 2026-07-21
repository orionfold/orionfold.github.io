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
  test(`diagram memo renders SVG instead of plaintext in ${theme} theme`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    await page.addInitScript((value) => localStorage.setItem('of-theme', value), theme);
    await page.goto('/relay/memos/why-relay-packs/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const diagram = page.locator('article .fn-diagram').first();
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('svg')).toBeVisible();
    await expect(diagram.locator('ellipse')).toHaveCount(1);
    await expect(diagram.locator('figcaption')).toBeVisible();
    await expect(page.locator('article pre.astro-code')).toHaveCount(0);
    await expect(page.getByText(/Editorial status ·/i)).toHaveCount(0);
    expect((await page.locator('article').innerText())).not.toContain('<ellipse');
    expect(runtimeErrors).toEqual([]);
  });
}
