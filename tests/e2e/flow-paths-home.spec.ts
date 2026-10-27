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
    // One chip per path, and no two chips share a label.
    const labels = await demo.locator('[data-chip]').allTextContents();
    expect(labels.length).toBe(new Set(labels).size);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('a path page renders its receipt and links back to all paths', async ({ page }) => {
  await page.goto('/flow/paths/investor-update/');
  await expect(page.locator('h1')).toHaveText('The investor update that reads the market for you');
  await expect(page.locator('.fp-receipt dd').first()).toContainText('79 s');
  await expect(page.locator('#evidence')).toBeVisible();
  await expect(page.locator('.fp-caveat')).toHaveCount(0);
  // A path names what the released build still does differently.
  await page.goto('/flow/paths/status-from-what-you-have/');
  await expect(page.locator('.fp-caveat')).toContainText('blank for 3 to 5 seconds');
  await page.goto('/flow/paths/weekly-issue/');
  await expect(page.locator('.fp-caveat')).toHaveCount(0);
});

test('Compare pages are linked from the nav and each row cites a source', async ({ page }) => {
  await page.goto('/flow/compare/');
  const cards = page.locator('.fp-tools a');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('#main-nav .living-nav-links .living-nav-dd > a[href="/flow/compare/"]')).toHaveText('Compare');
  // The hub previews each page: three sourced rows per tool, the paths the
  // pages start with, and the limits that hold everywhere.
  const tools = page.locator('.fc-tool');
  await expect(tools).toHaveCount(8);
  for (const tool of await tools.all()) {
    await expect(tool.locator('.fp-compare tbody tr')).toHaveCount(3);
    await expect(tool.locator('a.fp-all')).toHaveAttribute('href', /^\/flow\/compare\/[a-z-]+\/$/);
  }
  await expect(page.locator('.fc-start .ps')).not.toHaveCount(0);
  // The Custom GPTs page starts from a Domain, not a path.
  await expect(page.locator('.fc-domain-start a')).toHaveAttribute('href', '/domains/ai-consulting-starter/');
  await expect(page.locator('.fc-not li')).toHaveCount(5);
  await page.goto('/flow/compare/notion/');
  const rows = page.locator('.fp-compare tbody tr');
  expect(await rows.count()).toBeGreaterThanOrEqual(4);
  for (const row of await rows.all()) await expect(row.locator('td').first()).toContainText('Source:');
  await expect(page.locator('#sources + ul a').first()).toHaveAttribute('href', /^https:\/\//);
});

// Every Compare page opens on the job, the moment, the choices and what
// breaks, and fits a phone without any box running past the screen edge.
for (const slug of ['notion', 'obsidian', 'custom-gpts', 'claude-code', 'codex', 'hermes-openclaw', 'word', 'canva']) {
  test(`Compare ${slug} leads with the job and fits a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const response = await page.goto(`/flow/compare/${slug}/`);
    expect(response?.status()).toBe(200);
    for (const lead of ['The job.', 'The moment.', 'Your choices.', 'What breaks.']) await expect(page.locator('main strong', { hasText: lead })).toHaveCount(1);
    const over = await page.evaluate(() => [...document.querySelectorAll('main *')].filter((el) => {
      if (el.closest('table, .fp-compare, .living-origami')) return false; // the CTA's paper art bleeds by design
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.right > innerWidth + 1;
    }).map((el) => el.className).slice(0, 5));
    expect(over).toEqual([]);
  });
}

test('every nav menu shows at most its top five, then its All link', async ({ page }) => {
  // Design rule (operator 2026-10-27): a dropdown never lists more than five.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/flow/compare/');
  const menus = page.locator('#main-nav .living-nav-dd');
  expect(await menus.count()).toBeGreaterThan(0);
  for (const dd of await menus.all()) {
    const items = dd.locator('.living-nav-dd-panel a:not(.living-nav-dd-all)');
    expect(await items.count()).toBeLessThanOrEqual(5);
    await expect(dd.locator('.living-nav-dd-all')).toHaveCount(1);
  }
  const compare = menus.filter({ has: page.locator('> a[href="/flow/compare/"]') });
  await expect(compare.locator('a[href="/flow/compare/word/"]')).toHaveCount(0);
});

test('the Paths nav item carries a dropdown of the first five paths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/flow/compare/');
  const dd = page.locator('#main-nav .living-nav-dd').filter({ has: page.locator('> a[href="/flow/paths/"]') });
  await dd.hover();
  const items = dd.locator('.living-nav-dd-panel a[href^="/flow/paths/"]:not(.living-nav-dd-all)');
  await expect(items).toHaveCount(5);
  await expect(dd.locator('.living-nav-dd-all')).toHaveAttribute('href', '/flow/paths/');
  // Only the first five by order; the sixth waits on All paths.
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

// Paths live on /flow/ only (operator 2026-10-27: no section on both front doors).
for (const route of ['/flow/paths/']) {
  test(`${route} shows path mocks and the captured feature walks`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const cards = page.locator('.ps');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    await expect(cards.locator('.ps-capture img')).toHaveCount(route === '/' ? 2 : 3);
    if (route === '/') await expect(page.locator('.ps--hero [data-flow-mock]').first()).toHaveAttribute('data-stage', '4');
    else await expect(page.locator('.ps--hero .ps-capture img')).toBeVisible();
    for (const link of await cards.locator('a.ps-link').all()) await expect(link).toHaveAttribute('href', /^\/flow\/paths\/[a-z-]+\/$/);
  });
}

for (const slug of ['the-canvas', 'diagrams-draw-anywhere', 'a-checklist-you-can-sign']) {
  test(`Flow 3.0 ${slug} has working evidence and workflow-specific starting steps`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const response = await page.goto(`/flow/paths/${slug}/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.ed-article-kicker')).toContainText('FLOW PATH');
    await expect(page.locator('main')).not.toContainText('Flow 3.0');
    await expect(page.locator('#try-this-path')).toContainText('Guide');
    await expect(page.locator('#try-this-path')).not.toContainText('open an empty folder');
    const href = await page.locator('.fp-receipt-note a').getAttribute('href');
    expect(href).toBe('#the-numbers');
    await expect(page.locator(href!)).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    if (slug === 'the-canvas') {
      await expect(page.locator('video')).toHaveAttribute('controls', '');
      await expect(page.locator('video track')).toHaveCount(0);
    }
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
