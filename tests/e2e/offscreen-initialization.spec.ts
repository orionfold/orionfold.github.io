import { expect, test, type Page } from './fixtures';

// Simulate the interval before the browser delivers any visibility callback.
// Every first action must work even when scrolling cannot initialize a demo.
async function holdIntersectionCallbacks(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
      },
    });
  });
}

test('hero art pauses outside view and resumes without changing the motion preference', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/flow/');
  const art = page.locator('.ls-hero .ls-paper-art');
  await expect(art).toHaveCSS('animation-play-state', 'running');
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(art).toHaveCSS('animation-play-state', 'paused');
  await page.locator('.ls-hero .ls-eyebrow').scrollIntoViewIfNeeded();
  await expect(art).toHaveCSS('animation-play-state', 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(art).toHaveCSS('animation-play-state', 'paused');
});

for (const width of [390, 1440]) {
  test(`library controls size the first preview on demand and keep all seven examples usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await holdIntersectionCallbacks(page);
    await page.goto('/flow/');
    const library = page.locator('#curated-document-previews');
    const panels = library.locator('[data-example-panel]');
    const firstReader = panels.first().locator('.ls-library-document');
    const play = panels.first().locator('[data-example-scroll]');
    await expect(panels).toHaveCount(7);
    expect(await firstReader.evaluate(reader => (reader as HTMLElement).style.getPropertyValue('--ls-library-page-height'))).toBe('');

    // Play remains a deliberate action even under reduced motion, and must
    // establish the reading geometry before the scroller measures its distance.
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'true');
    await expect(play).toHaveText('Pause scroll');
    expect(await firstReader.evaluate(reader => Number.parseFloat((reader as HTMLElement).style.getPropertyValue('--ls-library-page-height')))).toBeGreaterThan(0);
    await expect.poll(() => firstReader.evaluate(reader => reader.scrollTop)).toBeGreaterThan(0);
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
    await expect(play).toHaveText('Play scroll');

    for (let index = 0; index < 7; index++) {
      if (width < 760) await library.locator('[data-example-select]').selectOption(String(index));
      else await library.locator(`[data-example-tab="${index}"]`).click();
      const selected = panels.nth(index);
      await expect(library.locator('[data-example-panel]:not([hidden])')).toHaveCount(1);
      await expect(selected).toBeVisible();
      await expect(library.locator(`[data-example-tab="${index}"]`)).toHaveAttribute('aria-selected', 'true');
      await expect(library.locator('[data-example-select]')).toHaveValue(String(index));
      await expect(library.locator('[data-example-count]')).toHaveText(`${String(index + 1).padStart(2, '0')} / 07`);
      await expect(selected.locator('[data-example-scroll]')).toHaveAttribute('aria-pressed', 'false');
      const geometry = await selected.locator('.ls-library-document').evaluate(reader => {
        const bounds = reader.getBoundingClientRect();
        return {
          left: bounds.left, right: bounds.right, height: bounds.height,
          pageHeight: Number.parseFloat((reader as HTMLElement).style.getPropertyValue('--ls-library-page-height')),
          readerHeight: reader.clientHeight, viewportWidth: innerWidth, viewportHeight: innerHeight,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      expect(geometry.height).toBeGreaterThan(0);
      expect(geometry.height).toBeLessThan(geometry.viewportHeight);
      expect(geometry.pageHeight).toBeGreaterThanOrEqual(geometry.readerHeight);
      expect(geometry.left).toBeGreaterThanOrEqual(-1);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
      expect(geometry.overflow).toBeLessThanOrEqual(1);
    }

    await library.locator('[data-example-next]').click();
    await expect(library.locator('[data-example-count]')).toHaveText('01 / 07');
    await library.locator('[data-example-prev]').click();
    await expect(library.locator('[data-example-count]')).toHaveText('07 / 07');
  });
}
