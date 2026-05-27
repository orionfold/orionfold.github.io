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
import { OG_PAGES, storyOgSlug, productOgSlug } from '../../data/og';
import { toProductView } from '../../lib/product/detail';

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

export const getStaticPaths: GetStaticPaths = async () => {
  const fromPages = Object.values(OG_PAGES).map((p) => ({
    params: { slug: p.slug },
    props: {
      title: p.title,
      eyebrow: p.eyebrow,
      seed: p.seed,
      meta: p.meta,
      screenshotPath: p.screenshot ? path.join(process.cwd(), p.screenshot) : undefined,
    } satisfies CardOptions,
  }));

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

  // Product detail pages (P8): one card per productDetail entry. The view's
  // title + typeTag drive the headline + eyebrow; the namespaced slug seeds a
  // distinct constellation. Mirrors the story loop above — same renderer, no
  // per-product hand-authoring. (Earlier these pages fell back to the site OG.)
  const products = await getCollection('productDetail');
  const fromProducts = products.map((entry: CollectionEntry<'productDetail'>) => {
    const view = toProductView(entry.data.type, entry);
    const slug = productOgSlug(entry.data.type, entry.data.slug);
    return {
      params: { slug },
      props: {
        title: view.title,
        eyebrow: view.typeTag,
        seed: slug,
      } satisfies CardOptions,
    };
  });

  return [...fromPages, ...fromPosts, ...fromProducts];
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
