import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { foundingFallback, getCatalogItem } from "./catalog.ts";
import {
  refundDeadline,
  WORKSHOP_EDITION_HASH,
  WORKSHOP_EDITION_ID,
  WORKSHOP_LOOKUP_KEY,
  workshopCheckoutMetadata,
  workshopCheckoutRoutes,
} from "./workshop-contract.ts";

Deno.test("workshop catalog is exact and does not use license founding fallback", () => {
  const item = getCatalogItem(WORKSHOP_LOOKUP_KEY);
  assertExists(item);
  assertEquals(item.kind, "workshop");
  assertEquals(item.mode, "payment");
  assertEquals(item.amount, 9900);
  assertEquals(foundingFallback(WORKSHOP_LOOKUP_KEY), WORKSHOP_LOOKUP_KEY);
});

Deno.test("workshop checkout metadata and routes carry immutable edition identity", () => {
  assertEquals(workshopCheckoutMetadata(), {
    lookup_key: WORKSHOP_LOOKUP_KEY,
    kind: "workshop",
    offering_id: "relay-operator-workshop",
    edition_id: WORKSHOP_EDITION_ID,
    edition_version: "2026.07",
    edition_hash: WORKSHOP_EDITION_HASH,
  });
  assertEquals(workshopCheckoutRoutes("https://orionfold.com/"), {
    successUrl:
      "https://orionfold.com/training/relay-operator-workshop/thanks/?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: "https://orionfold.com/training/relay-operator-workshop/",
  });
});

Deno.test("refund deadline is fourteen calendar days after paid timestamp", () => {
  assertEquals(
    refundDeadline(new Date("2026-07-18T20:00:00.000Z")).toISOString(),
    "2026-08-01T20:00:00.000Z",
  );
});
