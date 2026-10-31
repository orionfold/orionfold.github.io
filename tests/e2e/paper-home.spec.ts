import { test, expect } from '@playwright/test';

// Paper R2 (G-141, operator 2026-10-30): the home is the town-study prototype.
// Each interaction works, the copy that carries a rule stays, and nothing
// spills past the viewport at desktop or phone width.
for (const width of [1440, 390]) {
  test(`Paper home renders whole and clears the shell at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('body')).toHaveClass(/\bpaper\b/);
    await expect(page.locator('h1.pp-h1')).toHaveText(/Show how you work\.\s*AI follows it\.\s*You make the call\./);
    const geometry = await page.evaluate(() => ({
      nav: document.querySelector('#nav-wrapper')!.getBoundingClientRect().bottom,
      h1: document.querySelector('h1.pp-h1')!.getBoundingClientRect().top,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    }));
    expect(geometry.h1).toBeGreaterThanOrEqual(geometry.nav);
    expect(geometry.overflow).toBe(false);
    for (const id of ['domains', 'elements', 'paths', 'clients', 'meet', 'pricing', 'waitlist']) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.getByText('People shown are AI-generated models, not customers.')).toBeVisible();
    // Each Flow Playbook mock names a made-up client and says so.
    await expect(page.locator('#domains .pp-dm-panel:not([hidden]) .hs-note')).toContainText('the client is made up');
    expect(errors).toEqual([]);
  });
}

test('with reduced motion the hero shows the finished playbook, step 3 left to the expert', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duo = page.locator('.pp-duo');
  await expect(duo).toHaveAttribute('data-act', 'page');
  await expect(duo.locator('.pp-pb-steps li')).toHaveCount(3);
  await expect(duo.locator('.pp-pb-steps li').nth(2)).toContainText('YOUR CALL');
  await expect(page.locator('[data-pp-toggle]')).toHaveAttribute('aria-pressed', 'false');
});

test('hero controls pause, step back and forward, and jump to a Fold (operator 2026-10-30)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const duo = page.locator('.pp-duo');
  const status = page.locator('[data-pp-status]');
  await page.locator('[data-pp-next]').click();
  await expect(duo).toHaveAttribute('data-act', 'talk');
  await expect(status).toContainText('Tally the crane, the conversation');
  await expect(page.locator('[data-pp-said]')).toContainText('I explain every change over 5 percent');
  await page.locator('[data-pp-next]').click();
  await expect(duo).toHaveAttribute('data-act', 'page');
  await expect(page.locator('[data-pp-sheet] h3')).toHaveText('Month-end close');
  await page.locator('[data-pp-prev]').click();
  await expect(duo).toHaveAttribute('data-act', 'talk');
  await page.locator('[data-pp-go="7"]').click();
  await expect(page.locator('[data-pp-go="7"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-pp-who]')).toHaveText('Hop the frog');
  await page.locator('[data-pp-toggle]').click();
  await expect(page.locator('[data-pp-toggle]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-pp-toggle]').click();
  await expect(page.locator('[data-pp-toggle]')).toHaveAttribute('aria-pressed', 'false');
});

test('Playbooks tabs play each blueprint’s own client job, and a change can be taken', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const tabs = page.locator('#domains [role="tab"]');
  await expect(tabs).toHaveCount(4);
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  const contract = page.locator('#dm-contract-review');
  await expect(contract).toBeVisible();
  await expect(page.locator('#dm-accounting-advisory')).toBeHidden();
  // Each tab is the blueprint's own mock: its steps draw different Elements.
  await contract.locator('[data-story-go="1"]').click();
  await expect(contract.locator('.dmk')).toHaveAttribute('data-story-scene', '1');
  await expect(contract.locator('.dmk-scene[data-s="1"] .dmk-block-h')).toContainText('Diff');
  await tabs.nth(0).press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
});

test('the clients panel plays the live round trip, ending with the update the client reviews', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const story = page.locator('#clients .hd-story');
  await expect(story).toHaveCount(1);
  await story.locator('[data-story-go="4"]').click();
  await expect(story).toHaveAttribute('data-story-scene', '4');
});

test('Elements chips filter the rail, and every card is a real link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // Operator 2026-10-30: an even grid, and every filter shows a balanced set of eight.
  const rail = page.locator('[data-pp-rail]').first();
  const cards = rail.locator('.pp-card');
  expect(await cards.count()).toBe(40);
  await expect(rail.locator('.pp-card:not([hidden])')).toHaveCount(8);
  // Operator 2026-10-30: charts and diagrams are separate tabs.
  await expect(rail.locator('.pp-chips button')).toHaveText(['All', 'Components', 'Agency', 'Skills', 'Charts', 'Diagrams']);
  for (const kind of ['Components', 'Agency', 'Skills', 'Charts', 'Diagrams', 'All']) {
    await rail.locator('.pp-chips button', { hasText: kind }).click();
    await expect(rail.locator('.pp-card:not([hidden])')).toHaveCount(8);
  }
  const rows = await rail.locator('.pp-card:not([hidden])').evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  expect(rows).toBe(2);
  expect(await rail.locator('.pp-rail').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  for (const href of await cards.evaluateAll((as) => as.map((a) => a.getAttribute('href')))) expect(href).toMatch(/^\/flow\/elements\/[a-z-]+\/#[a-z0-9-]+$/);
});

test('both home downloads keep their attribution, and the old #waitlist anchor lands on the closing call', async ({ page }) => {
  await page.goto('/#waitlist');
  await expect(page.locator('#waitlist [data-flow-download="home-living-documents"]')).toHaveCount(1);
  await expect(page.locator('.pp-hero [data-flow-download="home-hero"]')).toHaveCount(1);
  // The site scrolls smoothly, so wait for the landing to settle in view.
  await expect.poll(() => page.evaluate(() => document.querySelector('#waitlist')!.getBoundingClientRect().top)).toBeLessThan(900);
});

test('each plan shows what it includes on request, from the shared plan lists (operator 2026-10-30)', async ({ page }) => {
  await page.goto('/');
  const more = page.locator('#pricing ~ .pp-price .pp-price-more');
  await expect(more).toHaveCount(3);
  for (const d of await more.all()) await expect(d).not.toHaveAttribute('open', '');
  await more.nth(1).locator('summary').click();
  await expect(more.nth(1).locator('li').first()).toContainText('Chat with a Flow Playbook');
  await expect(more.nth(1).locator('li', { hasText: 'Agentic runs' })).toBeVisible();
  await more.nth(2).locator('summary').click();
  await expect(more.nth(2)).toContainText('a Flow Playbook to a GitHub repository');
  await expect(page.locator('#meet a[href="/flow/#pricing"]')).toHaveCount(0);
});
