import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  WORKSHOP_ASSET_TTL_SECONDS,
  WORKSHOP_BUCKET,
  WORKSHOP_EDITION_HASH,
  WORKSHOP_EDITION_ID,
  WORKSHOP_EDITION_VERSION,
  WORKSHOP_MANIFEST_PATH,
  WORKSHOP_MANIFEST_TTL_SECONDS,
} from "../_shared/workshop-contract.ts";
import {
  WORKSHOP_DELIVERY_STAGES,
  parseWorkshopDeliveryManifest,
  workshopStageFiles,
} from "../_shared/workshop-delivery.ts";
import { canExchangeAccess } from "../_shared/workshop-state.ts";
import { hashWorkshopToken, isWorkshopToken } from "../_shared/workshop-token.ts";

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function markManifestUnavailable(
  db: ReturnType<typeof admin>,
  entitlementId: string,
  entitlementState: string,
) {
  await db.from("workshop_entitlements").update({
    state: entitlementState === "refund_pending" ? "refund_pending" : "delivery_retrying",
    last_delivery_error_code: "manifest_unavailable",
    updated_at: new Date().toISOString(),
  }).eq("id", entitlementId);
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, cors, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = body.token;
    if (!isWorkshopToken(rawToken)) return jsonResponse({ ok: false, error: "Access link is invalid or expired." }, cors, 404);
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
    const manifestDownload = await db.storage.from(WORKSHOP_BUCKET).download(WORKSHOP_MANIFEST_PATH);
    if (manifestDownload.error || !manifestDownload.data) {
      await markManifestUnavailable(db, token.entitlement_id, entitlement.state);
      return jsonResponse({ ok: false, retryable: true, error: "The workshop workspace is temporarily unavailable." }, cors, 503);
    }
    let manifest;
    try {
      manifest = parseWorkshopDeliveryManifest(
        JSON.parse(await manifestDownload.data.text()),
      );
    } catch (error) {
      console.error("workshop manifest validation failed", error instanceof Error ? error.message : "unknown");
      await markManifestUnavailable(db, token.entitlement_id, entitlement.state);
      return jsonResponse({ ok: false, retryable: true, error: "The workshop workspace is temporarily unavailable." }, cors, 503);
    }

    const requestedStage = body.stage;
    if (requestedStage !== undefined) {
      if (typeof requestedStage !== "string" || !WORKSHOP_DELIVERY_STAGES.includes(requestedStage as never)) {
        return jsonResponse({ ok: false, error: "Workshop lesson is unavailable." }, cors, 404);
      }
      const files = workshopStageFiles(manifest, requestedStage);
      const roles = ["media", "captions", "transcript"] as const;
      const signed = await Promise.all(roles.map(async (role) => {
        const result = await db.storage.from(WORKSHOP_BUCKET)
          .createSignedUrl(files[role].storage_key, WORKSHOP_ASSET_TTL_SECONDS);
        if (result.error || !result.data?.signedUrl) throw new Error(`signing failed for ${role}`);
        return [role, {
          url: result.data.signedUrl,
          sha256: files[role].sha256,
          size: files[role].size,
          contentType: files[role].content_type,
        }] as const;
      })).catch(async (error) => {
        console.error("workshop asset signing failed", error instanceof Error ? error.message : "unknown");
        await markManifestUnavailable(db, token.entitlement_id, entitlement.state);
        return null;
      });
      if (!signed) {
        return jsonResponse({ ok: false, retryable: true, error: "The workshop lesson is temporarily unavailable." }, cors, 503);
      }
      return jsonResponse({
        ok: true,
        edition: {
          id: entitlement.edition_id || WORKSHOP_EDITION_ID,
          version: entitlement.edition_version || WORKSHOP_EDITION_VERSION,
          hash: entitlement.edition_hash || WORKSHOP_EDITION_HASH,
        },
        stage: requestedStage,
        assets: Object.fromEntries(signed),
        expiresIn: WORKSHOP_ASSET_TTL_SECONDS,
      }, cors);
    }

    const signed = await db.storage.from(WORKSHOP_BUCKET)
      .createSignedUrl(WORKSHOP_MANIFEST_PATH, WORKSHOP_MANIFEST_TTL_SECONDS);
    if (signed.error || !signed.data?.signedUrl) {
      await markManifestUnavailable(db, token.entitlement_id, entitlement.state);
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
      workspacePath: "/training/relay-operator-workshop/workspace/",
      stages: WORKSHOP_DELIVERY_STAGES,
      expiresIn: WORKSHOP_MANIFEST_TTL_SECONDS,
    }, cors);
  } catch (error) {
    console.error("workshop-access failed", error instanceof Error ? error.message : "unknown");
    return jsonResponse({ ok: false, error: "Access link is invalid or expired." }, cors, 404);
  }
});
