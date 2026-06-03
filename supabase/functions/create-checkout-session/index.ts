// create-checkout-session — starts a Stripe hosted Checkout for a book (one-time)
// or a sponsor tier (subscription). The client sends a `lookupKey` only; the price
// is resolved server-side so the browser can never name an arbitrary price/amount.
//
// Test↔live is a config swap: the same lookup keys resolve to the live prices once
// STRIPE_SECRET_KEY is the live restricted key. Never sets `payment_method_types`
// (dynamic payment methods stay on). See STRIPE-HANDOFF.md §2, §4.

import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import {
  getCatalogItem,
  isAllowedLookupKey,
  STRIPE_API_VERSION,
} from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

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
    const item = getCatalogItem(lookupKey)!;

    // Resolve the price by lookup key (never trust a client-supplied price/amount).
    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
    });
    const price = prices.data[0];
    if (!price) {
      console.error("No active price for lookup key:", lookupKey);
      return jsonResponse({ error: "This item isn't available right now." }, corsHeaders, 409);
    }

    const isSponsor = item.kind === "sponsor";
    const metadata: Record<string, string> = {
      lookup_key: lookupKey,
      kind: item.kind,
    };
    if (item.tier) metadata.tier = item.tier;
    Object.assign(metadata, attribution);
    // roadmap_item = the single/primary item (the deployed C3 webhook persists this
    // to purchases/sponsors). roadmap_items = the full comma-joined selection when
    // a sponsorship is started from the roadmap multi-select (a priority signal,
    // visible on the Stripe subscription). Stripe caps a metadata value at 500 chars.
    const primaryItem = itemId ? String(itemId) : itemIds[0];
    if (primaryItem) metadata.roadmap_item = primaryItem;
    if (itemIds.length) metadata.roadmap_items = itemIds.join(",").slice(0, 480);

    const session = await stripe.checkout.sessions.create({
      mode: item.mode, // 'payment' for books, 'subscription' for sponsors
      line_items: [{ price: price.id, quantity: 1 }],
      // NOTE: never set payment_method_types — dynamic payment methods stay on.
      success_url: `${SITE_URL}${isSponsor ? "/sponsor/thanks/" : "/thanks/"}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}${isSponsor ? "/sponsor/" : "/books/"}`,
      // Show the promo-code box on book checkouts so the per-channel code
      // (e.g. DGX-GOOGLE) works — the zero-engineering attribution backstop
      // (MARKETING-HANDOFF.md Task 5). The coupon is product-restricted, so
      // sponsorships keep a clean, code-free checkout.
      ...(isSponsor ? {} : { allow_promotion_codes: true }),
      metadata,
      // Mirror the tier/item onto the subscription so C3's lifecycle webhooks
      // (invoice.paid, customer.subscription.updated/deleted) can read it too.
      ...(isSponsor ? { subscription_data: { metadata } } : {}),
    });

    return jsonResponse({ url: session.url }, corsHeaders);
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return jsonResponse({ error: "Could not start checkout. Please try again." }, corsHeaders, 500);
  }
});
