// create-checkout-session — starts a Stripe hosted Checkout for a book (one-time)
// or a sponsor tier (subscription). The client sends a `lookupKey` only; the price
// is resolved server-side so the browser can never name an arbitrary price/amount.
//
// Test↔live is a config swap: the same lookup keys resolve to the live prices once
// STRIPE_SECRET_KEY is the live restricted key. Never sets `payment_method_types`
// (dynamic payment methods stay on). See STRIPE-HANDOFF.md §2, §4.

import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  foundingFallback,
  getCatalogItem,
  isAllowedLookupKey,
  licenseFamilyForLookupKey,
  RELAY_HOST_LOOKUP_KEY,
  STRIPE_API_VERSION,
} from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  workshopCheckoutMetadata,
  workshopCheckoutRoutes,
} from "../_shared/workshop-contract.ts";
import { relayHostPriceMatches } from "../_shared/relay-host-delivery.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// Founding cap (per licensed product family — Arena + Proof both ship a count-boxed
// founding price). The founding price ($349) is honored for the first
// family.foundingSeats licenses; once that many founding sales are RECORDED (the
// stripe-webhook writes a `purchases` row per completed license sale), the next
// founding request falls back to that family's standard $499 price. This gates at
// the source — Checkout for the 26th founding buyer never opens at $349 — so we
// never oversell even though the Stripe founding price object stays active. Returns
// the lookup key the checkout should actually use.
async function resolveFoundingKey(lookupKey: string): Promise<string> {
  const family = licenseFamilyForLookupKey(lookupKey);
  // Only a family's FOUNDING key is capped; any other key passes straight through.
  if (!family || lookupKey !== family.founding) return lookupKey;
  try {
    const { count, error } = await supabaseAdmin()
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("lookup_key", family.founding);
    if (error) throw error;
    if ((count ?? 0) >= family.foundingSeats) {
      console.log(
        `Founding cap reached for ${family.product} (${count}/${family.foundingSeats}) — falling back to standard price ${family.standard}`,
      );
      return foundingFallback(lookupKey); // → family.standard
    }
    return family.founding;
  } catch (err) {
    // Fail OPEN to the advertised founding price: a transient count error must not
    // deny an early buyer the price the marketing promised. The webhook records
    // actual sales, so any rare oversell is visible and refundable by the operator.
    console.error("Founding-cap count failed; honoring founding price:", err);
    return family.founding;
  }
}

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://orionfold.com").replace(/\/$/, "");

// Allowlist of attribution params → Stripe metadata keys. `v` (cache-buster) is
// stored as `ad_v` so it reads clearly beside the utm_* keys in the dashboard.
// Stripe caps metadata values at 500 chars; we trim to 480 to stay safe.
const ATTRIBUTION_KEYS: Record<string, string> = {
  utm_source: "utm_source",
  utm_medium: "utm_medium",
  utm_campaign: "utm_campaign",
  utm_content: "utm_content",
  utm_term: "utm_term",
  gclid: "gclid",
  // Meta Ads (2026-Q2 book test): click id + the Pixel's browser cookies. The
  // stripe-webhook reads fbp/fbc back off session.metadata to send the
  // server-side CAPI Purchase (_shared/meta-capi.ts) with real match keys.
  fbclid: "fbclid",
  fbp: "fbp",
  fbc: "fbc",
  v: "ad_v",
};

// Turn a roadmap item id ("software:orionfold-advisor") into a display name
// ("Orionfold Advisor") for the Checkout page. Server-side only — we never
// render client-supplied labels on the Stripe-hosted page.
function humanizeItemId(id: string): string {
  const slug = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Where a cancelled license checkout returns the buyer: each licensed product's
// own purchase block. Proof → /proof/#get-proof, Arena → /software/arena/#field-edition.
function licenseCancelPath(lookupKey: string): string {
  if (lookupKey === RELAY_HOST_LOOKUP_KEY) return "/relay/#get-relay-host";
  const family = licenseFamilyForLookupKey(lookupKey);
  return family?.product === "orionfold-proof"
    ? "/proof/#get-proof"
    : "/software/arena/#field-edition";
}

function sanitizeAttribution(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [src, dest] of Object.entries(ATTRIBUTION_KEYS)) {
    const val = (raw as Record<string, unknown>)[src];
    if (typeof val === "string" && val) out[dest] = val.slice(0, 480);
  }
  return out;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, corsHeaders, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const lookupKey = body.lookupKey ?? body.lookup_key;
    const itemId = body.itemId ?? body.item_id; // single roadmap item (per-card buy/sponsor)
    const itemIdsRaw = body.itemIds ?? body.item_ids; // multiple (roadmap selection → sponsor)
    const itemIds = Array.isArray(itemIdsRaw)
      ? itemIdsRaw.map((x: unknown) => String(x)).filter(Boolean)
      : [];

    // Ad attribution (Task 4): the client forwards utm_* / gclid / v captured on
    // the landing page (lib/attribution.ts). Persist a sanitized, allowlisted
    // copy onto the session metadata so a purchase round-trips to the exact ad
    // initiative even if the browser pixel is incomplete.
    const attribution = sanitizeAttribution(body.attribution);

    // Server-trusted allowlist: the client can only name a known offering.
    if (!isAllowedLookupKey(lookupKey)) {
      return jsonResponse({ error: "Unknown item." }, corsHeaders, 400);
    }

    // Founding cap: a request for the founding price past the first FOUNDING_SEATS
    // sales is transparently served the standard price instead. Everything below
    // (item, price, metadata, fulfillment) uses this effective key, so the buyer's
    // `purchases` row records exactly what they were charged for.
    const effectiveKey = await resolveFoundingKey(lookupKey);
    const item = getCatalogItem(effectiveKey)!;

    // Resolve the price by lookup key (never trust a client-supplied price/amount).
    const prices = await stripe.prices.list({
      lookup_keys: [effectiveKey],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      console.error("No active price for lookup key:", effectiveKey);
      return jsonResponse({ error: "This item isn't available right now." }, corsHeaders, 409);
    }
    if (
      effectiveKey === RELAY_HOST_LOOKUP_KEY &&
      !relayHostPriceMatches(price, item.amount)
    ) {
      console.error("Relay Host price contract mismatch:", {
        lookupKey: effectiveKey,
        amount: price.unit_amount,
        currency: price.currency,
        type: price.type,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
      });
      return jsonResponse({ error: "This item isn't available right now." }, corsHeaders, 409);
    }

    const isSponsor = item.kind === "sponsor";
    const isRelayHost = effectiveKey === RELAY_HOST_LOOKUP_KEY;
    const metadata: Record<string, string> = {
      lookup_key: effectiveKey,
      kind: item.kind,
    };
    if (item.kind === "workshop") Object.assign(metadata, workshopCheckoutMetadata());
    if (item.tier) metadata.tier = item.tier;
    Object.assign(metadata, attribution);
    // roadmap_item = the single/primary item (the deployed C3 webhook persists this
    // to purchases/sponsors). roadmap_items = the full comma-joined selection when
    // a sponsorship is started from the roadmap multi-select (a priority signal,
    // visible on the Stripe subscription). Stripe caps a metadata value at 500 chars.
    const primaryItem = itemId ? String(itemId) : itemIds[0];
    if (primaryItem) metadata.roadmap_item = primaryItem;
    if (itemIds.length) metadata.roadmap_items = itemIds.join(",").slice(0, 480);

    // Sponsor checkouts started from a roadmap selection: name the picked
    // items right on the Checkout page (above the Pay button). The line-item
    // description next to the price can't vary per session (it comes from the
    // shared Product), so Checkout's custom_text carries the selection instead.
    const selectedIds = itemIds.length ? itemIds : primaryItem ? [primaryItem] : [];
    const customText =
      isSponsor && selectedIds.length
        ? {
            custom_text: {
              submit: {
                // Pure personalization — the funding mission lives in the
                // product description next to the price, so nothing repeats.
                message: `Your sponsorship prioritizes: ${
                  selectedIds.map(humanizeItemId).join(", ")
                }.`.slice(0, 1200),
              },
            },
          }
        : {};

    const hostIdentity = isRelayHost
      ? {
          custom_fields: [
            {
              key: "licensee_kind",
              label: { type: "custom" as const, custom: "License held by" },
              type: "dropdown" as const,
              dropdown: {
                options: [
                  { label: "An organization", value: "organization" },
                  { label: "An individual", value: "individual" },
                ],
              },
            },
            {
              key: "licensee_name",
              label: { type: "custom" as const, custom: "Organization or individual name" },
              type: "text" as const,
              text: { minimum_length: 2, maximum_length: 100 },
            },
          ],
        }
      : {};

    const workshopRoutes = workshopCheckoutRoutes(SITE_URL);
    const session = await stripe.checkout.sessions.create({
      mode: item.mode, // 'payment' for books, 'subscription' for sponsors
      line_items: [{ price: price.id, quantity: 1 }],
      // NOTE: never set payment_method_types — dynamic payment methods stay on.
      success_url: item.kind === "workshop"
        ? workshopRoutes.successUrl
        : `${SITE_URL}${isSponsor ? "/sponsor/thanks/" : "/thanks/"}?session_id={CHECKOUT_SESSION_ID}`,
      // Cancel returns the buyer where they started: sponsors to /sponsor/, a
      // license to its product's purchase block, books to /books/.
      cancel_url: item.kind === "workshop"
        ? workshopRoutes.cancelUrl
        : `${SITE_URL}${
          isSponsor ? "/sponsor/" : item.kind === "license" ? licenseCancelPath(effectiveKey) : "/books/"
        }`,
      // Show the promo-code box on book checkouts so the per-channel code
      // (e.g. DGX-GOOGLE) works — the zero-engineering attribution backstop
      // (MARKETING-HANDOFF.md Task 5). The coupon is product-restricted, so
      // sponsorships keep a clean, code-free checkout.
      ...(isSponsor ? {} : { allow_promotion_codes: true }),
      ...customText,
      ...hostIdentity,
      metadata,
      // Mirror the tier/item onto the subscription so C3's lifecycle webhooks
      // (invoice.paid, customer.subscription.updated/deleted) can read it too.
      ...(item.mode === "subscription" ? { subscription_data: { metadata } } : {}),
    });

    return jsonResponse({ url: session.url }, corsHeaders);
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return jsonResponse({ error: "Could not start checkout. Please try again." }, corsHeaders, 500);
  }
});
