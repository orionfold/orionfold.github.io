// Unit lock for the licence-AS-CREDENTIAL check that guards
// `flow-billing-portal` and `flow-license-refresh`.
//
// These two endpoints run with `verify_jwt = false`, so THIS FILE IS THE
// AUTHENTICATION TEST. Everything the endpoints act on — which Stripe customer
// to open a portal for, which licence row to re-issue — is read out of a
// payload this module verified. If the verification is wrong, the endpoints
// hand one subscriber's billing portal to another, so the negative cases below
// matter more than the positive one.
//
// Envelopes are signed here with the published throwaway DEV key from the
// conformance vector, never the production seed (which is a Supabase secret and
// is not on disk). Both key ids are trusted by the verifier, so the dev key
// exercises the real path.
//
// Run: deno test supabase/functions/_shared/license-credential.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { licenseFromBody, verifyLicenseCredential } from "./license-credential.ts";
import { signLicense } from "./license.ts";

const vector = JSON.parse(
  await Deno.readTextFile(new URL("./license-conformance-v1.json", import.meta.url)),
);
const DEV_SEED_B64 = vector.dev_key.private_seed_b64 as string;
const DEV_KEY_ID = vector.dev_key.key_id as string;

const FLOW = "orionfold-flow";

// deno-lint-ignore no-explicit-any
function flowPayload(overrides: Record<string, any> = {}) {
  return {
    schema: "orionfold.license/v1",
    license_id: "OF-FLOW-2026-0007",
    product: FLOW,
    tier: "subscription",
    seats: 1,
    entitlements: ["product:orionfold-flow"],
    issued_to: { email: "jane@example.com", name: "Jane Operator" },
    issued_at: "2026-08-22T00:00:00Z",
    not_before: "2026-08-22T00:00:00Z",
    expires_at: "2026-09-22T00:00:00Z",
    ...overrides,
  };
}

// deno-lint-ignore no-explicit-any
async function envelope(payload: any) {
  const signature = await signLicense(payload, DEV_SEED_B64, DEV_KEY_ID);
  return { payload, signature };
}

Deno.test("a genuine Flow licence verifies and yields claims from the SIGNED payload", async () => {
  const file = await envelope(flowPayload());
  const result = await verifyLicenseCredential(file, FLOW);

  assert(result.ok, `expected ok, got ${result.reason}`);
  assertEquals(result.license?.licenseId, "OF-FLOW-2026-0007");
  assertEquals(result.license?.email, "jane@example.com");
  assertEquals(result.license?.product, FLOW);
  assertEquals(result.license?.keyId, DEV_KEY_ID);
});

// The app POSTs BYTES, not an object. The string path is what production
// actually exercises, so it gets its own case rather than riding on the object
// path being "the same thing".
Deno.test("verbatim file bytes verify identically to a parsed envelope", async () => {
  const file = await envelope(flowPayload());
  // Pretty-printed on purpose: the signature covers the CANONICAL bytes of
  // `payload`, so on-disk formatting must not matter. The app's file is
  // pretty-printed, which would break a naive re-serialise-and-compare check.
  const bytes = JSON.stringify(file, null, 2);
  const result = await verifyLicenseCredential(bytes, FLOW);

  assert(result.ok, `expected ok, got ${result.reason}`);
  assertEquals(result.license?.licenseId, "OF-FLOW-2026-0007");
});

// THE CENTRAL SECURITY CASE. Editing any claim must invalidate the file —
// otherwise a subscriber could swap in someone else's email and open their
// billing portal.
Deno.test("a tampered email is refused (bad-signature), not silently honoured", async () => {
  const file = await envelope(flowPayload());
  file.payload.issued_to.email = "attacker@example.com";

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "bad-signature");
  assertEquals(result.license, undefined);
});

Deno.test("a tampered expiry is refused — a licence cannot extend itself", async () => {
  const file = await envelope(flowPayload());
  file.payload.expires_at = "2099-01-01T00:00:00Z";

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "bad-signature");
});

// One signing key covers every Orionfold product, so the `product` claim is the
// ONLY thing standing between a Relay licence and a Flow billing portal.
Deno.test("an authentic licence for another product is refused (wrong-product)", async () => {
  const file = await envelope(flowPayload({
    product: "orionfold-relay",
    entitlements: ["product:orionfold-relay"],
  }));

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "wrong-product");
});

// A caller must not get to nominate the key their signature is checked against.
Deno.test("an unknown key id is refused before any crypto runs (untrusted-key)", async () => {
  const file = await envelope(flowPayload());
  file.signature.key_id = "attacker-key-2026";

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "untrusted-key");
});

Deno.test("an unsigned envelope is refused (malformed)", async () => {
  const result = await verifyLicenseCredential({ payload: flowPayload() }, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "malformed");
});

Deno.test("a non-ed25519 alg is refused (malformed)", async () => {
  const file = await envelope(flowPayload());
  // deno-lint-ignore no-explicit-any
  (file.signature as any).alg = "none";

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "malformed");
});

Deno.test("junk input is refused (malformed), never thrown", async () => {
  for (const junk of ["not json at all", "", null, undefined, 42, [], "{}"]) {
    const result = await verifyLicenseCredential(junk, FLOW);
    assertEquals(result.ok, false, `expected refusal for ${JSON.stringify(junk)}`);
    assertEquals(result.reason, "malformed");
  }
});

// A file that verifies but carries no email cannot resolve a Stripe customer.
// It must refuse rather than proceed with an empty lookup, which would match
// the first customer with no email on file.
Deno.test("a verified licence missing its email is refused (incomplete)", async () => {
  const file = await envelope(flowPayload({ issued_to: { name: "No Email" } }));

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "incomplete");
});

Deno.test("a verified licence missing its license_id is refused (incomplete)", async () => {
  const payload = flowPayload();
  // deno-lint-ignore no-explicit-any
  delete (payload as any).license_id;
  const file = await envelope(payload);

  const result = await verifyLicenseCredential(file, FLOW);
  assertEquals(result.ok, false);
  assertEquals(result.reason, "incomplete");
});

// Expiry is deliberately NOT a refusal: a lapsed subscriber is exactly who
// needs the billing portal. This test exists so that stays a decision rather
// than drifting into a bug someone "fixes".
Deno.test("an EXPIRED licence still verifies — identity, not entitlement", async () => {
  const file = await envelope(flowPayload({ expires_at: "2020-01-01T00:00:00Z" }));

  const result = await verifyLicenseCredential(file, FLOW);
  assert(result.ok, "an expired but authentic licence must still identify its holder");
  assertEquals(result.license?.email, "jane@example.com");
});

Deno.test("licenseFromBody reads the contract field and its spelling alias", () => {
  assertEquals(licenseFromBody({ license: "bytes" }), "bytes");
  assertEquals(licenseFromBody({ licence: "bytes" }), "bytes");
  assertEquals(licenseFromBody({}), null);
  assertEquals(licenseFromBody(null), null);
  assertEquals(licenseFromBody("string body"), null);
});
