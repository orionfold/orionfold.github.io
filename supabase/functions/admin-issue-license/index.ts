// admin-issue-license — operator-only license hand-issue (token-gated).
//
// Signs a REAL prod license out-of-band from Stripe, for cases where a genuine
// prod-signed license is needed without a sale: peer-project prod-path
// verification (the orionfold-proof CLI unlock e2e, relay 2026-06-24), a manual
// re-issue when a webhook delivery failed, or a comp license. It reuses the EXACT
// production signing path — buildLicensePayload + the prod seed + the same
// self-verify-before-deliver — so the bytes are identical to what stripe-webhook
// fulfillLicense emits on a real purchase. The signature is therefore a genuine
// `of-license-prod-2026` signature, not a dev/test one (a dev sig under the prod
// key_id is correctly rejected by the CLI's structural test).
//
// Auth: a low-value shared token (ADMIN_ISSUE_TOKEN), same pattern as ops-alert —
// callers are the operator/servers, not browsers, so there is no CORS and
// verify_jwt = false. The high-value secret (the signing seed) never leaves
// Supabase; the token only lets a holder MINT a license, which the operator
// controls. Keep the token out of any tracked file.
//
// Returns the { payload, signature } JSON inline (so the operator can hand it to a
// peer) and, when persist=true, also records the entitlement + uploads the signed
// file to the private bucket and returns a 7-day signed URL (same delivery the
// webhook uses). persist defaults to FALSE so a throwaway verification license
// doesn't pollute the entitlement plane or burn a license-id sequence value
// unless asked.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCatalogItem, licenseProductForLookupKey } from "../_shared/catalog.ts";
import { publicKeyFromSeed, signLicense, verifyLicense } from "../_shared/license.ts";
import {
  buildLicensePayload,
  licenseTerm,
  LICENSE_KEY_ID,
} from "../_shared/license-payload.ts";

const LICENSE_SIGNING_SEED_ENV = "LICENSE_SIGNING_SEED_B64";
const LICENSE_FILES_BUCKET = "field-edition";
const LICENSE_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7-day signed URL, same as the webhook
const PUBLIC_SUPABASE_URL = "https://orionfold.supabase.co";

// Per-product license-id sequence rpc + throwaway-id prefix, mirroring
// stripe-webhook. Keyed by product (not a Proof-or-else ternary) so a new
// licensed product must map explicitly here — an unmapped product errors rather
// than silently minting Arena ids/prefix.
const LICENSE_ID_RPC: Record<string, string> = {
  "arena-field-edition": "next_fe_license_id",
  "orionfold-proof": "next_proof_license_id",
  "orionfold-relay": "next_relay_license_id",
};
const LICENSE_ID_PREFIX: Record<string, string> = {
  "arena-field-edition": "OF-FE",
  "orionfold-proof": "OF-PROOF",
  "orionfold-relay": "OF-RELAY",
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Constant-time-ish token check (SHA-256 digests compared byte-by-byte) — copied
// from ops-alert so input length never shapes the comparison.
async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const ua = new Uint8Array(a);
  const ub = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function brandedUrl(signedUrl: string): string {
  const internal = Deno.env.get("SUPABASE_URL");
  return internal ? signedUrl.replace(internal, PUBLIC_SUPABASE_URL) : signedUrl;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("ADMIN_ISSUE_TOKEN");
  if (!expected) {
    console.error("ADMIN_ISSUE_TOKEN not configured");
    return json({ error: "Not configured" }, 500);
  }
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!provided || !(await tokenMatches(provided, expected))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const seedB64 = Deno.env.get(LICENSE_SIGNING_SEED_ENV);
  if (!seedB64) {
    console.error("LICENSE_SIGNING_SEED_B64 unset — cannot sign");
    return json({ error: "Signing key not configured" }, 500);
  }

  let body: {
    lookupKey?: unknown;
    email?: unknown;
    name?: unknown;
    persist?: unknown;
  };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const lookupKey = typeof body.lookupKey === "string" ? body.lookupKey : "";
  const email = typeof body.email === "string" ? body.email : "";
  const name = typeof body.name === "string" ? body.name : null;
  const persist = body.persist === true;

  const item = getCatalogItem(lookupKey);
  const descriptor = licenseProductForLookupKey(lookupKey);
  if (!item || item.kind !== "license" || !descriptor) {
    return json({ error: "lookupKey must be a known license SKU" }, 400);
  }
  if (!email) return json({ error: "email is required (the license issued_to)" }, 400);

  // Term from NOW (a hand-issue has no Stripe session.created); provenance is null
  // because there is no Stripe charge behind it. The CLI ignores provenance.
  const term = licenseTerm(Math.floor(Date.now() / 1000));

  // License id: persist=true draws a real sequence id; otherwise a clearly-marked
  // throwaway id so a verification license is never mistaken for a sold one and we
  // don't burn a sequence value. The CLI treats license_id as opaque either way.
  const supabase = supabaseAdmin();
  let licenseId: string;
  if (persist) {
    const idRpc = LICENSE_ID_RPC[descriptor.product];
    if (!idRpc) {
      return json({ error: `No license-id sequence mapped for product "${descriptor.product}"` }, 500);
    }
    const { data, error } = await supabase.rpc(idRpc);
    if (error || typeof data !== "string") {
      return json({ error: `${idRpc} failed`, detail: String(error?.message ?? error) }, 500);
    }
    licenseId = data;
  } else {
    const prefix = LICENSE_ID_PREFIX[descriptor.product] ?? "OF-FE";
    licenseId = `${prefix}-VERIFY-${term.issuedAt.slice(0, 10).replace(/-/g, "")}`;
  }

  const payload = buildLicensePayload({
    licenseId,
    product: descriptor.product,
    tier: descriptor.tier,
    entitlements: descriptor.entitlements,
    edition: descriptor.edition, // undefined for Proof → omitted
    issuedTo: { email, name },
    issuedAt: term.issuedAt,
    notBefore: term.notBefore,
    expiresAt: term.expiresAt,
    provenance: { stripe_purchase_id: null, stripe_price_id: null },
  });

  // Sign with the prod seed, then self-verify against its own public key before
  // returning — never hand out a license that fails on the recipient's box.
  const signature = await signLicense(payload, seedB64, LICENSE_KEY_ID);
  const pub = await publicKeyFromSeed(seedB64);
  if (!(await verifyLicense(payload, signature.value, pub))) {
    return json({ error: "License self-verify FAILED — refusing to return" }, 500);
  }

  const licenseFile = { payload, signature };

  let installUrl: string | null = null;
  if (persist) {
    const fileText = JSON.stringify(licenseFile, null, 2);
    const path = `licenses/${licenseId}.json`;
    const { error: upErr } = await supabase.storage
      .from(LICENSE_FILES_BUCKET)
      .upload(path, new Blob([fileText], { type: "application/json" }), {
        contentType: "application/json",
        upsert: true,
      });
    if (upErr) return json({ error: "upload failed", detail: String(upErr.message) }, 500);

    const { data: signed, error: signErr } = await supabase.storage
      .from(LICENSE_FILES_BUCKET)
      .createSignedUrl(path, LICENSE_URL_TTL_SECONDS);
    if (signErr || !signed?.signedUrl) {
      return json({ error: "createSignedUrl failed", detail: String(signErr?.message) }, 500);
    }
    installUrl = brandedUrl(signed.signedUrl);

    const { error: entErr } = await supabase.from("fe_entitlements").upsert(
      {
        license_id: licenseId,
        key_id: LICENSE_KEY_ID,
        product: descriptor.product,
        edition: descriptor.edition ?? null,
        tier: descriptor.tier,
        seats: 1,
        email,
        issued_to_name: name,
        status: "active",
        issued_at: term.issuedAt,
        not_before: term.notBefore,
        expires_at: term.expiresAt,
        token_ref: null,
        delivered: true,
        delivered_at: term.issuedAt,
      },
      { onConflict: "license_id" },
    );
    if (entErr) return json({ error: "entitlement upsert failed", detail: String(entErr.message) }, 500);
  }

  return json({
    ok: true,
    license_id: licenseId,
    persisted: persist,
    install_url: installUrl,
    license: licenseFile,
  }, 200);
});
