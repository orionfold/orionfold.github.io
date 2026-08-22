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

export type OfferingKind = "book" | "sponsor" | "license" | "workshop";
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

/**
 * Orionfold Flow — the first SUBSCRIPTION product (goal 0127). Operator terms,
 * set at the 2026-08-17 grooming and confirmed 2026-08-21:
 *   $10 per user per month · 20% off paid annually up front ·
 *   one license = one person, unlimited personal Macs.
 *
 * THE FREE GRANT IS DELIBERATELY NOT REPRESENTED HERE, and that is the whole
 * reason a change to it does not reach this file. The app owns the grant and
 * enforces it offline; Stripe is never told about it (no `trial_period_days` —
 * a Stripe trial would hand the user a SECOND unbilled window the app cannot
 * even see, since it has no visibility of `trialing`). So the server half
 * encodes only what the customer is CHARGED.
 *
 * That separation earned its keep on 2026-08-22, when the grant changed shape
 * twice inside an hour — 30 calendar days → 30 Pro Days → 10 Pro Days — and
 * nothing in the checkout, webhook, term math or licence endpoints had to move.
 * A `FLOW_TRIAL_DAYS = 30` constant used to sit here mirroring the app's
 * `TrialTerm.days`; it had no consumers and was REMOVED rather than updated,
 * because a number here can only ever drift from the app that actually
 * enforces it. If a page needs to state the grant, source it from the product
 * brief at that moment — not from a copy kept in the commerce layer.
 *
 * A NOTE FOR COPY, because the unit is the trap: a Pro Day is spent only on a
 * day the person actually uses AI, so ten Pro Days is NOT ten days. And it is
 * not "credits" — Flow is BYOK, so an AI action costs Orionfold nothing and
 * there is no marginal cost to meter.
 *
 * THE ANNUAL PRICE IS DERIVED, never written as a second literal. The growth
 * contract calls this out by name: two literals can silently disagree, and the
 * one the customer is charged is whichever Stripe holds. One monthly price and
 * one discount rate is the only representation that cannot drift.
 *
 * These `amount` values are DISPLAY ONLY, like every other catalog amount —
 * Stripe remains the source of truth and checkout resolves by lookup_key.
 */
export const FLOW_MONTHLY_AMOUNT = 1000;
export const FLOW_ANNUAL_DISCOUNT = 0.2;
export const FLOW_ANNUAL_AMOUNT = Math.round(
  FLOW_MONTHLY_AMOUNT * 12 * (1 - FLOW_ANNUAL_DISCOUNT),
);

export const RELAY_HOST_LOOKUP_KEY = "license_relay_host_annual";
export const RELAY_HOST_AMOUNT = 149900;
export const RELAY_HOSTS = 1;
export const RELAY_HOST_MANAGED_CELLS = 10;
export const RELAY_HOST_SKU = "relay-host-10-annual";

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
  // Orionfold Relay — the third licensed product (the npm agent/workflow
  // operating-layer engine: `npm i -g orionfold-relay` / `npx orionfold-relay`,
  // then `relay`; the former open `ainative-business` engine, renamed). Engine
  // stays free + open (Apache-2.0); a license unlocks premium packs, which the
  // Relay CLI gates on `owns_product()` at `relay pack add <premium-pack>
  // --license-url='<signed-url>'`. Same THREE-SKU family + 12-month kept-proven
  // window as Arena/Proof, resolved by lookup_key at runtime. The license a Relay
  // purchase issues carries `product:orionfold-relay` (no pack id, so adding packs
  // later needs no re-issue) — see licenseProductForLookupKey + stripe-webhook
  // fulfillLicense. (Relay ask orionfold-relay 2026-06-30.)
  // Flow's two subscription SKUs. No founding cohort and no separate renewal
  // SKU: Stripe renews the subscription and each paid invoice extends the term.
  // Both are `mode: "subscription"`, which create-checkout-session already
  // supports (sponsor tiers use it).
  license_orionfold_flow_monthly: {
    lookupKey: "license_orionfold_flow_monthly",
    kind: "license",
    mode: "subscription",
    label: "Orionfold Flow (monthly)",
    amount: FLOW_MONTHLY_AMOUNT,
  },
  license_orionfold_flow_annual: {
    lookupKey: "license_orionfold_flow_annual",
    kind: "license",
    mode: "subscription",
    label: "Orionfold Flow (annual, 20% off)",
    amount: FLOW_ANNUAL_AMOUNT,
  },
  license_orionfold_relay: {
    lookupKey: "license_orionfold_relay",
    kind: "license",
    mode: "payment",
    label: "Orionfold Relay",
    amount: 49900,
  },
  license_orionfold_relay_founding: {
    lookupKey: "license_orionfold_relay_founding",
    kind: "license",
    mode: "payment",
    label: "Orionfold Relay (Founding)",
    amount: 34900,
  },
  license_orionfold_relay_renewal: {
    lookupKey: "license_orionfold_relay_renewal",
    kind: "license",
    mode: "subscription",
    label: "Orionfold Relay kept-proven renewal",
    amount: 14900,
  },
  [RELAY_HOST_LOOKUP_KEY]: {
    lookupKey: RELAY_HOST_LOOKUP_KEY,
    kind: "license",
    mode: "subscription",
    label: "Orionfold Relay Host",
    amount: RELAY_HOST_AMOUNT,
  },
  workshop_relay_operator_founding: {
    lookupKey: "workshop_relay_operator_founding",
    kind: "workshop",
    mode: "payment",
    label: "Relay Operator Workshop — Founding Edition",
    amount: 9900,
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
export const WORKSHOP_LOOKUP_KEYS = LOOKUP_KEYS.filter((k) => CATALOG[k].kind === "workshop");

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
/**
 * How a family is SOLD. Added 2026-08-22 for Flow, whose monthly/annual
 * subscription does not fit the perpetual shape the first three families share.
 *
 *  - "perpetual": buy once, own it, with a kept-proven window and a separate
 *    annual renewal SKU. Arena, Proof and Relay. Three SKUs, a founding cohort.
 *  - "subscription": pay monthly or annually for as long as you use it. Flow.
 *    Two SKUs, no founding cohort, no separate renewal (Stripe renews the
 *    subscription itself and each `invoice.paid` extends the term).
 *
 * The discriminant exists so nothing has to infer intent from which fields
 * happen to be filled in.
 */
export type LicenseTerm = "perpetual" | "subscription";

export interface LicenseFamily {
  /** Stable product id baked into the signed license payload (`product` claim). */
  product: string;
  /** How the family is sold. Absent means "perpetual" (the original three). */
  term?: LicenseTerm;
  /**
   * Perpetual families only. A subscription family leaves all three unset:
   * there is no founding cohort to cap and no separate renewal SKU to sell,
   * so `licenseFamilyForLookupKey` matches on `monthly`/`annual` instead.
   */
  founding?: string;
  standard?: string;
  renewal?: string;
  foundingSeats?: number;
  /** Subscription families only. */
  monthly?: string;
  annual?: string;
  /**
   * Subscription families only: months of access one paid invoice grants.
   * `expires_at` is extended by this on every `invoice.paid`, so a lapsed
   * subscription stops extending and the license expires on its own.
   */
  periodMonths?: { monthly: number; annual: number };
}

/**
 * Seat bounds for a multi-seat purchase (option (a), operator 2026-08-22).
 *
 * A buyer may purchase N seats in one transaction; distribution is theirs. The
 * ceiling exists to stop a fat-fingered quantity becoming a five-figure charge,
 * not because anything breaks above it — a genuine larger order is a
 * conversation with the operator, which is the right outcome at that size.
 */
export const MIN_SEATS = 1;
export const MAX_SEATS = 50;

/**
 * Coerce a client-supplied seat count into the allowed range.
 *
 * The client is NEVER trusted: this runs server-side before the Checkout
 * Session is created, and Stripe multiplies the per-unit price by whatever
 * survives. Anything unparseable, fractional, or out of range collapses to a
 * safe value rather than erroring, because a buyer who mistypes a quantity
 * should meet a working checkout, not a stack trace.
 */
export function clampSeats(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  // NaN (junk input) is the only truly unusable value and means "one".
  // Infinity is NOT junk — it is an out-of-range number, so it clamps to the
  // ceiling like 9999 does rather than collapsing to the floor. Testing
  // isFinite first would silently turn "absurdly many" into "one", which is
  // the opposite of what the buyer asked for.
  if (Number.isNaN(n)) return MIN_SEATS;
  if (n === Infinity) return MAX_SEATS;
  if (n === -Infinity) return MIN_SEATS;
  return Math.min(MAX_SEATS, Math.max(MIN_SEATS, Math.floor(n)));
}

/**
 * Whether a lookup key may be bought in multiples.
 *
 * Only subscription licences are seat-shaped today. A book is a file, a sponsor
 * tier is a single relationship, and a perpetual licence carries a founding cap
 * whose count-boxed arithmetic assumes one row per sale — passing a quantity
 * there would silently undercount the cohort.
 */
export function supportsMultipleSeats(lookupKey: string): boolean {
  const family = licenseFamilyForLookupKey(lookupKey);
  return Boolean(family && isSubscriptionFamily(family));
}

/** True when a family is sold as a subscription rather than bought outright. */
export function isSubscriptionFamily(family: LicenseFamily): boolean {
  return family.term === "subscription";
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
  // Flow: the first subscription family. Two SKUs, no founding cohort, no
  // separate renewal. `periodMonths` is what each paid invoice extends
  // `expires_at` by, so a canceled subscription simply stops extending and the
  // license lapses on its own rather than needing a revocation.
  "orionfold-flow": {
    product: "orionfold-flow",
    term: "subscription",
    monthly: "license_orionfold_flow_monthly",
    annual: "license_orionfold_flow_annual",
    periodMonths: { monthly: 1, annual: 12 },
  },
  "orionfold-relay": {
    product: "orionfold-relay",
    founding: "license_orionfold_relay_founding",
    standard: "license_orionfold_relay",
    renewal: "license_orionfold_relay_renewal",
    foundingSeats: FOUNDING_SEATS,
  },
};

/** Resolve the license family that owns a lookup key (any of its 3 SKUs), or undefined. */
export function licenseFamilyForLookupKey(lookupKey: string): LicenseFamily | undefined {
  return Object.values(LICENSE_FAMILIES).find(
    (f) =>
      f.founding === lookupKey ||
      f.standard === lookupKey ||
      f.renewal === lookupKey ||
      // Subscription families (Flow) carry monthly/annual instead.
      f.monthly === lookupKey ||
      f.annual === lookupKey,
  );
}

/**
 * Months of access one paid invoice grants, for a subscription family's SKU.
 * The webhook extends `expires_at` by this on `invoice.paid`. Returns
 * undefined for a perpetual family, whose term is KEPT_PROVEN_MONTHS instead.
 */
export function subscriptionPeriodMonths(lookupKey: string): number | undefined {
  const family = licenseFamilyForLookupKey(lookupKey);
  if (!family || !isSubscriptionFamily(family) || !family.periodMonths) return undefined;
  if (lookupKey === family.monthly) return family.periodMonths.monthly;
  if (lookupKey === family.annual) return family.periodMonths.annual;
  return undefined;
}

/**
 * The standard price a founding key falls back to once the cohort is full. Returns
 * the input key unchanged for any non-founding key (so a plain standard/renewal/
 * non-license key passes straight through). Used by create-checkout-session's
 * count-boxed cap; works for every license family.
 */
export function foundingFallback(lookupKey: string): string {
  const family = licenseFamilyForLookupKey(lookupKey);
  // A subscription family has no founding cohort, so there is nothing to fall
  // back to and the key passes straight through.
  if (!family || isSubscriptionFamily(family)) return lookupKey;
  return lookupKey === family.founding && family.standard ? family.standard : lookupKey;
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
  relayHost?: {
    offer: "host";
    sku: string;
    limits: { hosts: number; managed_cells: number };
  };
}

export function licenseProductForLookupKey(
  lookupKey: string,
): LicenseProductDescriptor | null {
  if (lookupKey === RELAY_HOST_LOOKUP_KEY) {
    return {
      product: "orionfold-relay-host",
      tier: "host",
      entitlements: ["product:relay-host"],
      relayHost: {
        offer: "host",
        sku: RELAY_HOST_SKU,
        limits: { hosts: RELAY_HOSTS, managed_cells: RELAY_HOST_MANAGED_CELLS },
      },
    };
  }
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
    case "orionfold-flow":
      return {
        product: "orionfold-flow",
        tier: "subscription",
        // The entitlement string the APP compiles in as
        // `LicenseVerifier.requiredEntitlement`. One signing key covers the
        // whole constellation, so this string is the only thing separating
        // products: a Flow license missing it is refused by a correctly
        // working app. Verified against orionfold-flow, 2026-08-21.
        entitlements: ["product:orionfold-flow"],
      };
    case "orionfold-proof":
      return {
        product: "orionfold-proof",
        tier: "proof",
        // The single entitlement the Proof CLI gates on (owns_product()).
        entitlements: ["product:orionfold-proof"],
        // No edition for Proof — omitted from the signed payload.
      };
    case "orionfold-relay":
      return {
        product: "orionfold-relay",
        tier: "relay",
        // The single entitlement the Relay CLI gates on (owns_product()) at
        // `relay pack add`. No pack id here — adding premium packs later needs
        // no license re-issue.
        entitlements: ["product:orionfold-relay"],
        // No edition for Relay — omitted from the signed payload.
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
