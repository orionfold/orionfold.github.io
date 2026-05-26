// order-status — read-only confirmation for the static /thanks pages.
//
// After checkout, Stripe redirects to /thanks (book) or /sponsor/thanks (sponsor)
// with ?session_id=…. This function reads that session back from Stripe so the
// page can show a friendly, accurate confirmation ("Payment confirmed", the book
// title, the sponsor tier). It is DISPLAY ONLY — fulfillment is never trusted to
// this path; the stripe-webhook delivers the goods server-side (STRIPE-HANDOFF.md §5).
//
// No secret reaches the client; we return only a small, safe summary. Auth is the
// session id itself, so verify_jwt = false (see config.toml). Reuses _shared/cors.ts.

import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { getCatalogItem, STRIPE_API_VERSION } from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

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
    const sessionId = body.sessionId ?? body.session_id;
    if (!sessionId || typeof sessionId !== "string") {
      return jsonResponse({ error: "Missing session id." }, corsHeaders, 400);
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const lookupKey = session.metadata?.lookup_key ?? "";
    const item = getCatalogItem(lookupKey);

    // `paid` for one-time books; subscription checkouts report `no_payment_required`
    // on the session but `status: complete` once the subscription is created.
    const paid = session.payment_status === "paid" || session.status === "complete";

    return jsonResponse(
      {
        ok: true,
        paid,
        mode: session.mode, // 'payment' | 'subscription'
        kind: item?.kind ?? (session.mode === "subscription" ? "sponsor" : "book"),
        label: item?.label ?? null,
        tier: session.metadata?.tier ?? item?.tier ?? null,
        email: session.customer_details?.email ?? null,
      },
      corsHeaders,
    );
  } catch (err) {
    console.error("order-status error:", err);
    // A bad/unknown session id is a client problem, not a server fault.
    return jsonResponse({ ok: false, error: "Could not find that order." }, corsHeaders, 404);
  }
});
