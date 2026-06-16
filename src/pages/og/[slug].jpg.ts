// Per-page OG image endpoint (I-series). A static endpoint: getStaticPaths
// enumerates the static route map (src/data/og.ts) plus every `story` post, and
// each GET renders a 1200x630 JPG (mozjpeg, q90 - see card.ts). In Astro's static
// build these materialize as dist/og/<slug>.jpg (dist/ is gitignored, so they are
// CI-only). Page templates point og:image at /og/<slug>.jpg via ogMeta()/storyOgSlug().
import type { APIRoute, GetStaticPaths } from 'astro';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getCollection, type CollectionEntry } from 'astro:content';
import { renderOgCard, type CardOptions } from '../../lib/og/card';
import { OG_PAGES, storyOgSlug, productOgSlug, letterOgSlug } from '../../data/og';
import { toProductView, coverKey } from '../../lib/product/detail';

// Book detail OG cards frame the portrait cover on the left over the banner.
const BOOK_COVERS: Record<string, string> = {
  'ai-native-business': 'src/assets/book/ai-native-business-book.jpg',
  'ai-research-on-nvidia-dgx-spark': 'src/assets/book/ai-research-dgx-spark-book.jpg',
};

export const prerender = true;

// Format in UTC so a date-only value (parsed as UTC midnight) shows the authored
// day regardless of the build machine's timezone.
const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d);

// A post's OG card uses its curated hero as a full-bleed background when one
// exists at the convention path; otherwise it falls back to the constellation.
function heroBackground(id: string): string | undefined {
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const p = path.join(process.cwd(), 'src/assets/story', id, `hero.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

// Same convention for letter editions: src/assets/letters/<id>/hero.<ext>.
function letterHeroBackground(id: string): string | undefined {
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const p = path.join(process.cwd(), 'src/assets/letters', id, `hero.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Landing / listing pages + homepage: the brand banner is the background, with the
  // page title + orionfold.com kept on the left, clear of the banner's Orion logo.
  // A landing page that ships its own curated hero (OgPage.background) uses that art
  // full-bleed instead, with the title's text glow keeping it legible.
  const fromPages = Object.values(OG_PAGES).map((p) => {
    const bgAbs = p.background ? path.join(process.cwd(), p.background) : undefined;
    const useBackground = Boolean(bgAbs && fs.existsSync(bgAbs));
    return {
      params: { slug: p.slug },
      props: {
        title: p.title,
        eyebrow: p.eyebrow,
        seed: p.seed,
        meta: p.meta,
        ...(useBackground ? { backgroundPath: bgAbs } : { banner: true }),
      } satisfies CardOptions,
    };
  });

  const posts = await getCollection('story');
  const fromPosts = posts.map((post: CollectionEntry<'story'>) => ({
    params: { slug: storyOgSlug(post.id) },
    props: {
      title: post.data.title,
      eyebrow: post.data.tags[0] ?? 'Story',
      seed: post.data.accent ?? post.id,
      meta: fmtDate(post.data.date),
      backgroundPath: heroBackground(post.id),
    } satisfies CardOptions,
  }));

  // Founder-letter editions: one card per edition, mirroring the story cards.
  // Background is the edition's curated hero when present (src/assets/letters/
  // <id>/hero.*), otherwise the seeded constellation.
  const letters = await getCollection('letters');
  const fromLetters = letters.map((letter: CollectionEntry<'letters'>) => ({
    params: { slug: letterOgSlug(letter.id) },
    props: {
      title: letter.data.title,
      eyebrow: `Letter · ${letter.data.edition}`,
      seed: letter.id,
      meta: fmtDate(letter.data.date),
      backgroundPath: letterHeroBackground(letter.id),
    } satisfies CardOptions,
  }));

  // Product detail pages: each card now shows the product's own featured art.
  // Software posters + model covers are landscape, used full-bleed. Book covers are
  // portrait, so they are framed on the left over the brand banner instead.
  const products = await getCollection('productDetail');
  const fromProducts = products.map((entry: CollectionEntry<'productDetail'>) => {
    const type = entry.data.type;
    const pslug = entry.data.slug;
    const view = toProductView(type, entry);
    const slug = productOgSlug(type, pslug);

    let art: Partial<CardOptions>;
    if (type === 'book') {
      const rel = BOOK_COVERS[pslug];
      const abs = rel ? path.join(process.cwd(), rel) : undefined;
      art = abs && fs.existsSync(abs) ? { banner: true, insetPath: abs } : { banner: true };
    } else {
      const { key, base } = coverKey(type, pslug);
      const abs = key && base ? path.join(process.cwd(), 'src/assets', base, key) : undefined;
      art = abs && fs.existsSync(abs) ? { backgroundPath: abs } : {};
    }

    return {
      params: { slug },
      props: {
        title: view.title,
        eyebrow: view.typeTag,
        seed: slug,
        ...art,
      } satisfies CardOptions,
    };
  });

  return [...fromPages, ...fromPosts, ...fromLetters, ...fromProducts];
};

export const GET: APIRoute = async ({ props }) => {
  const jpg = await renderOgCard(props as CardOptions);
  return new Response(new Uint8Array(jpg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
