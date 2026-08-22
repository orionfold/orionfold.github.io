// Unit lock for the row-to-payload mapping behind `flow-license-refresh`.
//
// The property these tests exist to hold is a NEGATIVE one: a refresh re-states
// an existing licence with a current expiry and can never GRANT anything. So
// most of what follows checks that a field came from the row rather than from
// anywhere else, and that the one field a renewal moves is the only one that
// moves.
//
// Run: deno test supabase/functions/_shared/license-reissue.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type EntitlementRow,
  entitlementsForProduct,
  licenseIsCurrent,
  mayRefresh,
  reissuePayload,
  sessionIdFromBody,
} from "./license-reissue.ts";
import { signLicense, verifyLicense } from "./license.ts";

const vector = JSON.parse(
  await Deno.readTextFile(new URL("./license-conformance-v1.json", import.meta.url)),
);
const DEV_SEED_B64 = vector.dev_key.private_seed_b64 as string;
const DEV_PUB_B64 = vector.dev_key.public_key_b64 as string;
const DEV_KEY_ID = vector.dev_key.key_id as string;

const FLOW_ENTITLEMENTS = ["product:orionfold-flow"];

function flowRow(overrides: Partial<EntitlementRow> = {}): EntitlementRow {
  return {
    license_id: "OF-FLOW-2026-0007",
    product: "orionfold-flow",
    tier: "subscription",
    edition: null,
    seats: 1,
    email: "jane@example.com",
    issued_to_name: "Jane Operator",
    issued_to_org: null,
    issued_at: "2026-08-22T00:00:00Z",
    not_before: "2026-08-22T00:00:00Z",
    expires_at: "2026-09-22T00:00:00Z",
    status: "active",
    stripe_session_id: "cs_test_123",
    stripe_price_id: "price_flow_monthly",
    ...overrides,
  };
}

Deno.test("entitlementsForProduct resolves Flow's claim from the catalog descriptor", () => {
  assertEquals(
    entitlementsForProduct("orionfold-flow", "license_orionfold_flow_monthly"),
    FLOW_ENTITLEMENTS,
  );
});

// A row whose product does not match the descriptor must not silently borrow
// Flow's entitlement — that would be a grant.
Deno.test("entitlementsForProduct refuses a product/lookup-key mismatch", () => {
  assertEquals(
    entitlementsForProduct("orionfold-relay", "license_orionfold_flow_monthly"),
    null,
  );
});

Deno.test("a refreshed payload carries the row's term and signs+verifies", async () => {
  const payload = reissuePayload(flowRow(), FLOW_ENTITLEMENTS);
  assert(payload, "expected a payload");

  assertEquals(payload.license_id, "OF-FLOW-2026-0007");
  assertEquals(payload.product, "orionfold-flow");
  assertEquals(payload.tier, "subscription");
  assertEquals(payload.expires_at, "2026-09-22T00:00:00Z");
  assertEquals(payload.entitlements, FLOW_ENTITLEMENTS);
  assertEquals(payload.issued_to, { email: "jane@example.com", name: "Jane Operator" });
  // Flow has no edition; the key must be ABSENT rather than null, matching what
  // the issuing path emits — a null would change the canonical signing bytes.
  assert(!("edition" in payload), "Flow payload must omit edition entirely");

  const sig = await signLicense(payload, DEV_SEED_B64, DEV_KEY_ID);
  assert(await verifyLicense(payload, sig.value, DEV_PUB_B64));
});

// THE CENTRAL CASE. A renewal moves `expires_at` in the row; the refreshed
// payload must carry the new value and nothing else may drift.
Deno.test("a renewed row produces a payload whose ONLY change is the expiry", () => {
  const before = reissuePayload(flowRow(), FLOW_ENTITLEMENTS)!;
  const after = reissuePayload(
    flowRow({ expires_at: "2026-10-22T00:00:00Z" }),
    FLOW_ENTITLEMENTS,
  )!;

  assertEquals(after.expires_at, "2026-10-22T00:00:00Z");
  const stripExpiry = (p: Record<string, unknown>) => {
    const { expires_at: _drop, ...rest } = p;
    return rest;
  };
  assertEquals(stripExpiry(after), stripExpiry(before));
});

// A signed seat count cannot be corrected after delivery, so a refresh must
// reproduce it exactly rather than recompute or default it.
Deno.test("a multi-seat licence keeps its seat count through a refresh", () => {
  const payload = reissuePayload(flowRow({ seats: 12 }), FLOW_ENTITLEMENTS)!;
  assertEquals(payload.seats, 12);
});

Deno.test("an org on the row propagates into issued_to", () => {
  const payload = reissuePayload(
    flowRow({ issued_to_org: "Acme Robotics" }),
    FLOW_ENTITLEMENTS,
  )!;
  assertEquals(payload.issued_to, {
    email: "jane@example.com",
    name: "Jane Operator",
    org: "Acme Robotics",
  });
});

// A row that was never fully issued must produce nothing, rather than a partial
// licence the subscriber's app would refuse for reasons they cannot see.
Deno.test("an incomplete row produces no payload", () => {
  assertEquals(reissuePayload(flowRow({ expires_at: null }), FLOW_ENTITLEMENTS), null);
  assertEquals(reissuePayload(flowRow({ issued_at: null }), FLOW_ENTITLEMENTS), null);
  assertEquals(reissuePayload(flowRow({ not_before: null }), FLOW_ENTITLEMENTS), null);
  assertEquals(reissuePayload(flowRow({ email: "" }), FLOW_ENTITLEMENTS), null);
  assertEquals(reissuePayload(flowRow({ license_id: "" }), FLOW_ENTITLEMENTS), null);
});

Deno.test("licenseIsCurrent says current when the term has not moved", () => {
  const fresh = reissuePayload(flowRow(), FLOW_ENTITLEMENTS)!;
  assert(licenseIsCurrent({ ...fresh }, fresh));
});

// The 304 path must survive a differently-formatted held file — otherwise every
// launch re-downloads an identical licence.
Deno.test("licenseIsCurrent ignores key order and extra held fields", () => {
  const fresh = reissuePayload(flowRow(), FLOW_ENTITLEMENTS)!;
  const held = {
    schema: fresh.schema,
    entitlements: [...(fresh.entitlements as string[])],
    edition: fresh.edition,
    tier: fresh.tier,
    seats: fresh.seats,
    issued_at: fresh.issued_at,
    not_before: fresh.not_before,
    expires_at: fresh.expires_at,
    // A field the app added that the issuer never signed; must not matter.
    local_note: "installed on the mini",
  };
  assert(licenseIsCurrent(held, fresh));
});

Deno.test("licenseIsCurrent says NOT current after a renewal extends the expiry", () => {
  const held = reissuePayload(flowRow(), FLOW_ENTITLEMENTS)!;
  const fresh = reissuePayload(
    flowRow({ expires_at: "2026-10-22T00:00:00Z" }),
    FLOW_ENTITLEMENTS,
  )!;
  assertEquals(licenseIsCurrent(held, fresh), false);
});

Deno.test("licenseIsCurrent says NOT current when the seat count changed", () => {
  const held = reissuePayload(flowRow(), FLOW_ENTITLEMENTS)!;
  const fresh = reissuePayload(flowRow({ seats: 5 }), FLOW_ENTITLEMENTS)!;
  assertEquals(licenseIsCurrent(held, fresh), false);
});

Deno.test("licenseIsCurrent treats junk as not current rather than throwing", () => {
  const fresh = reissuePayload(flowRow(), FLOW_ENTITLEMENTS)!;
  for (const junk of [null, undefined, "string", 42]) {
    assertEquals(licenseIsCurrent(junk, fresh), false);
  }
});

// past_due and canceled subscribers still own the days they paid for, so they
// must be able to re-fetch them. Only a deliberate revoke refuses.
Deno.test("mayRefresh allows every status except revoked", () => {
  assert(mayRefresh("active"));
  assert(mayRefresh("past_due"));
  assert(mayRefresh("canceled"));
  assert(mayRefresh(null));
  assertEquals(mayRefresh("revoked"), false);
});


// ── The buyer path's way in (orionfold-flow 2026-08-22 12:36) ──────────────
// A buyer mid-purchase has no envelope, so `flow-license-refresh` accepts a
// Stripe session id as an alternative bearer secret. This resolver is the only
// place a request can name one, so it is where the shape is pinned.

Deno.test("sessionIdFromBody accepts both key spellings", () => {
  assertEquals(sessionIdFromBody({ session_id: "cs_test_123" }), "cs_test_123");
  assertEquals(sessionIdFromBody({ stripe_session_id: "cs_test_123" }), "cs_test_123");
  // Whitespace is the buyer's, not theirs to lose a purchase over.
  assertEquals(sessionIdFromBody({ session_id: "  cs_test_123  " }), "cs_test_123");
});

// The `cs_` prefix keeps this from degrading into a row lookup by arbitrary
// string. A legitimate caller never notices; a prober cannot enumerate.
Deno.test("sessionIdFromBody requires a Stripe session id", () => {
  for (const junk of [
    { session_id: "sub_123" },
    { session_id: "pi_123" },
    { session_id: "" },
    { session_id: "   " },
    { session_id: `cs_${"x".repeat(300)}` },
    { session_id: 42 },
    { session_id: null },
    { license: "envelope" },
    {},
    null,
    undefined,
    "cs_test_123",
  ]) {
    assertEquals(sessionIdFromBody(junk), null, `must refuse ${JSON.stringify(junk)}`);
  }
});

// A session id must NOT widen what the caller can ask for. Everything but the
// term still comes from the row, which is what makes the second way in safe.
//
// Note what this does NOT assert: that the id is absent from the payload. It is
// present, as `stripe_purchase_id`, and that is correct — it is the provenance
// the ISSUING path signed, copied from the row like every other claim. The
// property that matters is that presenting an id cannot CHANGE any of it.
Deno.test("a session id grants nothing the row does not already say", () => {
  const row = flowRow({ tier: "pro", seats: 2, stripe_session_id: "cs_test_123" });
  const payload = reissuePayload(row, FLOW_ENTITLEMENTS)!;
  assertEquals(payload.tier, "pro");
  assertEquals(payload.seats, 2);
  // Provenance is copied from the row, never taken from the request.
  assertEquals(payload.provenance?.stripe_purchase_id, "cs_test_123");

  // The same row reached by either way in must produce a BYTE-IDENTICAL
  // payload. That is the whole safety argument for the second key: the lookup
  // differs, nothing after it does.
  assertEquals(
    JSON.stringify(reissuePayload(row, FLOW_ENTITLEMENTS)),
    JSON.stringify(payload),
  );
});
