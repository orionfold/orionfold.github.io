import { expect, test } from './fixtures';

// Paper R4 (G-143, operator culling 2026-10-30): /flow/ no longer carries the
// Paths Home mock; the home's Paths grid and /flow/paths/ show every Path.

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
  // Paper R1 (G-140): Compare lives in the Flow menu, five tools then All.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#main-nav [data-pp-menu="flow"]').click();
  await expect(page.locator('[data-pp-panel="flow"] a[href="/flow/compare/"]')).toHaveText('All comparisons →');
  // The hub previews each page: three sourced rows per tool, the paths the
  // pages start with, and the limits that hold everywhere.
  const tools = page.locator('.fc-tool');
  await expect(tools).toHaveCount(8);
  for (const tool of await tools.all()) {
    await expect(tool.locator('.fp-compare tbody tr')).toHaveCount(3);
    await expect(tool.locator('a.fp-all')).toHaveAttribute('href', /^\/flow\/compare\/[a-z-]+\/$/);
  }
  await expect(page.locator('.fc-start .ps')).not.toHaveCount(0);
  // The Custom GPTs page starts from a Playbook, not a path.
  await expect(page.locator('.fc-domain-start a')).toHaveAttribute('href', '/playbooks/ai-consulting/');
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
    if (slug === 'obsidian') {
      const example = page.getByRole('region', { name: 'Try one Markdown workflow' });
      await expect(example).toContainText('macOS 26 or later');
      await expect(example).toContainText('10 Pro Days');
      const download = example.getByRole('link', { name: 'Download Flow for Mac' });
      await expect(download).toHaveAttribute('data-flow-download', 'flow-compare-obsidian-example');
      expect(await download.evaluate(link => getComputedStyle(link).color)).toBe('rgb(255, 255, 255)');
      await expect(page.getByRole('link', { name: 'Try Flow ↓' })).toHaveAttribute('href', '#quick-start');
      await expect(example.getByRole('checkbox')).toHaveCount(0);
    }
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
  // Paper R1 (G-140): every group in a menu panel lists five at most, then All.
  const groups = page.locator('[data-pp-panel]:not([data-pp-panel="all"]) .pp-grp');
  expect(await groups.count()).toBeGreaterThan(0);
  for (const group of await groups.all()) {
    expect(await group.locator('a:not(.pp-link)').count()).toBeLessThanOrEqual(5);
  }
  for (const key of ['flow', 'domains', 'paths', 'elements']) await expect(page.locator(`[data-pp-panel="${key}"] a.pp-link`)).toHaveCount(1);
  await expect(page.locator('[data-pp-panel="flow"] a[href="/flow/compare/word/"]')).toHaveCount(0);
});

test('the Paths nav item carries a dropdown of the first five paths', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/flow/compare/');
  await page.locator('#main-nav [data-pp-menu="paths"]').click();
  const dd = page.locator('[data-pp-panel="paths"]');
  await expect(dd).toBeVisible();
  const items = dd.locator('a[href^="/flow/paths/"]:not(.pp-link)');
  await expect(items).toHaveCount(5);
  await expect(dd.locator('a.pp-link')).toHaveAttribute('href', '/flow/paths/');
  // Only the first five by order; the sixth waits on All paths.
  await expect(dd.locator('a[href="/flow/paths/status-from-what-you-have/"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dd).toBeHidden();
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
    // Captured feature walks: the three Flow 3.0 walks plus the four in the Flow 4 series (2026-11-07).
    await expect(cards.locator('.ps-capture img')).toHaveCount(route === '/' ? 2 : 7);
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
    await expect(page.locator('.pp-long-crumb')).toContainText(/flow path/i);
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
  // Paper R2 (G-141): the home has no Why Flow stats; /flow/ keeps its own.
  for (const route of ['/flow/']) {
    await page.goto(route);
    // Paper R4 (G-143): the measured numbers are a Paper stat strip.
    const links = page.locator('.pp-stats figcaption a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const href of new Set(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href'))))) {
      const res = await page.request.get(href!);
      expect(res.status(), href!).toBe(200);
    }
  }
});
