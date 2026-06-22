// OG card renderer (I-series). Composes a 1200x630 social-share JPG:
//   constellation background (resvg-rasterized SVG)  ->  Satori text overlay  ->
//   resvg PNG  ->  sharp JPG. Satori does the typography (real Geist shaping +
//   flexbox wrapping); resvg rasterizes; sharp re-encodes to JPG so detailed
//   photographic hero backgrounds stay well under the social-card weight budget
//   (spec §8 targets ~100-300KB). See specs/2026-05-25-og-and-featured-image-pipeline.md.
//
// Satori cannot read the site's .woff2 fonts, so we load the TTFs converted from
// the exact same Geist weights (src/lib/og/fonts/, a committed build input).

import * as fs from 'node:fs';
import * as path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { constellationSvg } from './constellation';

const ROOT = process.cwd();
const fontRegular = fs.readFileSync(path.join(ROOT, 'src/lib/og/fonts/Geist-Regular.ttf'));
const fontBold = fs.readFileSync(path.join(ROOT, 'src/lib/og/fonts/Geist-Bold.ttf'));

// Brand banner (committed build input, 1200x630, Orion logo on the right). Used as
// the OG background for landing/listing pages and the homepage, and behind a framed
// book cover for book detail pages. Read + encoded once and reused across cards.
const BANNER_URI = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'src/lib/og/banner.png')).toString('base64')}`;

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
   * (story comics, software posters, model covers). When set, it replaces the
   * constellation; a heavier scrim keeps the title legible. PNG/JPG only (resvg
   * does not decode webp).
   */
  backgroundPath?: string;
  /**
   * Use the brand banner as the background instead of the constellation
   * (landing/listing pages + homepage). The title is constrained to the left so
   * it never collides with the Orion logo on the banner's right. Overrides
   * backgroundPath.
   */
  banner?: boolean;
  /**
   * Absolute path to a portrait image (a book cover) framed on the left over the
   * banner. Implies banner mode; the text column shifts right of the cover. PNG/JPG.
   */
  insetPath?: string;
}

const WHITE = '#ffffff';
// Soft dark halo behind white text so it stays legible over bright, true-color art
// without darkening the image. Layered: a crisp near shadow + two wider soft glows.
const TEXT_GLOW = '0 0 5px rgba(0,0,0,0.95), 0 2px 7px rgba(0,0,0,0.92), 0 0 24px rgba(0,0,0,0.85), 0 0 54px rgba(0,0,0,0.6)';

function wordmark(): El {
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: -0.5,
        color: WHITE,
        textShadow: TEXT_GLOW,
      },
    },
    'orionfold.com',
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
          color: WHITE,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: 'uppercase',
          textShadow: TEXT_GLOW,
        },
      },
      text,
    ),
  );
}

/**
 * Bottom overlay strip for full-bleed art cards (story comics, software posters,
 * model covers, curated-hero landing pages). The art is busy and often carries its
 * own lettering, so instead of floating the title across the whole image we drop
 * eyebrow + title + footer into a semi-transparent dark band pinned to the bottom.
 * The band is a transparent->dark gradient (a designed scrim, not a hard bar) so the
 * creative still breathes above it. The starry brand-banner cards keep the airy
 * full-card layout — this strip is only for the photographic/art backgrounds.
 */
function bottomStrip(opts: CardOptions, titleSize: number): El {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width: 1200,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingLeft: 64,
        paddingRight: 64,
        paddingTop: 72,
        paddingBottom: 48,
        // Transparent at the top, near-opaque where the text sits.
        backgroundImage:
          'linear-gradient(to bottom, rgba(7,13,20,0) 0%, rgba(7,13,20,0.74) 40%, rgba(7,13,20,0.94) 100%)',
      },
    },
    [
      eyebrow(opts.eyebrow),
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
            maxWidth: 1072,
            textShadow: TEXT_GLOW,
          },
        },
        opts.title,
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
                    color: WHITE,
                    fontSize: 20,
                    fontWeight: 400,
                    letterSpacing: 0.3,
                    textShadow: TEXT_GLOW,
                  },
                },
                opts.meta,
              )
            : h('div', { style: { display: 'flex' } }, ''),
        ],
      ),
    ],
  );
}

/** Build the Satori element tree for a card. */
function cardTree(opts: CardOptions): El {
  const useBanner = Boolean(opts.banner);
  const hasInset = Boolean(opts.insetPath);
  const hasShot = Boolean(opts.screenshotPath) && !useBanner;
  const usePhoto = Boolean(opts.backgroundPath) && !useBanner;
  // Full-bleed art (no framed screenshot) gets the bottom overlay strip so the title
  // never fights busy poster art or a comic's own lettering.
  const useStrip = usePhoto && !hasShot && !hasInset;
  const bg = useBanner
    ? BANNER_URI
    : usePhoto
      ? fileDataUri(opts.backgroundPath as string)
      : pngDataUri(constellationSvg(opts.seed));

  // Title scales down for long strings. It also narrows when a screenshot shares the
  // row, when the banner logo must stay clear on the right, or when a book cover sits
  // on the left.
  const titleSize = opts.title.length > 42 ? 58 : opts.title.length > 28 ? 66 : 74;
  const titleMaxWidth = hasInset ? 480 : useBanner ? 660 : hasShot ? 600 : 900;
  const padLeft = hasInset ? 392 : 80;

  const layers: El[] = [
    // Background: full-bleed featured art shown in TRUE COLOR (no darkening scrim).
    // Legibility comes from the text glow (TEXT_GLOW) instead.
    h('img', {
      src: bg,
      width: 1200,
      height: 630,
      style: { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' },
    }),
  ];

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

  // Optional portrait book cover, framed on the left over the banner (book cards).
  if (hasInset) {
    layers.push(
      h(
        'div',
        {
          style: {
            position: 'absolute',
            top: 92,
            left: 64,
            width: 296,
            height: 446,
            display: 'flex',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.20)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            overflow: 'hidden',
          },
        },
        h('img', {
          src: fileDataUri(opts.insetPath as string),
          style: { width: 296, height: 446, objectFit: 'cover' },
        }),
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
        paddingLeft: padLeft,
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
              textShadow: TEXT_GLOW,
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
                    color: WHITE,
                    fontSize: 20,
                    fontWeight: 400,
                    letterSpacing: 0.3,
                    textShadow: TEXT_GLOW,
                  },
                },
                opts.meta,
              )
            : h('div', { style: { display: 'flex' } }, ''),
        ],
      ),
    ],
  );
  layers.push(useStrip ? bottomStrip(opts, titleSize) : content);

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

/**
 * Render a 1200x630 OG card for the given card options as a JPG buffer.
 * resvg rasterizes the Satori SVG to PNG, then sharp re-encodes to mozjpeg —
 * the constellation/screenshot cards stay crisp and the photographic hero cards
 * drop from ~1MB PNG to ~150-250KB. Quality 90 keeps the overlaid Geist text sharp.
 */
export async function renderOgCard(opts: CardOptions): Promise<Buffer> {
  const svg = await satori(cardTree(opts) as unknown as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: FONTS,
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return await sharp(png).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
