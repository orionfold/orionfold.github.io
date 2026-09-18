import { expect, test, type Page } from './fixtures';

const heroes = [
  { route: '/', name: 'home', priority: 'low' },
  { route: '/flow/', name: 'flow', priority: 'high' },
] as const;
const widths = [390, 768, 1100, 1150, 1440, 1920];

// Read the browser's actual cascade, independently of the formulas authored in
// sizes. Splitting only outside parentheses preserves calc() and media queries.
async function delivery(page: Page) {
  return page.locator('main .ls-hero .ls-paper-art').evaluate(picture => {
    const source = picture.querySelector('source[type="image/webp"]')!;
    const image = picture.querySelector('img')!;
    const splitOutside = (value: string, separator: ',' | ' ') => {
      const parts: string[] = [];
      let depth = 0, start = 0;
      for (let index = 0; index < value.length; index++) {
        if (value[index] === '(') depth++;
        else if (value[index] === ')') depth--;
        else if (depth === 0 && (separator === ',' ? value[index] === ',' : /\s/.test(value[index]))) {
          if (value.slice(start, index).trim()) parts.push(value.slice(start, index).trim());
          start = index + 1;
        }
      }
      if (value.slice(start).trim()) parts.push(value.slice(start).trim());
      return parts;
    };
    const sizes = source.getAttribute('sizes') ?? '';
    let slot = '';
    for (const entry of splitOutside(sizes, ',')) {
      const tokens = splitOutside(entry, ' ');
      const length = tokens.pop()!;
      if (!tokens.length || matchMedia(tokens.join(' ')).matches) { slot = length; break; }
    }
    if (!slot || !CSS.supports('width', slot)) throw new Error(`No valid sizes length for ${innerWidth}px: ${sizes}`);
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;height:0;padding:0;border:0;max-width:none;min-width:0;box-sizing:content-box';
    probe.style.width = slot;
    document.body.append(probe);
    const advertisedWidth = probe.getBoundingClientRect().width;
    probe.remove();
    const computed = getComputedStyle(image);
    const candidates = (source.getAttribute('srcset') ?? '').split(',').map(entry => {
      const [url, descriptor] = entry.trim().split(/\s+/);
      if (!/^\d+w$/.test(descriptor ?? '')) throw new Error(`Expected width descriptor: ${entry}`);
      return { url: new URL(url, document.baseURI).href, width: Number.parseInt(descriptor) };
    });
    return {
      viewport: innerWidth, dpr: devicePixelRatio, sizes, advertisedWidth,
      renderedWidth: Number.parseFloat(computed.width), renderedHeight: Number.parseFloat(computed.height),
      candidates, currentSrc: image.currentSrc, priority: image.fetchPriority,
      widthAttribute: image.getAttribute('width'), heightAttribute: image.getAttribute('height'),
      complete: image.complete && image.naturalWidth > 0,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
}

for (const hero of heroes) {
  test(`${hero.name} hero sizes match its responsive CSS without changing artwork geometry`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: widths[0], height: 1000 });
    await page.goto(hero.route);
    await page.evaluate(() => document.fonts.ready);
    const measurements: Awaited<ReturnType<typeof delivery>>[] = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const result = await delivery(page);
      expect(Math.abs(result.advertisedWidth - result.renderedWidth), `${width}px: sizes matches the computed image width`).toBeLessThanOrEqual(1);
      expect(result.renderedWidth).toBeGreaterThan(0);
      expect(Math.abs(result.renderedHeight - result.renderedWidth * 958 / 1642), 'original artwork aspect ratio remains intact').toBeLessThanOrEqual(1);
      expect(result.pageOverflow, `${width}px: decorative overhang stays clipped`).toBeLessThanOrEqual(1);
      measurements.push(result);
    }
    await testInfo.attach('responsive-hero-geometry', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
  });
}

// Each test gets a new browser context: a larger cached candidate must not hide
// duplicate requests or incorrect source selection on the first mobile visit.
for (const dpr of [1, 2, 3]) {
  test.describe(`cold mobile hero at DPR ${dpr}`, () => {
    test.use({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: dpr });
    for (const hero of heroes) {
      test(`${hero.name} downloads one appropriately sized WebP`, async ({ page }, testInfo) => {
        const requests: string[] = [];
        page.on('request', request => {
          if (new URL(request.url()).pathname.includes(`/hero-${hero.name}-paper-planes`)) requests.push(request.url());
        });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(hero.route);
        await page.locator('main .ls-hero .ls-paper-art img').evaluate(image => {
          if (!(image instanceof HTMLImageElement)) throw new Error('Hero artwork must be an image');
          return image.decode();
        });
        const result = await delivery(page);
        expect(result.complete).toBe(true);
        expect(result.dpr).toBe(dpr);
        expect(result.widthAttribute).toBe('1642');
        expect(result.heightAttribute).toBe('958');
        expect(result.priority).toBe(hero.priority);
        expect(result.candidates.map(candidate => candidate.width)).toEqual([640, 960, 1152, 1642]);
        expect(requests, 'picture selection must not fetch the PNG fallback or a second hero candidate').toEqual([result.currentSrc]);
        expect(new URL(result.currentSrc).pathname).toMatch(/\.webp$/);
        const selected = result.candidates.find(candidate => candidate.url === result.currentSrc);
        expect(selected, 'currentSrc belongs to the authored candidate list').toBeDefined();
        const requiredPixels = Math.min(result.renderedWidth * dpr, 1642);
        expect(selected!.width, 'selected artwork resolves the rendered pixel demand up to the original source').toBeGreaterThanOrEqual(requiredPixels - 1);
        expect(result.pageOverflow).toBeLessThanOrEqual(1);
        await testInfo.attach('cold-hero-delivery', { body: JSON.stringify({ requests, ...result }, null, 2), contentType: 'application/json' });
      });
    }
  });
}
