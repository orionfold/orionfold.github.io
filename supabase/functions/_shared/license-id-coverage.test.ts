// EVERY licensed SKU must have a license-id sequence mapped. This test exists
// because its absence was a live launch bug, not a hypothetical.
//
// `stripe-webhook` maps product -> sequence explicitly and THROWS on an unmapped
// product, deliberately, so a new product cannot silently inherit Arena's ids.
// The failure mode that creates is silent in the OTHER direction: Flow shipped
// with a catalog descriptor, a deployed checkout endpoint, live Stripe prices and
// a green test suite — and no sequence. A completed purchase would have thrown at
// fulfilment, 500'd the webhook, and left the buyer polling 403 forever while
// Stripe retried, which the app correctly reads as "not yet". It looks like a
// hang, not an error.
//
// Nothing caught it because every existing test exercised a product that was
// already mapped. This walks the CATALOG instead, so adding a licensed SKU
// without a sequence fails here rather than in front of the first buyer.
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { CATALOG, licenseProductForLookupKey } from "./catalog.ts";

/** Mirrors stripe-webhook's LICENSE_ID_RPC. Kept in sync by this test's twin
 * assertion below, which fails if the webhook's copy drifts from this one. */
const LICENSE_ID_RPC: Record<string, string> = {
  "arena-field-edition": "next_fe_license_id",
  "orionfold-proof": "next_proof_license_id",
  "orionfold-relay": "next_relay_license_id",
  "orionfold-relay-host": "next_relay_host_license_id",
  "orionfold-flow": "next_flow_license_id",
};

Deno.test("every licensed catalog SKU resolves to a mapped license-id sequence", () => {
  const licensed = Object.entries(CATALOG).filter(([, item]) =>
    (item as { kind?: string }).kind === "license"
  );
  assert(licensed.length > 0, "the catalog should contain licensed SKUs");

  const unmapped: string[] = [];
  for (const [lookupKey] of licensed) {
    const descriptor = licenseProductForLookupKey(lookupKey);
    assert(descriptor, `${lookupKey} is kind:"license" but resolves to no descriptor`);
    if (!LICENSE_ID_RPC[descriptor.product]) {
      unmapped.push(`${lookupKey} -> product "${descriptor.product}"`);
    }
  }
  assert(
    unmapped.length === 0,
    "these licensed SKUs would THROW at fulfilment with no license-id sequence:\n  " +
      unmapped.join("\n  ") +
      "\nAdd a next_<product>_license_id migration and map it in stripe-webhook " +
      "AND admin-issue-license.",
  );
});

Deno.test("the webhook's own map matches this one, so the guard cannot go stale", async () => {
  const src = await Deno.readTextFile(
    new URL("../stripe-webhook/index.ts", import.meta.url),
  );
  for (const [product, rpc] of Object.entries(LICENSE_ID_RPC)) {
    assert(
      new RegExp(`"${product}":\\s*"${rpc}"`).test(src),
      `stripe-webhook is missing the ${product} -> ${rpc} mapping this guard asserts`,
    );
  }
});

Deno.test("admin-issue-license can hand-issue every licensed product", async () => {
  const src = await Deno.readTextFile(
    new URL("../admin-issue-license/index.ts", import.meta.url),
  );
  for (const [product, rpc] of Object.entries(LICENSE_ID_RPC)) {
    // relay-host is fulfilled only through the Stripe path (it carries host
    // identity a hand-issue has no source for), so it is legitimately absent.
    if (product === "orionfold-relay-host") continue;
    assert(
      new RegExp(`"${product}":\\s*"${rpc}"`).test(src),
      `admin-issue-license cannot mint ${product}: no ${rpc} mapping`,
    );
  }
});
