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

// The wedge headline over the locked tagline in the title tag.
assert.match(home, /The AI document app that shows its work/);
assert.match(home, /title=\{`\$\{SITE\.tagline\} · Orionfold`\}/);
assert.match(home, /hero-gradient-text/, 'the hero title keeps the shared Orionfold gradient fill');
assert.match(home, /home-chip--accent">Patent pending</, 'the patent-pending chip stays in the hero');

// Hero email capture: the demand-gen surface with its own attribution source.
assert.match(home, /<WaitlistForm\s[\s\S]*?id="home-hero-waitlist"[\s\S]*?offer="flow-waitlist"/);
assert.match(home, /Free to join · Double opt-in · One email a week, no more/);

// The real development-build capture is the hero visual and the only eager image
// candidate; FlowShot renders eager + fetchpriority only when priority is set.
assert.match(home, /<FlowShot\s[\s\S]*?src=\{shotApprove\}[\s\S]*?priority\s/);
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
  /description:\s*\n\s*'Orionfold Flow is the Mac app where AI works inside your document, not a chat window\. Every change is a diff you approve, with a receipt naming what ran, where, and what it cost\. Patent pending\. Join the waitlist\.'/,
);
assert.match(
  seo,
  /ogImageAlt:\s*\n\s*'Orionfold Flow, patent pending: conduct beautiful documents with AI agency built in\. A real capture of the Mac app reviewing an AI change as an exact diff with evidence, checks, and approval\.'/,
);
assert.match(seo, /slogan: SITE\.tagline/);
assert.match(seo, /description: SITE\.description/);
assert.match(og, /'\/': \{[\s\S]*title: SITE\.tagline[\s\S]*alt: SITE\.ogImageAlt/);

console.log('home hero: Flow wedge copy, real capture, waitlist capture, and metadata contracts pass');
