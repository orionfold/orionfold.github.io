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
import { expect, test } from './fixtures';

const STAGE_ROUTES = ['/flow/writing-with-ai/', '/flow/receipts/', '/flow/documents-and-files/'] as const;
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

        // A stage may legitimately carry NO overlay (2026-08-21: both front-door
        // heroes became Flow Guide document captures, which are legible whole
        // and would only be spoiled by laying chrome back over them). Such a
        // stage has nothing to position, so it is skipped rather than failed --
        // the assertions below all describe an overlay's geometry.
        if ((await detail.count()) === 0) continue;

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
        if ((await detail.count()) === 0) continue; // overlay-less stage, see above
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

// Flow 1.6 shows three distinct Settings shots in four standalone crop placements
// (including the category hero). Protect their real loaded image and matte.
for (const viewport of [DESKTOP, MOBILE]) {
  test(`v1.6 model Settings crops remain readable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/flow/models-and-runtime/');
    await page.evaluate(() => document.fonts.ready);
    const details = page.locator('.flow-detail:has(img[src*="v16-settings-"])');
    await expect(details).toHaveCount(4);
    for (const detail of await details.all()) {
      await detail.scrollIntoViewIfNeeded();
      const img = detail.locator('img');
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      await expect(detail).toHaveCSS('position', 'relative');
      await expect(detail.locator('figcaption')).toBeVisible();
      const shape = await detail.locator('.flow-detail__plate').evaluate(el => {
        const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
        return {left:r.left,right:r.right,padding:[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft].map(parseFloat)};
      });
      expect(shape.left).toBeGreaterThanOrEqual(0);
      expect(shape.right).toBeLessThanOrEqual(viewport.width);
      for (const side of shape.padding) expect(side).toBeGreaterThanOrEqual(6);
    }
  });
}

// The approved front doors use native models. Detail pages above retain real
// shot geometry/provenance. This catches missing composition CSS in-browser.
test.describe('Living Systems native product stage', () => {
  for (const route of ['/', '/flow/']) {
    for (const width of [1440,390]) {
      test(`${route} native model stays usable at ${width}px`, async ({page}) => {
        await page.setViewportSize({width,height:900});
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.goto(route);
        await expect(page.locator('main .flow-shot')).toHaveCount(0);
        const demo=page.locator('[data-demo]').first();
        await expect(demo).toBeVisible();
        const window=demo.locator('.ls-glass-window');
        await expect(window).not.toHaveCSS('box-shadow','none');
        const positions=await page.evaluate(()=>({nav:document.querySelector('#nav-wrapper')!.getBoundingClientRect().bottom,hero:document.querySelector('main .ls-eyebrow')!.getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth+1}));
        expect(positions.hero).toBeGreaterThanOrEqual(positions.nav);
        expect(positions.overflow).toBe(false);
        await demo.locator('[data-demo-next]').click();
        await demo.locator('[data-demo-next]').click();
        await demo.locator('[data-demo-next]').click();
        await demo.locator('[data-demo-keep]').click();
        await expect(demo).toHaveAttribute('data-step','4');
        await demo.locator('[data-demo-replay]').click();
        await expect(demo).toHaveAttribute('data-step','0');
        await expect(page.locator('body')).toHaveAttribute('data-motion','off');
      });
    }
  }
});

test('editorial compositions keep their desktop grids and all manifesto principles', async ({page}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const ideas = await page.locator('#home-flow-ideas-pit-stop').evaluate(section => {
    let previous = section.previousElementSibling;
    while (previous && previous.tagName !== 'SECTION') previous = previous.previousElementSibling;
    const box = (element: Element) => {
      const {left,right,top,bottom,width,height} = element.getBoundingClientRect();
      return {left,right,top,bottom,width,height};
    };
    return {
      section: box(section),
      copy: box(section.querySelector('.ls-episode-copy')!),
      mock: box(section.querySelector('figure')!),
      previousSection: box(previous!),
      previousMock: box(previous!.querySelector('figure')!),
    };
  });
  expect(Math.abs(ideas.section.width - ideas.previousSection.width), 'Ideas keeps the width of its preceding peer').toBeLessThanOrEqual(2);
  expect(Math.abs(ideas.mock.width - ideas.previousMock.width), 'Ideas keeps the same generous product-mock column').toBeLessThanOrEqual(2);
  expect(ideas.copy.left, 'Ideas copy begins in the left column').toBeLessThanOrEqual(ideas.section.left + 2);
  expect(ideas.copy.right, 'Ideas copy sits to the left of the mock').toBeLessThan(ideas.mock.left);
  expect(ideas.mock.width, 'mock has the wider column instead of an empty anchor consuming it').toBeGreaterThan(ideas.copy.width);
  const overlap = Math.min(ideas.copy.bottom, ideas.mock.bottom) - Math.max(ideas.copy.top, ideas.mock.top);
  expect(overlap, 'copy and mock share one row instead of landing in separate grid rows').toBeGreaterThanOrEqual(Math.min(ideas.copy.height, ideas.mock.height) * 0.9);
  await page.goto('/essay/');
  await expect(page.locator('.ls-essay-layout')).toHaveCSS('display','grid');
  await expect(page.locator('.ls-essay-hero h1')).toHaveCSS('font-family', /Georgia/);
  await expect(page.locator('.ls-essay-reading > section[id]')).toHaveCount(10);
  await page.goto('/manifesto/');
  await expect(page.locator('.ls-manifesto-hero')).toHaveCSS('display','grid');
  await expect(page.locator('[data-principle]')).toHaveCount(18);
  const scene=page.locator('[data-scene]').first();
  await scene.locator('[data-scene-next]').click();
  await expect(scene).toHaveAttribute('data-frame','1');
  const invitation=page.locator('#email-updates');
  await expect(invitation.locator('form')).toHaveCount(1);
  await expect(invitation.locator('[data-flow-download]')).toHaveCount(0);
  await expect(invitation.locator('.living-origami[aria-hidden="true"] img')).toHaveAttribute('alt', '');
});


// A later resize must not conceal an initial closed-bar measurement: that
// write shifted the entire hero up and back down during real navigation.
for (const width of [390, 1440]) {
  test(`fresh visitor reserves the settled navigation height at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.removeItem('of-flow-bar-dismissed');
      sessionStorage.removeItem('of-confirm-welcome');
      const samples: Array<{ value: number; height: number; noticeVisible: boolean; previous: number }> = [];
      Object.defineProperty(window, '__navOffsetWrites', { value: samples });
      const original = CSSStyleDeclaration.prototype.setProperty;
      CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
        if (name === '--of-nav-height' && this === document.documentElement.style) {
          const nav = document.querySelector('#nav-wrapper');
          const notice = document.querySelector('#magnet-bar');
          samples.push({
            value: Number.parseFloat(value ?? ''),
            height: Math.ceil(nav?.getBoundingClientRect().height ?? 0),
            noticeVisible: !!notice && getComputedStyle(notice).display !== 'none',
            previous: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)),
          });
        }
        return original.call(this, name, value, priority);
      };
    });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#magnet-bar')).toBeVisible();
    const evidence = await page.evaluate(() => ({
      samples: (window as typeof window & { __navOffsetWrites: Array<{ value: number; height: number; noticeVisible: boolean; previous: number }> }).__navOffsetWrites,
      settled: Math.ceil(document.querySelector('#nav-wrapper')!.getBoundingClientRect().height),
    }));
    expect(evidence.samples.length).toBeGreaterThan(0);
    expect(evidence.samples.every(sample => sample.noticeVisible), 'never measure a temporarily hidden fresh-visitor notice').toBe(true);
    expect(evidence.samples.every(sample => sample.value === sample.height), 'offset tracks the visible header').toBe(true);
    expect(evidence.samples[0].value, 'initial offset already equals settled header height').toBe(evidence.settled);
    expect(evidence.samples[0].previous, 'CSS reserves the initial header before script measurement').toBe(evidence.settled);
    await page.locator('#magnet-bar-close').click();
    await expect(page.locator('#magnet-bar')).toBeHidden();
    await expect.poll(() => page.evaluate(() => (
      Number.parseFloat(document.documentElement.style.getPropertyValue('--of-nav-height'))
      - Math.ceil(document.querySelector('#nav-wrapper')!.getBoundingClientRect().height)
    ))).toBe(0);
    expect(await page.locator('#nav-wrapper').evaluate(el => Math.ceil(el.getBoundingClientRect().height))).toBeLessThan(evidence.settled);
  });
}


// The final download is one continuous band. Interstitials keep their quieter
// gray treatment, and text must remain inside the action column at both sizes.
for (const width of [1440, 390]) {
  test(`each flagship has one full-width closing download at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['/', '/flow/', '/essay/', '/manifesto/']) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const band = page.locator('[data-download-band="yellow"]');
      await expect(band, `${route}: one closing download band`).toHaveCount(1);
      await expect(band.locator('a,button,input,select,textarea'), `${route}: one action rather than competing controls`).toHaveCount(1);
      await expect(band.getByRole('link', { name: 'Download Flow Now', exact: true })).toBeVisible();
      const caption = band.locator('.of-waitlist-caption');
      await expect(caption).toHaveText('For Mac OS. Base is free forever. 10 Pro days included. No credit card to use.');
      const geometry = await band.evaluate(element => {
        const box = (node: Element) => {
          const {left,right,top,bottom,width,height} = node.getBoundingClientRect();
          return {left,right,top,bottom,width,height};
        };
        const action = element.querySelector('.living-paper-cta__action')!;
        const caption = action.querySelector('.of-waitlist-caption')!;
        const range = document.createRange();
        range.selectNodeContents(caption);
        return {
          viewport: innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          band: box(element),
          copy: box(element.querySelector('.living-paper-cta__copy')!),
          action: box(action),
          control: box(action.querySelector('a,button')!),
          caption: box(caption),
          captionLines: Array.from(range.getClientRects()).filter(rect => rect.width > 0).map(rect => ({ left: rect.left, right: rect.right })),
          precedingBands: Array.from(document.querySelectorAll('[data-download-band]')).filter(other => other !== element).map(other => ({ tone: other.getAttribute('data-download-band'), bottom: other.getBoundingClientRect().bottom })),
        };
      });
      expect(geometry.overflow, `${route}: no horizontal page overflow`).toBe(false);
      expect(Math.abs(geometry.band.left), `${route}: closing band reaches the left edge`).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.band.right - geometry.viewport), `${route}: closing band reaches the right edge`).toBeLessThanOrEqual(1);
      for (const rect of [geometry.control, ...geometry.captionLines]) {
        expect(rect.left, `${route}: action/caption does not escape left`).toBeGreaterThanOrEqual(geometry.action.left - 1);
        expect(rect.right, `${route}: action/caption does not escape right`).toBeLessThanOrEqual(geometry.action.right + 1);
      }
      expect(geometry.captionLines.length, `${route}: caption has rendered text`).toBeGreaterThan(0);
      expect(geometry.caption.top, `${route}: caption sits below the download control`).toBeGreaterThanOrEqual(geometry.control.bottom);
      if (width === 1440) {
        expect(geometry.copy.right, `${route}: copy and action occupy separate columns`).toBeLessThan(geometry.action.left);
      } else {
        expect(geometry.action.top, `${route}: action follows copy on mobile`).toBeGreaterThanOrEqual(geometry.copy.bottom);
      }
      for (const interstitial of geometry.precedingBands) {
        expect(interstitial.tone, `${route}: other download bands remain gray`).toBe('gray');
        expect(interstitial.bottom, `${route}: interstitial precedes the single closing band`).toBeLessThanOrEqual(geometry.band.top + 1);
      }
    }
  });
}
