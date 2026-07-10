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
