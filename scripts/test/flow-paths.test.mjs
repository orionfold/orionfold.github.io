// Flow 2.0 Paths: the sync transform and the published-path invariants.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { maskParity, publishBody, splitArticle } from '../sync-flow-paths.mjs';

const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const ARTICLE = `# Title here

*The standfirst, one line.*

![Home: the path](shots/01-home.png)

## The job

Body with ![a shot](shots/02-step.png) inline.

## Update: build 0249-1 (2026-09-28, not yet released)

Fixed later.

## Notes for reviewers (not for publication)

Internal.

## Evidence

| Claim | Value | Label |
`;

test('publishBody drops the H1, lifts the dek and hero, and rewrites shots', () => {
  const out = publishBody(ARTICLE, { slug: 'demo' });
  assert.equal(out.dek, 'The standfirst, one line.');
  assert.deepEqual(out.hero, { alt: 'Home: the path', name: '01-home' });
  assert.deepEqual(out.shots, ['01-home', '02-step']);
  assert.doesNotMatch(out.body, /^# /m);
  assert.doesNotMatch(out.body, /01-home/, 'the hero shot leaves the body');
  assert.match(out.body, /\]\(\.\.\/\.\.\/assets\/flow\/paths\/demo\/02-step\.webp\)/);
  assert.doesNotMatch(out.body, /not for publication|Internal\./);
  assert.doesNotMatch(out.body, /Update: build 0249-1/, 'an unreleased build update stays out');
  assert.match(out.body, /## Evidence/);
});

test('publishBody includes a build update once that build is released', () => {
  const out = publishBody(ARTICLE, { slug: 'demo', released: ['0249-1'] });
  assert.match(out.body, /## Update: build 0249-1/);
});

const dir = new URL('src/content/paths/', root);
const entries = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => {
  const { front, body } = splitArticle(readFileSync(new URL(f, dir), 'utf8'));
  return { slug: f.replace(/\.md$/, ''), front, body };
});
const published = entries.filter((e) => !e.front.draft);

test('every published path is complete and honest about its build', () => {
  assert.ok(published.length >= 5, 'the five walked paths are published');
  for (const { slug, front, body } of published) {
    assert.match(front.build, /Flow 2\.0\.\d+/, `${slug} names the build it was walked on`);
    assert.ok(front.receipt.length >= 3, `${slug} has a receipt card`);
    for (const r of front.receipt) assert.ok(['verified', 'derived', 'assumed', 'unknown'].includes(r.evidence), `${slug}: ${r.label} carries an evidence label`);
    assert.match(body, /^## Evidence$/m, `${slug} keeps its evidence table`);
    assert.doesNotMatch(body, /not for publication|not yet released/i, `${slug} carries no internal section`);
    for (const shot of [front.cardShot, ...[...body.matchAll(/paths\/[^/]+\/([\w.-]+)\.webp\)/g)].map((m) => m[1])]) {
      assert.ok(existsSync(new URL(`src/assets/flow/paths/${slug}/${shot}.webp`, root)), `${slug}: ${shot}.webp exists`);
    }
    assert.ok(existsSync(new URL(`src/assets/flow/paths/${slug}/card.jpg`, root)), `${slug} has a social card image`);
    assert.doesNotMatch(front.summary, /true to the code/i, `${slug}: never claim Flow keeps docs true to the code (#782)`);
  }
});

test('Status from what you already have stays a draft until the PDF reader default is decided (#802)', () => {
  // Its title says none of the files leaves the Mac, but PDF Import defaults to
  // a cloud reader. Lift this only when the operator clears the wording.
  const status = entries.find((e) => e.slug === 'status-from-what-you-have');
  if (status) assert.equal(status.front.draft, true);
});

test('llms.txt lists every published path', () => {
  const llms = read('public/llms.txt');
  assert.match(llms, /\(https:\/\/orionfold\.com\/flow\/paths\/\)/);
  for (const { slug } of published) assert.match(llms, new RegExp(`/flow/paths/${slug}/\\)`), `llms.txt lists ${slug}`);
});

test('llms.txt lists the Compare hub and every compare page', () => {
  const llms = read('public/llms.txt');
  assert.match(llms, /\(https:\/\/orionfold\.com\/flow\/compare\/\)/);
  for (const f of readdirSync(new URL('../../src/content/compare/', import.meta.url)).filter((n) => n.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    assert.match(llms, new RegExp(`/flow/compare/${slug}/\\)`), `llms.txt lists ${slug}`);
  }
});

test('path and compare pages fit search-result titles and descriptions', async () => {
  const { fitTitle, fitDescription } = await import('../../src/lib/flow/seo-meta.ts');
  assert.equal(fitTitle('Short title · Orionfold', 'Fallback'), 'Short title · Orionfold');
  assert.equal(fitTitle('x'.repeat(80), 'Fallback'), 'Fallback');
  const long = 'First sentence is long enough to count as a real opening line for a page. ' + 'Second sentence keeps going and going well past the limit for a search snippet here.';
  assert.ok(fitDescription(long).length <= 160);
  assert.ok(fitDescription(long).endsWith('.'));
});

test('maskParity refuses a sharper original that still shows what the ops copy masked', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mask-parity-'));
  const noise = (w, h) => {
    const buf = Buffer.alloc(w * h * 3);
    for (let i = 0; i < buf.length; i++) buf[i] = (i * 7919) % 251;
    return sharp(buf, { raw: { width: w, height: h, channels: 3 } });
  };
  const white = { create: { width: 96, height: 96, channels: 3, background: '#ffffff' } };
  // The ops copy: a flat painted-out area. A masked original stays flat; a leaky one has detail there.
  const ops = path.join(dir, 'ops.png');
  const masked = path.join(dir, 'masked.png');
  const leaky = path.join(dir, 'leaky.png');
  await sharp(white).png().toFile(ops);
  await sharp({ create: { width: 192, height: 192, channels: 3, background: '#ffffff' } }).png().toFile(masked);
  await noise(192, 192).png().toFile(leaky);
  assert.equal(await maskParity(ops, masked), true);
  assert.equal(await maskParity(ops, leaky), false);
});
