// scripts/sync-relay-shots.mjs
// Manifest-driven selective sync of Relay light/dark screenshot pairs.
// Reads the strategy-owned _ASSETS/screenshots corpus READ-ONLY, resolves an
// allow-list of ids to matched pairs, emits responsive text-tuned WebPs, and
// writes src/data/relay-shots.json. Fails loud on a half-pair or an
// allow-listed id missing from the manifest. The /relay/demo/ bundle is NOT a
// themed-pair target and never appears here (demo captures are single-theme).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

const DEFAULT_CORPUS = new URL('file:///Users/manavsehgal/orionfold/relay/_ASSETS/screenshots/');

// 720 serves a 390px phone at ~2x; 1280 covers normal 1x desktop cards; 1600
// preserves a true ~2x text edge in the 48rem guide column. Responsive srcset
// plus native loading="lazy" means the sharper desktop asset does not become a
// mobile or initial-page penalty.
const WIDTHS = [720, 1280, 1600];
const FALLBACK_WIDTH = 1280;
const WEBP_QUALITY = 86;
const PUBLIC_DIR = new URL('../public/relay/shots/', import.meta.url);

export function webpName(theme, width, buffer) {
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 8);
  return `${theme}-${width}.${hash}.webp`;
}

/** Optimize one source PNG for crisp UI text at one responsive width. */
async function toWebp(absPngUrl, width) {
  return sharp(fileURLToPath(absPngUrl))
    .resize({ width, withoutEnlargement: true, kernel: 'lanczos3' })
    .webp({
      quality: WEBP_QUALITY,
      preset: 'text',
      smartSubsample: true,
      effort: 6,
    })
    .toBuffer();
}

/** Write both variants for one pair; return the index entry. */
async function syncPair(pair, corpus) {
  const dir = new URL(`${pair.id}/`, PUBLIC_DIR);
  rmSync(dir, { recursive: true, force: true }); // clean stale hashes for this id
  mkdirSync(dir, { recursive: true });
  const out = {};
  for (const theme of ['light', 'dark']) {
    const variants = [];
    for (const width of WIDTHS) {
      const buf = await toWebp(new URL(pair[theme].path, corpus), width);
      const name = webpName(theme, width, buf);
      writeFileSync(new URL(name, dir), buf);
      variants.push({ width, src: `/relay/shots/${pair.id}/${name}` });
    }
    const fallback = variants.find((variant) => variant.width === FALLBACK_WIDTH) ?? variants.at(-1);
    out[theme] = {
      src: fallback.src,
      srcset: variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
    };
  }
  return {
    light: out.light,
    dark: out.dark,
    ratio: pair.ratio,
    width: pair.width,
    height: pair.height,
    alt: pair.alt,
    area: pair.area,
  };
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
    pairs.push({
      id,
      area: rec.area,
      alt: rec.alt,
      ratio: `${vs.width} / ${vs.height}`,
      width: vs.width,
      height: vs.height,
      light: rec.themes.light,
      dark: rec.themes.dark,
    });
  }
  return { pairs, errors };
}

async function main() {
  const corpus = process.argv.includes('--corpus')
    ? new URL(`file://${process.argv[process.argv.indexOf('--corpus') + 1]}/`)
    : DEFAULT_CORPUS;
  const manifest = JSON.parse(readFileSync(new URL('metadata/manifest.json', corpus), 'utf8'));
  const allow = JSON.parse(readFileSync(new URL('../src/data/relay-shots.allow.json', import.meta.url), 'utf8'));
  const { pairs, errors } = resolvePairs(manifest, allow);
  if (errors.length) { for (const e of errors) console.error(`[sync-relay-shots] ERROR: ${e}`); process.exit(1); }

  mkdirSync(PUBLIC_DIR, { recursive: true });
  const index = {};
  for (const pair of pairs) {
    index[pair.id] = await syncPair(pair, corpus);
  }
  const removed = pruneOrphans(new Set(pairs.map((p) => p.id)));
  writeFileSync(new URL('../src/data/relay-shots.json', import.meta.url), JSON.stringify(index, null, 2) + '\n');
  console.log(`[sync-relay-shots] wrote ${pairs.length} pairs to public/relay/shots/ + src/data/relay-shots.json`);
  if (removed.length) console.log(`[sync-relay-shots] pruned orphans: ${removed.join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
