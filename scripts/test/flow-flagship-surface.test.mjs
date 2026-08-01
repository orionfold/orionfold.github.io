import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
const readBinary = (relativePath) => readFileSync(new URL(`../../${relativePath}`, import.meta.url));

const nav = read('src/components/Nav.astro');
const navArray = nav.match(/const links = \[([\s\S]*?)\n\];/)?.[1] ?? '';
const navLabels = [...navArray.matchAll(/label: '([^']+)'/g)].map((match) => match[1]);
assert.deepEqual(navLabels.slice(0, 3), ['Flow', 'Relay', 'Arena']);
assert.equal(navLabels.includes('Proof'), false, 'Proof must stay out of the top-level nav array');

const rail = read('src/components/product/ProductLineRail.astro');
const railNames = [...rail.matchAll(/name: '([^']+)'/g)].map((match) => match[1]);
assert.deepEqual(railNames, ['Flow', 'Relay', 'Arena']);
assert.match(rail, /The Orionfold line · Flow leads/);
assert.doesNotMatch(rail, /name: 'Proof'/);

const flow = read('src/pages/flow.astro');
for (const phrase of ['In development', 'closed-source', 'freemium subscription', 'The document that keeps the work moving.']) {
  assert.match(flow, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
}
assert.doesNotMatch(flow, /data-checkout=/, 'Flow must not expose checkout before commercial terms exist');
assert.match(flow, /<ProductLineRail current="flow"/);
assert.match(flow, /text-\[clamp\(1\.5rem,3\.5vw,3\.4rem\)\]/, 'Flow hero title stays at the operator-directed 50% scale');
assert.doesNotMatch(flow, /text-\[clamp\(3rem,7vw,6\.8rem\)\]/, 'Flow hero title must not restore the prior scale');
assert.match(flow, /<h1 class="hero-gradient-text /, 'Flow hero title uses the shared Orionfold gradient fill');
assert.match(flow, /flowStorySlug = 'limitless-without-the-pill'/);
assert.equal((flow.match(/href=\{flowStoryHref\}/g) ?? []).length, 2, 'Flow hero and story card must share the canonical story route');
assert.equal((flow.match(/Read the story/g) ?? []).length, 1, 'The hero action must name the story directly');
assert.doesNotMatch(flow, /Follow the build/);
assert.match(flow, /<StoryCard/);
for (const benefit of ['Native Mac app', 'One document, many modes', 'Receipts built in']) {
  assert.match(flow, new RegExp(`<span class="flow-chip">${benefit}<\\/span>`));
}
assert.doesNotMatch(flow, /<span class="flow-chip">(?:Closed source|Freemium subscription)<\/span>/);
assert.match(flow, /import FlowHeroCreative from '\.\.\/components\/flow\/FlowHeroCreative\.astro'/);
assert.match(flow, /<FlowHeroCreative \/>/);
assert.doesNotMatch(flow, /FlowArtwork/);
assert.match(flow, /<FlowWaitlist placement="flow" storyHref=\{flowStoryHref\} \/>/);
assert.ok(flow.indexOf('<ProductLineRail current="flow"') < flow.indexOf('<FlowWaitlist placement="flow"'), 'Flow waitlist belongs after the full product story and line rail');

const flowWaitlist = read('src/components/sections/FlowWaitlist.astro');
for (const phrase of [
  "'home-flow-waitlist'",
  "'flow-page-waitlist'",
  'offer="flow-waitlist"',
  'Join the waitlist',
  'Check your inbox to confirm.',
  'AI For Everyone digest, one email a week, no more',
  'href="/privacy/"',
  'Read the story',
]) {
  assert.match(flowWaitlist, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(flowWaitlist, /import WaitlistForm from '\.\.\/ui\/WaitlistForm\.astro'/);
assert.doesNotMatch(flowWaitlist, /type="(text|tel|number)"/, 'Flow waitlist must remain email-only apart from the shared honeypot');

const homePage = read('src/pages/index.astro');
const homeHeroIndex = homePage.indexOf('<Hero />');
const homeFlowIntroIndex = homePage.indexOf('<HomeFlowIntro />');
const homeFlowWaitlistIndex = homePage.indexOf('<FlowWaitlist placement="home" />');
const homeProductLineIndex = homePage.indexOf('<CapabilitySystemMap />');
assert.ok(
  homeHeroIndex >= 0 && homeHeroIndex < homeFlowIntroIndex && homeFlowIntroIndex < homeFlowWaitlistIndex && homeFlowWaitlistIndex < homeProductLineIndex,
  'Homepage order must be hero, Flow introduction, Flow waitlist, then the broader product line',
);
const capabilitySystemMap = read('src/components/sections/CapabilitySystemMap.astro');
assert.match(
  capabilitySystemMap,
  /\.flow-cta \{[\s\S]*?white-space: nowrap;/,
  'the Three durable work surfaces CTA must stay on one line',
);
const homeFlowIntro = read('src/components/sections/HomeFlowIntro.astro');
assert.match(homeFlowIntro, /Introducing Orionfold Flow/);
assert.match(homeFlowIntro, /One document\. Every mode of work\./);
assert.match(homeFlowIntro, /href="\/flow\/"/);
assert.match(homeFlowIntro, /import FlowWorkbenchIllustration from '\.\.\/flow\/FlowWorkbenchIllustration\.astro'/);
assert.match(homeFlowIntro, /<FlowWorkbenchIllustration \/>/);
assert.doesNotMatch(homeFlowIntro, /home-flow-intro__step/, 'the retired numbered-card illustration must stay removed');

const flowWorkbench = read('src/components/flow/FlowWorkbenchIllustration.astro');
assert.match(flowWorkbench, /import lightMaster from '\.\.\/\.\.\/assets\/flow\/living-workbench-light-alpha-v2\.png'/);
assert.match(flowWorkbench, /import darkMaster from '\.\.\/\.\.\/assets\/flow\/living-workbench-dark-alpha-v2\.png'/);
assert.match(flowWorkbench, /const widths = \[480, 720, 960, 1180\] as const/);
assert.equal((flowWorkbench.match(/format: 'webp', quality: 100/g) ?? []).length, 2, 'both theme masters must use maximum-quality responsive encoding');
assert.match(flowWorkbench, /data-relay-shot/);
assert.match(flowWorkbench, /data-shot-light-src=\{lightSrc\}/);
assert.match(flowWorkbench, /data-shot-dark-src=\{darkSrc\}/);
assert.match(flowWorkbench, /loading=\{priority \? 'eager' : 'lazy'\}/);
assert.match(flowWorkbench, /fetchpriority=\{priority \? 'high' : 'low'\}/);
assert.match(flowWorkbench, /aria-label="How Flow keeps work continuous:/);
assert.doesNotMatch(flowWorkbench, /<svg\b/, 'the approved generated raster must replace the hand-drawn SVG');
assert.match(flowWorkbench, /perspective: 1500px/);
assert.match(flowWorkbench, /animation: flow-workbench-perspective-drift 14s ease-in-out infinite alternate/);
assert.match(flowWorkbench, /:global\(html\[data-theme='dark'\]\) \.flow-workbench/);
assert.match(flowWorkbench, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none !important/);
const transparentLight = readBinary('src/assets/flow/living-workbench-light-alpha-v2.png');
const transparentDark = readBinary('src/assets/flow/living-workbench-dark-alpha-v2.png');
assert.equal(transparentLight[25], 6, 'the light Living Workbench master must be an RGBA PNG');
assert.equal(transparentDark[25], 6, 'the dark Living Workbench master must be an RGBA PNG');
assert.equal(
  createHash('sha256').update(transparentLight).digest('hex'),
  '900356a19c851ebb75889d58ffa62b6d42a28d7c112c8402bb501c585ee804d6',
  'the source-faithful transparent light-theme Living Workbench master must not drift',
);
assert.equal(
  createHash('sha256').update(transparentDark).digest('hex'),
  'eb26b2d6a624c6b7eee14e5cd5256c6b02d5bf87d9e894c802c269fe3059cd55',
  'the source-faithful transparent dark-theme Living Workbench master must not drift',
);
assert.match(flow, /--bp-line: color-mix\(in oklch, var\(--color-primary\) 12%, transparent\)/);
assert.match(flow, /background-size: 24px 24px, 24px 24px, 120px 120px, 120px 120px/);
assert.match(flow, /mask-image: radial-gradient\(ellipse 82% 74% at 68% 45%, black 38%, transparent 100%\)/);
assert.match(flow, /<div class="flow-hero__fade" aria-hidden="true"><\/div>/);

const flowStory = read('src/content/story/limitless-without-the-pill.md');
const flowStoryBody = flowStory.split('\n---\n').slice(1).join('\n---\n').trim();
assert.equal(flowStoryBody.length, 28_779, 'operator-written X article body must remain complete after link cleanup');
assert.equal(
  createHash('sha256').update(flowStoryBody).digest('hex'),
  '7a100eae06a80c1e1143830bfeee59ec56dc739c6c5835ab90e6c9f23387f380',
  'operator-written article wording, order, citations, lists, and link treatment must stay intact',
);
assert.match(flowStory, /hero: \.\.\/\.\.\/assets\/story\/limitless-without-the-pill\/hero\.png/);
assert.match(flowStory, /^## The Seven R’s of the AI-Native Renaissance$/m);
assert.match(flowStory, /^### F — Frame the outcome$/m);
assert.equal((flowStoryBody.match(/^- /gm) ?? []).length, 14, 'both source lists must retain all 14 items');
for (const internalLink of [
  '[Meet the builder](/about/)',
  '[Explore Orionfold](/)',
  '[Read “The Lab That Shipped Itself”](/story/the-lab-that-shipped-itself/)',
  '[Read “The Glue Tax”](/story/the-glue-tax/)',
  '[Read “Same Input, Same Receipt”](/story/same-input-same-receipt/)',
  '[Read “The Fix That Changed the Leaderboard”](/story/the-fix-that-changed-the-leaderboard/)',
  '[Orionfold Stories](/story/)',
]) {
  assert.match(flowStory, new RegExp(internalLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.doesNotMatch(flowStory, /utm_/i, 'story links must not carry UTM parameters');
assert.doesNotMatch(flowStory, /https:\/\/orionfold\.com/i, 'Orionfold-owned links must be site-relative');

const flowHeroCreative = read('src/components/flow/FlowHeroCreative.astro');
assert.match(flowHeroCreative, /import FlowWorkbenchIllustration from '\.\/FlowWorkbenchIllustration\.astro'/);
assert.match(flowHeroCreative, /<FlowWorkbenchIllustration priority \/>/);
assert.doesNotMatch(flowHeroCreative, /assets\/story\/limitless-without-the-pill\/hero\.png/);
assert.equal(
  createHash('sha256').update(readBinary('src/assets/story/limitless-without-the-pill/hero.png')).digest('hex'),
  'cc6a5f04f26518316dafa1bbd282e5c728f8cba41c11f9b0008dfc44e7de7545',
  'the operator-supplied story creative must remain intact for the story page',
);
assert.equal(
  existsSync(new URL('../../src/components/flow/FlowArtwork.astro', import.meta.url)),
  false,
  'the replaced deterministic SVG must not remain as an unused hero implementation',
);

assert.match(read('src/pages/relay/index.astro'), /<ProductLineRail current="relay"/);
assert.match(read('src/pages/arena.astro'), /<ProductLineRail current="arena"/);
assert.match(read('src/pages/proof.astro'), /<ProductLineRail class=/);

const software = read('src/data/software.ts');
const flowIndex = software.indexOf("slug: 'flow'");
const relayIndex = software.indexOf("slug: 'relay'");
const arenaIndex = software.indexOf("slug: 'arena'");
assert.ok(flowIndex >= 0 && flowIndex < relayIndex && relayIndex < arenaIndex, 'software order must be Flow, Relay, Arena');
assert.match(software.slice(flowIndex, relayIndex), /group: 'flagship'/);
assert.match(software.slice(relayIndex, arenaIndex), /group: 'flagship'/);
assert.match(software.slice(arenaIndex, software.indexOf("slug: 'proof'")), /group: 'flagship'/);
const proofEntry = software.slice(software.indexOf("slug: 'proof'"), software.indexOf('// ── The platform'));
assert.match(proofEntry, /group: 'devtools'/, 'Proof stays in the catalog without remaining a flagship');

const footer = read('src/components/Footer.astro');
assert.match(footer, /flow: '\/flow\/'/);
assert.match(footer, /proof: '\/proof\/'/);
assert.match(footer, /Site source: Apache 2\.0/);

const terms = read('src/pages/terms.astro');
assert.match(terms, /publishes open-source software and also develops proprietary commercial software/);
assert.match(terms, /Proprietary products, including Orionfold Flow/);
assert.doesNotMatch(terms, /Orionfold software is open source\./);

const homeHero = read('src/components/sections/Hero.astro');
assert.match(homeHero, /Flow leads the Orionfold line/);
assert.match(homeHero, /href="\/flow\/"/);
for (const benefit of ['Native Mac app', 'One document, many modes', 'Receipts built in']) {
  assert.match(homeHero, new RegExp(`<span class="home-flow__chip">${benefit}<\\/span>`));
}
assert.doesNotMatch(homeHero, /<span class="home-flow__chip">(?:Closed source|Freemium subscription)<\/span>/);
assert.match(homeHero, /import HomeFlowHeroCreative from '\.\.\/flow\/HomeFlowHeroCreative\.astro'/);
assert.match(homeHero, /<HomeFlowHeroCreative href="\/flow\/" \/>/);
const homeFlowHeroCreative = read('src/components/flow/HomeFlowHeroCreative.astro');
assert.match(homeFlowHeroCreative, /assets\/story\/limitless-without-the-pill\/hero\.png/);
assert.match(homeFlowHeroCreative, /loading="eager"/);
assert.match(homeFlowHeroCreative, /fetchpriority="high"/);
assert.match(homeFlowHeroCreative, /animation: home-flow-hero-perspective-drift 14s ease-in-out infinite alternate/);
assert.doesNotMatch(homeHero, /FlowArtwork/);
assert.doesNotMatch(homeHero, /data-checkout=/);

assert.match(read('src/data/og.ts'), /'\/flow\/': \{/);
assert.match(read('tests/e2e/critical-routes.spec.ts'), /'\/flow\/'/);
assert.match(read('public/llms.txt'), /\[Flow\]\(https:\/\/orionfold\.com\/flow\/\)/);

console.log('[flow-flagship-surface] Flow leads, Proof stays contextual, and prelaunch commerce remains truthful');
