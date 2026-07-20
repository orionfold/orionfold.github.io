import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { footerForEmail } from "../_shared/email-footer.ts";
import {
  isRequestId,
  normalizeWorkshopEmail,
  requestHash,
} from "../_shared/workshop-token.ts";
import { brandedUrl } from "../_shared/book-files.ts";
import {
  relayHostDeliveryEligible,
  relayHostRequestResponse,
} from "../_shared/relay-host-delivery.ts";

const requestSecret = Deno.env.get("LICENSE_REQUEST_HASH_SECRET") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const resendApiUrl = Deno.env.get("RESEND_API_URL") ??
  "https://api.resend.com/emails";
const resendFrom = Deno.env.get("RESEND_FROM") ??
  "Orionfold <manav@orionfold.com>";
const BUCKET = "field-edition";
const TTL_SECONDS = 60 * 60 * 24 * 7;
const WINDOW_SECONDS = 60 * 60;

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function generic(cors: Record<string, string>) {
  return jsonResponse(relayHostRequestResponse(), cors, 202);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, cors, 405);
  }

  let db: ReturnType<typeof admin> | null = null;
  let admittedRequestId: string | null = null;
  try {
    if (!requestSecret || !resendKey) {
      throw new Error("delivery secrets are not configured");
    }
    db = admin();
    const body = await req.json().catch(() => ({}));
    const email = normalizeWorkshopEmail(body.email);
    const requestId = body.requestId ?? body.request_id;
    if (!email || !isRequestId(requestId) || body.company) {
      return jsonResponse({ error: "Invalid request." }, cors, 400);
    }

    const now = new Date();
    const window = Math.floor(now.getTime() / 1000 / WINDOW_SECONDS);
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const [requestDigest, emailWindowHash, ipWindowHash] = await Promise.all([
      requestHash(requestSecret, "relay-host-request", requestId),
      requestHash(requestSecret, "relay-host-email", `${email}:${window}`),
      requestHash(requestSecret, "relay-host-ip", `${ip}:${window}`),
    ]);
    const entitlementResult = await db.from("fe_entitlements")
      .select("id,license_id,email,status,expires_at,refunded_at")
      .eq("product", "orionfold-relay-host")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (entitlementResult.error) throw entitlementResult.error;
    const entitlement = entitlementResult.data;

    const admission = await db.from("relay_host_delivery_requests").insert({
      id: requestId,
      request_hash: requestDigest,
      email_window_hash: emailWindowHash,
      ip_window_hash: ipWindowHash,
      entitlement_id: entitlement?.id ?? null,
    });
    if (admission.error) return generic(cors);
    admittedRequestId = requestId;

    const eligible = relayHostDeliveryEligible(entitlement, now);
    if (!entitlement || !eligible) {
      await db.from("relay_host_delivery_requests").update({
        status: "suppressed",
      }).eq("id", requestId);
      return generic(cors);
    }

    const signed = await db.storage.from(BUCKET)
      .createSignedUrl(`licenses/${entitlement.license_id}.json`, TTL_SECONDS);
    if (signed.error || !signed.data?.signedUrl) {
      throw signed.error ?? new Error("signed URL missing");
    }
    const link = brandedUrl(signed.data.signedUrl);
    const footer = await footerForEmail(db, email);
    const response = await fetch(resendApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `relay-host-redownload-${requestId}`,
      },
      body: JSON.stringify({
        from: resendFrom,
        reply_to: "manav@orionfold.com",
        to: [email],
        subject: `Your Relay Host license (${entitlement.license_id})`,
        text:
          `Here is a fresh seven-day link to your signed Relay Host license:\n\n${link}\n\nThe license file is your durable offline proof. Save it after downloading.\n\n${footer}`,
      }),
    });
    if (!response.ok) throw new Error(`Resend API error: ${response.status}`);
    await db.from("relay_host_delivery_requests").update({
      status: "sent",
      updated_at: now.toISOString(),
    }).eq("id", requestId);
    return generic(cors);
  } catch (error) {
    if (db && admittedRequestId) {
      await db.from("relay_host_delivery_requests").update({
        status: "failed",
        updated_at: new Date().toISOString(),
      }).eq("id", admittedRequestId);
    }
    console.error(
      "relay-host-request failed",
      error instanceof Error ? error.message : "unknown",
    );
    return generic(cors);
  }
});
