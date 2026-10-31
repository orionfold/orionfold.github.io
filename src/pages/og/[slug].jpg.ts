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
import { FOLDS, type FoldId } from '../../lib/paper/folds';
import { cachedRender, rendererDigest } from '../../lib/og/card-cache';
import { OG_PAGES, storyOgSlug, productOgSlug, letterOgSlug, receiptOgSlug, flowPathOgSlug, compareOgSlug, flowElementsOgSlug, domainOgSlug } from '../../data/og';
import { publishedPaths, publishedCompare } from '../../lib/flow/paths';
import { publishedElementArticles } from '../../lib/flow/elements';
import { publishedDomainArticles } from '../../lib/flow/domains';
import { toProductView, coverKey } from '../../lib/product/detail';

// A Flow Playbook's card shows its own Fold. The S-1 Analyst borrows Atlas
// (operator 2026-10-30 19:34, via the product lane's flowPlaybookSlug contract).
const DOMAIN_FOLD: Record<string, FoldId> = { 'anthropic-s1-analyst': 'atlas' };
const domainFold = (id: string): FoldId | undefined => DOMAIN_FOLD[id] ?? FOLDS.find((f) => f.domainSlug === id)?.id;

// Book detail OG cards frame the portrait cover on the right of the sheet.
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
// exists at the convention path; otherwise it falls back to the Paper sheet.
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

// Same convention for receipts: src/assets/receipts/<id>/hero.<ext>.
function receiptHeroBackground(id: string): string | undefined {
  for (const ext of ['png', 'jpg', 'jpeg']) {
    const p = path.join(process.cwd(), 'src/assets/receipts', id, `hero.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Landing / listing pages + homepage: the Paper sheet with the page's Fold. A
  // landing page that ships its own curated hero (OgPage.background) uses that art
  // full-bleed with the paper brand bar instead.
  const fromPages = Object.values(OG_PAGES).map((p) => {
    const bgAbs = p.background ? path.join(process.cwd(), p.background) : undefined;
    const useBackground = Boolean(bgAbs && fs.existsSync(bgAbs));
    // A page may instead ship a product screenshot (OgPage.screenshot), framed
    // on the right of the card the way product-detail cards frame theirs.
    // Satori cannot decode webp, so webp-configured entries keep the plain sheet.
    const shotAbs = p.screenshot && !p.screenshot.endsWith('.webp')
      ? path.join(process.cwd(), p.screenshot)
      : undefined;
    const useShot = Boolean(shotAbs && fs.existsSync(shotAbs));
    return {
      params: { slug: p.slug },
      props: {
        title: p.title,
        eyebrow: p.eyebrow,
        seed: p.seed,
        meta: p.meta,
        ...(p.fold ? { fold: p.fold } : {}),
        ...(useBackground ? { backgroundPath: bgAbs } : useShot ? { screenshotPath: shotAbs } : {}),
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
  // <id>/hero.*), otherwise the Paper sheet.
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

  // Receipts (A11): one card per receipt, mirroring the letter cards. Background
  // is the receipt's curated hero when present (src/assets/receipts/<id>/hero.*),
  // otherwise the Paper sheet.
  const receiptEntries = await getCollection('receipts');
  const fromReceipts = receiptEntries.map((r: CollectionEntry<'receipts'>) => ({
    params: { slug: receiptOgSlug(r.id) },
    props: {
      title: r.data.title,
      eyebrow: 'Receipt',
      seed: r.id,
      meta: fmtDate(r.data.date),
      backgroundPath: receiptHeroBackground(r.id),
    } satisfies CardOptions,
  }));

  // Product detail pages: each card now shows the product's own featured art.
  // Software posters + model covers are landscape, used full-bleed. Book covers are
  // portrait, so they are framed on the sheet instead.
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
      art = abs && fs.existsSync(abs) ? { insetPath: abs, fold: 'hop' } : { fold: 'hop' };
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

  // Flow paths: the sheet with the path's own card shot framed on the right (src/assets/flow/paths/<id>/card.jpg, written by sync-flow-paths.mjs).
  const fromPaths = (await publishedPaths()).map((entry) => {
    const shot = path.join(process.cwd(), 'src/assets/flow/paths', entry.id, 'card.jpg');
    return {
      params: { slug: flowPathOgSlug(entry.id) },
      props: {
        title: entry.data.title,
        eyebrow: `Flow · Path · ${entry.data.chip}`,
        seed: entry.id,
        fold: 'sprout',
        ...(fs.existsSync(shot) ? { screenshotPath: shot } : {}),
      } satisfies CardOptions,
    };
  });
  const fromCompare = (await publishedCompare()).map((entry) => ({
    params: { slug: compareOgSlug(entry.id) },
    // The card carries the pairing only (the clause before the colon); the
    // eyebrow names the tool and the long H1 would clip at this type size.
    props: { title: entry.data.title.replace(/:.*$/, ''), eyebrow: `Compare · Flow and ${entry.data.tool}`, seed: entry.id, fold: 'clause' } satisfies CardOptions,
  }));

  // Flow Elements: the same sheet, framed on the article's card shot.
  const fromElements = (await publishedElementArticles()).map((entry) => {
    const shot = path.join(process.cwd(), 'src/assets/flow/elements', entry.id, 'card.jpg');
    return {
      params: { slug: flowElementsOgSlug(entry.id) },
      props: {
        title: entry.data.title,
        eyebrow: `Flow · Elements · ${entry.data.category}`,
        seed: entry.id,
        fold: 'hop',
        ...(fs.existsSync(shot) ? { screenshotPath: shot } : {}),
      } satisfies CardOptions,
    };
  });

  // Flow Playbooks: the launch article's card, framed on its hero shot.
  const fromDomains = (await publishedDomainArticles()).map((entry) => {
    const shot = path.join(process.cwd(), 'src/assets/flow/domains', entry.id, 'card.jpg');
    return {
      params: { slug: domainOgSlug(entry.id) },
      props: {
        title: entry.data.title,
        eyebrow: `Flow · Playbooks · ${entry.data.domain}`,
        seed: entry.id,
        ...(domainFold(entry.id) ? { fold: domainFold(entry.id) } : {}),
        ...(fs.existsSync(shot) ? { screenshotPath: shot } : {}),
      } satisfies CardOptions,
    };
  });

  return [...fromPages, ...fromPosts, ...fromLetters, ...fromProducts, ...fromReceipts, ...fromPaths, ...fromCompare, ...fromElements, ...fromDomains];
};

// One digest of the renderer's inputs per build; the cache key adds each card's
// own options (see card-cache.ts). Every render logs its slug, so the build log
// is the receipt: a page-only push logs none, a new page logs its own card.
const RENDERER = rendererDigest();

export const GET: APIRoute = async ({ props, params }) => {
  const jpg = await cachedRender(props as CardOptions as Record<string, unknown>, (o) => {
    console.log(`[og] rendering ${params.slug}.jpg`);
    return renderOgCard(o as unknown as CardOptions);
  }, { renderer: RENDERER });
  return new Response(new Uint8Array(jpg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
