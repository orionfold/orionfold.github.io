// Search-result sized titles and descriptions (2026-11-07 SEO pass).
// Layout.astro runs every page through fitSearchTitle and fitDescription, and
// short or unbrandable titles carry a hand-written seoTitle. This test pins the
// fitter's rules and checks every page in the built sitemap: a title of 30-65
// characters and a description of 70-165, the band the SEO audit scores.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const { fitSearchTitle } = await import('../../src/lib/flow/seo-meta.ts');

test('fitSearchTitle drops the brand, then section labels, never the page title', () => {
  assert.equal(fitSearchTitle('Short page · Orionfold'), 'Short page · Orionfold');
  const memo = 'Ten customers, one Host: isolation with an honest trust boundary · Relay Host & Cells · Orionfold';
  assert.equal(fitSearchTitle(memo), 'Ten customers, one Host: isolation with an honest trust boundary');
  const guide = 'Organize Customers, Projects, And Tasks · Relay User Guide · Orionfold';
  assert.equal(fitSearchTitle(guide), 'Organize Customers, Projects, And Tasks · Relay User Guide');
  const essay = 'The Work We Want to Keep: AI Documents and Human Judgment | Orionfold';
  assert.equal(fitSearchTitle(essay), 'The Work We Want to Keep: AI Documents and Human Judgment');
  // No brand suffix: later segments belong to the title, so it is left alone.
  const relay = 'Orionfold Relay · Run AI client work and see what each client costs';
  assert.equal(fitSearchTitle(relay), relay);
});

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const dist = new URL('../../dist/', import.meta.url);
// Titles pinned as accepted launch copy in flow-launch-conformance.test.mjs win
// over the length band (the manifesto's runs 68).
const PINNED_TITLES = new Set(['/manifesto/']);
const sitemap = new URL('sitemap-0.xml', dist);

test('every sitemap page has a search-result sized title and description', { skip: !existsSync(sitemap) && 'run after build' }, () => {
  const paths = [...readFileSync(sitemap, 'utf8').matchAll(/<loc>https:\/\/orionfold\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.ok(paths.length > 100, 'the sitemap lists the site');
  const off = [];
  for (const p of paths) {
    const html = readFileSync(new URL(`.${p}${p.endsWith('/') ? 'index.html' : ''}`, dist), 'utf8');
    const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1].trim() ?? '');
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '');
    if (!PINNED_TITLES.has(p) && (title.length < 30 || title.length > 65)) off.push(`${p} title ${title.length}: ${title}`);
    if (description.length < 70 || description.length > 165) off.push(`${p} description ${description.length}`);
  }
  assert.deepEqual(off, []);
});
