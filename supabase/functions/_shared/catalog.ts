// Orionfold commerce catalog — the single source of truth for paid offerings.
//
// Prices are resolved at RUNTIME by `lookup_key`, never by hardcoded price IDs.
// A sandbox `price_…` does not exist in live mode, so hardcoding an ID would make
// going live a code change. With stable lookup keys (identical in test + live),
// the test↔live cutover is a pure config swap: re-point the restricted key, copy
// the catalog to live, and the same lookup keys resolve to the live prices.
// See STRIPE-HANDOFF.md §1, §4.
//
// This module is intentionally dependency-free (no Deno/Node globals at load time)
// so it can be imported by BOTH the Deno edge functions (C2 create-checkout-session,
// C3 stripe-webhook fulfillment) and the Astro frontend (C4 buy / sponsor buttons).

/** Pinned Stripe API version — construct every SDK client with this. */
export const STRIPE_API_VERSION = "2026-04-22.dahlia";

export type OfferingKind = "book" | "sponsor";
export type CheckoutMode = "payment" | "subscription";
export type SponsorTier = "bronze" | "silver" | "gold" | "platinum";

export interface CatalogItem {
  /** Stripe `lookup_key` — server-trusted; resolves to the active price at runtime. */
  lookupKey: string;
  kind: OfferingKind;
  /** Checkout Session mode: books are one-time, sponsor tiers are recurring. */
  mode: CheckoutMode;
  /** Human label (display + receipts/emails). */
  label: string;
  /** Sponsor tier (sponsors only). */
  tier?: SponsorTier;
  /**
   * Price in USD cents — DISPLAY ONLY (lets the frontend render prices without an
   * API call). Stripe remains the source of truth: the checkout function never
   * trusts a client-supplied amount; it resolves the price by `lookup_key`.
   */
  amount: number;
}

/** Keyed by `lookup_key`. This object is the server-side allowlist. */
export const CATALOG: Record<string, CatalogItem> = {
  book_ai_native_business: {
    lookupKey: "book_ai_native_business",
    kind: "book",
    mode: "payment",
    label: "AI Native Business",
    amount: 2000,
  },
  book_ai_research_dgx_spark: {
    lookupKey: "book_ai_research_dgx_spark",
    kind: "book",
    mode: "payment",
    label: "AI Research on NVIDIA DGX Spark",
    amount: 5000,
  },
  sponsor_bronze: {
    lookupKey: "sponsor_bronze",
    kind: "sponsor",
    mode: "subscription",
    label: "Bronze Sponsor",
    tier: "bronze",
    amount: 1000,
  },
  sponsor_silver: {
    lookupKey: "sponsor_silver",
    kind: "sponsor",
    mode: "subscription",
    label: "Silver Sponsor",
    tier: "silver",
    amount: 2500,
  },
  sponsor_gold: {
    lookupKey: "sponsor_gold",
    kind: "sponsor",
    mode: "subscription",
    label: "Gold Sponsor",
    tier: "gold",
    amount: 5000,
  },
  sponsor_platinum: {
    lookupKey: "sponsor_platinum",
    kind: "sponsor",
    mode: "subscription",
    label: "Platinum Sponsor",
    tier: "platinum",
    amount: 10000,
  },
};

/** All valid lookup keys — the server-side allowlist. */
export const LOOKUP_KEYS = Object.keys(CATALOG);

export const BOOK_LOOKUP_KEYS = LOOKUP_KEYS.filter((k) => CATALOG[k].kind === "book");
export const SPONSOR_LOOKUP_KEYS = LOOKUP_KEYS.filter((k) => CATALOG[k].kind === "sponsor");

/** Sponsor tiers cheapest → priciest (display order). */
export const SPONSOR_TIERS: SponsorTier[] = ["bronze", "silver", "gold", "platinum"];

/** Type guard: is this a known, allowed lookup key? */
export function isAllowedLookupKey(key: unknown): key is string {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(CATALOG, key);
}

/** Resolve a catalog item by lookup key, or undefined if not in the allowlist. */
export function getCatalogItem(key: string): CatalogItem | undefined {
  return CATALOG[key];
}

/** Resolve the lookup key for a given sponsor tier. */
export function sponsorLookupKey(tier: SponsorTier): string {
  return `sponsor_${tier}`;
}
