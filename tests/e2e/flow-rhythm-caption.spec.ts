import { expect, test } from './fixtures';

const captionCopy = 'Night Shift runs while your Mac is plugged in and idle, with Flow open or quit. A missed window can catch up once on wake.';

// The earlier correction stayed in a private preview. Protect the rendered
// caption so a successful build cannot hide the old icon and partial divider.
for (const width of [1440, 390]) {
  test(`Night Shift remains one plain caption below its mock at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/flow/');
    await page.evaluate(() => document.fonts.ready);

    const section = page.locator('#how-it-works');
    const mock = section.getByRole('figure', { name: 'Two rhythms. Your boundaries.', exact: true });
    const caption = page.getByText(captionCopy, { exact: true });
    await expect(caption).toHaveCount(1);
    await expect(section.getByText(captionCopy, { exact: true })).toHaveCount(1);
    await expect(page.locator('.ls-operating-note')).toHaveCount(0);
    await expect(caption.locator('svg, img, picture, hr, [class*="moon"]')).toHaveCount(0);
    await caption.scrollIntoViewIfNeeded();
    await expect(caption).toBeVisible();
    await expect(caption).toHaveText(captionCopy);

    const measure = () => caption.evaluate(element => {
      const figure = element.previousElementSibling;
      if (!(figure instanceof HTMLElement) || figure.tagName !== 'FIGURE') throw new Error('Caption must immediately follow the mock');
      const container = element.parentElement!;
      const box = element.getBoundingClientRect();
      const mockBox = figure.getBoundingClientRect();
      return {
        insideSection: container.closest('#how-it-works') !== null,
        mockLabel: figure.getAttribute('aria-label'),
        gap: box.top - mockBox.bottom,
        captionLeft: box.left, captionRight: box.right, captionWidth: box.width,
        mockLeft: mockBox.left, mockRight: mockBox.right, mockWidth: mockBox.width,
        overflow: document.documentElement.scrollWidth - innerWidth,
        decoration: [element, container].map(node => {
          const style = getComputedStyle(node);
          return {
            topBorder: parseFloat(style.borderTopWidth), bottomBorder: parseFloat(style.borderBottomWidth),
            before: getComputedStyle(node, '::before').content, after: getComputedStyle(node, '::after').content,
          };
        }),
      };
    });
    const expectedGap = width === 390 ? 12 : 10;
    const assertGeometry = (value: Awaited<ReturnType<typeof measure>>) => {
      expect(value.insideSection).toBe(true);
      expect(value.mockLabel).toBe('Two rhythms. Your boundaries.');
      expect(Math.abs(value.gap - expectedGap), 'compact gap below the mock').toBeLessThanOrEqual(1);
      expect(value.captionWidth).toBeGreaterThan(0);
      expect(value.captionWidth).toBeLessThanOrEqual(value.mockWidth + 1);
      expect(value.captionLeft).toBeGreaterThanOrEqual(value.mockLeft - 1);
      expect(value.captionRight).toBeLessThanOrEqual(value.mockRight + 1);
      expect(value.overflow).toBeLessThanOrEqual(1);
      for (const decoration of value.decoration) {
        expect(decoration.topBorder, 'no additional divider above the caption').toBe(0);
        expect(decoration.bottomBorder, 'no additional divider below the caption').toBe(0);
        expect(decoration.before, 'no generated icon or divider').toMatch(/^(none|normal)$/);
        expect(decoration.after, 'no generated icon or divider').toMatch(/^(none|normal)$/);
      }
    };
    const before = await measure();
    assertGeometry(before);
    const frame = Number(await mock.getAttribute('data-frame'));
    await mock.getByRole('button', { name: 'Next step: Two rhythms. Your boundaries.', exact: true }).click();
    await expect(mock).toHaveAttribute('data-frame', String((frame + 1) % 4));
    const after = await measure();
    assertGeometry(after);
    expect(Math.abs(after.gap - before.gap), 'Next does not move the caption').toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
    await testInfo.attach('rhythm-caption-geometry', { body: JSON.stringify({ width, before, after }, null, 2), contentType: 'application/json' });
  });
}
