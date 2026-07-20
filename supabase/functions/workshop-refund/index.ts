import Stripe from "https://esm.sh/stripe@18.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { STRIPE_API_VERSION } from "../_shared/catalog.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { hashWorkshopToken } from "../_shared/workshop-token.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: STRIPE_API_VERSION as Stripe.StripeConfig["apiVersion"],
  httpClient: Stripe.createFetchHttpClient(),
  appInfo: { name: "orionfold-website", url: "https://orionfold.com" },
});

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, cors, 405);
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.token !== "string") return jsonResponse({ ok: false, state: "invalid" }, cors, 404);
    const tokenHash = await hashWorkshopToken(body.token);
    const db = admin();
    const tokenResult = await db.from("workshop_tokens")
      .select("id,entitlement_id,refund_request_id,state,expires_at")
      .eq("token_sha256", tokenHash).eq("purpose", "refund").maybeSingle();
    const token = tokenResult.data;
    if (!token || token.state === "revoked" || new Date(token.expires_at).getTime() <= Date.now()) {
      return jsonResponse({ ok: false, state: "invalid" }, cors, 404);
    }
    const requestResult = await db.from("workshop_refund_requests")
      .select("id,status,idempotency_key,stripe_refund_id")
      .eq("id", token.refund_request_id).maybeSingle();
    const refundRequest = requestResult.data;
    if (!refundRequest) return jsonResponse({ ok: false, state: "invalid" }, cors, 404);
    if (["succeeded", "failed", "canceled", "late_review"].includes(refundRequest.status) ||
      (refundRequest.status === "pending" && refundRequest.stripe_refund_id)) {
      return jsonResponse({ ok: true, state: refundRequest.status }, cors, refundRequest.status === "succeeded" ? 200 : 202);
    }
    const entitlementResult = await db.from("workshop_entitlements")
      .select("id,state,stripe_payment_intent_id,refund_deadline")
      .eq("id", token.entitlement_id).maybeSingle();
    const entitlement = entitlementResult.data;
    if (!entitlement?.stripe_payment_intent_id) throw new Error("refund payment reference unavailable");
    const now = new Date();
    if (new Date(entitlement.refund_deadline).getTime() < now.getTime()) {
      await db.from("workshop_refund_requests").update({ status: "late_review", confirmed_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", refundRequest.id);
      await db.from("workshop_tokens").update({ state: "used", used_at: now.toISOString() }).eq("id", token.id);
      return jsonResponse({ ok: true, state: "late_review" }, cors, 202);
    }
    await Promise.all([
      db.from("workshop_refund_requests").update({ status: "pending", confirmed_at: now.toISOString(), attempted_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", refundRequest.id),
      db.from("workshop_entitlements").update({ state: "refund_pending", refund_requested_at: now.toISOString(), refund_status: "pending", updated_at: now.toISOString() }).eq("id", entitlement.id),
      db.from("workshop_tokens").update({ state: "used", used_at: now.toISOString() }).eq("id", token.id),
    ]);
    const refund = await stripe.refunds.create({
      payment_intent: entitlement.stripe_payment_intent_id,
      reason: "requested_by_customer",
      metadata: { workshop_entitlement_id: entitlement.id },
    }, { idempotencyKey: refundRequest.idempotency_key });
    await Promise.all([
      db.from("workshop_refund_requests").update({ stripe_refund_id: refund.id, updated_at: new Date().toISOString() }).eq("id", refundRequest.id),
      db.from("workshop_entitlements").update({ stripe_refund_id: refund.id, updated_at: new Date().toISOString() }).eq("id", entitlement.id),
    ]);
    return jsonResponse({ ok: true, state: "pending" }, cors, 202);
  } catch (error) {
    console.error("workshop-refund failed", error instanceof Error ? error.message : "unknown");
    return jsonResponse({ ok: false, state: "retryable", error: "The refund request could not be submitted yet." }, cors, 503);
  }
});
