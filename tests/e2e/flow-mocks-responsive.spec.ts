import { expect, test } from './fixtures';

// The native Flow mocks (path cards, diagrams, document windows, the /flow/
// Home mock) must fit the phone. Page-level scrollWidth cannot catch this:
// the body clips overflow-x, so a card can run off-screen with no scrollbar.
// Each mock box is checked against the viewport, and its visible parts
// against the box. Every Home-mock panel is shown and every document is put
// in its "proposal" stage, where the after-values are widest.
const PAGES = ['/', '/flow/', '/flow/paths/'];

for (const width of [320, 390]) {
  for (const path of PAGES) {
    test(`Flow mocks fit inside their cards on ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const bad = await page.evaluate(() => {
        document.querySelectorAll<HTMLElement>('.fp-feat[hidden]').forEach((el) => { el.hidden = false; });
        document.querySelectorAll('.dm').forEach((el) => el.classList.add('is-live', 'is-s2'));
        const vw = document.documentElement.clientWidth;
        const out: string[] = [];
        for (const box of document.querySelectorAll('.ps, .fp-feat, .fp-app, .dm-window, .pd, .dm-kpis > div')) {
          const b = box.getBoundingClientRect();
          if (!b.width) continue;
          if (b.left < -0.5 || b.right > vw + 0.5) out.push(`${box.className} leaves the viewport (${Math.round(b.left)}..${Math.round(b.right)})`);
          for (const el of box.querySelectorAll('*')) {
            // The review bar's stages and the card thumbnails clip on purpose.
            if (el.closest('.dm-r, .ps-thumb')) continue;
            const r = el.getBoundingClientRect();
            if (!r.width) continue;
            if (r.left < b.left - 1 || r.right > b.right + 1) {
              out.push(`${el.tagName.toLowerCase()}.${el.className} pokes out of ${box.className} by ${Math.round(Math.max(b.left - r.left, r.right - b.right))}px`);
              break;
            }
          }
        }
        return out;
      });
      expect(bad).toEqual([]);
    });
  }
}
