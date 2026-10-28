// The OG card cache: a card renders once, then every build that leaves its
// copy, its framed image and the renderer alone reads the JPG back from
// node_modules/.astro/og-cards. deploy.yml persists that folder between runs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { cachedRender, cardKey, rendererDigest } from '../../src/lib/og/card-cache.ts';

const root = new URL('../../', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, root), 'utf8');

test('a card renders once and is read back until its copy, its image or the renderer changes', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'og-cache-'));
  const shot = path.join(dir, 'shot.bin');
  writeFileSync(shot, 'shot-1');
  let renders = 0;
  const render = async (o) => { renders += 1; return Buffer.from(`jpg:${o.title}:${renders}`); };
  const base = { title: 'Flow with Word', eyebrow: 'Compare', seed: 'word', screenshotPath: shot };
  const cacheDir = path.join(dir, 'cards');
  const a = await cachedRender(base, render, { cacheDir, renderer: 'r1' });
  const b = await cachedRender({ ...base }, render, { cacheDir, renderer: 'r1' });
  assert.equal(renders, 1, 'the second build reads the card back');
  assert.deepEqual(a, b, 'and gets the same bytes');
  await cachedRender({ ...base, title: 'Flow with Canva' }, render, { cacheDir, renderer: 'r1' });
  assert.equal(renders, 2, 'new copy renders');
  writeFileSync(shot, 'shot-2');
  await cachedRender(base, render, { cacheDir, renderer: 'r1' });
  assert.equal(renders, 3, 'a changed framed image renders, same path or not');
  await cachedRender(base, render, { cacheDir, renderer: 'r2' });
  assert.equal(renders, 4, 'a changed renderer renders');
  await cachedRender(base, render, { cacheDir, renderer: 'r2', enabled: false });
  assert.equal(renders, 5, 'OG_CARD_CACHE=0 bypasses the cache');
  assert.notEqual(cardKey(base, 'r1'), cardKey({ ...base, seed: 'other' }, 'r1'), 'every option is in the key');
  rmSync(dir, { recursive: true, force: true });
});

test('the renderer digest covers the renderer, the fonts and the banner, in a stable order', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'og-renderer-'));
  mkdirSync(path.join(dir, 'fonts'));
  writeFileSync(path.join(dir, 'card.ts'), 'a');
  writeFileSync(path.join(dir, 'fonts', 'Geist.ttf'), 'f');
  const d1 = rendererDigest(dir);
  assert.equal(d1, rendererDigest(dir), 'deterministic');
  writeFileSync(path.join(dir, 'fonts', 'Geist.ttf'), 'g');
  assert.notEqual(d1, rendererDigest(dir), 'a font change changes the digest');
  const real = rendererDigest();
  assert.match(real, /^[0-9a-f]{40}$/);
  rmSync(dir, { recursive: true, force: true });
});

test('the OG endpoint renders through the cache, logs each render, and CI keeps the cache folder between runs', () => {
  const endpoint = read('src/pages/og/[slug].jpg.ts');
  assert.match(endpoint, /cachedRender\(props as CardOptions/, 'GET goes through cachedRender');
  assert.match(endpoint, /rendererDigest\(\)/, 'keyed on the renderer inputs');
  const deploy = read('.github/workflows/deploy.yml');
  assert.match(deploy, /path: node_modules\/\.astro\n/, 'the Astro cache folder is persisted');
  assert.match(endpoint, /\[og\] rendering \$\{params\.slug\}\.jpg/, 'each render is logged, so the build log shows what the cache missed');
});
