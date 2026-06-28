// Unit lock for the purchases-export read endpoint (offer-ladder Leg 1, the
// buyer twin of waitlist-export). Guards: row mapping (pass-through of the 8
// drained fields + delivered coercion + no metadata leak), shared-credential
// auth check (constant-time), and limit clamping. The Deno.serve handler is
// thin glue.
//
// Run: deno test supabase/functions/purchases-export/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, clampLimit, mapRow } from "./index.ts";

function authHeader(value: string): Headers {
  return new Headers({ Authorization: "Bearer " + value });
}

Deno.test("mapRow maps a purchase row to the export shape", () => {
  const out = mapRow({
    email: "buyer@example.com",
    lookup_key: "book_bundle_founding",
    amount_total: 5500,
    currency: "usd",
    stripe_session_id: "cs_test_abc123",
    created_at: "2026-06-28T10:00:00.000Z",
    delivered: true,
    delivered_at: "2026-06-28T10:00:05.000Z",
  });
  assertEquals(out, {
    email: "buyer@example.com",
    lookup_key: "book_bundle_founding",
    amount_total: 5500,
    currency: "usd",
    stripe_session_id: "cs_test_abc123",
    created_at: "2026-06-28T10:00:00.000Z",
    delivered: true,
    delivered_at: "2026-06-28T10:00:05.000Z",
  });
});

Deno.test("mapRow coerces delivered and nulls undelivered timestamp", () => {
  const out = mapRow({
    email: "x@y.com",
    lookup_key: "book_ai_native_business",
    amount_total: 2000,
    currency: "usd",
    stripe_session_id: "cs_live_xyz",
    created_at: "2026-06-28T00:00:00.000Z",
    // delivered absent (undelivered sale), delivered_at absent
  });
  assertEquals(out.delivered, false);
  assertEquals(out.delivered_at, null);
});

Deno.test("mapRow tolerates a null amount/currency", () => {
  const out = mapRow({
    email: "x@y.com",
    lookup_key: "book_ai_native_business",
    amount_total: null,
    currency: null,
    stripe_session_id: "cs_live_xyz",
    created_at: "t",
    delivered: false,
  });
  assertEquals(out.amount_total, null);
  assertEquals(out.currency, null);
});

Deno.test("mapRow never leaks extra columns", () => {
  const out = mapRow({
    email: "x@y.com",
    lookup_key: "k",
    stripe_session_id: "s",
    created_at: "t",
    delivered: false,
    stripe_customer_id: "cus_secret",
    roadmap_item: "arena",
  } as Record<string, unknown>);
  assert(!("stripe_customer_id" in out));
  assert(!("roadmap_item" in out));
});

Deno.test("authorized rejects missing and wrong creds, accepts the right one", () => {
  const fakeKey = "shared-export-fixture-value";
  assert(!authorized(new Headers(), fakeKey));
  assert(!authorized(authHeader("wrong-value"), fakeKey));
  assert(!authorized(authHeader("shared-export-fixture-valu"), fakeKey)); // length mismatch
  assert(authorized(authHeader(fakeKey), fakeKey));
});

Deno.test("authorized rejects when expected token is empty", () => {
  assert(!authorized(authHeader("anything"), ""));
});

Deno.test("clampLimit defaults to 500 and caps at 1000", () => {
  assertEquals(clampLimit(null), 500);
  assertEquals(clampLimit("50"), 50);
  assertEquals(clampLimit("99999"), 1000);
  assertEquals(clampLimit("-3"), 500);
  assertEquals(clampLimit("notanumber"), 500);
});
