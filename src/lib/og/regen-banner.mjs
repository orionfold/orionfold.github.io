#!/usr/bin/env node
// Regenerate src/lib/og/banner.png — the 1200x630 OG social brand plate used as
// the background for landing/home/listing/book share cards (card.ts BANNER_URI,
// `banner: true`). 2026-07-05: adopted the design-system og-banner text template
// (disc-left + "Orionfold" wordmark + "we say rerun it" tagline) and dropped in
// the 3D origami mark (variant B) in place of the flat SC-01f disc.
//
// Why a script, not a baked-only PNG: the DS README warns a flat OG raster is a
// build-input the token swap can't reach — on the last palette change every
// link-preview card kept the OLD mark. So the banner is kept re-themeable:
//   - banner.src.svg      : the text + starfield + radial-glow template, with the
//                           disc REMOVED (the 3D mark has no vector form, so it is
//                           composited as a raster, not drawn in the SVG). Edit the
//                           palette / wordmark / tagline here.
//   - banner-mark-3d.png  : the 3D origami disc (264px, 2x the 132px render size).
// Re-theme = edit banner.src.svg (+ swap the mark png) and rerun this script.
//
// Requires: rsvg-convert (librsvg) + magick (ImageMagick), same as the DS pipeline.
// Run:  node src/lib/og/regen-banner.mjs   (from the repo root)

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SRC_SVG = path.join(HERE, 'banner.src.svg');
const MARK = path.join(HERE, 'banner-mark-3d.png');
const OUT = path.join(HERE, 'banner.png');

// The DS template places the mark at translate(96,222) scale(2.0625) on a 64-unit
// circle => 132px disc, top-left (96,222). We composite the 3D disc at that exact box.
const MARK_SIZE = 132;
const MARK_X = 96;
const MARK_Y = 222;

const tmp = mkdtempSync(path.join(tmpdir(), 'of-banner-'));
try {
  const bg = path.join(tmp, 'bg.png');
  const disc = path.join(tmp, 'disc.png');
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', SRC_SVG, '-o', bg]);
  execFileSync('magick', [MARK, '-filter', 'Lanczos', '-resize', `${MARK_SIZE}x${MARK_SIZE}`, disc]);
  execFileSync('magick', [bg, disc, '-geometry', `+${MARK_X}+${MARK_Y}`, '-compose', 'over', '-composite', OUT]);
  console.log('wrote', OUT);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
