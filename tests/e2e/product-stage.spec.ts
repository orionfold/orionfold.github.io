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

// The current tour retains three historical Settings placements and adds the
// released 1.7 Models Workbench. Protect every loaded image, caption and matte.
for (const viewport of [DESKTOP, MOBILE]) {
  test(`model Settings crops remain readable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/flow/models-and-runtime/');
    await page.evaluate(() => document.fonts.ready);
    const historical = page.locator('.flow-detail:has(img[src*="v16-settings-"])');
    const workbench = page.locator('.flow-detail:has(img[src*="v17-settings-models"])');
    await expect(historical).toHaveCount(3);
    await expect(workbench).toHaveCount(1);
    await expect(workbench.locator('figcaption')).toContainText('Flow 1.7 (2173)');
    await expect(workbench.locator('figcaption')).toContainText('This Mac’s configuration');
    const details = page.locator('.flow-detail:has(img[src*="v16-settings-"], img[src*="v17-settings-models"])');
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
  // Paper R2 (G-141): the home is Paper; tests/e2e/paper-home.spec.ts covers it.
  for (const route of ['/flow/']) {
    for (const width of [1440,390]) {
      test(`${route} native model stays usable at ${width}px`, async ({page}) => {
        await page.setViewportSize({width,height:900});
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.goto(route);
        await expect(page.locator('main .flow-shot')).toHaveCount(0);
        // Paper R4 (G-143): the hero is the live Elements walk (operator 2026-10-30).
        const demo=page.locator('.pp-hero--flow .dm--hero.fe');
        // Before any click, so the page is still at the top.
        const positions=await page.evaluate(()=>({nav:document.querySelector('#nav-wrapper, .pp-nav')!.getBoundingClientRect().bottom,hero:document.querySelector('main .pp-kicker')!.getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth+1}));
        expect(positions.hero).toBeGreaterThanOrEqual(positions.nav);
        expect(positions.overflow).toBe(false);
        await expect(demo).toHaveCount(1);
        await expect(demo).toBeVisible();
        await expect(demo).toContainText('Field-Notes Diagram');
        await expect(demo).toContainText('CHASING RECEIPTS: 96 OF 312 HOURS');
        const story=page.locator('.fe-story');
        await story.locator('[data-story-go="4"]').click();
        await story.getByRole('button',{name:'Undo'}).click();
        await expect(story.locator('.fe-out-undo')).toBeVisible();
        await expect(story.locator('.fe-fig')).toBeHidden();
        await expect(page.locator('.pp-hero--flow .pp-btn').first()).toHaveAttribute('href',/\.dmg$|#get-flow$/);
        const win=demo.locator('.dm-window');
        await expect(win).not.toHaveCSS('box-shadow','none');
        const heroBox=await win.boundingBox();
        expect(heroBox!.x).toBeGreaterThanOrEqual(0);
        expect(heroBox!.x + heroBox!.width).toBeLessThanOrEqual(width);
        {
          // The full Jobs demo further down is the real Jobs interaction.
          const jobs=page.locator('#jobs-workbench [data-jobs-demo]');
          await jobs.scrollIntoViewIfNeeded();
          await expect(jobs).toHaveAttribute('data-scenario','customer');
          await expect(jobs).toHaveAttribute('data-phase','ready');
          await expect(jobs.locator('.jw-document')).toHaveCount(1);
          await expect(jobs.locator('.jw-workbench')).toHaveCount(1);
          const logo=jobs.locator('.jw-titlebar img');
          await expect.poll(() => logo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
          const layout=await jobs.evaluate(el => {
            const box=(selector: string) => {
              const r=el.querySelector(selector)!.getBoundingClientRect();
              return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
            };
            return {window:box('.jw-window'),document:box('.jw-document'),workbench:box('.jw-workbench')};
          });
          expect(layout.window.left).toBeGreaterThanOrEqual(0);
          expect(layout.window.right).toBeLessThanOrEqual(width);
          if (width === 1440) {
            expect(layout.document.right).toBeLessThanOrEqual(layout.workbench.left + 1);
            expect(Math.abs(layout.document.top-layout.workbench.top)).toBeLessThanOrEqual(1);
          } else {
            expect(layout.document.bottom).toBeLessThanOrEqual(layout.workbench.top + 1);
          }

          // Keyboard tabs,
          // changed input, an applied update, then independent part decisions.
          const edit=jobs.getByRole('tab',{name:'Edit',exact:true});
          const relations=jobs.getByRole('tab',{name:'Relations',exact:true});
          await edit.focus();
          await edit.press('End');
          await expect(relations).toBeFocused();
          await expect(relations).toHaveAttribute('aria-selected','true');
          await expect(jobs.locator('[data-relations-view="map"]')).toBeVisible();
          await relations.press('Home');
          await expect(edit).toBeFocused();
          await expect(edit).toHaveAttribute('aria-selected','true');
          const run=jobs.locator('[data-panel="edit"] [data-action="run"]');
          await expect(run).toBeDisabled();
          const input=jobs.locator('[data-action="input"]');
          await input.focus();
          await input.press('Enter');
          await expect(jobs.locator('[data-input-value]')).toHaveText('12 interviews');
          await expect(run).toBeEnabled();
          await run.focus();
          await run.press('Enter');
          await expect(jobs).toHaveAttribute('data-phase','review');
          await expect(jobs.locator('[data-review-active] h4')).toBeFocused();
          await expect(jobs.locator('[data-chart-value]')).toHaveText('4');
          await expect(jobs.locator('[data-pending-count]')).toHaveText('2');
          const exact=jobs.locator('[data-action="view"][data-value="exact"]');
          await exact.focus();
          await exact.press('Enter');
          await expect(jobs.locator('[data-exact-view]')).toBeVisible();
          await expect(jobs.locator('[data-diff-before]')).toHaveText('3');
          await expect(jobs.locator('[data-diff-after]')).toHaveText('4');
          const keep=jobs.locator('[data-action="keep"]');
          await keep.focus();
          await keep.press('Enter');
          await expect(jobs.locator('.jw-chart [data-part-status]')).toHaveText('Kept');
          await expect(jobs.locator('[data-pending-count]')).toHaveText('1');
          const later=jobs.locator('[data-action="later"]');
          await later.focus();
          await later.press('Enter');
          await expect(jobs).toHaveAttribute('data-phase','later');
          const resume=jobs.locator('[data-action="resume"]');
          await expect(resume).toBeFocused();
          await resume.press('Enter');
          await expect(jobs.locator('[data-review-active] h4')).toBeFocused();
          const revert=jobs.locator('[data-action="revert"]');
          await revert.focus();
          await revert.press('Enter');
          await expect(jobs).toHaveAttribute('data-phase','complete');
          await expect(jobs.locator('[data-review-complete] h4')).toBeFocused();
          await expect(jobs.locator('[data-complete-summary]')).toHaveText('Review complete. 1 kept · 1 reverted. Source input retained.');
          await expect(jobs.locator('[data-chart-value]')).toHaveText('4');
          await expect(jobs.locator('[data-summary-value]')).toHaveText('Portable files: 3');
          await expect(jobs.locator('[data-source-note]')).toContainText('12 interviews in the source.');
          const reset=jobs.locator('.jw-caption [data-action="reset"]');
          await reset.focus();
          await reset.press('Enter');
          await expect(jobs).toHaveAttribute('data-phase','ready');
          await expect(jobs.locator('[data-input-value]')).toHaveText('11 interviews');
          await expect(jobs.locator('[data-chart-value]')).toHaveText('3');
          await expect(run).toBeDisabled();
        }
        // Paper R4: the page names its Living root, and every framed block follows it.
        await expect(page.locator('[data-ls-root]')).toHaveAttribute('data-motion','off');
        for (const block of await page.locator('[data-ls-root] .ls').all()) await expect(block).toHaveAttribute('data-motion','off');
      });
    }
  }
});

test('editorial compositions keep their desktop grids and all manifesto principles', async ({page}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  // The homepage Ideas band and its grid check left with the band (operator 2026-10-26).
  // R6 (G-145): the essays read in the Paper long-form column (Fraunces title, contents rail).
  await page.goto('/essay/');
  await expect(page.locator('.pp-long-grid')).toHaveCSS('display','grid');
  await expect(page.locator('.pp-long-title')).toHaveCSS('font-family', /Fraunces/);
  await expect(page.locator('.pp-long-body section[id]')).toHaveCount(10);
  await page.goto('/manifesto/');
  await expect(page.locator('h1.pp-long-title')).toHaveCSS('font-family', /Fraunces/);
  await expect(page.locator('[data-principle]')).toHaveCount(18);
  const scene=page.locator('[data-scene]').first();
  await scene.locator('[data-scene-next]').click();
  await expect(scene).toHaveAttribute('data-frame','1');
  const invitation=page.locator('#email-updates');
  await expect(invitation.locator('form')).toHaveCount(1);
  await expect(invitation.locator('[data-flow-download]')).toHaveCount(0);
  await expect(invitation.locator('.living-origami[aria-hidden="true"] img')).toHaveAttribute('alt', '');
});


// The nav reserves its settled height before script measurement (the top
// notice bar left on 2026-10-28, so there is no notice to wait for).
for (const width of [390, 1440]) {
  test(`fresh visitor reserves the settled navigation height at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      sessionStorage.removeItem('of-confirm-welcome');
      const samples: Array<{ value: number; height: number; previous: number }> = [];
      Object.defineProperty(window, '__navOffsetWrites', { value: samples });
      const original = CSSStyleDeclaration.prototype.setProperty;
      CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
        if (name === '--of-nav-height' && this === document.documentElement.style) {
          const nav = document.querySelector('#nav-wrapper');
          samples.push({
            value: Number.parseFloat(value ?? ''),
            height: Math.ceil(nav?.getBoundingClientRect().height ?? 0),
            previous: Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)),
          });
        }
        return original.call(this, name, value, priority);
      };
    });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#magnet-bar')).toHaveCount(0);
    const evidence = await page.evaluate(() => ({
      samples: (window as typeof window & { __navOffsetWrites: Array<{ value: number; height: number; previous: number }> }).__navOffsetWrites,
      settled: Math.ceil(document.querySelector('#nav-wrapper')!.getBoundingClientRect().height),
    }));
    expect(evidence.samples.length).toBeGreaterThan(0);
    expect(evidence.samples.every(sample => sample.value === sample.height), 'offset tracks the visible header').toBe(true);
    expect(evidence.samples[0].value, 'initial offset already equals settled header height').toBe(evidence.settled);
    expect(evidence.samples[0].previous, 'CSS reserves the initial header before script measurement').toBe(evidence.settled);
  });
}


// R6 (G-145): the essays close on Paper sheets, never the old yellow band. The
// essay keeps its one attributed closing download; the manifesto closes on its
// email invitation, with its one mid-page download card.
for (const width of [1440, 390]) {
  test(`each essay closes on one Paper action at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/essay/');
    await expect(page.locator('[data-download-band="yellow"]')).toHaveCount(0);
    const closing = page.locator('.pp-closing');
    await expect(closing).toHaveCount(1);
    await expect(closing.locator('[data-flow-download="essay-living-documents"]')).toBeVisible();
    await page.goto('/manifesto/');
    await expect(page.locator('[data-download-band="yellow"]')).toHaveCount(0);
    await expect(page.locator('[data-flow-download="manifesto-manifesto-middle"]')).toHaveCount(1);
    await expect(page.locator('#email-updates form')).toHaveCount(1);
    for (const route of ['/essay/', '/manifesto/']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => [...document.querySelectorAll('main *')].some((el) => el.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('.table-scroll, [data-scroll-x]')));
      expect(overflow, `${route}: nothing wider than the screen`).toBe(false);
    }
  });
}
