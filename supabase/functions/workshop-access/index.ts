import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  WORKSHOP_BUCKET,
  WORKSHOP_EDITION_HASH,
  WORKSHOP_EDITION_ID,
  WORKSHOP_EDITION_VERSION,
  WORKSHOP_MANIFEST_PATH,
  WORKSHOP_MANIFEST_TTL_SECONDS,
} from "../_shared/workshop-contract.ts";
import { canExchangeAccess } from "../_shared/workshop-state.ts";
import { hashWorkshopToken } from "../_shared/workshop-token.ts";

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, cors, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = body.token;
    if (typeof rawToken !== "string") return jsonResponse({ ok: false, error: "Access link is invalid or expired." }, cors, 404);
    const tokenHash = await hashWorkshopToken(rawToken);
    const db = admin();
    const tokenResult = await db.from("workshop_tokens")
      .select("entitlement_id,state,expires_at,purpose")
      .eq("token_sha256", tokenHash).eq("purpose", "access").maybeSingle();
    const token = tokenResult.data;
    if (!token || token.state !== "active") return jsonResponse({ ok: false, error: "Access link is invalid or expired." }, cors, 404);
    const entitlementResult = await db.from("workshop_entitlements")
      .select("state,edition_id,edition_version,edition_hash")
      .eq("id", token.entitlement_id).maybeSingle();
    const entitlement = entitlementResult.data;
    if (!entitlement || !canExchangeAccess(entitlement.state, new Date(token.expires_at))) {
      return jsonResponse({ ok: false, error: "Access link is invalid or expired." }, cors, 404);
    }
    const signed = await db.storage.from(WORKSHOP_BUCKET)
      .createSignedUrl(WORKSHOP_MANIFEST_PATH, WORKSHOP_MANIFEST_TTL_SECONDS);
    if (signed.error || !signed.data?.signedUrl) {
      await db.from("workshop_entitlements").update({
        state: entitlement.state === "refund_pending" ? "refund_pending" : "delivery_retrying",
        last_delivery_error_code: "manifest_unavailable",
        updated_at: new Date().toISOString(),
      }).eq("id", token.entitlement_id);
      return jsonResponse({ ok: false, retryable: true, error: "The workshop workspace is temporarily unavailable." }, cors, 503);
    }
    return jsonResponse({
      ok: true,
      edition: {
        id: entitlement.edition_id || WORKSHOP_EDITION_ID,
        version: entitlement.edition_version || WORKSHOP_EDITION_VERSION,
        hash: entitlement.edition_hash || WORKSHOP_EDITION_HASH,
      },
      manifestUrl: signed.data.signedUrl,
      expiresIn: WORKSHOP_MANIFEST_TTL_SECONDS,
    }, cors);
  } catch (error) {
    console.error("workshop-access failed", error instanceof Error ? error.message : "unknown");
    return jsonResponse({ ok: false, error: "Access link is invalid or expired." }, cors, 404);
  }
});
