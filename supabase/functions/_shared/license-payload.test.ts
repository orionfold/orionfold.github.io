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
import { editionForLookupKey } from "./catalog.ts";
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
