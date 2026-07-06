#!/usr/bin/env node
// Regenerate the two OG brand plates from re-themeable sources + the 3D origami mark.
// 2026-07-05: swapped the flat SC-01f disc for the 3D origami mark (variant B).
//
// TWO outputs, OPPOSITE needs (see the logo-3d-origami-swap memory):
//   1. src/lib/og/banner.png  — the CARD BACKGROUND (card.ts BANNER_URI, `banner: true`).
//      card.ts overlays its OWN title + eyebrow + wordmark on top, so this plate must be
//      TEXT-FREE with the disc on the RIGHT (title sits left). It must also carry NO extra
//      glow behind the disc — only the disc's own baked shadow — or a leftover halo stacks
//      with it into a "double drop shadow" (the bug fixed 2026-07-05). Source:
//        - banner-cardbg.src.svg : clean radial-gradient ground + sparse stars, NO disc, NO text.
//   2. public/og-image.png    — the RAW social default (SITE.ogImage), served WITHOUT any
//      overlay, so it carries the full brand lockup: disc-LEFT + wordmark + tagline. Source:
//        - banner.src.svg : the DS text template (gradient + stars + wordmark + tagline), disc removed.
//
// Both composite the SAME raster mark (banner-mark-3d.png, 264px) — the 3D render has no
// vector form, so it is dropped in as a raster, never drawn in the SVG. Re-theme = edit the
// relevant .src.svg (+ swap the mark png) and rerun. NB og-image.png lives in public/, not here.
//
// Requires: rsvg-convert (librsvg) + magick (ImageMagick). Run from the repo root:
//   node src/lib/og/regen-banner.mjs

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '../../..');
const MARK = path.join(HERE, 'banner-mark-3d.png');

const tmp = mkdtempSync(path.join(tmpdir(), 'of-banner-'));
function renderBg(srcSvg, out) {
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', srcSvg, '-o', out]);
}
function composite(bg, size, x, y, out) {
  const disc = path.join(tmp, `disc-${size}.png`);
  execFileSync('magick', [MARK, '-filter', 'Lanczos', '-resize', `${size}x${size}`, disc]);
  execFileSync('magick', [bg, disc, '-geometry', `+${x}+${y}`, '-compose', 'over', '-composite', out]);
}

try {
  // 1. banner.png — card background: clean bg, disc RIGHT (300px, centered ~905,300 => top-left 755,150).
  const cardBg = path.join(tmp, 'cardbg.png');
  renderBg(path.join(HERE, 'banner-cardbg.src.svg'), cardBg);
  composite(cardBg, 300, 755, 150, path.join(HERE, 'banner.png'));
  console.log('wrote', path.join(HERE, 'banner.png'), '(card bg, text-free, disc-right)');

  // 2. og-image.png — raw default: text template, disc LEFT (132px at the DS lockup box 96,222).
  const textBg = path.join(tmp, 'textbg.png');
  renderBg(path.join(HERE, 'banner.src.svg'), textBg);
  composite(textBg, 132, 96, 222, path.join(ROOT, 'public/og-image.png'));
  console.log('wrote', path.join(ROOT, 'public/og-image.png'), '(raw default, wordmark + tagline, disc-left)');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
