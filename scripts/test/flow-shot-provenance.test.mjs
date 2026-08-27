// Flow product-shot provenance (G-120 S1, 2026-08-26).
//
// Every Flow shot on the site must trace to a frame the product lane captured
// on the installed, notarized release and documented in the Flow repo's
// docs/CHANGELOG.md, or be an explicitly held development-build capture with a
// written plan for its replacement. The manifest src/data/flow-shot-sources.json
// is the ledger; scripts/sync-flow-docs-shots.mjs fills it from the Flow repo.
// This guard is repo-local on purpose (CI has no Flow checkout): it proves the
// committed webps are the bytes the sync produced, and that nothing in src/
// cites the archived docs/reference shelf any more.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifestShape, changelogBlocks, changelogEntry } from '../sync-flow-docs-shots.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const rel = (p) => path.join(root, p);
const read = (p) => readFileSync(rel(p), 'utf8');
const sha256 = (p) => createHash('sha256').update(readFileSync(rel(p))).digest('hex');

const manifest = JSON.parse(read('src/data/flow-shot-sources.json'));
const shotsDir = rel('src/assets/flow/shots');

// ── Shape ──────────────────────────────────────────────────────────────────
assert.deepEqual(validateManifestShape(manifest), [], 'manifest rows are well formed');
assert.match(manifest.release.sha, /^[0-9a-f]{7,}$/, 'the release is named by its commit');
assert.equal(typeof manifest.release.build, 'number', 'the release is named by its build number');
assert.equal(manifest.copySource, 'docs/first-time-onboarding-journey.md', 'the journey guide is the only copy source');

// ── Every file has a row; every row has a file ─────────────────────────────
const onDisk = readdirSync(shotsDir).filter((f) => f.endsWith('.webp')).sort();
const rows = new Map([...manifest.shots, ...manifest.held].map((row) => [row.name, row]));
for (const file of onDisk) {
  assert.ok(rows.has(path.basename(file, '.webp')), `${file} has no provenance row in flow-shot-sources.json`);
}
for (const name of rows.keys()) {
  assert.ok(existsSync(path.join(shotsDir, `${name}.webp`)), `${name}.webp is in the manifest but not on disk`);
}

// ── Release rows: synced, unchanged since, native size, defects declared ──
for (const row of manifest.shots) {
  assert.ok(row.output, `${row.name}: not synced yet (run scripts/sync-flow-docs-shots.mjs)`);
  assert.equal(row.output.file, `src/assets/flow/shots/${row.name}.webp`);
  assert.equal(sha256(row.output.file), row.output.sha256, `${row.name}: the committed webp is not the one the sync produced`);
  assert.equal(statSync(rel(row.output.file)).size, row.output.bytes);
  assert.ok(row.output.width >= 600 && row.output.height >= 400, `${row.name}: frames ship at native size, never resampled down`);
  assert.ok(Array.isArray(row.changelogIssues), `${row.name}: the sync records what the changelog line names`);
  assert.ok(row.surfaces.length > 0, `${row.name}: a synced frame names the surface(s) it is for`);
  assert.match(row.guide, /^(§\d+|C\d|F\d{1,2})$/, `${row.name}: names the guide section that describes it`);
  // A frame with a logged defect visible at the shipped size carries the crop
  // rule that keeps the defect out of the picture.
  if (row.defectsInFrame.length) assert.ok(row.cropRule, `${row.name}: defects ${row.defectsInFrame.join(', ')} need a crop rule`);
}

// ── Held rows: development-build captures with a written way out ───────────
for (const row of manifest.held) {
  assert.match(row.build, /development build/, `${row.name}: a held row says it is a development-build capture`);
  assert.match(row.plan, /^(S[234](\/S[234])?|gap):/, `${row.name}: a held row names the sequencing step or the product-lane gap that retires it`);
}

// ── The archived shelf is gone from the site's sources ─────────────────────
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(astro|ts|mjs|md|mdx|json|css)$/.test(d.name) ? [path.join(dir, d.name)] : [],
  );
for (const file of walk(rel('src'))) {
  const text = readFileSync(file, 'utf8');
  assert.doesNotMatch(text, /docs-archive|docs\/reference\//, `${path.relative(root, file)} cites the archived Flow briefs`);
}

// ── Crops cut from a shot that exists; OG copies stay png ─────────────────
const prepare = read('scripts/prepare-flow-details.mjs');
for (const [, from] of prepare.matchAll(/from: '([^']+)'/g)) {
  assert.ok(rows.has(path.basename(from, '.webp')), `prepare-flow-details cuts from ${from}, which has no provenance row`);
}
const og = read('src/data/og.ts');
for (const route of ['/', '/flow/']) {
  const block = og.match(new RegExp(`'${route.replace(/\//g, '\\/')}': \\{([\\s\\S]*?)\\n  \\}`))?.[1] ?? '';
  assert.match(block, /screenshot: 'src\/assets\/flow\/og-[a-z-]+\.png'/, `${route} OG screenshot is a png copy under src/assets/flow/ (Satori cannot decode webp)`);
}

// ── The changelog parser reads the product lane's real format ──────────────
const sample = [
  '### 2026-08-26',
  '',
  '- **added** `docs/settings/settings-guardrails.png` — **Settings ▸',
  '  Guardrails** … Native',
  '  3238×2032 via `screencapture -x -R 0,30,1619,1016`, md5 `d2ea78a6…`. Blemish: #294.',
  '- **added** `docs/agency/proofread-review.png` — Review Changes. md5',
  '  `ffe15616…`.',
].join('\n');
const blocks = changelogBlocks(sample);
assert.deepEqual(changelogEntry(blocks, 'docs/settings/settings-guardrails.png'), { md5Prefix: 'd2ea78a6', issues: ['#294'] });
assert.deepEqual(changelogEntry(blocks, 'docs/agency/proofread-review.png'), { md5Prefix: 'ffe15616', issues: [] }, 'an md5 split across a line break still parses');
assert.equal(changelogEntry(blocks, 'docs/agency/missing.png'), null);

console.log(`flow-shot-provenance: ${manifest.shots.length} release + ${manifest.held.length} held rows, ${onDisk.length} files, all traced`);
