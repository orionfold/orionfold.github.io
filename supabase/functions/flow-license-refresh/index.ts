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
// AUTH, TWO WAYS IN. Both are bearer secrets of the same weight, no header:
//
//   { "license": "<bytes>" }   the subscriber path. We verify our own signature
//                              over the bytes and re-issue for the licence id in
//                              the VERIFIED payload, so the only licence you can
//                              refresh is one we already signed for you.
//   { "session_id": "cs_…" }   the BUYER path (orionfold-flow 2026-08-22 12:36).
//                              A buyer mid-purchase has no envelope — that is the
//                              whole problem, since the endpoint that returns a
//                              licence required already having one. The id is
//                              `UNIQUE` on `fe_entitlements`, unguessable, and
//                              already in the buyer's address bar.
//
// `verify_jwt = false` is safe for the same reason it was already — see
// `_shared/license-credential.ts` for the full argument, and deploy with
// `--no-verify-jwt`.
//
// CONTRACT (published before it was built, so it is fixed):
//   200 { license }  the verbatim envelope to store, `{ payload, signature }`.
//   304              nothing changed; keep what you have. No body.
//                    LICENCE PATH ONLY — see below.
//   403              bad signature, wrong product, unknown or revoked licence;
//                    or, on the buyer path, the webhook has not written the row
//                    yet. A run of 403s means "not yet", never "you did not buy
//                    this". The caller polls; it must not treat one as terminal.
//
// WHY THE BUYER PATH NEVER RETURNS 304. `304` means "what you hold is already
// current", and it is decided by comparing the row against the caller's HELD
// payload. A session-id caller holds nothing to compare, so the question is not
// merely unanswerable — answering it would strand the buyer the poll exists to
// serve, handing them an empty body at the one moment they have no licence at
// all. That path returns the envelope or refuses.
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
  sessionIdFromBody,
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

    // Which way in? A licence, if one was sent; otherwise a session id. Checking
    // the licence first keeps the established path completely unchanged: a
    // request carrying both behaves exactly as it did before this parameter
    // existed.
    const rawLicense = licenseFromBody(body);
    const sessionId = rawLicense === null ? sessionIdFromBody(body) : null;

    let verifiedLicenseId: string | null = null;
    // deno-lint-ignore no-explicit-any
    let heldPayload: any = null;

    if (rawLicense !== null) {
      const verified = await verifyLicenseCredential(rawLicense, FLOW_PRODUCT);
      if (!verified.ok || !verified.license) {
        // One refusal shape for every reason, as in flow-billing-portal: the app
        // only needs to know it was refused, and probing the verifier a licence
        // at a time should tell an attacker nothing.
        console.log("flow-license-refresh refused:", verified.reason);
        return jsonResponse({ error: "That licence was not accepted." }, corsHeaders, 403);
      }
      verifiedLicenseId = verified.license.licenseId;
      heldPayload = verified.license.payload;
    } else if (sessionId === null) {
      // Neither key, or a session id that is not a Stripe session id. Same
      // refusal shape: a caller learns it was refused and nothing else.
      console.log("flow-license-refresh refused: no licence and no session id");
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
    // Both ways in resolve to exactly ONE row, by a unique column, and read the
    // same columns. Nothing downstream of here knows which key found it — which
    // is the property that keeps the buyer path from being a second issuing
    // path with its own rules.
    const query = db.from("fe_entitlements").select(ENTITLEMENT_COLUMNS);
    const row = await (verifiedLicenseId !== null
      ? query.eq("license_id", verifiedLicenseId)
      : query.eq("stripe_session_id", sessionId).eq("product", FLOW_PRODUCT))
      .maybeSingle();
    if (row.error) throw row.error;

    const entitlement = row.data as EntitlementRow | null;
    // An authentic licence with no row is a licence we issued and then lost, or
    // one issued against a different environment. Either way there is nothing
    // to re-state, and 403 keeps it indistinguishable from the other refusals.
    if (!entitlement || !mayRefresh(entitlement.status)) {
      // On the BUYER path a missing row is the expected state, not an error: the
      // Stripe webhook has not written it yet. This is the 403 the poll is built
      // to tolerate, and the log line says so rather than reading as a failure
      // when someone greps for one later.
      console.log(
        verifiedLicenseId !== null
          ? `flow-license-refresh refused: no row or revoked ${verifiedLicenseId}`
          : `flow-license-refresh not yet: no row for session ${sessionId}`,
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
    //
    // The buyer path is EXCLUDED deliberately (see the header): it holds no
    // payload to compare, and a 304 there would hand an empty body to the one
    // caller that has no licence at all.
    if (heldPayload !== null && licenseIsCurrent(heldPayload, payload)) {
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
