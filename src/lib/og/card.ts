// OG card renderer, Paper style (R3, G-142, operator pick 2026-10-30: "the sheet").
// Composes a 1200x630 social-share JPG: Satori lays out the card, resvg rasterizes
// it, sharp re-encodes to mozjpeg so photographic art stays under the weight budget.
//
// Two shapes:
//   - titled cards: paper ground, Fraunces title on the left, the page's Fold on a
//     soft disc on the right (or the app shot in a Paper window, or a book cover);
//   - art cards (story comics, posters, curated heroes): the art full-bleed in true
//     color with a solid paper brand bar along the bottom. The art carries its own title.
//
// Satori cannot read woff2 or apply variable axes, so the fonts are static TTF
// instances cut from the site's Paper Fraunces (wght 300 and 400 at opsz 72, SOFT
// 100) plus the site's Geist (src/lib/og/fonts/, committed build inputs).

import * as fs from 'node:fs';
import * as path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { foldById, foldShapes, SHADOW, type FoldId } from '../paper/folds';
import { foldedStar } from '../paper/star';

const ROOT = process.cwd();
const font = (name: string) => fs.readFileSync(path.join(ROOT, 'src/lib/og/fonts', name));
const FONTS = [
  { name: 'Fraunces', data: font('Fraunces-Paper-Light.ttf'), weight: 300 as const, style: 'normal' as const },
  { name: 'Fraunces', data: font('Fraunces-Paper-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: font('Geist-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: font('Geist-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
];

// Paper tokens (src/styles/paper/tokens.css).
const PAPER = '#fbfaf6';
const PAPER_2 = '#f4f1e8';
const WHITE = '#ffffff';
const INK = '#171c1a';
const INK_3 = '#666d69';
const LINE = '#e2ded2';
const TEAL = '#247b80';

export type CardFold = FoldId | 'star';

export interface CardOptions {
  title: string;
  eyebrow: string;
  /** Cache and version key only; the Paper card draws nothing from it. */
  seed: string;
  /** Bottom-right caption, e.g. a post date. */
  meta?: string;
  /** The Fold on the card. Omitted means the folded star. */
  fold?: CardFold;
  /** Absolute path to an app shot, framed on the right in a Paper window. PNG/JPG. */
  screenshotPath?: string;
  /** Absolute path to curated art used full-bleed, with the paper brand bar. PNG/JPG. */
  backgroundPath?: string;
  /** Absolute path to a portrait book cover, framed on the right. PNG/JPG. */
  insetPath?: string;
}

// Minimal hyperscript for Satori's element tree (this is a .ts file, no JSX).
type El = { type: string; props: Record<string, unknown> };
function h(type: string, props: Record<string, unknown>, children?: unknown): El {
  return { type, props: children === undefined ? props : { ...props, children } };
}

/** Rasterize an SVG at 2x the size it is drawn, so resvg only scales down. */
function svgPng(svg: string, width: number): string {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width * 2 } }).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

function fileDataUri(absPath: string): string {
  const ext = path.extname(absPath).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${fs.readFileSync(absPath).toString('base64')}`;
}

const STAR_URI = svgPng(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${foldedStar(39, 38, 34)}</svg>`, 40);

function foldImage(fold: CardFold, width: number): El {
  const svg = fold === 'star'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -24 120 128">${foldedStar(39, 38, 34)}</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 214">${SHADOW}${foldShapes(foldById[fold])}</svg>`;
  const height = Math.round(width * (fold === 'star' ? 128 / 120 : 214 / 200));
  return h('img', { src: svgPng(svg, width), width, height, style: { width, height } });
}

/** The folded star + "Orionfold" in Fraunces, then the address. */
function lockup(): El {
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: 22 } }, [
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } }, [
      h('img', { src: STAR_URI, width: 40, height: 40, style: { width: 40, height: 40 } }),
      h('div', { style: { display: 'flex', fontFamily: 'Fraunces', fontWeight: 400, fontSize: 28, color: INK } }, ['Orion', h('span', { style: { color: TEAL } }, 'fold')]),
    ]),
    h('div', { style: { display: 'flex', fontSize: 20, color: INK_3 } }, 'orionfold.com'),
  ]);
}

/** Full-bleed art in true color, branded by a paper bar along the bottom. */
function artCard(opts: CardOptions): El {
  return h('div', { style: { position: 'relative', display: 'flex', width: 1200, height: 630, fontFamily: 'Geist', backgroundColor: PAPER } }, [
    h('img', { src: fileDataUri(opts.backgroundPath as string), width: 1200, height: 630, style: { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' } }),
    h('div', {
      style: {
        position: 'absolute', left: 0, right: 0, bottom: 0, width: 1200,
        display: 'flex', alignItems: 'center', padding: '18px 48px',
        backgroundColor: PAPER, borderTop: `1px solid ${LINE}`,
      },
    }, lockup()),
  ]);
}

/** The sheet: paper ground, title left, the Fold (or a framed shot or cover) right. */
function sheetCard(opts: CardOptions): El {
  const fold = opts.fold ?? 'star';
  const hasShot = Boolean(opts.screenshotPath);
  const hasInset = Boolean(opts.insetPath) && !hasShot;
  const titleWidth = hasShot ? 520 : 560;
  const titleSize = opts.title.length > 44 ? 64 : opts.title.length > 28 ? 74 : 84;

  const art: El[] = [];
  if (hasShot) {
    art.push(
      h('div', {
        style: {
          position: 'absolute', right: -40, top: 150, width: 600, height: 380, display: 'flex', flexDirection: 'column',
          borderRadius: 8, border: `1px solid ${LINE}`, backgroundColor: WHITE, boxShadow: '0 30px 60px -30px rgba(23,28,26,0.45)', overflow: 'hidden',
        },
      }, [
        h('div', { style: { display: 'flex', height: 30, alignItems: 'center', gap: 7, paddingLeft: 14, backgroundColor: PAPER_2, borderBottom: `1px solid ${LINE}` } },
          [0, 1, 2].map(() => h('div', { style: { width: 10, height: 10, borderRadius: 5, backgroundColor: LINE } }))),
        h('img', { src: fileDataUri(opts.screenshotPath as string), style: { width: 600, height: 350, objectFit: 'cover', objectPosition: 'top' } }),
      ]),
    );
    if (opts.fold) art.push(h('div', { style: { position: 'absolute', left: 470, top: 462, display: 'flex' } }, foldImage(fold, 120)));
  } else {
    const disc = fold === 'star' ? '#e8f2ef' : `${foldById[fold].c}55`;
    art.push(h('div', { style: { position: 'absolute', right: 70, top: 105, width: 380, height: 380, borderRadius: 190, backgroundColor: disc, display: 'flex' } }));
    if (hasInset) {
      art.push(h('div', {
        style: { position: 'absolute', right: 149, top: 128, width: 222, height: 334, display: 'flex', borderRadius: 4, boxShadow: '0 24px 48px -20px rgba(23,28,26,0.55)', overflow: 'hidden', transform: 'rotate(2deg)' },
      }, h('img', { src: fileDataUri(opts.insetPath as string), style: { width: 222, height: 334, objectFit: 'cover' } })));
    } else {
      art.push(h('div', { style: { position: 'absolute', right: 90, top: 110, display: 'flex' } }, foldImage(fold, 340)));
    }
  }

  return h('div', { style: { position: 'relative', display: 'flex', width: 1200, height: 630, fontFamily: 'Geist', backgroundColor: PAPER, overflow: 'hidden' } }, [
    ...art,
    h('div', { style: { position: 'absolute', left: 72, top: 64, bottom: 60, width: hasShot ? titleWidth : 1056, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, [
      h('div', { style: { display: 'flex', fontWeight: 700, fontSize: 19, letterSpacing: 3, textTransform: 'uppercase', color: TEAL, maxWidth: hasShot ? titleWidth : 600 } }, opts.eyebrow),
      h('div', { style: { display: 'flex', fontFamily: 'Fraunces', fontWeight: 300, fontSize: titleSize, lineHeight: 1.02, letterSpacing: -1.6, color: INK, maxWidth: titleWidth } }, opts.title),
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: hasShot ? titleWidth : 600 } }, [
        lockup(),
        opts.meta ? h('div', { style: { display: 'flex', fontSize: 20, color: INK_3 } }, opts.meta) : h('div', { style: { display: 'flex' } }, ''),
      ]),
    ]),
  ]);
}

const cardTree = (opts: CardOptions): El =>
  opts.backgroundPath && !opts.screenshotPath && !opts.insetPath ? artCard(opts) : sheetCard(opts);

/** Render a 1200x630 OG card as a JPG buffer (mozjpeg q90 keeps the type sharp). */
export async function renderOgCard(opts: CardOptions): Promise<Buffer> {
  const svg = await satori(cardTree(opts) as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts: FONTS });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
