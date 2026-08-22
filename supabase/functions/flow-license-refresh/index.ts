// flow-license-refresh — hand an Orionfold Flow subscriber a licence envelope
// carrying their CURRENT term.
//
// WHAT IT IS FOR. A Flow subscription is never re-issued per cycle: the same
// signed envelope stays valid and each paid invoice pushes `expires_at` out.
// But `stripe-webhook` writes that extension to the DATABASE ROW and signs
// nothing — so after the first renewal, the file on the subscriber's Mac still
// carries last month's expiry while the row carries this month's. The app reads
// the file, offline. This endpoint is what closes that gap: it re-signs the
// payload from the row and returns it.
//
// CONVENIENCE, NOT A GATE. A licence verifies offline and the app must treat a
// failure here as "try later", never as "you are not licensed". Nothing about a
// subscriber's access depends on this endpoint being reachable — which is the
// property that lets it be down without breaking anyone's Tuesday.
//
// AUTH. `{ "license": "<bytes>" }`, no header, exactly as `flow-billing-portal`.
// We verify our own signature over the bytes, then re-issue for the licence id
// in the VERIFIED payload. So the only licence you can refresh is one we
// already signed for you, and `verify_jwt = false` is safe for the same reason
// it is there — see `_shared/license-credential.ts` for the full argument, and
// deploy with `--no-verify-jwt`.
//
// CONTRACT (published before it was built, so it is fixed):
//   200 { license }  the verbatim envelope to store, `{ payload, signature }`.
//   304              nothing changed; keep what you have. No body.
//   403              bad signature, wrong product, unknown or revoked licence.
//
// A REFRESH CAN NEVER GRANT. Every claim except the term is copied from the row
// the issuing path wrote — never from the request. See `_shared/license-reissue.ts`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { licenseFromBody, verifyLicenseCredential } from "../_shared/license-credential.ts";
import {
  type EntitlementRow,
  entitlementsForProduct,
  licenseIsCurrent,
  mayRefresh,
  reissuePayload,
} from "../_shared/license-reissue.ts";
import {
  assertLicenseSigningIdentity,
  signLicense,
  verifyLicense,
} from "../_shared/license.ts";
import { LICENSE_KEY_ID } from "../_shared/license-payload.ts";

const FLOW_PRODUCT = "orionfold-flow";
// Any Flow SKU resolves the same product descriptor; the monthly key is simply
// the one that always exists for the family.
const FLOW_LOOKUP_KEY_HINT = "license_orionfold_flow_monthly";

const LICENSE_SIGNING_SEED_ENV = "LICENSE_SIGNING_SEED_B64";
const LICENSE_SIGNING_KEY_ID_ENV = "LICENSE_SIGNING_KEY_ID";

const ENTITLEMENT_COLUMNS =
  "license_id,product,tier,edition,seats,email,issued_to_name,issued_to_org," +
  "issued_at,not_before,expires_at,status,stripe_session_id,stripe_price_id";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
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
      // One refusal shape for every reason, as in flow-billing-portal: the app
      // only needs to know it was refused, and probing the verifier a licence
      // at a time should tell an attacker nothing.
      console.log("flow-license-refresh refused:", verified.reason);
      return jsonResponse({ error: "That licence was not accepted." }, corsHeaders, 403);
    }

    const seedB64 = Deno.env.get(LICENSE_SIGNING_SEED_ENV);
    if (!seedB64) {
      // Refusing to sign is right when the signing identity is missing: the
      // alternative is minting an envelope under some fallback key that the
      // subscriber's app would then reject offline, with no way to tell why.
      console.error("LICENSE_SIGNING_SEED_B64 unset — cannot refresh");
      return jsonResponse(
        { error: "Refresh is unavailable right now. Your licence still works." },
        corsHeaders,
        503,
      );
    }
    const signingKeyId = Deno.env.get(LICENSE_SIGNING_KEY_ID_ENV)?.trim() || LICENSE_KEY_ID;

    const db = supabaseAdmin();
    const row = await db.from("fe_entitlements")
      .select(ENTITLEMENT_COLUMNS)
      .eq("license_id", verified.license.licenseId)
      .maybeSingle();
    if (row.error) throw row.error;

    const entitlement = row.data as EntitlementRow | null;
    // An authentic licence with no row is a licence we issued and then lost, or
    // one issued against a different environment. Either way there is nothing
    // to re-state, and 403 keeps it indistinguishable from the other refusals.
    if (!entitlement || !mayRefresh(entitlement.status)) {
      console.log(
        "flow-license-refresh refused: no row or revoked",
        verified.license.licenseId,
      );
      return jsonResponse({ error: "That licence was not accepted." }, corsHeaders, 403);
    }

    const entitlements = entitlementsForProduct(entitlement.product, FLOW_LOOKUP_KEY_HINT);
    if (!entitlements) {
      console.error("flow-license-refresh: no descriptor for", entitlement.product);
      return jsonResponse({ error: "That licence was not accepted." }, corsHeaders, 403);
    }

    const payload = reissuePayload(entitlement, entitlements);
    if (!payload) {
      // A row missing its term was never fully issued. Handing back a partial
      // licence would give the subscriber a file their app refuses for reasons
      // they cannot see, so say "nothing to do" and leave what works in place.
      console.error("flow-license-refresh: incomplete row", entitlement.license_id);
      return new Response(null, { status: 304, headers: corsHeaders });
    }

    // Nothing moved — tell the app to keep what it has rather than making it
    // rewrite an identical file into the Keychain on every launch.
    if (licenseIsCurrent(verified.license.payload, payload)) {
      return new Response(null, { status: 304, headers: corsHeaders });
    }

    // Sign, then self-verify against the seed's OWN public half before handing
    // it over — the same belt-and-braces the issuing path uses. A misconfigured
    // seed must fail here, loudly, rather than on the subscriber's Mac.
    const pub = await assertLicenseSigningIdentity(seedB64, signingKeyId);
    const signature = await signLicense(payload, seedB64, signingKeyId);
    if (!(await verifyLicense(payload, signature.value, pub))) {
      throw new Error(`Refresh self-verify FAILED for ${entitlement.license_id}`);
    }

    console.log(
      "flow-license-refresh issued:",
      entitlement.license_id,
      "expires",
      payload.expires_at,
    );
    return jsonResponse({ license: { payload, signature } }, corsHeaders);
  } catch (err) {
    console.error("flow-license-refresh error:", err);
    return jsonResponse(
      { error: "Could not refresh right now. Your licence still works." },
      corsHeaders,
      500,
    );
  }
});
