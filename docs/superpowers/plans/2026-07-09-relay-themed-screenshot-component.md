# Relay Theme-Aware Screenshot Component — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Relay product screenshots in the theme (light/dark) the visitor is viewing, keyed on the site's existing `data-theme` attribute, with zero JS, guaranteed single-fetch, zero CLS, and no LCP regression.

**Architecture:** A manifest-driven sync script vendors curated matched light/dark pairs from the Relay `_ASSETS/screenshots/` corpus as content-hashed WebP into `public/relay/shots/`, plus a small `src/data/relay-shots.json` index. A zero-JS `<ThemedShot>` Astro component reads that index and swaps `background-image` on `[data-theme]` (only the active variant is ever fetched), reserving layout via a manifest-derived `aspect-ratio`. A guarded rehype plugin bridges the same component into Rail B docs/api markdown via a portable `relay-shot:<id>` intent marker. A `_RELAY` handback locks the source-side pairing contract.

**Tech Stack:** Astro 5, `sharp` 0.34 (transitive via Astro, importable), Node ESM `.mjs` scripts, `unist-util-visit` (already a dep, used by `rehype-table-scroll.mjs`).

## Global Constraints

- **Work on `main` only. No branches/worktrees.** All work reversible + local. `[[work-on-main-no-worktrees]]`
- **Deploy is operator-gated.** Do local work, verify in-browser, then STOP for explicit go. Never push. `[[confirm-before-live-deploy]]`
- **No test runner exists** (`scripts.test` undefined, no vitest). Unit tests = standalone `node` assertion scripts under `scripts/` (matching the repo's `check-price-drift.mjs` verifier idiom). Component + swap behavior verify **in-browser** at `http://localhost:4321/`.
- **Public repo = commit is publish.** No secrets/PII; only `manav@orionfold.com` allowed in tracked files. `[[public-repo-boundary]]`
- **Publish-guard footgun:** a `_word` (e.g. `_RELAY`, `_ASSETS`) or a var ending `token/key/secret` in a commit message trips the hook → use `git commit -F <scratchfile>`. `[[publish-guard-secret-var-name-footgun]]`
- **Never write/commit/push the strategy repo.** `_RELAY` handback is written to disk only; operator posts it. `[[never-push-strategy-repo]]`
- **Corpus is read-only.** Sync reads `~/orionfold/relay/_ASSETS/screenshots/`; never writes back. `[[assets-website-publish-contract]]`
- **Carve-out:** the `/relay/demo/` bundle is untouched by every task here (renders light-as-designed, verbatim).
- **Perf invariant:** the component is always lazy/below-fold, never the LCP slot; keep mobile Lighthouse 90–99. `[[mobile-perf-hygiene]]`
- **Copy rule** (for the `_RELAY` handback prose): plain grade 3–5 English, no em-dashes, no AI tells. `[[website-copy-style]]`

**Corpus facts (verified 2026-07-09):** all 8 candidate shots are matched `dark+light` pairs at desktop `1440/1100`. Manifest path shape: `{theme}/{area}/{id}__{viewport}.png`. Manifest at `~/orionfold/relay/_ASSETS/screenshots/metadata/manifest.json`, key `entries[]`, each `{id, area, theme, viewport, path, viewportSize:{width,height}, pixelSize, features, ...}`. **The manifest has no per-shot `alt` field yet** — the sync falls back to `label` and the `_RELAY` handback requests a real `alt` (Unit 4, the one new source ask).

**RelayShowcase → corpus id map (the sweep):**
| Current `src/assets/relay/` PNG | Corpus id | area |
|---|---|---|
| `apps-starter-to-chat.png` | `apps-list` | apps |
| `costs-list.png` | `costs` | costs |
| `customers-list.png` | `customers-list` | customers |
| `tasks-list.png` | `tasks-board` | tasks |
| `inbox-list.png` | `inbox-approvals` | inbox |
| `home-list.png` | `home-cockpit` | home |
| `customers-detail.png` | (no matched-pair corpus id — see Task 6) | customers |

---

## Task 1: Sync script — manifest read, pair assertion, index emit (no image optimization yet)

Build the sync tool's data spine first: read the manifest, resolve an allow-list to matched pairs, fail loud on a half-pair, emit the index. Image optimization is added in Task 2 so this task's test stays fast and pure.

**Files:**
- Create: `scripts/sync-relay-shots.mjs`
- Create: `src/data/relay-shots.allow.json`
- Create: `scripts/test/sync-relay-shots.test.mjs`
- Create: `scripts/test/fixtures/manifest.sample.json`

**Interfaces:**
- Produces: `resolvePairs(manifest, allowList) -> { pairs: Array<{id, area, light:{path}, dark:{path}, ratio}>, errors: string[] }` — exported from `sync-relay-shots.mjs`. `ratio` is the string `"${viewportSize.width} / ${viewportSize.height}"`. `errors` is non-empty (and the CLI exits 1) when an allow-listed id is missing from the manifest or lacks a light+dark pair.
- Produces (CLI): `node scripts/sync-relay-shots.mjs` reads the real corpus + allow-list, writes `src/data/relay-shots.json`, exits non-zero on any error.

- [ ] **Step 1: Write the failing test**

```js
// scripts/test/sync-relay-shots.test.mjs
import assert from 'node:assert/strict';
import { resolvePairs } from '../sync-relay-shots.mjs';

const manifest = {
  entries: [
    { id: 'home-cockpit', area: 'home', theme: 'light', viewport: 'desktop', path: 'light/home/home-cockpit__desktop.png', viewportSize: { width: 1440, height: 1100 }, label: 'Home cockpit' },
    { id: 'home-cockpit', area: 'home', theme: 'dark', viewport: 'desktop', path: 'dark/home/home-cockpit__desktop.png', viewportSize: { width: 1440, height: 1100 }, label: 'Home cockpit' },
    { id: 'lonely-light', area: 'apps', theme: 'light', viewport: 'desktop', path: 'light/apps/lonely-light__desktop.png', viewportSize: { width: 1440, height: 1100 }, label: 'Lonely' },
  ],
};

// happy path: a matched pair resolves with ratio + label-as-alt fallback
{
  const { pairs, errors } = resolvePairs(manifest, ['home-cockpit']);
  assert.equal(errors.length, 0, 'no errors for a matched pair');
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].id, 'home-cockpit');
  assert.equal(pairs[0].ratio, '1440 / 1100');
  assert.equal(pairs[0].alt, 'Home cockpit', 'falls back to label when manifest has no alt');
  assert.equal(pairs[0].light.path, 'light/home/home-cockpit__desktop.png');
  assert.equal(pairs[0].dark.path, 'dark/home/home-cockpit__desktop.png');
}

// half-pair: fail loud
{
  const { errors } = resolvePairs(manifest, ['lonely-light']);
  assert.ok(errors.some((e) => e.includes('lonely-light')), 'half-pair produces an error naming the id');
}

// unknown id: fail loud
{
  const { errors } = resolvePairs(manifest, ['does-not-exist']);
  assert.ok(errors.some((e) => e.includes('does-not-exist')), 'unknown id produces an error naming the id');
}

console.log('sync-relay-shots resolvePairs: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test/sync-relay-shots.test.mjs`
Expected: FAIL — `Cannot find module '../sync-relay-shots.mjs'` (or `resolvePairs is not a function`).

- [ ] **Step 3: Write the allow-list seed**

```json
// src/data/relay-shots.allow.json
[
  "home-cockpit",
  "apps-list",
  "costs",
  "customers-list",
  "tasks-board",
  "inbox-approvals"
]
```

- [ ] **Step 4: Write minimal implementation (data spine only)**

```js
// scripts/sync-relay-shots.mjs
// Manifest-driven selective sync of Relay light/dark screenshot pairs.
// Reads the strategy-owned _ASSETS/screenshots corpus READ-ONLY, resolves an
// allow-list of ids to matched pairs, and (in the CLI path) optimizes each to
// WebP + emits src/data/relay-shots.json. Fails loud on a half-pair or an
// allow-listed id missing from the manifest. The /relay/demo/ bundle is NOT a
// themed-pair target and never appears here (demo captures are single-theme).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_CORPUS = new URL('file:///Users/manavsehgal/orionfold/relay/_ASSETS/screenshots/');

/** Group manifest entries by id, keep desktop, resolve matched light+dark pairs. */
export function resolvePairs(manifest, allowList) {
  const byId = new Map();
  for (const e of manifest.entries) {
    if (e.viewport && e.viewport !== 'desktop') continue; // v1: desktop shots only
    if (!byId.has(e.id)) byId.set(e.id, { id: e.id, area: e.area, themes: {}, viewportSize: e.viewportSize, alt: e.alt || e.label || e.id });
    byId.get(e.id).themes[e.theme] = { path: e.path };
  }
  const pairs = [];
  const errors = [];
  for (const id of allowList) {
    const rec = byId.get(id);
    if (!rec) { errors.push(`allow-listed id "${id}" not found in manifest`); continue; }
    if (!rec.themes.light || !rec.themes.dark) {
      const have = Object.keys(rec.themes).join('+') || 'none';
      errors.push(`id "${id}" is not a matched pair (has: ${have}); themed shots need both light and dark`);
      continue;
    }
    const vs = rec.viewportSize || { width: 16, height: 10 };
    pairs.push({ id, area: rec.area, alt: rec.alt, ratio: `${vs.width} / ${vs.height}`, light: rec.themes.light, dark: rec.themes.dark });
  }
  return { pairs, errors };
}

// CLI path is completed in Task 2 (adds WebP optimization + file writes).
async function main() {
  const corpus = process.argv.includes('--corpus')
    ? new URL(`file://${process.argv[process.argv.indexOf('--corpus') + 1]}/`)
    : DEFAULT_CORPUS;
  const manifest = JSON.parse(readFileSync(new URL('metadata/manifest.json', corpus), 'utf8'));
  const allow = JSON.parse(readFileSync(new URL('../src/data/relay-shots.allow.json', import.meta.url), 'utf8'));
  const { pairs, errors } = resolvePairs(manifest, allow);
  if (errors.length) { for (const e of errors) console.error(`[sync-relay-shots] ERROR: ${e}`); process.exit(1); }
  console.log(`[sync-relay-shots] resolved ${pairs.length} matched pairs (image optimization added in Task 2)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node scripts/test/sync-relay-shots.test.mjs`
Expected: PASS — `sync-relay-shots resolvePairs: all assertions passed`.

- [ ] **Step 6: Verify the CLI resolves against the real corpus (no writes yet)**

Run: `node scripts/sync-relay-shots.mjs`
Expected: `[sync-relay-shots] resolved 6 matched pairs (image optimization added in Task 2)` and exit 0.

- [ ] **Step 7: Commit**

Write the message to a scratch file (contains no `_word`, but keep the habit) and commit:
```bash
git add scripts/sync-relay-shots.mjs src/data/relay-shots.allow.json scripts/test/sync-relay-shots.test.mjs
git commit -m "feat(relay-shots): sync-script pair resolver + allow-list"
```

---

## Task 2: Sync script — WebP optimization, content-hash, index + prune

Complete the CLI: optimize each pair to downscaled WebP, name with a content hash, write to `public/relay/shots/<id>/`, emit `src/data/relay-shots.json`, and prune orphaned dirs.

**Files:**
- Modify: `scripts/sync-relay-shots.mjs` (extend `main()` + add `syncPair`, `pruneOrphans`)
- Create: `scripts/test/sync-relay-shots.optimize.test.mjs`

**Interfaces:**
- Consumes: `resolvePairs` from Task 1.
- Produces: on `node scripts/sync-relay-shots.mjs`, files `public/relay/shots/<id>/{light,dark}.<hash>.webp` and `src/data/relay-shots.json` shaped `{ [id]: { light, dark, ratio, alt, area } }` where `light`/`dark` are absolute site URLs like `/relay/shots/home-cockpit/dark.a1b2c3.webp`.
- Produces: `webpName(theme, buffer) -> "${theme}.${hash8}.webp"` (exported, for the test) — `hash8` = first 8 hex chars of a sha256 over the output WebP buffer.

- [ ] **Step 1: Write the failing test**

```js
// scripts/test/sync-relay-shots.optimize.test.mjs
import assert from 'node:assert/strict';
import { webpName } from '../sync-relay-shots.mjs';

const bufA = Buffer.from('fake-webp-bytes-A');
const bufB = Buffer.from('fake-webp-bytes-B');

const nameA = webpName('dark', bufA);
assert.match(nameA, /^dark\.[0-9a-f]{8}\.webp$/, 'name is <theme>.<hash8>.webp');
assert.equal(webpName('dark', bufA), nameA, 'stable for same bytes');
assert.notEqual(webpName('dark', bufB), nameA, 'hash changes with bytes (cache-bust)');
assert.match(webpName('light', bufA), /^light\./, 'theme prefix respected');

console.log('sync-relay-shots webpName: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test/sync-relay-shots.optimize.test.mjs`
Expected: FAIL — `webpName is not a function`.

- [ ] **Step 3: Extend the implementation**

Add near the top of `scripts/sync-relay-shots.mjs`:
```js
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

const MAX_WIDTH = 1280; // shots render <= 32rem (~512 CSS px) -> 1024 @2x; 1280 gives headroom
const WEBP_QUALITY = 82;
const PUBLIC_DIR = new URL('../public/relay/shots/', import.meta.url);

export function webpName(theme, buffer) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
  return `${theme}.${hash}.webp`;
}

/** Optimize one source PNG to a downscaled WebP buffer. */
async function toWebp(absPngUrl) {
  return sharp(fileURLToPath(absPngUrl))
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

/** Write both variants for one pair; return the index entry. */
async function syncPair(pair, corpus) {
  const dir = new URL(`${pair.id}/`, PUBLIC_DIR);
  rmSync(dir, { recursive: true, force: true }); // clean stale hashes for this id
  mkdirSync(dir, { recursive: true });
  const out = {};
  for (const theme of ['light', 'dark']) {
    const buf = await toWebp(new URL(pair[theme].path, corpus));
    const name = webpName(theme, buf);
    writeFileSync(new URL(name, dir), buf);
    out[theme] = `/relay/shots/${pair.id}/${name}`;
  }
  return { light: out.light, dark: out.dark, ratio: pair.ratio, alt: pair.alt, area: pair.area };
}

/** Remove public/relay/shots/<id> dirs not in the kept set. */
function pruneOrphans(keptIds) {
  if (!existsSync(PUBLIC_DIR)) return [];
  const removed = [];
  for (const name of readdirSync(PUBLIC_DIR, { withFileTypes: true })) {
    if (name.isDirectory() && !keptIds.has(name.name)) {
      rmSync(new URL(`${name.name}/`, PUBLIC_DIR), { recursive: true, force: true });
      removed.push(name.name);
    }
  }
  return removed;
}
```

Replace the Task-1 `main()` body's tail (after the `errors.length` guard) with:
```js
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const index = {};
  let before = 0, after = 0;
  for (const pair of pairs) {
    const entry = await syncPair(pair, corpus);
    index[pair.id] = entry;
  }
  const removed = pruneOrphans(new Set(pairs.map((p) => p.id)));
  writeFileSync(new URL('../src/data/relay-shots.json', import.meta.url), JSON.stringify(index, null, 2) + '\n');
  console.log(`[sync-relay-shots] wrote ${pairs.length} pairs to public/relay/shots/ + src/data/relay-shots.json`);
  if (removed.length) console.log(`[sync-relay-shots] pruned orphans: ${removed.join(', ')}`);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test/sync-relay-shots.optimize.test.mjs`
Expected: PASS — `sync-relay-shots webpName: all assertions passed`.

- [ ] **Step 5: Run the real sync + verify output**

Run: `node scripts/sync-relay-shots.mjs`
Expected: `wrote 6 pairs ...`, exit 0.
Run: `ls public/relay/shots/home-cockpit/`
Expected: two files `dark.<hash>.webp` and `light.<hash>.webp`.
Run: `node -e "const i=require('./src/data/relay-shots.json'); const e=i['home-cockpit']; console.log(e.ratio, e.light, e.dark); console.log('KB dark:', require('fs').statSync('public'+e.dark).size/1024|0)"`
Expected: `1440 / 1100 /relay/shots/home-cockpit/light.… /relay/shots/home-cockpit/dark.…` and a WebP well under the ~300–685 KB PNG source (target < ~120 KB).

- [ ] **Step 6: Add the npm script**

Modify `package.json` scripts — add:
```json
"sync:relay-shots": "node scripts/sync-relay-shots.mjs"
```

- [ ] **Step 7: Commit**

```bash
git add scripts/sync-relay-shots.mjs scripts/test/sync-relay-shots.optimize.test.mjs src/data/relay-shots.json public/relay/shots package.json
git commit -m "feat(relay-shots): webp optimize + content-hash + index + prune"
```

---

## Task 3: `<ThemedShot>` component

The zero-JS CSS `[data-theme]` swap component reading the Task-2 index.

**Files:**
- Create: `src/components/relay/ThemedShot.astro`
- Create: `scripts/test/themed-shot.render.test.mjs`

**Interfaces:**
- Consumes: `src/data/relay-shots.json` (Task 2).
- Produces: `<ThemedShot id="<corpus-id>" alt?="…" class?="…" />` — renders a `<div class="relay-shot …">` with inline `--shot-light`/`--shot-dark`/`aspect-ratio` and `role="img"` + `aria-label` (or `role="presentation"` when `alt=""`). Throws at build if `id` is not in the index.

- [ ] **Step 1: Write the failing test (renders the component to a string via a tiny harness)**

Because there is no test runner, test the pure logic by extracting it. Create the logic module the component will import, and test that.

```js
// scripts/test/themed-shot.render.test.mjs
import assert from 'node:assert/strict';
import { themedShotProps } from '../../src/components/relay/themed-shot.logic.mjs';

const index = { 'home-cockpit': { light: '/l.webp', dark: '/d.webp', ratio: '1440 / 1100', alt: 'Home cockpit', area: 'home' } };

// resolves style + a11y for a known id
{
  const p = themedShotProps(index, { id: 'home-cockpit' });
  assert.equal(p.style, '--shot-light:url("/l.webp");--shot-dark:url("/d.webp");aspect-ratio:1440 / 1100;');
  assert.equal(p.role, 'img');
  assert.equal(p.ariaLabel, 'Home cockpit');
}
// alt override
{
  const p = themedShotProps(index, { id: 'home-cockpit', alt: 'Custom context' });
  assert.equal(p.ariaLabel, 'Custom context');
}
// decorative escape hatch
{
  const p = themedShotProps(index, { id: 'home-cockpit', alt: '' });
  assert.equal(p.role, 'presentation');
  assert.equal(p.ariaLabel, undefined);
}
// unknown id throws with a helpful message
assert.throws(() => themedShotProps(index, { id: 'nope' }), /unknown shot id "nope"/);

console.log('themed-shot logic: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test/themed-shot.render.test.mjs`
Expected: FAIL — `Cannot find module '.../themed-shot.logic.mjs'`.

- [ ] **Step 3: Write the logic module**

```js
// src/components/relay/themed-shot.logic.mjs
// Pure prop resolution for ThemedShot, extracted so it is unit-testable
// without a browser or Astro runtime.
export function themedShotProps(index, { id, alt }) {
  const shot = index[id];
  if (!shot) {
    throw new Error(`ThemedShot: unknown shot id "${id}" — run \`npm run sync:relay-shots\` or check src/data/relay-shots.allow.json`);
  }
  const label = alt === undefined ? shot.alt : alt; // '' => decorative
  return {
    style: `--shot-light:url("${shot.light}");--shot-dark:url("${shot.dark}");aspect-ratio:${shot.ratio};`,
    role: label ? 'img' : 'presentation',
    ariaLabel: label || undefined,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test/themed-shot.render.test.mjs`
Expected: PASS — `themed-shot logic: all assertions passed`.

- [ ] **Step 5: Write the Astro component**

```astro
---
// src/components/relay/ThemedShot.astro
// Theme-aware Relay screenshot. Zero JS: a CSS background-image swaps on the
// site's [data-theme] attribute (stamped pre-paint by the no-FOUC script), so
// only the ACTIVE variant is ever fetched. aspect-ratio (from the corpus
// manifest via the sync index) reserves layout => zero CLS. ALWAYS lazy /
// below-the-fold by contract: never use this for an above-fold LCP hero
// (that stays an eager single-theme <Image>). See
// docs/superpowers/specs/2026-07-09-relay-themed-screenshot-component-design.md
import index from '../../data/relay-shots.json';
import { themedShotProps } from './themed-shot.logic.mjs';

interface Props {
  id: string;
  alt?: string;
  class?: string;
}
const { id, alt, class: className } = Astro.props;
const { style, role, ariaLabel } = themedShotProps(index, { id, alt });
---

<div class:list={['relay-shot', className]} style={style} role={role} aria-label={ariaLabel}></div>

<style>
  .relay-shot {
    /* var(--shot-light) is the CSS BASE declaration, not "what loads first":
       the browser resolves the winning cascade rule before paint and fetches
       only that image. A default (dark) visitor has [data-theme='dark']
       stamped pre-paint, so only the dark WebP is requested. */
    background-image: var(--shot-light);
    background-size: cover;
    background-position: top center;
    background-repeat: no-repeat;
    width: 100%;
    display: block;
  }
  :global([data-theme='dark']) .relay-shot {
    background-image: var(--shot-dark);
  }
</style>
```

- [ ] **Step 6: Verify the component builds (used on a throwaway route)**

Create a temporary probe page:
```astro
---
// src/pages/_themed-shot-probe.astro  (TEMP — deleted in Step 8)
import Layout from '../layouts/Layout.astro';
import ThemedShot from '../components/relay/ThemedShot.astro';
---
<Layout title="probe"><ThemedShot id="home-cockpit" class="rounded-2xl border" /></Layout>
```
Run: `npm run build 2>&1 | tail -20`
Expected: build succeeds; `dist/_themed-shot-probe/index.html` contains `class="relay-shot rounded-2xl border"` and `--shot-dark:url(`.

- [ ] **Step 7: Verify the unknown-id guard fails the build**

Temporarily change the probe to `id="nope"`, run `npm run build`, expect FAIL naming `unknown shot id "nope"`. Then restore `id="home-cockpit"`.

- [ ] **Step 8: Delete the probe page**

Run: `rm src/pages/_themed-shot-probe.astro`

- [ ] **Step 9: Commit**

```bash
git add src/components/relay/ThemedShot.astro src/components/relay/themed-shot.logic.mjs scripts/test/themed-shot.render.test.mjs
git commit -m "feat(relay-shots): ThemedShot component with [data-theme] css swap"
```

---

## Task 4: Rehype plugin — `relay-shot:<id>` → `<ThemedShot>` bridge

A guarded, idempotent rehype plugin (house pattern from `rehype-table-scroll.mjs`) that rewrites portable `![alt](relay-shot:<id>)` markdown image nodes into the themed component's markup, resolving the pair from the same index. It self-limits on the `relay-shot:` src prefix, so it is safe to run globally on all markdown (only Relay docs contain that prefix).

**Files:**
- Create: `src/lib/relay/rehype-relay-shots.mjs`
- Modify: `astro.config.mjs` (register in `markdown.rehypePlugins`)
- Create: `scripts/test/rehype-relay-shots.test.mjs`

**Interfaces:**
- Consumes: `src/data/relay-shots.json` (Task 2), `themedShotProps` (Task 3).
- Produces: default-exported rehype plugin. In-place, it replaces any `element` node `img` whose `properties.src` starts with `relay-shot:` with a `div` node carrying `className: ['relay-shot']`, inline `style` (the same `--shot-*`/`aspect-ratio` string), and `role`/`aria-label` — identical output shape to the `.astro` component so both render paths look the same. Unknown id throws at build naming the id.

- [ ] **Step 1: Write the failing test**

```js
// scripts/test/rehype-relay-shots.test.mjs
import assert from 'node:assert/strict';
import rehypeRelayShots from '../../src/lib/relay/rehype-relay-shots.mjs';

// minimal HAST tree with one relay-shot img and one normal img
const tree = {
  type: 'root',
  children: [
    { type: 'element', tagName: 'p', children: [
      { type: 'element', tagName: 'img', properties: { src: 'relay-shot:home-cockpit', alt: 'The home cockpit' }, children: [] },
      { type: 'element', tagName: 'img', properties: { src: '/normal.png', alt: 'untouched' }, children: [] },
    ] },
  ],
};

rehypeRelayShots()(tree);

const p = tree.children[0];
const swapped = p.children[0];
const normal = p.children[1];

assert.equal(swapped.tagName, 'div', 'relay-shot img becomes a div');
assert.deepEqual(swapped.properties.className, ['relay-shot']);
assert.match(swapped.properties.style, /--shot-dark:url\(/, 'carries the dark var');
assert.match(swapped.properties.style, /aspect-ratio:1440 \/ 1100/, 'carries aspect-ratio');
assert.equal(swapped.properties.role, 'img');
assert.equal(swapped.properties['aria-label'], 'The home cockpit', 'markdown alt wins');
assert.equal(normal.tagName, 'img', 'a normal img is left untouched');

// idempotent: a second pass changes nothing (no relay-shot: src remains)
rehypeRelayShots()(tree);
assert.equal(tree.children[0].children[0].tagName, 'div');

// unknown id throws
const bad = { type: 'root', children: [ { type: 'element', tagName: 'img', properties: { src: 'relay-shot:nope' }, children: [] } ] };
assert.throws(() => rehypeRelayShots()(bad), /unknown shot id "nope"/);

console.log('rehype-relay-shots: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test/rehype-relay-shots.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the plugin**

```js
// src/lib/relay/rehype-relay-shots.mjs
// Rehype plugin: rewrites a portable ![alt](relay-shot:<id>) markdown image
// into the ThemedShot markup (a <div class="relay-shot"> with the same
// --shot-*/aspect-ratio inline style + role/aria-label the .astro component
// emits). Relay ships the verbatim portable marker; the website owns the
// chrome — honoring the one-direction publish contract. Guarded + idempotent
// (house pattern, cf. rehype-table-scroll.mjs): only touches nodes whose src
// starts with "relay-shot:", so it is safe in the global rehype chain.
import { visit } from 'unist-util-visit';
import index from '../../data/relay-shots.json' with { type: 'json' };
import { themedShotProps } from '../../components/relay/themed-shot.logic.mjs';

const PREFIX = 'relay-shot:';

export default function rehypeRelayShots() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src;
      if (typeof src !== 'string' || !src.startsWith(PREFIX)) return;
      const id = src.slice(PREFIX.length);
      const alt = node.properties.alt; // markdown alt overrides manifest alt
      const { style, role, ariaLabel } = themedShotProps(index, { id, alt });
      node.tagName = 'div';
      node.children = [];
      node.properties = {
        className: ['relay-shot'],
        style,
        role,
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      };
    });
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test/rehype-relay-shots.test.mjs`
Expected: PASS — `rehype-relay-shots: all assertions passed`.

- [ ] **Step 5: Register the plugin in astro.config.mjs**

Modify `astro.config.mjs`: add the import near the other plugin imports (lines 5–8):
```js
import rehypeRelayShots from './src/lib/relay/rehype-relay-shots.mjs';
```
And add it to the rehype chain (line ~143), after `rehypeTableScroll`:
```js
    rehypePlugins: [rehypeTableScroll, rehypeRelayShots],
```

- [ ] **Step 6: Verify wiring over a real HAST tree (dependency-free)**

The `relay-docs`/`relay-api` collections do not exist yet (they arrive with the `_RELAY` #15 publish pickup), so there is no live markdown chapter to render against. Prove the plugin's output shape with a Node probe over a hand-built tree (no page, no extra dep):
```bash
node -e "
import('./src/lib/relay/rehype-relay-shots.mjs').then(({default:p})=>{
  const t={type:'root',children:[{type:'element',tagName:'img',properties:{src:'relay-shot:costs',alt:'Cost rollup'},children:[]}]};
  p()(t); console.log(JSON.stringify(t.children[0].properties));
});
"
```
Expected: JSON with `"className":["relay-shot"]`, a `style` containing `--shot-dark:url(` and `aspect-ratio:1440 / 1100`, `"role":"img"`, `"aria-label":"Cost rollup"`.

- [ ] **Step 7: Confirm the full site still builds (plugin is inert on non-Relay markdown)**

Run: `npm run build 2>&1 | tail -15`
Expected: build succeeds; existing story/receipts/letters pages unchanged (the plugin only touches `relay-shot:` srcs, which none of them contain).

- [ ] **Step 8: Commit**

```bash
git add src/lib/relay/rehype-relay-shots.mjs astro.config.mjs scripts/test/rehype-relay-shots.test.mjs
git commit -m "feat(relay-shots): rehype bridge for relay-shot markdown refs"
```

---

## Task 5: Sweep — migrate RelayShowcase to ThemedShot + retire PNGs

Replace the dark-only `<Image>` shots in `RelayShowcase.astro` with `<ThemedShot>`, then delete the superseded hand-vendored PNGs (only those now fully unreferenced).

**Files:**
- Modify: `src/components/product/RelayShowcase.astro`
- Delete: superseded PNGs in `src/assets/relay/` (verified unreferenced)

**Interfaces:**
- Consumes: `<ThemedShot>` (Task 3), `src/data/relay-shots.json` (Task 2).

**Note on placement:** 5 of the 6 allow-listed ids get placed on RelayShowcase here — `apps-list`, `costs`, `customers-list` (the three beats) + `tasks-board`, `inbox-approvals` (the proof strip). `home-cockpit` stays allow-listed and vendored but **unplaced** in this task (reserved for a future surface / the `/relay/` landing hero refresh). That is intentional, not a miss — an allow-listed-but-unreferenced shot is fine; the build only errors on a `<ThemedShot id>` whose id is *absent from the index*, never on an index entry with no consumer.

- [ ] **Step 1: Read the current component + its shot usage**

Run: `sed -n '1,140p' src/components/product/RelayShowcase.astro`
Note each `<Image src={xShot} …/>` site and the `import xShot from '../../assets/relay/*.png'` lines. Map per the table in Global Constraints.

- [ ] **Step 2: Replace the three showcase-beat images**

In `RelayShowcase.astro`, the three-beat array currently passes `image` (an imported asset) into an `<Image>`. Change the beat data to carry a corpus `id` instead of an import, and swap the render. Replace the imports:
```diff
- import { Image } from 'astro:assets';
-
- import appBuilderShot from '../../assets/relay/apps-starter-to-chat.png';
- import costUsageShot from '../../assets/relay/costs-list.png';
- import customersShot from '../../assets/relay/customers-list.png';
- import kanbanShot from '../../assets/relay/tasks-list.png';
- import inboxShot from '../../assets/relay/inbox-list.png';
+ import ThemedShot from '../relay/ThemedShot.astro';
```
Change each beat's `image: <import>` to `shotId: '<corpus-id>'`, keeping the beat's existing `alt` string (it is more specific than the manifest label, so pass it through). The exact mapping, in beat order:
- Beat 1 "Describe an app" → `shotId: 'apps-list'` (was `appBuilderShot`)
- Beat 2 "Multi-vendor, no lock-in" → `shotId: 'costs'` (was `costUsageShot`)
- Beat 3 "Customers, first-class" → `shotId: 'customers-list'` (was `customersShot`)

Update the `beats.map(({ label, heading, body, image, alt, imageRight }) => (` destructure to `({ label, heading, body, shotId, alt, imageRight })`, and replace the beat's `<Image …/>` block with:
```astro
            <ThemedShot id={shotId} alt={alt} class="block w-full" />
```
Keep the wrapping `<div class:list={[...frame classes...]}>` exactly as-is; drop `widths`/`sizes`/`loading`/`decoding`/`data-no-zoom` — the component owns rendering.

- [ ] **Step 3: Replace the two-shot proof strip (kanban + inbox)**

Replace the `<Image src={kanbanShot} …/>` with `<ThemedShot id="tasks-board" alt="The Relay task board: multi-step, multi-client work across every status." class="block w-full" />` and the `<Image src={inboxShot} …/>` with `<ThemedShot id="inbox-approvals" alt="The governance inbox: every agent result waiting on your sign-off." class="block w-full" />`, keeping the `<figure>`/`<figcaption>` wrappers.

- [ ] **Step 4: Build + confirm no dangling imports**

Run: `npm run build 2>&1 | tail -15`
Expected: build succeeds, no "unused import" or missing-asset errors. If any `xShot` import remains referenced, the build names it.

- [ ] **Step 5: Find which PNGs are now unreferenced**

Run:
```bash
for f in apps-starter-to-chat costs-list customers-list tasks-list inbox-list home-list customers-detail; do
  echo -n "$f: "; grep -rl "assets/relay/$f" src >/dev/null 2>&1 && echo "STILL REFERENCED" || echo "unreferenced";
done
```
Expected: the 5 swept showcase PNGs report `unreferenced`. `home-list` and `customers-detail` may be referenced elsewhere (e.g. RelayShowcase used `home-list`? confirm) — only delete ones reporting `unreferenced`.

- [ ] **Step 6: Delete only the unreferenced superseded PNGs**

For each PNG reported `unreferenced` in Step 5, `git rm src/assets/relay/<name>.png`. Do NOT delete any still-referenced file (e.g. if `customers-detail.png` is used by another component, leave it — it has no corpus pair anyway per the map).

- [ ] **Step 7: Rebuild to confirm nothing broke**

Run: `npm run build 2>&1 | tail -15`
Expected: success.

- [ ] **Step 8: Commit**

```bash
git add src/components/product/RelayShowcase.astro src/assets/relay
git commit -m "feat(relay): swap RelayShowcase to theme-aware ThemedShot"
```

---

## Task 6: In-browser verification (single-fetch, zero-CLS, no-LCP, both themes)

Verify the runtime behavior the design promises. This is the acceptance gate; no code changes unless a check fails.

**Files:** none (verification only). Uses Claude-in-Chrome against `http://localhost:4321/relay/`.

- [ ] **Step 1: Start the dev server**

Run (background): `npm run dev`
Wait for `http://localhost:4321/` to serve. Confirm `/relay/` renders.

- [ ] **Step 2: Single-fetch check (default dark)**

Open `http://localhost:4321/relay/` in Chrome (default theme = dark). In the Network panel filtered to `shots/`, scroll the RelayShowcase into view. Expected: only `…/dark.<hash>.webp` requests appear; **no `light.<hash>.webp` request** for any shot while in dark.

- [ ] **Step 3: Toggle → light variant loads once**

Click the nav theme toggle to light. Expected: the shots visibly switch to the light captures; the Network panel now shows the matching `…/light.<hash>.webp` fetched once each (and cached on re-toggle). Toggle back to dark → no new dark fetch (cached).

- [ ] **Step 4: Zero-CLS check**

Run a Lighthouse pass (or the `#hero-cta-sentinel`-free CLS read) on `/relay/`. Expected: CLS ≈ 0; the shot boxes reserve height before the WebP paints (no jump). Confirm each `.relay-shot` has a resolved `aspect-ratio` in DevTools computed styles.

- [ ] **Step 5: No-LCP-regression check**

Confirm the LCP element on `/relay/` is NOT a `.relay-shot` (it should remain the hero text/heading or the existing eager hero image). Mobile Lighthouse performance stays in the 90–99 band. `[[mobile-perf-hygiene]]`

- [ ] **Step 6: A11y check**

In DevTools, confirm each swapped shot is a `<div class="relay-shot" role="img" aria-label="…">` with a meaningful label (not the raw id).

- [ ] **Step 7: Record results**

If all pass, note it in the session and proceed to Task 7. If any fails, STOP and fix the responsible unit (do not proceed to the handback with a failing gate).

- [ ] **Step 8: Stop the dev server**

Kill the background `npm run dev`.

---

## Task 7: `_RELAY` handback — source-side pairing contract (write-to-disk-only)

Write the dated `Website→Relay` entry to the strategy-repo mailbox on disk. Operator posts it. Never commit/push the strategy repo.

**Files:**
- Modify (disk only, newest-first, prepend under the header): `~/orionfold/strategy/relay/_RELAY.md`

- [ ] **Step 1: Read the current mailbox head to match format + get the next entry number**

Run: `sed -n '1,20p' ~/orionfold/strategy/relay/_RELAY.md`
Note: this is the **ainative/Relay product channel** (not the website channel). The publish contract says website-side changes are requested via `orionfold-website/_RELAY.md`, but this handback is a *source-contract note to the Relay corpus* — it belongs on the Relay channel. Confirm with the mailbox header which is canonical for `_ASSETS` capture-side asks; if the head shows `_ASSETS` threads already live here, prepend here.

- [ ] **Step 2: Draft the entry to a scratch file**

Write to `<scratchpad>/relay-handback.md` (plain grade 3–5 English, no em-dashes, `[[website-copy-style]]`). Content = the 4-point contract + what-the-website-did + your-move, verbatim from the design's Unit 4:

```markdown
## 2026-07-09 — Website→Relay — THEMED SCREENSHOTS ARE LIVE ON THE SITE: the /relay/ shots now follow the reader's light/dark theme, sourced from your _ASSETS/screenshots pairs. Here is the source contract so future captures drop straight in. `[open — needs Relay: author a real per-shot alt in the manifest; keep shipping matched light+dark pairs; flag any id rename here]`

The website now renders Relay product screenshots in the theme the visitor is viewing (light or dark), swapped with zero JavaScript and only the active image ever downloaded. It reads your matched pairs from `_ASSETS/screenshots/` through a small sync step. RelayShowcase on /relay/ is already swapped over.

**The source contract (what keeps future captures dropping straight in):**

1. **Matched pairs are the unit.** Every themed shot must ship a `light/` and a `dark/` capture with the same `id`, the same `viewport`, and the same crop and `pixelSize`. A shot with only one theme is skipped (our sync fails loud on a half-pair). The demo is exempt: demo captures stay single-theme, light as designed, and are never themed-pair targets.
2. **The manifest is the contract surface.** Each entry must carry `id`, `theme`, `viewport`, `pixelSize` (we read it for the layout box so pages never jump), `area`, and a human-written `alt`. You already ship all of these but the `alt`. The one new ask: add a short, real `alt` per shot (the exact words we show to screen readers). Until then we fall back to your `label`.
3. **`id` is the join key, so it is durable.** Our allow-list and every docs image reference join on `id`. Renaming an `id` is a breaking change on our side. Please flag any rename here so we can repoint, rather than renaming silently.
4. **Docs and API pages embed a shot with a plain marker:** `![alt](relay-shot:<id>)`. Write that portable marker in your verbatim markdown and our renderer turns it into the themed image. You never write component or CTA HTML, matching the one-direction contract.

**What the website did this session:** built a `ThemedShot` component (CSS `[data-theme]` background swap), a `sync-relay-shots.mjs` step that pulls the allow-listed pairs and optimizes them to WebP, a rehype bridge for the `relay-shot:<id>` marker, and swapped RelayShowcase over. All local on `main`, deploy is operator-gated.

**Your move:** author the per-shot `alt`; keep shipping matched pairs; flag id renames here. Nothing else owed.

— Website session, 2026-07-09
```

- [ ] **Step 3: Prepend the entry to the mailbox on disk (do not commit)**

Insert the scratch content immediately after the mailbox header `---` divider (newest-first). Use an editor/Read+Edit on `~/orionfold/strategy/relay/_RELAY.md`. Do NOT run `git add`/`commit`/`push` in the strategy repo. `[[never-push-strategy-repo]]`

- [ ] **Step 4: Confirm the write landed + strategy repo is untouched by git**

Run: `sed -n '1,25p' ~/orionfold/strategy/relay/_RELAY.md`
Expected: the new entry sits at the top under the header.
Run: `git -C ~/orionfold/strategy status --short` — note the file shows modified, and **leave it** for the operator to review/commit. Do not stage it.

- [ ] **Step 5: Tell the operator**

Report: the handback is on disk in `~/orionfold/strategy/relay/_RELAY.md` (newest-first), unstaged, for them to post. Summarize the one new ask (per-shot `alt`).

---

## Final: Stop for operator deploy gate

- [ ] All 7 tasks committed locally on `main` (unpushed).
- [ ] In-browser verification (Task 6) passed.
- [ ] `_RELAY` handback on disk, unstaged, operator to post.
- [ ] **STOP.** Report what landed locally + what is verified. Do not push or deploy. Await explicit operator go. `[[confirm-before-live-deploy]]` `[[no-live-flip-check]]`
