// Paper design system guards (G-139, operator 2026-10-30).
// Paper is built beside Living Systems and must not leak into it: its classes
// are pp- prefixed, its colors are tokens, and only PaperLayout loads it.
// The cast stays truthful: every Fold belongs to a published Domain, every
// sample client comes from that blueprint's own mock, and faces are labeled.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { signals, compare } from '../head-diff.mjs';

const root = new URL('../../', import.meta.url).pathname;
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = path.join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

test('Paper components use tokens only, never raw colors', () => {
  const css = read('src/styles/paper/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.deepEqual(css.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) ?? [], [], 'move the color into tokens.css as a --pp-* token');
});

test('every Paper class is pp- prefixed, so nothing collides with Living Systems', () => {
  const css = read('src/styles/paper/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((m) => m[1]).filter((s) => !/^\s*(@|from|to|\d)/.test(s));
  const bad = new Set();
  for (const sel of selectors) for (const [, cls] of sel.matchAll(/\.([a-zA-Z][\w-]*)/g)) if (cls !== 'paper' && !cls.startsWith('pp-')) bad.add(cls);
  assert.deepEqual([...bad], []);
});

test('only PaperLayout loads the Paper stylesheets', () => {
  const importers = [...walk(path.join(root, 'src'))]
    .filter((f) => /\.(astro|ts|css|mjs)$/.test(f) && /styles\/paper\//.test(readFileSync(f, 'utf8')))
    .map((f) => path.relative(root, f));
  assert.deepEqual(importers, ['src/layouts/PaperLayout.astro']);
});

test('Layout keeps Living Systems as the default design', () => {
  const src = read('src/layouts/Layout.astro');
  assert.match(src, /design = 'living'/);
  assert.match(src, /'living-site bg-surface text-text min-h-screen'/);
});

test('each Fold belongs to a published Domain, and sample clients come from its blueprint', () => {
  const folds = read('src/lib/paper/folds.ts');
  const cast = read('src/lib/paper/cast.ts');
  const slugs = [...folds.matchAll(/domainSlug: '([a-z0-9-]+)'/g)].map((m) => m[1]);
  assert.equal(slugs.length, 8);
  for (const slug of slugs) assert.ok(existsSync(path.join(root, `src/content/domains/${slug}.md`)), `${slug} is not a published Domain`);
  for (const [, id, client] of cast.matchAll(/^\s+(\w+): \{ area: '[^']*', who: '[^']*', client: '([^']*)'/gm)) {
    if (!client) continue;
    const slug = folds.match(new RegExp(`id: '${id}'[^}]*domainSlug: '([a-z0-9-]+)'`))[1];
    const mock = read(`src/content/domains/${slug}.md`).match(/^\s*client: "([^"]+)"/m)?.[1] ?? '';
    assert.ok(mock.startsWith(client), `${id}: "${client}" is not ${slug}'s sample client ("${mock}")`);
  }
});

test('faces always ship with the AI-generated label', () => {
  assert.match(read('src/lib/paper/cast.ts'), /FACES_LABEL = 'People shown are AI-generated models, not customers\.'/);
  assert.match(read('src/components/paper/Roster.astro'), /anyFace && <p[^>]*>\{FACES_LABEL\}/);
});

test('the component gallery is dev-only', () => {
  assert.match(read('src/pages/design/[...slug].astro'), /return import\.meta\.env\.DEV \? \[\{ params: \{ slug: undefined \} \}\] : \[\];/);
  if (existsSync(path.join(root, 'dist/index.html'))) assert.ok(!existsSync(path.join(root, 'dist/design')), 'the gallery was built for production');
});

test('Paper nav groups list at most five, then "All"', () => {
  const src = read('src/components/paper/PaperNav.astro');
  assert.match(src, /const PAPER_NAV_GROUP_MAX = 5;/);
  const flow = src.match(/\{ title: 'Flow', items: \[([\s\S]*?)\] \}/)[1];
  assert.ok((flow.match(/href:/g) ?? []).length <= 5);
  assert.ok(!/items: (?!top\(|\[)\w+\./.test(src), 'every data-driven group must go through top()');
});

test('head-diff catches a dropped JSON-LD block, canonical or internal link', () => {
  const page = '<html><head><title>T</title><meta name="description" content="D"><link rel="canonical" href="https://x/a/"><script type="application/ld+json">{"@type":"FAQPage"}</script></head><body><a href="/b/">b</a></body></html>';
  const before = { '/a/index.html': signals(page) };
  assert.deepEqual(compare(before, before), []);
  const stripped = { '/a/index.html': signals(page.replace(/<script[\s\S]*?<\/script>/, '').replace('<a href="/b/">b</a>', '')) };
  assert.equal(compare(before, stripped).length, 2);
  assert.deepEqual(compare(before, {}), ['/a/index.html: page no longer built']);
});
