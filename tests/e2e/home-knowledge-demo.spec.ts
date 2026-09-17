import { expect, test } from './fixtures';

for (const width of [1440, 390]) {
  test(`homepage Research Jobs requires approval or decline at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.goto('/');
    const demo = page.locator('[data-demo-narrative="knowledge"]');
    const graph = demo.locator('[data-knowledge-graph]');
    const evidence = graph.locator('[data-knowledge-reveal="1"]').first();
    const proposal = graph.locator('g[data-knowledge-proposal]').first();
    const next = demo.locator('[data-demo-next]');
    const approve = demo.locator('[data-demo-keep]');
    const decline = demo.locator('[data-demo-revert]');
    await demo.scrollIntoViewIfNeeded();
    await expect(graph).toBeVisible();
    await expect(demo.locator('.ls-window-bar')).toContainText('Research Jobs');
    await expect(demo.locator('.ls-mini-chart')).toHaveCount(0);
    await expect(graph.locator('[data-knowledge-source]')).toHaveCount(2);
    await expect(demo.locator('[data-demo-stage]')).toHaveCount(4);
    await expect(demo.locator('[data-demo-title]')).toHaveText('Make your Jobs visible.');
    await expect(evidence).toHaveCSS('visibility', 'hidden');
    await expect(proposal).toHaveCSS('visibility', 'hidden');
    await expect(approve).toHaveText('Approve');
    await expect(decline).toHaveText('Decline');
    await expect(approve).toBeDisabled();
    await expect(decline).toBeDisabled();
    await page.clock.runFor(12000);
    await expect(demo).toHaveAttribute('data-step', '0');

    await next.click();
    await expect(evidence).toHaveCSS('visibility', 'visible');
    await expect(proposal).toHaveCSS('visibility', 'hidden');
    await expect(demo.locator('[data-demo-title]')).toHaveText('The steps are in your words.');
    await next.click();
    await expect(proposal).toHaveCSS('visibility', 'visible');
    await expect(demo.locator('[data-demo-title]')).toHaveText('A visual to consider.');
    await expect(demo.locator('[data-demo-bottom]')).toHaveText('Mermaid proposal · Not applied');
    await expect(approve).toBeDisabled();
    await next.click();
    await expect(demo.locator('[data-demo-title]')).toHaveText('Decide what belongs.');
    await expect(next).toBeDisabled();
    await expect(approve).toBeEnabled();
    await expect(decline).toBeEnabled();
    await expect(demo.locator('.ls-overnight-note p')).toContainText('Nothing is added until you approve.');
    await expect(demo.locator('[data-demo-decision]')).toHaveText('');
    await decline.click();
    await expect(demo).toHaveAttribute('data-step', '5');
    await expect(proposal).toHaveCSS('visibility', 'hidden');
    await expect(evidence).toHaveCSS('visibility', 'visible');
    await expect(demo.locator('.ls-overnight-note p')).toContainText('Your original Jobs are unchanged.');
    await expect(demo.locator('[data-demo-decision]')).toHaveText('Proposal declined. Your original Jobs remain unchanged.');
    await expect(approve).toBeDisabled();
    await expect(decline).toBeDisabled();

    await demo.locator('[data-demo-replay]').click();
    await expect(demo).toHaveAttribute('data-step', '0');
    await expect(evidence).toHaveCSS('visibility', 'hidden');
    await expect(demo.locator('[data-demo-decision]')).toHaveText('');
    await page.clock.runFor(12000);
    await expect(demo).toHaveAttribute('data-step', '0');
    for (let stage = 0; stage < 3; stage++) await next.click();
    await approve.click();
    await expect(demo).toHaveAttribute('data-step', '4');
    await expect(proposal).toHaveCSS('visibility', 'visible');
    await expect(proposal).toHaveCSS('stroke-dasharray', 'none');
    await expect(demo.locator('.ls-overnight-note p')).toContainText('Approved: the diagram sits with your Jobs.');
    await expect(demo.locator('[data-demo-decision]')).toHaveText('Diagram approved and added in this illustration.');
    await expect(graph).toHaveAttribute('aria-label', /approved diagram connects the research Jobs to a human decision/);
    await page.clock.runFor(12000);
    await expect(demo).toHaveAttribute('data-step', '4');
    await expect(page.locator('body')).toHaveAttribute('data-motion', 'off');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });

  test(`Flow Jobs applies changes before independent part review at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/flow/');
    const compact = page.locator('[data-jobs-demo].jw-demo--compact');
    const full = page.locator('#jobs-workbench [data-jobs-demo]');
    await expect(page.locator('[data-jobs-demo]')).toHaveCount(2);
    for (const demo of [compact, full]) {
      await expect(demo).toHaveAttribute('data-jobs-ready', 'true');
      await expect(demo).toHaveAttribute('data-phase', 'ready');
      await expect(demo.locator('[data-input-value]')).toHaveText('11 interviews');
      await expect(demo.locator('[data-chart-value]')).toHaveText('3');
      await expect(demo.locator('[data-summary-value]')).toHaveText('Portable files: 3');
      await expect(demo.locator('[data-panel="edit"] [data-action="run"]')).toBeDisabled();
    }
    await expect(compact.locator('.jw-caption')).not.toContainText('INTERACTIVE PRODUCT WALKTHROUGH');
    await expect(compact.locator('.jw-caption [data-action="reset"]')).toBeVisible();

    // The compact hero is a working instance, not a remote control for the full demo.
    await compact.locator('[data-action="input"]').click();
    await expect(compact.locator('[data-input-value]')).toHaveText('12 interviews');
    await expect(compact.locator('[data-chart-value]')).toHaveText('3');
    await compact.locator('[data-panel="edit"] [data-action="run"]').click();
    await expect(compact).toHaveAttribute('data-phase', 'review');
    await expect(compact.locator('[data-chart-value]')).toHaveText('4');
    await expect(compact.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(compact.locator('[data-pending-count]')).toHaveText('2');
    await expect(full).toHaveAttribute('data-phase', 'ready');
    await expect(full.locator('[data-input-value]')).toHaveText('11 interviews');
    await expect(full.locator('[data-chart-value]')).toHaveText('3');

    await full.getByRole('tab', { name: 'Relations', exact: true }).click();
    await expect(full.getByRole('tab', { name: 'Relations', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(full.locator('[data-relations-view="map"]')).toBeVisible();
    await expect(full.locator('[data-relations-view="map"]')).toHaveAttribute('aria-label', /Interview Register\.md is read by Research Refresh\.md/);
    await full.getByRole('button', { name: 'List', exact: true }).click();
    await expect(full.locator('[data-relations-view="map"]')).toBeHidden();
    await expect(full.locator('[data-relations-view="list"]')).toBeVisible();
    await expect(full.locator('[data-relations-view="list"]')).toContainText('Interview Register.md');
    await expect(full.locator('[data-relations-view="list"]')).toContainText('data/review-*.json');
    await full.getByRole('tab', { name: 'Relations', exact: true }).focus();
    await page.keyboard.press('Home');
    await expect(full.getByRole('tab', { name: 'Edit', exact: true })).toBeFocused();
    await expect(full.getByRole('tab', { name: 'Edit', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(full.locator('[data-panel="edit"]')).toBeVisible();

    await full.locator('[data-action="input"]').click();
    await expect(full.locator('[data-input-value]')).toHaveText('12 interviews');
    await expect(full.locator('[data-chart-value]')).toHaveText('3');
    await expect(full.locator('[data-summary-value]')).toHaveText('Portable files: 3');
    await full.locator('[data-panel="edit"] [data-action="run"]').click();
    await expect(full).toHaveAttribute('data-phase', 'review');
    await expect(full.locator('[data-review-active] h4')).toBeFocused();
    await expect(full.locator('[data-chart-value]')).toHaveText('4');
    await expect(full.locator('[data-interview-count]')).toHaveText('12');
    await expect(full.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(full.locator('[data-pending-count]')).toHaveText('2');
    await expect(full.locator('.jw-output[data-part="chart"]')).toHaveAttribute('data-decision', 'pending');
    await expect(full.locator('.jw-output[data-part="summary"]')).toHaveAttribute('data-decision', 'pending');

    await full.getByRole('button', { name: 'Exact changes', exact: true }).click();
    await expect(full.locator('[data-doc-view]')).toBeHidden();
    await expect(full.locator('[data-exact-view]')).toBeVisible();
    await expect(full.locator('[data-diff-before]')).toHaveText('3');
    await expect(full.locator('[data-diff-after]')).toHaveText('4');
    await full.locator('.jw-review-parts [data-value="summary"]').click();
    await expect(full.locator('[data-diff-before]')).toHaveText('Portable files: 3');
    await expect(full.locator('[data-diff-after]')).toHaveText('Portable files: 4');
    await full.locator('.jw-review-parts [data-value="chart"]').click();
    await full.locator('[data-action="revert"]').click();
    await expect(full).toHaveAttribute('data-phase', 'review');
    await expect(full.locator('[data-doc-view]')).toBeVisible();
    await expect(full.locator('[data-chart-value]')).toHaveText('3');
    await expect(full.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(full.locator('.jw-output[data-part="chart"]')).toHaveAttribute('data-decision', 'reverted');
    await expect(full.locator('.jw-output[data-part="summary"]')).toHaveAttribute('data-decision', 'pending');
    await expect(full.locator('[data-pending-count]')).toHaveText('1');
    await expect(full.locator('[data-source-note]')).toContainText('12 interviews in the source.');

    await full.locator('[data-action="later"]').click();
    await expect(full).toHaveAttribute('data-phase', 'later');
    await expect(full.locator('[data-action="resume"]')).toBeFocused();
    await expect(full.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(full.locator('.jw-output[data-part="summary"]')).toHaveAttribute('data-decision', 'pending');
    await expect(full.locator('[data-status]')).toHaveText('Review paused. Remaining changes are still applied.');
    await expect(compact).toHaveAttribute('data-phase', 'review');
    await expect(compact.locator('[data-chart-value]')).toHaveText('4');
    await expect(compact.locator('[data-pending-count]')).toHaveText('2');

    await full.locator('[data-action="resume"]').click();
    await expect(full.locator('[data-review-active] h4')).toBeFocused();
    await full.locator('[data-action="keep"]').click();
    await expect(full).toHaveAttribute('data-phase', 'complete');
    await expect(full.locator('[data-review-complete] h4')).toBeFocused();
    await expect(full.locator('[data-complete-summary]')).toHaveText('Review complete. 1 kept · 1 reverted. Source input retained.');
    await expect(full.locator('[data-chart-value]')).toHaveText('3');
    await expect(full.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(full.locator('[data-input-value]')).toHaveText('12 interviews');

    await compact.locator('[data-action="keep"]').click();
    await expect(compact.locator('[data-pending-count]')).toHaveText('1');
    await expect(compact.locator('[data-chart-value]')).toHaveText('4');
    await compact.locator('[data-action="keep"]').click();
    await expect(compact).toHaveAttribute('data-phase', 'complete');
    await expect(compact.locator('[data-complete-summary]')).toContainText('2 kept · 0 reverted');
    await compact.locator('.jw-caption [data-action="reset"]').click();
    await expect(compact).toHaveAttribute('data-phase', 'ready');
    await expect(compact.locator('[data-input-value]')).toHaveText('11 interviews');
    await expect(compact.locator('[data-chart-value]')).toHaveText('3');
    await expect(full).toHaveAttribute('data-phase', 'complete');
    await expect(full.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });
}

test('homepage autoplay stops at the decision, preserves approval and pauses unfinished work offscreen', async ({ page }) => {
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
  await page.clock.runFor(12000);
  await expect(demo).toHaveAttribute('data-step', '3');
  await expect(demo.locator('[data-demo-next]')).toBeDisabled();
  await expect(demo.locator('[data-demo-keep]')).toBeEnabled();
  await expect(demo.locator('[data-demo-revert]')).toBeEnabled();
  await expect(demo.locator('[data-demo-decision]')).toHaveText('');
  await demo.locator('[data-demo-keep]').click();
  await page.clock.runFor(12000);
  await expect(demo).toHaveAttribute('data-step', '4');
  await expect(demo.locator('[data-demo-decision]')).toHaveText('Diagram approved and added in this illustration.');

  // Pause an unfinished run, not the terminal decision that already stops itself.
  await demo.locator('[data-demo-replay]').click();
  await page.clock.runFor(3000);
  await expect(demo).toHaveAttribute('data-step', '1');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(demo).not.toBeInViewport();
  await page.clock.runFor(500);
  await expect(demo).toHaveAttribute('data-step', '1');
  await page.clock.runFor(12000);
  await expect(demo).toHaveAttribute('data-step', '1');
  await demo.scrollIntoViewIfNeeded();
  await expect(demo).toBeInViewport({ ratio: 0.2 });
  await page.clock.runFor(500);
  await expect(demo).toHaveAttribute('data-step', '1');
  await page.clock.runFor(3000);
  await expect(demo).toHaveAttribute('data-step', '2');
});
