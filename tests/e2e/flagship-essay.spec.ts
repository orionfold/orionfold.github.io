import { expect, test } from './fixtures';

const essay = '/essays/the-work-we-want-to-keep/';

for (const width of [1440, 390]) {
  test(`flagship research illustrations keep independent review decisions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(essay);

    const first = page.locator('#essay-first-job [data-jobs-demo]');
    const review = page.locator('#essay-review-decision [data-jobs-demo]');
    const map = page.locator('#essay-jobs-map');
    await expect(page.locator('[data-essay-illustration]')).toHaveCount(3);
    await expect(page.locator('[data-jobs-demo]')).toHaveCount(2);
    await expect(page.locator('#essay-illustration-note')).toHaveCount(1);
    await expect(page.locator('#essay-illustration-note')).toHaveAttribute('role', 'note');
    await expect(page.locator('#essay-first-job h2 a[href="#essay-illustration-note"]')).toHaveText('*');
    await expect(map.getByRole('figure')).toHaveAccessibleName(/Customer Research/);
    await expect(map.locator('button, input, [data-jobs-demo]')).toHaveCount(0);
    for (const demo of [first, review]) {
      await expect(demo).toHaveAttribute('data-jobs-ready', 'true');
      await expect(demo).toHaveAttribute('data-scenario', 'customer');
    }
    await expect(first).toHaveAttribute('data-phase', 'ready');
    await expect(first.locator('[data-input-value]')).toHaveText('11 interviews');
    await expect(first.locator('[data-chart-value]')).toHaveText('3');
    await expect(first.locator('[data-summary-value]')).toHaveText('Portable files: 3');
    await expect(first.locator('[data-panel="edit"] [data-action="run"]')).toBeDisabled();
    await expect(review).toHaveAttribute('data-phase', 'review');
    await expect(review.locator('[data-input-value]')).toHaveText('12 interviews');
    await expect(review.locator('[data-chart-value]')).toHaveText('4');
    await expect(review.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(review.locator('[data-pending-count]')).toHaveText('2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);

    await first.locator('[data-action="input"]').click();
    await expect(first.locator('[data-input-value]')).toHaveText('12 interviews');
    await expect(first.locator('[data-chart-value]')).toHaveText('3');
    await first.locator('[data-panel="edit"] [data-action="run"]').click();
    await expect(first).toHaveAttribute('data-phase', 'review');
    await expect(first.locator('[data-review-active] h4')).toBeFocused();
    await expect(first.locator('[data-chart-value]')).toHaveText('4');
    await expect(first.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(first.locator('[data-pending-count]')).toHaveText('2');

    // Keeping records the chart decision; reverting restores only the finding.
    await first.getByRole('button', { name: 'Exact changes', exact: true }).click();
    await expect(first.locator('[data-diff-before]')).toHaveText('3');
    await expect(first.locator('[data-diff-after]')).toHaveText('4');
    await first.locator('[data-action="keep"]').click();
    await expect(first.locator('[data-pending-count]')).toHaveText('1');
    await expect(first.locator('[data-doc-view] [data-part="chart"]')).toHaveAttribute('data-decision', 'kept');
    await first.locator('[data-action="revert"]').click();
    await expect(first).toHaveAttribute('data-phase', 'complete');
    await expect(first.locator('[data-review-complete] h4')).toBeFocused();
    await expect(first.locator('[data-complete-summary]')).toHaveText('Review complete. 1 kept · 1 reverted. Source input retained.');
    await expect(first.locator('[data-chart-value]')).toHaveText('4');
    await expect(first.locator('[data-summary-value]')).toHaveText('Portable files: 3');
    await expect(first.locator('[data-input-value]')).toHaveText('12 interviews');
    await expect(first.locator('[data-doc-view] [data-part="summary"]')).toHaveAttribute('data-decision', 'reverted');

    // The later illustration starts applied and never inherits the earlier decisions.
    await expect(review).toHaveAttribute('data-phase', 'review');
    await expect(review.locator('[data-chart-value]')).toHaveText('4');
    await expect(review.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await expect(review.locator('[data-pending-count]')).toHaveText('2');
    await expect(review.locator('[data-doc-view] [data-part="chart"]')).toHaveAttribute('data-decision', 'pending');
    await expect(review.locator('[data-doc-view] [data-part="summary"]')).toHaveAttribute('data-decision', 'pending');
    await review.locator('[data-action="revert"]').click();
    await expect(review.locator('[data-chart-value]')).toHaveText('3');
    await expect(review.locator('[data-summary-value]')).toHaveText('Portable files: 4');
    await review.locator('[data-action="keep"]').click();
    await expect(review).toHaveAttribute('data-phase', 'complete');
    await expect(review.locator('[data-complete-summary]')).toContainText('1 kept · 1 reverted');
    await expect(review.locator('[data-input-value]')).toHaveText('12 interviews');
    await expect(first.locator('[data-chart-value]')).toHaveText('4');
    await expect(first.locator('[data-summary-value]')).toHaveText('Portable files: 3');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
    expect(new Set(ids).size, 'chapter, disclosure and demo control IDs remain unique').toBe(ids.length);

    await page.getByRole('link', { name: 'Research notes and evidence' }).click();
    await expect(page).toHaveURL(new RegExp(`${essay}notes/$`));
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page).toHaveTitle(/Research Notes/);
    expect(await page.locator('main h1').evaluate(heading => {
      const range = document.createRange();
      range.selectNodeContents(heading);
      const bounds = heading.getBoundingClientRect();
      return [...range.getClientRects()].every(rect => rect.right <= bounds.right + 2 && rect.left >= bounds.left - 2);
    }), 'the research title wraps without clipping inside the hero').toBe(true);
    await page.getByRole('link', { name: 'Return to The Work We Want to Keep' }).click();
    await expect(page).toHaveURL(new RegExp(`${essay}$`));
    await expect(page.locator('main h1')).toBeVisible();
  });
}
