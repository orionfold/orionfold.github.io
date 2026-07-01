// Unit lock for the orionfold.license/v1 payload BUILDER (the issuer's "what to
// sign"). The crypto itself is conformance-locked in license.test.ts; this test
// guards the payload SHAPE: token-less (no registry), the exact claim key-set,
// the term math, issued_to trimming, and a real sign→verify round-trip.
//
// Run: deno test supabase/functions/_shared/license-payload.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  addMonthsUTC,
  buildLicensePayload,
  isoSecondUTC,
  licenseTerm,
  LICENSE_KEY_ID,
} from "./license-payload.ts";
import { editionForLookupKey, licenseProductForLookupKey } from "./catalog.ts";
import { publicKeyFromSeed, signLicense, verifyLicense } from "./license.ts";

// The published throwaway dev seed (bytes(range(32))) from the conformance vector.
const DEV_SEED_B64 = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=";

Deno.test("isoSecondUTC strips milliseconds to the spec-sample shape", () => {
  assertEquals(isoSecondUTC(new Date("2026-06-14T00:00:00.123Z")), "2026-06-14T00:00:00Z");
});

Deno.test("addMonthsUTC rolls the year over", () => {
  assertEquals(isoSecondUTC(addMonthsUTC(new Date("2026-06-14T00:00:00Z"), 12)), "2027-06-14T00:00:00Z");
});

Deno.test("licenseTerm: issued = not_before = sale moment, expires = +12mo", () => {
  // 2026-06-14T00:00:00Z in epoch seconds.
  const created = Math.floor(Date.parse("2026-06-14T00:00:00Z") / 1000);
  const term = licenseTerm(created);
  assertEquals(term.issuedAt, "2026-06-14T00:00:00Z");
  assertEquals(term.notBefore, "2026-06-14T00:00:00Z");
  assertEquals(term.expiresAt, "2027-06-14T00:00:00Z");
});

Deno.test("editionForLookupKey maps the three license SKUs", () => {
  assertEquals(editionForLookupKey("license_arena_field_edition_founding"), "founding-25");
  assertEquals(editionForLookupKey("license_arena_field_edition"), "standard");
  assertEquals(editionForLookupKey("license_arena_field_edition_renewal"), "standard");
  assertEquals(editionForLookupKey("book_ai_native_business"), null);
});

Deno.test("buildLicensePayload is token-less and has the exact v1 claim key-set", () => {
  const payload = buildLicensePayload({
    licenseId: "OF-FE-2026-0007",
    edition: "founding-25",
    issuedTo: { email: "jane@example.com", name: "Jane Operator", org: "Acme Robotics" },
    issuedAt: "2026-06-14T00:00:00Z",
    notBefore: "2026-06-14T00:00:00Z",
    expiresAt: "2027-06-14T00:00:00Z",
    provenance: { stripe_purchase_id: "pi_X", stripe_price_id: "price_Y" },
  });

  // A-hybrid: absolutely no registry / pull_token anywhere.
  assert(!("registry" in payload), "payload must not carry a registry block");
  assert(!JSON.stringify(payload).includes("pull_token"), "payload must not carry a pull_token");

  assertEquals(Object.keys(payload).sort(), [
    "edition",
    "entitlements",
    "expires_at",
    "issued_at",
    "issued_to",
    "license_id",
    "not_before",
    "product",
    "provenance",
    "schema",
    "seats",
    "tier",
  ]);
  assertEquals(payload.schema, "orionfold.license/v1");
  assertEquals(payload.product, "arena-field-edition");
  assertEquals(payload.tier, "field-edition");
  assertEquals(payload.seats, 1);
  assertEquals(payload.entitlements, ["proven-matrix-images", "signed-update-channel"]);
  assertEquals(payload.issued_to, { email: "jane@example.com", name: "Jane Operator", org: "Acme Robotics" });
  assertEquals(payload.provenance, { stripe_purchase_id: "pi_X", stripe_price_id: "price_Y" });
});

Deno.test("licenseProductForLookupKey resolves Arena + Proof descriptors, null otherwise", () => {
  // Arena keys → Arena descriptor (edition follows the founding/standard SKU).
  const arenaFounding = licenseProductForLookupKey("license_arena_field_edition_founding");
  assertEquals(arenaFounding?.product, "arena-field-edition");
  assertEquals(arenaFounding?.tier, "field-edition");
  assertEquals(arenaFounding?.entitlements, ["proven-matrix-images", "signed-update-channel"]);
  assertEquals(arenaFounding?.edition, "founding-25");
  assertEquals(licenseProductForLookupKey("license_arena_field_edition")?.edition, "standard");

  // Proof keys → Proof descriptor (the single product:orionfold-proof entitlement, no edition).
  const proof = licenseProductForLookupKey("license_orionfold_proof");
  assertEquals(proof?.product, "orionfold-proof");
  assertEquals(proof?.tier, "proof");
  assertEquals(proof?.entitlements, ["product:orionfold-proof"]);
  assertEquals(proof?.edition, undefined);
  assertEquals(licenseProductForLookupKey("license_orionfold_proof_founding")?.product, "orionfold-proof");

  // Relay keys → Relay descriptor (the single product:orionfold-relay entitlement, no edition).
  const relay = licenseProductForLookupKey("license_orionfold_relay");
  assertEquals(relay?.product, "orionfold-relay");
  assertEquals(relay?.tier, "relay");
  assertEquals(relay?.entitlements, ["product:orionfold-relay"]);
  assertEquals(relay?.edition, undefined);
  assertEquals(licenseProductForLookupKey("license_orionfold_relay_founding")?.product, "orionfold-relay");
  assertEquals(licenseProductForLookupKey("license_orionfold_relay_renewal")?.product, "orionfold-relay");

  // Non-license keys → null.
  assertEquals(licenseProductForLookupKey("book_ai_native_business"), null);
  assertEquals(licenseProductForLookupKey("sponsor_gold"), null);
});

Deno.test("buildLicensePayload builds a Proof payload: product+entitlement, NO edition, signs+verifies", async () => {
  const d = licenseProductForLookupKey("license_orionfold_proof")!;
  const payload = buildLicensePayload({
    licenseId: "OF-PROOF-2026-0001",
    product: d.product,
    tier: d.tier,
    entitlements: d.entitlements,
    edition: d.edition, // undefined → omitted
    issuedTo: { email: "buyer@example.com", name: "Pat Buyer" },
    issuedAt: "2026-06-24T00:00:00Z",
    notBefore: "2026-06-24T00:00:00Z",
    expiresAt: "2027-06-24T00:00:00Z",
    provenance: { stripe_purchase_id: "pi_P", stripe_price_id: "price_P" },
  });

  // The relay's hard requirement: product + the single gating entitlement.
  assertEquals(payload.product, "orionfold-proof");
  assertEquals(payload.entitlements, ["product:orionfold-proof"]);
  assertEquals(payload.schema, "orionfold.license/v1");
  assertEquals(payload.tier, "proof");
  // Proof has no edition — the key must be ABSENT, not null (the verifier ignores
  // absent optionals; a null would still serialize into the signed bytes).
  assert(!("edition" in payload), "Proof payload must omit the edition key entirely");

  // The signed bytes still verify end-to-end with the dev seed.
  const sig = await signLicense(payload, DEV_SEED_B64, LICENSE_KEY_ID);
  const pub = await publicKeyFromSeed(DEV_SEED_B64);
  assert(await verifyLicense(payload, sig.value, pub), "Proof self-verify must pass");
});

Deno.test("buildLicensePayload builds a Relay payload: product+entitlement, NO edition, signs+verifies", async () => {
  const d = licenseProductForLookupKey("license_orionfold_relay")!;
  const payload = buildLicensePayload({
    licenseId: "OF-RELAY-2026-0001",
    product: d.product,
    tier: d.tier,
    entitlements: d.entitlements,
    edition: d.edition, // undefined → omitted
    issuedTo: { email: "buyer@example.com", name: "Pat Buyer" },
    issuedAt: "2026-06-30T00:00:00Z",
    notBefore: "2026-06-30T00:00:00Z",
    expiresAt: "2027-06-30T00:00:00Z",
    provenance: { stripe_purchase_id: "pi_R", stripe_price_id: "price_R" },
  });

  // The relay's hard requirement: product + the single gating entitlement.
  assertEquals(payload.product, "orionfold-relay");
  assertEquals(payload.entitlements, ["product:orionfold-relay"]);
  assertEquals(payload.schema, "orionfold.license/v1");
  assertEquals(payload.tier, "relay");
  // Relay has no edition — the key must be ABSENT, not null.
  assert(!("edition" in payload), "Relay payload must omit the edition key entirely");

  // The signed bytes still verify end-to-end with the dev seed.
  const sig = await signLicense(payload, DEV_SEED_B64, LICENSE_KEY_ID);
  const pub = await publicKeyFromSeed(DEV_SEED_B64);
  assert(await verifyLicense(payload, sig.value, pub), "Relay self-verify must pass");
});

Deno.test("buildLicensePayload OMITS absent issued_to name/org (not null)", () => {
  const payload = buildLicensePayload({
    licenseId: "OF-FE-2026-0008",
    edition: "standard",
    issuedTo: { email: "solo@example.com" },
    issuedAt: "2026-06-14T00:00:00Z",
    notBefore: "2026-06-14T00:00:00Z",
    expiresAt: "2027-06-14T00:00:00Z",
    provenance: { stripe_purchase_id: null, stripe_price_id: null },
  });
  assertEquals(payload.issued_to, { email: "solo@example.com" });
});

Deno.test("a built payload signs and verifies against the seed's own public key", async () => {
  const payload = buildLicensePayload({
    licenseId: "OF-FE-2026-0009",
    edition: "founding-25",
    issuedTo: { email: "jose@example.com", name: "José Núñez" },
    issuedAt: "2026-06-14T00:00:00Z",
    notBefore: "2026-06-14T00:00:00Z",
    expiresAt: "2027-06-14T00:00:00Z",
    provenance: { stripe_purchase_id: "pi_9", stripe_price_id: "price_9" },
  });
  const sig = await signLicense(payload, DEV_SEED_B64, LICENSE_KEY_ID);
  const pub = await publicKeyFromSeed(DEV_SEED_B64);
  assertEquals(sig.key_id, LICENSE_KEY_ID);
  assert(await verifyLicense(payload, sig.value, pub), "self-verify must pass");
  // Tamper → must fail.
  assert(!(await verifyLicense({ ...payload, seats: 2 }, sig.value, pub)), "tamper must fail");
});
