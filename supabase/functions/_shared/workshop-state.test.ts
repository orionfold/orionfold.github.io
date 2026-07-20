import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  accessStateAfterRefund,
  canExchangeAccess,
  genericRequestResponse,
  safeRefundStatus,
} from "./workshop-state.ts";

Deno.test("access remains usable while refund is pending and closes on success", () => {
  const future = new Date("2026-07-19T01:00:00Z");
  const now = new Date("2026-07-19T00:00:00Z");
  assertEquals(canExchangeAccess("active", future, now), true);
  assertEquals(canExchangeAccess("refund_pending", future, now), true);
  assertEquals(canExchangeAccess("refunded", future, now), false);
  assertEquals(canExchangeAccess("active", now, now), false);
  assertEquals(accessStateAfterRefund("pending"), "refund_pending");
  assertEquals(accessStateAfterRefund("succeeded"), "refunded");
  assertEquals(accessStateAfterRefund("failed"), "active");
  assertEquals(accessStateAfterRefund("canceled"), "active");
});

Deno.test("refund status mapping and request response are safe", () => {
  assertEquals(safeRefundStatus("succeeded"), "succeeded");
  assertEquals(safeRefundStatus("requires_action"), "pending");
  assertEquals(genericRequestResponse(), {
    ok: true,
    message: "If that inbox owns this edition, the requested link is on its way.",
  });
});
