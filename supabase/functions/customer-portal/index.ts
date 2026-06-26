// customer-portal — lets sponsors self-serve their subscription (update card,
// change tier, cancel) via Stripe's hosted Billing Portal. Two ways in, both
// secure without us building auth:
//
//   { sessionId }  just-paid sponsors land on /sponsor/thanks with the Checkout
//                  session id → we read the customer off it → make a portal
//                  session → return its URL for an immediate redirect.
//   { email }      returning sponsors enter their email on /sponsor → we find
//                  the Stripe customer → make a portal session → EMAIL the link
//                  (so only the inbox owner can open it). We always reply with
//                  the same generic message so the form can't be used to probe
//                  whether an email is a customer.
//
// Auth is the session id (proof of a just-completed checkout) or inbox ownership
// (the link is emailed, never returned) — so verify_jwt = false (see config.toml).
// Reuses _shared/cors.ts. Never sets payment_method_types. See STRIPE-HANDOFF.md §6.

import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { STRIPE_API_VERSION } from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://orionfold.com").replace(/\/$/, "");
const RETURN_URL = `${SITE_URL}/sponsor/`;

/** A Stripe field may be a bare id string or an expanded object; get the id. */
function customerId(ref: unknown): string | null {
  if (typeof ref === "string") return ref;
  if (ref && typeof ref === "object" && "id" in ref) return String((ref as { id: unknown }).id);
  return null;
}

async function portalUrlForCustomer(customer: string): Promise<string> {
  const portal = await stripe.billingPortal.sessions.create({
    customer,
    return_url: RETURN_URL,
  });
  return portal.url;
}

async function emailPortalLink(email: string, url: string): Promise<void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orionfold <manav@updates.orionfold.com>",
      reply_to: "manav@orionfold.com",
      to: [email],
      subject: "Manage your Orionfold sponsorship",
      text: `Here is your secure link to manage your Orionfold sponsorship.

You can update your card, change your tier, or cancel anytime:

${url}

This link is for you only, so please do not share it. It works
for a short while. If you did not ask for this, you can ignore
this email.

--
Orionfold
https://orionfold.com
`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    throw new Error(`Resend API error: ${res.status}`);
  }
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
    const sessionId = body.sessionId ?? body.session_id;
    const email = typeof body.email === "string" ? body.email.trim() : "";

    // Path 1 — just-paid sponsor: the Checkout session id proves the checkout,
    // so we can safely return the portal URL for an immediate redirect.
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(String(sessionId));
      const customer = customerId(session.customer);
      if (!customer) {
        return jsonResponse({ error: "No subscription found for this session." }, corsHeaders, 404);
      }
      const url = await portalUrlForCustomer(customer);
      return jsonResponse({ url }, corsHeaders);
    }

    // Path 2 — returning sponsor by email: NEVER return the URL (that would let
    // anyone open someone else's portal). Email it, and reply generically so the
    // form can't reveal whether an address is a customer.
    if (email && /.+@.+\..+/.test(email)) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      const customer = customers.data[0];
      if (customer) {
        const url = await portalUrlForCustomer(customer.id);
        await emailPortalLink(email, url);
      }
      return jsonResponse(
        { ok: true, message: "If that email has a sponsorship, we just sent a link to manage it." },
        corsHeaders,
      );
    }

    return jsonResponse({ error: "Provide a session id or an email." }, corsHeaders, 400);
  } catch (err) {
    console.error("customer-portal error:", err);
    return jsonResponse({ error: "Could not open the portal. Please try again." }, corsHeaders, 500);
  }
});
