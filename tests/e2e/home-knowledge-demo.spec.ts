import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`homepage knowledge map builds and reviews a connection at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const demo = page.locator('[data-demo-narrative="knowledge"]');
    const graph = demo.locator('[data-knowledge-graph]');
    const themes = graph.locator('[data-knowledge-reveal="1"]').first();
    const proposal = graph.locator('g[data-knowledge-proposal]').first();
    const next = demo.locator('[data-demo-next]');
    await expect(graph).toBeVisible();
    await expect(demo.locator('.ls-mini-chart')).toHaveCount(0);
    await expect(graph.locator('[data-knowledge-source]')).toHaveCount(2);
    await expect(demo.locator('[data-demo-stage]')).toHaveCount(4);
    await expect(themes).toHaveCSS('visibility', 'hidden');
    await expect(proposal).toHaveCSS('visibility', 'hidden');
    await expect(demo.locator('[data-demo-keep]')).toBeDisabled();

    await next.click();
    await expect(themes).toHaveCSS('visibility', 'visible');
    await expect(proposal).toHaveCSS('visibility', 'hidden');
    await expect(demo.locator('[data-demo-title]')).toHaveText('Sources become connections.');
    await next.click();
    await expect(proposal).toHaveCSS('visibility', 'visible');
    await expect(demo.locator('.ls-overnight-note p')).toContainText('Proposed:');
    await next.click();
    await expect(demo.locator('[data-demo-title]')).toHaveText('Decide what belongs.');
    await expect(next).toBeDisabled();
    await demo.locator('[data-demo-revert]').click();
    await expect(demo).toHaveAttribute('data-step', '5');
    await expect(proposal).toHaveCSS('visibility', 'hidden');
    await expect(themes).toHaveCSS('visibility', 'visible');
    await expect(demo.locator('.ls-overnight-note p')).toContainText('Previous note:');
    await expect(demo.locator('[data-demo-decision]')).toContainText('Named sources remain.');

    await demo.locator('[data-demo-replay]').click();
    await expect(demo).toHaveAttribute('data-step', '0');
    await expect(themes).toHaveCSS('visibility', 'hidden');
    await expect(demo.locator('[data-demo-decision]')).toHaveText('');
    for (let stage = 0; stage < 3; stage++) await next.click();
    await demo.locator('[data-demo-keep]').click();
    await expect(demo).toHaveAttribute('data-step', '4');
    await expect(proposal).toHaveCSS('visibility', 'visible');
    await expect(proposal).toHaveCSS('stroke-dasharray', 'none');
    await expect(demo.locator('.ls-overnight-note p')).toContainText('Kept:');
    await expect(page.locator('body')).toHaveAttribute('data-motion', 'off');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });
}

test('Flow retains its table and chart briefing narrative', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/flow/');
  const demo = page.locator('[data-demo]').first();
  await expect(demo.locator('[data-knowledge-graph]')).toHaveCount(0);
  await expect(demo.locator('.ls-mini-chart')).toHaveCount(1);
  await expect(demo.locator('[data-demo-title]')).toHaveText('Your next useful version.');
  await demo.locator('[data-demo-next]').click();
  await expect(demo.locator('[data-demo-title]')).toHaveText('One update file changed.');
  await demo.locator('[data-demo-next]').click();
  await expect(demo.locator('[data-demo-bottom]')).toHaveText('Table and chart redrawn');
  await demo.locator('[data-demo-next]').click();
  await expect(demo.locator('[data-demo-title]')).toHaveText('Here is what moved.');
  await demo.locator('[data-demo-revert]').click();
  await expect(demo.locator('.ls-overnight-note p')).toHaveText('Previous note: Launch was 4 of 8 tasks complete at the last review.');
});

test('homepage knowledge workflow loops through four stages and pauses offscreen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  const demo = page.locator('[data-demo-narrative="knowledge"]');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toBeInViewport({ ratio: 0.2 });
  await page.clock.runFor(500);
  await demo.locator('[data-demo-replay]').click();
  for (const stage of [1, 2, 3]) {
    await page.clock.runFor(3000);
    await expect(demo).toHaveAttribute('data-step', String(stage));
  }
  await page.clock.runFor(8000);
  await expect(demo).toHaveAttribute('data-step', '0');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(demo).not.toBeInViewport();
  await page.clock.runFor(500);
  const offscreenStep = await demo.getAttribute('data-step');
  await page.clock.runFor(12000);
  await expect(demo).toHaveAttribute('data-step', offscreenStep!);
});
