import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`/flow/ Paths Home chips swap the featured path at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/flow/');
    const demo = page.locator('[data-paths-home]');
    await demo.scrollIntoViewIfNeeded();
    const visible = demo.locator('[data-panel]:not([hidden])');
    await expect(visible).toHaveCount(1);
    await expect(visible.getByRole('link', { name: /Read the walkthrough/ })).toHaveAttribute('href', '/flow/paths/investor-update/');
    const agents = demo.getByRole('button', { name: 'Agents' });
    await agents.click();
    await expect(agents).toHaveAttribute('aria-pressed', 'true');
    await expect(visible).toHaveCount(1);
    await expect(visible.getByRole('link', { name: /Read the walkthrough/ })).toHaveAttribute('href', '/flow/paths/review-agents/');
    // A draft path never reaches the built site.
    await expect(demo.getByRole('button', { name: 'Teams' })).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('a path page renders its receipt and links back to all paths', async ({ page }) => {
  await page.goto('/flow/paths/investor-update/');
  await expect(page.locator('h1')).toHaveText('The investor update that reads the market for you');
  await expect(page.locator('.fp-receipt dd').first()).toContainText('79 s');
  await expect(page.locator('#evidence')).toBeVisible();
  const status = await page.request.get('/flow/paths/status-from-what-you-have/');
  expect(status.status()).toBe(404);
});

test('Compare pages are linked from the nav and each row cites a source', async ({ page }) => {
  await page.goto('/flow/compare/');
  const cards = page.locator('.fp-tools a');
  await expect(cards).toHaveCount(4);
  await expect(page.locator('#main-nav .living-nav-links a[href="/flow/compare/"]')).toHaveText('Compare');
  await page.goto('/flow/compare/notion/');
  const rows = page.locator('.fp-compare tbody tr');
  expect(await rows.count()).toBeGreaterThanOrEqual(4);
  for (const row of await rows.all()) await expect(row.locator('td').first()).toContainText('Source:');
  await expect(page.locator('#sources + ul a').first()).toHaveAttribute('href', /^https:\/\//);
});
