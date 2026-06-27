// Unit lock for the A16 waitlist-export read endpoint. Guards: row mapping
// (confirmed bool -> double_optin string), shared-credential auth check
// (constant-time), and limit clamping. The Deno.serve handler is thin glue.
//
// Run: deno test supabase/functions/waitlist-export/index.test.ts
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { authorized, clampLimit, mapRow } from "./index.ts";

function authHeader(value: string): Headers {
  return new Headers({ Authorization: "Bearer " + value });
}

Deno.test("mapRow maps a confirmed row to the export shape", () => {
  const out = mapRow({
    email: "a@b.com",
    offer: "proof-playbook",
    consent_text: "By subscribing you agree...",
    created_at: "2026-06-27T10:00:00.000Z",
    utm_source: "orionfold",
    utm_medium: "cross-sell",
    utm_campaign: "proof-bridge",
    utm_content: "model-advisor",
    utm_term: null,
    confirmed: true,
  });
  assertEquals(out, {
    email: "a@b.com",
    offer: "proof-playbook",
    consent_text: "By subscribing you agree...",
    captured_at: "2026-06-27T10:00:00.000Z",
    utm_source: "orionfold",
    utm_medium: "cross-sell",
    utm_campaign: "proof-bridge",
    utm_content: "model-advisor",
    utm_term: null,
    double_optin: "confirmed",
  });
});

Deno.test("mapRow maps an unconfirmed row to pending", () => {
  const out = mapRow({ email: "x@y.com", confirmed: false, created_at: "2026-06-27T00:00:00.000Z" });
  assertEquals(out.double_optin, "pending");
  assertEquals(out.email, "x@y.com");
});

Deno.test("mapRow never leaks metadata", () => {
  const out = mapRow({ email: "x@y.com", confirmed: false, created_at: "t", metadata: { hidden: 1 } } as Record<string, unknown>);
  assert(!("metadata" in out));
});

Deno.test("authorized rejects missing and wrong creds, accepts the right one", () => {
  const fakeKey = "shared-export-fixture-value";
  assert(!authorized(new Headers(), fakeKey));
  assert(!authorized(authHeader("wrong-value"), fakeKey));
  assert(authorized(authHeader(fakeKey), fakeKey));
});

Deno.test("clampLimit defaults to 500 and caps at 1000", () => {
  assertEquals(clampLimit(null), 500);
  assertEquals(clampLimit("50"), 50);
  assertEquals(clampLimit("99999"), 1000);
  assertEquals(clampLimit("-3"), 500);
  assertEquals(clampLimit("notanumber"), 500);
});
