// Conformance mirror for the orionfold.license/v1 signing contract.
//
// This is the Website half of license-workflow §6: the byte-safety gate that
// keeps this repo's JS issuer (fulfillLicense) byte-identical to Spark's Python
// verifier (fieldkit.field_edition.license). The frozen vector
// (license-conformance-v1.json) is Spark-owned truth; both CIs assert against
// it. If this drifts by one byte, EVERY real license silently fails to validate
// on a customer box — so this test gates the whole license-issuance build.
//
// Run: deno test supabase/functions/_shared/license.test.ts
//
// The vector embeds a PUBLISHED throwaway dev key (seed = bytes(range(32)));
// it exists only to prove canonicalization + signing match. A real license is
// NEVER signed with this seed — production signing uses LICENSE_SIGNING_SEED_B64.
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  canonicalize,
  canonicalSha256_12,
  signLicense,
  verifyLicense,
} from "./license.ts";

const vector = JSON.parse(
  await Deno.readTextFile(
    new URL("./license-conformance-v1.json", import.meta.url),
  ),
);

const DEV_SEED_B64 = vector.dev_key.private_seed_b64 as string;
const DEV_PUB_B64 = vector.dev_key.public_key_b64 as string;
const DEV_KEY_ID = vector.dev_key.key_id as string;

for (const c of vector.cases) {
  Deno.test(`canonicalize() matches the frozen UTF-8 bytes — ${c.name}`, () => {
    assertEquals(canonicalize(c.payload), c.canonical_utf8);
  });

  Deno.test(`canonical sha256[:12] matches — ${c.name}`, async () => {
    assertEquals(await canonicalSha256_12(c.payload), c.canonical_sha256_12);
  });

  Deno.test(`dev-key Ed25519 signature matches the vector — ${c.name}`, async () => {
    const sig = await signLicense(c.payload, DEV_SEED_B64, DEV_KEY_ID);
    assertEquals(sig.alg, "ed25519");
    assertEquals(sig.key_id, DEV_KEY_ID);
    assertEquals(sig.value, c.signature_b64);
  });

  Deno.test(`signature verifies against the dev public key — ${c.name}`, async () => {
    assertEquals(
      await verifyLicense(c.payload, c.signature_b64, DEV_PUB_B64),
      true,
    );
  });
}

// A tampered payload must NOT verify against a real signature — proves the
// verifier actually checks bytes, not just shape.
Deno.test("verifyLicense rejects a tampered payload", async () => {
  const c = vector.cases.find((x: { name: string }) =>
    x.name === "full-license-founding25"
  );
  const tampered = { ...c.payload, seats: 999 };
  assertEquals(await verifyLicense(tampered, c.signature_b64, DEV_PUB_B64), false);
});
