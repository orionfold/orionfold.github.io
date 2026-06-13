// Product-detail join layer (P-series, spec §5.1–5.2). Bridges the two halves of
// the hybrid data model: the typed SSOT (src/data/{software,models,books}.ts —
// untouched) and the `productDetail` content collection (the rich body + the
// structured detail fields). Routes ask this module which slugs have a detail
// entry (so a page is emitted only when content exists), then normalize the
// joined record + entry into one ProductView the ProductDetail layout consumes.
//
// Slug contract (must match the roadmap id in src/lib/roadmap/source.ts so a
// Sponsor CTA can pre-select THIS product): software/book use the record's
// `.slug`; a model has no slug field, so it is slugify(title), deduped by title.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { software, type SoftwareProduct } from '../../data/software';
import { models, type Model } from '../../data/models';
import { books, type Book } from '../../data/books';

// Listing covers, resolved once so the RelatedRail can show real art on a card:
// models live at src/assets/models/<slug>/cover.png, software posters at the
// top level of src/assets/projects/ (<slug>-poster.png). Book covers come from
// the book's own detail hero; story covers from the story collection (below).
const MODEL_COVERS = import.meta.glob<{ default: ImageMetadata }>('../../assets/models/**/cover.png', { eager: true });
const SOFTWARE_COVERS = import.meta.glob<{ default: ImageMetadata }>('../../assets/projects/*.png', { eager: true });
const pickCover = (covers: Record<string, { default: ImageMetadata }>, key?: string): ImageMetadata | undefined =>
  key ? Object.entries(covers).find(([p]) => p.endsWith('/' + key))?.[1].default : undefined;
const resolveModelCover = (key?: string) => pickCover(MODEL_COVERS, key);
const resolveSoftwareCover = (key?: string) => pickCover(SOFTWARE_COVERS, key);

export type ProductType = 'software' | 'model' | 'book';
export type ProductEntry = CollectionEntry<'productDetail'>;

/** Same rule as roadmap/source.ts so ids line up across the site. */
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** The join slug for a record (model = slugify(title); others = .slug). */
export function productSlug(type: ProductType, record: SoftwareProduct | Model | Book): string {
  if (type === 'model') return slugify((record as Model).title);
  return (record as SoftwareProduct | Book).slug;
}

/**
 * Find the SSOT record(s) for a (type, slug). Models return every build variant
 * sharing the title (so a model detail page can list its GGUF/adapter builds);
 * software/books return their single record. Returns [] if nothing matches.
 */
export function findRecords(type: ProductType, slug: string): (SoftwareProduct | Model | Book)[] {
  if (type === 'software') return software.filter((s) => s.slug === slug);
  if (type === 'book') return books.filter((b) => b.slug === slug);
  return models.filter((m) => slugify(m.title) === slug);
}

/**
 * getStaticPaths source for a type: one route per productDetail entry that also
 * has a matching SSOT record. The entry is the gating set, so no empty pages.
 */
export async function getProductPaths(type: ProductType) {
  const entries = await getCollection('productDetail', (e) => e.data.type === type);
  return entries
    .filter((entry) => findRecords(type, entry.data.slug).length > 0)
    .map((entry) => ({ params: { slug: entry.data.slug }, props: { entry } }));
}

/**
 * The set of `${type}:${slug}` keys that have a productDetail entry. Listing
 * pages call this once to decide per card whether it links inward to its detail
 * page (/type/slug/) or keeps today's external link (the detailHref? fallback,
 * spec §3). Fetched once per build, no live call.
 */
export async function detailKeySet(): Promise<Set<string>> {
  const all = await getCollection('productDetail');
  return new Set(all.map((e) => `${e.data.type}:${e.data.slug}`));
}

export interface RelatedItem {
  title: string;
  href: string; // internal detail href when one exists, else the canonical home
  external: boolean;
  /** Drives the card eyebrow + the book portrait-cover treatment. */
  kind: ProductType | 'reading' | 'story';
  /** One-line pitch for the card body (model tagline / book blurb); reading has none. */
  blurb?: string;
  /** Resolved listing cover; absent -> the card falls back to a seeded constellation. */
  cover?: ImageMetadata;
  /** Constellation seed when there's no cover. */
  seed: string;
}

export interface ProductView {
  type: ProductType;
  slug: string;
  /** Hero type tag, e.g. OPEN SOFTWARE / OPEN-WEIGHT MODEL / BOOK. */
  typeTag: string;
  title: string;
  valueProp: string;
  /** Role-correct primary action (commerce spec): books buy, everything sponsors. */
  cta: 'buy' | 'sponsor';
  /** Stripe lookup key for the Buy button (books only). */
  lookupKey?: string;
  /** `${type}:${slug}` — carried into Stripe metadata so a sponsorship traces back here. */
  roadmapItemId: string;
  /** The now-demoted SSOT link (canonical home / repo), shown after the CTA. */
  outboundPrimary?: { label: string; href: string };
  /** Optional prominent live-demo link (software with a hosted demo). Rendered as
   *  a dedicated button in the hero + sticky bar, next to the Sponsor CTA. */
  demo?: { label: string; href: string };
  /** Short label pills from the SSOT (software/book). */
  pills: string[];
}

/** Arena edition-split above-fold buy rail. Built in ProductDetail.astro when a
 *  productDetail entry sets `fieldEdition`, consumed by HeroDetail + StickyCtaBar
 *  so an already-convinced buyer can pay without scrolling. Flag-aware: pre-launch
 *  the CTA scrolls to the full Field Edition block instead of charging. */
export interface FieldEditionCta {
  live: boolean;
  lookupKey: string;
  priceLabel: string;
  standardLabel: string;
  seats: number;
  anchor: string;
  itemId: string;
}

const TYPE_TAG: Record<ProductType, string> = {
  software: 'Open software',
  model: 'Open-weight model',
  book: 'Book',
};

/** Build the normalized view from the joined SSOT record(s) + collection entry. */
export function toProductView(type: ProductType, entry: ProductEntry): ProductView {
  const slug = entry.data.slug;
  const records = findRecords(type, slug);
  const primary = records[0];
  const base: ProductView = {
    type,
    slug,
    typeTag: TYPE_TAG[type],
    title: type === 'model' ? (primary as Model).title : (primary as SoftwareProduct | Book).title,
    valueProp: entry.data.valueProp,
    cta: type === 'book' ? 'buy' : 'sponsor',
    roadmapItemId: `${type}:${slug}`,
    pills: 'pills' in primary ? (primary as SoftwareProduct | Book).pills : [],
  };
  if (type === 'book') {
    const b = primary as Book;
    base.lookupKey = b.lookupKey;
    base.outboundPrimary = { label: b.ctaText, href: b.href };
  } else if (type === 'software') {
    const s = primary as SoftwareProduct;
    base.outboundPrimary = { label: s.ctaText, href: s.href };
    if (s.demoHref) base.demo = { label: s.demoLabel ?? 'Try the live demo', href: s.demoHref };
  } else {
    const m = primary as Model;
    base.outboundPrimary = { label: m.ctaText ?? 'Open on HuggingFace', href: m.href };
  }
  return base;
}

/** The SSOT cover asset key + which src/assets/<base>/ it lives under (for hero glob). */
export function coverKey(type: ProductType, slug: string): { key?: string; base?: 'projects' | 'models' } {
  const primary = findRecords(type, slug)[0];
  if (type === 'software') return { key: (primary as SoftwareProduct).cover, base: 'projects' };
  if (type === 'model') return { key: (primary as Model).cover, base: 'models' };
  return {}; // books resolve their cover differently (BookCover); P5 wires the DGX hero
}

/**
 * Resolve the RelatedRail targets to titles + best links. A related slug points
 * to its detail page when one exists, else to its canonical home. `detailSlugs`
 * is the set of slugs that already have a productDetail entry, fetched once.
 */
export async function resolveRelated(entry: ProductEntry) {
  const all = await getCollection('productDetail');
  const detailKey = (t: ProductType, s: string) => `${t}:${s}`;
  const hasDetail = new Set(all.map((e) => detailKey(e.data.type, e.data.slug)));

  const relatedModels: RelatedItem[] = (entry.data.relatedModels ?? []).flatMap((s) => {
    const m = models.find((mm) => slugify(mm.title) === s);
    if (!m) return [];
    const internal = hasDetail.has(detailKey('model', s));
    return [{
      title: m.title,
      href: internal ? `/models/${s}/` : m.href,
      external: !internal,
      kind: 'model',
      blurb: m.tagline,
      cover: resolveModelCover(m.cover),
      seed: s,
    }];
  });

  let relatedBook: RelatedItem | undefined;
  if (entry.data.relatedBook) {
    const b = books.find((bb) => bb.slug === entry.data.relatedBook);
    if (b) {
      const internal = hasDetail.has(detailKey('book', b.slug));
      // The book's own detail entry carries the real cover image as its hero.
      const bookEntry = all.find((e) => e.data.type === 'book' && e.data.slug === b.slug);
      relatedBook = {
        title: b.title,
        href: internal ? `/books/${b.slug}/` : b.href,
        external: !internal,
        kind: 'book',
        blurb: b.body,
        cover: bookEntry?.data.hero,
        seed: b.slug,
      };
    }
  }

  // Reading links are mostly off-site articles, but some point inward (a Story
  // post, or a product page). Internal ones become full cards, so pull the
  // target's real cover + blurb (a story shows its comic hero, not a motif).
  const stories = await getCollection('story');
  const storyBySlug = new Map(stories.map((s) => [s.id, s]));

  // Build-time guard. An internal relatedReading link that points at an on-site
  // page whose target no longer exists used to degrade silently — motif cover, no
  // blurb, dead /story/<slug>/ link (404). This is the drift that bites when story
  // slugs change as the arc is rebuilt. So fail the build loudly instead, naming
  // the offending file + href. A story is valid iff the story exists (the story
  // route builds them all); a product link is valid iff a productDetail entry
  // exists for it (that entry is what emits the /type/slug/ page). The `never`
  // return narrows the value to non-null for the callers below. A plain internal
  // link with no typed shape (e.g. /about/) still passes through as a reading card.
  const where = `${entry.data.type}/${entry.data.slug}`;
  const missing = (kind: string, slug: string): never => {
    throw new Error(
      `[product-detail] ${where}: relatedReading link "/${kind === 'model' ? 'models' : kind}/${slug}/" ` +
        `has no matching ${kind} page. Fix the href or drop the link ` +
        `(internal targets drift when stories/products are renamed).`,
    );
  };

  const relatedReading: RelatedItem[] = (entry.data.relatedReading ?? []).map((r) => {
    const external = /^https?:\/\//.test(r.href);
    const base: RelatedItem = { title: r.title, href: r.href, external, kind: 'reading', seed: slugify(r.title) };
    if (external) return base;
    let m: RegExpMatchArray | null;
    if ((m = r.href.match(/^\/story\/([^/]+)\/?$/))) {
      const s = storyBySlug.get(m[1]) ?? missing('story', m[1]);
      return { ...base, kind: 'story', blurb: s.data.summary, cover: s.data.hero, seed: m[1] };
    }
    if ((m = r.href.match(/^\/software\/([^/]+)\/?$/))) {
      if (!hasDetail.has(detailKey('software', m[1]))) missing('software', m[1]);
      const p = software.find((x) => x.slug === m![1]);
      return { ...base, kind: 'software', blurb: p?.body, cover: resolveSoftwareCover(p?.cover), seed: m[1] };
    }
    if ((m = r.href.match(/^\/models\/([^/]+)\/?$/))) {
      if (!hasDetail.has(detailKey('model', m[1]))) missing('model', m[1]);
      const mm = models.find((x) => slugify(x.title) === m![1]);
      return { ...base, kind: 'model', blurb: mm?.tagline, cover: resolveModelCover(mm?.cover), seed: m[1] };
    }
    if ((m = r.href.match(/^\/books\/([^/]+)\/?$/))) {
      if (!hasDetail.has(detailKey('book', m[1]))) missing('book', m[1]);
      const b = books.find((x) => x.slug === m![1]);
      const be = all.find((e) => e.data.type === 'book' && e.data.slug === m![1]);
      return { ...base, kind: 'book', blurb: b?.body, cover: be?.data.hero, seed: m[1] };
    }
    return base;
  });

  return { relatedModels, relatedBook, relatedReading };
}
