// band-for-page — picks which product a page's cross-sell band SELLS and how it
// sells it, deterministically at build time (no runtime randomizer: the same
// page always resolves to the same band, so zero flash and conversion stays
// measurable). The operator's rule (2026-07-01): a strong topical association
// wins; where the match is loose, distribute so the site sells all three
// products in roughly equal thirds (Proof · Arena · Relay), treated as equals.
//
// Product meanings for the match:
//   proof  = eval / receipts / trust ("which AI can I trust")
//   arena  = the eval cockpit + local models you run on a DGX Spark ("which build wins")
//   relay  = agents / workflows / agency operations ("make the trusted AI do the work")
//
// Mode is the hybrid the operator chose: high-intent product-evaluation pages
// (software + model detail) get real in-page checkout (A); lower-intent pages
// (stories, about, thanks, receipts) route to the product's landing page (B).
// GA4 will tell us which converts better over time, so the two modes are tagged
// distinctly at the call site.

export type BandProduct = 'proof' | 'arena' | 'relay';
export type BandMode = 'checkout' | 'link';

export interface BandChoice {
  product: BandProduct;
  mode: BandMode;
}

export type PageType = 'software' | 'model' | 'book' | 'story' | 'receipt' | 'page';

// The proven products (ours:true columns in proof.ts) — strong Proof.
const PROVEN_SLUGS = new Set(['advisor', 'kepler', 'patent-strategist', 'patent-strategist-bench']);

// Software strong matches by slug (from the audit's signal map).
const SOFTWARE_PRODUCT: Record<string, BandProduct> = {
  arena: 'arena',
  fieldkit: 'arena',
  command: 'arena',
  advisor: 'proof',
  cortex: 'proof',
  sentinel: 'proof', // agent testing -> testing/trust
  'ai-native-platform': 'relay',
  'ai-native-api': 'relay',
  trends: 'relay',
  moments: 'relay',
};

// Story strong matches by a tag signal. Checked against the story's tags[].
// A tag in this list assigns that product; first match wins in TAG_ORDER.
const TAG_PRODUCT: Array<{ tag: string; product: BandProduct }> = [
  { tag: 'Proof', product: 'proof' },
  { tag: 'Arena Field Edition', product: 'arena' },
  { tag: 'Agents', product: 'relay' },
];
// Softer story signals (checked after the strong tags above).
const SOFT_TAG_PRODUCT: Array<{ tag: string; product: BandProduct }> = [
  { tag: 'Fine-tuning', product: 'arena' },
  { tag: 'Models', product: 'arena' },
  { tag: 'Tools', product: 'arena' },
  { tag: 'Vibe coding', product: 'relay' },
  { tag: 'Multi-agent', product: 'relay' },
  { tag: 'fieldkit', product: 'arena' },
];

// A tiny stable string hash (FNV-1a) so a loose page always lands on the same
// bucket. Deterministic across builds; no Math.random (which would break the
// no-flash / measurable invariant and is unavailable in this env anyway).
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Loose pages distribute across the three products by a stable hash. Relay has
// almost no natural strong matches on the model surface (all domain models are
// Arena-ish), so the loose pool leans Relay-first to pull the total toward even
// thirds: hash%3 maps 0->relay, 1->proof, 2->arena. This ordering is a balance
// knob, tuned against the real page population (see band-for-page.test.ts).
const LOOSE_BY_MOD: BandProduct[] = ['relay', 'proof', 'arena'];

/** The product a loose page falls back to, stable per key. */
function looseProduct(key: string): BandProduct {
  return LOOSE_BY_MOD[hashString(key) % 3];
}

/**
 * Resolve the strong product match for a page, or undefined if the match is
 * loose (eligible for hash-balancing). Pure: callers pass the already-known
 * signals (proven flag, group, tags, receipt-source product) so this stays
 * free of Astro/content-layer imports and is unit-testable.
 */
export function strongProduct(input: {
  type: PageType;
  slug: string;
  proven?: boolean;
  softwareGroup?: string;
  modelGroup?: string;
  tags?: string[];
  receiptProduct?: BandProduct; // receipts carry a source origin (proof/arena)
}): BandProduct | undefined {
  const { type, slug, proven, tags, receiptProduct } = input;

  // Proven products (advisor/kepler/patent + the bench) are always Proof.
  if (proven || PROVEN_SLUGS.has(slug)) return 'proof';

  if (type === 'receipt' && receiptProduct) return receiptProduct;

  if (type === 'software') {
    const m = SOFTWARE_PRODUCT[slug];
    if (m) return m;
    return undefined; // apps/intel/devtools-without-signal -> loose
  }

  if (type === 'model') {
    // Non-proven models are all local domain models you run in the cockpit.
    // That IS a real Arena signal, but a soft one — treat as loose so the
    // model surface (which has zero natural Relay) doesn't over-weight Arena.
    return undefined;
  }

  // Standalone pages with a clear product association (the founder trust
  // narrative + the magnet thank-you both lead with "prove which AI you can
  // trust" -> Proof).
  if (type === 'page') {
    if (slug === 'about' || slug === 'thanks') return 'proof';
    return undefined;
  }

  if (type === 'story' && tags && tags.length) {
    for (const { tag, product } of TAG_PRODUCT) {
      if (tags.includes(tag)) return product;
    }
    for (const { tag, product } of SOFT_TAG_PRODUCT) {
      if (tags.includes(tag)) return product;
    }
    return undefined;
  }

  return undefined;
}

/**
 * Which product the page sells + how. `type` picks the mode (hybrid rule):
 * software/model detail pages get in-page checkout; everything else links to
 * the product landing page. Product = strong match, else stable hash to thirds.
 */
export function bandForPage(input: {
  type: PageType;
  slug: string;
  proven?: boolean;
  softwareGroup?: string;
  modelGroup?: string;
  tags?: string[];
  receiptProduct?: BandProduct;
}): BandChoice {
  const product = strongProduct(input) ?? looseProduct(`${input.type}:${input.slug}`);
  // High-intent product-evaluation pages sell in place; the rest route to the
  // landing page (where the canonical buy block lives).
  const mode: BandMode = input.type === 'software' || input.type === 'model' ? 'checkout' : 'link';
  return { product, mode };
}
