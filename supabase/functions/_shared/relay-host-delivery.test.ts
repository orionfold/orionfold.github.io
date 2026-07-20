import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  relayHostDeliveryEligible,
  relayHostLifecycleStatus,
  relayHostPriceMatches,
  relayHostRequestResponse,
  shouldIssueRelayHostRenewal,
} from "./relay-host-delivery.ts";

const now = new Date("2026-07-18T00:00:00Z");

Deno.test("Relay Host re-download allows active and dunning terms only before expiry", () => {
  const base = { expires_at: "2026-07-19T00:00:00Z", refunded_at: null };
  assertEquals(
    relayHostDeliveryEligible({ ...base, status: "active" }, now),
    true,
  );
  assertEquals(
    relayHostDeliveryEligible({ ...base, status: "past_due" }, now),
    true,
  );
  assertEquals(
    relayHostDeliveryEligible({ ...base, status: "canceled" }, now),
    false,
  );
});

Deno.test("Relay Host re-download fails closed after refund or expiry", () => {
  assertEquals(
    relayHostDeliveryEligible({
      status: "active",
      expires_at: "2026-07-19T00:00:00Z",
      refunded_at: "2026-07-18T00:00:00Z",
    }, now),
    false,
  );
  assertEquals(
    relayHostDeliveryEligible({
      status: "active",
      expires_at: "2026-07-18T00:00:00Z",
      refunded_at: null,
    }, now),
    false,
  );
});

Deno.test("Relay Host request response does not enumerate a purchase", () => {
  assertEquals(relayHostRequestResponse(), {
    ok: true,
    state: "accepted",
    message:
      "If an eligible Relay Host license exists, a fresh link is on its way.",
  });
});

Deno.test("Relay Host renewal issues only for the approved annual cycle key", () => {
  assertEquals(
    shouldIssueRelayHostRenewal(
      "subscription_cycle",
      "license_relay_host_annual",
      "license_relay_host_annual",
    ),
    true,
  );
  assertEquals(
    shouldIssueRelayHostRenewal(
      "subscription_create",
      "license_relay_host_annual",
      "license_relay_host_annual",
    ),
    false,
  );
  assertEquals(
    shouldIssueRelayHostRenewal(
      "subscription_cycle",
      "license_orionfold_relay_renewal",
      "license_relay_host_annual",
    ),
    false,
  );
});

Deno.test("Relay Host lifecycle preserves active/trialing and names lapse states", () => {
  assertEquals(relayHostLifecycleStatus("active"), "active");
  assertEquals(relayHostLifecycleStatus("trialing"), "active");
  assertEquals(relayHostLifecycleStatus("past_due"), "past_due");
  assertEquals(relayHostLifecycleStatus("canceled"), "canceled");
});

Deno.test("Relay Host checkout accepts only the approved annual USD price", () => {
  const approved = {
    unit_amount: 149900,
    currency: "usd",
    type: "recurring",
    recurring: { interval: "year", interval_count: 1 },
  };
  assertEquals(relayHostPriceMatches(approved, 149900), true);
  assertEquals(relayHostPriceMatches({ ...approved, unit_amount: 1499000 }, 149900), false);
  assertEquals(relayHostPriceMatches({ ...approved, currency: "eur" }, 149900), false);
  assertEquals(relayHostPriceMatches({ ...approved, type: "one_time" }, 149900), false);
  assertEquals(
    relayHostPriceMatches({ ...approved, recurring: { interval: "month", interval_count: 1 } }, 149900),
    false,
  );
  assertEquals(
    relayHostPriceMatches({ ...approved, recurring: { interval: "year", interval_count: 2 } }, 149900),
    false,
  );
});
