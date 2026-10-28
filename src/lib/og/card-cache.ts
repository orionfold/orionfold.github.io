// Content-addressed cache for rendered OG cards.
//
// Rendering a card (Satori -> resvg -> mozjpeg) costs about 0.8s on a Mac and
// over 2s on a GitHub runner, and the build renders every card on every run:
// 141 cards were 111s of a 116s local build on 2026-10-28, and most of the
// 327s CI build step. Nothing about a card changes between builds unless its
// copy, its framed image or the renderer itself changes, so the finished JPG is
// kept under node_modules/.astro/og-cards/<key>.jpg, which deploy.yml already
// restores and saves between runs (the "Restore the Astro image cache" step).
//
// The key is a sha1 over the card's options, with every *Path option replaced
// by a digest of that file's bytes, plus a digest of everything under
// src/lib/og/ (the renderer, the constellation, the fonts and the banner), plus
// OG_CACHE_VERSION for a manual bump. A page-only edit therefore re-renders no
// card at all, and a new page renders only its own. Set OG_CARD_CACHE=0 to
// bypass the cache for a build.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';

export const OG_CACHE_VERSION = '1';

const sha1 = (data: Buffer | string) => createHash('sha1').update(data).digest('hex');

/** Digest of every file under `dir` (sorted, relative path + bytes). */
export function rendererDigest(dir = path.join(process.cwd(), 'src/lib/og')): string {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(dir);
  const h = createHash('sha1');
  for (const f of files) {
    h.update(path.relative(dir, f)).update('\0').update(fs.readFileSync(f)).update('\0');
  }
  return h.digest('hex');
}

/** The cache key for one card: its options (files by content) and the renderer. */
export function cardKey(opts: Record<string, unknown>, renderer: string): string {
  const entries = Object.keys(opts)
    .sort()
    .map((k) => {
      const v = opts[k];
      if (k.endsWith('Path') && typeof v === 'string') return [k, `sha1:${sha1(fs.readFileSync(v))}`];
      return [k, v];
    });
  return sha1(JSON.stringify({ v: OG_CACHE_VERSION, renderer, opts: entries }));
}

export interface CacheOptions {
  cacheDir?: string;
  renderer?: string;
  enabled?: boolean;
}

export const stats = { hits: 0, misses: 0 };

/** Return the cached JPG for `opts`, or render it, store it and return it. */
export async function cachedRender<T extends Record<string, unknown>>(
  opts: T,
  render: (opts: T) => Promise<Buffer>,
  { cacheDir = path.join(process.cwd(), 'node_modules/.astro/og-cards'), renderer = '', enabled = process.env.OG_CARD_CACHE !== '0' }: CacheOptions = {},
): Promise<Buffer> {
  if (!enabled) return render(opts);
  const file = path.join(cacheDir, `${cardKey(opts, renderer)}.jpg`);
  try {
    const hit = fs.readFileSync(file);
    stats.hits += 1;
    return hit;
  } catch {
    // miss
  }
  const jpg = await render(opts);
  stats.misses += 1;
  fs.mkdirSync(cacheDir, { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, jpg);
  fs.renameSync(tmp, file);
  return jpg;
}
