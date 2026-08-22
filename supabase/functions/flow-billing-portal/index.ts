// flow-billing-portal — the Stripe Billing Portal for an Orionfold Flow
// subscriber, opened from inside the Mac app.
//
// The app's Settings ▸ Billing ▸ "Manage Plan…" button POSTs the verbatim bytes
// of the `.license.json` file it holds and opens the `url` we return. There is
// no page on orionfold.com behind that button and deliberately so: the button
// used to open `https://orionfold.com/flow/billing`, which was a 404, and the
// fix was to not build the page rather than to build it. (Contract entries
// 2026-08-22 01:05, corrected 01:03, confirmed built app-side at 01:14.)
//
// AUTH. `{ "license": "<bytes>" }`, no header. We verify OUR OWN signature over
// those bytes, read `license_id` and `issued_to.email` out of the VERIFIED
// payload, and resolve the Stripe customer ourselves. The signature is the
// credential, so `verify_jwt = false` in config.toml AND `--no-verify-jwt` on
// deploy — otherwise callers would also need a platform apikey the signed app
// does not carry. (The `supabase-edge-fn-verify-jwt-footgun` memory; it bites
// only on live deploy.) The reasoning for accepting a licence as a credential
// lives in `_shared/license-credential.ts`.
//
// CONTRACT (published before it was built, so it is fixed):
//   200 { url }  a single-use, short-lived portal URL. NEVER cache it.
//   403          bad signature, wrong product, or an unknown licence.
//   404          verified, but this holder has no Stripe customer.
//
// Deliberately NOT an extension of `customer-portal`. That function is
// sponsor-shaped throughout — it returns to `/sponsor/`, sends sponsor email
// copy, and looks sponsors up by their own table. Only `portalUrlForCustomer`'s
// three lines are shared, and duplicating three lines is cheaper than teaching
// one function two audiences.
import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { STRIPE_API_VERSION } from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { licenseFromBody, verifyLicenseCredential } from "../_shared/license-credential.ts";

const FLOW_PRODUCT = "orionfold-flow";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://orionfold.com").replace(/\/$/, "");
// Where Stripe sends the browser when the subscriber is done. `/flow/` is the
// product's own page — the app is already open behind the browser window, so
// this only needs to be a sensible place to land, not a return path.
const RETURN_URL = `${SITE_URL}/flow/`;

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

/**
 * Find the Stripe customer for a verified licence.
 *
 * By `license_id` first, because that is exact: the licence row records the
 * customer the subscription was actually created against. Email is the
 * fallback for a licence issued outside the checkout path (an operator comp via
 * `admin-issue-license` writes no Stripe ids), and it is only ever the email
 * out of the SIGNED payload — never one the caller supplied.
 */
async function customerForLicense(
  licenseId: string,
  email: string,
): Promise<string | null> {
  const db = supabaseAdmin();
  const row = await db.from("fe_entitlements")
    .select("stripe_customer_id")
    .eq("license_id", licenseId)
    .maybeSingle();
  if (row.error) throw row.error;
  if (row.data?.stripe_customer_id) return row.data.stripe_customer_id;

  const customers = await stripe.customers.list({ email, limit: 1 });
  return customers.data[0]?.id ?? null;
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
    const verified = await verifyLicenseCredential(licenseFromBody(body), FLOW_PRODUCT);
    if (!verified.ok || !verified.license) {
      // One refusal shape for every reason. Telling a caller WHICH check failed
      // would let them probe the verifier a licence at a time; the app only
      // needs to know it was refused, and the reason is logged for us.
      console.log("flow-billing-portal refused:", verified.reason);
      return jsonResponse(
        { error: "That licence was not accepted." },
        corsHeaders,
        403,
      );
    }

    const { licenseId, email } = verified.license;
    const customer = await customerForLicense(licenseId, email);
    if (!customer) {
      return jsonResponse(
        { error: "No subscription is on file for this licence." },
        corsHeaders,
        404,
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      return_url: RETURN_URL,
    });
    // Single-use and short-lived by Stripe's own design, which is why the app
    // fetches it at press time and never stores it.
    return jsonResponse({ url: portal.url }, corsHeaders);
  } catch (err) {
    console.error("flow-billing-portal error:", err);
    return jsonResponse(
      { error: "Could not open billing. Please try again." },
      corsHeaders,
      500,
    );
  }
});
