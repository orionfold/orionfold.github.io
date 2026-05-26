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
    const itemId = body.itemId ?? body.item_id; // optional roadmap item the buy started from

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
    if (itemId) metadata.roadmap_item = String(itemId);

    const session = await stripe.checkout.sessions.create({
      mode: item.mode, // 'payment' for books, 'subscription' for sponsors
      line_items: [{ price: price.id, quantity: 1 }],
      // NOTE: never set payment_method_types — dynamic payment methods stay on.
      success_url: `${SITE_URL}${isSponsor ? "/sponsor/thanks/" : "/thanks/"}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}${isSponsor ? "/sponsor/" : "/books/"}`,
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
