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

// The wedge headline over the locked tagline in the title tag. Operator copy,
// 2026-08-16, written against the hero picture (see the shot assertion below).
assert.match(home, /Bring open AI models to your documents/);
assert.match(home, /title=\{`\$\{SITE\.tagline\} · Orionfold`\}/);
assert.match(home, /hero-gradient-text/, 'the hero title keeps the shared Orionfold gradient fill');
assert.match(home, /home-chip--accent">Patent pending</, 'the patent-pending chip stays in the hero');

// Hero email capture: the demand-gen surface with its own attribution source.
assert.match(home, /<WaitlistForm\s[\s\S]*?id="home-hero-waitlist"[\s\S]*?offer="flow-waitlist"/);
assert.match(home, /Free to join · Double opt-in · One email a week, no more/);

// The real development-build capture is the hero visual and the only eager image
// candidate; FlowShot renders eager + fetchpriority only when priority is set.
// The hero shot became the resource-popover capture on 2026-08-16: it is the one
// frame carrying the whole headline (usage, tokens, cost, model) at once, and
// unlike the other captures it stays legible WITHOUT an overlay crop, which is
// why the hero deliberately has no .of-stage detail.
assert.match(home, /<FlowShot\s[\s\S]*?src=\{shotResourcePopover\}[\s\S]*?priority\s/);
assert.match(flowShot, /loading=\{priority \? 'eager' : 'lazy'\}/);
assert.match(flowShot, /fetchpriority=\{priority \? 'high' : undefined\}/);
assert.equal((home.match(/\spriority\b/g) ?? []).length, 1, 'exactly one FlowShot is the eager hero image');

// The measured stat strip under the hero shot.
for (const value of ['22.3 ms', '$0.00425', '+19.2 MiB', '5 actions']) {
  assert.match(home, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${value} must stay in the hero stat strip`);
}
assert.match(home, /Measured on the development build/);

// Scroll-perf hardening: hero glows are gradients, never blur filters.
assert.match(home, /radial-gradient\(closest-side, color-mix\(in oklch, var\(--color-primary\)/);
assert.doesNotMatch(home, /^\s+filter: blur\(/m, 'blur-filter declarations were removed from the homepage as a scroll-jank source');

// Site metadata carries the wedge with waitlist intent.
assert.match(seo, /tagline: 'Conduct beautiful documents with AI agency built in'/);
assert.match(
  seo,
  /description:\s*\n\s*'Orionfold Flow is the Mac app where AI works in your document, not a chat window\. Every change is a diff you approve, with a receipt\. Patent pending\.'/,
);
assert.match(
  seo,
  /ogImageAlt:\s*\n\s*'Orionfold Flow, patent pending: conduct beautiful documents with AI agency built in\. A real capture of the Mac app reviewing an AI change as an exact diff with evidence, checks, and approval\.'/,
);
assert.match(seo, /slogan: SITE\.tagline/);
assert.match(seo, /description: SITE\.description/);
// The home card's title tracks the home H1, NOT SITE.tagline. It reused the
// tagline until 2026-08-16, so rewriting the hero to lead with the open-models
// wedge silently left the social card arguing the retired pitch.
const homeOg = og.match(/'\/': \{([\s\S]*?)\n  \},/)?.[1] ?? '';
assert.match(homeOg, /title: 'Bring open AI models to your documents'/);
assert.doesNotMatch(homeOg, /title: SITE\.tagline/);
// The alt text must describe the card's own capture (the local run and its
// zero-dollar spend), not the generic diff-review alt the whole site defaults to.
assert.doesNotMatch(homeOg, /alt: SITE\.ogImageAlt/);
assert.match(homeOg, /alt: '[^']*zero dollars/);

console.log('home hero: Flow wedge copy, real capture, waitlist capture, and metadata contracts pass');
