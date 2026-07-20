import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  WORKSHOP_ACCESS_TTL_SECONDS,
  WORKSHOP_OFFERING_ID,
  WORKSHOP_RATE_WINDOW_SECONDS,
  WORKSHOP_REFUND_TOKEN_TTL_SECONDS,
} from "../_shared/workshop-contract.ts";
import { sendWorkshopEmail } from "../_shared/workshop-email.ts";
import { genericRequestResponse } from "../_shared/workshop-state.ts";
import {
  deriveWorkshopToken,
  hashWorkshopToken,
  isRequestId,
  normalizeWorkshopEmail,
  requestHash,
} from "../_shared/workshop-token.ts";

const tokenSecret = Deno.env.get("WORKSHOP_TOKEN_SECRET") ?? "";
const requestSecret = Deno.env.get("WORKSHOP_REQUEST_HASH_SECRET") ?? "";
const siteUrl = (Deno.env.get("SITE_URL") ?? "https://orionfold.com").replace(/\/$/, "");
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendFrom = Deno.env.get("RESEND_FROM") ?? "Orionfold <manav@orionfold.com>";
const resendApiUrl = Deno.env.get("RESEND_API_URL") ?? "https://api.resend.com/emails";

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

function generic(cors: Record<string, string>) {
  return jsonResponse(genericRequestResponse(), cors, 202);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, cors, 405);

  try {
    if (!tokenSecret || !requestSecret) throw new Error("workshop secrets are not configured");
    const body = await req.json().catch(() => ({}));
    const kind = body.action === "refund" ? "refund" : body.action === "reaccess" ? "reaccess" : null;
    const email = normalizeWorkshopEmail(body.email);
    const requestId = body.requestId ?? body.request_id;
    if (!kind || !email || !isRequestId(requestId) || body.company) {
      return jsonResponse({ error: "Invalid request." }, cors, 400);
    }
    if (body.offeringId && body.offeringId !== WORKSHOP_OFFERING_ID) return generic(cors);

    const db = admin();
    const now = new Date();
    const window = Math.floor(now.getTime() / 1000 / WORKSHOP_RATE_WINDOW_SECONDS);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const requestDigest = await requestHash(requestSecret, "request", requestId);
    const emailWindowHash = await requestHash(requestSecret, "email", `${kind}:${email}:${window}`);
    const ipWindowHash = await requestHash(requestSecret, "ip", `${kind}:${ip}:${window}`);
    const entitlementResult = await db.from("workshop_entitlements")
      .select("id,state,access_generation,refund_deadline")
      .eq("email", email).eq("offering_id", WORKSHOP_OFFERING_ID)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    const entitlement = entitlementResult.data;

    const admission = await db.rpc("begin_workshop_request", {
      p_id: requestId,
      p_kind: kind,
      p_request_hash: requestDigest,
      p_email_window_hash: emailWindowHash,
      p_ip_window_hash: ipWindowHash,
      p_entitlement_id: entitlement?.id ?? null,
    });
    if (admission.error) throw admission.error;
    const admitted = Array.isArray(admission.data) ? admission.data[0] : admission.data;
    if (!admitted?.accepted || admitted?.duplicate || !entitlement || !["active", "refund_pending"].includes(entitlement.state)) {
      return generic(cors);
    }

    if (kind === "reaccess") {
      const expected = Number(entitlement.access_generation);
      const generation = expected + 1;
      const raw = await deriveWorkshopToken(tokenSecret, entitlement.id, "access", generation);
      const tokenHash = await hashWorkshopToken(raw);
      const expiresAt = new Date(now.getTime() + WORKSHOP_ACCESS_TTL_SECONDS * 1000);
      const rotation = await db.rpc("rotate_workshop_access", {
        p_entitlement_id: entitlement.id,
        p_expected_generation: expected,
        p_token_sha256: tokenHash,
        p_expires_at: expiresAt.toISOString(),
      });
      const applied = Array.isArray(rotation.data) ? rotation.data[0]?.applied : rotation.data?.applied;
      if (!applied) throw new Error("access rotation raced; retry with a new request id");
      await sendWorkshopEmail({
        apiKey: resendKey, apiUrl: resendApiUrl, from: resendFrom, to: email, kind: "reaccess",
        link: `${siteUrl}/training/relay-operator-workshop/access/#t=${raw}`,
        idempotencyKey: `workshop-reaccess-${requestId}-${generation}`,
      });
      await Promise.all([
        db.from("workshop_requests").update({ status: "sent", token_generation: generation, updated_at: now.toISOString() }).eq("id", requestId),
        db.from("workshop_entitlements").update({ state: entitlement.state === "refund_pending" ? "refund_pending" : "active", delivered_at: now.toISOString(), last_delivery_error_code: null, updated_at: now.toISOString() }).eq("id", entitlement.id),
      ]);
      return generic(cors);
    }

    if (new Date(entitlement.refund_deadline).getTime() < now.getTime()) {
      await db.from("workshop_refund_requests").upsert({
        entitlement_id: entitlement.id,
        idempotency_key: `workshop-refund-${entitlement.id}`,
        status: "late_review",
        safe_failure_code: "outside_refund_window",
        updated_at: now.toISOString(),
      }, { onConflict: "entitlement_id" });
      return generic(cors);
    }

    const existingRefund = await db.from("workshop_refund_requests")
      .select("id,status").eq("entitlement_id", entitlement.id).maybeSingle();
    if (existingRefund.data && existingRefund.data.status !== "confirmation_sent") return generic(cors);
    const refundUpsert = existingRefund.data
      ? await db.from("workshop_refund_requests").update({
        confirmation_sent_at: now.toISOString(), updated_at: now.toISOString(),
      }).eq("id", existingRefund.data.id).select("id,status").single()
      : await db.from("workshop_refund_requests").insert({
        entitlement_id: entitlement.id,
        idempotency_key: `workshop-refund-${entitlement.id}`,
        status: "confirmation_sent",
        confirmation_sent_at: now.toISOString(),
      }).select("id,status").single();
    if (refundUpsert.error) throw refundUpsert.error;
    const raw = await deriveWorkshopToken(tokenSecret, entitlement.id, "refund", 1);
    const tokenHash = await hashWorkshopToken(raw);
    await db.from("workshop_tokens").upsert({
      entitlement_id: entitlement.id,
      refund_request_id: refundUpsert.data.id,
      purpose: "refund",
      generation: 1,
      token_sha256: tokenHash,
      state: "active",
      expires_at: new Date(now.getTime() + WORKSHOP_REFUND_TOKEN_TTL_SECONDS * 1000).toISOString(),
    }, { onConflict: "token_sha256" });
    await sendWorkshopEmail({
      apiKey: resendKey, apiUrl: resendApiUrl, from: resendFrom, to: email, kind: "refund",
      link: `${siteUrl}/training/relay-operator-workshop/refund/#t=${raw}`,
      idempotencyKey: `workshop-refund-confirm-${entitlement.id}`,
    });
    await db.from("workshop_requests").update({ status: "sent", token_generation: 1, updated_at: now.toISOString() }).eq("id", requestId);
    return generic(cors);
  } catch (error) {
    console.error("workshop-request failed", error instanceof Error ? error.message : "unknown");
    return generic(cors);
  }
});
