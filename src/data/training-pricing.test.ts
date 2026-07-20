import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildTrainingPricing } from "./training-pricing.ts";

Deno.test("Training pricing is catalog-backed and preserves the founding contract", () => {
  const pricing = buildTrainingPricing("2026-07-19T00:00:00Z");
  const workshop = pricing.workshops[0];
  assertEquals(pricing.schema, "orionfold.training-pricing/v1");
  assertEquals(workshop.lookup_key, "workshop_relay_operator_founding");
  assertEquals(workshop.amount, 9900);
  assertEquals(workshop.mode, "payment");
  assertEquals(workshop.display, "$99 founding");
  assertEquals(workshop.account_required, false);
  assertEquals(workshop.refund_days, 14);
});
