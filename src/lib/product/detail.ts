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
import { software, type SoftwareProduct } from '../../data/software';
import { models, type Model } from '../../data/models';
import { books, type Book } from '../../data/books';

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

export interface RelatedItem {
  title: string;
  href: string; // internal detail href when one exists, else the canonical home
  external: boolean;
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
  /** Short label pills from the SSOT (software/book). */
  pills: string[];
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
    return [{ title: m.title, href: internal ? `/models/${s}/` : m.href, external: !internal }];
  });

  let relatedBook: RelatedItem | undefined;
  if (entry.data.relatedBook) {
    const b = books.find((bb) => bb.slug === entry.data.relatedBook);
    if (b) {
      const internal = hasDetail.has(detailKey('book', b.slug));
      relatedBook = { title: b.title, href: internal ? `/books/${b.slug}/` : b.href, external: !internal };
    }
  }

  const relatedReading: RelatedItem[] = (entry.data.relatedReading ?? []).map((r) => ({
    title: r.title,
    href: r.href,
    external: /^https?:\/\//.test(r.href),
  }));

  return { relatedModels, relatedBook, relatedReading };
}
