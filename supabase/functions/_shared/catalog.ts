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

export type OfferingKind = "book" | "sponsor" | "license";
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
  book_ai_native_platform: {
    lookupKey: "book_ai_native_platform",
    kind: "book",
    mode: "payment",
    label: "AI Native Platform",
    amount: 4000,
  },
  // Founding-reader bundle — the offer-ladder tripwire (the paid first dollar after
  // the free become-ai-native-business magnet). One SKU delivering ALL THREE books'
  // PDF+EPUB: AI Native Business ($20) + AI Native Platform ($40) + AI Research on
  // NVIDIA DGX Spark ($50) = $110 list, half off at $55. A plain book (one-time);
  // fulfillment reuses fulfillBook → signBookFiles lists book-files/book_bundle_founding/
  // and signs every PDF/EPUB it finds (all 6), so no webhook change. Offered ONLY in
  // the post-conversion welcome flow (the magnet thanks page + a later welcome email),
  // never browsable — that placement IS the new-subscriber scoping. "Founding" is a
  // copy frame, not a server cap (the founding-cap logic is license-family-only).
  book_bundle_founding: {
    lookupKey: "book_bundle_founding",
    kind: "book",
    mode: "payment",
    label: "Founding Reader Bundle (all three books)",
    amount: 5500,
  },
  // Arena Field Edition — the first net-new commercial product (the paid edition
  // of the free, open Orionfold Arena). "Free and open: the machine. Paid: the
  // evidence." A per-box, offline-tolerant key-file license for NVIDIA DGX Spark;
  // the buyer gets the proven state of the box plus a 12-month kept-proven update
  // window. THREE SKUs share the family, all resolved by lookup_key at runtime:
  //   - primary  $499 one-time (includes the 12-month window)
  //   - founding  $349 one-time, first 25 licenses only (count-boxed, not dated —
  //     the operator retires this price in Stripe once 25 have sold)
  //   - renewal   $149/yr, starts AFTER the 12-month window (no buyer is in renewal
  //     at launch; surfaced later, not a launch-day primary button)
  // Fulfillment is a third `kind` ("license") — see stripe-webhook fulfillLicense.
  license_arena_field_edition: {
    lookupKey: "license_arena_field_edition",
    kind: "license",
    mode: "payment",
    label: "Arena Field Edition for DGX Spark",
    amount: 49900,
  },
  license_arena_field_edition_founding: {
    lookupKey: "license_arena_field_edition_founding",
    kind: "license",
    mode: "payment",
    label: "Arena Field Edition for DGX Spark (Founding)",
    amount: 34900,
  },
  license_arena_field_edition_renewal: {
    lookupKey: "license_arena_field_edition_renewal",
    kind: "license",
    mode: "subscription",
    label: "Arena Field Edition kept-proven renewal",
    amount: 14900,
  },
  // Orionfold Proof — the second licensed product (the local-first Proof Receipt
  // tool: `uv tool install orionfold-proof`, `orionfold up` → a cockpit at
  // localhost:8787 that proves which AI model/setup is worth trusting and emits a
  // signed, rerunnable receipt). Same THREE-SKU family + 12-month kept-proven
  // window as Arena, resolved by lookup_key at runtime. The license a Proof
  // purchase issues carries `product:orionfold-proof` (not an Arena entitlement);
  // owning the product unlocks any included pack on the CLI side — see
  // licenseProductForLookupKey + stripe-webhook fulfillLicense. (Relay ask
  // orionfold-proof 2026-06-24.)
  license_orionfold_proof: {
    lookupKey: "license_orionfold_proof",
    kind: "license",
    mode: "payment",
    label: "Orionfold Proof",
    amount: 49900,
  },
  license_orionfold_proof_founding: {
    lookupKey: "license_orionfold_proof_founding",
    kind: "license",
    mode: "payment",
    label: "Orionfold Proof (Founding)",
    amount: 34900,
  },
  license_orionfold_proof_renewal: {
    lookupKey: "license_orionfold_proof_renewal",
    kind: "license",
    mode: "subscription",
    label: "Orionfold Proof kept-proven renewal",
    amount: 14900,
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
export const LICENSE_LOOKUP_KEYS = LOOKUP_KEYS.filter((k) => CATALOG[k].kind === "license");

/** Sponsor tiers cheapest → priciest (display order). */
export const SPONSOR_TIERS: SponsorTier[] = ["bronze", "silver", "gold", "platinum"];

/**
 * Founding cohort size — the founding price ($349) is honored for the first
 * this-many licenses of a family, then buyers pay the standard ($499). The cap is
 * enforced server-side in create-checkout-session (it counts completed founding
 * `purchases` and falls the 26th+ founding request back to that family's standard
 * price), so it never oversells even though the Stripe founding price stays
 * active. The frontend reads this same constant for the "first N" copy. Both
 * licensed products (Arena + Proof) share the same 25-seat founding cohort.
 */
export const FOUNDING_SEATS = 25;

/**
 * Licensed-product families. Each licensed product ships the same three-SKU shape
 * (a count-boxed founding price, a standard one-time price, an annual kept-proven
 * renewal). Keying the SKUs by family — instead of single Arena-literal constants
 * — lets the founding-cap fallback (create-checkout-session resolveFoundingKey)
 * and the frontend price box (commerce.ts) work for every licensed product
 * without per-product branching. Add a family here and the cap "just works".
 */
export interface LicenseFamily {
  /** Stable product id baked into the signed license payload (`product` claim). */
  product: string;
  founding: string;
  standard: string;
  renewal: string;
  foundingSeats: number;
}

export const LICENSE_FAMILIES: Record<string, LicenseFamily> = {
  "arena-field-edition": {
    product: "arena-field-edition",
    founding: "license_arena_field_edition_founding",
    standard: "license_arena_field_edition",
    renewal: "license_arena_field_edition_renewal",
    foundingSeats: FOUNDING_SEATS,
  },
  "orionfold-proof": {
    product: "orionfold-proof",
    founding: "license_orionfold_proof_founding",
    standard: "license_orionfold_proof",
    renewal: "license_orionfold_proof_renewal",
    foundingSeats: FOUNDING_SEATS,
  },
};

/** Resolve the license family that owns a lookup key (any of its 3 SKUs), or undefined. */
export function licenseFamilyForLookupKey(lookupKey: string): LicenseFamily | undefined {
  return Object.values(LICENSE_FAMILIES).find(
    (f) => f.founding === lookupKey || f.standard === lookupKey || f.renewal === lookupKey,
  );
}

/**
 * The standard price a founding key falls back to once the cohort is full. Returns
 * the input key unchanged for any non-founding key (so a plain standard/renewal/
 * non-license key passes straight through). Used by create-checkout-session's
 * count-boxed cap; works for every license family.
 */
export function foundingFallback(lookupKey: string): string {
  const family = licenseFamilyForLookupKey(lookupKey);
  return family && lookupKey === family.founding ? family.standard : lookupKey;
}

/** Backward-compatible Arena aliases (older imports / copy). Prefer LICENSE_FAMILIES. */
export const FOUNDING_LOOKUP_KEY = LICENSE_FAMILIES["arena-field-edition"].founding;
export const STANDARD_LICENSE_LOOKUP_KEY = LICENSE_FAMILIES["arena-field-edition"].standard;
export const RENEWAL_LICENSE_LOOKUP_KEY = LICENSE_FAMILIES["arena-field-edition"].renewal;

/**
 * The kept-proven window every Arena Field Edition license grants, in calendar
 * months. The license payload's `expires_at` is `issued_at + KEPT_PROVEN_MONTHS`;
 * Spark's `load_license()` enforces it offline (the AC-7 term check).
 */
export const KEPT_PROVEN_MONTHS = 12;

/**
 * The `edition` claim baked into the signed `orionfold.license/v1` payload. This
 * is a SOFT known-set on Spark's side (the verifier warns, never rejects, on an
 * unknown value), so it stays a small closed union the issuer guarantees.
 */
export type LicenseEdition = "founding-25" | "standard";

/**
 * Map a license `lookup_key` → the `edition` claim. The founding SKU is the only
 * one that carries the "founding-25" badge; the standard SKU and the renewal SKU
 * both grant a plain "standard" kept-proven window (the renewal nature is recorded
 * in the entitlement row's `stripe_price_id` / subscription, not in the edition).
 * The webhook resolves the edition off the EFFECTIVE key Stripe charged (the
 * founding-cap fallback already rewrote founding→standard before checkout), so a
 * 26th "founding" buyer who paid the standard price correctly gets edition
 * "standard". Returns null for any non-license key.
 */
export function editionForLookupKey(lookupKey: string): LicenseEdition | null {
  switch (lookupKey) {
    case FOUNDING_LOOKUP_KEY:
      return "founding-25";
    case STANDARD_LICENSE_LOOKUP_KEY:
    case RENEWAL_LICENSE_LOOKUP_KEY:
      return "standard";
    default:
      return null;
  }
}

/**
 * The product-specific values baked into the signed `orionfold.license/v1` payload
 * for a given license SKU. This is the one place the issuer learns "what product
 * does this lookup key sell, and what does its license entitle?" — so the
 * stripe-webhook fulfillment stays a single path across every licensed product
 * (add a family + a branch here, not a new fulfillLicense). The crypto/delivery
 * spine (license.ts, upload, signed-URL, email) is product-agnostic.
 *
 * - `product`   → the `product` claim (e.g. "orionfold-proof").
 * - `tier`      → the `tier` claim (cosmetic on the CLI side; descriptive).
 * - `entitlements` → the WHOLE gate. Proof's `product:orionfold-proof` is what the
 *   Proof CLI's `owns_product()` checks to unlock any included pack. Arena's two
 *   entitlements gate its proven-matrix images + signed update channel.
 * - `edition`   → Arena's founding-25/standard badge (soft known-set). Proof has
 *   no edition concept, so it is omitted from the payload entirely (the verifier
 *   ignores absent optional fields).
 */
export interface LicenseProductDescriptor {
  product: string;
  tier: string;
  entitlements: string[];
  edition?: LicenseEdition;
}

export function licenseProductForLookupKey(
  lookupKey: string,
): LicenseProductDescriptor | null {
  const family = licenseFamilyForLookupKey(lookupKey);
  if (!family) return null;

  switch (family.product) {
    case "arena-field-edition":
      return {
        product: "arena-field-edition",
        tier: "field-edition",
        entitlements: ["proven-matrix-images", "signed-update-channel"],
        // Arena carries the founding-25/standard edition badge.
        edition: editionForLookupKey(lookupKey) ?? "standard",
      };
    case "orionfold-proof":
      return {
        product: "orionfold-proof",
        tier: "proof",
        // The single entitlement the Proof CLI gates on (owns_product()).
        entitlements: ["product:orionfold-proof"],
        // No edition for Proof — omitted from the signed payload.
      };
    default:
      return null;
  }
}

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
