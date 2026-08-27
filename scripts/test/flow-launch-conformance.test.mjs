// G-117: one durable contract for the complete Flow launch path.
//
// The focused page tests protect individual surfaces. This test protects the
// seams between them: one navigation model, one vocabulary, one provider-state
// ledger, one set of qualified measurements, complete metadata, and a crawlable
// route graph. It intentionally reads dist/, so the normal CI order remains
// build -> Node contracts.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const read = (relativePath) => readFileSync(new URL(relativePath, ROOT), 'utf8');
const htmlPath = (route) => route === '/' ? 'dist/index.html' : `dist${route}index.html`;
const htmlFor = (route) => read(htmlPath(route));
const esc = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const textBetween = (html, tag) => html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
const meta = (html, key, value) => html.match(new RegExp(`<meta\\s+${key}="${esc(value)}"\\s+content="([^"]*)"`, 'i'))?.[1] ?? '';
const link = (html, rel) => html.match(new RegExp(`<link\\s+rel="${esc(rel)}"\\s+href="([^"]*)"`, 'i'))?.[1] ?? '';

const routes = [
  ['/', 'Orionfold Flow for Mac · You drive the work. Flow tunes AI to your needs.', 'You drive the work. Flow tunes AI to your needs.'],
  ['/flow/', 'Orionfold Flow for Mac · Conduct useful work', 'Conduct useful work. Flow refines. You approve.'],
  ['/flow/tour/', 'Orionfold Flow product tour · See Flow at work', 'See Flow at work.'],
  ['/flow/writing-with-ai/', 'Flow · Writing with AI you approve · Orionfold', 'Write with AI. Keep the final word.'],
  ['/flow/documents-and-files/', 'Flow · Documents and files that stay yours · Orionfold', 'Do more with your files. Keep them yours.'],
  ['/flow/models-and-runtime/', 'Flow · Choose where AI runs · Orionfold', 'Choose where AI runs. Every time.'],
  ['/flow/receipts/', 'Flow · Receipts and evidence for every AI run · Orionfold', 'Know what AI did. Keep the record.'],
  ['/flow/enterprise/', 'Flow for enterprise · Govern AI in the document · Orionfold', 'Govern AI where the work happens.'],
  ['/flow/specifications/', 'Flow technical specifications · Orionfold', 'Technical specifications.'],
  ['/story/the-day-i-stopped-trusting-invisible-edits/', 'The Edit I Never Approved · Orionfold', 'The Edit I Never Approved'],
  ['/story/where-your-ai-actually-runs/', 'The Fan Was the Only Status Light · Orionfold', 'The Fan Was the Only Status Light'],
  ['/story/the-fastest-model-on-your-mac/', 'The Faster Model Was the Bigger One · Orionfold', 'The Faster Model Was the Bigger One'],
  ['/story/a-search-result-is-a-citation/', 'The Search Result That Moved · Orionfold', 'The Search Result That Moved'],
  ['/story/charts-that-come-from-the-words/', 'The Chart That Stayed Wrong · Orionfold', 'The Chart That Stayed Wrong'],
  ['/story/the-pit-crew-that-never-touches-the-wheel/', 'The Pit Crew That Never Touches the Wheel · Orionfold', 'The Pit Crew That Never Touches the Wheel'],
];

for (const [route, expectedTitle, expectedH1] of routes) {
  assert.ok(existsSync(new URL(htmlPath(route), ROOT)), `${route}: built HTML exists`);
  const html = htmlFor(route);
  const title = textBetween(html, 'title');
  const description = meta(html, 'name', 'description');
  const canonical = link(html, 'canonical');
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const h1 = textBetween(html, 'h1');

  assert.equal(title, expectedTitle, `${route}: title stays on the accepted launch promise`);
  assert.equal(h1, expectedH1, `${route}: one accepted H1 survives the complete build`);
  assert.equal(h1Count, 1, `${route}: exactly one H1`);
  assert.ok(description.length >= 90 && description.length <= 165, `${route}: description is useful and restrained (${description.length} chars)`);
  assert.equal(canonical, `https://orionfold.com${route}`, `${route}: canonical is exact`);
  assert.equal(meta(html, 'property', 'og:title'), title, `${route}: Open Graph title matches the page title`);
  assert.equal(meta(html, 'property', 'og:description'), description, `${route}: Open Graph description matches`);
  assert.equal(meta(html, 'property', 'og:url'), canonical, `${route}: Open Graph URL matches canonical`);
  assert.ok(meta(html, 'property', 'og:image'), `${route}: has a social image`);
  assert.ok(meta(html, 'property', 'og:image:alt'), `${route}: social image has descriptive alternative text`);
  assert.doesNotMatch(html, /<meta\s+name="robots"\s+content="noindex/i, `${route}: accepted launch routes remain indexable`);
  assert.match(html, /<html\s+lang="en"\s+data-theme="light">/, `${route}: the public site remains light-only`);
  assert.doesNotMatch(html, /See Flow plans/, `${route}: the Flow CTA does not drift to a pricing detour`);

  const jsonLd = [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.ok(jsonLd.length >= 1, `${route}: carries structured data`);
  for (const [index, source] of jsonLd.entries()) {
    assert.doesNotThrow(() => JSON.parse(source), `${route}: JSON-LD block ${index + 1} parses`);
  }
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    // Astro emits an empty decorative alternative as the valid compact HTML
    // boolean form `alt`; meaningful alternatives remain quoted strings.
    assert.match(tag, /\balt(?:="[^"]*")?(?:\s|>)/i, `${route}: every image declares an alt attribute`);
  }
}

// The homepage racing creative carries one pill into the launch story that
// walks the same driver / car / crew / record order (operator ask 2026-08-26).
assert.match(htmlFor('/'), /class="flow-pit__story-link"[^>]*href="\/story\/the-pit-crew-that-never-touches-the-wheel\/"[^>]*>\s*Read the launch story/, 'the homepage racing creative links to the launch story');

// The four-item local product rail is identical everywhere it appears and the
// global rail remains the short product family the operator selected.
const launchHtml = routes.map(([route]) => htmlFor(route)).join('\n');
for (const label of ['Flow', 'Relay', 'Arena', 'Books', 'Story']) {
  assert.match(launchHtml, new RegExp(`>\\s*${esc(label)}\\s*<`), `global navigation keeps ${label}`);
}
for (const route of routes.filter(([route]) => route.startsWith('/flow/')).map(([route]) => route)) {
  const html = htmlFor(route);
  for (const label of ['Overview', 'Tour', 'Tech Specs', 'Enterprise']) {
    assert.match(html, new RegExp(`>\\s*${esc(label)}\\s*<`), `${route}: local rail keeps ${label}`);
  }
}

// Every internal Flow link in the accepted package resolves to a built route or
// asset. This is narrower than a site-wide crawler by design: G-117 owns the
// Flow launch graph, not unrelated legacy surfaces.
const flowLinks = new Set();
for (const [route] of routes) {
  for (const match of htmlFor(route).matchAll(/\bhref="(\/flow\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    flowLinks.add(match[1] || '/flow/');
  }
}
for (const href of flowLinks) {
  const relative = href.endsWith('/') ? `dist${href}index.html` : `dist${href}`;
  assert.ok(existsSync(new URL(relative, ROOT)), `Flow link resolves: ${href}`);
}

// The sitemap contains the entire indexable package and excludes checkout and
// campaign-review routes even when the campaign flag is built separately.
const sitemapFiles = readdirSync(new URL('dist/', ROOT)).filter((name) => /^sitemap.*\.xml$/.test(name));
const sitemap = sitemapFiles.map((name) => read(`dist/${name}`)).join('\n');
for (const [route] of routes) {
  assert.match(sitemap, new RegExp(`<loc>https:\/\/orionfold\\.com${esc(route)}<\/loc>`), `${route}: appears in the sitemap`);
}
assert.doesNotMatch(sitemap, /\/flow\/welcome\//, 'post-checkout Flow welcome stays out of the sitemap');
assert.doesNotMatch(sitemap, /\/flow\/ideas-in-motion\//, 'campaign-review route stays out of the sitemap');

// One material claim ledger. These values are stable enough to market, carry
// their qualifiers on-page, and match the accepted product authority as of the
// G-117 rehearsal. Prepaid frontier execution remains launch priority until the
// product operator accepts 0165; local source progress alone cannot promote it.
const specifications = read('src/data/flow-specifications.ts');
const materialClaims = [
  specifications,
  read('src/data/flow-measurements.ts'),
  read('src/data/flow-pricing.ts'),
].join('\n');
for (const [provider, state] of [
  ['Flow Runtime', 'Built in'],
  ['Ollama', 'Runnable now'],
  ['Anthropic', 'Runnable now'],
  ['OpenAI', 'Runnable now'],
  ['OpenRouter', 'Runnable now'],
  ['LM Studio', 'Runnable now'],
  ['Codex CLI', 'Launch priority'],
  ['Claude Code', 'Launch priority'],
]) {
  assert.match(specifications, new RegExp(`provider: '${esc(provider)}'[\\s\\S]{0,180}?state: '${esc(state)}'`), `${provider}: state remains ${state}`);
}
for (const claim of [
  /Around 40 MB/,
  /34 chart types and 20 diagram types/,
  /22\.3 ms/,
  /10,000 notes/,
  /\$0\.00425/,
  /30–80% faster than Ollama/,
  /M3 Max with 36 GB of memory/,
]) {
  assert.match(materialClaims, claim, `technical claim survives: ${claim}`);
}
assert.match(read('src/data/flow-pricing.ts'), /Flow Guide[\s\S]*28 document guide, plus 13 assets/, 'the plan ledger carries the current bundled Guide inventory');

const visibleLaunchSource = [
  read('src/pages/flow.astro'),
  read('src/data/flow-categories.ts'),
  read('src/data/flow-specifications.ts'),
  read('src/components/flow/FlowLaunchHomeHero.astro'),
].join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
assert.doesNotMatch(visibleLaunchSource, /Apple Intelligence/i, 'withdrawn Apple Intelligence route is not marketed');
assert.doesNotMatch(visibleLaunchSource, /Flow Quick|global hotkey assistant/i, 'withdrawn Flow Quick is not marketed');

// Curated visual proof is part of the claim ledger. Each representative asset
// must remain a real committed bitmap rather than an empty path or tiny stub.
for (const asset of [
  'src/assets/flow/shots/first-launch-home-hero-welcome.webp',
  'src/assets/flow/shots/first-launch-flow-hero-project.webp',
  'src/assets/flow/shots/guide-document-gallery-project-plan-both-panes.webp',
  'src/assets/flow/details/detail-result.webp',
  'src/assets/flow/details/detail-run-cost.webp',
  'src/assets/flow/details/detail-routing-rules.webp',
  'src/assets/flow/details/detail-grid.webp',
  'src/assets/flow/launch/flow-ideas-pit-stop-daylight-wide.webp',
  'src/assets/flow/launch/flow-ideas-pit-stop-daylight-portrait.webp',
]) {
  const url = new URL(asset, ROOT);
  assert.ok(existsSync(url), `${asset}: curated proof exists`);
  assert.ok(statSync(url).size > 10_000, `${asset}: curated proof is not an empty or tiny stub`);
}

console.log(`flow launch conformance: ${routes.length} routes, ${flowLinks.size} Flow links, claims and curated proof agree`);
