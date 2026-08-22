// Homepage hero contracts. Rewritten 2026-08-15 for the Flow takeover: the
// hero is inline in index.astro, leads with the buyer-language wedge headline,
// captures email directly, and shows the real development-build capture as the
// only eager image on the page (mobile-perf hygiene: one eager image max).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

const home = read('src/pages/index.astro');
const seo = read('src/data/seo.ts');
const og = read('src/data/og.ts');
const flowShot = read('src/components/flow/FlowShot.astro');

// 2026-08-21 hero rewrite (operator direction): the H1 is the OUTCOME (the
// locked tagline), the lede carries the offline wedge, and the contrast
// headline that used to be the H1 now leads the capability bands. All three
// still have to be on the page.
assert.match(home, /Conduct beautiful documents\. Choose where AI operates\./, 'the H1 is the tagline plus the control');
assert.doesNotMatch(home, /Every other AI tool sends your document to a cloud/, 'the hero drops the lede paragraph; the headline carries the wedge');
assert.match(home, /Most AI tools rewrite your document\. Flow asks first\./, 'the approval contrast survives as the lead band');
assert.match(home, /title=\{HOME_TITLE\}/);
assert.match(home, /hero-gradient-text/, 'the hero title keeps the shared Orionfold gradient fill');
assert.match(home, /home-chip--accent">Patent pending</, 'the patent-pending chip stays in the hero');

// Hero email capture: the demand-gen surface with its own attribution source.
assert.match(home, /<WaitlistForm\s[\s\S]*?id="home-hero-waitlist"[\s\S]*?offer="flow-waitlist"/);
assert.match(home, /Free to join · Double opt-in · One email a week, no more/);

// The real capture is the hero visual and the only eager image candidate;
// FlowShot renders eager + fetchpriority only when priority is set.
// 2026-08-21: the hero shot became a FLOW GUIDE DOCUMENT capture. Flow is
// roughly 90% rendered document and 10% chrome, and every hero shot before
// this date showed the chrome. The headline promises beautiful documents and
// the picture is now one, so the two agree.
assert.match(home, /<FlowShot\s[\s\S]*?src=\{shotGuideSales\}[\s\S]*?priority\s/);
assert.match(flowShot, /loading=\{priority \? 'eager' : 'lazy'\}/);
assert.match(flowShot, /fetchpriority=\{priority \? 'high' : undefined\}/);
assert.equal((home.match(/\spriority\b/g) ?? []).length, 1, 'exactly one FlowShot is the eager hero image');

// The measured stat strip under the hero shot.
for (const value of ['22.3 ms', '$0.00425', '+19.2 MiB', '140 changes']) {
  assert.match(home, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${value} must stay in the hero stat strip`);
}
// 2026-08-21: "development build" became "running build" in the pre-launch
// reframing. The assertion protects the SCOPE line under the hero stats, not
// the word "development" — every figure must still name what it was measured on.
assert.match(home, /Measured on the running build/);

// Scroll-perf hardening: hero glows are gradients, never blur filters.
assert.match(home, /radial-gradient\(closest-side, color-mix\(in oklch, var\(--color-primary\)/);
assert.doesNotMatch(home, /^\s+filter: blur\(/m, 'blur-filter declarations were removed from the homepage as a scroll-jank source');

// Site metadata carries the wedge with waitlist intent.
assert.match(seo, /tagline: 'Conduct beautiful documents with AI agency built in'/);
assert.match(
  seo,
  /description:\s*\n\s*'Orionfold Flow is the Mac app that brings AI to your documents instead of sending them to a cloud\. It works with the wifi off, and every change is a diff you approve\. Patent pending\.'/,
);
assert.match(
  seo,
  /ogImageAlt:\s*\n\s*'Orionfold Flow, patent pending: conduct beautiful documents with AI agency built in\. A real capture of the Mac app showing a finished document with charts and tables drawn in place from plain Markdown\.'/,
);
assert.match(seo, /slogan: SITE\.tagline/);
assert.match(seo, /description: SITE\.description/);
// The home card's title tracks the home H1. It reused the tagline until
// 2026-08-16, then argued the approval promise from 2026-08-20. On 2026-08-21
// the H1 became the tagline again, so the card follows it back -- this is the
// H1 tracking rule holding, not a revert.
const homeOg = og.match(/'\/': \{([\s\S]*?)\n  \},/)?.[1] ?? '';
assert.match(homeOg, /title: 'Conduct beautiful documents\.'/);
assert.doesNotMatch(homeOg, /title: SITE\.tagline/, 'the card states its own claim rather than importing the constant');
// The alt text must describe the card's own capture. That capture is now a
// quota attainment chart drawn inside a Flow document, not the decision footer.
assert.doesNotMatch(homeOg, /alt: SITE\.ogImageAlt/);
assert.match(homeOg, /alt: '[^']*attainment chart/);

console.log('home hero: Flow wedge copy, real capture, waitlist capture, and metadata contracts pass');
