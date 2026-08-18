// The .of-stage overlay system, checked in a real browser.
//
// Why this file exists: on 2026-08-16 the overlay geometry moved out of each
// page's scoped <style> into a shared primitive in global.css, and every crop
// silently fell back into normal flow. Nothing caught it — the build passed,
// 58 node tests passed, 49 e2e tests passed, and the pages still rendered.
// The cause was pure CSS cascade: FlowDetail's own scoped rule compiles to
// `.flow-detail[data-astro-cid-…] { position: relative }`, which ties the
// primitive on specificity and wins on source order because Astro injects
// component styles after global.css.
//
// A static source test cannot see that: the rule was present and correct in
// the stylesheet. Only a browser resolving the real cascade can. So these
// assertions read COMPUTED style, not source text.
import { expect, test } from '@playwright/test';

const STAGE_ROUTES = ['/', '/flow/'] as const;
const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 430, height: 900 };

test.describe('product stage overlays', () => {
  for (const route of STAGE_ROUTES) {
    test(`${route} stages overlay their shot on desktop`, async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(route);

      const stages = page.locator('.of-stage');
      const count = await stages.count();
      expect(count, `${route} should carry product stages`).toBeGreaterThan(0);

      const corners: string[] = [];

      for (let i = 0; i < count; i += 1) {
        const stage = stages.nth(i);
        const detail = stage.locator('.of-stage__detail');
        const shot = stage.locator('.flow-shot');

        // The whole point of the primitive: the crop is LIFTED OUT of flow and
        // laid over the window. If this is `relative` or `static`, the cascade
        // regression above has come back.
        await expect(detail).toHaveCSS('position', 'absolute');

        const detailBox = await detail.boundingBox();
        const shotBox = await shot.boundingBox();
        if (!detailBox || !shotBox) throw new Error(`${route} stage ${i} has no box`);

        // Overlapping, not merely adjacent: the crop must sit ON the picture it
        // is explaining, which is what makes the two read as one object.
        const overlapsVertically =
          detailBox.y < shotBox.y + shotBox.height && detailBox.y + detailBox.height > shotBox.y;
        const overlapsHorizontally =
          detailBox.x < shotBox.x + shotBox.width && detailBox.x + detailBox.width > shotBox.x;
        expect(overlapsVertically && overlapsHorizontally, `${route} stage ${i} crop must overlap its shot`).toBe(true);

        // And it must hang OUT of one edge, or it is just a picture-in-picture.
        const hangs =
          detailBox.x < shotBox.x - 8 ||
          detailBox.x + detailBox.width > shotBox.x + shotBox.width + 8 ||
          detailBox.y < shotBox.y - 8 ||
          detailBox.y + detailBox.height > shotBox.y + shotBox.height + 8;
        expect(hangs, `${route} stage ${i} crop must hang past a shot edge`).toBe(true);

        const cls = await detail.getAttribute('class');
        const corner = cls?.match(/of-stage__detail--(\w+)/)?.[1];
        expect(corner, `${route} stage ${i} must declare a corner`).toBeTruthy();
        corners.push(corner as string);
      }

      // The operator asked for variety across bands; adjacent sections repeating
      // one corner is the specific thing to prevent.
      for (let i = 1; i < corners.length; i += 1) {
        expect(corners[i], `${route} stages ${i - 1} and ${i} must not share a corner`).not.toBe(corners[i - 1]);
      }
    });

    test(`${route} stages fall back to normal flow on mobile`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto(route);

      const stages = page.locator('.of-stage');
      const count = await stages.count();

      for (let i = 0; i < count; i += 1) {
        const detail = stages.nth(i).locator('.of-stage__detail');
        // Overlaying on a narrow screen would cover the very context the crop
        // is being explained against, so the overlay is desktop-only.
        await expect(detail).not.toHaveCSS('position', 'absolute');
      }

      // An overhanging crop is the classic source of a horizontal scrollbar.
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflows, `${route} must not scroll horizontally on mobile`).toBe(false);
    });

    // ── The crop must stay READABLE AS AN OBJECT (2026-08-18) ──
    // The overlay tests above prove the crop is positioned over the shot. They
    // passed the whole time the crop was also visually broken: the plate had
    // zero padding, so the fragment's first control sat flush against the
    // frame and edge pills rendered as if clipped, and the default one-stop
    // shadow left a light capture laid on a light app window reading as a hole
    // punched in the picture rather than a card above it. Position was never
    // the property at risk — presence of the mount and the lift is.
    test(`${route} stage crops are matted and lifted off their shot`, async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(route);

      const plates = page.locator('.of-stage .of-stage__detail .flow-detail__plate');
      const count = await plates.count();
      expect(count, `${route} should carry stage crops`).toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const plate = plates.nth(i);

        // A real matte on every side. The crops are cut to the feature with no
        // margin of their own, so this padding is the only thing between the
        // app UI and the plate border.
        const pad = await plate.evaluate((el) => {
          const cs = getComputedStyle(el);
          return [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat);
        });
        for (const side of pad) {
          expect(side, `${route} crop ${i} needs breathing room on every side`).toBeGreaterThanOrEqual(6);
        }

        // Two-stop elevation. One stop is the flat page-level card shadow that
        // could not separate the crop from the window behind it.
        const shadow = await plate.evaluate((el) => getComputedStyle(el).boxShadow);
        const stops = shadow.split(/,(?![^(]*\))/).length;
        expect(stops, `${route} crop ${i} needs a layered shadow to read as lifted`).toBeGreaterThanOrEqual(2);
      }
    });

    // The crop lands on the shot a beat AFTER the shot arrives. If it reuses
    // the stage's own reveal it arrives simultaneously and the composition
    // reads as one flat picture instead of a detail placed onto a window.
    test(`${route} stage crops carry their own delayed entrance`, async ({ page }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(route);

      const details = page.locator('.of-stage .of-stage__detail');
      const count = await details.count();

      for (let i = 0; i < count; i += 1) {
        const detail = details.nth(i);
        await expect(detail).toHaveAttribute('data-animate', 'detail');

        const delay = await detail.evaluate((el) => parseFloat(getComputedStyle(el).transitionDelay));
        expect(delay, `${route} crop ${i} must lag its shot`).toBeGreaterThan(0);
      }
    });
  }
});
