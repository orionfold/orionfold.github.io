// flow-checkout — start a Flow Pro subscription from inside the Mac app.
//
// WHY THIS EXISTS. Until now Flow had no purchase path at all: `LicenseService`
// could open a billing portal and refresh a licence, and neither can start a
// checkout. The product lane then shipped ISSUES #181, which routes five
// Pro-only screens and the AI refusal banner to a "See plans" button, and that
// button arrived at a Billing screen with nothing to buy. They filed it as a
// blocking dependency on this lane (contract 2026-08-22 10:50) rather than
// quietly removing the button, which was the right call.
//
// AUTH: NONE, DELIBERATELY. The caller is by definition an unlicensed Base user,
// so there is no licence to sign with and no account to authenticate. That makes
// `verify_jwt = false` in config.toml AND `--no-verify-jwt` on deploy mandatory,
// or every caller would additionally need a platform apikey the signed app does
// not carry. (The `supabase-edge-fn-verify-jwt-footgun` memory; it bites only on
// live deploy, which is exactly when it is most expensive.)
//
// This being unauthenticated is safe because the endpoint MINTS NOTHING OF VALUE.
// It returns a Stripe Checkout URL, which is public by nature, and a claim that
// is worthless until someone completes a payment. There is no enumeration
// surface: no licence, customer or email is read, and the only input is a plan
// name from a two-item allowlist.
//
// CONTRACT (published to the product lane at 2026-08-22 11:00 before being
// built, so it is fixed — they are baking `LicenseEndpoints.checkout` against
// it):
//   POST { "plan": "monthly" | "annual" }   no licence, no auth header
//   200  { url, session_id }                 open `url`, then poll with `session_id`
//   403                                      refused (unknown plan)
//   default                                  badResponse
//   NO 404 — `noCustomer` is meaningless here and must not be sent.
//
// `session_id` is the addition to their spec, and it is the floor of the licence
// handoff: the app polls `flow-license-refresh` with it until the licence row
// exists. The deep-link fast path rides on top and is described in
// `_shared/license-claim.ts`.
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CATALOG, STRIPE_API_VERSION } from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { CLAIM_TTL_SECONDS, mintClaim } from "../_shared/license-claim.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://orionfold.com").replace(/\/$/, "");

/** The only two plans, resolved to catalog lookup keys.
 *
 * An ALLOWLIST rather than a passthrough: the app sends a plan name, never a
 * lookup key or a price id. That keeps an unauthenticated endpoint from being
 * pointed at any other SKU in the catalog, which matters more here than on
 * `create-checkout-session`, where the caller is a page we render. */
const PLANS: Record<string, string> = {
  monthly: "license_orionfold_flow_monthly",
  annual: "license_orionfold_flow_annual",
};

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

/** Read the requested plan, accepting only the two we sell. */
export function planFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as Record<string, unknown>).plan;
  if (typeof raw !== "string") return null;
  const plan = raw.trim().toLowerCase();
  return plan in PLANS ? plan : null;
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
    const plan = planFromBody(body);
    if (!plan) {
      // 403 rather than 400, to reuse the refusal vocabulary the app already
      // decodes for the other two endpoints. One refusal shape, one code path.
      return jsonResponse({ error: "That plan was not accepted." }, corsHeaders, 403);
    }

    const lookupKey = PLANS[plan];
    const item = CATALOG[lookupKey];
    if (!item) {
      console.error("flow-checkout: no catalog item for", lookupKey);
      return jsonResponse({ error: "That plan was not accepted." }, corsHeaders, 403);
    }

    // Resolve the price server-side by lookup_key, never by a hardcoded id, so
    // the price the buyer is charged always comes from Stripe (catalog SSOT, C1).
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) {
      // A missing live price is an operator gap, not a caller error: the two
      // Flow SKUs did not exist in live OR sandbox as of 2026-08-22.
      console.error("flow-checkout: no active price for", lookupKey);
      return jsonResponse(
        { error: "Flow Pro is not available for purchase yet." },
        corsHeaders,
        503,
      );
    }

    // Mint the claim BEFORE the session, so the success URL can carry it. Only
    // the digest is stored; the raw value exists solely in that URL.
    const { claim, digest } = mintClaim();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      // NOTE: never set payment_method_types — dynamic payment methods stay on.
      //
      // The success page is a website page, not a deep link, and that ordering
      // is deliberate: a browser cannot be relied on to hand off to an app, so
      // the page is what always renders, and IT offers the deep link. A
      // `success_url` pointing straight at a URL scheme would strand every
      // buyer whose browser blocks the handoff.
      success_url: `${SITE_URL}/flow/welcome/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/flow/#pricing`,
      allow_promotion_codes: true,
      // The claim digest rides in metadata so the webhook can attach it to the
      // licence row it writes, without this endpoint needing to know when that
      // happens. Stripe caps a metadata value at 500 chars; a hex digest is 64.
      metadata: { lookup_key: lookupKey, flow_claim_digest: digest },
      // Mirror onto the subscription so the lifecycle webhooks (invoice.paid,
      // customer.subscription.deleted) can read the same values.
      subscription_data: { metadata: { lookup_key: lookupKey } },
    });

    // Record the claim against the session. The webhook resolves it to a licence
    // later; until then this row is the only thing that knows the two are
    // related. A failure here is NOT fatal to the purchase: the buyer can still
    // complete checkout and the polling floor still works, because that path
    // keys on the session id rather than on the claim.
    const db = supabaseAdmin();
    const recorded = await db.from("fe_license_claims").insert({
      claim_digest: digest,
      stripe_session_id: session.id,
      lookup_key: lookupKey,
      expires_at: new Date(Date.now() + CLAIM_TTL_SECONDS * 1000).toISOString(),
    });
    if (recorded.error) {
      console.error("flow-checkout: could not record claim", recorded.error);
    }

    return jsonResponse({ url: session.url, session_id: session.id }, corsHeaders);
  } catch (err) {
    console.error("flow-checkout error:", err);
    return jsonResponse({ error: "Could not start checkout. Please try again." }, corsHeaders, 500);
  }
});
