// scripts/sync-flow-docs-shots.mjs
// Manifest-driven copy of Flow release-build product shots (G-120 S1).
//
// Reads the Flow repo's docs/ evidence set READ-ONLY. For every release row in
// src/data/flow-shot-sources.json it:
//   1. reads ~/orionfold-flow/<source> (never docs-archive/, never docs/reference/),
//   2. verifies the file's md5 against the row AND against the docs/CHANGELOG.md
//      line that documents that frame (the changelog carries an 8-char prefix),
//   3. records which issues that changelog line names, so a held defect cannot
//      be forgotten at crop time,
//   4. encodes src/assets/flow/shots/<name>.webp at the frame's native size,
//      q92 text preset. Encode, never resample: a 3238-wide frame ships 3238 wide
//      and the crop step (prepare-flow-details.mjs) cuts from that geometry.
//   5. cleans the window corners. `screencapture -R` captures a rectangle, and a
//      macOS window has rounded corners, so the four corners of every frame hold
//      desktop pixels (a wallpaper gradient, another window's text). The site
//      frames shots with its own radius, but that radius depends on the render
//      width, so the corners are cleaned here deterministically: the window's
//      corner radius is measured on the top edge, and everything outside a
//      slightly larger rounded rectangle is painted with the window's own edge
//      colour sampled just inside that corner. Nothing inside the window moves.
//   6. writes the emitted file's sha256/size/bytes back into the manifest so the
//      repo-local guard (flow-shot-provenance.test.mjs) can prove every committed
//      webp is the one this script produced, without needing the Flow repo.
// A row may carry `frameCrop: {left, top, width, height}` to drop a band of the
// frame that shows a logged defect (a stale status bar); it is applied AFTER the
// corner clean, so a cut edge never gets a false rounded corner.
// Fails loudly on a missing file, an md5 mismatch, or a frame the changelog does
// not document. Held (development-build) rows are checked for presence only.
//
//   node scripts/sync-flow-docs-shots.mjs            # sync every release row
//   node scripts/sync-flow-docs-shots.mjs --check    # verify only, write nothing
//   node scripts/sync-flow-docs-shots.mjs --only agency-proofread-review
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const MANIFEST_URL = new URL('../src/data/flow-shot-sources.json', import.meta.url);
const SHOTS_DIR = fileURLToPath(new URL('../src/assets/flow/shots/', import.meta.url));
const DEFAULT_REPO = process.env.FLOW_REPO ?? path.join(process.env.HOME ?? '', 'orionfold-flow');
const WEBP_QUALITY = 92;

const md5 = (buf) => createHash('md5').update(buf).digest('hex');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

/** Split docs/CHANGELOG.md into its "- **added|updated** `docs/...`" bullets. */
export function changelogBlocks(changelog) {
  return changelog.split(/\n(?=- \*\*)/).map((block) => block.replace(/\s+/g, ' '));
}

/**
 * Find the changelog bullet that documents `source` and return what it says:
 * the md5 prefix it carries and the issues it names. Returns null when the
 * frame is undocumented (which is a sync failure, not a warning).
 */
export function changelogEntry(blocks, source) {
  const needle = `\`${source}\``;
  const block = blocks.find((b) => b.includes(needle) && /md5 `[0-9a-f]{6,}/.test(b));
  if (!block) return null;
  const md5Prefix = block.match(/md5 `([0-9a-f]{6,})/)?.[1] ?? null;
  const issues = [...new Set(block.match(/#\d{3}/g) ?? [])].sort();
  return { md5Prefix, issues };
}

export function validateManifestShape(manifest) {
  const errors = [];
  const names = new Set();
  for (const row of [...manifest.shots, ...manifest.held]) {
    if (!/^[a-z0-9-]+$/.test(row.name)) errors.push(`bad shot name "${row.name}"`);
    if (names.has(row.name)) errors.push(`duplicate shot name "${row.name}"`);
    names.add(row.name);
  }
  for (const row of manifest.shots) {
    if (!/^docs\/[a-z-]+\/[a-z0-9-]+\.png$/.test(row.source)) errors.push(`${row.name}: source must be docs/<area>/<file>.png, got "${row.source}"`);
    if (/docs-archive|docs\/reference/.test(row.source)) errors.push(`${row.name}: archived shelf is not a source`);
    if (!/^[0-9a-f]{32}$/.test(row.md5)) errors.push(`${row.name}: md5 must be 32 hex chars`);
    if (!row.claim) errors.push(`${row.name}: every release row states the claim the frame proves`);
    if (!Array.isArray(row.defectsInFrame)) errors.push(`${row.name}: defectsInFrame must be an array (empty is fine)`);
    if (row.build !== undefined && !/^[0-9a-f]{7,} · \d+$/.test(row.build)) errors.push(`${row.name}: build override must read "<sha> · <build>"`);
  }
  return errors;
}

const colourDistance = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

/**
 * Measure the window's corner radius on the top edge: walk row 0 from the left
 * until the pixel matches the title-bar colour sampled well inside the edge. At
 * y = 0 the rounded corner meets the straight edge exactly at x = radius.
 */
export function measureCornerRadius(data, width, channels, reference) {
  const px = (x, y) => { const i = (y * width + x) * channels; return [data[i], data[i + 1], data[i + 2]]; };
  // Row 0 also carries the window shadow's smear along the corner cut-out, so
  // it reads ~30px too wide; row 2 shows only the arc plus its anti-aliasing.
  const row = 2;
  const ref = reference ?? px(Math.min(200, width - 1), row);
  for (let x = 0; x < Math.min(96, width); x += 1) {
    if (colourDistance(px(x, row), ref) < 16) return x + 12; // arc x at y=2 sits ~12px inside the radius
  }
  return 0;
}

/** Paint the desktop pixels outside the window's rounded corners with the window's own edge colour. */
export async function cleanCorners(pngBuffer) {
  const image = sharp(pngBuffer);
  const { width, height } = await image.metadata();
  const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * info.channels; return { r: data[i], g: data[i + 1], b: data[i + 2] }; };
  // Build-1382 frames are `screencapture -l<windowID>` window buffers: the
  // corners are already transparent, so there is nothing to paint over and the
  // frame ships as-is (the site's frame background shows through the arc).
  if (info.channels === 4 && data[3] === 0 && data[(info.width - 1) * 4 + 3] === 0) {
    return { buffer: pngBuffer, radius: 0, width, height, transparent: true };
  }
  const measured = measureCornerRadius(data, info.width, info.channels);
  if (measured < 8) return { buffer: pngBuffer, radius: 0, width, height };
  // The window shadow smears ~40px along both edges out of each corner, so the
  // mask sits well past the arc: the corner reads as the window's own colour,
  // and the site's frame radius (always smaller at render size) clips inside it.
  const radius = Math.min(measured + 30, 96);
  const n = radius + 8;
  const sampleAt = radius + 4;
  const corners = [
    { left: 0, top: 0, colour: px(sampleAt, sampleAt) },
    { left: width - n, top: 0, colour: px(width - 1 - sampleAt, sampleAt) },
    { left: 0, top: height - n, colour: px(sampleAt, height - 1 - sampleAt) },
    { left: width - n, top: height - n, colour: px(width - 1 - sampleAt, height - 1 - sampleAt) },
  ];
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  const rounded = await sharp(pngBuffer).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const buffer = await sharp(pngBuffer)
    .composite([
      ...corners.map((c) => ({ input: { create: { width: n, height: n, channels: 3, background: c.colour } }, left: c.left, top: c.top })),
      { input: rounded, blend: 'over' },
    ])
    .png()
    .toBuffer();
  return { buffer, radius, width, height };
}

async function encode(pngBuffer, frameCrop) {
  const cleaned = await cleanCorners(pngBuffer);
  let image = sharp(cleaned.buffer);
  if (frameCrop) image = image.extract(frameCrop);
  const meta = await image.clone().metadata();
  const webp = await image
    .webp({ quality: WEBP_QUALITY, preset: 'text', smartSubsample: true, effort: 6 })
    .toBuffer();
  return { webp, width: frameCrop?.width ?? meta.width, height: frameCrop?.height ?? meta.height, cornerRadius: cleaned.radius, transparentCorners: Boolean(cleaned.transparent) };
}

async function main() {
  const argv = process.argv.slice(2);
  const checkOnly = argv.includes('--check');
  const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
  const repo = argv.includes('--repo') ? argv[argv.indexOf('--repo') + 1] : DEFAULT_REPO;

  const manifest = JSON.parse(readFileSync(MANIFEST_URL, 'utf8'));
  const shapeErrors = validateManifestShape(manifest);
  if (shapeErrors.length) {
    for (const e of shapeErrors) console.error(`[sync-flow-docs-shots] ERROR: ${e}`);
    process.exit(1);
  }

  const changelogPath = path.join(repo, 'docs', 'CHANGELOG.md');
  if (!existsSync(changelogPath)) {
    console.error(`[sync-flow-docs-shots] ERROR: ${changelogPath} not found; pass --repo or set FLOW_REPO`);
    process.exit(1);
  }
  const blocks = changelogBlocks(readFileSync(changelogPath, 'utf8'));

  const errors = [];
  const warnings = [];
  let written = 0;
  mkdirSync(SHOTS_DIR, { recursive: true });

  for (const row of manifest.shots) {
    if (only && row.name !== only) continue;
    const absSource = path.join(repo, row.source);
    if (!existsSync(absSource)) { errors.push(`${row.name}: ${absSource} is missing`); continue; }
    const png = readFileSync(absSource);
    const actual = md5(png);
    if (actual !== row.md5) { errors.push(`${row.name}: md5 ${actual} on disk, manifest says ${row.md5} (frame changed; re-verify the claim, then update the row)`); continue; }

    const entry = changelogEntry(blocks, row.source);
    if (!entry) { errors.push(`${row.name}: ${row.source} has no docs/CHANGELOG.md line carrying an md5`); continue; }
    if (!row.md5.startsWith(entry.md5Prefix)) { errors.push(`${row.name}: docs/CHANGELOG.md records md5 ${entry.md5Prefix}… but the file is ${row.md5}`); continue; }
    row.changelogIssues = entry.issues;
    const undeclared = entry.issues.filter((issue) => !row.defectsInFrame.includes(issue));
    if (undeclared.length) warnings.push(`${row.name}: changelog names ${undeclared.join(', ')} but defectsInFrame does not (decide at crop time; see changelog line)`);

    const { webp, width, height, cornerRadius, transparentCorners } = await encode(png, row.frameCrop);
    const outPath = path.join(SHOTS_DIR, `${row.name}.webp`);
    const output = { file: `src/assets/flow/shots/${row.name}.webp`, width, height, cornerRadius, transparentCorners, build: row.build ?? `${manifest.release.sha} · ${manifest.release.build}`, bytes: webp.length, sha256: sha256(webp) };
    if (checkOnly) {
      if (!existsSync(outPath)) errors.push(`${row.name}: ${output.file} not synced yet`);
      else if (sha256(readFileSync(outPath)) !== row.output?.sha256) errors.push(`${row.name}: committed webp does not match the manifest`);
      continue;
    }
    writeFileSync(outPath, webp);
    row.output = output;
    written += 1;
    console.log(`${row.name.padEnd(56)} ${width}x${height}  ${transparentCorners ? 'alpha' : 'r' + cornerRadius}  ${output.build}  ${(webp.length / 1024).toFixed(0)} KB  ← ${row.source}`);
  }

  for (const row of manifest.held) {
    const heldPath = path.join(SHOTS_DIR, `${row.name}.webp`);
    if (!existsSync(heldPath)) errors.push(`held row ${row.name} has no file; delete the row when the shot is retired`);
    else row.bytes = statSync(heldPath).size;
  }

  for (const w of warnings) console.warn(`[sync-flow-docs-shots] note: ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`[sync-flow-docs-shots] ERROR: ${e}`);
    process.exit(1);
  }
  if (!checkOnly) {
    writeFileSync(MANIFEST_URL, JSON.stringify(manifest, null, 2) + '\n');
    const total = manifest.shots.reduce((sum, row) => sum + (row.output?.bytes ?? 0), 0);
    console.log(`\n[sync-flow-docs-shots] wrote ${written} release shot(s); release set ${(total / 1024 / 1024).toFixed(1)} MB; manifest updated`);
  } else {
    console.log(`[sync-flow-docs-shots] check passed for ${manifest.shots.length} release + ${manifest.held.length} held rows`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
