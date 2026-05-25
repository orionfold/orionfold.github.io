// OG card renderer (I-series). Composes a 1200x630 social-share PNG:
//   constellation background (resvg-rasterized SVG)  ->  Satori text overlay  ->  resvg PNG.
// Satori does the typography (real Geist shaping + flexbox wrapping); resvg
// rasterizes. See specs/2026-05-25-og-and-featured-image-pipeline.md.
//
// Satori cannot read the site's .woff2 fonts, so we load the TTFs converted from
// the exact same Geist weights (src/lib/og/fonts/, a committed build input).

import * as fs from 'node:fs';
import * as path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { constellationSvg } from './constellation';

const ROOT = process.cwd();
const fontRegular = fs.readFileSync(path.join(ROOT, 'src/lib/og/fonts/Geist-Regular.ttf'));
const fontBold = fs.readFileSync(path.join(ROOT, 'src/lib/og/fonts/Geist-Bold.ttf'));

const FONTS = [
  { name: 'Geist', data: fontRegular, weight: 400 as const, style: 'normal' as const },
  { name: 'Geist', data: fontBold, weight: 700 as const, style: 'normal' as const },
];

// Minimal hyperscript for Satori's element tree (this is a .ts file, no JSX).
type El = { type: string; props: Record<string, unknown> };
function h(type: string, props: Record<string, unknown>, children?: unknown): El {
  return { type, props: children === undefined ? props : { ...props, children } };
}

function pngDataUri(svg: string): string {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

function fileDataUri(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return `data:image/${mime};base64,${buf.toString('base64')}`;
}

export interface CardOptions {
  title: string;
  eyebrow: string;
  seed: string;
  meta?: string; // bottom-right, e.g. "Build log · May 24, 2026"
  /** Absolute path to a product screenshot to frame on the right (offering cards). */
  screenshotPath?: string;
  /**
   * Absolute path to a curated hero image used full-bleed as the card background
   * (story cards). When set, it replaces the constellation; a heavier scrim keeps
   * the title legible. PNG/JPG only (resvg does not decode webp).
   */
  backgroundPath?: string;
}

const ACCENT = '#5b8def';
const WHITE = '#ffffff';
const MUTED = '#9aa6c8';

function wordmark(): El {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 700, letterSpacing: -0.5 } },
    [
      h('span', { style: { color: WHITE } }, 'Orion'),
      h('span', { style: { color: ACCENT } }, 'fold'),
      h('span', { style: { color: MUTED, fontWeight: 400, fontSize: 20, marginLeft: 14 } }, 'orionfold.com'),
    ],
  );
}

function eyebrow(text: string): El {
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center' } },
    h(
      'div',
      {
        style: {
          color: ACCENT,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
        },
      },
      text,
    ),
  );
}

/** Build the Satori element tree for a card. */
function cardTree(opts: CardOptions): El {
  const hasShot = Boolean(opts.screenshotPath);
  const usePhoto = Boolean(opts.backgroundPath);
  const bg = usePhoto ? fileDataUri(opts.backgroundPath as string) : pngDataUri(constellationSvg(opts.seed));

  // Title scales down for long strings and narrows when a screenshot shares the row.
  const titleSize = opts.title.length > 42 ? 58 : opts.title.length > 28 ? 66 : 74;
  const titleMaxWidth = hasShot ? 600 : 900;

  const layers: El[] = [
    // background: full-bleed hero photo, or the seeded constellation
    h('img', {
      src: bg,
      width: 1200,
      height: 630,
      style: { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' },
    }),
    // left-weighted scrim so text stays legible (heavier over a photo)
    h('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1200,
        height: 630,
        display: 'flex',
        backgroundImage: usePhoto
          ? 'linear-gradient(100deg, rgba(8,11,20,0.94) 0%, rgba(8,11,20,0.62) 48%, rgba(8,11,20,0.34) 100%)'
          : 'linear-gradient(105deg, rgba(10,13,22,0.86) 0%, rgba(10,13,22,0.45) 52%, rgba(10,13,22,0.05) 100%)',
      },
    }),
  ];

  // Extra bottom scrim over photos so the wordmark + meta stay readable.
  if (usePhoto) {
    layers.push(
      h('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: 'flex',
          backgroundImage: 'linear-gradient(0deg, rgba(8,11,20,0.85) 0%, rgba(8,11,20,0) 40%)',
        },
      }),
    );
  }

  // Optional framed product screenshot, bleeding off the right edge.
  if (hasShot) {
    layers.push(
      h(
        'div',
        {
          style: {
            position: 'absolute',
            top: 168,
            left: 660,
            width: 660,
            height: 372,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.14)',
            backgroundColor: '#0c1020',
            overflow: 'hidden',
          },
        },
        [
          // macOS-style title bar with three dots
          h(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                height: 34,
                paddingLeft: 16,
                backgroundColor: 'rgba(255,255,255,0.06)',
              },
            },
            [
              h('div', { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#ff5f57', marginRight: 8 } }),
              h('div', { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#febc2e', marginRight: 8 } }),
              h('div', { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#28c840' } }),
            ],
          ),
          h('img', {
            src: fileDataUri(opts.screenshotPath as string),
            style: { width: 660, height: 338, objectFit: 'cover', objectPosition: 'top' },
          }),
        ],
      ),
    );
  }

  // Foreground content column.
  const content = h(
    'div',
    {
      style: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 1200,
        height: 630,
        paddingTop: 72,
        paddingBottom: 64,
        paddingLeft: 80,
        paddingRight: 80,
      },
    },
    [
      eyebrow(opts.eyebrow),
      h(
        'div',
        { style: { display: 'flex' } },
        h(
          'div',
          {
            style: {
              display: 'flex',
              color: WHITE,
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: -1,
              maxWidth: titleMaxWidth,
            },
          },
          opts.title,
        ),
      ),
      h(
        'div',
        { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        [
          wordmark(),
          opts.meta
            ? h(
                'div',
                {
                  style: {
                    display: 'flex',
                    color: MUTED,
                    fontSize: 20,
                    fontWeight: 400,
                    letterSpacing: 0.3,
                  },
                },
                opts.meta,
              )
            : h('div', { style: { display: 'flex' } }, ''),
        ],
      ),
    ],
  );
  layers.push(content);

  return h(
    'div',
    {
      style: {
        position: 'relative',
        display: 'flex',
        width: 1200,
        height: 630,
        fontFamily: 'Geist',
        backgroundColor: '#0e1322',
      },
    },
    layers,
  );
}

/** Render a 1200x630 OG PNG for the given card options. */
export async function renderOgCard(opts: CardOptions): Promise<Buffer> {
  const svg = await satori(cardTree(opts) as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: FONTS,
  });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng());
}
