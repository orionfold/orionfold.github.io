import { expect, test } from './fixtures';

// The Flow intro reel is click-to-play: nothing loads from YouTube until the
// visitor presses play, then the privacy-enhanced player takes the poster's place.
for (const [path, id] of [['/flow/', 'flow-reel'], ['/flow/night-shift/', 'night-shift-reel']] as const) {
  for (const width of [1440, 390]) {
    test(`${path} reel loads YouTube only on click at ${width}px`, async ({ page }) => {
      // Keep the test offline: answer the player request instead of fetching it.
      await page.route(/youtube(-nocookie)?\.com|ytimg\.com|googlevideo\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>player</title>' }));
      const youtube: string[] = [];
      page.on('request', (r) => { if (/youtube|ytimg|googlevideo/.test(r.url())) youtube.push(r.url()); });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      const reel = page.locator(`#${id}`);
      await reel.scrollIntoViewIfNeeded();
      await expect(reel.locator('img')).toBeVisible();
      expect(youtube).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      await reel.getByRole('button', { name: /Play the video/ }).click();
      const player = reel.locator('iframe');
      await expect(player).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/Wj4V5GORr2k\?autoplay=1/);
      await expect(reel.getByRole('button', { name: /Play the video/ })).toHaveCount(0);
    });
  }
}

test('/flow/ carries VideoObject data for the reel', async ({ page }) => {
  await page.goto('/flow/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const video = blocks.map((b) => JSON.parse(b)).find((d) => d['@type'] === 'VideoObject');
  expect(video).toMatchObject({ duration: 'PT1M18S', embedUrl: 'https://www.youtube.com/embed/Wj4V5GORr2k' });
  expect(video.uploadDate).toMatch(/^2026-09-30/);
});
