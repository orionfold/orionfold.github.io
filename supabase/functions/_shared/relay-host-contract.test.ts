// Cross-repository lock for Relay's accepted Host schema and signed fixtures.
//
// The public Website repository does not vendor Relay's independently owned
// contract files. Run this test with RELAY_ROOT pointing at a Relay checkout:
//   RELAY_ROOT=../relay deno test -A supabase/functions/_shared/relay-host-contract.test.ts
// Without RELAY_ROOT the test is reported as ignored, while the self-contained
// payload-builder regression remains in license-payload.test.ts.

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  buildLicensePayload,
  buildRelayHostLicensePayload,
  type IssuedTo,
  type LicenseProvenance,
  type RelayHostGrant,
} from "./license-payload.ts";
import { canonicalize, canonicalSha256_12, verifyLicense } from "./license.ts";

const RELAY_ROOT = Deno.env.get("RELAY_ROOT");
const EXPECTED_SCHEMA_SHA256 =
  "222d1953fc5ff9f4b802d9b0693bbde1c36a8d6d034602fa60fb6746332b6695";
const EXPECTED_FIXTURE_SHA256 =
  "b2a14ef563ce98a41949466b2633f1713837e93d47d09b4a5157163249047505";

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

interface RelayFixtureCase {
  name: string;
  payload: Record<string, unknown>;
  canonical_utf8: string;
  canonical_sha256_12: string;
  signature: { value: string };
}

interface RelayFixture {
  schema: string;
  dev_key: { public_key_b64: string };
  cases: RelayFixtureCase[];
}

Deno.test({
  name: "Website consumes Relay Host schema and canonical vectors unchanged",
  ignore: !RELAY_ROOT,
  fn: async () => {
    const schemaPath =
      `${RELAY_ROOT}/contracts/relay-host-license-v1.schema.json`;
    const fixturePath =
      `${RELAY_ROOT}/src/lib/licensing/__tests__/fixtures/relay-host-license-v1.json`;
    const schemaBytes = await Deno.readFile(schemaPath);
    const fixtureBytes = await Deno.readFile(fixturePath);

    assertEquals(await sha256Hex(schemaBytes), EXPECTED_SCHEMA_SHA256);
    assertEquals(await sha256Hex(fixtureBytes), EXPECTED_FIXTURE_SHA256);

    const schema = JSON.parse(new TextDecoder().decode(schemaBytes));
    assertEquals(
      schema.$defs.hostGrant.properties.schema.const,
      "orionfold.relay-host/v1",
    );
    assertEquals(
      schema.$defs.hostGrant.properties.rights.properties.packs.const,
      "separate",
    );
    assertEquals(
      schema.$defs.hostGrant.properties.rights.properties.transfer.const,
      "same-licensee-replacement",
    );
    assertEquals(
      schema.$defs.hostGrant.properties.rights.properties
        .critical_security_updates.const,
      "included",
    );

    const fixture = JSON.parse(
      new TextDecoder().decode(fixtureBytes),
    ) as RelayFixture;
    assertEquals(fixture.schema, "orionfold.relay-host-conformance/v1");
    assertEquals(fixture.cases.map((testCase) => testCase.name), [
      "pack-only",
      "host-only",
      "operator-bundle",
      "capacity-upgrade",
      "distinct-owner",
    ]);

    for (const testCase of fixture.cases) {
      assertEquals(
        canonicalize(testCase.payload),
        testCase.canonical_utf8,
        testCase.name,
      );
      assertEquals(
        await canonicalSha256_12(testCase.payload),
        testCase.canonical_sha256_12,
        testCase.name,
      );
      assert(
        await verifyLicense(
          testCase.payload,
          testCase.signature.value,
          fixture.dev_key.public_key_b64,
        ),
        `${testCase.name}: Relay signature must verify in Website`,
      );

      const payload = testCase.payload;
      const issuedTo = payload.issued_to as IssuedTo;
      const provenance = payload.provenance as LicenseProvenance;
      const base = {
        licenseId: String(payload.license_id),
        issuedTo,
        issuedAt: String(payload.issued_at),
        notBefore: String(payload.not_before),
        expiresAt: String(payload.expires_at),
        provenance,
      };

      if (testCase.name === "pack-only") {
        assertEquals(
          buildLicensePayload({
            ...base,
            product: String(payload.product),
            tier: String(payload.tier),
            entitlements: payload.entitlements as string[],
            seats: null,
          }),
          payload,
        );
        continue;
      }

      const grant =
        (payload.grants as { "product:relay-host": RelayHostGrant })[
          "product:relay-host"
        ];
      assertEquals(
        buildRelayHostLicensePayload({
          ...base,
          offer: testCase.name === "operator-bundle"
            ? "operator-bundle"
            : "host",
          hostGrant: {
            sku: grant.sku,
            licensee: grant.licensee,
            limits: grant.limits,
            updatesUntil: grant.updates_until,
          },
        }),
        payload,
        `${testCase.name}: Website builder must reproduce Relay's exact payload`,
      );
    }
  },
});
