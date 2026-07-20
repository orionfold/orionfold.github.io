import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildRelayPricing } from "./relay-pricing.ts";

Deno.test("Relay pricing keeps Packs and managed Host distinct and catalog-backed", () => {
  const pricing = buildRelayPricing("2026-07-18T00:00:00Z");
  assertEquals(pricing.schema, "orionfold.pricing/v1");
  assertEquals(pricing.prices.list.lookup_key, "license_orionfold_relay");
  assertEquals(pricing.prices.list.amount, 49900);
  assertEquals(pricing.host.price.lookup_key, "license_relay_host_annual");
  assertEquals(pricing.host.price.amount, 149900);
  assertEquals(pricing.host.price.display, "$1,499");
  assertEquals(pricing.host.price.per, "year");
  assertEquals(pricing.host.limits, { hosts: 1, managed_cells: 10 });
  assertEquals(pricing.host.purchase_url, "https://orionfold.com/relay/host/");
  assertEquals(pricing.host.packs, "separate");
  assertEquals(pricing.host.bundle_offered, false);
  assertEquals(pricing.host.refund_days, 14);
  assertEquals(pricing.host.public_cell_image.purchase_token_required, false);
});
