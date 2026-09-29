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
  await expect(page.locator('#main-nav .living-nav-links .living-nav-dd > a[href="/flow/compare/"]')).toHaveText('Compare');
  await page.goto('/flow/compare/notion/');
  const rows = page.locator('.fp-compare tbody tr');
  expect(await rows.count()).toBeGreaterThanOrEqual(4);
  for (const row of await rows.all()) await expect(row.locator('td').first()).toContainText('Source:');
  await expect(page.locator('#sources + ul a').first()).toHaveAttribute('href', /^https:\/\//);
});

test('the Paths nav item carries a dropdown of the first five paths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/flow/compare/');
  const dd = page.locator('#main-nav .living-nav-dd').filter({ has: page.locator('> a[href="/flow/paths/"]') });
  await dd.hover();
  const items = dd.locator('.living-nav-dd-panel a[href^="/flow/paths/"]:not(.living-nav-dd-all)');
  await expect(items).toHaveCount(5);
  await expect(dd.locator('.living-nav-dd-all')).toHaveAttribute('href', '/flow/paths/');
  // A draft path never reaches the menu on the built site.
  await expect(dd.locator('a[href="/flow/paths/status-from-what-you-have/"]')).toHaveCount(0);
});

test('Compare sets Flow vocabulary apart from ordinary copy', async ({ page }) => {
  await page.goto('/flow/compare/notion/');
  const terms = page.locator('main .flow-term');
  await expect(terms.filter({ hasText: 'I accept changes' }).first()).toBeVisible();
  await expect(terms.filter({ hasText: 'Add Folder' }).first()).toBeVisible();
  const color = await terms.first().evaluate((el) => getComputedStyle(el).color);
  const body = await page.locator('.fp-compare td').first().evaluate((el) => getComputedStyle(el).color);
  expect(color).not.toBe(body);
});

for (const route of ['/', '/flow/paths/']) {
  test(`${route} shows paths as native showcase mocks, not screenshots`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const cards = page.locator('.ps');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await expect(cards.locator('img[src*="/flow/paths/"], img[src*="flow%2Fpaths"]')).toHaveCount(0);
    await expect(page.locator('.ps--hero [data-flow-mock]').first()).toHaveAttribute('data-stage', '4');
    for (const link of await cards.locator('a.ps-link').all()) await expect(link).toHaveAttribute('href', /^\/flow\/paths\/[a-z-]+\/$/);
  });
}

test('every "Why Flow" data point links to the path it was measured on', async ({ page }) => {
  for (const route of ['/', '/flow/']) {
    await page.goto(route);
    const links = page.locator('.wow figcaption a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const href of new Set(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href'))))) {
      const res = await page.request.get(href!);
      expect(res.status(), href!).toBe(200);
    }
  }
});
